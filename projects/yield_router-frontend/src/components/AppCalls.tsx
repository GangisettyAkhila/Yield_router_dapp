import { useWallet } from "@txnlab/use-wallet-react";
import { YieldRouterContractFactory } from "../contracts/YieldRouterContract";
import { AlgorandClient, algos } from "@algorandfoundation/algokit-utils";
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";

// Helper to create contract client
async function getAppClient(activeAddress?: string, transactionSigner?: any) {
  if (!activeAddress || !transactionSigner) throw new Error("Wallet not connected");

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const indexerConfig = getIndexerConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig });
  algorand.setDefaultSigner(transactionSigner);

  const factory = new YieldRouterContractFactory({ defaultSender: activeAddress, algorand });

  // Assume contract is already deployed, or deploy once for simplicity
  const deployResult = await factory.deploy().catch(() => undefined);
  if (!deployResult) throw new Error("Contract deployment failed");

  return deployResult.appClient;
}

// Stake function
export async function stakeAlgo(activeAddress: string, amount: number, platform: string, transactionSigner?: any) {
  const client = await getAppClient(activeAddress, transactionSigner);
  return await client.send.stake({
    args: {
      payment: client.algorand.createTransaction.payment({
        sender: activeAddress,
        receiver: client.appAddress,
        amount: algos(amount),
      }),
      contractAddress: client.appAddress.toString(),
      forAccount: activeAddress,
      amount,
      timestamp: Date.now(),
      platform,
    },
  });
}

// Unstake function
export async function unstakeAlgo(activeAddress: string, amount: number, transactionSigner?: any) {
  const client = await getAppClient(activeAddress, transactionSigner);
  return await client.send.unstake({
    args: {
      forAccount: activeAddress,
      amount,
      timestamp: Date.now(),
    },
  });
}

// Update APY (admin)
export async function updateAPY(platform: string, apy: number, activeAddress?: string, transactionSigner?: any) {
  if (!activeAddress) throw new Error("Wallet not connected");
  const client = await getAppClient(activeAddress, transactionSigner);
  return await client.send.updatePlatformApy({
    args: { platform, apy },
  });
}

// Get recommendation
export async function getRecommendation(activeAddress: string, transactionSigner?: any) {
  const client = await getAppClient(activeAddress, transactionSigner);
  const rec = await client.send.getRecommendedPlatform({ args: { forAccount: activeAddress } });
  return rec.return?.toString() || "";
}
