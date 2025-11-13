import * as React from "react";
import { useWallet, Wallet, WalletId } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ellipseAddress } from "../utils/ellipseAddress";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";
import { Algodv2 } from "algosdk";
import Account from "./Account";

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
          algoBalance: accountInfo.amount / 1e6,
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
    <AnimatePresence>
      {openModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <motion.div
            className="relative w-full max-w-md mx-4 bg-[#141824] rounded-2xl shadow-2xl border border-[#2A3144]/40"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Connect Wallet</h3>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {activeAddress ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A1F2E] to-[#1E2436] border border-[#2A3144]/60">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00B4F0] to-[#0090C0] rounded-xl flex items-center justify-center">
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 8h-9a2 2 0 00-2 2v8a2 2 0 002 2h9M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Connected Account</h4>
                        <a
                          href={`https://lora.algokit.io/${
                            algoConfig.network === "" ? "localnet" : algoConfig.network.toLowerCase()
                          }/account/${activeAddress}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00B4F0] hover:text-[#0090C0] transition-colors text-sm"
                        >
                          {ellipseAddress(activeAddress)}
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-[#1A1F2E]/60 border border-[#2A3144]/40">
                        <div className="text-gray-400 text-sm mb-1">Balance</div>
                        {balance.isLoading ? (
                          <div className="h-6 bg-[#2A3144]/40 rounded animate-pulse" />
                        ) : balance.error ? (
                          <div className="text-red-400 text-sm">{balance.error}</div>
                        ) : (
                          <div className="text-white font-medium">{balance.algoBalance.toFixed(3)} ALGO</div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-[#1A1F2E]/60 border border-[#2A3144]/40">
                        <div className="text-gray-400 text-sm mb-1">Min Balance</div>
                        {balance.isLoading ? (
                          <div className="h-6 bg-[#2A3144]/40 rounded animate-pulse" />
                        ) : balance.error ? (
                          <div className="text-red-400 text-sm">{balance.error}</div>
                        ) : (
                          <div className="text-white font-medium">{balance.minBalance.toFixed(3)} ALGO</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const activeWallet = wallets?.find((w) => w.isActive);
                      if (activeWallet) {
                        await activeWallet.disconnect();
                        closeModal();
                      }
                    }}
                    className="w-full px-4 py-3 text-white font-medium bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">Select a wallet to connect and get started</p>

                  <div className="grid gap-3">
                    <AnimatePresence>
                      {wallets?.map((wallet) => (
                        <motion.button
                          key={wallet.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className={`
                            w-full flex items-center gap-4 p-4 rounded-xl
                            bg-[#1A1F2E] hover:bg-[#1E2436] 
                            border border-[#2A3144]/60 hover:border-[#00B4F0]/40
                            transition-all duration-200 group
                          `}
                          onClick={async () => {
                            try {
                              setConnectingId(wallet.id);
                              setConnectError(null);
                              await wallet.connect();
                              closeModal();
                            } catch (error: any) {
                              console.error("Failed to connect wallet:", error);
                              setConnectError(error?.message || "Failed to connect");
                            } finally {
                              setConnectingId(null);
                            }
                          }}
                          disabled={connectingId === wallet.id}
                        >
                          {!isKmd(wallet) && (
                            <div className="w-10 h-10 rounded-lg bg-[#2A3144]/40 p-2 group-hover:scale-110 transition-transform duration-200">
                              <img src={wallet.metadata.icon} alt={wallet.metadata.name} className="w-full h-full object-contain" />
                            </div>
                          )}

                          <div className="flex-1 text-left">
                            <div className="font-medium text-white group-hover:text-[#00B4F0] transition-colors">
                              {isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}
                            </div>
                            <div className="text-sm text-gray-400">Connect with {wallet.metadata.name}</div>
                          </div>

                          {connectingId === wallet.id && (
                            <div className="w-5 h-5 border-2 border-[#00B4F0] border-t-transparent rounded-full animate-spin" />
                          )}

                          {(wallet.id === "pera" || wallet.id === "defly") && !connectingId && (
                            <span className="px-2 py-1 text-xs font-medium text-[#00B4F0] bg-[#00B4F0]/10 rounded-full">Mobile</span>
                          )}
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>

                  {connectError && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{connectError}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectWallet;
