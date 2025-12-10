// PlayArea renders the procedurally-generated maze
class PlayArea {
  constructor(lWall, rWall) {
    // lWall and rWall are arrays of p5.Vector points
    // Combine them to form a closed polygon
    this.vertices = [];

    // Add left wall points
    for (const pt of lWall) {
      this.vertices.push(pt.copy());
    }

    // Add right wall points in reverse order
    for (let i = rWall.length - 1; i >= 0; i--) {
      this.vertices.push(rWall[i].copy());
    }
  }

  render(camera, time) {
    // Animate outline color (rainbow cycling)
    const hue = (time * 0.1) % 1.0;  // Cycle hue over time
    colorMode(HSB, 1);

    // Draw filled polygon (white)
    fill(0, 0, 1);  // White in HSB
    noStroke();
    beginShape();
    for (const pt of this.vertices) {
      const [sx, sy] = camera.worldToScreen(pt.x, pt.y, time);
      vertex(sx, sy);
    }
    endShape(CLOSE);

    // Draw outline (rainbow)
    stroke(hue, 1, 1);  // Animated HSB color
    strokeWeight(2.5);
    noFill();
    beginShape();
    for (const pt of this.vertices) {
      const [sx, sy] = camera.worldToScreen(pt.x, pt.y, time);
      vertex(sx, sy);
    }
    endShape(CLOSE);

    // Reset to RGB mode
    colorMode(RGB, 255);
  }
}
