import { useWallet, Wallet, WalletId } from "@txnlab/use-wallet-react";

interface ConnectWalletProps {
  openModal: boolean;
  closeModal: () => void;
}

const ConnectWallet = ({ openModal, closeModal }: ConnectWalletProps) => {
  const { wallets, activeAddress } = useWallet();

  const isKmd = (wallet: Wallet) => wallet.id === WalletId.KMD;

  return (
    <dialog className={`modal ${openModal ? "modal-open" : ""}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl">Select wallet provider</h3>
        <div className="grid m-2 pt-5">
          {!activeAddress &&
            wallets?.map((wallet) => (
              <button key={wallet.id} className="btn btn-indigo" onClick={() => wallet.connect()}>
                {!isKmd(wallet) && (
                  <img alt={wallet.metadata.name} src={wallet.metadata.icon} style={{ width: "24px", marginRight: "0.5rem" }} />
                )}
                {isKmd(wallet) ? "LocalNet Wallet" : wallet.metadata.name}
              </button>
            ))}
        </div>
        <div className="modal-action">
          <button className="btn btn-warning" onClick={closeModal}>
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default ConnectWallet;
