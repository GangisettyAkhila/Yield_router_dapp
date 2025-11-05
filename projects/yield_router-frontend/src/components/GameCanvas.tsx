import * as React from "react";
import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import GameScene from "../scenes/GameScene";

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 400;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: "#f8fafc",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 400 },
          debug: false,
        },
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const scene = game.scene.getScene("GameScene") as any;

    const onScore = (s: number) => setScore(s);
    const onGameOver = (val: boolean) => setGameOver(val);

    // scene may not be ready immediately
    game.events.once("ready", () => {
      scene.events.on("score", onScore);
      scene.events.on("gameover", onGameOver);
    });

    // Fallback: try to attach after a short delay
    setTimeout(() => {
      if (scene && scene.events) {
        scene.events.on("score", onScore);
        scene.events.on("gameover", onGameOver);
      }
    }, 300);

    return () => {
      try {
        if (scene && scene.events) {
          scene.events.off("score", onScore);
          scene.events.off("gameover", onGameOver);
        }
      } catch (e) {}
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const handleRetry = () => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene("GameScene") as any;
    if (scene && scene.scene && typeof scene.scene.restart === "function") {
      scene.scene.restart();
      setGameOver(false);
      setScore(0);
    }
  };

  return (
    <div className="game-canvas card" style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Cricket Mini-Game</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="muted">
            Score: <strong>{score}</strong>
          </div>
          {gameOver && (
            <button className="btn-cricket btn-soft" onClick={handleRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        style={{ width: "100%", height: 360, borderRadius: 8, overflow: "hidden", background: "linear-gradient(#e6eef8,#f8fafc)" }}
      />
    </div>
  );
}
