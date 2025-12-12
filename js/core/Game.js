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
      new Level("Mario", "assets/audio/GroundThemeShortened.wav", marioWith35, 5),
      new Level("Tetris", "assets/audio/tetris_shortened.wav", tetrisWith25, 8),
      new Level("Megalovania", "assets/audio/megalovania_shortened.wav", megWith13, 13)
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
    this.highScores = [0, 0, 0]; // High scores for each level

    // Load saved settings
    this.loadSettings();

    // Update help popup with loaded settings
    this.helpPopup.updateInvertText(this.invertControls);
    this.helpPopup.updateCheatsText(this.cheatsEnabled);

    // UI elements for start screen
    this.levelLabel = new OutlinedLabel("", 60);
    this.startHint = new OutlinedLabel("Press P to start", 32);
    this.highScoreLabel = new OutlinedLabel("", 32);
    this.helpButtonLabel = new OutlinedLabel("?", 48);
    this.helpButtonRadius = 32;
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

    this.camera.resetReflections();

    // Center camera on player at start
    this.player.getCameraOffset(this.camera);

    this.levelLabel.setText(currentLevel.title);
  }

  reset() {
    // Check for high score before resetting
    this.updateHighScore(this.currentLevelIdx, this.player.score);

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

    // Don't reset score/combo - they persist to show final score
    // (only reset when starting a new game via togglePlay)
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

  instantReset() {
    if (this.state === GameState.PLAYING) {
      // Set lives to 0 and trigger death with fast animation (250ms)
      this.player.lives = 0;
      this.setLives(0);
      const currentTime = this.audioController.getTime();
      this.player.triggerDeath(this.camera, currentTime, 0.25);
    }
  }

  toggleInvertControls() {
    if (this.helpPopup.visible) {
      this.invertControls = !this.invertControls;
      this.helpPopup.updateInvertText(this.invertControls);
      this.saveSettings();
    }
  }

  toggleCheats() {
    if (this.helpPopup.visible) {
      this.cheatsEnabled = !this.cheatsEnabled;
      this.helpPopup.updateCheatsText(this.cheatsEnabled);
      this.saveSettings();
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

      // Update gem displays to animate particles
      for (const gem of this.gemDisplays) {
        gem.update(dt);
      }
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

    // Render HUD (always visible so player can see their score)
    this.hud.render();

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

      // Draw box with double border (black outside, white inside)
      noFill();

      // Black outer border
      stroke(0);
      strokeWeight(6);
      rect(this.levelBoxX, this.levelBoxY, this.levelBoxW, this.levelBoxH);

      // White inner border
      stroke(255);
      strokeWeight(2);
      rect(this.levelBoxX, this.levelBoxY, this.levelBoxW, this.levelBoxH);

      // Draw label
      this.levelLabel.render();

      // Start hint - position above player with proper spacing
      const hintFontSize = 24;
      textSize(hintFontSize);
      const hintWidth = textWidth("Press P to start");
      const textHeight = textAscent() + textDescent();

      // Position with left edge at player's left edge, extending right
      const worldX = this.player.x + hintWidth / 2 - this.player.size / 2;
      const worldY = this.player.y - this.player.size / 2 - textHeight / 2 - 10;
      const [screenX, screenY] = this.camera.worldToScreen(worldX, worldY, 0);

      this.startHint.fontSize = hintFontSize;
      this.startHint.setPosition(screenX, screenY);
      this.startHint.render();

      // High score
      const highScore = this.highScores[this.currentLevelIdx];
      this.highScoreLabel.setText(`High Score: ${highScore}`);
      this.highScoreLabel.setPosition(width / 2, height - 200);
      this.highScoreLabel.render();

      // Help button
      this.helpButtonX = width - 60;
      this.helpButtonY = height - 60;

      fill(50, 50, 50, 230);
      noStroke();
      ellipse(this.helpButtonX, this.helpButtonY, this.helpButtonRadius * 2);

      // Offset Y slightly for better visual centering with stroke
      this.helpButtonLabel.setPosition(this.helpButtonX, this.helpButtonY - 6);
      this.helpButtonLabel.render();
    }

    // Render help popup (on top of everything)
    this.helpPopup.render();
  }

  loadSettings() {
    try {
      // Load settings from localStorage
      const saved = localStorage.getItem('soothingSquareSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.invertControls = settings.invertControls || false;
        this.cheatsEnabled = settings.cheatsEnabled || false;
        this.highScores = settings.highScores || [0, 0, 0];
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  saveSettings() {
    try {
      // Save settings to localStorage
      const settings = {
        invertControls: this.invertControls,
        cheatsEnabled: this.cheatsEnabled,
        highScores: this.highScores
      };
      localStorage.setItem('soothingSquareSettings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  updateHighScore(levelIdx, score) {
    if (score > this.highScores[levelIdx]) {
      this.highScores[levelIdx] = score;
      this.saveSettings();
      return true; // New high score!
    }
    return false;
  }
}
