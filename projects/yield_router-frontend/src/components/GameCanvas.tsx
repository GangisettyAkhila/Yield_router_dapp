import * as React from "react";
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import GameScene from "../scenes/GameScene";

interface GameCanvasProps {
  onGameComplete?: (score: number) => void;
}

export default function GameCanvas({ onGameComplete }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 450;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: "#0c4a6e",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 600 },
          debug: false,
        },
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const onScore = (s: number) => setScore(s);
    const onGameOver = (val: boolean) => setGameOver(val);
    const onFinalScore = (s: number) => {
      setFinalScore(s);
      if (onGameComplete) {
        onGameComplete(s);
      }
    };

    // Helper to attach to the scene safely when available
    let attachedScene: any = null;
    const tryAttach = () => {
      try {
        const s = (game.scene.getScene("GameScene") as any) || null;
        if (s && s.events) {
          s.events.on("score", onScore);
          s.events.on("gameover", onGameOver);
          s.events.on("finalscore", onFinalScore);
          attachedScene = s;
          return true;
        }
      } catch {
        // getScene may throw before registration; ignore and retry
      }
      return false;
    };

    // Attach when the game signals ready
    game.events.once("ready", () => {
      tryAttach();
    });

    // Poll briefly as a fallback in case ordering differs
    const attachTimer = setInterval(() => {
      if (tryAttach()) {
        clearInterval(attachTimer);
      }
    }, 100);

    return () => {
      try {
        if (attachedScene && attachedScene.events) {
          attachedScene.events.off("score", onScore);
          attachedScene.events.off("gameover", onGameOver);
          attachedScene.events.off("finalscore", onFinalScore);
        }
      } catch (e) {
        console.error("Error cleaning up game events:", e);
      }
      try { clearInterval((attachTimer as unknown) as number); } catch {}
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onGameComplete]);

  const handleRetry = () => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene("GameScene") as any;
    if (scene && scene.scene && typeof scene.scene.restart === "function") {
      scene.scene.restart();
      setGameOver(false);
      setScore(0);
      setFinalScore(0);
    }
  };

  return (
    <div className="game-canvas-container">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold text-white">Cricket Arena 🏏</div>
        <div className="flex gap-4 items-center">
          <div className="text-white/90">
            Live Score: <strong className="text-2xl text-emerald-400">{score}</strong>
          </div>
          {gameOver && (
            <button 
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
              onClick={handleRetry}
            >
              Play Again
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden shadow-2xl"
        style={{ height: 450, background: "linear-gradient(180deg, #0c4a6e, #164e63)" }}
      />
      {gameOver && finalScore > 0 && (
        <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-center">
          <div className="text-white text-lg">
            🎉 Game Complete! Final Score: <strong className="text-2xl text-emerald-400">{finalScore}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
