import * as React from "react";
import { useWallet } from "@txnlab/use-wallet-react";

export default function Navbar() {
  const { activeAddress } = useWallet();
  return (
    <nav className="navbar card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>Yield Router Cricket</div>
        <div className="muted">Play or Watch matches • Stake mock ALGO</div>
      </div>
      <div>
        <button className="btn btn-outline">
          {activeAddress
            ? `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}`
            : "Connect (placeholder)"}
        </button>
      </div>
    </nav>
  );
}
