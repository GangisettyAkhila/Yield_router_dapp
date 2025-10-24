import { useWallet } from "@txnlab/use-wallet-react";
import StakeForm from "./components/StakeForm";
import UnstakeForm from "./components/UnStakeForm";
import PlatformAPYForm from "./components/PlatformAPYForm";
import RecommendationCard from "./components/RecommendationCard";

export default function Home() {
  const { activeAddress } = useWallet();

  return (
    <div className="dashboard">
      <h1 className="text-4xl font-bold text-indigo-700 text-center mb-6">Yield Router Dashboard</h1>
      <p className="text-center text-gray-600 mb-6">Connected Wallet: {activeAddress}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StakeForm />
        <UnstakeForm />
        <PlatformAPYForm />
        <RecommendationCard />
      </div>
    </div>
  );
}
