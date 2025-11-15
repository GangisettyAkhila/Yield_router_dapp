/**
 * Complete integration examples showing:
 * 1. Building and sending grouped transactions for stake_real
 * 2. Admin functions for withdraw_real and settle_match
 * 3. Reading on-chain state and displaying in React
 * 4. Real-time sync with auto-refresh
 */

import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import algosdk, { Algodv2 } from "algosdk";
import {
  buildStakeRealGroup,
  buildWithdrawRealTxn,
  buildSettleMatchTxn,
  submitGroupedTransaction,
  submitTransaction,
  readAccountState,
  readStakeAmount,
  waitForConfirmation,
  ContractConfig,
} from "./contractInteraction";
import { ContractSyncManager, SyncConfig, SyncState } from "./syncManager";

// ============================================================================
// EXAMPLE 1: Complete Stake Real Flow (Grouped Transaction)
// ============================================================================

export interface StakeRealOptions {
  senderAddr: string;
  matchId: string;
  playerId: string;
  amount: number; // in microALGOs
  onSuccess?: (txId: string) => void;
  onError?: (err: Error) => void;
  onConfirmed?: (round: number) => void;
}

export async function executeStakeReal(
  config: ContractConfig,
  options: StakeRealOptions
): Promise<string | null> {
  const { senderAddr, matchId, playerId, amount, onSuccess, onError, onConfirmed } = options;

  try {
    if (!senderAddr) {
      throw new Error("No wallet connected");
    }

    // Build grouped transaction: [Payment, AppCall]
    const txns = await buildStakeRealGroup(config, {
      senderAddr,
      matchId,
      playerId,
      amount,
    });

    console.log(`[StakeReal] Built group of ${txns.length} transactions`);

    // Submit grouped transaction
    const txId = await submitGroupedTransaction(config, txns, onError);
    console.log(`[StakeReal] Submitted txId: ${txId}`);

    onSuccess?.(txId);

    // Wait for confirmation
    const result = await waitForConfirmation(config.algodClient, txId);

    if (result.confirmed) {
      console.log(`[StakeReal] Confirmed in round ${result.round}`);
      onConfirmed?.(result.round);
      return txId;
    } else {
      throw new Error("Transaction not confirmed within timeout");
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[StakeReal] Error:", error);
    onError?.(error);
    return null;
  }
}

// ============================================================================
// EXAMPLE 2: Withdraw Real (Admin Function)
// ============================================================================

export interface WithdrawRealOptions {
  matchId: string;
  playerId: string;
  amount: number;
  onSuccess?: (txId: string) => void;
  onError?: (err: Error) => void;
}

export async function executeWithdrawReal(
  config: ContractConfig,
  options: WithdrawRealOptions
): Promise<string | null> {
  const { matchId, playerId, amount, onSuccess, onError } = options;

  try {
    const txn = await buildWithdrawRealTxn(config, {
      senderAddr: config.appAddress, // Assuming admin is calling from app context
      matchId,
      playerId,
      amount,
    });

    const txId = await submitTransaction(config, txn, onError);
    console.log(`[WithdrawReal] Submitted txId: ${txId}`);

    onSuccess?.(txId);

    const result = await waitForConfirmation(config.algodClient, txId);
    if (!result.confirmed) {
      throw new Error("Withdrawal not confirmed");
    }

    return txId;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[WithdrawReal] Error:", error);
    onError?.(error);
    return null;
  }
}

// ============================================================================
// EXAMPLE 3: Settle Match (Admin/Oracle Only)
// ============================================================================

export interface SettleMatchOptions {
  matchId: string;
  winners: { address: string; payout: number }[]; // payout in microALGOs
  onSuccess?: (txId: string) => void;
  onError?: (err: Error) => void;
}

export async function executeSettleMatch(
  config: ContractConfig,
  callerAddr: string,
  options: SettleMatchOptions
): Promise<string | null> {
  const { matchId, winners, onSuccess, onError } = options;

  try {
    const txn = await buildSettleMatchTxn(config, {
      callerAddr,
      matchId,
      winnerAddresses: winners.map((w) => w.address),
      payoutAmounts: winners.map((w) => w.payout),
    });

    const txId = await submitTransaction(config, txn, onError);
    console.log(`[SettleMatch] Submitted txId: ${txId}`);

    onSuccess?.(txId);

    const result = await waitForConfirmation(config.algodClient, txId);
    if (!result.confirmed) {
      throw new Error("Settlement not confirmed");
    }

    return txId;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[SettleMatch] Error:", error);
    onError?.(error);
    return null;
  }
}

// ============================================================================
// EXAMPLE 4: React Hook for Reading State
// ============================================================================

export function useContractState(
  config: ContractConfig | null,
  accountAddr: string | null
) {
  const [state, setState] = useState<SyncState>({
    mockBalance: BigInt(0),
    stakes: new Map(),
    isLoading: false,
    lastSyncTime: 0,
    lastError: null,
    isWalletConnected: !!accountAddr,
  });

  useEffect(() => {
    if (!config || !accountAddr) {
      setState((prev) => ({
        ...prev,
        isWalletConnected: false,
      }));
      return;
    }

    const syncConfig: SyncConfig = {
      appId: config.appId,
      algodClient: config.algodClient,
      pollingIntervalMs: 5000,
      autoRefreshOnTxnConfirm: true,
    };

    const manager = new ContractSyncManager(syncConfig);

    const unsubscribe = manager.subscribe(setState);

    manager
      .connectAccount(accountAddr)
      .catch((err) => console.error("Connect error:", err));

    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [config, accountAddr]);

  return {
    ...state,
    mockBalanceNum: Number(state.mockBalance),
  };
}

// ============================================================================
// EXAMPLE 5: React Component - Stake Panel
// ============================================================================

interface StakePanelProps {
  config: ContractConfig;
  matchId: string;
  playerId: string;
}

export function StakePanel({ config, matchId, playerId }: StakePanelProps) {
  const { activeAddress } = useWallet();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    txId?: string;
    status: "idle" | "pending" | "confirmed" | "error";
    message?: string;
  }>({
    status: "idle",
  });

  const state = useContractState(config, activeAddress || null);

  const handleStake = async () => {
    if (!stakeAmount || !activeAddress) return;

    setIsLoading(true);
    setTxStatus({ status: "pending", message: "Submitting transaction..." });

    try {
      const amount = Math.floor(Number(stakeAmount) * 1e6); // Convert to microALGOs

      const txId = await executeStakeReal(config, {
        senderAddr: activeAddress,
        matchId,
        playerId,
        amount,
        onSuccess: (id) => {
          setTxStatus({
            txId: id,
            status: "confirmed",
            message: "Stake successful!",
          });
          setStakeAmount("");
        },
        onError: (err) => {
          setTxStatus({
            status: "error",
            message: err.message,
          });
        },
      });

      if (!txId) {
        throw new Error("Failed to submit transaction");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setTxStatus({
        status: "error",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStake = state.stakes.get(`${matchId}|${playerId}`)
    ? Number(state.stakes.get(`${matchId}|${playerId}`)!) / 1e6
    : 0;

  return (
    <div className="card bg-gradient-to-r from-purple-900 to-blue-900 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Stake on Match</h3>

      <div className="space-y-4">
        {/* Mock Balance Display */}
        <div className="bg-black bg-opacity-30 p-4 rounded-lg">
          <p className="text-sm text-gray-300">Mock Balance</p>
          <p className="text-2xl font-bold text-green-400">
            {(state.mockBalanceNum / 1e6).toFixed(2)} ALGO
          </p>
        </div>

        {/* Current Stake Display */}
        <div className="bg-black bg-opacity-30 p-4 rounded-lg">
          <p className="text-sm text-gray-300">Current Stake (Match {matchId})</p>
          <p className="text-2xl font-bold text-blue-400">
            {currentStake.toFixed(2)} ALGO
          </p>
        </div>

        {/* Stake Amount Input */}
        <input
          type="number"
          placeholder="Amount to stake (ALGO)"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />

        {/* Status Message */}
        {txStatus.message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              txStatus.status === "error"
                ? "bg-red-900 text-red-100"
                : txStatus.status === "confirmed"
                ? "bg-green-900 text-green-100"
                : "bg-blue-900 text-blue-100"
            }`}
          >
            {txStatus.message}
            {txStatus.txId && <p className="text-xs mt-1">TxId: {txStatus.txId.slice(0, 16)}...</p>}
          </div>
        )}

        {/* Stake Button */}
        <button
          onClick={handleStake}
          disabled={!stakeAmount || isLoading || !activeAddress}
          className="w-full px-4 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Staking..." : "Stake Now"}
        </button>

        {/* Sync Status */}
        <div className="text-xs text-gray-400">
          <p>Last sync: {new Date(state.lastSyncTime).toLocaleTimeString()}</p>
          <p>Wallet: {state.isWalletConnected ? "Connected" : "Disconnected"}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Admin Settlement Panel
// ============================================================================

interface AdminSettlementPanelProps {
  config: ContractConfig;
  adminAddress: string;
}

export function AdminSettlementPanel({ config, adminAddress }: AdminSettlementPanelProps) {
  const [matchId, setMatchId] = useState("");
  const [winners, setWinners] = useState<
    Array<{ address: string; payout: string }>
  >([{ address: "", payout: "" }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSettleMatch = async () => {
    if (!matchId || winners.some((w) => !w.address || !w.payout)) {
      alert("Fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      const winnersData = winners.map((w) => ({
        address: w.address,
        payout: Math.floor(Number(w.payout) * 1e6),
      }));

      await executeSettleMatch(config, adminAddress, {
        matchId,
        winners: winnersData,
        onSuccess: (txId) => {
          alert(`Settlement successful! TxId: ${txId}`);
          setMatchId("");
          setWinners([{ address: "", payout: "" }]);
        },
        onError: (err) => {
          alert(`Settlement failed: ${err.message}`);
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-r from-red-900 to-orange-900 p-6">
      <h3 className="text-xl font-bold text-white mb-4">Settle Match (Admin)</h3>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Match ID"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white"
          disabled={isLoading}
        />

        {winners.map((winner, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              placeholder="Winner Address"
              value={winner.address}
              onChange={(e) => {
                const newWinners = [...winners];
                newWinners[idx].address = e.target.value;
                setWinners(newWinners);
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm"
              disabled={isLoading}
            />
            <input
              type="number"
              placeholder="Payout (ALGO)"
              value={winner.payout}
              onChange={(e) => {
                const newWinners = [...winners];
                newWinners[idx].payout = e.target.value;
                setWinners(newWinners);
              }}
              className="w-24 px-4 py-2 rounded-lg bg-gray-800 text-white"
              disabled={isLoading}
            />
          </div>
        ))}

        <button
          onClick={() => setWinners([...winners, { address: "", payout: "" }])}
          className="text-sm text-gray-300 hover:text-white"
        >
          + Add Winner
        </button>

        <button
          onClick={handleSettleMatch}
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? "Settling..." : "Settle Match"}
        </button>
      </div>
    </div>
  );
}
