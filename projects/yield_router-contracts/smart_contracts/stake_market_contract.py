from algopy import ARC4Contract, LocalState, BoxMap, UInt64, String, Account, arc4, gtxn

class StakeMarketContract(ARC4Contract):
    def __init__(self) -> None:
        # BoxMap for stakes on matches (key: match_id_player, value: stake_amount)
        self.match_stakes = BoxMap(String, UInt64, key_prefix="stake_")
        # BoxMap for total stakes per match (key: match_id, value: (total_player1_stakes, total_player2_stakes))
        self.total_match_stakes = BoxMap(String, tuple[UInt64, UInt64], key_prefix="total_")
        # BoxMap for staker credits (key: staker, value: credits)
        self.staker_credits = BoxMap(Account, UInt64, key_prefix="staker_")

    @arc4.abimethod
    def stake_on_match(
        self,
        payment: gtxn.PaymentTransaction,
        match_id: String,
        predicted_winner: Account,
        staker: Account,
        amount: UInt64
    ) -> None:
        assert payment.receiver == self.address, "Payment must go to contract"
        assert payment.amount == amount, "Payment amount must match stake amount"
        assert amount > UInt64(0), "Stake amount must be greater than zero"

        key = match_id + "_" + predicted_winner.to_string()
        self.match_stakes[key] = self.match_stakes.get(key, default=UInt64(0)) + amount

        # Update totals
        total_key = match_id
        total_player1, total_player2 = self.total_match_stakes.get(total_key, default=(UInt64(0), UInt64(0)))
        if predicted_winner == Account("player1_placeholder"):  # Need to pass actual player addresses
            total_player1 += amount
        else:
            total_player2 += amount
        self.total_match_stakes[total_key] = (total_player1, total_player2)

    @arc4.abimethod
    def resolve_stakes(self, match_id: String, actual_winner: Account) -> None:
        total_player1, total_player2 = self.total_match_stakes.get(match_id, default=(UInt64(0), UInt64(0)))
        total_stakes = total_player1 + total_player2
        if total_stakes == UInt64(0):
            return

        winning_stakes = total_player1 if actual_winner == Account("player1_placeholder") else total_player2
        if winning_stakes == UInt64(0):
            return

        # Distribute proportionally to winning stakers
        # For simplicity, assume even distribution; in reality, iterate over stakers
        # This is a placeholder; full implementation would require listing stakers
        pass  # TODO: Implement stake distribution

    @arc4.abimethod
    def get_total_stakes(self, match_id: String) -> tuple[UInt64, UInt64]:
        return self.total_match_stakes.get(match_id, default=(UInt64(0), UInt64(0)))

    @arc4.abimethod
    def get_staker_credits(self, staker: Account) -> UInt64:
        return self.staker_credits.get(staker, default=UInt64(0))
