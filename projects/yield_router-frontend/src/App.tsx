import { useState } from "react";
import "./styles/App.css";
import { useWallet } from "@txnlab/use-wallet-react";
import ConnectWallet from "./components/ConnectWallet";
import Home from "./Home";

function App() {
  const { activeAddress } = useWallet();
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!activeAddress ? (
        <>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg" onClick={() => setOpenModal(true)}>
            Connect Wallet
          </button>
          <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />
        </>
      ) : (
        <Home />
      )}
    </div>
  );
}

export default App;
