import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";
import manager from "./walletManager";

// Initialize configuration
const algodConfig = getAlgodConfigFromViteEnvironment();

import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={manager}>
      <Router>
        <React.Suspense fallback={<div>Loading...</div>}>
          <App />
        </React.Suspense>
      </Router>
    </WalletProvider>
  </React.StrictMode>
);
