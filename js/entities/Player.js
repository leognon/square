// Player square with movement, scoring, and trail effect
const SQUARE_SIZE = 0.1;  // Relative size (matches generator.py)
const SLOP = 0.1;  // 100ms timing window (latency compensated in AudioController)
const INVINCIBILITY_WINDOW = 1.0;  // 1 second grace period
const DEATH_RESET_TIME = 2.0;  // Time to animate back to start after death

// Interpolation helper
function interp(t0, t1, v0, v1, t) {
  if (t1 === t0) return v1;
  const ratio = (t - t0) / (t1 - t0);
  return v0 + (v1 - v0) * ratio;
}

class Player {
  constructor(game, x, y, numLives, gems, bouncePoints) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.size = SQUARE_SIZE * SCALE;  // Convert relative size to pixels
    this.vx = SCALE;
    this.vy = SCALE;

    this.nextGemIdx = 0;
    this.lastBouncePt = [x, y];
    this.lastBounceTime = 0;
    this.time = 0;

    this.gems = gems;
    this.bouncePoints = bouncePoints;

    this.reflectH = false;
    this.reflectV = false;

    this.score = 0;
    this.combo = 0;
    this.lives = numLives;
    this.lastMiss = -99999;

    // Reset animation
    this.resetStartTime = 0;
    this.resettingUntil = 0;
    this.deathPosition = [0, 0];

    // Trail effect
    this.trailLen = 12;
    this.trail = [];

    // Particles
    this.particles = [];
  }

  resetReflections() {
    this.reflectH = false;
    this.reflectV = false;
  }

  getCameraOffset(camera) {
    const screenCx = width / 2;
    const screenCy = height / 2;

    const deadZone = 0.1;
    const deadZoneX = width * deadZone;
    const deadZoneY = height * deadZone;

    const playerScreenX = this.x + camera.x;
    const playerScreenY = this.y + camera.y;

    const dx = playerScreenX - screenCx;
    const dy = playerScreenY - screenCy;

    if (Math.abs(dx) > deadZoneX) {
      camera.x += screenCx - playerScreenX + (dx > 0 ? deadZoneX : -deadZoneX);
    }

    if (Math.abs(dy) > deadZoneY) {
      camera.y += screenCy - playerScreenY + (dy > 0 ? deadZoneY : -deadZoneY);
    }

    camera.setFlip(this.reflectH, this.reflectV);
    return camera;
  }

  getBounceDirection(hv) {
    if (hv === HORZ) {
      // Y increases downward, so if moving to higher Y, we're going DOWN
      return this.lastBouncePt[1] < this.bouncePoints[this.nextGemIdx].pt.y ? DOWN : UP;
    }
    return this.lastBouncePt[0] < this.bouncePoints[this.nextGemIdx].pt.x ? RIGHT : LEFT;
  }

  bounceDirWithReflection(dir) {
    if (this.reflectH) {
      if (dir === LEFT) return RIGHT;
      else if (dir === RIGHT) return LEFT;
    }
    if (this.reflectV) {
      if (dir === UP) return DOWN;
      else if (dir === DOWN) return UP;
    }
    return dir;
  }

  onButtonDown(buttonIdx, invertControls) {
    const [nextGemTime, nextGemHv] = this.gems[this.nextGemIdx];

    let correctDir = this.getBounceDirection(nextGemHv);
    correctDir = this.bounceDirWithReflection(correctDir);

    if (invertControls) {
      if (correctDir === LEFT) correctDir = RIGHT;
      else if (correctDir === RIGHT) correctDir = LEFT;
      else if (correctDir === UP) correctDir = DOWN;
      else if (correctDir === DOWN) correctDir = UP;
    }

    // Use current audio time instead of this.time for more accurate timing
    const currentTime = this.game.audioController.getTime();
    if (buttonIdx === correctDir && Math.abs(currentTime - nextGemTime) < SLOP) {
      this.hitGem(false);
    }
  }

  hitGem(autoplayed) {
    this.game.gemDisplays[this.nextGemIdx].onHit(autoplayed, this.game.camera, this.time);

    if (!autoplayed) {
      this.combo += 1;
      const multiplier = this.getMultiplier(this.combo);
      this.score += multiplier * 100;
      this.game.setScore(this.score);
      this.game.setCombo(this.combo);
    }

    this.lastBouncePt = [this.x, this.y];
    this.lastBounceTime = this.time;

    if (this.nextGemIdx < this.gems.length - 1) {
      this.nextGemIdx += 1;
    }
  }

  getMultiplier(combo) {
    if (combo >= 8) return 8;
    if (combo >= 4) return 4;
    if (combo >= 2) return 2;
    return 1;
  }

  update(time, cheatsEnabled, camera) {
    this.time = time;

    // Interpolate position between bounce points
    const [nextGemTime, nextGemHv] = this.gems[this.nextGemIdx];

    if (this.nextGemIdx === this.gems.length - 1 && this.time >= nextGemTime) {
      // Level complete
      this.x = this.bouncePoints[this.nextGemIdx].pt.x;
      this.y = this.bouncePoints[this.nextGemIdx].pt.y;
      return;
    } else {
      let startX, startY, startTime;

      if (this.nextGemIdx > 0 && this.time > nextGemTime) {
        startX = this.bouncePoints[this.nextGemIdx - 1].pt.x;
        startY = this.bouncePoints[this.nextGemIdx - 1].pt.y;
        startTime = this.gems[this.nextGemIdx - 1][0];
      } else {
        startX = this.lastBouncePt[0];
        startY = this.lastBouncePt[1];
        startTime = this.lastBounceTime;
      }

      this.x = interp(
        startTime,
        nextGemTime,
        startX,
        this.bouncePoints[this.nextGemIdx].pt.x,
        this.time
      );

      this.y = interp(
        startTime,
        nextGemTime,
        startY,
        this.bouncePoints[this.nextGemIdx].pt.y,
        this.time
      );
    }

    // Autoplay during invincibility or with cheats
    const autoplay = cheatsEnabled || (this.time <= this.lastMiss + INVINCIBILITY_WINDOW);

    if (autoplay && this.time > nextGemTime && this.nextGemIdx < this.gems.length - 1) {
      this.hitGem(true);
    }

    // Check for miss (but not during autoplay/invincibility)
    if (!autoplay && this.time - nextGemTime > SLOP && this.nextGemIdx < this.gems.length - 1) {
      this.lastBouncePt = [this.x, this.y];
      this.lastBounceTime = this.time;
      this.lastMiss = this.time;
      this.combo = 0;
      this.lives -= 1;
      this.game.setCombo(this.combo);
      this.game.setLives(this.lives);

      // Check for game over
      if (this.lives <= 0) {
        // Set up reset animation
        this.resetStartTime = this.time;
        this.resettingUntil = this.time + DEATH_RESET_TIME;
        this.deathPosition = [this.x, this.y];
        this.lastBouncePt = [this.x, this.y];
        this.lastBounceTime = this.time;

        // Trigger game over state
        this.game.gameOver();

        // Spawn particles
        const [screenX, screenY] = camera.worldToScreen(this.x, this.y, this.time);
        const particle = new ParticleEffect(screenX, screenY, 255, 0, 0, 3);
        this.particles.push(particle);
      } else {
        this.nextGemIdx += 1;
        if (nextGemHv === HORZ) {
          this.reflectV = !this.reflectV;
        } else {
          this.reflectH = !this.reflectH;
        }
      }
    }

    this.updateTrail();

    // Update particles
    this.particles = this.particles.filter(p => p.update(deltaTime / 1000));
  }

  updateTrail() {
    this.trail.push([this.x, this.y]);
    if (this.trail.length > this.trailLen) {
      this.trail.shift();
    }
  }

  updateResetting(time) {
    this.time = time;

    if (this.time < this.resettingUntil) {
      // Interpolate position back to (0, 0)
      this.x = interp(
        this.resetStartTime,
        this.resettingUntil,
        this.deathPosition[0],
        0,
        this.time
      );
      this.y = interp(
        this.resetStartTime,
        this.resettingUntil,
        this.deathPosition[1],
        0,
        this.time
      );
    } else {
      // Animation complete - trigger reset
      this.x = 0;
      this.y = 0;
      this.game.reset();
    }

    this.updateTrail();

    // Update particles
    this.particles = this.particles.filter(p => p.update(deltaTime / 1000));
  }

  render(camera, time) {
    // Render particles
    for (const particle of this.particles) {
      particle.render();
    }

    // Render trail
    for (let i = 0; i < this.trail.length; i++) {
      const [wx, wy] = this.trail[i];
      const [tx, ty] = camera.worldToScreen(wx, wy, time);
      const alpha = (i + 1) / this.trailLen;

      fill(255, 0, 0, alpha * 0.3 * 255);
      noStroke();
      rectMode(CENTER);
      rect(tx, ty, this.size, this.size);
    }

    // Render main player square
    const [screenX, screenY] = camera.worldToScreen(this.x, this.y, time);
    fill(255, 0, 0);
    noStroke();
    rectMode(CENTER);
    rect(screenX, screenY, this.size, this.size);

    // Reset to default rect mode
    rectMode(CORNER);
  }

  reset() {
    this.nextGemIdx = 0;
    this.lastBouncePt = [0, 0];
    this.lastBounceTime = 0;
    this.time = 0;
    this.lastMiss = -99999;
    this.score = 0;
    this.combo = 0;
    this.trail = [];
    this.particles = [];

    // Reset reflection state
    this.reflectH = false;
    this.reflectV = false;
  }
}
