// Constants
const VERT = "vert";
const HORZ = "horz";

class BouncePoint {
  constructor(pt, dir, bounceDir) {
    // pt is a p5.Vector
    this.pt = pt.copy();
    this.dir = dir;  // "vert" or "horz"

    // When the square bounces off it will go in this direction
    // bounceDir is a tuple/array [xDir, yDir] where each is 1 or -1
    this.bounceDir = bounceDir;
  }

  toString() {
    return `(${this.pt.toString()}, ${this.dir})`;
  }
}
