import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { updateAPY } from "../components/AppCalls";

export default function PlatformAPYForm() {
  const [platform, setPlatform] = useState("");
  const [apy, setApy] = useState("");
  const { activeAddress, transactionSigner } = useWallet();

  const handleUpdate = async () => {
    if (!platform || !apy) return alert("Fill all fields");
    try {
      await updateAPY(platform, Number(apy), activeAddress!, transactionSigner!);
      alert("APY updated successfully!");
      setPlatform("");
      setApy("");
    } catch (err) {
      console.error(err);
      alert("Error updating APY");
    }
  };

  return (
    <div className="card">
      <h2>Update Platform APY</h2>
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        <option value="">Select Platform</option>
        <option value="Algo5">Algo5</option>
        <option value="Tinyman">Tinyman</option>
        <option value="Messina">Messina</option>
        <option value="FolksFinance">FolksFinance</option>
      </select>
      <input type="number" placeholder="APY (%)" value={apy} onChange={(e) => setApy(e.target.value)} />
      <button className="btn btn-green" onClick={handleUpdate}>
        Update APY
      </button>
    </div>
  );
}
