import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { stakeAlgo } from "../components/AppCalls";

export default function StakeForm() {
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("");
  const { activeAddress, transactionSigner } = useWallet();

  const handleStake = async () => {
    if (!amount || !platform) return alert("Fill all fields");
    try {
      await stakeAlgo(activeAddress!, Number(amount), platform, transactionSigner!);
      alert("Staked successfully!");
      setAmount("");
      setPlatform("");
    } catch (err) {
      console.error(err);
      alert("Error staking");
    }
  };

  return (
    <div className="card">
      <h2>Stake</h2>
      <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        <option value="">Select Platform</option>
        <option value="Algo5">Algo5</option>
        <option value="Tinyman">Tinyman</option>
        <option value="Messina">Messina</option>
        <option value="FolksFinance">FolksFinance</option>
      </select>
      <button className="btn btn-indigo" onClick={handleStake}>
        Stake Now
      </button>
    </div>
  );
}
