import * as React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLiveMatches } from "../hooks/useLiveMatches";
import { useYieldRouter } from "../hooks/useYieldRouter";
import { useStakeMarket, StakeHistoryEntry } from "../hooks/useStakeMarket";
import { useGameMatch } from "../hooks/useGameMatch";

interface StakeFormData {
  amount: number;
  playerId: string;
}

interface StakePools {
  [matchId: string]: {
    playerAPool: number;
    playerBPool: number;
    totalPool: number;
  };
}

export default function WatchStake() {
  const { activeAddress } = useWallet();
  const APP_ID = parseInt(import.meta.env.VITE_APP_ID || '0');
  const STAKE_MARKET_APP_ID = parseInt(import.meta.env.VITE_STAKE_MARKET_APP_ID || '0');
  
  const { matches, loading: matchesLoading, refreshMatches } = useLiveMatches(APP_ID);
  const { userStats, stake, loading: contractLoading } = useYieldRouter(APP_ID);
  const { stakeOnMatch, getStakePools, getUserStakeHistory, loading: stakeLoading } = useStakeMarket(STAKE_MARKET_APP_ID);
  const { getMatch } = useGameMatch(APP_ID);
  
  const [stakeForm, setStakeForm] = useState<StakeFormData>({
    amount: 1,
    playerId: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [stakeResult, setStakeResult] = useState<string | null>(null);
  const [stakePools, setStakePools] = useState<StakePools>({});
  const [stakeHistory, setStakeHistory] = useState<StakeHistoryEntry[]>([]);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Load stake pools for all matches
  useEffect(() => {
    const loadStakePools = async () => {
      const pools: StakePools = {};
      for (const match of matches) {
        const pool = await getStakePools(match.id);
        pools[match.id] = pool;
      }
      setStakePools(pools);
    };
    
    if (matches.length > 0) {
      loadStakePools();
    }
  }, [matches, getStakePools]);

  // Load user stake history
  useEffect(() => {
    const loadHistory = async () => {
      if (activeAddress) {
        const history = await getUserStakeHistory();
        setStakeHistory(history);
      }
    };
    loadHistory();
  }, [activeAddress, getUserStakeHistory]);

  // Auto-refresh matches and stake pools every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMatches();
    }, 5000);
    setAutoRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshMatches]);

  const handleStakeSubmit = async (matchId: string, playerId: string) => {
    if (!activeAddress) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      setStakeResult("Processing stake transaction...");
      await stakeOnMatch(matchId, playerId, stakeForm.amount);
      setStakeResult(`Successfully staked ${stakeForm.amount} ALGO on ${playerId}!`);
      
      // Refresh pools and history
      setTimeout(async () => {
        const updatedPool = await getStakePools(matchId);
        setStakePools(prev => ({ ...prev, [matchId]: updatedPool }));
        const history = await getUserStakeHistory();
        setStakeHistory(history);
        setModalOpen(false);
        setStakeResult(null);
      }, 2000);
    } catch (error: any) {
      console.error("Staking error:", error);
      setStakeResult(`Error: ${error.message}`);
    }
  };

  // Calculate time remaining until staking closes
  const getTimeRemaining = (deadline?: number) => {
    if (!deadline) return "N/A";
    const now = Date.now();
    const diff = deadline - now;
    if (diff <= 0) return "Closed";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white"
          >
            Watch & Stake
          </motion.h1>
          <p className="text-gray-300 mt-2">Watch live matches and stake on players</p>
          
          {/* User Stats */}
          {activeAddress && userStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-300">Your Staked Amount</div>
                  <div className="text-2xl font-bold text-white">
                    {(Number(userStats.stakedAmount) / 1e6).toFixed(2)} ALGO
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Game Credits</div>
                  <div className="text-2xl font-bold text-green-400">
                    {(Number(userStats.gameCredits) / 1e6).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">Stake Credits</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {(Number(userStats.stakeCredits) / 1e6).toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Loading State */}
        {matchesLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading matches...</p>
          </div>
        )}

        {/* Live Match List */}
        <div className="grid md:grid-cols-2 gap-6">
          {matches.map((match, idx) => {
            const pools = stakePools[match.id] || { playerAPool: 0, playerBPool: 0, totalPool: 0 };
            const stakingClosed = match.stakingDeadline && Date.now() > match.stakingDeadline;
            
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-white">Match #{match.id.substring(0, 8)}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      match.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
                        : match.status === 'completed'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {match.status === 'active' && '🔴 Live'}
                    {match.status === 'pending' && '⏳ Waiting'}
                    {match.status === 'completed' && '✓ Completed'}
                  </span>
                </div>

                {/* Player Cards with Real-Time Data */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="text-sm text-blue-300 mb-1">Player A</div>
                    <div className="font-medium text-white text-xs mb-2 truncate">{match.playerA}</div>
                    {match.status !== 'pending' && (
                      <div className="text-2xl font-bold text-green-400">{match.scoreA}</div>
                    )}
                    <div className="mt-2 text-xs text-blue-200">Pool: {pools.playerAPool.toFixed(2)} ALGO</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="text-sm text-purple-300 mb-1">Player B</div>
                    <div className="font-medium text-white text-xs mb-2 truncate">{match.playerB || 'Waiting...'}</div>
                    {match.status !== 'pending' && (
                      <div className="text-2xl font-bold text-green-400">{match.scoreB}</div>
                    )}
                    <div className="mt-2 text-xs text-purple-200">Pool: {pools.playerBPool.toFixed(2)} ALGO</div>
                  </div>
                </div>

                {/* Live Stakes Display */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-300">Total Staked:</span>
                    <span className="text-green-400 font-bold">{pools.totalPool.toFixed(2)} ALGO</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Entry Fee: {match.entryFee} ALGO</span>
                    {match.stakingDeadline && (
                      <span className={stakingClosed ? 'text-red-400' : 'text-yellow-400'}>
                        {stakingClosed ? '🔒 Closed' : `⏱️ ${getTimeRemaining(match.stakingDeadline)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Result (Completed) */}
                {match.status === 'completed' && match.winner && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
                    <div className="text-center">
                      <div className="text-green-400 font-bold mb-1">🏆 Winner</div>
                      <div className="text-white text-sm truncate">{match.winner}</div>
                      <div className="text-xs text-gray-300 mt-2">
                        Final Score: {match.scoreA} - {match.scoreB}
                      </div>
                    </div>
                  </div>
                )}

                {/* Staking Panel */}
                {match.status !== 'completed' && !stakingClosed && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="mb-2 text-sm text-gray-300">Stake on this match</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setSelectedMatch({ ...match, selectedPlayer: match.playerA });
                          setModalOpen(true);
                        }}
                        disabled={!activeAddress || stakeLoading}
                      >
                        Stake on A
                      </button>
                      <button
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setSelectedMatch({ ...match, selectedPlayer: match.playerB || 'Player B' });
                          setModalOpen(true);
                        }}
                        disabled={!activeAddress || !match.playerB || stakeLoading}
                      >
                        Stake on B
                      </button>
                    </div>
                    {!activeAddress && (
                      <p className="text-xs text-yellow-400 mt-2 text-center">Connect wallet to stake</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stake History */}
        {activeAddress && stakeHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-md rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-4">📊 Your Stake History</h2>
            <div className="space-y-3">
              {stakeHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg p-4 flex justify-between items-center hover:bg-white/10 transition-colors"
                >
                  <div>
                    <div className="text-white font-semibold">Match #{entry.matchId.substring(0, 8)}</div>
                    <div className="text-sm text-gray-300">Staked on: {entry.player}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{entry.amount} ALGO</div>
                    <div className={`text-sm font-semibold ${
                      entry.outcome === 'Won' ? 'text-green-400' : 
                      entry.outcome === 'Lost' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {entry.outcome}
                    </div>
                    {entry.payout && (
                      <div className="text-xs text-green-300">+{entry.payout} ALGO</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {matches.length === 0 && !matchesLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active matches found</p>
          </div>
        )}

        {/* Stake Modal */}
        {modalOpen && selectedMatch && (
          <div className="modal modal-open">
            <motion.div
              className="modal-box bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                Stake on Match #{selectedMatch.id.substring(0, 8)}
              </h3>
              <p className="text-gray-300 mb-4 text-sm truncate">
                Staking on: {selectedMatch.selectedPlayer}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (ALGO)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  value={stakeForm.amount}
                  onChange={(e) => setStakeForm({ ...stakeForm, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {stakeResult && (
                <div className={`mb-4 p-3 rounded-lg ${stakeResult.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {stakeResult}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  onClick={() => {
                    setModalOpen(false);
                    setStakeResult(null);
                  }}
                  disabled={stakeLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  onClick={() => handleStakeSubmit(selectedMatch.id, selectedMatch.selectedPlayer)}
                  disabled={stakeLoading || !stakeForm.amount}
                >
                  {stakeLoading ? 'Processing...' : 'Confirm Stake'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
