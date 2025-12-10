// Help overlay with controls and instructions
class HelpPopup {
  constructor() {
    this.visible = false;
    this.labels = [];

    const instructions = [
      "Soothing Square",
      "",
      "Press arrow keys when the square bounces off walls",
      "Match the direction of the wall (not where the square is going)",
      "",
      "P: Play/Pause",
      "I: Invert Controls (OFF)",
      "C: Cheats (OFF)",
      "T: Instant Reset",
      "H: Toggle Help",
      "",
      "Click to close"
    ];

    for (let i = 0; i < instructions.length; i++) {
      const label = new OutlinedLabel(instructions[i], 30);
      this.labels.push(label);
    }

    this.invertStatusIndex = 6;
    this.cheatsStatusIndex = 7;
  }

  toggle() {
    this.visible = !this.visible;
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  updateInvertText(inverted) {
    const status = inverted ? "ON" : "OFF";
    this.labels[this.invertStatusIndex].setText(`I: Invert Controls (${status})`);
  }

  updateCheatsText(enabled) {
    const status = enabled ? "ON" : "OFF";
    this.labels[this.cheatsStatusIndex].setText(`C: Cheats (${status})`);
  }

  render() {
    if (!this.visible) return;

    // Draw semi-transparent background
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);

    // Draw labels
    const startY = height / 2 - (this.labels.length * 40) / 2;
    for (let i = 0; i < this.labels.length; i++) {
      this.labels[i].setPosition(width / 2, startY + i * 40);
      this.labels[i].render();
    }
  }
}
