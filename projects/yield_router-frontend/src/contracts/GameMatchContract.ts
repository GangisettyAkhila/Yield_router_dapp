/*
  Lightweight typed wrapper for GameMatchContract client used by the frontend UI.
  This file provides a small adapter around a generated / external app client so UI
  components can call a consistent API without depending on a specific generator.

  The wrapper expects an underlying `appClient` that exposes `send` and/or `params`
  for ABI calls. If you later generate an Algokit client for GameMatchContract,
  you can replace usage with the generated client or adapt this wrapper.
*/

export type MatchInfo = {
  id: number
  playerA: string
  playerB: string
  entryFee: number
  status: string
  winner?: string
}

export class GameMatchContractClient {
  private appClient: any

  constructor(appClient: any) {
    this.appClient = appClient
  }

  // Create a match (host). Returns the tx result or created match id.
  async createMatch(params: any) {
    if (this.appClient?.send?.createMatch) return await this.appClient.send.createMatch(params)
    if (this.appClient?.send) return await this.appClient.send(params)
    throw new Error('GameMatch app client does not expose createMatch')
  }

  // Join an existing match
  async joinMatch(params: any) {
    if (this.appClient?.send?.joinMatch) return await this.appClient.send.joinMatch(params)
    if (this.appClient?.send) return await this.appClient.send(params)
    throw new Error('GameMatch app client does not expose joinMatch')
  }

  // Submit match result (by oracle/referee)
  async submitResult(params: any) {
    if (this.appClient?.send?.submitResult) return await this.appClient.send.submitResult(params)
    if (this.appClient?.send) return await this.appClient.send(params)
    throw new Error('GameMatch app client does not expose submitResult')
  }

  // Read-only helper: get match info
  async getMatch(matchId: number): Promise<MatchInfo | null> {
    // Prefer ABI call `getMatch` if available
    if (this.appClient?.params?.getMatch) {
      const call = this.appClient.params.getMatch({ args: [matchId], onComplete: 0 })
      const result = await this.appClient.send(call)
      return result?.return ?? null
    }
    if (this.appClient?.send?.getMatch) {
      const result = await this.appClient.send.getMatch({ matchId })
      return result?.return ?? null
    }
    // If direct REST or indexer lookup is wired in higher layers, return null here
    return null
  }

  // Read-only helper: get player credits (game credits / stake credits)
  async getPlayerCredits(address: string): Promise<{ gameCredits: number; stakeCredits: number } | null> {
    if (this.appClient?.params?.getUserTracking) {
      const call = this.appClient.params.getUserTracking({ args: [address], onComplete: 0 })
      const res = await this.appClient.send(call)
      const data = res?.return
      if (!data) return null
      // Expect [stakedAmount, stakingTimestamp, lastPlatform, totalStakeCount, gameCredits, stakeCredits]
      return {
        gameCredits: Number(data[4] ?? 0),
        stakeCredits: Number(data[5] ?? 0),
      }
    }
    if (this.appClient?.state?.local) {
      const st = await this.appClient.state.local(address).getAll()
      return { gameCredits: Number(st.game_credits ?? 0), stakeCredits: Number(st.stake_credits ?? 0) }
    }
    return null
  }
}
