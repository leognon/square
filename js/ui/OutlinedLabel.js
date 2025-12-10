// Text label with black outline for visibility
class OutlinedLabel {
  constructor(text, fontSize = 50) {
    this.text = text;
    this.fontSize = fontSize;
    this.x = 0;
    this.y = 0;
  }

  setText(text) {
    this.text = text;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  render() {
    textSize(this.fontSize);
    textAlign(CENTER, CENTER);

    // Use p5.js native text stroke for outline
    fill(255);  // White text
    stroke(0);  // Black outline
    strokeWeight(6);  // Outline thickness
    text(this.text, this.x, this.y);

    // Reset stroke for other rendering
    noStroke();
  }
}
