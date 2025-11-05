from algopy import ARC4Contract, LocalState, BoxMap, UInt64, String, Account, arc4, gtxn

class LeaderboardContract(ARC4Contract):
    def __init__(self) -> None:
        # BoxMap for player stats (key: player, value: (total_wins, total_yield_earned, total_games))
        self.player_stats = BoxMap(Account, tuple[UInt64, UInt64, UInt64], key_prefix="stats_")
        # BoxMap for staker stats (key: staker, value: (total_stakes, successful_stakes, total_roi))
        self.staker_stats = BoxMap(Account, tuple[UInt64, UInt64, UInt64], key_prefix="staker_")

    @arc4.abimethod
    def update_player_stats(self, player: Account, wins: UInt64, yield_earned: UInt64, games: UInt64) -> None:
        current_wins, current_yield, current_games = self.player_stats.get(player, default=(UInt64(0), UInt64(0), UInt64(0)))
        self.player_stats[player] = (current_wins + wins, current_yield + yield_earned, current_games + games)

    @arc4.abimethod
    def update_staker_stats(self, staker: Account, stakes: UInt64, successful_stakes: UInt64, roi: UInt64) -> None:
        current_stakes, current_success, current_roi = self.staker_stats.get(staker, default=(UInt64(0), UInt64(0), UInt64(0)))
        self.staker_stats[staker] = (current_stakes + stakes, current_success + successful_stakes, current_roi + roi)

    @arc4.abimethod
    def get_player_stats(self, player: Account) -> tuple[UInt64, UInt64, UInt64]:
        return self.player_stats.get(player, default=(UInt64(0), UInt64(0), UInt64(0)))

    @arc4.abimethod
    def get_staker_stats(self, staker: Account) -> tuple[UInt64, UInt64, UInt64]:
        return self.staker_stats.get(staker, default=(UInt64(0), UInt64(0), UInt64(0)))

    @arc4.abimethod
    def get_top_players(self, limit: UInt64) -> list[tuple[Account, UInt64, UInt64, UInt64]]:
        # Placeholder: In practice, would need to iterate and sort
        # For now, return empty list
        return []
