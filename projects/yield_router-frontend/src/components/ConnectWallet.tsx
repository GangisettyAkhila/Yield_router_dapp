import * as React from "react";
import { useWallet, Wallet, WalletId } from "@txnlab/use-wallet-react";
import { useMemo } from "react";
import { ellipseAddress } from "../utils/ellipseAddress";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";

interface ConnectWalletInterface {
  openModal: boolean;
  closeModal: () => void;
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletInterface) => {
  const { wallets, activeAddress } = useWallet();
  const algoConfig = getAlgodConfigFromViteEnvironment();

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD;

  return (
    <dialog id="connect_wallet_modal" className={`modal ${openModal ? "modal-open" : ""}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl">Select wallet provider</h3>

        <div className="grid m-2 pt-5">
          {activeAddress && (
            <>
              <div className="account-display">
                <div className="account-header">
                  <div className="account-avatar">
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
                  <div className="account-info">
                    <h3>Connected Account</h3>
                    <a
                      className="account-address"
                      target="_blank"
                      href={`https://lora.algokit.io/${
                        algoConfig.network === "" ? "localnet" : algoConfig.network.toLocaleLowerCase()
                      }/account/${activeAddress}/`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {ellipseAddress(activeAddress)}
                    </a>
                    <div className="network-badge">
                      <span>Network: {algoConfig.network === "" ? "localnet" : algoConfig.network.toLocaleLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="divider" />
            </>
          )}

          {!activeAddress &&
            wallets?.map((wallet) => (
              <button
                data-test-id={`${wallet.id}-connect`}
                className="btn border-teal-800 border-1  m-2"
                key={`provider-${wallet.id}`}
                onClick={() => {
                  return wallet.connect();
                }}
              >
                {!isKmd(wallet) && (
                  <img
                    alt={`wallet_icon_${wallet.id}`}
                    src={wallet.metadata.icon}
                    style={{ objectFit: "contain", width: "30px", height: "auto" }}
                  />
                )}
                <span>{isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}</span>
              </button>
            ))}
        </div>

        <div className="modal-action">
          <button
            data-test-id="close-wallet-modal"
            className="btn"
            onClick={() => {
              closeModal();
            }}
          >
            Close
          </button>
          {activeAddress && (
            <button
              className="btn btn-warning"
              data-test-id="logout"
              onClick={async () => {
                if (wallets) {
                  const activeWallet = wallets.find((w) => w.isActive);
                  if (activeWallet) {
                    await activeWallet.disconnect();
                  } else {
                    // Required for logout/cleanup of inactive providers
                    // For instance, when you login to localnet wallet and switch network
                    // to testnet/mainnet or vice verse.
                    localStorage.removeItem("@txnlab/use-wallet:v3");
                    window.location.reload();
                  }
                }
              }}
            >
              Logout
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
};

export default ConnectWallet;
