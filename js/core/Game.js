// Main game state machine
const GameState = {
  START: 0,
  PLAYING: 1,
  RESETTING: 2
};

class Game {
  constructor() {
    this.currentLevelIdx = 0;

    // Create Level instances
    this.levels = [
      new Level("Mario", "assets/audio/GroundThemeShortened.wav", marioWith35, 3),
      new Level("Tetris", "assets/audio/tetris_shortened.wav", tetrisWith25, 5),
      new Level("Megalovania", "assets/audio/megalovania_shortened.wav", megWith13, 10)
    ];

    this.state = GameState.START;
    this.camera = new Camera();
    this.player = null;
    this.playArea = null;
    this.gemDisplays = [];
    this.audioController = null;
    this.hud = new HUD();
    this.helpPopup = new HelpPopup();

    // Game settings
    this.invertControls = false;
    this.cheatsEnabled = false;

    // UI elements for start screen
    this.levelLabel = new OutlinedLabel("", 60);
    this.startHint = new OutlinedLabel("Press P to start", 32);
    this.helpButtonLabel = new OutlinedLabel("?", 60);
    this.helpButtonRadius = 40;
    this.helpButtonX = 0;
    this.helpButtonY = 0;
    this.levelBoxX = 0;
    this.levelBoxY = 0;
    this.levelBoxW = 0;
    this.levelBoxH = 0;

    this.createPlayArea();
  }

  createPlayArea() {
    const currentLevel = this.levels[this.currentLevelIdx];

    // Create audio controller (deathSound is global from sketch.js preload)
    this.audioController = new AudioController(currentLevel.audioFile, deathSound);

    this.state = GameState.START;

    // Create play area from walls
    this.playArea = currentLevel.playArea;

    // Create gem displays
    this.gemDisplays = [];
    for (let i = 0; i < currentLevel.bouncePoints.length; i++) {
      const bp = currentLevel.bouncePoints[i];
      const gem = new GemDisplay(
        bp.pt.x,
        bp.pt.y,
        bp.dir,
        bp.bounceDir,
        SCALE
      );
      this.gemDisplays.push(gem);
    }

    // Create player
    this.player = new Player(
      this,
      0,
      0,
      currentLevel.numLives,
      currentLevel.gems,
      currentLevel.bouncePoints
    );

    this.camera.reset();

    // Center camera on player at start
    this.player.getCameraOffset(this.camera);

    this.levelLabel.setText(currentLevel.title);
  }

  reset() {
    this.state = GameState.START;
    this.player.reset();
    this.player.lives = this.levels[this.currentLevelIdx].numLives;
    this.audioController.reset();
    this.camera.reset();

    // Center camera on player
    this.player.getCameraOffset(this.camera);

    for (const gem of this.gemDisplays) {
      gem.reset();
    }

    this.setScore(0);
    this.setCombo(0);
    this.setLives(this.player.lives);
    this.audioController.unmute();
  }

  gameOver() {
    this.audioController.mute();
    this.audioController.playDeathSound();
    this.state = GameState.RESETTING;
    // Player will call reset() when animation completes
  }

  togglePlay() {
    if (this.state === GameState.START) {
      this.state = GameState.PLAYING;
      this.player.score = 0;
      this.player.combo = 0;
      this.player.lives = this.levels[this.currentLevelIdx].numLives;
      this.setScore(0);
      this.setCombo(0);
      this.setLives(this.player.lives);
      this.audioController.unmute();
      this.helpPopup.hide();
    }
    this.audioController.toggle();
  }

  skipTime() {
    if (this.state === GameState.PLAYING) {
      this.audioController.skip();
    }
  }

  toggleInvertControls() {
    if (this.helpPopup.visible) {
      this.invertControls = !this.invertControls;
      this.helpPopup.updateInvertText(this.invertControls);
    }
  }

  toggleCheats() {
    if (this.helpPopup.visible) {
      this.cheatsEnabled = !this.cheatsEnabled;
      this.helpPopup.updateCheatsText(this.cheatsEnabled);
    }
  }

  toggleHelp() {
    this.helpPopup.toggle();
  }

  setScore(score) {
    this.hud.setScore(score);
  }

  setCombo(combo) {
    this.hud.setCombo(combo);
  }

  setLives(lives) {
    this.hud.setLives(lives);
  }

  onButtonDown(buttonIdx) {
    if (this.state === GameState.PLAYING) {
      this.player.onButtonDown(buttonIdx, this.invertControls);
    }
  }

  handleClick(x, y) {
    if (this.state !== GameState.START) return;

    // Check level box click
    if (x >= this.levelBoxX && x <= this.levelBoxX + this.levelBoxW &&
        y >= this.levelBoxY && y <= this.levelBoxY + this.levelBoxH) {
      // Cycle to next level
      this.currentLevelIdx = (this.currentLevelIdx + 1) % this.levels.length;
      this.player.resetReflections();
      this.createPlayArea();
      return;
    }

    // Check help button click
    const dist = Math.sqrt(
      (x - this.helpButtonX) ** 2 + (y - this.helpButtonY) ** 2
    );
    if (dist <= this.helpButtonRadius) {
      this.helpPopup.toggle();
      return;
    }
  }

  update(dt) {
    if (this.state === GameState.PLAYING) {
      const time = this.audioController.getTime();
      this.player.update(time, this.cheatsEnabled, this.camera);
      this.player.getCameraOffset(this.camera);
      this.camera.update(time);

      // Update gem displays
      for (const gem of this.gemDisplays) {
        gem.update(dt);
      }
    } else if (this.state === GameState.RESETTING) {
      // Animate player back to start and update particles
      const time = this.audioController.getTime();
      this.player.updateResetting(time);
      this.player.getCameraOffset(this.camera);
      this.camera.update(time);
    }
  }

  render() {
    const time = this.audioController.getTime();

    // Render play area (maze)
    if (this.playArea) {
      this.playArea.render(this.camera, time);
    }

    // Render gem displays
    for (const gem of this.gemDisplays) {
      gem.render(this.camera, time);
    }

    // Render player
    if (this.player) {
      this.player.render(this.camera, time);
    }

    // Render HUD
    if (this.state === GameState.PLAYING) {
      this.hud.render();
    }

    // Render start screen UI
    if (this.state === GameState.START) {
      // Level title box
      this.levelLabel.setText(this.levels[this.currentLevelIdx].title);
      this.levelLabel.setPosition(width / 2, height - 150);

      // Calculate box around label
      const boxPadding = 20;
      textSize(60);
      const textW = textWidth(this.levels[this.currentLevelIdx].title);
      const textH = 60;
      this.levelBoxX = width / 2 - textW / 2 - boxPadding;
      this.levelBoxY = height - 150 - textH / 2 - boxPadding;
      this.levelBoxW = textW + boxPadding * 2;
      this.levelBoxH = textH + boxPadding * 2;

      // Draw box
      noFill();
      stroke(255);
      strokeWeight(2);
      rect(this.levelBoxX, this.levelBoxY, this.levelBoxW, this.levelBoxH);

      // Draw label
      this.levelLabel.render();

      // Start hint
      this.startHint.setPosition(width / 2, height - 80);
      this.startHint.render();

      // Help button
      this.helpButtonX = width - 60;
      this.helpButtonY = height - 60;

      fill(50, 50, 50, 230);
      noStroke();
      ellipse(this.helpButtonX, this.helpButtonY, this.helpButtonRadius * 2);

      this.helpButtonLabel.setPosition(this.helpButtonX, this.helpButtonY);
      this.helpButtonLabel.render();
    }

    // Render help popup (on top of everything)
    this.helpPopup.render();
  }
}
