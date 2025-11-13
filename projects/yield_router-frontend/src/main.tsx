import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import { WalletProvider, WalletManager } from "@txnlab/use-wallet-react";
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

const algodConfig = getAlgodConfigFromViteEnvironment();

const network = algodConfig.network === "mainnet" ? "mainnet" : "testnet";

const deflyWallet = new DeflyWalletConnect();
const peraWallet = new PeraWalletConnect({ shouldShowSignTxnToast: true });

const walletManager = new WalletManager();

const walletProviderProps = {
  wallets: [deflyWallet, peraWallet],
  network: network,
  nodeServer: algodConfig.server,
  nodeToken: algodConfig.token || "",
  nodePort: algodConfig.port?.toString() || "",
  autoConnect: true,
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager} {...walletProviderProps}>
      <React.Suspense fallback={<div>Loading...</div>}>
        <App />
      </React.Suspense>
    </WalletProvider>
  </React.StrictMode>
);
