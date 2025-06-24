// Basketball movement logic for HW06 - Phase 1
// Handles movement state, key events, and position updates

export function createMovementState() {
  return {
    left: false,
    right: false,
    up: false,
    down: false
  };
}

export const BALL_MOVE_SPEED = 6; // meters per second

export function handleMovementKey(e, isDown, moveState) {
  switch (e.key) {
    case 'ArrowLeft':
      moveState.left = isDown;
      break;
    case 'ArrowRight':
      moveState.right = isDown;
      break;
    case 'ArrowUp':
      moveState.up = isDown;
      break;
    case 'ArrowDown':
      moveState.down = isDown;
      break;
  }
}

// Update basketball position based on movement state and boundaries
export function updateBasketballPosition(basketball, moveState, delta, boundaries) {
  let dx = 0, dz = 0;
  if (moveState.left) dx -= BALL_MOVE_SPEED * delta;
  if (moveState.right) dx += BALL_MOVE_SPEED * delta;
  if (moveState.up) dz -= BALL_MOVE_SPEED * delta;
  if (moveState.down) dz += BALL_MOVE_SPEED * delta;
  if (dx !== 0 || dz !== 0) {
    let newX = basketball.position.x + dx;
    let newZ = basketball.position.z + dz;
    newX = Math.max(boundaries.minX, Math.min(boundaries.maxX, newX));
    newZ = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, newZ));
    basketball.position.x = newX;
    basketball.position.z = newZ;
  }
}

// Utility to get court boundaries for the ball
export function getCourtBoundaries(courtLength, courtWidth, margin = 0.2) {
  return {
    minX: -courtLength / 2 + margin,
    maxX: courtLength / 2 - margin,
    minZ: -courtWidth / 2 + margin,
    maxZ: courtWidth / 2 - margin
  };
} 