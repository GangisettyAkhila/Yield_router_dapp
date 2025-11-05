import { useState, useEffect } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
// import { GameMatchContractClient } from "../contracts/GameMatchContract";

interface Match {
  id: string;
  player1: string;
  player2: string;
  entryFee: number;
  status: string;
  winner: string;
}

export default function MatchList() {
  const { activeAddress, transactionSigner } = useWallet();
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      // Placeholder: Fetch matches from contract
      // const client = new GameMatchContractClient(...);
      // const matchList = await client.send.getAllMatches();
      // setMatches(matchList.return.map(m => ({ ...m })));
    };
    fetchMatches();
  }, [activeAddress, transactionSigner]);

  const handleJoinMatch = async (matchId: string) => {
    try {
      // Placeholder: Join match
      // const client = new GameMatchContractClient(...);
      // await client.send.joinMatch({ args: { matchId, player: activeAddress! } });
      alert("Joined match successfully!");
    } catch (err) {
      console.error(err);
      alert("Error joining match");
    }
  };

  return (
    <div className="card">
      <h2>Available Matches</h2>
      <ul className="space-y-2">
        {matches.map((match) => (
          <li key={match.id} className="flex justify-between items-center">
            <div>
              <p>ID: {match.id}</p>
              <p>Fee: {match.entryFee} Credits</p>
              <p>Status: {match.status}</p>
            </div>
            {match.status === "open" && (
              <button className="btn-cricket btn-glow" onClick={() => handleJoinMatch(match.id)}>
                Join
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
