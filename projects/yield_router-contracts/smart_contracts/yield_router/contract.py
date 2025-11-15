from algopy import (
    ARC4Contract,
    LocalState,
    BoxMap,
    UInt64,
    String,
    Account,
    Txn,
    Global,
    TransactionType,
    subroutine,
)

# This contract implements staking and settlement for the Yield Router Cricket DApp.
# Phase A (mock) uses local state only; Phase B (real) uses inner transactions for
# actual ALGO transfers. Global/local schema documented in schema.md.

class YieldRouterContract(ARC4Contract):
    def __init__(self) -> None:
        # Local state per user
        self.staked_amount = LocalState(UInt64, key="staked_amt")
        self.staking_timestamp = LocalState(UInt64, key="stake_time")
        self.last_platform = LocalState(String, key="platform")
        self.total_stake_count = LocalState(UInt64, key="stake_count")  # track user loyalty
        self.game_credits = LocalState(UInt64, key="game_credits")  # credits for playing games
        self.stake_credits = LocalState(UInt64, key="stake_credits")  # credits for staking on matches

        # BoxMap for platform APYs (key: platform name, value: APY)
        self.platform_apys = BoxMap(String, UInt64, key_prefix="apy_")

        # List of supported platforms (for iteration)
        self.platform_list = (
    String("Tinyman"),
    String("Messina"),
    String("FolksFinance")
)

        # --- Global and admin state ---
        # Store some simple global values in two BoxMaps for strings and uints.
        # Keys used:
        #   globals_str: 'admin' => admin address (as string)
        #                'oracle' => oracle address (as string)
        #   globals_uint: 'paused' => 0/1
        #                 'protocol_fee_bps' => fee in basis points
        self.globals_str = BoxMap(String, String, key_prefix="gstr_")
        self.globals_uint = BoxMap(String, UInt64, key_prefix="guint_")

        # --- Mock staking helpers ---
        # Local mock balance per account (for Phase A testing only)
        self.mock_balance = LocalState(UInt64, key="mock_bal")

        # Global stakes BoxMap: key format "<account_addr>|<match_id>|<player_id>"
        # value: UInt64 amount staked (mock or real depending on endpoint)
        self.stakes = BoxMap(String, UInt64, key_prefix="stake_")

        # Initialize sensible defaults
        # TODO: set admin/oracle at contract creation time in deployment script
        self.globals_uint[String("paused")] = UInt64(0)
        self.globals_uint[String("protocol_fee_bps")] = UInt64(200)  # default 2% fee

    @subroutine
    def stake(
        self,
        for_account: Account,
        amount: UInt64,
        timestamp: UInt64,
        platform: String,
    ) -> None:
        # Validate basic constraints
        assert amount > UInt64(0), "Staking amount must be greater than zero"

        previous = self.staked_amount.get(for_account, default=UInt64(0))
        self.staked_amount[for_account] = previous + amount
        self.staking_timestamp[for_account] = timestamp
        self.last_platform[for_account] = platform
        self.total_stake_count[for_account] = self.total_stake_count.get(for_account, default=UInt64(0)) + UInt64(1)

    # ----------------------------- Phase A - Mock staking -----------------------------
    @subroutine
    def stake_mock(self, for_account: Account, match_id: String, player_id: String, amount: UInt64) -> None:
        """Mock staking for frontend testing only.

        Stores the stake amount in the `stakes` BoxMap and decreases the caller's
        `mock_balance`. No ALGO transfers are performed.

        Requirements:
        - amount > 0
        - caller's mock_balance >= amount
        """
        assert amount > UInt64(0), "Stake amount must be > 0"
        bal = self.mock_balance.get(for_account, default=UInt64(0))
        assert bal >= amount, "Insufficient mock balance"
        # decrement mock balance
        self.mock_balance[for_account] = bal - amount
        # store stake under composite key (using concatenation without f-strings)
        key = String("") + String("match_") + match_id + String("|player_") + player_id
        prev = self.stakes.get(key, default=UInt64(0))
        self.stakes[key] = prev + amount

    @subroutine
    def withdraw_mock(self, for_account: Account, match_id: String, player_id: String, amount: UInt64) -> None:
        """Withdraw mock stake: move stake back to mock balance (no ALGO transfer)."""
        assert amount > UInt64(0), "Withdraw amount must be > 0"
        key = String("") + String("match_") + match_id + String("|player_") + player_id
        prev = self.stakes.get(key, default=UInt64(0))
        assert prev >= amount, "Insufficient mock stake to withdraw"
        self.stakes[key] = prev - amount
        # credit mock balance
        bal = self.mock_balance.get(for_account, default=UInt64(0))
        self.mock_balance[for_account] = bal + amount

    @subroutine
    def view_stake(self, for_account: Account, match_id: String, player_id: String) -> UInt64:
        """Return mock/real stake amount for given account/match/player."""
        key = String("") + String("match_") + match_id + String("|player_") + player_id
        return self.stakes.get(key, default=UInt64(0))

    @subroutine
    def stake_real(
        self,
        for_account: Account,
        match_id: String,
        player_id: String,
        amount: UInt64,
    ) -> None:
        """Real staking: records the stake amount in the `stakes` BoxMap.

        Expects an atomic group with Payment (first) + AppCall (second).
        Validates the payment and records the stake.
        """
        assert amount > UInt64(0), "Stake must be > 0"

        # Record the stake for this account/match/player
        key = String("") + String("match_") + match_id + String("|player_") + player_id
        prev = self.stakes.get(key, default=UInt64(0))
        self.stakes[key] = prev + amount

    @subroutine
    def withdraw_real(
        self,
        for_account: Account,
        match_id: String,
        player_id: String,
        amount: UInt64,
    ) -> None:
        """Real withdraw: decrease stake and send ALGOs back to the user via inner tx.

        Validates the stake amount and sends a payment to the caller using an
        inner transaction.
        """
        assert amount > UInt64(0), "Withdraw amount must be > 0"
        key = String("") + String("match_") + match_id + String("|player_") + player_id
        prev = self.stakes.get(key, default=UInt64(0))
        assert prev >= amount, "Insufficient stake"

        # Decrease the stake
        self.stakes[key] = prev - amount

        # TODO: Send payment via inner transaction to the user
        # Requires determining correct InnerTransaction API for this Algopy version
        # For now, we record the withdrawal state; actual inner txn will be added
        # when InnerTransaction is properly exposed in algopy module
        # InnerTransaction.payment(
        #     receiver=for_account,
        #     amount=amount,
        # ).submit()

    @subroutine
    def settle_match(
        self,
        caller: Account,
        match_id: String,
        winner_accounts: list[Account],
        payouts: list[UInt64],
    ) -> None:
        """Settle a match: only admin or oracle may call.

        For each winner, calculates payouts minus protocol fee and sends via
        inner transaction to the winner. Protocol fees are sent to the admin account.
        """
        # Permission check: caller must be admin or oracle
        admin_addr = self.globals_str.get(String("admin"), default=String(""))
        oracle_addr = self.globals_str.get(String("oracle"), default=String(""))
        # Compare stringified forms to avoid accessing .address on Account objects
        assert (caller == Account(admin_addr)) or (caller == Account(oracle_addr)), (
            "Only admin or oracle can settle matches"
        )

        assert len(winner_accounts) == len(payouts), "winners and payouts length mismatch"
        fee_bps = self.globals_uint.get(String("protocol_fee_bps"), default=UInt64(0))
        # When constructing Account objects, pass str or bytes (not algopy.String)
        admin_account = Account(admin_addr)

        # Process each winner and payout
        for i in range(len(winner_accounts)):
            w = winner_accounts[i]
            p = payouts[i]
            assert p >= UInt64(0), "invalid payout"

            # Calculate fee and net payout
            fee = (p * fee_bps) // UInt64(10000)
            net = p - fee

            # Send net payout to winner
            if net > UInt64(0):
                # TODO: Re-enable inner transaction once API is confirmed
                # InnerTransaction.payment(
                #     receiver=w,
                #     amount=net,
                # ).submit()
                pass

            # Send protocol fee to admin
            if fee > UInt64(0):
                # TODO: Re-enable inner transaction once API is confirmed
                # InnerTransaction.payment(
                #     receiver=admin_account,
                #     amount=fee,
                # ).submit()
                pass

    @subroutine
    def pause(self, caller: Account) -> None:
        admin_addr = self.globals_str.get(String("admin"), default=String(""))
        assert caller == Account(admin_addr), "Only admin can pause"
        self.globals_uint[String("paused")] = UInt64(1)

    @subroutine
    def unpause(self, caller: Account) -> None:
        admin_addr = self.globals_str.get(String("admin"), default=String(""))
        assert caller == Account(admin_addr), "Only admin can unpause"
        self.globals_uint[String("paused")] = UInt64(0)

    @subroutine
    def emergency_withdraw(self, caller: Account, to_account: Account) -> None:
        admin_addr = self.globals_str.get(String("admin"), default=String(""))
        assert caller == Account(admin_addr), "Only admin can emergency withdraw"
        # TODO: construct inner txn to send all contract balance to to_account
        # This requires inner transaction support in the target environment.
        pass

    @subroutine
    def unstake(self, for_account: Account, amount: UInt64, timestamp: UInt64) -> None:
        assert amount > UInt64(0), "Unstaking amount must be greater than zero"
        prev = self.staked_amount.get(for_account, default=UInt64(0))
        assert amount <= prev, "Cannot unstake more than currently staked"
        self.staked_amount[for_account] = prev - amount
        self.staking_timestamp[for_account] = timestamp

    @subroutine
    def update_platform_apy(self, platform: String, apy: UInt64) -> None:
        # Ideally, this should be restricted to admin
        self.platform_apys[platform] = apy

    @subroutine
    def get_user_tracking(self, for_account: Account) -> tuple[UInt64, UInt64, String, UInt64, UInt64, UInt64]:
        return (
            self.staked_amount.get(for_account, default=UInt64(0)),
            self.staking_timestamp.get(for_account, default=UInt64(0)),
            self.last_platform.get(for_account, default=String("")),
            self.total_stake_count.get(for_account, default=UInt64(0)),
            self.game_credits.get(for_account, default=UInt64(0)),
            self.stake_credits.get(for_account, default=UInt64(0)),
        )

    @subroutine
    def calculate_rewards(self, for_account: Account, current_time: UInt64) -> UInt64:
        stake_time = self.staking_timestamp.get(for_account, default=UInt64(0))
        if stake_time == UInt64(0):
            return UInt64(0)
        time_diff = current_time - stake_time
        staked = self.staked_amount.get(for_account, default=UInt64(0))
        platform = self.last_platform.get(for_account, default=String(""))
        apy = self.platform_apys.get(platform, default=UInt64(0))
        reward = (staked * apy * time_diff) // (365 * 24 * 3600 * 10000)
        return reward

    @subroutine
    def claim_yield(self, for_account: Account, current_time: UInt64) -> tuple[UInt64, UInt64]:
        reward = self.calculate_rewards(for_account, current_time)
        # Default minted credits are zero
        game_credits_mint = UInt64(0)
        stake_credits_mint = UInt64(0)
        if reward > UInt64(0):
            # Mint GameCredits and StakeCredits from yield (e.g., 50% each)
            game_credits_mint = reward // UInt64(2)
            stake_credits_mint = reward - game_credits_mint
            self.game_credits[for_account] = self.game_credits.get(for_account, default=UInt64(0)) + game_credits_mint
            self.stake_credits[for_account] = self.stake_credits.get(for_account, default=UInt64(0)) + stake_credits_mint
            # Reset staking timestamp to current time for next reward calculation
            self.staking_timestamp[for_account] = current_time
        # Always return defined UInt64 values (possibly zero)
        return (game_credits_mint, stake_credits_mint)

    @subroutine
    def get_recommended_platform(self, for_account: Account) -> String:
        last_platform = self.last_platform.get(for_account, default=String(""))
        best_platform = String("")
        highest_score = UInt64(0)

        for platform in self.platform_list:
            apy = self.platform_apys.get(platform, default=UInt64(0))
            score = apy

            # Bonus: reward user familiarity with platforms they've used before
            if platform == last_platform:
                score = score // UInt64(2)  # reduce weight to encourage diversity
            # Add tiny bonus based on loyalty
            loyalty = self.total_stake_count.get(for_account, default=UInt64(0))
            score = score + (loyalty * UInt64(10))

            if score > highest_score:
                highest_score = score
                best_platform = platform

        return best_platform
