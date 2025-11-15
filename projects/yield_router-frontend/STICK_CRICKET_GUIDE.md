# 🏏 Stick Cricket Game - High Graphics Edition

## Overview
A premium stick figure cricket game with smooth animations, particle effects, and professional gameplay mechanics. Built with Phaser 3 and React.

## ✨ Features

### Graphics & Animations
- **Smooth Stick Figure Animations**
  - Batsman with realistic batting stance and swing
  - Bowler with run-up and delivery action
  - Dynamic arm and leg movements
  - Breathing idle animations

- **Visual Effects**
  - Particle explosions on hits (color-coded by run value)
  - Ball trail effects during flight
  - Camera shake on boundaries
  - Camera zoom on sixes
  - Flash effects on wickets
  - Glow effects and highlights

- **High-Quality Environment**
  - Gradient sky background
  - 3D pitch with shadow effects
  - Stadium floodlights with glow
  - Pitch markings and creases
  - Professional color scheme

### Gameplay Mechanics
- **Power Charge System**
  - Hold SPACE to charge power (0-100%)
  - Visual feedback with color-coded meter
  - Power labels: Weak → Good → Strong → Power → MAX!

- **Shot Mechanics**
  - Timing-based hitting (distance to bat matters)
  - Quality calculation: timing (60%) + power (40%)
  - Multiple shot types with keyboard controls
  - Special shots: Lofted (Q), Cut (W), Pull (E)

- **Combo System**
  - Build combos by hitting consecutive runs
  - Multiplier increases every 3 hits
  - Maximum 5x combo multiplier
  - Visual combo display with fire emoji

- **Ball Physics**
  - Realistic ball swing during flight
  - Gravity and bounce physics
  - Variable ball speed (400-600 speed units)
  - Bounce at pitch level

### Scoring & Stats
- **Run Values**
  - 6 runs: Quality > 0.85 (with celebration)
  - 4 runs: Quality > 0.70 (boundary celebration)
  - 3 runs: Quality > 0.50
  - 2 runs: Quality > 0.30
  - 1 run: Quality > 0.15
  - Dot ball: Quality ≤ 0.15

- **Game Tracking**
  - Live score, wickets, balls
  - Current over (format: 0.0)
  - Run rate calculation
  - Combo multiplier display
  - Power charge percentage

## 🎮 Controls

### Keyboard
- **Arrow Keys (← →)**: Move bat left/right
- **SPACE**: Hold to charge power, release to swing
- **Q**: Lofted shot (high power)
- **W**: Cut shot (precise placement)
- **E**: Pull shot (aggressive)

### Mouse
- **Move Mouse**: Aim bat position
- **Mouse Position**: Controls horizontal bat placement

## 🎨 Visual Feedback

### Color Coding
- **Power Meter**
  - Gray: 0-30% (Weak)
  - Yellow: 30-50% (Good)
  - Orange: 50-70% (Strong)
  - Red: 70-90% (Power)
  - Purple: 90-100% (MAX!)

- **Particles**
  - Red trail: Ball flight path
  - Yellow/Gold: Hit effects
  - Orange: Boundary celebration
  - Purple: Six celebration
  - Red: Wicket effect

### Stick Figure Colors
- **Batsman**: Red head, Green body
- **Bowler**: Yellow head, Blue body
- **Bat**: Brown (solid wooden look)
- **Ball**: Red with white highlight

## 📊 Game Configuration

Default settings (customizable via props):
```typescript
{
  overs: 2,              // Number of overs
  ballsPerOver: 6,       // Balls per over
  maxWickets: 3,         // Maximum wickets
}
```

## 🎯 Outcome System

### Hit Outcomes
Emits detailed outcome data:
```typescript
{
  runs: number,          // Runs scored (with multiplier)
  outcome: string,       // 'six', 'four', 'three', etc.
  timing: number,        // Timing quality (0-1)
  power: number,         // Power charge (0-1)
  isSpecial: boolean     // Was it a special shot?
}
```

### Miss Outcomes
- **Dot Ball**: Ball passed, no wicket
- **Wicket**: 20% chance on miss
  - Triggers wicket celebration
  - Resets combo multiplier
  - Flash effect

## 🏆 Special Moments

### Six Celebration
- 30+ purple particles
- 25+ gold particles at screen center
- Camera zoom effect (1.0 → 1.1 → 1.0)
- Camera shake intensity: 12

### Boundary Celebration
- 20+ orange particles
- Camera shake intensity: 8

### Wicket Effect
- 25+ red particles
- Camera shake intensity: 10
- Red flash overlay

## 🔧 Technical Details

### Scene Architecture
- **StickCricketScene**: Main Phaser scene
- **StickCricketGame**: React wrapper component

### Delivery Phases
1. **idle**: Waiting for next delivery
2. **runup**: Bowler running (800ms)
3. **bowling**: Bowling action (300ms)
4. **flight**: Ball in air (variable)
5. **resolved**: Outcome determined

### Performance
- 60 FPS target
- Efficient particle pooling
- Optimized graphics rendering
- Smooth animations with tweens

## 🎪 UI Components

### Header Stats Bar
- Score (large display)
- Wickets (X/3 format)
- Overs (0.0 format)
- Run rate (calculated)

### Combo Banner
- Appears when combo > 1
- Orange-red gradient
- Fire emoji indicators

### Power Charge Bar
- Real-time power display
- Color-coded progress
- Percentage label
- Power level text

### Outcome Overlay
- Centered on screen
- Large animated text
- Auto-dismiss after 2s
- Border highlight

### Controls Guide
- 4-column grid layout
- Visual key representations
- Clear action descriptions
- Special shots breakdown

## 🚀 Integration

```tsx
import StickCricketGame from "../components/StickCricketGame";

<StickCricketGame 
  onGameComplete={(score) => console.log(score)}
  overs={2}
  ballsPerOver={6}
  maxWickets={3}
/>
```

## 🎨 Customization

### Graphics Layers
- **bgLayer**: Background (sky, lights) - Depth -10
- **pitchLayer**: Pitch markings - Depth -5
- **bowler**: Stick bowler - Depth 5
- **ball**: Cricket ball - Depth 8
- **batsman**: Stick batsman - Depth 10
- **fxLayer**: Particle effects - Depth 100

### Adjustable Parameters
- Ball speed range (400-600)
- Swing intensity (-50 to +50)
- Particle counts
- Camera shake strength
- Combo thresholds
- Quality formula weights

## 🎯 Future Enhancements
- Sound effects (bat hit, crowd cheer, wicket)
- Multiple batsman/bowler designs
- Field placement visualization
- Commentary system
- Replay system
- Weather effects (rain, wind)
- Day/night mode
- Tournament mode

## 🐛 Troubleshooting

**Game not starting?**
- Check console for Phaser errors
- Ensure canvas container exists
- Verify scene is loading

**Choppy animations?**
- Check FPS in browser
- Reduce particle counts
- Disable camera effects

**Controls not working?**
- Verify keyboard focus on game
- Check input.keyboard availability
- Test with mouse controls

## 📝 Notes
- All animations use delta time for consistency
- Particle system uses graphics for compatibility
- Camera effects reset automatically
- Combo resets on wicket or dot ball
- Special shots currently share same mechanics (visual differentiation only)

---

**Created**: November 2024  
**Version**: 1.0.0  
**Engine**: Phaser 3.90.0  
**Framework**: React 18 + TypeScript
