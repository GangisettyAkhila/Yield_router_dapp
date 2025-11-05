import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import { motion, useScroll, useTransform } from "framer-motion";
import cricketStadiumBg from "./assets/stadium.jpg";
import { ParticleField } from "./components/ParticleField";
import { useSoundEffects } from "./hooks/useSoundEffects";

export default function Home() {
  const { playHover, playClick } = useSoundEffects();
  const { activeAddress } = useWallet();
  const navigate = useNavigate();
  const { scrollY } = useScroll();

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
    </div>
  );
}
