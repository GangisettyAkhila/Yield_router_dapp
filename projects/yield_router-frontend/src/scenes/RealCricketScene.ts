import Phaser from "phaser";

/*
 RealCricketScene.ts
 A more realistic mini cricket batting experience.
 Features:
  - Ball delivery phases: run-up, release, flight, bounce, approach
  - Timing window + shot direction + power (charge) -> outcome
  - Outcomes: dot, 1,2,3,4,6,wicket, edge (chance), miss
  - Over & innings tracking: configurable overs, wickets limit
  - Combo / momentum mechanic boosts boundary chances
  - Emits events: delivery, outcome, scoreUpdate, overComplete, inningsComplete
*/

export interface DeliveryOutcomeMeta {
  runs: number;
  outcome: string; // e.g. "four", "six", "single", "wicket"
  timing: number; // 0..1 how close to ideal
  power: number; // 0..1 charged power
  direction: string; // chosen direction
}

interface ConfigOpts {
  overs?: number;
  ballsPerOver?: number;
  maxWickets?: number;
}

export default class RealCricketScene extends Phaser.Scene {
  private bat!: Phaser.Physics.Arcade.Sprite;
  private ball!: Phaser.Physics.Arcade.Image;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private score = 0;
  private wickets = 0;
  private balls = 0;
  private oversCompleted = 0;

  private overs = 2;
  private ballsPerOver = 6;
  private maxWickets = 3;

  private direction: "OFF" | "STRAIGHT" | "LEG" = "STRAIGHT";
  private charging = false;
  private chargeValue = 0; // 0..1

  private deliveryState: "idle" | "runup" | "flight" | "resolved" = "idle";
  private deliveryStart = 0;
  private flightTime = 1200; // ms total to batsman
  private bounceDone = false;
  private idealHitTime = 0; // timestamp for ideal contact

  private comboHits = 0;

  constructor() {
    super({ key: "RealCricketScene" });
  }

  init(data: ConfigOpts) {
    if (data.overs) this.overs = data.overs;
    if (data.ballsPerOver) this.ballsPerOver = data.ballsPerOver;
    if (data.maxWickets) this.maxWickets = data.maxWickets;
  }

  preload() {
    // Could load assets here; fallback procedural if not present.
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background gradient (simple two-tone)
    const bgTop = this.add.rectangle(0, 0, w, h / 2, 0x0b1b1f);
    bgTop.setOrigin(0, 0);
    bgTop.setDepth(-10);
    const bgBottom = this.add.rectangle(0, h / 2, w, h / 2, 0x082a33);
    bgBottom.setOrigin(0, 0);
    bgBottom.setDepth(-10);

    // Pitch rectangle
    const pitch = this.add.rectangle(w * 0.5, h * 0.5, w * 0.6, h * 0.5, 0x1b4d35);
    pitch.setStrokeStyle(4, 0xffffff, 0.15);

    // Crease line
    this.add.line(0, 0, w * 0.2, h * 0.5 + h * 0.2, w * 0.8, h * 0.5 + h * 0.2, 0xffffff, 0.2).setLineWidth(2);

    // Bat
    const batG = this.make.graphics({ x: 0, y: 0 });
    batG.fillStyle(0x8b5e34, 1);
    batG.fillRoundedRect(0, 0, 110, 22, 8);
    batG.generateTexture("batTex", 110, 22);
    this.bat = this.physics.add.sprite(w * 0.75, h * 0.5 + h * 0.2 - 60, "batTex");
    this.bat.setCollideWorldBounds(true);
    this.bat.setImmovable(true);
    (this.bat.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Ball
    const ballG = this.make.graphics({ x: 0, y: 0 });
    ballG.fillStyle(0xffd166, 1);
    ballG.fillCircle(8, 8, 8);
    ballG.generateTexture("ballTex", 16, 16);
    this.ball = this.physics.add.image(w * 0.25, h * 0.3, "ballTex");
    this.ball.setCircle(8);
    this.ball.setBounce(0.4);
    this.ball.setCollideWorldBounds(true);
    (this.ball.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Collider triggers resolution if contact occurs early
    this.physics.add.overlap(this.ball, this.bat, () => {
      if (this.deliveryState === "flight") {
        this.resolveShot(true);
      }
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.bat.x = Phaser.Math.Clamp(p.x, w * 0.55, w * 0.9);
    });

    this.input.keyboard!.on("keydown-ONE", () => (this.direction = "OFF"));
    this.input.keyboard!.on("keydown-TWO", () => (this.direction = "STRAIGHT"));
    this.input.keyboard!.on("keydown-THREE", () => (this.direction = "LEG"));
    this.input.keyboard!.on("keydown-SPACE", () => this.startCharging());
    this.input.keyboard!.on("keyup-SPACE", () => this.stopCharging());

    // UI texts
    const style = { font: "16px Poppins", color: "#ffffff" };
    this.add.text(16, 16, "Real Cricket Mode", { font: "20px Poppins", color: "#ffffff" });
    this.add.text(16, 44, "1=OFF 2=STRAIGHT 3=LEG | Hold SPACE to charge", style);

    this.events.emit("ready");
    this.scheduleDelivery();
  }

  update(time: number, delta: number) {
    if (this.cursors.left?.isDown) this.bat.x -= 6;
    if (this.cursors.right?.isDown) this.bat.x += 6;

    const w = this.scale.width;
    this.bat.x = Phaser.Math.Clamp(this.bat.x, w * 0.55, w * 0.9);

    if (this.charging) {
      this.chargeValue = Math.min(1, this.chargeValue + delta * 0.0012);
      this.events.emit("chargeUpdate", this.chargeValue);
    }

    if (this.deliveryState === "flight") {
      const t = time - this.deliveryStart;
      const progress = Phaser.Math.Clamp(t / this.flightTime, 0, 1);

      // simple path with bounce near middle
      const startX = w * 0.25;
      const endX = w * 0.75;
      const x = Phaser.Math.Linear(startX, endX, progress);

      let y;
      if (!this.bounceDone && progress > 0.55) {
        this.bounceDone = true;
      }
      if (!this.bounceDone) {
        y = Phaser.Math.Interpolation.Linear([this.scale.height * 0.3, this.scale.height * 0.45], progress * 1.2);
      } else {
        y = Phaser.Math.Interpolation.Linear([this.scale.height * 0.45, this.bat.y - 30], (progress - 0.55) / 0.45);
      }

      this.ball.setPosition(x, y);

      // Ideal hit moment near end
      this.idealHitTime = this.deliveryStart + this.flightTime - 120;

      if (progress >= 1) {
        this.resolveShot(false);
      }
    }
  }

  private scheduleDelivery() {
    this.deliveryState = "runup";
    this.deliveryStart = this.time.now;
    this.time.delayedCall(450, () => {
      this.beginFlight();
    });
    this.events.emit("delivery", { ball: this.balls + 1 });
  }

  private beginFlight() {
    this.deliveryState = "flight";
    this.deliveryStart = this.time.now;
    this.bounceDone = false;
    this.chargeValue = 0;
    this.charging = false;
  }

  private resolveShot(contact: boolean) {
    if (this.deliveryState === "resolved") return;
    this.deliveryState = "resolved";

    const now = this.time.now;
    const timing = Phaser.Math.Clamp(1 - Math.abs(now - this.idealHitTime) / 220, 0, 1);
    const power = this.chargeValue;

    let outcome: string = "dot";
    let runs = 0;

    if (contact || timing > 0.3) {
      // direction influence: OFF/LEG when ball line bias (simulate with random) yields extra chance
      const lineBias = (Math.random() - 0.5) * 0.6; // -0.3..0.3
      const directionMatch = (this.direction === "OFF" && lineBias < -0.1) || (this.direction === "LEG" && lineBias > 0.1) || (this.direction === "STRAIGHT" && Math.abs(lineBias) < 0.12);

      const quality = power * 0.55 + timing * 0.35 + (directionMatch ? 0.15 : 0);

      if (quality > 0.85) { outcome = "six"; runs = 6; }
      else if (quality > 0.7) { outcome = "four"; runs = 4; }
      else if (quality > 0.55) { outcome = "three"; runs = 3; }
      else if (quality > 0.35) { outcome = "double"; runs = 2; }
      else if (quality > 0.15) { outcome = "single"; runs = 1; }
      else { outcome = "dot"; runs = 0; }

      // combo boost boundaries
      if (this.comboHits >= 3 && runs >= 4 && Math.random() < 0.4) {
        outcome = "six"; runs = 6;
      }

      // wicket chance if mistimed & low power
      if (quality < 0.18 && Math.random() < 0.25) {
        outcome = "wicket"; runs = 0; this.wickets++; this.comboHits = 0;
      } else if (runs > 0) {
        this.comboHits++;
      } else {
        this.comboHits = 0; // dot resets momentum build
      }

    } else {
      // pure miss
      if (Math.random() < 0.2) { outcome = "wicket"; this.wickets++; this.comboHits = 0; }
      else outcome = "miss";
    }

    if (outcome !== "wicket" && runs > 0) {
      this.score += runs;
    }

    this.balls++;

    const meta: DeliveryOutcomeMeta = { runs, outcome, timing, power, direction: this.direction };
    this.events.emit("outcome", meta);
    this.events.emit("scoreUpdate", { score: this.score, wickets: this.wickets, balls: this.balls });

    // innings/over checks
    if (this.balls % this.ballsPerOver === 0) {
      this.oversCompleted++;
      this.events.emit("overComplete", { over: this.oversCompleted, score: this.score });
    }

    const inningsDone = this.oversCompleted >= this.overs || this.wickets >= this.maxWickets;
    if (inningsDone) {
      this.events.emit("inningsComplete", { score: this.score, wickets: this.wickets, balls: this.balls });
    } else {
      this.time.delayedCall(750, () => this.scheduleDelivery());
    }
  }

  private startCharging() {
    if (this.deliveryState !== "flight") return;
    this.charging = true;
  }
  private stopCharging() {
    this.charging = false;
  }
}
