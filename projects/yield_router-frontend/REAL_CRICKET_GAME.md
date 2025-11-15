# Real Cricket Game - Implementation Guide

## Overview
The new **RealCricketGame** component provides a more realistic cricket batting experience with enhanced gameplay mechanics, timing-based shot selection, power charging, and directional control.

## Components Added

### 1. `src/scenes/RealCricketScene.ts`
Phaser scene implementing realistic cricket mechanics:
- **Delivery Phases**: Run-up → Release → Flight → Bounce → Approach
- **Shot Resolution**: Timing window + power + direction → outcome calculation
- **Outcomes**: Dot, 1-6 runs, wicket, edges, misses
- **Innings Tracking**: Configurable overs, balls per over, wickets limit
- **Combo System**: Momentum mechanic that boosts boundary chances

### 2. `src/components/RealCricketGame.tsx`
React wrapper component with UI overlays:
- Real-time score, wickets, balls tracking
- Charge meter visualization
- Last outcome display
- Over progress and run rate
- Innings completion handling

## Gameplay Controls

### Keyboard Controls
- **Arrow Keys / Mouse**: Move bat left/right
- **SPACE Bar**: Hold to charge power, release to swing
- **1 Key**: Select OFF direction (left side shots)
- **2 Key**: Select STRAIGHT direction (down the ground)
- **3 Key**: Select LEG direction (right side shots)

### Timing & Power Mechanics
1. **Charging**: Hold SPACE to build power (0-100%)
2. **Timing**: Release near the ideal contact moment for best results
3. **Direction**: Match shot direction to ball line for bonus quality
4. **Combo**: Consecutive hits build momentum → increased boundary chance

## Scoring System

### Run Outcomes
- **Six (6)**: Quality > 85% (perfect timing + high power + good direction)
- **Four (4)**: Quality > 70%
- **Three (3)**: Quality > 55%
- **Two (2)**: Quality > 35%
- **Single (1)**: Quality > 15%
- **Dot (0)**: Poor contact or defensive shot
- **Wicket**: Mistimed shot (quality < 18%) with 25% chance OR complete miss with 20% chance

### Quality Calculation
```
Quality = (Power × 0.55) + (Timing × 0.35) + (DirectionBonus × 0.15)
```

## Configuration

### Default Settings
```typescript
{
  overs: 2,              // Number of overs
  ballsPerOver: 6,       // Balls per over (standard)
  maxWickets: 3          // Innings ends on wickets
}
```

### Customization
Pass props to `RealCricketGame`:
```tsx
<RealCricketGame
  overs={5}
  ballsPerOver={6}
  maxWickets={5}
  onInningsComplete={(summary) => console.log(summary)}
  onBallOutcome={(meta) => console.log(meta)}
/>
```

## Events Emitted

### Scene Events
- `delivery`: Ball delivery started
- `outcome`: Ball outcome resolved with metadata
- `scoreUpdate`: Score/wickets/balls updated
- `overComplete`: Over finished
- `inningsComplete`: Innings finished
- `chargeUpdate`: Power charge value changed

### Integration with DApp
The component integrates with PlayCricket page via:
1. `onInningsComplete`: Triggers reward modal and stats update
2. `onBallOutcome`: Can be used for per-ball contract calls (staking settlement)

## Future Enhancements

### Planned Features
- [ ] **Sound Effects**: Bat hit, crowd reactions, wicket fall
- [ ] **Visual Effects**: Ball trail, impact particles, camera shake
- [ ] **Bowler Animations**: Run-up animation, delivery action
- [ ] **Field Visualization**: Fielders, boundary markers
- [ ] **Multiple Difficulty Levels**: Vary ball speed, swing amount
- [ ] **Achievements**: Century, Hat-trick, Clean Bowled badges
- [ ] **Replay System**: Review last ball

### Asset Placeholders
Create these asset files in `src/assets/sounds/`:
- `bat-hit.mp3` - Contact sound
- `crowd-cheer.mp3` - Boundary celebration
- `wicket.mp3` - Wicket fall sound
- `ball-bounce.mp3` - Pitch bounce

Create these in `src/assets/images/`:
- `bowler-sprite.png` - Bowler animation frames
- `fielder.svg` - Fielder icons
- `stadium-detailed.jpg` - Enhanced stadium background

### Loading Assets
Update `RealCricketScene.preload()`:
```typescript
preload() {
  this.load.audio('batHit', '/assets/sounds/bat-hit.mp3');
  this.load.audio('crowd', '/assets/sounds/crowd-cheer.mp3');
  this.load.audio('wicket', '/assets/sounds/wicket.mp3');
  this.load.image('bowler', '/assets/images/bowler-sprite.png');
  this.load.image('stadium', '/assets/images/stadium-detailed.jpg');
}
```

## How to Play (User Instructions)

1. **Start Game**: Click "Start Game" button on PlayCricket page
2. **Watch Delivery**: Ball is bowled from the bowler's end
3. **Position Bat**: Move bat with mouse or arrow keys
4. **Select Direction**: Press 1 (OFF), 2 (STRAIGHT), or 3 (LEG)
5. **Charge Power**: Hold SPACE bar to build power
6. **Time Release**: Release SPACE near ball contact for best timing
7. **Score Runs**: Better timing + power + direction = more runs
8. **Build Combo**: Consecutive hits increase boundary chances
9. **Complete Innings**: Play all overs or lose all wickets

## Technical Notes

### Performance
- Canvas rendering via Phaser 3
- Physics disabled (custom ball motion for realism)
- Optimized for 60 FPS on modern browsers

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ⚠️ Touch controls need enhancement

### State Management
- Game state managed in Phaser scene
- React wrapper syncs via event emitters
- localStorage persistence for stats (per wallet address)

## Troubleshooting

### Game Not Loading
- Check browser console for errors
- Verify Phaser installed: `npm list phaser`
- Clear browser cache and reload

### Controls Not Working
- Click on game canvas to ensure focus
- Check keyboard permissions in browser
- Try mouse movement as alternative

### Performance Issues
- Reduce canvas size in component props
- Disable browser extensions
- Close other tabs/applications

## Integration with Smart Contracts

### Current Flow
1. Game completes → `onInningsComplete` callback
2. Score passed to `handleGameComplete` in PlayCricket
3. Stats updated in localStorage
4. Leaderboard refreshed

### Production Enhancement
Wire `onBallOutcome` to submit per-ball data:
```typescript
const handleBallOutcome = async (meta: DeliveryOutcomeMeta) => {
  if (APP_ID && activeAddress) {
    await gameMatchClient.submitBallResult({
      matchId,
      ball: currentBall,
      outcome: meta.outcome,
      runs: meta.runs,
      player: activeAddress,
    });
  }
};
```

---

**Created**: November 16, 2025  
**Component Version**: 1.0  
**Phaser Version**: 3.90.0  
**Dependencies**: React 18, @txnlab/use-wallet-react, Framer Motion
