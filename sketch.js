// Global variables
let game;
let inputManager;
let customFont;
let deathSound;

// Preload assets
function preload() {
  customFont = loadFont('assets/fonts/upheavtt.ttf');
  deathSound = loadSound('assets/audio/death_sound.wav');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(customFont);

  game = new Game();
  inputManager = new InputManager(game);
}

function draw() {
  background(0);

  const dt = deltaTime / 1000;  // Convert to seconds
  game.update(dt);
  game.render();
}

function keyPressed() {
  inputManager.handleKeyPress(key, keyCode);

  // Prevent default browser behavior for arrow keys and game controls
  if (keyCode === UP_ARROW || keyCode === DOWN_ARROW ||
      keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW ||
      key === 'p' || key === 'P' || key === 't' || key === 'T' ||
      key === 'i' || key === 'I' || key === 'c' || key === 'C' ||
      key === 'h' || key === 'H') {
    return false;
  }
}

function mousePressed() {
  game.handleClick(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
