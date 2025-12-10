// Particle explosion effect for hits and deaths
class ParticleEffect {
  constructor(x, y, r, g, b, scale = 1) {
    this.particles = [];
    this.lifespan = 0.7;  // seconds
    this.time = 0;
    this.alive = true;

    const numParticles = Math.floor(20 * scale);
    for (let i = 0; i < numParticles; i++) {
      const angle = random(TWO_PI);
      const speed = random(200, 400);

      this.particles.push({
        x: x,
        y: y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: random(scale * 5, scale * 15),
        r: r,
        g: g,
        b: b
      });
    }
  }

  update(dt) {
    this.time += dt;

    if (this.time > this.lifespan) {
      this.alive = false;
      return false;
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    return true;
  }

  render() {
    if (!this.alive) return;

    for (const p of this.particles) {
      const alpha = (1 - this.time / this.lifespan) * 255;
      const size = p.size * (1 - this.time / this.lifespan);

      fill(p.r, p.g, p.b, alpha);
      noStroke();
      ellipse(p.x, p.y, size, size);
    }
  }

  isAlive() {
    return this.alive;
  }
}
