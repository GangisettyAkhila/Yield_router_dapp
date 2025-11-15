import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

// Stake market integration for Watch & Stake section
export interface StakeMarketHookReturn {
  stakeOnMatch: (matchId: string, playerId: string, amount: number) => Promise<void>;
  getStakePools: (matchId: string) => Promise<{ playerAPool: number; playerBPool: number; totalPool: number }>;
  getUserStakeHistory: () => Promise<StakeHistoryEntry[]>;
  resolveStakes: (matchId: string, winnerId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface StakeHistoryEntry {
  matchId: string;
  amount: number;
  player: string;
  outcome: 'Won' | 'Lost' | 'Pending';
  timestamp: number;
  payout?: number;
}

export function useStakeMarket(appId?: number): StakeMarketHookReturn {
  const { activeAddress, transactionSigner } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stakeOnMatch = useCallback(async (matchId: string, playerId: string, amount: number) => {
    if (!activeAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Demo mode or real mode handling
      if (!appId || appId === 0) {
        // Demo mode - store stake info locally
        const stakeData = {
          matchId,
          playerId,
          amount,
          staker: activeAddress,
          timestamp: Date.now(),
          outcome: 'Pending',
        };

        const existingStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
        existingStakes.push(stakeData);
        localStorage.setItem('userStakes', JSON.stringify(existingStakes));
        
        console.log('Demo stake placed:', stakeData);
        return;
      }

      // Real mode - require transaction signer
      if (!transactionSigner) {
        throw new Error('Transaction signer not available');
      }

      // Store stake data for demo until contract integration is complete
      const stakeData = {
        matchId,
        playerId,
        amount,
        staker: activeAddress,
        timestamp: Date.now(),
      };

      const existingStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
      existingStakes.push(stakeData);
      localStorage.setItem('userStakes', JSON.stringify(existingStakes));

      // When real contract is deployed, replace above with:
      /*
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const params = await algodClient.getTransactionParams().do();
      
      // Create payment transaction for stake amount
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: algosdk.getApplicationAddress(appId),
        amount: amount * 1e6, // Convert ALGO to microAlgos
        suggestedParams: params,
      });

      // Create app call to stake_on_match
      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: activeAddress,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [
          new Uint8Array(Buffer.from('stake_on_match')),
          new Uint8Array(Buffer.from(matchId)),
          algosdk.decodeAddress(playerId).publicKey,
        ],
        suggestedParams: params,
      });

      // Group transactions
      const txns = [paymentTxn, appCallTxn];
      algosdk.assignGroupID(txns);

      // Sign and send
      const signedTxns = await transactionSigner(txns, [0, 1]);
      await algodClient.sendRawTransaction(signedTxns).do();
      */

      console.log('Stake placed:', stakeData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress, transactionSigner, appId]);

  const getStakePools = useCallback(async (matchId: string) => {
    try {
      if (!appId || appId === 0) {
        // Demo mode - use localStorage
        const allStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
        const matchStakes = allStakes.filter((s: any) => s.matchId === matchId);

        const playerAPool = matchStakes
          .filter((s: any) => s.playerId.includes('A'))
          .reduce((sum: number, s: any) => sum + s.amount, 0);

        const playerBPool = matchStakes
          .filter((s: any) => s.playerId.includes('B'))
          .reduce((sum: number, s: any) => sum + s.amount, 0);

        return {
          playerAPool,
          playerBPool,
          totalPool: playerAPool + playerBPool,
        };
      }

      // Real contract query - read stake pools from box storage or global state
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const appInfo = await algodClient.getApplicationByID(appId).do();
      const globalState = appInfo.params['global-state'] || [];

      // Find stake pool data for this match
      const poolKey = `pool_${matchId}`;
      const poolData = globalState.find((item: any) => 
        Buffer.from(item.key, 'base64').toString() === poolKey
      );

      if (poolData) {
        // Parse pool data (format depends on contract implementation)
        const value = poolData.value;
        return {
          playerAPool: value.ui || 0,
          playerBPool: value.ui2 || 0,
          totalPool: (value.ui || 0) + (value.ui2 || 0),
        };
      }

      return { playerAPool: 0, playerBPool: 0, totalPool: 0 };
    } catch (err) {
      console.warn('Failed to fetch pools from contract, using fallback:', err);
      // Fallback to localStorage
      const allStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
      const matchStakes = allStakes.filter((s: any) => s.matchId === matchId);

      const playerAPool = matchStakes
        .filter((s: any) => s.playerId.includes('A'))
        .reduce((sum: number, s: any) => sum + s.amount, 0);

      const playerBPool = matchStakes
        .filter((s: any) => s.playerId.includes('B'))
        .reduce((sum: number, s: any) => sum + s.amount, 0);

      return {
        playerAPool,
        playerBPool,
        totalPool: playerAPool + playerBPool,
      };
    }
  }, [appId]);

  const getUserStakeHistory = useCallback(async (): Promise<StakeHistoryEntry[]> => {
    if (!activeAddress) return [];

    // Fetch from localStorage (replace with contract query when deployed)
    const allStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
    const userStakes = allStakes.filter((s: any) => s.staker === activeAddress);

    return userStakes.map((s: any) => ({
      matchId: s.matchId,
      amount: s.amount,
      player: s.playerId,
      outcome: s.outcome || 'Pending',
      timestamp: s.timestamp,
      payout: s.payout,
    }));
  }, [activeAddress]);

  const resolveStakes = useCallback(async (matchId: string, winnerId: string) => {
    // This would call the contract's resolve_stakes method
    // For demo, update localStorage
    const allStakes = JSON.parse(localStorage.getItem('userStakes') || '[]');
    const updatedStakes = allStakes.map((s: any) => {
      if (s.matchId === matchId) {
        const won = s.playerId === winnerId;
        return {
          ...s,
          outcome: won ? 'Won' : 'Lost',
          payout: won ? s.amount * 1.8 : 0, // Example 80% ROI
        };
      }
      return s;
    });

    localStorage.setItem('userStakes', JSON.stringify(updatedStakes));
  }, []);

  return {
    stakeOnMatch,
    getStakePools,
    getUserStakeHistory,
    resolveStakes,
    loading,
    error,
  };
}
