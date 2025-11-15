import { useState, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';

export interface Match {
  id: string;
  playerA: string;
  playerB: string;
  scoreA: number;
  scoreB: number;
  entryFee: number;
  status: 'pending' | 'active' | 'completed';
  winner?: string;
  totalStaked: number;
  stakingDeadline?: number; // timestamp when staking closes
  startTime?: number;
}

export interface GameMatchHookReturn {
  createMatch: (entryFee: number) => Promise<string>;
  joinMatch: (matchId: string) => Promise<void>;
  submitResult: (matchId: string, winnerId: string, scoreA: number, scoreB: number) => Promise<void>;
  getMatch: (matchId: string) => Promise<Match | null>;
  loading: boolean;
  error: string | null;
}

export function useGameMatch(appId?: number): GameMatchHookReturn {
  const { activeAddress, transactionSigner } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatch = useCallback(async (entryFee: number): Promise<string> => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected');
    }
    if (!appId) {
      throw new Error('App ID not configured');
    }

    setLoading(true);
    setError(null);

    try {
      // Generate match ID
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const matchData: Match = {
        id: matchId,
        playerA: activeAddress,
        playerB: '',
        scoreA: 0,
        scoreB: 0,
        entryFee,
        status: 'pending',
        totalStaked: 0,
        stakingDeadline: Date.now() + 300000, // 5 minutes from now
        startTime: Date.now(),
      };

      // Store match (replace with contract call when deployed)
      const matches = JSON.parse(localStorage.getItem('matches') || '[]');
      matches.push(matchData);
      localStorage.setItem('matches', JSON.stringify(matches));

      console.log('Match created:', matchData);
      return matchId;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress, transactionSigner, appId]);

  const joinMatch = useCallback(async (matchId: string) => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const matches = JSON.parse(localStorage.getItem('matches') || '[]');
      const matchIndex = matches.findIndex((m: Match) => m.id === matchId);

      if (matchIndex === -1) {
        throw new Error('Match not found');
      }

      matches[matchIndex].playerB = activeAddress;
      matches[matchIndex].status = 'active';
      localStorage.setItem('matches', JSON.stringify(matches));

      console.log('Joined match:', matchId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress, transactionSigner]);

  const submitResult = useCallback(async (matchId: string, winnerId: string, scoreA: number, scoreB: number) => {
    if (!activeAddress || !transactionSigner) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const matches = JSON.parse(localStorage.getItem('matches') || '[]');
      const matchIndex = matches.findIndex((m: Match) => m.id === matchId);

      if (matchIndex === -1) {
        throw new Error('Match not found');
      }

      matches[matchIndex].scoreA = scoreA;
      matches[matchIndex].scoreB = scoreB;
      matches[matchIndex].winner = winnerId;
      matches[matchIndex].status = 'completed';
      localStorage.setItem('matches', JSON.stringify(matches));

      console.log('Match result submitted:', { matchId, winnerId, scoreA, scoreB });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress, transactionSigner]);

  const getMatch = useCallback(async (matchId: string): Promise<Match | null> => {
    try {
      if (!appId || appId === 0) {
        // Demo mode - use localStorage
        const matches = JSON.parse(localStorage.getItem('matches') || '[]');
        return matches.find((m: Match) => m.id === matchId) || null;
      }

      // Real contract query
      const algosdk = await import('algosdk');
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const appInfo = await algodClient.getApplicationByID(appId).do();
      const globalState = appInfo.params['global-state'] || [];

      // Find match data
      const matchKey = `match_${matchId}`;
      const matchData = globalState.find((item: any) => 
        Buffer.from(item.key, 'base64').toString() === matchKey
      );

      if (matchData) {
        // Parse match data from contract state
        const value = matchData.value;
        return {
          id: matchId,
          playerA: value.playerA || '',
          playerB: value.playerB || '',
          scoreA: value.scoreA || 0,
          scoreB: value.scoreB || 0,
          entryFee: value.entryFee || 1,
          status: value.status || 'pending',
          winner: value.winner,
          totalStaked: value.totalStaked || 0,
          stakingDeadline: value.stakingDeadline,
          startTime: value.startTime,
        };
      }

      return null;
    } catch (err) {
      console.warn('Failed to fetch match from contract, using fallback:', err);
      // Fallback to localStorage
      const matches = JSON.parse(localStorage.getItem('matches') || '[]');
      return matches.find((m: Match) => m.id === matchId) || null;
    }
  }, [appId]);

  return {
    createMatch,
    joinMatch,
    submitResult,
    getMatch,
    loading,
    error,
  };
}
