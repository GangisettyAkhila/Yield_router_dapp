import * as React from "react";
import { useWallet, Wallet, WalletId } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ellipseAddress } from "../utils/ellipseAddress";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";
import { Algodv2 } from "algosdk";

interface ConnectWalletInterface {
  openModal: boolean;
  closeModal: () => void;
}

interface AccountBalance {
  algoBalance: number;
  minBalance: number;
  isLoading: boolean;
  error: string | null;
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet();
  const algoConfig = getAlgodConfigFromViteEnvironment();
  const [balance, setBalance] = useState<AccountBalance>({
    algoBalance: 0,
    minBalance: 0,
    isLoading: false,
    error: null,
  });

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD;
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!activeAddress) return;

      setBalance((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const algod = new Algodv2(algoConfig.token as string, algoConfig.server, algoConfig.port?.toString() || "");

        const accountInfo = await algod.accountInformation(activeAddress).do();
        setBalance({
          algoBalance: accountInfo.amount / 1e6, // Convert microAlgos to Algos
          minBalance: accountInfo["min-balance"] / 1e6,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to fetch balance",
        }));
      }
    };

    if (activeAddress) {
      fetchBalance();
    }
  }, [activeAddress, algoConfig]);

  return (
    <div className={`modal ${openModal ? "modal-open" : ""} wallet-connect-modal`} aria-hidden={!openModal}>
      <motion.div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22 }}
      >
        <h3 className="modal-title">Connect your wallet</h3>
        <p className="modal-subtitle">Choose a provider to securely sign transactions on Algorand.</p>

        <div className="grid m-2 pt-2">
          {activeAddress && (
            <>
              <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-2xl p-6 shadow-lg mb-6 backdrop-blur-sm border border-white/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">Connected Account</h3>
                      <a
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                        target="_blank"
                        href={`https://lora.algokit.io/${
                          algoConfig.network === "" ? "localnet" : algoConfig.network.toLocaleLowerCase()
                        }/account/${activeAddress}/`}
                      >
                        {ellipseAddress(activeAddress)}
                      </a>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                    {algoConfig.network === "" ? "localnet" : algoConfig.network.toLocaleLowerCase()}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <div className="text-sm text-gray-500">Balance</div>
                    {balance.isLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-24 rounded mt-1" />
                    ) : balance.error ? (
                      <div className="text-red-500 text-sm">{balance.error}</div>
                    ) : (
                      <div className="text-xl font-bold text-gray-900">{balance.algoBalance.toFixed(3)} ALGO</div>
                    )}
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <div className="text-sm text-gray-500">Min Balance</div>
                    {balance.isLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-24 rounded mt-1" />
                    ) : balance.error ? (
                      <div className="text-red-500 text-sm">{balance.error}</div>
                    ) : (
                      <div className="text-xl font-bold text-gray-900">{balance.minBalance.toFixed(3)} ALGO</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="divider" />
            </>
          )}

          {!activeAddress && (
            <div className="grid grid-cols-1 gap-4 wallet-grid">
              {wallets?.map((wallet) => (
                <motion.button
                  key={`provider-${wallet.id}`}
                  data-test-id={`${wallet.id}-connect`}
                  whileHover={{ scale: 1.02, rotate: -1 }}
                  whileTap={{ scale: 0.98, rotate: 0 }}
                  className="wallet-card"
                  onClick={async () => {
                    setConnectError(null);
                    try {
                      setConnectingId(wallet.id);
                      await wallet.connect();
                      // Close the modal after successful connect
                      closeModal();
                    } catch (err: any) {
                      console.error("Wallet connect failed", err);
                      const msg = err?.message || String(err) || "Failed to connect wallet";
                      setConnectError(msg);
                    } finally {
                      setConnectingId(null);
                    }
                  }}
                >
                  {!isKmd(wallet) && (
                    <div className="wallet-card-icon">
                      <img alt={`wallet_icon_${wallet.id}`} src={wallet.metadata.icon} className="w-8 h-8 object-contain" />
                    </div>
                  )}
                  <div className="wallet-card-content">
                    <div className="wallet-card-name">{isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}</div>
                    <div className="wallet-card-desc">Connect to {wallet.metadata.name} to play and stake</div>
                  </div>
                  <div style={{ opacity: 0.9, fontSize: 12, color: "#6b7280" }}>{wallet.id}</div>
                  {connectingId === wallet.id && <div style={{ marginLeft: 8, fontSize: 12 }}>Connecting…</div>}
                </motion.button>
              ))}

              {connectError && (
                <div className="card" style={{ background: "#fff6f6", color: "#7f1d1d" }}>
                  <strong>Error:</strong> {connectError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            data-test-id="close-wallet-modal"
            className="btn-soft"
            onClick={() => {
              closeModal();
            }}
          >
            Close
          </button>
          {activeAddress && (
            <button
              className="btn-cricket btn-glow"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive);
                  if (activeWallet) {
                    await activeWallet.disconnect();
                  } else {
                    // Required for logout/cleanup of inactive providers
                    localStorage.removeItem("@txnlab/use-wallet:v3");
                    window.location.reload();
                  }
                }
              }}
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ConnectWallet;
