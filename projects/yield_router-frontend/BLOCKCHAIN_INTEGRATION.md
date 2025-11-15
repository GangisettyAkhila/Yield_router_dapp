# Blockchain Integration Guide

## Overview
This document describes how the Yield Router DApp integrates with Algorand smart contracts and provides instructions for deploying and connecting the contracts.

## Smart Contracts

### 1. YieldRouterContract (Main Contract)
- **Purpose**: Manages staking, yield calculation, and platform routing
- **Location**: `yield_router-contracts/smart_contracts/yield_router/contract.py`
- **Key Methods**:
  - `stake(payment, contract_address, for_account, amount, timestamp, platform)` - Stake ALGO on a platform
  - `unstake(for_account, amount, timestamp)` - Unstake ALGO
  - `claim_yield(for_account, current_time)` - Claim accumulated yield
  - `calculate_rewards(for_account, current_time)` - Calculate pending rewards
  - `get_user_tracking(for_account)` - Get user stats
  - `get_recommended_platform(for_account)` - Get best platform based on APY

### 2. GameMatchContract
- **Purpose**: Manages peer-to-peer cricket matches
- **Location**: `yield_router-contracts/smart_contracts/game_match_contract.py`
- **Key Methods**:
  - `create_match(match_id, entry_fee, creator)` - Create a new match
  - `join_match(match_id, player)` - Join an existing match
  - `submit_result(match_id, winner, submitter)` - Submit match result
  - `get_match(match_id)` - Get match details
  - `get_player_credits(player)` - Get player game credits

### 3. StakeMarketContract
- **Purpose**: Enables staking on match outcomes
- **Location**: `yield_router-contracts/smart_contracts/stake_market_contract.py`
- **Key Methods**:
  - `stake_on_match(payment, match_id, predicted_winner, staker, amount)` - Stake on a player
  - `resolve_stakes(match_id, actual_winner)` - Distribute rewards after match
  - `get_total_stakes(match_id)` - Get total stake pools
  - `get_staker_credits(staker)` - Get staker rewards

### 4. LeaderboardContract
- **Purpose**: Tracks player and staker statistics
- **Location**: `yield_router-contracts/smart_contracts/leaderboard_contract.py`
- **Key Methods**:
  - `update_player_stats(player, wins, yield_earned, games)` - Update player stats
  - `update_staker_stats(staker, stakes, successful_stakes, roi)` - Update staker stats
  - `get_player_stats(player)` - Get player stats
  - `get_top_players(limit)` - Get leaderboard

## Deployment Steps

### 1. Deploy Smart Contracts

```bash
# Navigate to contracts directory
cd projects/yield_router-contracts

# Install dependencies
poetry install

# Deploy YieldRouter contract to TestNet
algokit project deploy testnet

# Note the app IDs returned for each contract
```

### 2. Update Environment Variables

Edit `.env` file in the frontend directory:

```env
# Replace with your deployed contract IDs
VITE_APP_ID=123456789                    # YieldRouterContract
VITE_GAME_CONTRACT_ID=123456790          # GameMatchContract
VITE_LEADERBOARD_CONTRACT_ID=123456791   # LeaderboardContract
VITE_STAKE_MARKET_CONTRACT_ID=123456792  # StakeMarketContract

# Network configuration (TestNet)
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
VITE_INDEXER_SERVER=https://testnet-idx.algonode.cloud
VITE_ALGOD_NETWORK=testnet
```

### 3. Enable Real Contract Calls

Once contracts are deployed, update the hooks to use real blockchain calls:

#### useYieldRouter Hook
File: `src/hooks/useYieldRouter.ts`

Uncomment the real contract integration code and remove mock data sections.

#### useStakeMarket Hook
File: `src/hooks/useStakeMarket.ts`

Replace localStorage operations with actual contract calls:
```typescript
// Example: Real stake transaction
const algodClient = new algosdk.Algodv2('', VITE_ALGOD_SERVER, '');
const params = await algodClient.getTransactionParams().do();

const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  from: activeAddress,
  to: algosdk.getApplicationAddress(STAKE_MARKET_APP_ID),
  amount: amount * 1e6,
  suggestedParams: params,
});

const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
  from: activeAddress,
  appIndex: STAKE_MARKET_APP_ID,
  onComplete: algosdk.OnApplicationComplete.NoOpOC,
  appArgs: [
    new Uint8Array(Buffer.from('stake_on_match')),
    new Uint8Array(Buffer.from(matchId)),
    algosdk.decodeAddress(playerId).publicKey,
  ],
  suggestedParams: params,
});

const txns = [paymentTxn, appCallTxn];
algosdk.assignGroupID(txns);
const signedTxns = await signer(txns, [0, 1]);
await algodClient.sendRawTransaction(signedTxns).do();
```

#### useGameMatch Hook
File: `src/hooks/useGameMatch.ts`

Integrate with GameMatchContract client:
```typescript
import { GameMatchContractClient } from '../contracts/GameMatchContract';

const client = new GameMatchContractClient({
  resolveBy: 'id',
  id: GAME_CONTRACT_ID,
  sender: { addr: activeAddress, signer },
});

await client.createMatch({
  args: { matchId, entryFee, creator: activeAddress },
});
```

## Frontend-Contract Integration Points

### WatchStake Page
- **Live Match List**: Queries GameMatchContract every 5 seconds
- **Stake Panel**: Calls StakeMarketContract.stake_on_match()
- **Stake Pools**: Queries StakeMarketContract.get_total_stakes()
- **Stake History**: Queries user's stake records from contract
- **Auto Payout**: Triggered by StakeMarketContract.resolve_stakes()

### PlayCricket Page
- **Game Start**: Creates match via GameMatchContract.create_match()
- **Game Complete**: Calls GameMatchContract.submit_result()
- **Stats Update**: Calls LeaderboardContract.update_player_stats()
- **Credits**: Queries YieldRouterContract.get_user_tracking()

### Home Page
- **Top Players**: Queries LeaderboardContract.get_top_players()
- **Live Stats**: Aggregates data from all contracts
- **Platform APYs**: Reads from YieldRouterContract global state

## Testing

### LocalNet Testing
```bash
# Start AlgoKit LocalNet
algokit localnet start

# Deploy contracts to LocalNet
algokit project deploy localnet

# Update .env to use LocalNet
VITE_ENVIRONMENT=local
VITE_ALGOD_SERVER=http://localhost
VITE_ALGOD_PORT=4001
```

### TestNet Testing
1. Get TestNet ALGO from dispenser: https://testnet.algoexplorer.io/dispenser
2. Deploy contracts to TestNet
3. Test all features with real transactions

## Current Status

### ✅ Completed
- All UI components updated with dynamic data hooks
- Smart contract method signatures defined
- Hook architecture for contract integration
- Demo mode with localStorage for testing UI flows
- Environment variables template

### 🔄 Pending Contract Deployment
- Deploy all 4 contracts to TestNet/MainNet
- Update .env with real app IDs
- Replace mock data with actual contract calls
- Test end-to-end transaction flows

## Security Considerations

1. **Transaction Signing**: All transactions use the user's connected wallet signer
2. **Amount Validation**: Frontend validates ALGO amounts before creating transactions
3. **Contract State**: All state changes are verified on-chain
4. **Error Handling**: Comprehensive error handling for failed transactions
5. **Wallet Connection**: Uses @txnlab/use-wallet-react for secure wallet integration

## Support

For issues or questions:
- Check contract deployment logs
- Verify environment variables are set correctly
- Ensure wallet is connected and has sufficient ALGO
- Check browser console for transaction errors
