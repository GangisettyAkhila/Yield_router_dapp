from algopy import ARC4Contract, GlobalState, Account, Txn, BoxMap, arc4, itxn, subroutine, gtxn, Global

class MatchData(arc4.Struct):
    # status: 0 = CREATED, 1 = LIVE, 2 = COMPLETED, 3 = CANCELLED
    match_id: arc4.String
    status: arc4.UInt64
    metadata: arc4.String
    winner_side: arc4.UInt64
    total_stake_side_0: arc4.UInt64
    total_stake_side_1: arc4.UInt64


class StakeData(arc4.Struct):
    staker: arc4.Address
    match_id: arc4.String
    side: arc4.UInt64       # 0 or 1
    amount: arc4.UInt64     # staked amount
    claimed: arc4.Bool
    refunded: arc4.Bool


class MatchContract(ARC4Contract):
    def __init__(self) -> None:
        # Admin and oracle addresses in global state
        self.admin = GlobalState(Account)
        self.oracle = GlobalState(Account)

        # Pause flag
        self.paused = GlobalState(arc4.Bool)

        # Matches stored by match_id
        self.matches = BoxMap(arc4.String, MatchData, key_prefix="matches")

        # Stakes stored by composite key "match_id|staker"
        self.stakes = BoxMap(arc4.String, StakeData, key_prefix="stakes")

    # ------------- internal helpers -------------

    @subroutine
    def _is_admin(self) -> bool:
        return Txn.sender == self.admin.value

    @subroutine
    def _is_oracle(self) -> bool:
        return Txn.sender == self.oracle.value

    @subroutine
    def _require_admin(self) -> None:
        assert self._is_admin(), "Only admin"

    @subroutine
    def _require_admin_or_oracle(self) -> None:
        assert self._is_admin() or self._is_oracle(), "Only admin/oracle"

    @subroutine
    def _require_not_paused(self) -> None:
        assert not self.paused.value.native, "Paused"

    @subroutine
    def _stake_key(self, match_id: arc4.String, staker: Account) -> arc4.String:
        """
        Build a composite key like "matchId|<address-bytes>".
        """
        return arc4.String(match_id.bytes + b"|" + staker.bytes)

    # ------------- admin & config -------------

    @arc4.abimethod(allow_actions=["NoOp"])
    def set_admin(self, admin_address: Account) -> None:
        """
        Set admin once on deployment.
        If already set, only current admin can change it.
        """
        if self.admin.value == Account():
            self.admin.value = admin_address
        else:
            assert Txn.sender == self.admin.value, "Only current admin"
            self.admin.value = admin_address

        # Default paused = False on first setup
        if not self.paused.value.native:
            self.paused.value = arc4.Bool(False)

    @arc4.abimethod
    def set_oracle(self, oracle_address: Account) -> None:
        self._require_admin()
        self.oracle.value = oracle_address

    @arc4.abimethod
    def pause(self) -> None:
        self._require_admin()
        self.paused.value = arc4.Bool(True)

    @arc4.abimethod
    def unpause(self) -> None:
        self._require_admin()
        self.paused.value = arc4.Bool(False)

    # ------------- match lifecycle -------------

    @arc4.abimethod
    def create_match(self, match_id: arc4.String, metadata: arc4.String) -> None:
        """
        Create a new match with status = CREATED.
        """
        self._require_admin()

        assert match_id not in self.matches, "Match exists"

        new_match = MatchData(
            match_id=match_id,
            status=arc4.UInt64(0),          # CREATED
            metadata=metadata,
            winner_side=arc4.UInt64(0),
            total_stake_side_0=arc4.UInt64(0),
            total_stake_side_1=arc4.UInt64(0),
        )
        self.matches[match_id] = new_match.copy()

    @arc4.abimethod
    def start_match(self, match_id: arc4.String) -> None:
        """
        Move match from CREATED → LIVE (no more new bets after LIVE).
        """
        self._require_admin()
        assert match_id in self.matches, "No match"

        match = self.matches[match_id]
        assert match.status == arc4.UInt64(0), "Must be CREATED"

        match.status = arc4.UInt64(1)  # LIVE
        self.matches[match_id] = match.copy()

    @arc4.abimethod
    def cancel_match(self, match_id: arc4.String) -> None:
        """
        Cancel a match (allows users to refund).
        """
        self._require_admin()
        assert match_id in self.matches, "No match"

        match = self.matches[match_id]
        # Can't cancel completed or already cancelled
        assert match.status != arc4.UInt64(2), "Already completed"
        assert match.status != arc4.UInt64(3), "Already cancelled"

        match.status = arc4.UInt64(3)  # CANCELLED
        self.matches[match_id] = match.copy()

    # ------------- staking -------------

    @arc4.abimethod
    def stake(
        self,
        match_id: arc4.String,
        side: arc4.UInt64,
        payment: gtxn.PaymentTransaction,
    ) -> None:
        """
        Stake ALGOs on a given match & side.
        Requires a payment transaction in the group.
        """
        self._require_not_paused()

        assert match_id in self.matches, "No match"
        match = self.matches[match_id]

        # Only allow staking when CREATED, not LIVE/COMPLETED/CANCELLED
        assert match.status == arc4.UInt64(0), "Staking closed"

        # Only two sides: 0 or 1 (team A / team B)
        assert side == arc4.UInt64(0) or side == arc4.UInt64(1), "Invalid side"

        # Verify payment transaction
        assert payment.receiver == Global.current_application_address, "Payment must be to contract"
        assert payment.amount > 0, "Stake amount must be positive"

        sender = Txn.sender
        key = self._stake_key(match_id, sender)

        # For simplicity, only one stake per user per match
        assert key not in self.stakes, "Already staked"

        # Create stake
        stake = StakeData(
            staker=arc4.Address(sender),
            match_id=match_id,
            side=side,
            amount=arc4.UInt64(payment.amount),
            claimed=arc4.Bool(False),
            refunded=arc4.Bool(False),
        )
        self.stakes[key] = stake.copy()

        # Update total pool for that side
        if side == arc4.UInt64(0):
            match.total_stake_side_0 = match.total_stake_side_0 + arc4.UInt64(payment.amount)
        else:
            match.total_stake_side_1 = match.total_stake_side_1 + arc4.UInt64(payment.amount)

        self.matches[match_id] = match.copy()

    # ------------- results & payouts -------------

    @arc4.abimethod
    def set_result(self, match_id: arc4.String, winner_side: arc4.UInt64) -> None:
        """
        Set match result. Winner side is 0 or 1.
        """
        self._require_admin_or_oracle()

        assert match_id in self.matches, "No match"
        match = self.matches[match_id]

        # Must be LIVE to set result
        assert match.status == arc4.UInt64(1), "Must be LIVE"

        assert winner_side == arc4.UInt64(0) or winner_side == arc4.UInt64(1), "Invalid side"

        match.winner_side = winner_side
        match.status = arc4.UInt64(2)  # COMPLETED
        self.matches[match_id] = match.copy()

    @subroutine
    def _compute_reward(
        self,
        match: MatchData,
        stake: StakeData,
    ) -> arc4.UInt64:
        """
        reward = stake.amount + stake.amount/totalWinner * totalLoser
        If no winners, you can choose behavior. Here: if winner pool is 0, no one gets extra.
        """
        # If the user didn't bet on the winner, reward is zero
        if stake.side != match.winner_side:
            return arc4.UInt64(0)

        if match.winner_side == arc4.UInt64(0):
            total_winner = match.total_stake_side_0
            total_loser = match.total_stake_side_1
        else:
            total_winner = match.total_stake_side_1
            total_loser = match.total_stake_side_0

        # Edge case: no winner pool
        if total_winner == arc4.UInt64(0):
            # Just return original amount
            return stake.amount

        proportional = (stake.amount * total_loser) / total_winner
        return stake.amount + proportional

    @arc4.abimethod
    def claim(self, match_id: arc4.String) -> None:
        """
        Claim reward for a COMPLETED match.
        Only winners can claim, one time.
        """
        assert match_id in self.matches, "No match"
        match = self.matches[match_id]
        assert match.status == arc4.UInt64(2), "Not COMPLETED"

        sender = Txn.sender
        key = self._stake_key(match_id, sender)

        assert key in self.stakes, "No stake"
        stake = self.stakes[key]

        # Must not be refunded or claimed
        assert not stake.refunded.native, "Already refunded"
        assert not stake.claimed.native, "Already claimed"

        reward = self._compute_reward(match, stake)
        assert reward > arc4.UInt64(0), "No reward"

        # Mark claimed before transfer
        stake.claimed = arc4.Bool(True)
        self.stakes[key] = stake.copy()

        # Payout
        itxn.Payment(
            receiver=sender,
            amount=reward.native,
            fee=0,
        ).submit()

    @arc4.abimethod
    def refund(self, match_id: arc4.String) -> None:
        """
        Refund original stake for CANCELLED matches.
        """
        assert match_id in self.matches, "No match"
        match = self.matches[match_id]
        assert match.status == arc4.UInt64(3), "Not CANCELLED"

        sender = Txn.sender
        key = self._stake_key(match_id, sender)

        assert key in self.stakes, "No stake"
        stake = self.stakes[key]

        # Only if not already refunded and not claime