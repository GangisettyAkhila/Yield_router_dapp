# Dynamic DApp Features

This Yield Router Cricket DApp now includes dynamic, real-time features powered by Algorand smart contracts.

## 🎯 Dynamic Features Implemented

### 1. **Real-Time Contract Integration**
- Live user stats fetching from YieldRouter contract
- Dynamic platform APY updates
- Real-time staked amount tracking
- Game and stake credits display

### 2. **Live Match Updates**
- Auto-refreshing match list (5-second intervals)
- Live match status (pending, active, completed)
- Real-time score updates
- Dynamic staking on active matches

### 3. **Interactive Leaderboard**
- Top players ranking
- Win rate calculations
- Total rewards tracking
- Auto-refresh every 10 seconds

### 4. **Dynamic Home Page**
- Live Total Value Locked (TVL) display
- Active games counter
- Total rewards distributed
- Top 3 players preview
- Supported DeFi platforms with live APYs

## 📦 Setup Instructions

### 1. Configure Environment Variables

Copy `.env.template` to `.env` and update with your contract IDs:

```bash
cp .env.template .env
```

Edit `.env` and set your deployed contract IDs:
```env
VITE_APP_ID=your_yield_router_contract_id
VITE_GAME_CONTRACT_ID=your_game_contract_id
VITE_LEADERBOARD_CONTRACT_ID=your_leaderboard_contract_id
VITE_STAKE_MARKET_CONTRACT_ID=your_stake_market_contract_id
```

### 2. Deploy Smart Contracts

Before using the dynamic features, deploy your smart contracts to TestNet or LocalNet:

```bash
cd ../yield_router-contracts
algokit deploy
```

Note the deployed contract IDs and update your `.env` file.

### 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Run the Development Server

```bash
npm run dev
```

## 🔧 Custom Hooks

### `useYieldRouter(appId)`
Manages YieldRouter contract interactions:
- `userStats`: Current user's staking data
- `platforms`: Available DeFi platforms with APYs
- `stake(amount, platform)`: Stake ALGO on a platform
- `unstake(amount)`: Unstake ALGO
- `calculateRewards()`: Get pending rewards
- `claimYield()`: Claim accumulated yield
- `getRecommendedPlatform()`: Get AI-recommended platform

**Example:**
```tsx
const { userStats, stake, unstake, claimYield } = useYieldRouter(APP_ID);

// Stake 10 ALGO on Tinyman
await stake(10, 'Tinyman');

// Claim rewards
await claimYield();
```

### `useLiveMatches(appId, refreshInterval)`
Manages live cricket match data:
- `matches`: Array of live/pending/completed matches
- `refreshMatches()`: Manually refresh match list
- Auto-refreshes every `refreshInterval` ms (default: 5000)

**Example:**
```tsx
const { matches, loading } = useLiveMatches(APP_ID, 5000);

{matches.map(match => (
  <div key={match.id}>
    {match.playerA} vs {match.playerB} - {match.status}
  </div>
))}
```

### `useLeaderboard(appId, limit, refreshInterval)`
Manages leaderboard data:
- `leaderboard`: Top players by total staked
- `refreshLeaderboard()`: Manually refresh data
- Auto-refreshes every `refreshInterval` ms (default: 10000)

**Example:**
```tsx
const { leaderboard } = useLeaderboard(APP_ID, 10, 10000);

{leaderboard.map(entry => (
  <div key={entry.address}>
    #{entry.rank} {entry.address} - {entry.totalStaked} ALGO
  </div>
))}
```

## 🎮 Dynamic Pages

### Home Page (`/`)
- **Live Stats**: TVL, Active Games, Total Rewards
- **Top 3 Leaderboard**: Real-time top players
- **Platform List**: Available DeFi platforms with APYs
- Auto-updates when wallet connects

### Watch & Stake (`/stake`)
- **User Stats Card**: Your staked amount, game credits, stake credits
- **Live Match Grid**: Real-time match updates
- **Interactive Staking**: Stake on Player A or B
- **Match Filters**: Active, Pending, Completed
- Auto-refreshing match data

### Play Cricket (`/play`)
- Dynamic game state management
- Real-time score updates
- Contract integration for match creation
- Result submission to blockchain

## 🔄 Real-Time Updates

The DApp uses interval-based polling for real-time updates:

- **Matches**: Refresh every 5 seconds
- **Leaderboard**: Refresh every 10 seconds
- **User Stats**: Refresh after each transaction
- **Platform APYs**: Fetch on mount and after updates

## 🎨 Dynamic UI Components

All components use Framer Motion for smooth animations:
- Staggered list animations
- Hover effects on cards
- Loading states
- Success/Error notifications
- Modal transitions

## 🚀 Next Steps

To make the DApp fully dynamic:

1. **Deploy Contracts**: Deploy YieldRouter, GameMatch, and Leaderboard contracts
2. **Update Contract IDs**: Add deployed IDs to `.env`
3. **Opt-in Users**: Users must opt-in to the app before staking
4. **Fund Contract**: Ensure contract has ALGO for rewards
5. **Update Platform APYs**: Call `update_platform_apy` for each platform

## 📝 Contract Methods Used

### YieldRouter Contract
- `stake()`: Stake ALGO on a platform
- `unstake()`: Withdraw staked ALGO
- `calculate_rewards()`: Calculate pending rewards
- `claim_yield()`: Claim game and stake credits
- `get_user_tracking()`: Fetch user stats
- `get_recommended_platform()`: Get AI recommendation
- `update_platform_apy()`: Admin method to update APYs

### State Access
- **Global State**: `platform_list`, platform APYs
- **Local State**: `staked_amount`, `staking_timestamp`, `last_platform`, `total_stake_count`, `game_credits`, `stake_credits`
- **Box Storage**: Platform APY mappings

## 🛠️ Customization

### Adjust Refresh Intervals
```tsx
// Faster updates (3 seconds)
const { matches } = useLiveMatches(APP_ID, 3000);

// Slower updates (30 seconds)
const { leaderboard } = useLeaderboard(APP_ID, 10, 30000);
```

### Mock Data Toggle
Currently using mock data for matches and leaderboard. To use real contract data:

1. Deploy game_match_contract.py
2. Update `useLiveMatches.ts` to fetch from contract
3. Update `useLeaderboard.ts` to use leaderboard_contract.py

### Custom Platforms
Add more platforms by calling `update_platform_apy`:
```tsx
await client.send.updatePlatformApy({
  args: {
    platform: 'NewPlatform',
    apy: BigInt(750), // 7.5% = 750 basis points
  },
});
```

## 🔐 Security Notes

- All transactions require wallet signature
- Contract validates payment amounts
- APY updates should be admin-gated
- Always verify transaction details before signing

## 📊 Performance

- Minimal re-renders using React hooks
- Efficient state management
- Debounced user input
- Optimized re-fetch logic
- Cached contract instances

---

**Built with**: React, TypeScript, Vite, Algorand SDK, AlgoKit, Framer Motion
