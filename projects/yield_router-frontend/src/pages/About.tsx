import * as React from "react";
import { motion } from "framer-motion";
import { useYieldRouter } from "../hooks/useYieldRouter";

const APP_ID = import.meta.env.VITE_APP_ID ? parseInt(import.meta.env.VITE_APP_ID) : undefined;

export default function About() {
  const { platforms } = useYieldRouter(APP_ID);

  const features = [
    {
      icon: "🏏",
      title: "Play Cricket",
      description: "Experience an interactive cricket game with realistic physics. Build combos, score runs, and compete on the leaderboard.",
      benefits: ["Real-time gameplay", "Combo multipliers", "Skill-based rewards", "Live leaderboard"],
    },
    {
      icon: "💰",
      title: "Stake & Earn",
      description: "Stake your ALGO tokens on DeFi platforms and earn passive yield while playing games. Your stakes generate game credits.",
      benefits: ["Multiple DeFi platforms", "Dynamic APY rates", "Auto-compounding", "Game credit rewards"],
    },
    {
      icon: "🎮",
      title: "Watch & Bet",
      description: "Watch live cricket matches and stake on your favorite players. Earn rewards when your predictions are correct.",
      benefits: ["Live match updates", "Real-time staking", "Win rewards", "Track performance"],
    },
    {
      icon: "🏆",
      title: "Compete & Win",
      description: "Climb the global leaderboard, earn achievements, and win exclusive rewards based on your gaming performance.",
      benefits: ["Global rankings", "Achievement system", "Exclusive rewards", "Community events"],
    },
  ];

  const techStack = [
    { category: "Frontend", items: ["React 18", "TypeScript", "Vite", "TailwindCSS", "Framer Motion"] },
    { category: "Blockchain", items: ["Algorand SDK", "AlgoKit Utils", "ARC-56 Contracts", "Algopy Smart Contracts"] },
    { category: "Wallet", items: ["Use-Wallet-React", "Pera Wallet", "Defly Wallet", "MyAlgo Connect"] },
    { category: "Game Engine", items: ["Phaser 3", "Arcade Physics", "Custom Game Logic", "Real-time Rendering"] },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Connect Wallet",
      description: "Connect your Algorand wallet (Pera, Defly, or MyAlgo) to start playing.",
    },
    {
      step: 2,
      title: "Stake ALGO",
      description: "Stake your ALGO tokens on supported DeFi platforms to earn yield and game credits.",
    },
    {
      step: 3,
      title: "Play Games",
      description: "Use your game credits to play cricket matches and earn rewards based on your score.",
    },
    {
      step: 4,
      title: "Claim Rewards",
      description: "Claim your accumulated yield and game rewards directly to your wallet anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            About Yield Router
          </h1>
          <p className="text-2xl text-blue-200 max-w-3xl mx-auto">
            The first blockchain-powered cricket gaming platform with integrated DeFi yield optimization
          </p>
        </motion.div>

        {/* What is Yield Router */}
        <motion.div 
          className="mb-16 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-10 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">What is Yield Router?</h2>
          <p className="text-lg text-blue-100 leading-relaxed mb-6">
            Yield Router is a decentralized gaming platform built on Algorand that merges competitive cricket gameplay with DeFi yield 
            strategies. Players can stake ALGO tokens on supported DeFi platforms, earn passive yield, and use generated credits to 
            play matches or stake on live games.
          </p>
          <p className="text-lg text-blue-100 leading-relaxed mb-6">
            The platform features three core modules: a YieldRouter smart contract that optimizes staking across platforms like 
            Tinyman, Messina, and FolksFinance; a GameMatch contract for peer-to-peer cricket matches with entry fees; and a 
            StakeMarket contract enabling spectators to stake on match outcomes.
          </p>
          <p className="text-lg text-blue-100 leading-relaxed">
            All transactions, game results, and payouts are executed through AlgoPy smart contracts, ensuring transparency, 
            security, and fairness. The leaderboard tracks player performance on-chain, rewarding top performers with exclusive 
            benefits and recognition.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-white mb-10 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-blue-100 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="text-sm text-blue-200 flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold text-white mb-10 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/30 text-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-blue-100 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Supported Platforms */}
        {platforms.length > 0 && (
          <motion.div 
            className="mb-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-3xl p-10 border border-purple-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Supported DeFi Platforms</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platforms.map((platform, index) => (
                <motion.div
                  key={index}
                  className="bg-white/10 rounded-xl p-4 text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl font-bold text-white mb-1">{platform.name}</div>
                  <div className="text-emerald-400 font-semibold">
                    {(Number(platform.apy) / 100).toFixed(2)}% APY
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Technical Stack */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-4xl font-bold text-white mb-10 text-center">Technical Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/20">
                  {tech.category}
                </h3>
                <ul className="space-y-2">
                  {tech.items.map((item, i) => (
                    <li key={i} className="text-blue-100 text-sm flex items-center gap-2">
                      <span className="text-emerald-400">▸</span> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Smart Contract Security */}
        <motion.div 
          className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-10 border border-red-500/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span>🔒</span> Security & Transparency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-100">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Contract Audits</h3>
              <p className="text-sm">
                All smart contracts are written in Algopy and follow Algorand best practices. 
                Code is open-source and verifiable on-chain.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Decentralized Architecture</h3>
              <p className="text-sm">
                No central authority controls funds. All transactions are peer-to-peer and 
                executed by immutable smart contracts.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparent Operations</h3>
              <p className="text-sm">
                Every transaction, game result, and reward distribution is recorded on the 
                Algorand blockchain for full transparency.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Non-Custodial Wallet</h3>
              <p className="text-sm">
                You maintain full control of your private keys. We never have access to your 
                funds or personal information.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
