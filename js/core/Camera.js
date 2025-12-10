// Camera system with smooth flipping animation
const FLIP_ANIMATION_LENGTH = 0.2;  // seconds

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.reflectH = false;
    this.reflectV = false;

    // For smooth animation
    this.lastFlipTime = -100;
    this.prevReflectH = false;
    this.prevReflectV = false;
    this.lastFrameReflectH = false;
    this.lastFrameReflectV = false;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  setFlip(reflectH, reflectV) {
    this.reflectH = reflectH;
    this.reflectV = reflectV;
  }

  update(time) {
    // Detect flip state change
    if (this.reflectH !== this.lastFrameReflectH ||
        this.reflectV !== this.lastFrameReflectV) {
      this.prevReflectH = this.lastFrameReflectH;
      this.prevReflectV = this.lastFrameReflectV;
      this.lastFlipTime = time;
    }

    this.lastFrameReflectH = this.reflectH;
    this.lastFrameReflectV = this.reflectV;
  }

  worldToScreen(worldX, worldY, time) {
    let screenX = worldX + this.x;
    let screenY = worldY + this.y;

    // Interpolate horizontal flip
    const startX = this.getFlipPos(screenX, this.prevReflectH, 'HORZ');
    const endX = this.getFlipPos(screenX, this.reflectH, 'HORZ');

    if (time - this.lastFlipTime <= FLIP_ANIMATION_LENGTH) {
      const t = (time - this.lastFlipTime) / FLIP_ANIMATION_LENGTH;
      screenX = lerp(startX, endX, t);
    } else {
      screenX = endX;
    }

    // Interpolate vertical flip
    const startY = this.getFlipPos(screenY, this.prevReflectV, 'VERT');
    const endY = this.getFlipPos(screenY, this.reflectV, 'VERT');

    if (time - this.lastFlipTime <= FLIP_ANIMATION_LENGTH) {
      const t = (time - this.lastFlipTime) / FLIP_ANIMATION_LENGTH;
      screenY = lerp(startY, endY, t);
    } else {
      screenY = endY;
    }

    return [screenX, screenY];
  }

  getFlipPos(val, flip, dir) {
    const winSize = (dir === 'HORZ') ? width : height;
    return flip ? (winSize - val) : val;
  }

  reset() {
    // Reset timing variables but preserve reflection state
    this.prevReflectH = this.reflectH;
    this.prevReflectV = this.reflectV;
    this.lastFrameReflectH = this.reflectH;
    this.lastFrameReflectV = this.reflectV;
    this.lastFlipTime = -100;
  }

  resetReflections() {
    // Full reset including reflection state (used when switching levels)
    this.reflectH = false;
    this.reflectV = false;
    this.prevReflectH = false;
    this.prevReflectV = false;
    this.lastFrameReflectH = false;
    this.lastFrameReflectV = false;
    this.lastFlipTime = -100;
  }
}
