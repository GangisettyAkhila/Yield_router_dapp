import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private bat!: Phaser.Physics.Arcade.Sprite;
  private ball!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

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
    }

    // Pitch area (use image if available, otherwise draw)
    if (this.textures.exists("pitchImg")) {
      const p = this.add.image(w / 2, h - 80, "pitchImg");
      // scale pitch to fit width with some margin
      p.setDisplaySize(w - 80, 120);
    } else {
      const pitch = this.add.rectangle(w / 2, h - 80, w - 80, 120, 0xdbeafe);
      pitch.setStrokeStyle(2, 0x93c5fd);
    }

    // Bat (player) - prefer loaded image
    if (this.textures.exists("batImg")) {
      this.bat = this.physics.add.sprite(w / 2, h - 110, "batImg");
      this.bat.setDisplaySize(120, 18);
    } else {
      const batG = this.make.graphics({ x: 0, y: 0 });
      batG.fillStyle(0x6b4ce6, 1);
      batG.fillRoundedRect(0, 0, 120, 18, 8);
      batG.generateTexture("batTexture", 120, 18);
      this.bat = this.physics.add.sprite(w / 2, h - 110, "batTexture");
    }
    this.bat.setCollideWorldBounds(true);
    this.bat.setImmovable(true);
    // ensure bat does not respond to gravity
    (this.bat.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Ball - prefer loaded image
    if (this.textures.exists("ballImg")) {
      this.ball = this.physics.add.image(w / 2 - 100, 50, "ballImg");
      this.ball.setDisplaySize(16, 16);
    } else {
      const ballG = this.make.graphics({ x: 0, y: 0 });
      ballG.fillStyle(0xef4444, 1);
      ballG.fillCircle(8, 8, 8);
      ballG.generateTexture("ballTexture", 16, 16);
      this.ball = this.physics.add.image(w / 2 - 100, 50, "ballTexture");
    }
    this.ball.setCircle(8);
    this.ball.setBounce(0.8);
    this.ball.setCollideWorldBounds(true);
    this.ball.setVelocity(120, 20);

    // Collider
  this.physics.add.collider(this.ball, this.bat, (a: any, b: any) => this.handleHit(a, b), undefined, this);

    // Input
  this.cursors = this.input.keyboard!.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.bat.x = Phaser.Math.Clamp(pointer.x, 60, this.scale.width - 60);
    });

    // Score text
    this.scoreText = this.add
      .text(12, 12, `Score: ${this.score}`, { font: "16px Arial", color: "#0f172a" })
      .setDepth(10);

    // World bounds bottom check for wicket
    this.physics.world.on("worldbounds", (body: any) => {
      // not used here
    });

    // Emit ready
    this.game.events.emit("ready");
  }

  update() {
    if (this.isGameOver) return;

    if (this.cursors.left?.isDown) {
      this.bat.x -= 6;
    } else if (this.cursors.right?.isDown) {
      this.bat.x += 6;
    }

    // If ball falls past pitch bottom -> wicket
    if (this.ball.y > this.scale.height - 40) {
      // check overlap with bat
      const dist = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.bat.x, this.bat.y);
      if (dist > 80) {
        this.handleWicket();
      } else {
        // bounce a bit when near
        this.ball.setVelocityY(-200);
      }
    }
  }

  private handleHit(ball: Phaser.GameObjects.GameObject, bat: Phaser.GameObjects.GameObject) {
    // send ball upwards with some random variation
    const vx = Phaser.Math.Between(-120, 120);
    const vy = Phaser.Math.Between(-400, -200);
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    this.score += Phaser.Math.Between(1, 6);
    this.scoreText.setText(`Score: ${this.score}`);
    this.game.events.emit("score", this.score);
  }

  private handleWicket() {
    this.isGameOver = true;
    // stop ball
    (this.ball.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, `Wicket! Final Score: ${this.score}`, {
        font: "20px Arial",
        color: "#b91c1c",
      })
      .setOrigin(0.5);

    this.game.events.emit("gameover", true);
  }
}
