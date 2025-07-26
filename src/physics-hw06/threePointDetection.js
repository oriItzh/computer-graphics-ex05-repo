// Three-point detection utilities for HW06
// Determines if a shot qualifies as a 3-point shot based on ball position

// --- 3-Point Line Constants (from basketballCourt.js) ---
const COURT_LENGTH = 28.65;
const COURT_WIDTH = 15.24;
const RIM_RADIUS = 0.225;
const BACKBOARD_THICKNESS = 0.05;
const RIM_TO_BACKBOARD_X = BACKBOARD_THICKNESS + RIM_RADIUS;
const THREE_POINT_ARC_RADIUS = 7.24;
const THREE_POINT_SIDE_Z = COURT_WIDTH / 2 - 0.91;
const X_OFFSET = 1;

// Calculate the X offset from basket center to the 3-point line
const THREE_POINT_X_OFFSET_FROM_BASKET = Math.sqrt(
  THREE_POINT_ARC_RADIUS * THREE_POINT_ARC_RADIUS - THREE_POINT_SIDE_Z * THREE_POINT_SIDE_Z
);

export function isThreePointShot(ballPos) {
  const courtHalfLength = COURT_LENGTH / 2;
  
  // Determine which half-court the ball is on
  if (ballPos.x < 0) {
    // Left half-court (shooting at right hoop)
    const leftHoopX = -courtHalfLength;
    const basketCenterX = leftHoopX + RIM_TO_BACKBOARD_X + X_OFFSET;
    
    // Check if ball is behind the 3-point line
    return isPositionBehindThreePointLine(ballPos, basketCenterX, true);
  } else {
    // Right half-court (shooting at left hoop)
    const rightHoopX = courtHalfLength;
    const basketCenterX = rightHoopX - RIM_TO_BACKBOARD_X - X_OFFSET;
    
    // Check if ball is behind the 3-point line
    return isPositionBehindThreePointLine(ballPos, basketCenterX, false);
  }
}

function isPositionBehindThreePointLine(pos, basketCenterX, isLeftSide) {
  // Check if position is in the straight-line section first
  if (Math.abs(pos.z) >= THREE_POINT_SIDE_Z) {
    // In the straight-line section of the 3-point line
    if (isLeftSide) {
      // For left side, need to be further left (smaller X) than the 3-point line
      const threePointStraightX = basketCenterX + THREE_POINT_X_OFFSET_FROM_BASKET;
      return pos.x < threePointStraightX;
    } else {
      // For right side, need to be further right (larger X) than the 3-point line
      const threePointStraightX = basketCenterX - THREE_POINT_X_OFFSET_FROM_BASKET;
      return pos.x > threePointStraightX;
    }
  } else {
    // In the arc section - calculate distance from basket center
    const distanceFromBasket = Math.sqrt(
      Math.pow(pos.x - basketCenterX, 2) + Math.pow(pos.z, 2)
    );
    return distanceFromBasket > THREE_POINT_ARC_RADIUS;
  }
}

export function getShotTypeDisplay(ballPos) {
  return isThreePointShot(ballPos) ? "3-POINT" : "2-POINT";
}

export function getShotPoints(ballPos) {
  return isThreePointShot(ballPos) ? 3 : 2;
}
