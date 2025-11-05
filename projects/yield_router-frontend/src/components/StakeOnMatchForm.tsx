import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
// import { StakeMarketContractClient } from "../contracts/StakeMarketContract";

export default function StakeOnMatchForm() {
  const [matchId, setMatchId] = useState("");
  const [predictedWinner, setPredictedWinner] = useState("");
  const [amount, setAmount] = useState("");
  const { activeAddress, transactionSigner } = useWallet();

  const handleStakeOnMatch = async () => {
    if (!matchId || !predictedWinner || !amount) return alert("Fill all fields");
    try {
      // Placeholder: Stake on match
      // const client = new StakeMarketContractClient(...);
      // await client.send.stakeOnMatch({ args: { matchId, predictedWinner, staker: activeAddress!, amount: Number(amount) } });
      alert("Staked on match successfully!");
      setMatchId("");
      setPredictedWinner("");
      setAmount("");
    } catch (err) {
      console.error(err);
      alert("Error staking on match");
    }
  };

  return (
    <div className="card">
      <h2>Stake on Match</h2>
      <input type="text" placeholder="Match ID" value={matchId} onChange={(e) => setMatchId(e.target.value)} />
      <input
        type="text"
        placeholder="Predicted Winner Address"
        value={predictedWinner}
        onChange={(e) => setPredictedWinner(e.target.value)}
      />
      <input type="number" placeholder="Stake Amount (Stake Credits)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button className="btn btn-indigo" onClick={handleStakeOnMatch}>
        Stake Now
      </button>
    </div>
  );
}
