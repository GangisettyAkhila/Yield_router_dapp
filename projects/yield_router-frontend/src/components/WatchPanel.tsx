import * as React from "react";
import { useEffect, useState } from "react";
import StakeOnMatchForm from "./StakeOnMatchForm";

export default function WatchPanel() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [over, setOver] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isRunning && over < 20) {
      timer = setInterval(() => {
        setScoreA((s) => s + Math.floor(Math.random() * 7));
        setScoreB((s) => s + Math.floor(Math.random() * 7));
        setOver((o) => o + 1);
      }, 700);
    }
    if (over >= 20) setIsRunning(false);
    return () => clearInterval(timer);
  }, [isRunning, over]);

  return (
    <div className="watch-panel card" style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Watch Mode — Simulated Match</h3>
        <div>
          {!isRunning && over < 20 && (
            <button
              className="btn-cricket btn-glow"
              onClick={() => {
                setIsRunning(true);
              }}
            >
              Start Simulation
            </button>
          )}
          {isRunning && (
            <button className="btn-soft" onClick={() => setIsRunning(false)}>
              Pause
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Team A</div>
                <div className="muted">AI Batting</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{scoreA}</div>
                <div className="muted">{over} overs</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Team B</div>
                <div className="muted">AI Batting</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{scoreB}</div>
                <div className="muted">{over} overs</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: 320 }}>
          <div className="card" style={{ padding: 12 }}>
            <StakeOnMatchForm />
          </div>
        </div>
      </div>
    </div>
  );
}
