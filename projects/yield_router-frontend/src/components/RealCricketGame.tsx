import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import RealCricketScene from "../scenes/RealCricketScene";

interface RealCricketGameProps {
  overs?: number;
  ballsPerOver?: number;
  maxWickets?: number;
  onInningsComplete?: (summary: { score: number; wickets: number; balls: number }) => void;
  onBallOutcome?: (meta: any) => void;
}

export default function RealCricketGame({
  overs = 2,
  ballsPerOver = 6,
  maxWickets = 3,
  onInningsComplete,
  onBallOutcome,
}: RealCricketGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [charge, setCharge] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<string>("—");
  const [overInfo, setOverInfo] = useState<{ over: number; score: number } | null>(null);
  const [inningsDone, setInningsDone] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = 480;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: "#051d24",
      physics: { default: "arcade" },
      scene: [RealCricketScene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    let scene: RealCricketScene | null = null;
    const attach = () => {
      try {
        scene = game.scene.getScene("RealCricketScene") as RealCricketScene;
        if (!scene) return;
        // events
        scene.events.on("scoreUpdate", (s: any) => {
          setScore(s.score);
          setWickets(s.wickets);
          setBalls(s.balls);
        });
        scene.events.on("chargeUpdate", (v: number) => setCharge(v));
        scene.events.on("outcome", (meta: any) => {
          setLastOutcome(meta.outcome.toUpperCase());
          onBallOutcome?.(meta);
        });
        scene.events.on("overComplete", (info: any) => setOverInfo(info));
        scene.events.on("inningsComplete", (summary: any) => {
          setInningsDone(true);
          onInningsComplete?.(summary);
        });
      } catch {}
    };

    game.events.once("ready", () => attach());
    const poll = setInterval(() => {
      if (scene) { clearInterval(poll); } else { attach(); }
    }, 150);

    // pass config data once scene is ready
    game.events.on("ready", () => {
      (scene as any)?.init({ overs, ballsPerOver, maxWickets });
    });

    return () => {
      try { clearInterval(poll); } catch {}
      try { game.destroy(true); } catch {}
      gameRef.current = null;
    };
  }, [overs, ballsPerOver, maxWickets, onInningsComplete, onBallOutcome]);

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Real Cricket Simulator</h2>
          <p className="text-xs text-gray-300">Hold SPACE to charge • 1/2/3 to change direction • Time your release near ball impact</p>
        </div>
        <div className="text-right text-sm text-gray-200">
          <div>Score: <span className="font-bold text-white">{score}</span> / Wkts: <span className="font-bold text-white">{wickets}</span></div>
          <div>Balls: <span className="font-bold text-white">{balls}</span></div>
        </div>
      </div>
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-gray-700 shadow-lg" style={{ height: 480 }} />
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="p-3 bg-black/40 rounded border border-gray-700">
          <div className="text-gray-400 text-xs">Charge</div>
          <div className="w-full h-3 bg-gray-700 rounded mt-1 overflow-hidden">
            <div style={{ width: `${charge * 100}%` }} className="h-full bg-gradient-to-r from-yellow-400 to-red-600"></div>
          </div>
          <div className="mt-2 text-xs text-gray-400">Last Outcome</div>
          <div className="text-lg font-semibold text-white">{lastOutcome}</div>
        </div>
        <div className="p-3 bg-black/40 rounded border border-gray-700">
          <div className="text-gray-400 text-xs">Run Rate</div>
          <div className="text-lg font-semibold text-white">{balls > 0 ? (score / (balls / 6)).toFixed(2) : "-"}</div>
          <div className="text-xs text-gray-400 mt-2">Combo</div>
          <div className="text-white">{/* Could surface combo later */}</div>
        </div>
        <div className="p-3 bg-black/40 rounded border border-gray-700">
          <div className="text-gray-400 text-xs">Over</div>
          <div className="text-lg font-semibold text-white">{Math.floor(balls / ballsPerOver) + 1}/{overs}</div>
          {overInfo && <div className="text-xs text-green-400 mt-1">Over {overInfo.over} done (Score {overInfo.score})</div>}
        </div>
        <div className="p-3 bg-black/40 rounded border border-gray-700">
          <div className="text-gray-400 text-xs">Status</div>
          <div className="text-lg font-semibold text-white">{inningsDone ? "Completed" : "In Progress"}</div>
        </div>
      </div>
    </div>
  );
}
