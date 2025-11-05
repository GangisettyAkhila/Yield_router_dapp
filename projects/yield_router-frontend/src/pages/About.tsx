import * as React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">About Yield Router Gaming</h1>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">What is Yield Router?</h2>
            <p className="text-gray-600 leading-relaxed">
              Yield Router is a decentralized gaming platform built on Algorand that combines casual gaming with DeFi elements. Players can
              participate in cricket matches or stake their ALGO tokens on other players' games.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">🏏 Play Cricket</h3>
                <p className="text-gray-600">
                  Join matches, play a simple cricket game, and compete with other players. Your match results are stored on the Algorand
                  blockchain.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">💰 Watch & Stake</h3>
                <p className="text-gray-600">
                  Spectate live matches and stake your ALGO tokens on players you think will win. Earn rewards when your chosen player is
                  victorious.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">🔒 Smart Contracts</h3>
                <p className="text-gray-600">
                  All game mechanics, staking, and reward distribution are handled by secure Algorand smart contracts built with AlgoPy.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Technical Stack</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Frontend: React + TypeScript + TailwindCSS</li>
              <li>Wallet Integration: @txnlab/use-wallet-react</li>
              <li>Smart Contracts: AlgoPy (Beaker Framework)</li>
              <li>Deployment: Algorand TestNet</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
