import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import { WalletManager, WalletProvider } from "@txnlab/use-wallet-react";
import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

// Initialize configuration
const algodConfig = getAlgodConfigFromViteEnvironment();

// Initialize wallet instances with proper configuration
const deflyWallet = new DeflyWalletConnect();
const peraWallet = new PeraWalletConnect({
  shouldShowSignTxnToast: true,
});

// Configure WalletProvider with complete settings
const walletProviderProps = {
  wallets: [deflyWallet, peraWallet],
  network: algodConfig.network || "testnet",
  nodeServer: algodConfig.server,
  nodeToken: algodConfig.token || "",
  nodePort: algodConfig.port?.toString() || "",
  algosdkStatic: undefined,
  debug: true,
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={new WalletManager()} {...walletProviderProps}>
      <React.Suspense fallback={<div>Loading...</div>}>
        <App />
      </React.Suspense>
    </WalletProvider>
  </React.StrictMode>
);
