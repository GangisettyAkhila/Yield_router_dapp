import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { unstakeAlgo } from "../components/AppCalls";

export default function UnstakeForm() {
  const [amount, setAmount] = useState("");
  const { activeAddress, transactionSigner } = useWallet();

  const handleUnstake = async () => {
    if (!amount) return alert("Fill all fields");
    try {
      await unstakeAlgo(activeAddress!, Number(amount), transactionSigner!);
      alert("Unstaked successfully!");
      setAmount("");
    } catch (err) {
      console.error(err);
      alert("Error unstaking");
    }
  };

  return (
    <div className="card">
      <h2>Unstake</h2>
      <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button className="btn btn-indigo" onClick={handleUnstake}>
        Unstake Now
      </button>
    </div>
  );
}
