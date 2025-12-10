// Level configuration and generation
// Original Kivy: SCALE = 300 * Metrics.dpi / 192
// For standard web (96 DPI): 300 * 96 / 192 = 150
const SCALE = 150;  // Coordinate scaling factor (matches 96 DPI baseline)
const MAX_ATTEMPTS = 1000000;  // Maximum generation attempts

class Level {
  constructor(title, audioFile, gems, numLives) {
    this.title = title;
    this.audioFile = audioFile;
    this.gems = gems;  // Array of [time, direction] pairs
    this.numLives = numLives;

    this.bouncePoints = null;
    this.wallBouncePoints = null;
    this.lWall = null;
    this.rWall = null;
    this.playArea = null;

    this.generate();
  }

  generate() {
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      try {
        // Generate bounce points from gems
        const [bouncePoints, wallBouncePoints] = gemsToBouncePoints(this.gems);

        if (bouncePoints === null || wallBouncePoints === null) {
          attempts++;
          continue;
        }

        // Generate walls from bounce points
        const [lWall, rWall] = bouncePointsToWalls(wallBouncePoints, bouncePoints);

        // Scale to screen coordinates
        this.lWall = lWall.map(pt => createVector(pt.x * SCALE, pt.y * SCALE));
        this.rWall = rWall.map(pt => createVector(pt.x * SCALE, pt.y * SCALE));

        this.bouncePoints = bouncePoints.map(bp => {
          const newBp = new BouncePoint(
            createVector(bp.pt.x * SCALE, bp.pt.y * SCALE),
            bp.dir,
            bp.bounceDir
          );
          return newBp;
        });

        this.wallBouncePoints = wallBouncePoints;

        // Create play area
        this.playArea = new PlayArea(this.lWall, this.rWall);

        console.log(`Level "${this.title}" generated successfully after ${attempts + 1} attempts`);
        return;

      } catch (error) {
        if (error instanceof InvalidLevel) {
          attempts++;
          continue;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to generate level "${this.title}" after ${MAX_ATTEMPTS} attempts`);
  }
}
