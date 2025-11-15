/**
 * Contract Interaction Utilities
 * Provides type-safe interactions with the Yield Router smart contract
 * Includes grouped transaction builders, state readers, and sync utilities
 */

import algosdk, {
  Algodv2,
  AtomicTransactionComposer,
  Transaction,
  TransactionSigner,
  ABIContract,
} from "algosdk";

/**
 * Contract configuration matching the deployed contract
 */
export interface ContractConfig {
  appId: number;
  appAddress: string;
  algodClient: Algodv2;
  signer: TransactionSigner;
}

/**
 * On-chain state types
 */
export interface OnChainState {
  mockBalance: bigint;
  stakes: Map<string, bigint>;
  paused: boolean;
  admin: string;
  oracle: string;
  protocolFeeBps: number;
}

/**
 * Grouped transaction builder for stake_real (Payment + AppCall)
 *
 * Creates an atomic group:
 * 1. PaymentTransaction to contract
 * 2. ApplicationCallTransaction to stake_real method
 */
export async function buildStakeRealGroup(
  config: ContractConfig,
  params: {
    senderAddr: string;
    matchId: string;
    playerId: string;
    amount: number; // in microALGOs
  }
): Promise<Transaction[]> {
  const { appId, appAddress, algodClient } = config;
  const { senderAddr, matchId, playerId, amount } = params;

  const suggestedParams = await algodClient.getTransactionParams().do();

  // Transaction 1: Payment to contract
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddr,
    to: appAddress,
    amount,
    suggestedParams,
  });

  // Transaction 2: Application call to stake_real
  // Note: Adjust app args based on your contract's ABI
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddr,
    appIndex: appId,
    onComplete: 0, // NoOpOC
    appArgs: [
      new Uint8Array(Buffer.from("stake_real")),
      new Uint8Array(Buffer.from(matchId)),
      new Uint8Array(Buffer.from(playerId)),
      algosdk.encodeUint64(amount),
    ],
    accounts: [senderAddr],
    suggestedParams,
  });

  // Group the transactions
  const txns = algosdk.assignGroupID([paymentTxn, appCallTxn]);
  return txns;
}

/**
 * Build withdraw_real application call transaction
 */
export async function buildWithdrawRealTxn(
  config: ContractConfig,
  params: {
    senderAddr: string;
    matchId: string;
    playerId: string;
    amount: number;
  }
): Promise<Transaction> {
  const { appId, algodClient } = config;
  const { senderAddr, matchId, playerId, amount } = params;

  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeApplicationCallTxnFromObject({
    from: senderAddr,
    appIndex: appId,
    onComplete: 0, // NoOpOC
    appArgs: [
      new Uint8Array(Buffer.from("withdraw_real")),
      new Uint8Array(Buffer.from(matchId)),
      new Uint8Array(Buffer.from(playerId)),
      algosdk.encodeUint64(amount),
    ],
    accounts: [senderAddr],
    suggestedParams,
  });
}

/**
 * Build settle_match application call transaction (admin/oracle only)
 */
export async function buildSettleMatchTxn(
  config: ContractConfig,
  params: {
    callerAddr: string;
    matchId: string;
    winnerAddresses: string[];
    payoutAmounts: number[]; // in microALGOs
  }
): Promise<Transaction> {
  const { appId, algodClient } = config;
  const { callerAddr, matchId, winnerAddresses, payoutAmounts } = params;

  if (winnerAddresses.length !== payoutAmounts.length) {
    throw new Error("Winners and payouts array length mismatch");
  }

  const suggestedParams = await algodClient.getTransactionParams().do();

  // Encode arrays for app args
  const winnersEncoded = winnerAddresses
    .map((addr) => algosdk.decodeAddress(addr).publicKey)
    .reduce((a, b) => new Uint8Array([...a, ...b]), new Uint8Array());

  const payoutsEncoded = payoutAmounts
    .map((amt) => {
      const buf = Buffer.alloc(8);
      buf.writeBigUInt64BE(BigInt(amt));
      return buf;
    })
    .reduce((a, b) => new Uint8Array([...a, ...b]), new Uint8Array());

  return algosdk.makeApplicationCallTxnFromObject({
    from: callerAddr,
    appIndex: appId,
    onComplete: 0, // NoOpOC
    appArgs: [
      new Uint8Array(Buffer.from("settle_match")),
      new Uint8Array(Buffer.from(matchId)),
      winnersEncoded,
      payoutsEncoded,
    ],
    accounts: winnerAddresses,
    suggestedParams,
  });
}

/**
 * Submit grouped transactions via wallet signer
 */
export async function submitGroupedTransaction(
  config: ContractConfig,
  txns: Transaction[],
  onError?: (err: Error) => void
): Promise<string> {
  try {
    const { algodClient, signer } = config;

    // Create atomic transaction composer
    const atc = new AtomicTransactionComposer();

    // Add each transaction to the composer
    for (const txn of txns) {
      atc.addTransaction({ txn, signer });
    }

    // Execute
    const result = await atc.execute(algodClient, 2);
    return result.txIDs[0];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    throw error;
  }
}

/**
 * Submit single transaction via wallet signer
 */
export async function submitTransaction(
  config: ContractConfig,
  txn: Transaction,
  onError?: (err: Error) => void
): Promise<string> {
  try {
    const { algodClient, signer } = config;

    const atc = new AtomicTransactionComposer();
    atc.addTransaction({ txn, signer });

    const result = await atc.execute(algodClient, 2);
    return result.txIDs[0];
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    throw error;
  }
}

/**
 * Read on-chain state for an account from the contract
 */
export async function readAccountState(
  config: ContractConfig,
  accountAddr: string
): Promise<{
  mockBalance: bigint;
  stakes: Map<string, bigint>;
}> {
  const { appId, algodClient } = config;

  try {
    // Get account's local state for the app
    const accountInfo = await algodClient.accountInformation(accountAddr).do();
    const localState = (accountInfo.appsLocalState as any[] | undefined)?.find(
      (app: any) => app.id === appId
    );

    if (!localState) {
      return {
        mockBalance: BigInt(0),
        stakes: new Map(),
      };
    }

    // Parse local state keys
    const mockBalance = (localState.keyValue as any[] | undefined)?.find(
      (kv: any) => kv.key === "mock_bal"
    )?.value?.uint || BigInt(0);

    // Parse BoxMap stakes (stored globally, keyed by composite string)
    const stakes = new Map<string, bigint>();
    // Note: BoxMap is global state; use indexer for efficient querying
    // or iterate through accountInfo's boxes if available

    return {
      mockBalance: BigInt(mockBalance),
      stakes,
    };
  } catch (err) {
    console.error("Error reading account state:", err);
    return {
      mockBalance: BigInt(0),
      stakes: new Map(),
    };
  }
}

/**
 * Read stake amount for a specific match/player/account combination
 * by querying BoxMap (requires indexer or direct BoxMap inspection)
 */
export async function readStakeAmount(
  config: ContractConfig,
  params: {
    accountAddr: string;
    matchId: string;
    playerId: string;
  }
): Promise<bigint> {
  const { appId, algodClient } = config;
  const { accountAddr, matchId, playerId } = params;

  try {
    // Construct composite key matching contract logic
    const compositeKey = `${accountAddr}|${matchId}|${playerId}`;

    // Query BoxMap directly (requires algosdk >= 2.5.0)
    // Note: This is a low-level approach; consider using application state indexing for production
    const boxName = Buffer.from(compositeKey);

    const boxValue = await algodClient
      .getApplicationBoxByName(appId, boxName)
      .do();

    if (boxValue && boxValue.value) {
      const valueBytes = new Uint8Array(boxValue.value);
      return BigInt(algosdk.decodeUint64(valueBytes, "bigint"));
    }

    return BigInt(0);
  } catch (err) {
    // Box doesn't exist or error reading
    return BigInt(0);
  }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
  algodClient: Algodv2,
  txId: string,
  timeoutSeconds: number = 60
): Promise<{ confirmed: true; round: number } | { confirmed: false }> {
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const txInfo = await algodClient.pendingTransactionInformation(txId).do();

      if (txInfo["confirmed-round"]) {
        return {
          confirmed: true,
          round: txInfo["confirmed-round"],
        };
      }
    } catch (err) {
      // Not found yet, continue polling
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { confirmed: false };
}

/**
 * Handle wallet disconnection gracefully
 */
export interface WalletError {
  code: string;
  message: string;
  isDisconnected?: boolean;
}

export function isWalletDisconnected(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("wallet") ||
      msg.includes("signer") ||
      msg.includes("disconnected") ||
      msg.includes("no active wallet")
    );
  }
  return false;
}

/**
 * Retry logic for network errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (i < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}
