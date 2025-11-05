import * as React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useState, useEffect } from "react";
import { MatchInfo } from "../contracts/GameMatchContract";
import { motion } from "framer-motion";

interface StakeFormData {
  amount: number;
  playerId: string;
}

export default function WatchStake() {
  const { activeAddress } = useWallet();
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [stakeForm, setStakeForm] = useState<StakeFormData>({
    amount: 0,
    playerId: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchInfo | null>(null);

  useEffect(() => {
    // In future: Fetch real matches from smart contract
    const fetchMatches = async () => {
      // Placeholder data
      const mockMatches: MatchInfo[] = [
        {
          id: 1,
          playerA: "0x123...abc",
          playerB: "0x456...def",
          entryFee: 1,
          status: "active",
        },
        {
          id: 2,
          playerA: "0x789...ghi",
          playerB: "0xabc...jkl",
          entryFee: 2,
          status: "active",
        },
      ];
      setMatches(mockMatches);
    };
    fetchMatches();
  }, []);

  const handleStakeSubmit = async (matchId: number, playerId: string) => {
    try {
      // Future: Call smart contract
      console.log(`Staking ${stakeForm.amount} ALGO on player ${playerId} in match ${matchId}`);
      alert("Stake placed successfully! (Mock)");
    } catch (error) {
      console.error("Staking error:", error);
      alert("Error placing stake");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Watch & Stake</h1>
          <p className="text-gray-600 mt-2">Watch live matches and stake on players</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <motion.div key={match.id} className="card p-6" whileHover={{ y: -6 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Match #{match.id}</h3>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">{match.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-white/60">
                  <div className="text-sm text-sky-800 mb-1">Player A</div>
                  <div className="font-medium">{match.playerA}</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-white/60">
                  <div className="text-sm text-sky-800 mb-1">Player B</div>
                  <div className="font-medium">{match.playerB}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="mb-2 text-sm text-sky-700">Stake small amounts to back a player</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="btn-cricket btn-glow"
                    onClick={() => {
                      setSelectedMatch(match);
                      setModalOpen(true);
                    }}
                  >
                    Stake on A
                  </button>
                  <button
                    className="btn-cricket btn-glow"
                    onClick={() => {
                      setSelectedMatch(match);
                      setModalOpen(true);
                    }}
                  >
                    Stake on B
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No active matches found</p>
          </div>
        )}

        {/* Stake Modal */}
        {modalOpen && selectedMatch && (
          <div className="modal modal-open">
            <motion.div className="modal-box" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}>
              <h3 className="modal-title">Stake on Match #{selectedMatch.id}</h3>
              <p className="modal-subtitle">Enter amount of ALGO to stake on the selected player.</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ALGO)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border rounded-md"
                  value={stakeForm.amount}
                  onChange={(e) => setStakeForm({ ...stakeForm, amount: parseFloat(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button className="btn-soft" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn-cricket btn-cta"
                  onClick={() => {
                    if (selectedMatch) {
                      handleStakeSubmit(selectedMatch.id as number, selectedMatch.playerA);
                      setModalOpen(false);
                    }
                  }}
                >
                  Confirm Stake
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
