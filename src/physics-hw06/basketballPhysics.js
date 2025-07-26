// Basketball physics and shooting logic for HW06
// Handles shot mechanics, collision detection, and ball physics

// --- Physics Constants ---
export const GRAVITY = -9.8; // m/s^2
export const BOUNCE_RESTITUTION = 0.65; // energy loss on bounce
export const BALL_RADIUS = 0.12; // must match basketball.js
export const BALL_GROUND_OFFSET = 0.15; // must match basketball.js

// --- Shot Controls Constants ---
export const SHOT_POWER_STEP = 2; // percent per key press
export const SHOT_POWER_MIN = 0;
export const SHOT_POWER_MAX = 100;
export const ANGLE_STEP = 5; // degrees per key press
export const VERTICAL_ANGLE_MIN = 0;
export const VERTICAL_ANGLE_MAX = 180;
export const HORIZONTAL_ANGLE_MIN = -180;
export const HORIZONTAL_ANGLE_MAX = 180;

// --- Physics State ---
export function createPhysicsState() {
  return {
    ballVelocity: new THREE.Vector3(0, 0, 0),
    inFlight: false,
    shotPower: 50,
    verticalAngle: 50,
    horizontalAngle: 0,
    ballRotationAxis: new THREE.Vector3(1, 0, 0),
    ballRotationSpeed: 0,
    prevBallPos: new THREE.Vector3(0, 0, 0),
    trajectoryLine: null,
    shotPosition: new THREE.Vector3(0, 0, 0) // Position where the shot was taken from
  };
}

// --- Shot Power Functions ---
export function clampShotPower(val) {
  return Math.max(SHOT_POWER_MIN, Math.min(SHOT_POWER_MAX, val));
}

export function updateShotPowerDisplay(shotPower) {
  const el = document.getElementById('shot-power-indicator');
  if (el) el.textContent = `Shot Power: ${shotPower}%`;
}

// --- Angle Functions ---
export function clampVerticalAngle(val) {
  return Math.max(VERTICAL_ANGLE_MIN, Math.min(VERTICAL_ANGLE_MAX, val));
}

export function clampHorizontalAngle(val) {
  // Allow wrapping for horizontal angle
  while (val > HORIZONTAL_ANGLE_MAX) val -= 360;
  while (val < HORIZONTAL_ANGLE_MIN) val += 360;
  return val;
}

export function updateAngleDisplays(verticalAngle, horizontalAngle) {
  const vertEl = document.getElementById('vertical-angle-indicator');
  if (vertEl) vertEl.textContent = `Vertical Angle: ${verticalAngle}°`;
  // Horizontal angle display removed since auto-aiming is used
}

// --- Velocity Calculation ---
export function getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle, horizAngle) {
  // Calculate initial velocity vector using the specified angles
  const vertAngleRad = vertAngle * Math.PI / 180;
  const horizAngleRad = horizAngle * Math.PI / 180;
  
  // Power scales the initial speed
  const minSpeed = 6.5; // m/s (tunable)
  const maxSpeed = 13.0; // m/s (tunable)
  const speed = minSpeed + (maxSpeed - minSpeed) * (powerPercent / 100);
  
  // Calculate velocity components based on angles
  // Vertical angle: 0° = horizontal, 90° = straight up
  // Horizontal angle: 0° = towards positive X, 90° = towards positive Z
  const vx = speed * Math.cos(vertAngleRad) * Math.cos(horizAngleRad);
  const vy = speed * Math.sin(vertAngleRad);
  const vz = speed * Math.cos(vertAngleRad) * Math.sin(horizAngleRad);
  
  return new THREE.Vector3(vx, vy, vz);
}

// --- Ball Rotation Functions ---
export function updateBallRotation(basketball, velocity, delta) {
  // Only rotate if moving
  const speed = velocity.length();
  if (speed > 0.01) {
    // Axis is perpendicular to velocity (in XZ plane for rolling, in 3D for flight)
    const axis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
    const ballRotationAxis = axis;
    const ballRotationSpeed = speed / BALL_RADIUS; // radians/sec
    basketball.rotateOnAxis(ballRotationAxis, ballRotationSpeed * delta);
  }
}

// --- Collision Detection ---
export function isBallThroughHoop(ballPos, prevBallPos, hoopPos, RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND) {
  // Define the circular plane at rim height
  const rimY = RIM_HEIGHT_ABOVE_GROUND;
  const rimCenter = new THREE.Vector3(hoopPos.x, rimY, hoopPos.z);
  const planeNormal = new THREE.Vector3(0, 1, 0); // pointing up
  
  // Check if ball crossed the plane from above to below
  const wasAbove = prevBallPos.y > rimY;
  const isBelow = ballPos.y <= rimY;
  
  if (!wasAbove || !isBelow) {
    return false; // Ball didn't cross the plane from above
  }
  
  // Find the intersection point where the ball trajectory crosses the rim plane
  const trajectory = new THREE.Vector3().subVectors(ballPos, prevBallPos);
  const t = (rimY - prevBallPos.y) / trajectory.y;
  
  // Calculate the exact intersection point on the rim plane
  const intersectionPoint = new THREE.Vector3().addVectors(
    prevBallPos,
    trajectory.multiplyScalar(t)
  );
  
  // Check if the intersection point is within the circular rim
  const distanceFromRimCenter = new THREE.Vector2(
    intersectionPoint.x - rimCenter.x,
    intersectionPoint.z - rimCenter.z
  ).length();
  
  // Ball scores if it passes through the circular opening (accounting for ball radius)
  const effectiveRimRadius = (RIM_RADIUS - BALL_RADIUS * 0.8) * 1.5; // Increased by factor of 1.5
  return distanceFromRimCenter <= effectiveRimRadius;
}

export function handleBallRimCollision(ball, velocity, rimColliders, RIM_COLLIDER_RADIUS) {
  for (const c of rimColliders) {
    const dist = ball.position.distanceTo(c);
    if (dist < (RIM_COLLIDER_RADIUS + BALL_RADIUS)) {
      // Move ball out of collider
      const dir = ball.position.clone().sub(c).normalize();
      ball.position.copy(c.clone().add(dir.multiplyScalar(RIM_COLLIDER_RADIUS + BALL_RADIUS + 0.001)));
      // Reflect velocity
      const vDotN = velocity.dot(dir);
      if (vDotN < 0) {
        // Only reflect if moving toward collider
        velocity.add(dir.multiplyScalar(-2 * vDotN));
        // Apply energy loss
        velocity.multiplyScalar(0.7);
      }
      // Only handle one collision per frame for stability
      break;
    }
  }
}

// --- Trajectory Visualization ---
export function showTrajectory(scene, ballPos, targetHoop, powerPercent, vertAngle, horizAngle, trajectoryLine) {
  // Remove old trajectory if exists
  if (trajectoryLine) {
    scene.remove(trajectoryLine);
    trajectoryLine.geometry.dispose();
    trajectoryLine.material.dispose();
    trajectoryLine = null;
  }
  
  // Calculate initial velocity using current angles
  const v0 = getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle, horizAngle);
  const points = [];
  const N = 60; // number of points
  let t = 0;
  let pos = ballPos.clone();
  let v = v0.clone();
  
  for (let i = 0; i < N; ++i) {
    t = i * 0.05;
    // Parabolic motion: x = x0 + vx*t, y = y0 + vy*t + 0.5*gt^2, z = z0 + vz*t
    const x = ballPos.x + v0.x * t;
    const y = ballPos.y + v0.y * t + 0.5 * GRAVITY * t * t;
    const z = ballPos.z + v0.z * t;
    points.push(new THREE.Vector3(x, y, z));
    // Stop if below ground
    if (y < BALL_RADIUS + BALL_GROUND_OFFSET) break;
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({ 
    color: 0xff0000, 
    linewidth: 4,
    dashSize: 0.3,
    gapSize: 0.1
  });
  
  trajectoryLine = new THREE.Line(geometry, material);
  trajectoryLine.computeLineDistances(); // Required for dashed lines
  scene.add(trajectoryLine);
  
  return trajectoryLine;
}

export function hideTrajectory(scene, trajectoryLine) {
  if (trajectoryLine) {
    scene.remove(trajectoryLine);
    trajectoryLine.geometry.dispose();
    trajectoryLine.material.dispose();
    trajectoryLine = null;
  }
  return null;
}

// --- Physics Update Functions ---
export function updateBallPhysics(basketball, physicsState, delta, boundaries) {
  const { ballVelocity } = physicsState;
  
  // Physics update
  ballVelocity.y += GRAVITY * delta;
  basketball.position.x += ballVelocity.x * delta;
  basketball.position.y += ballVelocity.y * delta;
  basketball.position.z += ballVelocity.z * delta;
  
  // Ball rotation
  updateBallRotation(basketball, ballVelocity, delta);
  
  // Ground collision
  const groundY = BALL_RADIUS + BALL_GROUND_OFFSET;
  if (basketball.position.y <= groundY) {
    basketball.position.y = groundY;
    if (Math.abs(ballVelocity.y) > 0.5) { // Only bounce if moving fast enough
      ballVelocity.y = -ballVelocity.y * BOUNCE_RESTITUTION;
      // Apply friction to horizontal velocity
      ballVelocity.x *= 0.85;
      ballVelocity.z *= 0.85;
    } else {
      // Ball comes to rest
      ballVelocity.set(0, 0, 0);
      physicsState.inFlight = false;
      return { landed: true };
    }
  }
  
  // Clamp to court boundaries
  basketball.position.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, basketball.position.x));
  basketball.position.z = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, basketball.position.z));
  
  return { landed: false };
}

// --- Reset Functions ---
export function resetBallPhysics(basketball, physicsState) {
  basketball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  physicsState.ballVelocity.set(0, 0, 0);
  physicsState.inFlight = false;
  physicsState.shotPower = 50;
  physicsState.verticalAngle = 50;
  physicsState.horizontalAngle = 0;
}

// --- Utility Functions ---
export function getNearestHoop(pos, leftHoop, rightHoop) {
  // Returns the position of the hoop on the same half-court as the ball
  // Left half: x < 0 -> leftHoop; Right half: x >= 0 -> rightHoop
  return (pos.x < 0) ? leftHoop : rightHoop;
}

export function getActiveRimColliders(ballPos, rimColliders) {
  return (ballPos.x < 0) ? rimColliders.left : rimColliders.right;
}

export function calculateAutoAimHorizontalAngle(ballPos, targetHoop) {
  // Calculate the direction vector from ball to hoop
  const direction = new THREE.Vector3().subVectors(targetHoop, ballPos);
  
  // Calculate horizontal angle in degrees
  // atan2(z, x) gives angle in radians, convert to degrees
  const horizontalAngleRad = Math.atan2(direction.z, direction.x);
  const horizontalAngleDeg = horizontalAngleRad * 180 / Math.PI;
  
  return horizontalAngleDeg;
}
