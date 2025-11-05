import * as React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { Algodv2 } from "algosdk";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";
import { GameMatchContractClient, MatchInfo } from "../contracts/game_match_contract_client";
import { motion } from "framer-motion";

interface Score {
  runs: number;
  balls: number;
  isOut: boolean;
}

interface GameState {
  score: Score;
  matchId?: string;
  matchInfo?: MatchInfo;
  isLoading: boolean;
  error: string | null;
}

export default function PlayCricket() {
  const { activeAddress, transactionSigner } = useWallet();
  const [gameState, setGameState] = useState<GameState>({
    score: {
      runs: 0,
      balls: 0,
      isOut: false,
    },
    isLoading: false,
    error: null,
  });
  const [gameContract, setGameContract] = useState<GameMatchContractClient>();

  useEffect(() => {
    const initContract = () => {
      const config = getAlgodConfigFromViteEnvironment();
      const algodClient = new Algodv2(config.token as string, config.server, config.port?.toString() || "");
      // Replace with actual deployed contract ID
      const CONTRACT_ID = 12345; // TODO: Replace with actual contract ID
      const contract = new GameMatchContractClient(CONTRACT_ID, algodClient, transactionSigner as any);
      setGameContract(contract);
    };

    initContract();
  }, [transactionSigner]);

  const generateRandomRun = () => {
    // Possible outcomes: 0, 1, 2, 3, 4, 6, or Out
    const outcomes = [0, 1, 2, 3, 4, 6, "Out"];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    return result;
  };

  const createNewMatch = async () => {
    if (!activeAddress || !gameContract) return;

    setGameState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const matchId = `match_${Date.now()}_${activeAddress.substring(0, 8)}`;
      await gameContract.createMatch(
        matchId,
        1, // entry fee
        activeAddress
      );
      const matchInfo = await gameContract.getMatch(matchId);

      setGameState((prev) => ({
        ...prev,
        matchId,
        matchInfo,
        isLoading: false,
        score: {
          runs: 0,
          balls: 0,
          isOut: false,
        },
      }));
    } catch (error) {
      console.error("Error creating match:", error);
      setGameState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to create match. Please try again.",
      }));
    }
  };

  const handleBat = async () => {
    if (!gameState.matchId || !activeAddress || !gameContract) return;
    if (gameState.score.balls >= 6 || gameState.score.isOut) return;

    setGameState((prev) => ({ ...prev, isLoading: true }));

    const runResult = generateRandomRun();
    const newScore = {
      runs: runResult === "Out" ? gameState.score.runs : gameState.score.runs + (runResult as number),
      balls: gameState.score.balls + 1,
      isOut: runResult === "Out",
    };

    setGameState((prev) => ({
      ...prev,
      score: newScore,
      isLoading: false,
    }));

    // If game is over, submit result to contract
    if (newScore.balls >= 6 || newScore.isOut) {
      try {
        await gameContract.submitResult(
          gameState.matchId,
          activeAddress, // winner
          activeAddress // submitter
        );
      } catch (error) {
        console.error("Error submitting result:", error);
        setGameState((prev) => ({
          ...prev,
          error: "Failed to save match result. Please try again.",
        }));
      }
    }
  };

  const handleNewGame = () => {
    createNewMatch();
  };

  const isGameOver = gameState.score.balls >= 6 || gameState.score.isOut;

  return (
    <motion.main className="min-h-screen py-12 px-4 bg-gradient-to-b from-green-400 via-green-600 to-sky-800">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden" style={{ boxShadow: "0 30px 60px rgba(8,64,24,0.12)" }}>
          {/* Pitch background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06),_transparent)] pointer-events-none" />

          <div className="p-8 backdrop-blur-sm bg-white/10 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-extrabold text-white drop-shadow">Cricket Arena</h1>
              <div className="text-sm text-white/90">
                Match: <span className="font-mono">{gameState.matchId?.substring(0, 8) ?? "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-start">
              <motion.div className="col-span-2 bg-white/8 rounded-2xl p-6" initial={{ y: 6 }} animate={{ y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-sky-100">Scoreboard</div>
                    <motion.div
                      key={gameState.score.runs}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 220 }}
                      className="text-4xl font-bold text-white mt-2"
                    >
                      {gameState.score.runs} runs
                    </motion.div>
                    <div className="text-sm text-white/80 mt-1">Balls: {gameState.score.balls}/6</div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        gameState.score.isOut ? "bg-red-200 text-red-800" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {gameState.score.isOut ? "OUT" : "Batting"}
                    </div>
                  </div>
                </div>

                <div className="h-48 rounded-lg bg-[linear-gradient(180deg,_#7be495,_#2aa36b)]/20 border border-white/6 flex items-center justify-center">
                  <div className="text-white/90 text-lg">Pitch visualization — feel the swing</div>
                </div>
              </motion.div>

              <div className="bg-white/6 rounded-2xl p-6 flex flex-col items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ rotate: -2, scale: 1.02 }}
                  onClick={handleBat}
                  disabled={isGameOver || gameState.isLoading}
                  className={`btn-cricket-giant ${gameState.isLoading || isGameOver ? "opacity-60 cursor-not-allowed" : "btn-glow"}`}
                >
                  {gameState.isLoading ? "..." : "BAT"}
                </motion.button>

                {isGameOver && (
                  <div className="mt-4 text-center">
                    <div className="text-white text-lg font-bold">Game Over</div>
                    <div className="text-white/90">Final Score: {gameState.score.runs}</div>
                    <button onClick={handleNewGame} className="mt-3 btn-cricket btn-cta">
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-white/80">
              <h3 className="font-semibold mb-2 text-white">How to Play</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Click the "BAT" button to face a ball</li>
                <li>Score 0, 1, 2, 3, 4, or 6 runs — or get out</li>
                <li>Game ends after 6 balls or when you're out</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
