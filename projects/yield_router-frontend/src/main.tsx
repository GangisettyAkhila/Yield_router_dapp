import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { WalletProvider, WalletManager } from "@txnlab/use-wallet-react";

// Create a WalletManager instance (configure as needed)
const walletManager = new WalletManager();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider manager={walletManager}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </WalletProvider>
  </React.StrictMode>
);
