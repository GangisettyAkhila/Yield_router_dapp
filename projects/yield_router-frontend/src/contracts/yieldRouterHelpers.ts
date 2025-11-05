import type { YieldRouterContractClient } from './YieldRouterContract'

/**
 * Small helper functions wrapping the generated YieldRouterContract client.
 * These make it easier for UI components to read user tracking and claim yield.
 */

export async function fetchUserTracking(client: YieldRouterContractClient, address: string) {
  // Attempts an ABI call first, falls back to local state APIs
  try {
    if (client?.params?.getUserTracking) {
      const params = client.params.getUserTracking({ args: { forAccount: address }, onComplete: 0 })
      const res = await client.send.getUserTracking(params as any)
      return res?.return ?? null
    }
  } catch (err) {
    // ignore and try local state
  }

  if (client?.state?.local) {
    const s = await client.state.local(address).getAll()
    return {
      stakedAmount: s.stakedAmount ?? 0n,
      stakingTimestamp: s.stakingTimestamp ?? 0n,
      lastPlatform: s.lastPlatform ?? '',
      totalStakeCount: s.totalStakeCount ?? 0n,
      gameCredits: s.gameCredits ?? 0n,
      stakeCredits: s.stakeCredits ?? 0n,
    }
  }

  return null
}

export async function fetchPlatformApys(client: YieldRouterContractClient) {
  // Reads box map platformApys
  try {
    if (client?.state?.box?.platformApys?.getMap) {
      const map = await client.state.box.platformApys.getMap()
      const out: Record<string, bigint> = {}
      for (const [k, v] of map) out[k] = v
      return out
    }
  } catch (err) {
    return {}
  }
  return {}
}

export async function claimYieldAndRefresh(client: YieldRouterContractClient, address: string, currentTime: bigint | number) {
  // Call claimYield ABI and return new credits
  const params = client.params.claimYield({ args: { forAccount: address, currentTime }, onComplete: 0 })
  const res = await client.send.claimYield(params as any)
  // res.return expected [gameCreditsMint, stakeCreditsMint]
  return res?.return ?? [0n, 0n]
}

export default { fetchUserTracking, fetchPlatformApys, claimYieldAndRefresh }
