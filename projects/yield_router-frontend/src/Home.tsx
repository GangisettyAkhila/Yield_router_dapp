import * as React from "react";
import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";

import MatchList from "./components/MatchList";
import StakeOnMatchForm from "./components/StakeOnMatchForm";
import LeaderboardTable from "./components/LeaderboardTable";
import ConnectWallet from "./components/ConnectWallet";

import Navbar from "./components/Navbar";
import GameCanvas from "./components/GameCanvas";
import WatchPanel from "./components/WatchPanel";

export default function Home() {
  const { activeAddress } = useWallet();
  const [mode, setMode] = useState<"dashboard" | "play" | "watch">("dashboard");
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* Hero */}
      <header id="hero-section" className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-400">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-xl shadow-lg"
                style={{ background: "linear-gradient(135deg,#6b4ce6,#00b894)" }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="mt-6 text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Yield Router — Play & Stake on Algorand
              </h1>
              <p className="mt-4 text-indigo-100 max-w-xl text-lg sm:text-xl">
                Grow your stake while cheering for your favourite players — playful gaming meets minimal DeFi on Algorand.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center px-5 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition"
                  onClick={() => setMode("play")}
                >
                  Play Cricket
                </button>

                <button
                  className="inline-flex items-center px-4 py-3 border border-white/40 text-white font-medium rounded-lg hover:bg-white/10 transition"
                  onClick={() => setMode("watch")}
                >
                  Watch & Stake
                </button>
              </div>
            </div>

            <div className="w-full">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-inner">
                <div className="text-white font-medium">Quick Preview</div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/6 rounded-lg">
                    <div className="text-sm text-indigo-50">Mode</div>
                    <div className="mt-1 font-semibold text-white capitalize">{mode}</div>
                  </div>
                  <div className="p-4 bg-white/6 rounded-lg">
                    <div className="text-sm text-indigo-50">Wallet</div>
                    <div className="mt-1 font-semibold text-white">
                      {activeAddress
                        ? `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}`
                        : "Not connected"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <Navbar />

        {/* Gaming Arena */}
        <section id="gaming-section" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gaming Arena</h2>
                  <p className="text-sm text-slate-500">Play locally or watch a simulated match.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${
                      mode === "play" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                    onClick={() => setMode("play")}
                  >
                    Play
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${
                      mode === "watch" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                    onClick={() => setMode("watch")}
                  >
                    Watch
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-sm ${
                      mode === "dashboard" ? "border border-slate-300" : "bg-slate-100 text-slate-700"
                    }`}
                    onClick={() => setMode("dashboard")}
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="mt-6">{mode === "play" ? <GameCanvas /> : mode === "watch" ? <WatchPanel /> : <MatchList />}</div>

              <div className="mt-6">
                <StakeOnMatchForm />
              </div>
            </div>

            <aside className="bg-white rounded-2xl shadow p-6">
              <h3 className="text-lg font-bold">Leaderboard</h3>
              <div className="mt-4 overflow-x-auto">
                <LeaderboardTable />
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
