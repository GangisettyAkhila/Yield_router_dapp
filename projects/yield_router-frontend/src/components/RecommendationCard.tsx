import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { getRecommendation } from "../components/AppCalls";

export default function RecommendationCard() {
  const [recommended, setRecommended] = useState("");
  const { activeAddress, transactionSigner } = useWallet();

  const handleFetch = async () => {
    try {
      const rec = await getRecommendation(activeAddress!, transactionSigner!);
      setRecommended(rec);
    } catch (err) {
      console.error(err);
      alert("Error fetching recommendation");
    }
  };

  return (
    <div className="card">
      <h2>Recommended Platform</h2>
      <button className="btn btn-indigo mb-2" onClick={handleFetch}>
        Get Recommendation
      </button>
      {recommended && <p className="text-center text-gray-700 font-semibold">{recommended}</p>}
    </div>
  );
}
