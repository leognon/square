// Heads-Up Display for score, combo, and lives
class HUD {
  constructor() {
    this.scoreLabel = new OutlinedLabel("Score: 0", 40);
    this.comboLabel = new OutlinedLabel("Combo: 0", 40);
    this.livesLabel = new OutlinedLabel("Lives: 3", 40);

    this.score = 0;
    this.combo = 0;
    this.lives = 3;
  }

  setScore(score) {
    this.score = score;
    this.scoreLabel.setText(`Score: ${score}`);
  }

  setCombo(combo) {
    this.combo = combo;
    let multiplier = "";
    if (combo >= 8) {
      multiplier = " (8x)";
    } else if (combo >= 4) {
      multiplier = " (4x)";
    } else if (combo >= 2) {
      multiplier = " (2x)";
    }
    this.comboLabel.setText(`Combo: ${combo}${multiplier}`);
  }

  setLives(lives) {
    this.lives = lives;
    this.livesLabel.setText(`Lives: ${lives}`);
  }

  render() {
    // Position labels at top of screen with fixed margins to prevent overlap
    this.scoreLabel.setPosition(width / 2, 50);
    this.scoreLabel.render();

    this.comboLabel.setPosition(150, 50);  // Fixed left position
    this.comboLabel.render();

    this.livesLabel.setPosition(width - 150, 50);  // Fixed right position
    this.livesLabel.render();
  }
}
