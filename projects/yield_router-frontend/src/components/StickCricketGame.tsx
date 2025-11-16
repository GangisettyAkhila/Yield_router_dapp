import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import StickCricketScene from "../scenes/StickCricketScene";

interface StickCricketGameProps {
  onGameComplete: (score: number) => void;
  overs?: number;
  ballsPerOver?: number;
  maxWickets?: number;
}

export default function StickCricketGame({
  onGameComplete,
  overs = 2,
  ballsPerOver = 6,
  maxWickets = 3,
}: StickCricketGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [powerCharge, setPowerCharge] = useState(0);
  const [lastOutcome, setLastOutcome] = useState("");
  const [combo, setCombo] = useState(1);
  const [currentBall, setCurrentBall] = useState(0);
  const [inningsDone, setInningsDone] = useState(false);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 600,
      backgroundColor: "#1e293b",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: StickCricketScene,
    };

    phaserGameRef.current = new Phaser.Game(config);

    const attachEventListeners = () => {
      const scene = phaserGameRef.current?.scene.getScene(
        "StickCricketScene"
      ) as StickCricketScene | undefined;

      if (!scene) {
        setTimeout(attachEventListeners, 100);
        return;
      }

      scene.scene.start("StickCricketScene", { overs, ballsPerOver, maxWickets });

      scene.events.on("scoreUpdate", (data: any) => {
        setScore(data.score);
        setWickets(data.wickets);
        setBalls(data.balls);
        setCombo(data.combo || 1);
      });

      scene.events.on("chargeUpdate", (charge: number) => {
        setPowerCharge(charge);
      });

      scene.events.on("outcome", (data: any) => {
        const outcomeText =
          data.outcome === "six"
            ? "🚀 SIX!"
            : data.outcome === "four"
            ? "🔥 FOUR!"
            : data.outcome === "three"
            ? "Three runs"
            : data.outcome === "double"
            ? "Two runs"
            : data.outcome === "single"
            ? "Single"
            : data.outcome === "wicket"
            ? "❌ WICKET!"
            : data.outcome === "miss"
            ? "Missed"
            : "Dot ball";

        setLastOutcome(outcomeText);

        setTimeout(() => setLastOutcome(""), 2000);
      });

      scene.events.on("delivery", (data: any) => {
        setCurrentBall(data.ball);
        setPowerCharge(0);
      });

      scene.events.on("inningsComplete", (data: any) => {
        setInningsDone(true);
        setTimeout(() => {
          onGameComplete(data.score);
        }, 1500);
      });
    };

    attachEventListeners();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [onGameComplete, overs, ballsPerOver, maxWickets]);

  const handleRetry = () => {
    if (phaserGameRef.current) {
      const scene = phaserGameRef.current.scene.getScene(
        "StickCricketScene"
      ) as StickCricketScene | undefined;

      if (scene) {
        scene.scene.restart({ overs, ballsPerOver, maxWickets });
        setScore(0);
        setWickets(0);
        setBalls(0);
        setPowerCharge(0);
        setLastOutcome("");
        setCombo(1);
        setCurrentBall(0);
        setInningsDone(false);
      }
    }
  };

  const currentOver = Math.floor(balls / ballsPerOver);
  const ballInOver = balls % ballsPerOver;
  const runsPerOver = balls > 0 ? (score / (balls / ballsPerOver)).toFixed(1) : "0.0";

  const getPowerColor = () => {
    if (powerCharge < 0.3) return "bg-gray-400";
    if (powerCharge < 0.5) return "bg-yellow-400";
    if (powerCharge < 0.7) return "bg-orange-400";
    if (powerCharge < 0.9) return "bg-red-400";
    return "bg-purple-500";
  };

  const getPowerLabel = () => {
    if (powerCharge < 0.3) return "Weak";
    if (powerCharge < 0.5) return "Good";
    if (powerCharge < 0.7) return "Strong";
    if (powerCharge < 0.9) return "Power";
    return "MAX!";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <div className="grid grid-cols-4 gap-4 text-center text-white">
            <div>
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-sm opacity-80">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{wickets}/{maxWickets}</div>
              <div className="text-sm opacity-80">Wickets</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {currentOver}.{ballInOver}
              </div>
              <div className="text-sm opacity-80">Overs</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{runsPerOver}</div>
              <div className="text-sm opacity-80">Run Rate</div>
            </div>
          </div>
        </div>

        {/* Combo Display */}
        {combo > 1 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 py-2 text-center">
            <span className="text-white font-bold text-lg">
              🔥 COMBO x{combo}! 🔥
            </span>
          </div>
        )}

        {/* Game Canvas */}
        <div className="relative">
          <div ref={gameRef} className="w-full" />

          {/* Outcome Overlay */}
          {lastOutcome && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-black bg-opacity-75 px-8 py-4 rounded-lg border-4 border-yellow-400 animate-bounce">
                <p className="text-4xl font-bold text-white text-center drop-shadow-lg">
                  {lastOutcome}
                </p>
              </div>
            </div>
          )}

          {/* Innings Complete Overlay */}
          {inningsDone && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-2xl border-4 border-yellow-400 text-center shadow-2xl">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Innings Complete!
                </h2>
                <p className="text-6xl font-bold text-yellow-300 mb-2">
                  {score}
                </p>
                <p className="text-xl text-white mb-6">
                  {wickets}/{maxWickets} wickets • {balls} balls
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Power Charge Bar */}
        <div className="bg-slate-800 p-4 border-t-2 border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold min-w-[80px]">
              Power: {getPowerLabel()}
            </span>
            <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden border-2 border-slate-600">
              <div
                className={`h-full transition-all duration-100 ${getPowerColor()}`}
                style={{ width: `${powerCharge * 100}%` }}
              />
            </div>
            <span className="text-white font-mono min-w-[50px] text-right">
              {Math.round(powerCharge * 100)}%
            </span>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="bg-slate-900 p-4 border-t-2 border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
            <div className="text-center">
              <div className="bg-blue-600 text-white px-3 py-1 rounded mb-1 font-mono">
                ← →
              </div>
              <div>Move Bat</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white px-3 py-1 rounded mb-1 font-mono">
                MOUSE
              </div>
              <div>Aim Bat</div>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white px-3 py-1 rounded mb-1 font-mono">
                SPACE
              </div>
              <div>Hold to Charge</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 text-white px-3 py-1 rounded mb-1 font-mono">
                Q/W/E
              </div>
              <div>Special Shots</div>
            </div>
          </div>
        </div>

        {/* Shot Type Guide */}
        <div className="bg-slate-800 p-4 border-t border-slate-700">
          <h3 className="text-white font-bold mb-2 text-center">Special Shots</h3>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
            <div className="bg-slate-700 p-2 rounded text-center">
              <div className="text-yellow-400 font-bold mb-1">Q - Lofted</div>
              <div>High power shot</div>
            </div>
            <div className="bg-slate-700 p-2 rounded text-center">
              <div className="text-blue-400 font-bold mb-1">W - Cut</div>
              <div>Precise placement</div>
            </div>
            <div className="bg-slate-700 p-2 rounded text-center">
              <div className="text-orange-400 font-bold mb-1">E - Pull</div>
              <div>Aggressive shot</div>
            </div>
          </div>
        </div>

        {/* Retry Button */}
        {!inningsDone && (
          <div className="bg-slate-900 p-4 border-t border-slate-700 text-center">
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              🔄 Restart Game
            </button>
          </div>
        )}
      </div>

      {/* Ball Indicator */}
      <div className="mt-4 text-center">
        <div className="inline-block bg-slate-800 px-6 py-3 rounded-lg border-2 border-blue-500">
          <span className="text-white font-bold">
            Ball {currentBall > 0 ? currentBall : 1} of {overs * ballsPerOver}
          </span>
        </div>
      </div>
    </div>
  );
}
