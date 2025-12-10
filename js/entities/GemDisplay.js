// Triangular direction indicators at bounce points
const GEM_SIZE = 6;  // Matches original Kivy value

class GemDisplay {
  constructor(x, y, wallDir, bounceDir, scale) {
    this.size = GEM_SIZE * scale / 100;
    this.x = x;
    this.y = y;
    this.wallDir = wallDir;
    this.bounceDir = bounceDir;  // [xDir, yDir] where each is 1 or -1
    this.hue = 0.7;
    this.brightness = 0.8;
    this.visible = true;
    this.particles = [];
  }

  getTrianglePoints() {
    const height = this.size * 1.5;
    const width = height * Math.sqrt(3) / 2;

    if (this.wallDir === VERT) {
      if (this.bounceDir[0] < 0) {
        // Point right
        return [
          this.x + width / 2, this.y,
          this.x - width / 2, this.y + height / 2,
          this.x - width / 2, this.y - height / 2
        ];
      } else {
        // Point left
        return [
          this.x - width / 2, this.y,
          this.x + width / 2, this.y + height / 2,
          this.x + width / 2, this.y - height / 2
        ];
      }
    } else {  // HORZ
      if (this.bounceDir[1] < 0) {
        // Point up
        return [
          this.x, this.y + height / 2,
          this.x - width / 2, this.y - height / 2,
          this.x + width / 2, this.y - height / 2
        ];
      } else {
        // Point down
        return [
          this.x, this.y - height / 2,
          this.x - width / 2, this.y + height / 2,
          this.x + width / 2, this.y + height / 2
        ];
      }
    }
  }

  onHit(autoplayed, camera, time) {
    this.brightness = 0.8;

    // Only create particle effect if not autoplayed (during invincibility or cheats)
    if (!autoplayed) {
      const [screenX, screenY] = camera.worldToScreen(this.x, this.y, time);
      const particle = new ParticleEffect(screenX, screenY, 33, 0, 204, 1);
      this.particles.push(particle);
    }

    // Hide triangle
    this.visible = false;
  }

  onPass() {
    this.brightness = 0.2;  // Dim the gem
  }

  reset() {
    this.brightness = 0.8;
    this.visible = true;
    this.particles = [];
  }

  update(dt) {
    // Update particles
    this.particles = this.particles.filter(p => p.update(dt));
  }

  render(camera, time) {
    // Render particles
    for (const particle of this.particles) {
      particle.render();
    }

    if (!this.visible) return;

    const points = this.getTrianglePoints();

    colorMode(HSB, 1);
    fill(this.hue, 1.0, this.brightness);
    noStroke();

    beginShape();
    for (let i = 0; i < points.length; i += 2) {
      const [sx, sy] = camera.worldToScreen(points[i], points[i + 1], time);
      vertex(sx, sy);
    }
    endShape(CLOSE);

    colorMode(RGB, 255);
  }
}
