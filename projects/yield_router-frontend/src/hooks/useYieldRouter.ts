import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

export interface UserStats {
  stakedAmount: bigint;
  stakingTimestamp: bigint;
  lastPlatform: string;
  totalStakeCount: bigint;
  gameCredits: bigint;
  stakeCredits: bigint;
}

export interface PlatformData {
  name: string;
  apy: bigint;
}

// Mock hook for demonstration - replace with actual contract integration when deployed
export function useYieldRouter(appId?: number) {
  const { activeAddress } = useWallet();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real user stats from contract
  useEffect(() => {
    if (!activeAddress) return;
    
    const loadUserStats = async () => {
      if (!appId || appId === 0) {
        // Demo mode - use localStorage
        const stored = localStorage.getItem(`user_stats_${activeAddress}`);
        if (stored) {
          setUserStats(JSON.parse(stored, (key, value) => 
            typeof value === 'string' && value.match(/^\d+n$/) ? BigInt(value.slice(0, -1)) : value
          ));
        } else {
          const demoStats = {
            stakedAmount: BigInt(5000000),
            stakingTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
            lastPlatform: 'Tinyman',
            totalStakeCount: BigInt(3),
            gameCredits: BigInt(10),
            stakeCredits: BigInt(50),
          };
          localStorage.setItem(`user_stats_${activeAddress}`, JSON.stringify(demoStats, (_, v) => 
            typeof v === 'bigint' ? v.toString() + 'n' : v
          ));
          setUserStats(demoStats);
        }
        return;
      }

      try {
        // Real contract call using YieldRouterContract client
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
        const appInfo = await algodClient.getApplicationByID(appId).do();
        const localState = appInfo.params?.['local-states']?.find(
          (ls: any) => algosdk.encodeAddress(Buffer.from(ls.key, 'base64')) === activeAddress
        );

        if (localState) {
          const state = localState['key-value'] || [];
          const getValue = (key: string) => {
            const item = state.find((kv: any) => Buffer.from(kv.key, 'base64').toString() === key);
            return item ? BigInt(item.value.uint || 0) : BigInt(0);
          };
          const getStringValue = (key: string) => {
            const item = state.find((kv: any) => Buffer.from(kv.key, 'base64').toString() === key);
            return item ? Buffer.from(item.value.bytes || '', 'base64').toString() : '';
          };

          setUserStats({
            stakedAmount: getValue('staked_amt'),
            stakingTimestamp: getValue('stake_time'),
            lastPlatform: getStringValue('platform'),
            totalStakeCount: getValue('stake_count'),
            gameCredits: getValue('game_credits'),
            stakeCredits: getValue('stake_credits'),
          });
        }
      } catch (err) {
        console.error('Failed to fetch user stats from contract:', err);
      }
    };

    loadUserStats();
    
    // Mock platforms with APYs (can be fetched from contract box storage)
    setPlatforms([
      { name: 'Tinyman', apy: BigInt(650) },
      { name: 'Messina', apy: BigInt(720) },
      { name: 'FolksFinance', apy: BigInt(580) },
    ]);
  }, [activeAddress, appId]);

  // Fetch user stats (mock)
  const fetchUserStats = useCallback(async () => {
    if (!activeAddress) return;
    setLoading(true);
    
    try {
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserStats(prev => prev || {
        stakedAmount: BigInt(5000000),
        stakingTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
        lastPlatform: 'Tinyman',
        totalStakeCount: BigInt(3),
        gameCredits: BigInt(10),
        stakeCredits: BigInt(50),
      });
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
      setError(err.message || 'Failed to fetch user stats');
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  // Fetch platforms (mock)
  const fetchPlatforms = useCallback(async () => {
    try {
      setPlatforms([
        { name: 'Tinyman', apy: BigInt(650) },
        { name: 'Messina', apy: BigInt(720) },
        { name: 'FolksFinance', apy: BigInt(580) },
      ]);
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    }
  }, []);

  // Stake function (mock)
  const stake = useCallback(async (amount: number, platform: string) => {
    if (!activeAddress) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock stats
      setUserStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          stakedAmount: prev.stakedAmount + BigInt(amount * 1e6),
          lastPlatform: platform,
          totalStakeCount: prev.totalStakeCount + BigInt(1),
          gameCredits: prev.gameCredits + BigInt(Math.floor(amount / 10)), // 1 credit per 10 ALGO
          stakeCredits: prev.stakeCredits + BigInt(Math.floor(amount * 2)),
        };
      });
      
      return { txId: 'mock-tx-id', confirmation: {} };
    } catch (err: any) {
      console.error('Stake failed:', err);
      setError(err.message || 'Failed to stake');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  // Unstake function (mock)
  const unstake = useCallback(async (amount: number) => {
    if (!activeAddress) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          stakedAmount: prev.stakedAmount - BigInt(amount * 1e6),
        };
      });
      
      return { txId: 'mock-tx-id', confirmation: {} };
    } catch (err: any) {
      console.error('Unstake failed:', err);
      setError(err.message || 'Failed to unstake');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress]);

  // Calculate rewards (mock)
  const calculateRewards = useCallback(async () => {
    if (!activeAddress) return BigInt(0);
    
    try {
      // Mock calculation based on staked amount and time
      const stakedAmount = userStats?.stakedAmount || BigInt(0);
      const timeDiff = BigInt(Math.floor(Date.now() / 1000)) - (userStats?.stakingTimestamp || BigInt(0));
      const rewards = (stakedAmount * BigInt(650) * timeDiff) / BigInt(31536000000); // APY calculation
      
      return rewards;
    } catch (err) {
      console.error('Failed to calculate rewards:', err);
      return BigInt(0);
    }
  }, [activeAddress, userStats]);

  // Claim yield (mock)
  const claimYield = useCallback(async () => {
    if (!activeAddress) {
      throw new Error('Wallet not connected');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const rewards = await calculateRewards();
      const gameCredits = rewards / BigInt(2);
      const stakeCredits = rewards - gameCredits;
      
      setUserStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          gameCredits: prev.gameCredits + gameCredits,
          stakeCredits: prev.stakeCredits + stakeCredits,
          stakingTimestamp: BigInt(Math.floor(Date.now() / 1000)),
        };
      });
      
      return { txId: 'mock-tx-id', confirmation: {}, gameCredits, stakeCredits };
    } catch (err: any) {
      console.error('Claim yield failed:', err);
      setError(err.message || 'Failed to claim yield');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeAddress, calculateRewards]);

  // Get recommended platform (mock)
  const getRecommendedPlatform = useCallback(async () => {
    if (!activeAddress) return '';
    
    try {
      // Return highest APY platform
      const best = platforms.reduce((prev, curr) => 
        curr.apy > prev.apy ? curr : prev, 
        platforms[0]
      );
      return best?.name || '';
    } catch (err) {
      console.error('Failed to get recommended platform:', err);
      return '';
    }
  }, [activeAddress, platforms]);

  return {
    client: null, // No actual client in mock version
    userStats,
    platforms,
    loading,
    error,
    stake,
    unstake,
    calculateRewards,
    claimYield,
    getRecommendedPlatform,
    refreshUserStats: fetchUserStats,
    refreshPlatforms: fetchPlatforms,
  };
}
