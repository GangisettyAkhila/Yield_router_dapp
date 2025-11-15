import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private bat!: Phaser.Physics.Arcade.Sprite;
  private ball!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private ballsPlayed: number = 0;
  private ballsText!: Phaser.GameObjects.Text;
  private maxBalls: number = 12; // 2 overs
  private lastRunText?: Phaser.GameObjects.Text;
  private wickets: number = 0;
  private wicketsText!: Phaser.GameObjects.Text;
  private maxWickets: number = 3;
  private multiplier: number = 1;
  private multiplierText!: Phaser.GameObjects.Text;
  private comboHits: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    // try to load image assets from src/assets (Vite handles import.meta.url)
    try {
      this.load.image("stadium", new URL("../assets/stadium-bg.svg", import.meta.url).toString());
      this.load.image("pitchImg", new URL("../assets/pitch.svg", import.meta.url).toString());
      this.load.image("batImg", new URL("../assets/bat.svg", import.meta.url).toString());
      this.load.image("ballImg", new URL("../assets/ball.svg", import.meta.url).toString());
    } catch (e) {
      // if import.meta.url isn't available in some environments, fall back to generated textures in create()
    }
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background / stadium
    if (this.textures.exists("stadium")) {
      this.add.image(w / 2, h / 2, "stadium").setDisplaySize(w, h).setDepth(-2);
    } else {
      // Gradient background
      const gradient = this.add.rectangle(0, 0, w, h, 0x0ea5e9);
      gradient.setOrigin(0, 0);
      gradient.setDepth(-2);
    }

    // Pitch area (use image if available, otherwise draw)
    if (this.textures.exists("pitchImg")) {
      const p = this.add.image(w / 2, h - 80, "pitchImg");
      p.setDisplaySize(w - 80, 120);
    } else {
      const pitch = this.add.rectangle(w / 2, h - 80, w - 80, 120, 0x10b981);
      pitch.setStrokeStyle(4, 0xffffff, 0.3);
      
      // Pitch markings
      for (let i = 0; i < 5; i++) {
        const line = this.add.line(0, 0, 100 + i * 100, h - 140, 100 + i * 100, h - 20, 0xffffff, 0.2);
        line.setLineWidth(2);
      }
    }

    // Bat (player) - prefer loaded image
    if (this.textures.exists("batImg")) {
      this.bat = this.physics.add.sprite(w / 2, h - 110, "batImg");
      this.bat.setDisplaySize(120, 18);
    } else {
      const batG = this.make.graphics({ x: 0, y: 0 });
      batG.fillStyle(0x78350f, 1);
      batG.fillRoundedRect(0, 0, 120, 18, 8);
      batG.generateTexture("batTexture", 120, 18);
      this.bat = this.physics.add.sprite(w / 2, h - 110, "batTexture");
    }
    this.bat.setCollideWorldBounds(true);
    this.bat.setImmovable(true);
    (this.bat.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Ball - prefer loaded image
    if (this.textures.exists("ballImg")) {
      this.ball = this.physics.add.image(w / 2 - 100, 50, "ballImg");
      this.ball.setDisplaySize(20, 20);
    } else {
      const ballG = this.make.graphics({ x: 0, y: 0 });
      ballG.fillStyle(0xef4444, 1);
      ballG.fillCircle(10, 10, 10);
      ballG.generateTexture("ballTexture", 20, 20);
      this.ball = this.physics.add.image(w / 2 - 100, 50, "ballTexture");
    }
    this.ball.setCircle(10);
    this.ball.setBounce(0.7);
    this.ball.setCollideWorldBounds(true);
    // Don't call resetBall until UI texts are initialized

    // Collider
    this.physics.add.collider(this.ball, this.bat, (a: any, b: any) => this.handleHit(a, b), undefined, this);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.bat.x = Phaser.Math.Clamp(pointer.x, 60, this.scale.width - 60);
    });

    // UI Elements with better styling
    const uiStyle = {
      font: "bold 18px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    };

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, uiStyle).setDepth(10);
    
    this.ballsText = this.add.text(16, 44, `Balls: ${this.ballsPlayed}/${this.maxBalls}`, uiStyle).setDepth(10);
    
    this.wicketsText = this.add.text(16, 72, `Wickets: ${this.wickets}/${this.maxWickets}`, uiStyle).setDepth(10);
    
    this.multiplierText = this.add.text(w - 16, 16, `Combo: x${this.multiplier}`, uiStyle)
      .setOrigin(1, 0)
      .setDepth(10);

    // Instructions
    this.add.text(w / 2, h - 30, "Move bat with mouse/arrow keys • Hit the ball to score", {
      font: "14px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // Start first ball after UI is ready
    this.resetBall();

    // Emit ready
    this.game.events.emit("ready");
  }

  update() {
    if (this.isGameOver) return;

    if (this.cursors.left?.isDown) {
      this.bat.x -= 8;
    } else if (this.cursors.right?.isDown) {
      this.bat.x += 8;
    }

    // Clamp bat position
    this.bat.x = Phaser.Math.Clamp(this.bat.x, 60, this.scale.width - 60);

    // If ball falls past pitch bottom -> wicket
    if (this.ball.y > this.scale.height - 40) {
      const dist = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.bat.x, this.bat.y);
      if (dist > 70) {
        this.handleWicket();
      } else {
        // Near miss - ball bounces back up slightly
        (this.ball.body as Phaser.Physics.Arcade.Body).setVelocityY(-150);
      }
    }

    // Update multiplier text color based on combo
    if (this.comboHits > 0) {
      const colors = ["#ffffff", "#fbbf24", "#f97316", "#ef4444", "#c026d3"];
      const colorIndex = Math.min(this.comboHits - 1, colors.length - 1);
      this.multiplierText.setColor(colors[colorIndex]);
    }
  }

  private resetBall() {
    const w = this.scale.width;
    const startX = Phaser.Math.Between(100, w - 100);
    this.ball.setPosition(startX, 50);
    
    const vx = Phaser.Math.Between(-150, 150);
    const vy = Phaser.Math.Between(100, 200);
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
    
    this.ballsPlayed++;
    this.ballsText.setText(`Balls: ${this.ballsPlayed}/${this.maxBalls}`);
    
    if (this.ballsPlayed >= this.maxBalls) {
      this.endGame("Innings Complete!");
    }
  }

  private handleHit(ball: Phaser.GameObjects.GameObject, bat: Phaser.GameObjects.GameObject) {
    // Calculate hit power based on bat center alignment
    const batCenter = this.bat.x;
    const ballX = this.ball.x;
    const hitQuality = 1 - Math.min(Math.abs(batCenter - ballX) / 60, 1); // 0 to 1

    // Send ball upwards with variation based on hit quality
    const basePower = 350;
    const power = basePower + (hitQuality * 150);
    const angle = Phaser.Math.Between(-60, 60);
    const vx = Math.sin(angle * Math.PI / 180) * power;
    const vy = -Math.cos(angle * Math.PI / 180) * power;
    
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    // Calculate runs based on hit quality
    let runs = 0;
    if (hitQuality > 0.8) {
      runs = 6; // Six!
    } else if (hitQuality > 0.6) {
      runs = 4; // Four!
    } else if (hitQuality > 0.4) {
      runs = Phaser.Math.Between(2, 3);
    } else {
      runs = Phaser.Math.Between(1, 2);
    }

    // Apply multiplier
    const earnedRuns = runs * this.multiplier;
    this.score += earnedRuns;
    this.scoreText.setText(`Score: ${this.score}`);

    // Increase combo
    this.comboHits++;
    if (this.comboHits % 3 === 0) {
      this.multiplier = Math.min(this.multiplier + 1, 5);
      this.multiplierText.setText(`Combo: x${this.multiplier}`);
    }

    // Show run text with animation
    this.showRunText(runs, hitQuality);

    // Emit score
    this.game.events.emit("score", this.score);

    // Reset ball after delay
    this.time.delayedCall(2000, () => {
      if (!this.isGameOver) {
        this.resetBall();
      }
    });
  }

  private showRunText(runs: number, hitQuality: number) {
    if (this.lastRunText) {
      this.lastRunText.destroy();
    }

    const w = this.scale.width;
    const h = this.scale.height;
    
    let text = `${runs} run${runs !== 1 ? 's' : ''}`;
    let color = "#fbbf24";
    
    if (runs === 6) {
      text = "SIX! 🎯";
      color = "#c026d3";
    } else if (runs === 4) {
      text = "FOUR! 🔥";
      color = "#f97316";
    }

    if (this.multiplier > 1) {
      text += ` x${this.multiplier}`;
    }

    this.lastRunText = this.add.text(w / 2, h / 2 - 50, text, {
      font: "bold 36px Arial",
      color: color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(15);

    // Animate text
    this.tweens.add({
      targets: this.lastRunText,
      y: h / 2 - 100,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: "Power2",
      onComplete: () => {
        this.lastRunText?.destroy();
      },
    });
  }

  private handleWicket() {
    this.wickets++;
    this.wicketsText.setText(`Wickets: ${this.wickets}/${this.maxWickets}`);
    
    // Reset combo and multiplier
    this.comboHits = 0;
    this.multiplier = 1;
    this.multiplierText.setText(`Combo: x${this.multiplier}`).setColor("#ffffff");
    
    // Show wicket text
    const w = this.scale.width;
    const h = this.scale.height;
    const wicketText = this.add.text(w / 2, h / 2, "WICKET! 💥", {
      font: "bold 42px Arial",
      color: "#ef4444",
      stroke: "#000000",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: wicketText,
      scale: 1.3,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        wicketText.destroy();
      },
    });

    if (this.wickets >= this.maxWickets) {
      this.endGame("All Out!");
    } else {
      // Reset ball for next wicket
      this.time.delayedCall(2000, () => {
        if (!this.isGameOver) {
          this.resetBall();
        }
      });
    }
  }

  private endGame(reason: string) {
    this.isGameOver = true;
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    
    const w = this.scale.width;
    const h = this.scale.height;
    
    // Create game over overlay
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7);
    overlay.setOrigin(0, 0);
    overlay.setDepth(20);

    const gameOverContainer = this.add.container(w / 2, h / 2);
    gameOverContainer.setDepth(21);

    const title = this.add.text(0, -80, reason, {
      font: "bold 36px Arial",
      color: "#fbbf24",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const finalScore = this.add.text(0, -20, `Final Score: ${this.score}`, {
      font: "bold 28px Arial",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const stats = this.add.text(0, 20, `Balls: ${this.ballsPlayed} | Wickets: ${this.wickets}`, {
      font: "18px Arial",
      color: "#ffffff",
    }).setOrigin(0.5);

    gameOverContainer.add([title, finalScore, stats]);

    this.game.events.emit("gameover", true);
    this.game.events.emit("finalscore", this.score);
  }
}
