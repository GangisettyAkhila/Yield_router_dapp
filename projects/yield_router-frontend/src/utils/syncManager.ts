/**
 * Real-Time Sync Manager
 * Handles synchronization between React UI state and on-chain smart contract state
 * Provides polling, event-based updates, and automatic refresh
 */

import { Algodv2 } from "algosdk";
import { useState, useEffect } from "react";
import {
  readAccountState,
  readStakeAmount,
  waitForConfirmation,
  isWalletDisconnected,
  retryWithBackoff,
} from "./contractInteraction";

/**
 * Sync state interface
 */
export interface SyncState {
  mockBalance: bigint;
  stakes: Map<string, bigint>; // key: "{matchId}|{playerId}"
  isLoading: boolean;
  lastSyncTime: number;
  lastError: Error | null;
  isWalletConnected: boolean;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  appId: number;
  algodClient: Algodv2;
  pollingIntervalMs?: number; // default 5000
  autoRefreshOnTxnConfirm?: boolean; // default true
  retryCount?: number; // default 3
}

/**
 * Real-Time Sync Manager class
 * Handles state synchronization with exponential backoff and automatic retries
 */
export class ContractSyncManager {
  private config: SyncConfig;
  private state: SyncState;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;
  private accountAddr: string | null = null;
  private isPolling = false;

  constructor(config: SyncConfig) {
    this.config = {
      pollingIntervalMs: 5000,
      autoRefreshOnTxnConfirm: true,
      retryCount: 3,
      ...config,
    };

    this.state = {
      mockBalance: BigInt(0),
      stakes: new Map(),
      isLoading: false,
      lastSyncTime: 0,
      lastError: null,
      isWalletConnected: false,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (err) {
        console.error("Error in state listener:", err);
      }
    });
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Set account address and connect
   */
  async connectAccount(accountAddr: string): Promise<void> {
    this.accountAddr = accountAddr;

    this.state = {
      ...this.state,
      isWalletConnected: true,
      lastError: null,
    };

    this.notifyListeners();

    // Initial sync
    await this.syncState();

    // Start polling
    this.startPolling();
  }

  /**
   * Disconnect account and stop polling
   */
  disconnectAccount(): void {
    this.stopPolling();
    this.accountAddr = null;

    this.state = {
      ...this.state,
      isWalletConnected: false,
      mockBalance: BigInt(0),
      stakes: new Map(),
    };

    this.notifyListeners();
  }

  /**
   * Start polling for state changes
   */
  private startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollingInterval = setInterval(() => {
      this.syncState().catch((err) => {
        console.error("Polling sync error:", err);
      });
    }, this.config.pollingIntervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  /**
   * Sync state with retry logic
   */
  async syncState(): Promise<void> {
    if (!this.accountAddr) {
      console.warn("No account connected for sync");
      return;
    }

    this.state.isLoading = true;
    this.notifyListeners();

    try {
      const accountState = await retryWithBackoff(
        async () =>
          readAccountState(
            {
              appId: this.config.appId,
              appAddress: "", // Not needed for reading
              algodClient: this.config.algodClient,
              signer: null as any, // Not needed for reading
            },
            this.accountAddr!
          ),
        this.config.retryCount
      );

      this.state = {
        ...this.state,
        mockBalance: accountState.mockBalance,
        stakes: accountState.stakes,
        lastSyncTime: Date.now(),
        lastError: null,
        isLoading: false,
      };

      this.notifyListeners();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (isWalletDisconnected(error)) {
        this.disconnectAccount();
      } else {
        this.state = {
          ...this.state,
          lastError: error,
          isLoading: false,
        };

        this.notifyListeners();
      }

      console.error("Sync state error:", error);
    }
  }

  /**
   * Refresh specific stake amount
   */
  async refreshStake(matchId: string, playerId: string): Promise<bigint> {
    if (!this.accountAddr) {
      console.warn("No account connected for stake refresh");
      return BigInt(0);
    }

    try {
      const amount = await retryWithBackoff(
        async () =>
          readStakeAmount(
            {
              appId: this.config.appId,
              appAddress: "",
              algodClient: this.config.algodClient,
              signer: null as any,
            },
            {
              accountAddr: this.accountAddr!,
              matchId,
              playerId,
            }
          ),
        this.config.retryCount
      );

      // Update local stakes map
      const key = `${matchId}|${playerId}`;
      this.state.stakes.set(key, amount);
      this.notifyListeners();

      return amount;
    } catch (err) {
      console.error("Refresh stake error:", err);
      return BigInt(0);
    }
  }

  /**
   * Wait for transaction confirmation and refresh state
   */
  async waitForTxnConfirmation(
    txId: string,
    timeoutSeconds?: number
  ): Promise<{ confirmed: boolean; round?: number }> {
    try {
      const result = await waitForConfirmation(
        this.config.algodClient,
        txId,
        timeoutSeconds
      );

      if (result.confirmed && this.config.autoRefreshOnTxnConfirm) {
        // Refresh state after confirmation
        await this.syncState();
      }

      return result;
    } catch (err) {
      console.error("Txn confirmation error:", err);
      return { confirmed: false };
    }
  }

  /**
   * Get mock balance as number
   */
  getMockBalance(): number {
    return Number(this.state.mockBalance);
  }

  /**
   * Get stake for match/player as number
   */
  getStake(matchId: string, playerId: string): number {
    const key = `${matchId}|${playerId}`;
    return Number(this.state.stakes.get(key) || BigInt(0));
  }

  /**
   * Check if state is fresh (synced within last N seconds)
   */
  isStateFresh(maxAgeSeconds: number = 30): boolean {
    const ageSeconds = (Date.now() - this.state.lastSyncTime) / 1000;
    return ageSeconds < maxAgeSeconds;
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    this.stopPolling();
    this.listeners.clear();
  }
}

/**
 * React hook for using sync manager
 * Usage:
 *   const { state, isConnected } = useSyncManager(config, accountAddr);
 */
export function createSyncHook(config: SyncConfig) {
  let manager: ContractSyncManager | null = null;

  return function useSyncManager(accountAddr: string | null) {
    const [state, setState] = useState<SyncState>({
      mockBalance: BigInt(0),
      stakes: new Map(),
      isLoading: false,
      lastSyncTime: 0,
      lastError: null,
      isWalletConnected: false,
    });

    useEffect(() => {
      if (!manager) {
        manager = new ContractSyncManager(config);
      }

      const unsubscribe = manager.subscribe(setState);

      if (accountAddr) {
        manager.connectAccount(accountAddr).catch((err) => {
          console.error("Connect account error:", err);
        });
      } else {
        manager.disconnectAccount();
      }

      return () => {
        unsubscribe();
        // Don't destroy on unmount - manager persists across rerenders
      };
    }, [accountAddr]);

    return {
      state,
      manager,
      refreshStake: manager?.refreshStake.bind(manager),
      waitForTxnConfirmation: manager?.waitForTxnConfirmation.bind(manager),
      getMockBalance: () => manager?.getMockBalance() || 0,
      getStake: (matchId: string, playerId: string) =>
        manager?.getStake(matchId, playerId) || 0,
      isStateFresh: (maxAgeSeconds?: number) =>
        manager?.isStateFresh(maxAgeSeconds) || false,
    };
  };
}

/**
 * Polling strategy for less frequent syncs
 * Useful for reducing network calls on low-activity periods
 */
export class AdaptivePollingManager extends ContractSyncManager {
  private lastActivityTime = Date.now();
  private minPollingIntervalMs: number;
  private maxPollingIntervalMs: number;

  constructor(
    config: SyncConfig,
    minPollingIntervalMs: number = 3000,
    maxPollingIntervalMs: number = 30000
  ) {
    super(config);
    this.minPollingIntervalMs = minPollingIntervalMs;
    this.maxPollingIntervalMs = maxPollingIntervalMs;
  }

  /**
   * Record activity and adjust polling interval
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    // Could adjust polling interval here based on activity
  }

  /**
   * Get adaptive polling interval
   */
  private getAdaptiveInterval(): number {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    const idleSeconds = timeSinceActivity / 1000;

    // Start with min interval, increase exponentially with inactivity
    if (idleSeconds < 10) {
      return this.minPollingIntervalMs;
    } else if (idleSeconds < 60) {
      return this.minPollingIntervalMs * 2;
    } else {
      return this.maxPollingIntervalMs;
    }
  }
}
