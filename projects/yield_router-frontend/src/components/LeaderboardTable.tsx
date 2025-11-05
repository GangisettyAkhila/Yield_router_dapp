import { useState, useEffect } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
// import { LeaderboardContractClient } from "../contracts/LeaderboardContract";

interface PlayerStats {
  address: string;
  wins: number;
  yieldEarned: number;
  games: number;
}

export default function LeaderboardTable() {
  const { activeAddress, transactionSigner } = useWallet();
  const [players, setPlayers] = useState<PlayerStats[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Placeholder: Fetch leaderboard from contract
      // const client = new LeaderboardContractClient(...);
      // const topPlayers = await client.send.getTopPlayers({ args: { limit: 10 } });
      // setPlayers(topPlayers.return.map(p => ({ ...p })));
    };
    fetchLeaderboard();
  }, [activeAddress, transactionSigner]);

  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Address</th>
            <th>Wins</th>
            <th>Yield Earned</th>
            <th>Games Played</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.address}>
              <td>{player.address}</td>
              <td>{player.wins}</td>
              <td>{player.yieldEarned}</td>
              <td>{player.games}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
