import * as React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import StickCricketGame from "../components/StickCricketGame";
import { useYieldRouter } from "../hooks/useYieldRouter";
import { useLeaderboard } from "../hooks/useLeaderboard";

const APP_ID = import.meta.env.VITE_APP_ID ? parseInt(import.meta.env.VITE_APP_ID) : undefined;

interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  rewardsEarned: number;
}

export default function PlayCricket() {
  const { activeAddress } = useWallet();
  const { userStats, claimYield, loading: contractLoading } = useYieldRouter(APP_ID);
  const { leaderboard, refreshLeaderboard } = useLeaderboard(APP_ID);
  
  const [gameStats, setGameStats] = useState<GameStats>({
    gamesPlayed: 0,
    totalScore: 0,
    highScore: 0,
    rewardsEarned: 0,
  });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [lastGameScore, setLastGameScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canPlayGame, setCanPlayGame] = useState(false);

  // Load game stats from localStorage or contract on mount
  useEffect(() => {
    if (!activeAddress) return;

    // Try to load from localStorage first
    const savedStats = localStorage.getItem(`game_stats_${activeAddress}`);
    if (savedStats) {
      setGameStats(JSON.parse(savedStats));
    }

    // If userStats available from contract, sync with it
    if (userStats) {
      // In future, load actual game stats from contract
      // For now, use localStorage or keep current stats
    }
  }, [activeAddress, userStats]);

  // Check if user has game credits to play
  useEffect(() => {
    // For now, allow playing even without credits (demo mode)
    setCanPlayGame(true);
    
    // When real contract is deployed, uncomment:
    // if (userStats) {
    //   const credits = Number(userStats.gameCredits || 0n);
    //   setCanPlayGame(credits > 0);
    // }
  }, [userStats]);

  const handleGameComplete = useCallback((score: number) => {
    setLastGameScore(score);
    setIsPlaying(false);
    
    // Update local stats with real data
    setGameStats(prev => {
      const updatedStats = {
        gamesPlayed: prev.gamesPlayed + 1,
        totalScore: prev.totalScore + score,
        highScore: Math.max(prev.highScore, score),
        rewardsEarned: prev.rewardsEarned + Math.floor(score / 10), // 1 reward per 10 runs
      };
      
      // Save to localStorage for persistence
      if (activeAddress) {
        localStorage.setItem(`game_stats_${activeAddress}`, JSON.stringify(updatedStats));
      }
      
      return updatedStats;
    });

    // In production, submit match result to contract and update leaderboard
    // Example contract call (when deployed):
    /*
    const submitGameResult = async () => {
      if (activeAddress && APP_ID) {
        const client = new GameMatchContractClient(...);
        await client.submitResult({
          matchId: currentMatchId,
          winnerId: activeAddress,
          scoreA: score,
          scoreB: 0,
        });
      }
    };
    submitGameResult();
    */

    // Show reward modal
    setShowRewardModal(true);
    
    // Refresh leaderboard with latest data
    refreshLeaderboard();
  }, [activeAddress, refreshLeaderboard]);

  const handleClaimRewards = async () => {
    try {
      await claimYield();
      setShowRewardModal(false);
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    }
  };

  const handleStartGame = () => {
    if (!canPlayGame) return;
    setIsPlaying(true);
  };

  // Get user's rank from leaderboard
  const userRank = leaderboard.findIndex(entry => entry.address === activeAddress) + 1;

  return (
    <motion.main 
      className="min-h-screen py-12 px-4 bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <h1 className="text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
            🏏 Cricket Arena
          </h1>
          <p className="text-xl text-blue-100">
            Play cricket, earn rewards, climb the leaderboard!
          </p>
        </motion.div>

        {!activeAddress ? (
          <motion.div 
            className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-blue-100">
              Please connect your wallet to start playing cricket and earning rewards
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Stats */}
            <div className="space-y-6">
              {/* User Stats Card */}
              <motion.div 
                className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span> Your Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Games Played:</span>
                    <span className="text-white font-bold text-lg">{gameStats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">High Score:</span>
                    <span className="text-emerald-400 font-bold text-lg">{gameStats.highScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Total Runs:</span>
                    <span className="text-white font-bold text-lg">{gameStats.totalScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Rewards Earned:</span>
                    <span className="text-yellow-400 font-bold text-lg">{gameStats.rewardsEarned}</span>
                  </div>
                  {userRank > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-white/80">Leaderboard Rank:</span>
                      <span className="text-purple-400 font-bold text-lg">#{userRank}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* How to Play */}
              <motion.div 
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span>ℹ️</span> How to Play
                </h3>
                <ul className="text-sm text-white/80 space-y-2">
                  <li>• <strong>← → or MOUSE</strong>: Move/aim bat position</li>
                  <li>• <strong>SPACE</strong>: Hold to charge power, release to swing</li>
                  <li>• <strong>Q/W/E</strong>: Special shots (Lofted/Cut/Pull)</li>
                  <li>• Perfect timing + high power = Sixes! 🚀</li>
                  <li>• Build combos for multipliers (up to 5x!) 🔥</li>
                  <li>• Watch the smooth stick animations! 🏃</li>
                </ul>
              </motion.div>
            </div>

            {/* Center - Game Canvas */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {!isPlaying ? (
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-3xl p-12 text-center border border-blue-500/30">
                  <div className="text-8xl mb-6">🏏</div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Ready to Play?
                  </h2>
                  <p className="text-lg text-blue-100 mb-8">
                    Test your cricket skills and earn rewards!
                  </p>
                  <button
                    onClick={handleStartGame}
                    disabled={contractLoading}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
                      !contractLoading
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                        : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {contractLoading ? "Loading..." : "🎮 Start Game"}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-lg rounded-3xl p-6 border border-blue-500/30">
                  <StickCricketGame onGameComplete={handleGameComplete} />
                </div>
              )}

              {/* Recent Games / Tips */}
              {!isPlaying && gameStats.gamesPlayed > 0 && (
                <motion.div 
                  className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">🎯 Your Progress</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {gameStats.gamesPlayed}
                      </div>
                      <div className="text-sm text-white/70">Games</div>
                    </div>
                    <div className="bg-emerald-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {Math.round(gameStats.totalScore / Math.max(gameStats.gamesPlayed, 1))}
                      </div>
                      <div className="text-sm text-white/70">Avg Score</div>
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {gameStats.highScore}
                      </div>
                      <div className="text-sm text-white/70">Best</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {/* Reward Modal */}
        {showRewardModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowRewardModal(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border-2 border-emerald-500/50"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Game Complete!
                </h2>
                <div className="bg-white/10 rounded-2xl p-6 mb-6">
                  <div className="text-white/80 mb-2">Your Score</div>
                  <div className="text-5xl font-bold text-emerald-400 mb-4">
                    {lastGameScore}
                  </div>
                  <div className="text-white/80 mb-1">Rewards Earned</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    +{Math.floor(lastGameScore / 10)} 🪙
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClaimRewards}
                    disabled={contractLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {contractLoading ? "Processing..." : "Claim Rewards"}
                  </button>
                  <button
                    onClick={() => {
                      setShowRewardModal(false);
                      setIsPlaying(true);
                    }}
                    disabled={!canPlayGame}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
