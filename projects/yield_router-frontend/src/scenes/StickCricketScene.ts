import Phaser from "phaser";

/**
 * StickCricketScene - High-quality stick figure cricket game
 * 
 * Features:
 * - Smooth stick figure animations (batsman, bowler)
 * - Dynamic ball physics with swing and bounce
 * - Particle effects on hits
 * - Power meter system
 * - Special shot mechanics
 * - Combo multiplier system
 * - Visual feedback and celebrations
 */

export interface StickCricketOutcome {
  runs: number;
  outcome: string;
  timing: number;
  power: number;
  isSpecial: boolean;
}

export default class StickCricketScene extends Phaser.Scene {
  // Game objects
  private batsman!: Phaser.GameObjects.Container;
  private bowler!: Phaser.GameObjects.Container;
  private ball!: Phaser.GameObjects.Graphics;
  private bat!: Phaser.GameObjects.Graphics;
  
  // Particles
  private hitParticles: Phaser.GameObjects.Graphics[] = [];
  private trailParticles: { x: number; y: number; alpha: number }[] = [];
  
  // Game state
  private score = 0;
  private wickets = 0;
  private balls = 0;
  private overs = 2;
  private ballsPerOver = 6;
  private maxWickets = 3;
  
  // Delivery state
  private deliveryPhase: 'idle' | 'runup' | 'bowling' | 'flight' | 'resolved' = 'idle';
  private deliveryStartTime = 0;
  private ballPosition = { x: 0, y: 0 };
  private ballVelocity = { x: 0, y: 0 };
  private ballSwing = 0;
  private bounced = false;
  
  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private swingKey!: Phaser.Input.Keyboard.Key;
  private batPosition = 0;
  private powerCharge = 0;
  private isCharging = false;
  private shotType: 'normal' | 'lofted' | 'cut' | 'pull' = 'normal';
  
  // Animation
  private batsmanAnim = { legAngle: 0, armAngle: 0, batAngle: 0 };
  private bowlerAnim = { armAngle: 0, legAngle: 0, position: 0 };
  private cameraShake = 0;
  
  // Combo system
  private comboCount = 0;
  private comboMultiplier = 1;
  private lastHitQuality = 0;
  
  // Graphics layers
  private bgLayer!: Phaser.GameObjects.Graphics;
  private pitchLayer!: Phaser.GameObjects.Graphics;
  private fxLayer!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "StickCricketScene" });
  }

  init(data: any) {
    if (data.overs) this.overs = data.overs;
    if (data.ballsPerOver) this.ballsPerOver = data.ballsPerOver;
    if (data.maxWickets) this.maxWickets = data.maxWickets;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Create graphics layers
    this.bgLayer = this.add.graphics();
    this.pitchLayer = this.add.graphics();
    this.fxLayer = this.add.graphics();
    this.fxLayer.setDepth(100);

    // Draw scene
    this.drawBackground(w, h);
    this.drawPitch(w, h);
    this.createBowler(w, h);
    this.createBatsman(w, h);
    this.createBall();

    // Setup input
    this.setupControls();

    // Start game
    this.events.emit('ready');
    this.scheduleDelivery();
  }

  private drawBackground(w: number, h: number) {
    // Sky gradient
    this.bgLayer.fillGradientStyle(0x1e40af, 0x1e40af, 0x3b82f6, 0x60a5fa, 1);
    this.bgLayer.fillRect(0, 0, w, h * 0.5);
    
    // Ground
    this.bgLayer.fillGradientStyle(0x15803d, 0x15803d, 0x166534, 0x14532d, 1);
    this.bgLayer.fillRect(0, h * 0.5, w, h * 0.5);
    
    // Stadium lights
    const lightPositions = [
      { x: w * 0.1, y: h * 0.15 },
      { x: w * 0.9, y: h * 0.15 },
      { x: w * 0.3, y: h * 0.2 },
      { x: w * 0.7, y: h * 0.2 }
    ];
    
    lightPositions.forEach(pos => {
      // Pole
      this.bgLayer.fillStyle(0x374151, 1);
      this.bgLayer.fillRect(pos.x - 2, pos.y, 4, h * 0.3);
      
      // Light
      this.bgLayer.fillStyle(0xfbbf24, 1);
      this.bgLayer.fillCircle(pos.x, pos.y, 8);
      
      // Glow
      this.bgLayer.fillStyle(0xfef3c7, 0.2);
      this.bgLayer.fillCircle(pos.x, pos.y, 20);
    });
    
    this.bgLayer.setDepth(-10);
  }

  private drawPitch(w: number, h: number) {
    const pitchX = w * 0.2;
    const pitchY = h * 0.45;
    const pitchW = w * 0.6;
    const pitchH = h * 0.4;
    
    // Pitch shadow (3D effect)
    this.pitchLayer.fillStyle(0x0a3d0f, 0.5);
    this.pitchLayer.fillRect(pitchX + 5, pitchY + 5, pitchW, pitchH);
    
    // Main pitch
    this.pitchLayer.fillGradientStyle(0x16a34a, 0x16a34a, 0x15803d, 0x166534, 1);
    this.pitchLayer.fillRect(pitchX, pitchY, pitchW, pitchH);
    
    // Pitch markings
    this.pitchLayer.lineStyle(2, 0xffffff, 0.4);
    
    // Creases
    const creaseY1 = pitchY + pitchH * 0.2;
    const creaseY2 = pitchY + pitchH * 0.8;
    
    this.pitchLayer.strokeRect(pitchX + pitchW * 0.1, creaseY1 - 15, pitchW * 0.8, 30);
    this.pitchLayer.strokeRect(pitchX + pitchW * 0.1, creaseY2 - 15, pitchW * 0.8, 30);
    
    // Center line
    this.pitchLayer.lineStyle(1, 0xffffff, 0.2);
    this.pitchLayer.lineBetween(
      pitchX + pitchW * 0.5,
      pitchY,
      pitchX + pitchW * 0.5,
      pitchY + pitchH
    );
    
    this.pitchLayer.setDepth(-5);
  }

  private createBowler(w: number, h: number) {
    this.bowler = this.add.container(w * 0.3, h * 0.55);
    
    const graphics = this.add.graphics();
    this.bowler.add(graphics);
    
    this.bowler.setDepth(5);
  }

  private createBatsman(w: number, h: number) {
    this.batsman = this.add.container(w * 0.7, h * 0.72);
    this.batPosition = w * 0.7;
    
    const graphics = this.add.graphics();
    this.batsman.add(graphics);
    
    this.bat = this.add.graphics();
    this.batsman.add(this.bat);
    
    this.batsman.setDepth(10);
  }

  private createBall() {
    this.ball = this.add.graphics();
    this.ball.setDepth(8);
  }

  private setupControls() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.swingKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Mouse control
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.batPosition = Phaser.Math.Clamp(
        pointer.x,
        this.scale.width * 0.6,
        this.scale.width * 0.85
      );
    });
    
    // Shot types
    this.input.keyboard!.on('keydown-Q', () => { this.shotType = 'lofted'; });
    this.input.keyboard!.on('keydown-W', () => { this.shotType = 'cut'; });
    this.input.keyboard!.on('keydown-E', () => { this.shotType = 'pull'; });
    
    // Charging
    this.swingKey.on('down', () => {
      if (this.deliveryPhase === 'flight') {
        this.isCharging = true;
      }
    });
    
    this.swingKey.on('up', () => {
      if (this.isCharging && this.deliveryPhase === 'flight') {
        this.swing();
      }
      this.isCharging = false;
    });
  }

  update(time: number, delta: number) {
    const w = this.scale.width;
    const h = this.scale.height;
    const dt = delta / 1000;
    
    // Update bat position
    if (this.cursors.left?.isDown) {
      this.batPosition -= 300 * dt;
    }
    if (this.cursors.right?.isDown) {
      this.batPosition += 300 * dt;
    }
    this.batPosition = Phaser.Math.Clamp(this.batPosition, w * 0.6, w * 0.85);
    this.batsman.x = this.batPosition;
    
    // Charge power
    if (this.isCharging) {
      this.powerCharge = Math.min(1, this.powerCharge + dt * 1.5);
      this.events.emit('chargeUpdate', this.powerCharge);
    }
    
    // Delivery animations
    if (this.deliveryPhase === 'runup') {
      this.updateBowlerRunup(time, dt);
    } else if (this.deliveryPhase === 'bowling') {
      this.updateBowlerBowl(time, dt);
    } else if (this.deliveryPhase === 'flight') {
      this.updateBallFlight(time, dt);
    }
    
    // Update batsman animation
    this.updateBatsmanAnimation(dt);
    
    // Draw stick figures
    this.drawBowlerStick();
    this.drawBatsmanStick();
    this.drawBallGraphics();
    
    // Update particles
    this.updateParticles(dt);
    
    // Camera shake
    if (this.cameraShake > 0) {
      this.cameras.main.setScroll(
        Phaser.Math.Between(-this.cameraShake, this.cameraShake),
        Phaser.Math.Between(-this.cameraShake, this.cameraShake)
      );
      this.cameraShake *= 0.85;
      if (this.cameraShake < 0.5) {
        this.cameras.main.setScroll(0, 0);
        this.cameraShake = 0;
      }
    }
  }

  private updateBowlerRunup(time: number, dt: number) {
    const elapsed = time - this.deliveryStartTime;
    const duration = 800;
    const progress = Math.min(elapsed / duration, 1);
    
    const startX = this.scale.width * 0.3;
    const endX = this.scale.width * 0.35;
    
    this.bowler.x = Phaser.Math.Linear(startX, endX, progress);
    this.bowlerAnim.legAngle = Math.sin(progress * Math.PI * 4) * 30;
    this.bowlerAnim.armAngle = progress * 180;
    
    if (progress >= 1) {
      this.deliveryPhase = 'bowling';
      this.deliveryStartTime = time;
    }
  }

  private updateBowlerBowl(time: number, dt: number) {
    const elapsed = time - this.deliveryStartTime;
    const duration = 300;
    const progress = Math.min(elapsed / duration, 1);
    
    this.bowlerAnim.armAngle = 180 + progress * 180;
    
    if (progress >= 0.7 && this.deliveryPhase === 'bowling') {
      this.releaseBall();
    }
    
    if (progress >= 1) {
      this.bowlerAnim.armAngle = 0;
    }
  }

  private releaseBall() {
    this.deliveryPhase = 'flight';
    this.deliveryStartTime = this.time.now;
    
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.ballPosition.x = this.bowler.x + 20;
    this.ballPosition.y = this.bowler.y - 30;
    
    const targetX = this.batPosition;
    const targetY = h * 0.72;
    
    const dx = targetX - this.ballPosition.x;
    const dy = targetY - this.ballPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 400 + Math.random() * 200;
    const time = distance / speed;
    
    this.ballVelocity.x = dx / time;
    this.ballVelocity.y = dy / time;
    
    this.ballSwing = (Math.random() - 0.5) * 100;
    this.bounced = false;
    
    this.events.emit('delivery', { ball: this.balls + 1 });
  }

  private updateBallFlight(time: number, dt: number) {
    const elapsed = (this.time.now - this.deliveryStartTime) / 1000;
    
    // Apply velocity
    this.ballPosition.x += this.ballVelocity.x * dt;
    this.ballPosition.y += this.ballVelocity.y * dt;
    
    // Add swing
    const swingEffect = Math.sin(elapsed * 5) * this.ballSwing * dt;
    this.ballPosition.x += swingEffect;
    
    // Gravity
    this.ballVelocity.y += 800 * dt;
    
    // Bounce
    const bounceY = this.scale.height * 0.68;
    if (!this.bounced && this.ballPosition.y > bounceY) {
      this.bounced = true;
      this.ballVelocity.y *= -0.6;
      this.ballPosition.y = bounceY;
      this.createHitEffect(this.ballPosition.x, this.ballPosition.y, 0x16a34a, 5);
    }
    
    // Trail effect
    if (this.trailParticles.length < 20) {
      this.trailParticles.push({
        x: this.ballPosition.x,
        y: this.ballPosition.y,
        alpha: 1
      });
    }
    
    // Check for hit or miss
    const distToBat = Math.abs(this.ballPosition.x - this.batPosition);
    const distToBatY = Math.abs(this.ballPosition.y - (this.scale.height * 0.72));
    
    if (distToBat < 40 && distToBatY < 30 && this.deliveryPhase === 'flight') {
      this.resolveHit();
    } else if (this.ballPosition.y > this.scale.height * 0.75 && this.deliveryPhase === 'flight') {
      this.resolveMiss();
    }
  }

  private swing() {
    if (this.deliveryPhase !== 'flight') return;
    
    // Animate bat swing
    this.batsmanAnim.batAngle = -90;
    this.tweens.add({
      targets: this.batsmanAnim,
      batAngle: 0,
      duration: 200,
      ease: 'Power2'
    });
  }

  private resolveHit() {
    this.deliveryPhase = 'resolved';
    
    const timing = 1 - (Math.abs(this.ballPosition.x - this.batPosition) / 40);
    const power = this.powerCharge;
    const quality = (timing * 0.6 + power * 0.4);
    
    this.lastHitQuality = quality;
    
    let runs = 0;
    let outcome = 'dot';
    
    if (quality > 0.85) {
      runs = 6;
      outcome = 'six';
      this.createSixCelebration();
    } else if (quality > 0.7) {
      runs = 4;
      outcome = 'four';
      this.createBoundaryCelebration();
    } else if (quality > 0.5) {
      runs = 3;
      outcome = 'three';
    } else if (quality > 0.3) {
      runs = 2;
      outcome = 'double';
    } else if (quality > 0.15) {
      runs = 1;
      outcome = 'single';
    }
    
    // Combo system
    if (runs > 0) {
      this.comboCount++;
      this.comboMultiplier = Math.min(1 + Math.floor(this.comboCount / 3), 5);
    } else {
      this.comboCount = 0;
      this.comboMultiplier = 1;
    }
    
    const finalRuns = runs * this.comboMultiplier;
    this.score += finalRuns;
    this.balls++;
    
    // Effects
    this.createHitEffect(this.ballPosition.x, this.ballPosition.y, 0xfbbf24, 15);
    this.cameraShake = Math.min(runs * 2, 10);
    
    const meta: StickCricketOutcome = {
      runs: finalRuns,
      outcome,
      timing,
      power,
      isSpecial: this.shotType !== 'normal'
    };
    
    this.events.emit('outcome', meta);
    this.events.emit('scoreUpdate', {
      score: this.score,
      wickets: this.wickets,
      balls: this.balls,
      combo: this.comboMultiplier
    });
    
    this.checkInnings();
  }

  private resolveMiss() {
    this.deliveryPhase = 'resolved';
    
    const wicketChance = Math.random() < 0.2;
    
    if (wicketChance) {
      this.wickets++;
      this.comboCount = 0;
      this.comboMultiplier = 1;
      this.createWicketEffect();
      
      this.events.emit('outcome', {
        runs: 0,
        outcome: 'wicket',
        timing: 0,
        power: this.powerCharge,
        isSpecial: false
      });
    } else {
      this.events.emit('outcome', {
        runs: 0,
        outcome: 'miss',
        timing: 0,
        power: this.powerCharge,
        isSpecial: false
      });
    }
    
    this.balls++;
    
    this.events.emit('scoreUpdate', {
      score: this.score,
      wickets: this.wickets,
      balls: this.balls,
      combo: this.comboMultiplier
    });
    
    this.checkInnings();
  }

  private checkInnings() {
    if (this.balls % this.ballsPerOver === 0) {
      const over = Math.floor(this.balls / this.ballsPerOver);
      this.events.emit('overComplete', { over, score: this.score });
    }
    
    const inningsDone = this.balls >= this.overs * this.ballsPerOver || this.wickets >= this.maxWickets;
    
    if (inningsDone) {
      this.events.emit('inningsComplete', {
        score: this.score,
        wickets: this.wickets,
        balls: this.balls
      });
    } else {
      this.time.delayedCall(1000, () => this.scheduleDelivery());
    }
  }

  private scheduleDelivery() {
    this.deliveryPhase = 'runup';
    this.deliveryStartTime = this.time.now;
    this.powerCharge = 0;
    this.shotType = 'normal';
    this.trailParticles = [];
    
    this.bowler.x = this.scale.width * 0.3;
  }

  private updateBatsmanAnimation(dt: number) {
    // Idle breathing animation
    if (this.deliveryPhase === 'idle' || this.deliveryPhase === 'resolved') {
      this.batsmanAnim.legAngle = Math.sin(this.time.now * 0.002) * 3;
    }
    
    // Ready stance during delivery
    if (this.deliveryPhase === 'flight') {
      this.batsmanAnim.armAngle = -20 + this.powerCharge * 30;
    }
  }

  private drawBowlerStick() {
    const g = this.bowler.first as Phaser.GameObjects.Graphics;
    g.clear();
    
    const headColor = 0xfbbf24;
    const bodyColor = 0x3b82f6;
    
    // Head
    g.fillStyle(headColor, 1);
    g.fillCircle(0, -40, 8);
    
    // Body
    g.lineStyle(4, bodyColor, 1);
    g.lineBetween(0, -32, 0, -10);
    
    // Arms (bowling action)
    const armRad = this.bowlerAnim.armAngle * Math.PI / 180;
    g.lineBetween(0, -25, Math.cos(armRad) * 20, -25 + Math.sin(armRad) * 20);
    g.lineBetween(0, -25, -10, -15);
    
    // Legs
    const legRad = this.bowlerAnim.legAngle * Math.PI / 180;
    g.lineBetween(0, -10, Math.sin(legRad) * 10, 5);
    g.lineBetween(0, -10, -Math.sin(legRad) * 10, 5);
  }

  private drawBatsmanStick() {
    const g = this.batsman.first as Phaser.GameObjects.Graphics;
    g.clear();
    
    const headColor = 0xef4444;
    const bodyColor = 0x10b981;
    
    // Head
    g.fillStyle(headColor, 1);
    g.fillCircle(0, -40, 8);
    
    // Body
    g.lineStyle(4, bodyColor, 1);
    g.lineBetween(0, -32, 0, -10);
    
    // Arms
    const armRad = this.batsmanAnim.armAngle * Math.PI / 180;
    g.lineBetween(0, -25, 15 + Math.cos(armRad) * 5, -20 + Math.sin(armRad) * 10);
    g.lineBetween(0, -25, -5, -15);
    
    // Legs
    const legRad = this.batsmanAnim.legAngle * Math.PI / 180;
    g.lineBetween(0, -10, Math.sin(legRad) * 8, 5);
    g.lineBetween(0, -10, -Math.sin(legRad) * 8, 5);
    
    // Bat
    this.bat.clear();
    this.bat.fillStyle(0x92400e, 1);
    
    const batRad = this.batsmanAnim.batAngle * Math.PI / 180;
    const batLength = 50;
    const batWidth = 8;
    
    this.bat.save();
    this.bat.translateCanvas(15, -20);
    this.bat.rotateCanvas(batRad);
    this.bat.fillRect(0, -batWidth / 2, batLength, batWidth);
    this.bat.restore();
  }

  private drawBallGraphics() {
    this.ball.clear();
    
    if (this.deliveryPhase === 'flight') {
      // Ball shadow
      this.ball.fillStyle(0x000000, 0.3);
      this.ball.fillCircle(this.ballPosition.x, this.scale.height * 0.72, 6);
      
      // Ball
      this.ball.fillStyle(0xff0000, 1);
      this.ball.fillCircle(this.ballPosition.x, this.ballPosition.y, 8);
      
      // Ball highlight
      this.ball.fillStyle(0xffffff, 0.6);
      this.ball.fillCircle(this.ballPosition.x - 2, this.ballPosition.y - 2, 3);
    }
  }

  private updateParticles(dt: number) {
    this.fxLayer.clear();
    
    // Trail particles
    this.trailParticles = this.trailParticles.filter(p => {
      p.alpha -= dt * 3;
      if (p.alpha > 0) {
        this.fxLayer.fillStyle(0xff6b6b, p.alpha);
        this.fxLayer.fillCircle(p.x, p.y, 4);
        return true;
      }
      return false;
    });
    
    // Hit particles
    this.hitParticles = this.hitParticles.filter((p, i) => {
      const life = p.getData('life');
      const newLife = life - dt;
      p.setData('life', newLife);
      
      if (newLife > 0) {
        const vx = p.getData('vx');
        const vy = p.getData('vy');
        p.x += vx * dt;
        p.y += vy * dt;
        p.setData('vy', vy + 500 * dt);
        
        p.alpha = newLife / 1.5;
        return true;
      }
      p.destroy();
      return false;
    });
  }

  private createHitEffect(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 100;
      
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);
      particle.setDepth(50);
      
      particle.setData('vx', Math.cos(angle) * speed);
      particle.setData('vy', Math.sin(angle) * speed - 100);
      particle.setData('life', 0.5 + Math.random() * 0.5);
      
      this.hitParticles.push(particle);
    }
  }

  private createBoundaryCelebration() {
    this.createHitEffect(this.ballPosition.x, this.ballPosition.y, 0xf97316, 20);
    this.cameraShake = 8;
  }

  private createSixCelebration() {
    this.createHitEffect(this.ballPosition.x, this.ballPosition.y, 0xc026d3, 30);
    this.createHitEffect(this.scale.width / 2, this.scale.height * 0.3, 0xfbbf24, 25);
    this.cameraShake = 12;
    
    // Zoom effect
    this.cameras.main.zoomTo(1.1, 200);
    this.time.delayedCall(300, () => {
      this.cameras.main.zoomTo(1, 200);
    });
  }

  private createWicketEffect() {
    this.createHitEffect(this.batsman.x, this.batsman.y, 0xef4444, 25);
    this.cameraShake = 10;
    
    // Flash effect
    this.cameras.main.flash(200, 255, 0, 0);
  }
}
