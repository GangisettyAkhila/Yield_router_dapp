import { WalletManager, WalletId, NetworkId } from "@txnlab/use-wallet-react";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

const algod = getAlgodConfigFromViteEnvironment();

// Map Vite env config to use-wallet Algod config shape
const algodConfig = {
  token: (algod.token as string) || "",
  baseServer: algod.server,
  port: algod.port?.toString() || "",
  headers: {},
};

const network: NetworkId | string = (algod.network || "testnet").toLowerCase();

// Configure only the requested Algorand wallets in order
export const manager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY],
  network: network as NetworkId,
  algod: {
    [network as NetworkId]: algodConfig,
  },
  options: { debug: true },
});

export default manager;
