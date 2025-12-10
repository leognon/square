// Keyboard input manager
const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

class InputManager {
  constructor(game) {
    this.game = game;
  }

  handleKeyPress(key, keyCode) {
    // Arrow keys for gameplay
    if (keyCode === UP_ARROW) {
      this.game.onButtonDown(UP);
      return;
    } else if (keyCode === DOWN_ARROW) {
      this.game.onButtonDown(DOWN);
      return;
    } else if (keyCode === LEFT_ARROW) {
      this.game.onButtonDown(LEFT);
      return;
    } else if (keyCode === RIGHT_ARROW) {
      this.game.onButtonDown(RIGHT);
      return;
    }

    // Other keys
    const lowerKey = key.toLowerCase();

    if (lowerKey === 'p') {
      this.game.togglePlay();
    } else if (lowerKey === 't') {
      this.game.skipTime();
    } else if (lowerKey === 'i') {
      this.game.toggleInvertControls();
    } else if (lowerKey === 'c') {
      this.game.toggleCheats();
    } else if (lowerKey === 'h') {
      this.game.toggleHelp();
    }
  }
}
