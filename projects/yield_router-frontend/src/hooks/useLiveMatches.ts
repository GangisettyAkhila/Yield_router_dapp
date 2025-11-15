import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

export interface LiveMatch {
  id: string;
  playerA: string;
  playerB: string;
  scoreA: number;
  scoreB: number;
  status: 'pending' | 'active' | 'completed';
  entryFee: number;
  totalStaked: number;
  timestamp: number;
  stakingDeadline?: number;
  winner?: string;
}

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';
const ALGOD_TOKEN = '';

export function useLiveMatches(appId?: number, refreshInterval: number = 5000) {
  const { activeAddress } = useWallet();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!appId || appId === 0) {
        // Demo mode - generate fresh realistic data each time
        const stored = localStorage.getItem('live_matches');
        let demoMatches: LiveMatch[];
        
        if (stored) {
          // Parse existing matches and update their status/scores dynamically
          demoMatches = JSON.parse(stored).map((match: LiveMatch) => {
            // Update active matches with progressing scores
            if (match.status === 'active') {
              return {
                ...match,
                scoreA: Math.min(match.scoreA + Math.floor(Math.random() * 5), 150),
                scoreB: Math.min(match.scoreB + Math.floor(Math.random() * 5), 150),
              };
            }
            return match;
          });
        } else {
          // Generate initial demo data with variety
          const playerNames = [
            'PLAYER1...ABC', 'PLAYER2...DEF', 'PLAYER3...GHI',
            'PLAYER4...JKL', 'PLAYER5...MNO', 'PLAYER6...PQR'
          ];
          
          demoMatches = [
            {
              id: 'match_1',
              playerA: playerNames[0],
              playerB: playerNames[1],
              scoreA: 125,
              scoreB: 118,
              status: 'active',
              entryFee: 2,
              totalStaked: 12,
              timestamp: Date.now() - 1800000,
              stakingDeadline: Date.now() + 300000,
            },
            {
              id: 'match_2',
              playerA: playerNames[2],
              playerB: playerNames[3],
              scoreA: 87,
              scoreB: 92,
              status: 'active',
              entryFee: 5,
              totalStaked: 25,
              timestamp: Date.now() - 900000,
              stakingDeadline: Date.now() + 600000,
            },
            {
              id: 'match_3',
              playerA: playerNames[4],
              playerB: '',
              scoreA: 0,
              scoreB: 0,
              status: 'pending',
              entryFee: 1,
              totalStaked: 3,
              timestamp: Date.now(),
              stakingDeadline: Date.now() + 900000,
            },
            {
              id: 'match_4',
              playerA: playerNames[5],
              playerB: playerNames[0],
              scoreA: 145,
              scoreB: 132,
              status: 'completed',
              entryFee: 10,
              totalStaked: 50,
              timestamp: Date.now() - 3600000,
              winner: playerNames[5],
            },
          ];
        }
        
        localStorage.setItem('live_matches', JSON.stringify(demoMatches));
        setMatches(demoMatches);
        return;
      }

      // Real contract integration
      const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
      const appInfo = await algodClient.getApplicationByID(appId).do();
      
      // Query global state for active matches
      const globalState = appInfo.params['global-state'] || [];
      const matchIds: number[] = [];
      
      // Extract match IDs from global state
      globalState.forEach((item: any) => {
        const key = Buffer.from(item.key, 'base64').toString();
        if (key.startsWith('match_')) {
          const matchId = parseInt(key.split('_')[1]);
          if (!isNaN(matchId)) matchIds.push(matchId);
        }
      });

      // Fetch details for each match
      const fetchedMatches: LiveMatch[] = [];
      for (const matchId of matchIds.slice(0, 10)) { // Limit to 10 matches
        try {
          // Read match box storage or global state
          const matchKey = `match_${matchId}`;
          const matchState = globalState.find((item: any) => 
            Buffer.from(item.key, 'base64').toString() === matchKey
          );

          if (matchState) {
            const matchData = matchState.value;
            fetchedMatches.push({
              id: `match_${matchId}`,
              playerA: matchData.playerA || 'Unknown',
              playerB: matchData.playerB || '',
              scoreA: matchData.scoreA || 0,
              scoreB: matchData.scoreB || 0,
              status: matchData.status || 'pending',
              entryFee: matchData.entryFee || 1,
              totalStaked: matchData.totalStaked || 0,
              timestamp: matchData.timestamp || Date.now(),
              stakingDeadline: matchData.stakingDeadline,
              winner: matchData.winner,
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch match ${matchId}:`, err);
        }
      }

      setMatches(fetchedMatches.length > 0 ? fetchedMatches : []);
    } catch (err: any) {
      console.error('Failed to fetch matches:', err);
      setError(err.message || 'Failed to fetch matches');
      // Fallback to demo data on error
      const stored = localStorage.getItem('live_matches');
      if (stored) setMatches(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  }, [appId, activeAddress]);

  // Auto-refresh matches
  useEffect(() => {
    fetchMatches();
    
    const interval = setInterval(() => {
      fetchMatches();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchMatches, refreshInterval]);

  return {
    matches,
    loading,
    error,
    refreshMatches: fetchMatches,
  };
}
