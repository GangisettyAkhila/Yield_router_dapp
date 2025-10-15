from algopy import ARC4Contract, LocalState, BoxMap, UInt64, String, Account, arc4, gtxn

class YieldRouterContract(ARC4Contract):
    def __init__(self) -> None:
        # Local state per user
        self.staked_amount = LocalState(UInt64, key="staked_amt")
        self.staking_timestamp = LocalState(UInt64, key="stake_time")
        self.last_platform = LocalState(String, key="platform")
        self.total_stake_count = LocalState(UInt64, key="stake_count")  # track user loyalty

        # BoxMap for platform APYs (key: platform name, value: APY)
        self.platform_apys = BoxMap(String, UInt64, key_prefix="apy_")

        # List of supported platforms (for iteration)
        self.platform_list = (
    String("Algo5"),
    String("Tinyman"),
    String("Messina"),
    String("FolksFinance")
)

    @arc4.abimethod
    def stake(
        self,
        payment: gtxn.PaymentTransaction,  # Require a payment txn in the group
        contract_address: Account,         # Pass the contract address as a parameter
        for_account: Account,
        amount: UInt64,
        timestamp: UInt64,
        platform: String
    ) -> None:
        assert payment.receiver == contract_address, "Payment must go to contract"
        assert payment.amount == amount, "Payment amount must match stake amount"
        assert amount > UInt64(0), "Staking amount must be greater than zero"

        previous = self.staked_amount.get(for_account, default=UInt64(0))
        self.staked_amount[for_account] = previous + amount
        self.staking_timestamp[for_account] = timestamp
        self.last_platform[for_account] = platform
        self.total_stake_count[for_account] = self.total_stake_count.get(for_account, default=UInt64(0)) + UInt64(1)

    @arc4.abimethod
    def unstake(self, for_account: Account, amount: UInt64, timestamp: UInt64) -> None:
        assert amount > UInt64(0), "Unstaking amount must be greater than zero"
        prev = self.staked_amount.get(for_account, default=UInt64(0))
        assert amount <= prev, "Cannot unstake more than currently staked"
        self.staked_amount[for_account] = prev - amount
        self.staking_timestamp[for_account] = timestamp

    @arc4.abimethod
    def update_platform_apy(self, platform: String, apy: UInt64) -> None:
        # Ideally, this should be restricted to admin
        self.platform_apys[platform] = apy

    @arc4.abimethod
    def get_user_tracking(self, for_account: Account) -> tuple[UInt64, UInt64, String, UInt64]:
        return (
            self.staked_amount.get(for_account, default=UInt64(0)),
            self.staking_timestamp.get(for_account, default=UInt64(0)),
            self.last_platform.get(for_account, default=String("")),
            self.total_stake_count.get(for_account, default=UInt64(0)),
        )

    @arc4.abimethod
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

    @arc4.abimethod
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