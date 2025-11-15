import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

export interface LeaderboardEntry {
  rank: number;
  address: string;
  totalStaked: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalRewards: number;
}

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

export function useLeaderboard(appId?: number, limit: number = 10, refreshInterval: number = 10000) {
  const { activeAddress } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!appId || appId === 0) {
        // Demo mode - show realistic leaderboard data
        const stored = localStorage.getItem('leaderboard_data');
        let demoEntries: LeaderboardEntry[];
        
        if (stored) {
          demoEntries = JSON.parse(stored);
        } else {
          // Generate realistic demo leaderboard
          demoEntries = [
            { rank: 1, address: 'ADDR001...XYZW', totalStaked: 15000, gamesPlayed: 89, gamesWon: 67, winRate: 75.3, totalRewards: 4500 },
            { rank: 2, address: 'ADDR002...ABCD', totalStaked: 12500, gamesPlayed: 72, gamesWon: 51, winRate: 70.8, totalRewards: 3800 },
            { rank: 3, address: 'ADDR003...EFGH', totalStaked: 10200, gamesPlayed: 65, gamesWon: 42, winRate: 64.6, totalRewards: 3100 },
            { rank: 4, address: 'ADDR004...IJKL', totalStaked: 8900, gamesPlayed: 58, gamesWon: 35, winRate: 60.3, totalRewards: 2700 },
            { rank: 5, address: 'ADDR005...MNOP', totalStaked: 7600, gamesPlayed: 51, gamesWon: 29, winRate: 56.9, totalRewards: 2300 },
            { rank: 6, address: 'ADDR006...QRST', totalStaked: 6800, gamesPlayed: 45, gamesWon: 25, winRate: 55.6, totalRewards: 2100 },
            { rank: 7, address: 'ADDR007...UVWX', totalStaked: 5900, gamesPlayed: 38, gamesWon: 20, winRate: 52.6, totalRewards: 1800 },
            { rank: 8, address: 'ADDR008...YZAB', totalStaked: 4700, gamesPlayed: 32, gamesWon: 16, winRate: 50.0, totalRewards: 1500 },
            { rank: 9, address: 'ADDR009...CDEF', totalStaked: 3500, gamesPlayed: 28, gamesWon: 13, winRate: 46.4, totalRewards: 1200 },
            { rank: 10, address: 'ADDR010...GHIJ', totalStaked: 2800, gamesPlayed: 22, gamesWon: 10, winRate: 45.5, totalRewards: 900 },
          ];
          localStorage.setItem('leaderboard_data', JSON.stringify(demoEntries));
        }
        
        setLeaderboard(demoEntries.slice(0, limit));
        return;
      }

      // Real contract integration
      const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
      const appInfo = await algodClient.getApplicationByID(appId).do();
      
      // Query global state for player stats
      const globalState = appInfo.params['global-state'] || [];
      const playerStats: Map<string, any> = new Map();
      
      // Extract player data from global state
      globalState.forEach((item: any) => {
        const key = Buffer.from(item.key, 'base64').toString();
        if (key.startsWith('player_')) {
          const address = key.split('_')[1];
          const value = item.value;
          playerStats.set(address, {
            gamesPlayed: value.ui || 0,
            gamesWon: value.ui2 || 0,
            totalRewards: value.ui3 || 0,
            totalStaked: value.ui4 || 0,
          });
        }
      });

      // Convert to leaderboard entries and sort by totalStaked
      const entries: LeaderboardEntry[] = Array.from(playerStats.entries())
        .map(([address, stats]) => ({
          rank: 0,
          address,
          totalStaked: stats.totalStaked,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0,
          totalRewards: stats.totalRewards,
        }))
        .sort((a, b) => b.totalStaked - a.totalStaked)
        .slice(0, limit)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

      setLeaderboard(entries.length > 0 ? entries : []);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || 'Failed to fetch leaderboard');
      // Fallback to demo data on error
      const stored = localStorage.getItem('leaderboard_data');
      if (stored) setLeaderboard(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  }, [appId, limit, activeAddress]);

  // Auto-refresh leaderboard
  useEffect(() => {
    fetchLeaderboard();
    
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchLeaderboard, refreshInterval]);

  return {
    leaderboard,
    loading,
    error,
    refreshLeaderboard: fetchLeaderboard,
  };
}
