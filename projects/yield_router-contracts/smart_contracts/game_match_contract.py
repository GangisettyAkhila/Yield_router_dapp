from algopy import ARC4Contract, LocalState, BoxMap, UInt64, String, Account, arc4, gtxn

class GameMatchContract(ARC4Contract):
    def __init__(self) -> None:
        # BoxMap for matches (key: match_id, value: (player1, player2, entry_fee, status, winner))
        self.matches = BoxMap(String, tuple[Account, Account, UInt64, String, Account], key_prefix="match_")
        # BoxMap for player game credits (key: player, value: credits)
        self.player_credits = BoxMap(Account, UInt64, key_prefix="credits_")

    @arc4.abimethod
    def create_match(self, match_id: String, entry_fee: UInt64, creator: Account) -> None:
        # Assume credits are transferred from YieldRouterContract
        assert entry_fee > UInt64(0), "Entry fee must be greater than zero"
        self.matches[match_id] = (creator, Account(""), entry_fee, String("open"), Account(""))

    @arc4.abimethod
    def join_match(self, match_id: String, player: Account) -> None:
        match = self.matches.get(match_id)
        assert match is not None, "Match does not exist"
        player1, player2, entry_fee, status, winner = match
        assert status == String("open"), "Match is not open"
        assert player2 == Account(""), "Match is full"
        assert player != player1, "Cannot join your own match"
        self.matches[match_id] = (player1, player, entry_fee, String("ready"), winner)

    @arc4.abimethod
    def submit_result(self, match_id: String, winner: Account, submitter: Account) -> None:
        match = self.matches.get(match_id)
        assert match is not None, "Match does not exist"
        player1, player2, entry_fee, status, _ = match
        assert status == String("ready"), "Match is not ready"
        assert submitter == player1 or submitter == player2, "Only players can submit result"
        assert winner == player1 or winner == player2, "Winner must be a player"
        self.matches[match_id] = (player1, player2, entry_fee, String("finished"), winner)
        # Payout: winner gets both entry fees
        self.player_credits[winner] = self.player_credits.get(winner, default=UInt64(0)) + (entry_fee * UInt64(2))

    @arc4.abimethod
    def get_match(self, match_id: String) -> tuple[Account, Account, UInt64, String, Account]:
        match = self.matches.get(match_id)
        assert match is not None, "Match does not exist"
        return match

    @arc4.abimethod
    def get_player_credits(self, player: Account) -> UInt64:
        return self.player_credits.get(player, default=UInt64(0))
