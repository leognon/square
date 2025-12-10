// Constants
const SQUARE_SPEED = 1;
const INIT_SQUARE_VEL = [SQUARE_SPEED, SQUARE_SPEED];
const SQUARE_SIZE_GEN = 0.1;  // Generator uses smaller size for calculations

// Exceptions
class InvalidLevel extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidLevel";
  }
}

// Helper functions
function invert(dir) {
  return dir === VERT ? HORZ : VERT;
}

function lerpGen(t, a, b) {
  return a * t + b * (1 - t);
}

function bounce(vel, dir) {
  // vel is [vx, vy] array
  if (dir === VERT) {
    return [-vel[0], vel[1]];
  } else if (dir === HORZ) {
    return [vel[0], -vel[1]];
  } else {
    throw new Error("Invalid direction: " + dir);
  }
}

// LineSegment class
class LineSegment {
  constructor(p1, p2) {
    // p1 and p2 can be arrays or p5.Vectors
    if (p1.x !== undefined) {
      this.p1 = createVector(p1.x, p1.y);
    } else {
      this.p1 = createVector(p1[0], p1[1]);
    }

    if (p2.x !== undefined) {
      this.p2 = createVector(p2.x, p2.y);
    } else {
      this.p2 = createVector(p2[0], p2[1]);
    }
  }

  intersects(other) {
    // Endpoints are exclusive
    const x1 = this.p1.x, y1 = this.p1.y;
    const x2 = this.p2.x, y2 = this.p2.y;
    const x3 = other.p1.x, y3 = other.p1.y;
    const x4 = other.p2.x, y4 = other.p2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < 1e-10) {
      return null;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    const eps = 1e-5;
    if (t > eps && t < 1 - eps && u > eps && u < 1 - eps) {
      return p5.Vector.lerp(this.p1, this.p2, t);
    }

    return null;
  }
}

// Convert player bounce point to wall bounce point
function playerBouncePtToWallBouncePt(bouncePoint) {
  const offsetVec = [...bouncePoint.bounceDir];
  if (bouncePoint.dir === VERT) {
    offsetVec[1] = 0;
  } else {
    offsetVec[0] = 0;
  }

  const newPos = createVector(
    bouncePoint.pt.x - (SQUARE_SIZE_GEN / 2) * offsetVec[0],
    bouncePoint.pt.y - (SQUARE_SIZE_GEN / 2) * offsetVec[1]
  );

  return new BouncePoint(newPos, bouncePoint.dir, bouncePoint.bounceDir);
}

// Convert gems (time, direction pairs) to bounce points
function gemsToBouncePoints(gems) {
  let squareVel = [...INIT_SQUARE_VEL];
  let squarePos = [0.0, 0.0];
  let lastTime = 0;
  const bouncePoints = [];
  const wallBouncePoints = [];

  for (const [time, wallDir] of gems) {
    const deltaTime = time - lastTime;

    // Update position
    squarePos[0] += squareVel[0] * deltaTime;
    squarePos[1] += squareVel[1] * deltaTime;

    // Bounce
    squareVel = bounce(squareVel, wallDir);

    // Calculate bounce direction (which way square is heading after bounce)
    const bounceDir = [
      squareVel[0] > 0 ? 1 : -1,
      squareVel[1] > 0 ? 1 : -1
    ];

    const bouncePoint = new BouncePoint(
      createVector(squarePos[0], squarePos[1]),
      wallDir,
      bounceDir
    );

    bouncePoints.push(bouncePoint);
    wallBouncePoints.push(playerBouncePtToWallBouncePt(bouncePoint));

    lastTime = time;
  }

  // Check for self-intersection in the square path
  const segments = [
    new LineSegment(
      [-SQUARE_SIZE_GEN / 2, -SQUARE_SIZE_GEN / 2],
      bouncePoints[0].pt
    ),
    new LineSegment(
      [-SQUARE_SIZE_GEN / 2, -SQUARE_SIZE_GEN / 2],
      [-SQUARE_SIZE_GEN / 2, bouncePoints[1].pt.y]
    ),
    new LineSegment(
      [-SQUARE_SIZE_GEN / 2, bouncePoints[1].pt.y],
      bouncePoints[1].pt
    ),
    new LineSegment(
      [-SQUARE_SIZE_GEN / 2, -SQUARE_SIZE_GEN / 2],
      [bouncePoints[0].pt.x, -SQUARE_SIZE_GEN / 2]
    ),
    new LineSegment(
      [bouncePoints[0].pt.x, -SQUARE_SIZE_GEN / 2],
      bouncePoints[0].pt
    )
  ];

  for (let i = 0; i < bouncePoints.length - 1; i++) {
    segments.push(new LineSegment(bouncePoints[i].pt, bouncePoints[i + 1].pt));
  }

  // Check for intersections
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 2; j < segments.length; j++) {
      // Skip adjacent segments since they share an endpoint
      if (segments[i].intersects(segments[j]) !== null) {
        return [null, null];
      }
    }
  }

  return [bouncePoints, wallBouncePoints];
}

// Wall class for procedural generation
class Wall {
  constructor(initialPoint, firstBouncePt, allSquareBouncePoints) {
    // Convert initialPoint array of vectors to flat points array
    this.points = [];
    for (const p of initialPoint) {
      if (p.x !== undefined) {
        this.points.push(createVector(p.x, p.y));
      } else {
        this.points.push(createVector(p[0], p[1]));
      }
    }
    this.points.push(firstBouncePt.pt.copy());

    this.prevBouncePt = firstBouncePt;
    this.allSquareBouncePoints = allSquareBouncePoints;
  }

  addPoint(bouncePt, shouldRaise) {
    if (this.prevBouncePt.dir === bouncePt.dir) {
      this.addPointToStraightWall(bouncePt, shouldRaise);
    } else {
      this.addPointToCurvedWall(bouncePt, shouldRaise);
    }
    this.prevBouncePt = bouncePt;
  }

  addPointToStraightWall(bouncePt, shouldRaise) {
    // Check if points are inline
    const isInlineHorz = bouncePt.dir === HORZ &&
      Math.abs(this.points[this.points.length - 1].y - bouncePt.pt.y) < 1e-10;
    const isInlineVert = bouncePt.dir === VERT &&
      Math.abs(this.points[this.points.length - 1].x - bouncePt.pt.x) < 1e-10;

    if (isInlineHorz || isInlineVert) {
      this.points.push(bouncePt.pt.copy());
      this.prevBouncePt = bouncePt;
      return;
    }

    const midpoint = p5.Vector.lerp(this.points[this.points.length - 1], bouncePt.pt, 0.5);
    this.addCurve(
      this.getCornerPt(this.prevBouncePt.dir, this.prevBouncePt.pt, midpoint),
      midpoint,
      shouldRaise
    );

    // Check if square has changed sides
    const hasChangedSides = (
      bouncePt.dir === VERT &&
      this.prevBouncePt.bounceDir[1] !== bouncePt.bounceDir[1]
    ) || (
      bouncePt.dir === HORZ &&
      this.prevBouncePt.bounceDir[0] !== bouncePt.bounceDir[0]
    );

    const bouncePtDirToUse = hasChangedSides ? bouncePt.dir : invert(bouncePt.dir);

    this.addCurve(
      this.getCornerPt(bouncePtDirToUse, midpoint, bouncePt.pt),
      bouncePt.pt,
      shouldRaise
    );
  }

  getCornerPt(dir, ptA, ptB) {
    if (dir === VERT) {
      // Wall is vertical at ptA
      return createVector(ptA.x, ptB.y);
    } else {
      // Wall is horizontal at ptA
      return createVector(ptB.x, ptA.y);
    }
  }

  addPointToCurvedWall(bouncePt, shouldRaise) {
    let adjustmentDir = null;

    if (
      this.prevBouncePt.dir === HORZ &&
      this.prevBouncePt.bounceDir[1] !== bouncePt.bounceDir[1]
    ) {
      const dir1x = bouncePt.pt.x > this.prevBouncePt.pt.x ? 1 : -1;
      const dir1y = bouncePt.pt.y > this.prevBouncePt.pt.y ? 1 : -1;
      const dir2x = bouncePt.bounceDir[0];
      const dir2y = bouncePt.bounceDir[1];

      if (dir1x === dir2x && dir1y !== dir2y) {
        adjustmentDir = [dir2x, 0];
      }
    } else if (
      this.prevBouncePt.dir === VERT &&
      this.prevBouncePt.bounceDir[0] !== bouncePt.bounceDir[0]
    ) {
      const dir1x = bouncePt.pt.x > this.prevBouncePt.pt.x ? 1 : -1;
      const dir1y = bouncePt.pt.y > this.prevBouncePt.pt.y ? 1 : -1;
      const dir2x = bouncePt.bounceDir[0];
      const dir2y = bouncePt.bounceDir[1];

      if (dir1x !== dir2x && dir1y === dir2y) {
        adjustmentDir = [0, dir2y];
      }
    }

    if (adjustmentDir === null) {
      this.addCurve(
        this.getCornerPt(this.prevBouncePt.dir, this.prevBouncePt.pt, bouncePt.pt),
        bouncePt.pt,
        shouldRaise
      );
    } else {
      const adjustment = createVector(
        1.5 * SQUARE_SIZE_GEN * adjustmentDir[0],
        1.5 * SQUARE_SIZE_GEN * adjustmentDir[1]
      );
      const adjustedPt = p5.Vector.sub(bouncePt.pt, adjustment);

      this.addCurve(
        this.getCornerPt(this.prevBouncePt.dir, this.prevBouncePt.pt, adjustedPt),
        adjustedPt,
        shouldRaise
      );
      this.points.push(bouncePt.pt.copy());
    }
  }

  wouldBeZeroWidth(pt) {
    const line = p5.Vector.sub(
      this.points[this.points.length - 1],
      this.points[this.points.length - 2]
    );
    const magSq = line.magSq();

    if (magSq < 1e-8) {
      return null;
    }

    const ptMinusP2 = p5.Vector.sub(pt, this.points[this.points.length - 2]);
    const t = ptMinusP2.dot(line) / magSq;

    // Check that pt is on line
    const projectedPt = p5.Vector.add(
      this.points[this.points.length - 2],
      p5.Vector.mult(line, t)
    );
    const distance = p5.Vector.dist(pt, projectedPt);

    if (distance > 1e-8) {
      return null;
    }

    if (t >= 1) {
      return null;
    }

    return true;
  }

  addCurve(ptA, ptB, shouldRaise) {
    const wallSeg1 = new LineSegment(this.points[this.points.length - 1], ptA);
    const wallSeg2 = new LineSegment(ptA, ptB);

    if (this.wouldBeZeroWidth(ptA)) {
      const ptBminusA = p5.Vector.sub(ptB, ptA);
      const adjustment = p5.Vector.mult(ptBminusA.normalize(), 1.5 * SQUARE_SIZE_GEN);
      this.points.push(p5.Vector.add(this.points[this.points.length - 1], adjustment));
      ptA = p5.Vector.add(ptA, adjustment);
    }

    // Check for intersections with square path
    for (let i = 0; i < this.allSquareBouncePoints.length - 1; i++) {
      const p1 = this.allSquareBouncePoints[i].pt;
      const p2 = this.allSquareBouncePoints[i + 1].pt;

      const halfSize = SQUARE_SIZE_GEN / 2;
      const cornerOffsets = [
        createVector(0, 0),
        createVector(-halfSize, -halfSize),
        createVector(halfSize, -halfSize),
        createVector(halfSize, halfSize),
        createVector(-halfSize, halfSize)
      ];

      const bounceSegments = cornerOffsets.map(offset =>
        new LineSegment(
          p5.Vector.add(p1, offset),
          p5.Vector.add(p2, offset)
        )
      );

      let ptAInt = null;
      let ptBInt = null;

      for (const bounceSeg of bounceSegments) {
        const int1 = wallSeg1.intersects(bounceSeg);
        const int2 = wallSeg2.intersects(bounceSeg);
        if (int1 !== null) {
          ptAInt = int1;
        }
        if (int2 !== null) {
          ptBInt = int2;
        }
      }

      if ((ptAInt === null) !== (ptBInt === null) && shouldRaise) {
        throw new InvalidLevel(
          "Invalid path: curve intersects square path at only one point"
        );
      }

      if (ptAInt !== null && ptBInt !== null) {
        const clearance = 0.25;
        const ptACorner = p5.Vector.lerp(this.points[this.points.length - 1], ptAInt, clearance);
        const ptBCorner = p5.Vector.lerp(ptB, ptBInt, clearance);

        const wallSeg1IsVertical = Math.abs(wallSeg1.p1.x - wallSeg1.p2.x) < 1e-10;
        const cornerDir = wallSeg1IsVertical ? HORZ : VERT;

        const cornerPt = this.getCornerPt(cornerDir, ptACorner, ptBCorner);
        this.addCurve(ptACorner, cornerPt, shouldRaise);
        this.addCurve(ptBCorner, ptB, shouldRaise);
        return;
      }
    }

    this.points.push(ptA.copy());
    this.points.push(ptB.copy());
  }
}

// Main generation function: convert bounce points to walls
function bouncePointsToWalls(bouncePts, squareBouncePoints) {
  // Require first two bounces to be in same direction (vertical)
  if (bouncePts[0].dir !== bouncePts[1].dir || bouncePts[0].dir !== VERT) {
    throw new InvalidLevel("We require first two bounces to be in same dir");
  }

  const innerWall = new Wall(
    [
      createVector(-SQUARE_SIZE_GEN / 2, -SQUARE_SIZE_GEN / 2),
      createVector(bouncePts[0].pt.x, -SQUARE_SIZE_GEN / 2)
    ],
    bouncePts[0],
    squareBouncePoints
  );

  const outerWall = new Wall(
    [
      createVector(-SQUARE_SIZE_GEN / 2, -SQUARE_SIZE_GEN / 2),
      createVector(-SQUARE_SIZE_GEN / 2, bouncePts[1].pt.y - SQUARE_SIZE_GEN),
      createVector(bouncePts[1].pt.x, bouncePts[1].pt.y - SQUARE_SIZE_GEN)
    ],
    bouncePts[1],
    squareBouncePoints
  );

  let currWallIsInner = false;

  for (let i = 0; i < bouncePts.length; i++) {
    if (i === 0 || i === 1) {
      continue;
    }

    const pt = bouncePts[i];

    if (bouncePts[i - 1].dir === pt.dir) {
      currWallIsInner = !currWallIsInner;
    }

    const currentWall = currWallIsInner ? innerWall : outerWall;
    currentWall.addPoint(pt, true);
  }

  // Connect the end walls
  const currentWall = currWallIsInner ? outerWall : innerWall;
  const finalPt = new BouncePoint(
    bouncePts[bouncePts.length - 1].pt,
    invert(bouncePts[bouncePts.length - 1].dir),
    bounce(currentWall.prevBouncePt.bounceDir, invert(bouncePts[bouncePts.length - 1].dir))
  );
  currentWall.addPoint(finalPt, false);

  return [innerWall.points, outerWall.points];
}
