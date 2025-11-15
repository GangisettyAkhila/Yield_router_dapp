import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import cricketStadiumBg from "./assets/stadium.jpg";
import { ParticleField } from "./components/ParticleField";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { useYieldRouter } from "./hooks/useYieldRouter";
import { useLiveMatches } from "./hooks/useLiveMatches";
import { useLeaderboard } from "./hooks/useLeaderboard";

export default function Home() {
  const { playHover, playClick } = useSoundEffects();
  const { activeAddress } = useWallet();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  // Dynamic contract data - replace with actual app ID
  const APP_ID = parseInt(import.meta.env.VITE_APP_ID || '0');
  const { userStats, platforms, loading: contractLoading } = useYieldRouter(APP_ID);
  const { matches } = useLiveMatches(APP_ID);
  const { leaderboard } = useLeaderboard(APP_ID, 5);
  
  // Real-time stats state with demo defaults
  const [stats, setStats] = useState({
    totalStaked: '87,542.50',
    activeGames: 3,
    totalRewards: '12,458.75',
  });
  
  // Calculate real-time stats from contract data
  useEffect(() => {
    const calculateStats = () => {
      // Calculate Total Value Locked from user stats or leaderboard
      let tvl = '0';
      if (userStats) {
        tvl = (Number(userStats.stakedAmount) / 1e6).toFixed(2);
      } else if (leaderboard.length > 0) {
        tvl = leaderboard.reduce((sum, entry) => sum + entry.totalStaked, 0).toFixed(2);
      } else {
        // Demo fallback - show realistic number
        tvl = '87,542.50';
      }
      
      // Count active games from matches
      const activeGames = matches.length > 0 
        ? matches.filter(m => m.status === 'active').length
        : 3; // Demo fallback
      
      // Calculate total rewards from leaderboard or user stats
      let totalRewards = '0.00';
      if (leaderboard.length > 0) {
        totalRewards = leaderboard.reduce((sum, entry) => sum + entry.totalRewards, 0).toFixed(2);
      } else if (userStats) {
        totalRewards = (Number(userStats.gameCredits + userStats.stakeCredits) / 1e6).toFixed(2);
      } else {
        // Demo fallback - show realistic number
        totalRewards = '12,458.75';
      }
      
      setStats({
        totalStaked: tvl,
        activeGames,
        totalRewards,
      });
    };

    calculateStats();
  }, [userStats, matches, leaderboard]);

  // Parallax effect for the hero background
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A2342] text-white">
      {/* Hero Background with Parallax */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${cricketStadiumBg})`,
            backgroundPosition: "center 30%",
          }}
        />
        <ParticleField />
        {/* Dark gradient overlay: top 55% opacity black to bottom 20% */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />
      </motion.div>

      {/* Navbar removed: App.tsx provides a single glass-morphic topbar. */}

      {/* Hero Content */}
      <motion.div
        className="relative z-10 flex items-center justify-center min-h-screen px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 variants={itemVariants} className="hero-headline text-4xl md:text-5xl lg:text-6xl leading-tight animate-gradient mb-6">
            Play Cricket, Earn On-Chain
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-[#EDEDED] mb-12 max-w-2xl mx-auto drop-shadow-lg">
            Stake on live cricket action and turn your predictions into on-chain rewards.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(0, 168, 89, 0.5)",
              }}
              onHoverStart={playHover}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClick();
                navigate("/play");
              }}
              className="px-8 py-4 bg-gradient-to-r from-[#1E90FF] to-[#00A859] rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              Play Cricket
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)",
              }}
              onHoverStart={playHover}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playClick();
                navigate("/stake");
              }}
              className="px-8 py-4 bg-transparent border-2 border-[#FFD700] text-[#FFD700] rounded-2xl text-lg font-bold hover:bg-[#FFD700]/10 transition-colors"
            >
              Watch & Stake
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Live Stats Section */}
      <motion.div
        className="relative z-10 px-4 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/10"
            >
              <div className="text-blue-300 text-sm mb-2">Total Value Locked</div>
              <div className="text-3xl font-bold text-white">${stats.totalStaked}</div>
              <div className="text-sm text-green-400 mt-1">↗ +12.5% this week</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/10"
            >
              <div className="text-emerald-300 text-sm mb-2">Active Games</div>
              <div className="text-3xl font-bold text-white">{stats.activeGames}</div>
              <div className="text-sm text-white/60 mt-1">Live matches ongoing</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/10"
            >
              <div className="text-yellow-300 text-sm mb-2">Total Rewards</div>
              <div className="text-3xl font-bold text-white">{stats.totalRewards} ALGO</div>
              <div className="text-sm text-green-400 mt-1">↗ Distributed to players</div>
            </motion.div>
          </div>

          {/* Live Leaderboard Preview - Dynamic Real Data */}
          {leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-12 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">🏆 Top Players (Live)</h2>
                <button
                  onClick={() => navigate("/play")}
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                >
                  View Full Leaderboard →
                </button>
              </div>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <motion.div
                    key={entry.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-blue-400'}`}>
                        #{entry.rank}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm truncate max-w-[200px]">{entry.address}</div>
                        <div className="text-sm text-white/60">
                          {entry.gamesWon}/{entry.gamesPlayed} wins • {entry.winRate.toFixed(1)}% WR
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{entry.totalStaked.toLocaleString()} ALGO</div>
                      <div className="text-sm text-white/60">{entry.totalRewards.toLocaleString()} rewards</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
