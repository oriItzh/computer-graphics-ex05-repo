import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 
import { createBasketballCourt, isThreePointShot } from './basketballCourt.js';
import {  createBasketballHoops } from './basketballHoops.js';
import { createBasketball } from './basketball.js';
import { createUI } from './ui.js';
import { createStadiumStands } from './seats.js';
import { createCourtLighting } from './courtLights.js';
import { drawScoreboards } from './scoreboard.js';
import { createMovementState, handleMovementKey, updateBasketballPosition, getCourtBoundaries } from './physics-hw06/basketballMovement.js';
import { RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, BACKBOARD_THICKNESS, getHoopRimPositions, getRimColliderPositions } from './basketballHoops.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);

// Debug helper - uncomment to visualize axes
// const axesHelper = new THREE.AxesHelper(15);
// scene.add(axesHelper);

// Scene lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

// Light state tracking
let isMainLightOn = true;
let isCourtLightOn = true;
let courtLightGroup = null;

// Court dimensions (in meters)
const COURT_LENGTH = 28.65; // NBA standard: 94 feet
const COURT_WIDTH = 15.4;

// Scene construction
const basketball = createBasketball(scene);
createBasketballCourt(scene);
createBasketballHoops(scene, COURT_LENGTH);
// createStadiumStands(scene, COURT_LENGTH, COURT_WIDTH);
// courtLightGroup = createCourtLighting(scene, COURT_LENGTH, COURT_WIDTH);
// drawScoreboards(scene, COURT_LENGTH, COURT_WIDTH);
createUI();

// Basketball movement state (Phase 1)
const moveState = createMovementState();
const boundaries = getCourtBoundaries(COURT_LENGTH, COURT_WIDTH);

// Shot power state (Phase 2)
let shotPower = 50; // percent, 0-100
const SHOT_POWER_STEP = 2; // percent per key press
const SHOT_POWER_MIN = 0;
const SHOT_POWER_MAX = 100;

// Shot angle controls
let verticalAngle = 50; // degrees, 0-180 (launch angle)
const ANGLE_STEP = 5; // degrees per key press
const VERTICAL_ANGLE_MIN = 0;
const VERTICAL_ANGLE_MAX = 180;

// --- Shooting & Physics State (Phase 3) ---
let ballVelocity = new THREE.Vector3(0, 0, 0);
let inFlight = false;
const GRAVITY = -9.8; // m/s^2
const BOUNCE_RESTITUTION = 0.65; // energy loss on bounce
const BALL_RADIUS = 0.12; // must match basketball.js
const BALL_GROUND_OFFSET = 0.15; // must match basketball.js

// Hoop positions (NBA standard, see basketballHoops.js)
const leftHoop = new THREE.Vector3(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);
const rightHoop = new THREE.Vector3(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);

function getNearestHoop(pos) {
  // Returns the position of the hoop on the same half-court as the ball
  // Left half: x < 0 -> leftHoop; Right half: x >= 0 -> rightHoop
  return (pos.x < 0) ? leftHoop : rightHoop;
}

function getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle) {
  // Calculate initial velocity vector with automatic aiming at the hoop
  const vertAngleRad = vertAngle * Math.PI / 180;
  
  // Calculate horizontal angle to aim at the target hoop
  const dx = targetHoop.x - ballPos.x;
  const dz = targetHoop.z - ballPos.z;
  const horizAngleRad = Math.atan2(dz, dx); // Automatically aim at hoop
  
  // Power scales the initial speed
  const minSpeed = 6.5; // m/s (tunable)
  const maxSpeed = 13.0; // m/s (tunable)
  const speed = minSpeed + (maxSpeed - minSpeed) * (powerPercent / 100);
  
  // Calculate velocity components based on angles
  // Vertical angle: 0° = horizontal, 90° = straight up
  // Horizontal angle: automatically calculated to aim at hoop
  const vx = speed * Math.cos(vertAngleRad) * Math.cos(horizAngleRad);
  const vy = speed * Math.sin(vertAngleRad);
  const vz = speed * Math.cos(vertAngleRad) * Math.sin(horizAngleRad);
  
  return new THREE.Vector3(vx, vy, vz);
}

// --- Scoring and statistics state ---
let score = 0;
let attempts = 0;
let shotsMade = 0;
let lastShotMade = false;
let shotInProgress = false;
let shotStartPosition = null; // Track where the shot was taken from

function updateScoreUI() {
  const scoreEl = document.getElementById('score');
  const attemptsEl = document.getElementById('attempts');
  const madeEl = document.getElementById('made');
  const accuracyEl = document.getElementById('accuracy');
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (attemptsEl) attemptsEl.textContent = `Attempts: ${attempts}`;
  if (madeEl) madeEl.textContent = `Shots Made: ${shotsMade}`;
  if (accuracyEl) accuracyEl.textContent = `Accuracy: ${attempts > 0 ? Math.round((shotsMade/attempts)*100) : 0}%`;
}

function updateShotZoneDisplay() {
  const shotZoneEl = document.getElementById('shot-zone');
  if (shotZoneEl && !inFlight) {
    const targetHoop = getNearestHoop(basketball.position);
    const isThreePoint = isThreePointShot(basketball.position, targetHoop);
    
    // Debug logging
    console.log('Ball position:', basketball.position);
    console.log('Target hoop:', targetHoop);
    console.log('Distance to hoop:', basketball.position.distanceTo(new THREE.Vector3(targetHoop.x, basketball.position.y, targetHoop.z)));
    console.log('Is three point:', isThreePoint);
    
    if (isThreePoint) {
      shotZoneEl.textContent = "3-Point Zone";
      shotZoneEl.style.backgroundColor = "#FF6B35";
      shotZoneEl.style.color = "#FFFFFF";
    } else {
      shotZoneEl.textContent = "2-Point Zone";
      shotZoneEl.style.backgroundColor = "#4CAF50";
      shotZoneEl.style.color = "#FFFFFF";
    }
  }
}

function setStatusMessage(msg, color = '#FFD700') {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = color;
  }
}

function clearStatusMessage() {
  setStatusMessage('');
}

// --- Rim/hoop collision detection using circular plane intersection ---
function isBallThroughHoop(ballPos, prevBallPos, hoopPos) {
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

// --- Ball rotation state ---
let ballRotationAxis = new THREE.Vector3(1,0,0);
let ballRotationSpeed = 0;

function updateBallRotation(velocity, delta) {
  // Only rotate if moving
  const speed = velocity.length();
  if (speed > 0.01) {
    // Axis is perpendicular to velocity (in XZ plane for rolling, in 3D for flight)
    const axis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
    ballRotationAxis.copy(axis);
    ballRotationSpeed = speed / BALL_RADIUS; // radians/sec
    basketball.rotateOnAxis(ballRotationAxis, ballRotationSpeed * delta);
  }
}

function resetBall() {
  basketball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  ballVelocity.set(0, 0, 0);
  inFlight = false;
  shotPower = 50;
  verticalAngle = 50;
  lastShotMade = false;
  shotInProgress = false;
  shotStartPosition = null; // Reset shot start position
  updateShotPowerDisplay();
  updateAngleDisplays();
  updateScoreUI();
  clearStatusMessage();
  hideTrajectory();
}

function clampShotPower(val) {
  return Math.max(SHOT_POWER_MIN, Math.min(SHOT_POWER_MAX, val));
}

function updateShotPowerDisplay() {
  const el = document.getElementById('shot-power-indicator');
  if (el) el.textContent = `Shot Power: ${shotPower}%`;
}

function clampVerticalAngle(val) {
  return Math.max(VERTICAL_ANGLE_MIN, Math.min(VERTICAL_ANGLE_MAX, val));
}

function updateAngleDisplays() {
  const vertEl = document.getElementById('vertical-angle-indicator');
  if (vertEl) vertEl.textContent = `Vertical Angle: ${verticalAngle}°`;
}

// --- Trajectory visualization ---
let trajectoryLine = null;

function showTrajectory(ballPos, targetHoop, powerPercent, vertAngle) {
  // Remove old trajectory if exists
  if (trajectoryLine) {
    scene.remove(trajectoryLine);
    trajectoryLine.geometry.dispose();
    trajectoryLine.material.dispose();
    trajectoryLine = null;
  }
  // Calculate initial velocity using current angles with auto-aiming
  const v0 = getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle);
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
}

function hideTrajectory() {
  if (trajectoryLine) {
    scene.remove(trajectoryLine);
    trajectoryLine.geometry.dispose();
    trajectoryLine.material.dispose();
    trajectoryLine = null;
  }
}

// --- Rim collider setup ---
const NUM_RIM_COLLIDERS = 32;
const RIM_COLLIDER_RADIUS = 0.018; // slightly less than rim tube radius
const rimColliders = getRimColliderPositions(COURT_LENGTH, NUM_RIM_COLLIDERS);

// --- DEBUG: Visualize rim colliders ---
// function addRimCollidersDebug(scene, colliders, color) {
//   const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 });
//   for (const pos of colliders) {
//     const mesh = new THREE.Mesh(new THREE.SphereGeometry(RIM_COLLIDER_RADIUS, 12, 12), mat);
//     mesh.position.copy(pos);
//     scene.add(mesh);
//   }
// }

// --- DEBUG: Visualize scoring circular planes ---
// function addScoringPlanesDebug(scene, COURT_LENGTH) {
//   const planeGeometry = new THREE.CircleGeometry((RIM_RADIUS - BALL_RADIUS * 0.8) * 1.5, 32);
//   const planeMaterial = new THREE.MeshBasicMaterial({ 
//     color: 0x00ff00, 
//     transparent: true, 
//     opacity: 0.3,
//     side: THREE.DoubleSide
//   });
  
//   // Left hoop scoring plane
//   const leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
//   leftPlane.position.set(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + 0.1 + RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);
//   leftPlane.rotation.x = Math.PI / 2; // Make it horizontal
//   scene.add(leftPlane);
  
//   // Right hoop scoring plane
//   const rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
//   rightPlane.position.set(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS - 0.1, RIM_HEIGHT_ABOVE_GROUND, 0);
//   rightPlane.rotation.x = Math.PI / 2; // Make it horizontal
//   scene.add(rightPlane);
// }

// Uncomment to visualize:
// addRimCollidersDebug(scene, rimColliders.left, 0xff0000);
// addRimCollidersDebug(scene, rimColliders.right, 0x0000ff);
// addScoringPlanesDebug(scene, COURT_LENGTH);

function getActiveRimColliders(ballPos) {
  return (ballPos.x < 0) ? rimColliders.left : rimColliders.right;
}

function handleBallRimCollision(ball, velocity) {
  const colliders = getActiveRimColliders(ball.position);
  for (const c of colliders) {
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

// Camera preset positions for different views
const cameraPresets = {
  default: {
    position: new THREE.Vector3(-(COURT_LENGTH/2 + 4), 15, COURT_WIDTH/2 + 4),
    target: new THREE.Vector3(0, 5, 0)
  },
  top: {
    position: new THREE.Vector3(0, 40, 0),
    target: new THREE.Vector3(0, 0, 0)
  },
  leftHoop: {
    position: new THREE.Vector3(-COURT_LENGTH/2 + 5.79, 3, 0), // Behind free throw line
    target: new THREE.Vector3(-COURT_LENGTH/2, 3, 0) // Looking at the hoop
  },
  rightHoop: {
    position: new THREE.Vector3(COURT_LENGTH/2 - 5.79, 3, 0), // Behind free throw line
    target: new THREE.Vector3(COURT_LENGTH/2, 3, 0) // Looking at the hoop
  }
};

// Initial camera setup
camera.position.copy(cameraPresets.default.position);
camera.lookAt(cameraPresets.default.target);
// Camera controls setup
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

function setCameraPreset(preset) {
  camera.position.copy(preset.position);
  controls.target.copy(preset.target);
  controls.update();
}

function setupEventListeners() {
  // Handle window resize
  window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Main light intensity control
  window.lightControls.mainLightSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    window.lightControls.mainLightValue.textContent = value.toFixed(1);
    if (isMainLightOn) {
      directionalLight.intensity = value;
      ambientLight.intensity = value * 0.5; // Ambient light at half the intensity of directional light
    }
  });

  // Court light intensity control
  window.lightControls.courtLightSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    window.lightControls.courtLightValue.textContent = value.toFixed(1);
    if (isCourtLightOn && courtLightGroup) {
      courtLightGroup.traverse((child) => {
        if (child instanceof THREE.SpotLight) {
          child.intensity = value;
        }
      });
    }
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
      case 'o':
        isOrbitEnabled = !isOrbitEnabled;
        break;
      case '1':
        setCameraPreset(cameraPresets.default);
        break;
      case '2':
        setCameraPreset(cameraPresets.top);
        break;
      case '3':
        setCameraPreset(cameraPresets.leftHoop);
        break;
      case '4':
        setCameraPreset(cameraPresets.rightHoop);
        break;
      case 'l':
        // Toggle main lights
        isMainLightOn = !isMainLightOn;
        ambientLight.visible = isMainLightOn;
        directionalLight.visible = isMainLightOn;
        if (isMainLightOn) {
          const value = parseFloat(window.lightControls.mainLightSlider.value);
          directionalLight.intensity = value;
          ambientLight.intensity = value * 0.5;
        } else {
          directionalLight.intensity = 0;
          ambientLight.intensity = 0;
        }
        // Update slider value display
        window.lightControls.mainLightValue.textContent = isMainLightOn ? 
          window.lightControls.mainLightSlider.value : '0.0';
        break;
      case 'k':
        // Toggle court lights
        isCourtLightOn = !isCourtLightOn;
        if (courtLightGroup) {
          courtLightGroup.traverse((child) => {
            if (child instanceof THREE.SpotLight) {
              child.visible = isCourtLightOn;
              if (isCourtLightOn) {
                const value = parseFloat(window.lightControls.courtLightSlider.value);
                child.intensity = value;
              } else {
                child.intensity = 0;
              }
            }
          });
        }
        // Update slider value display
        window.lightControls.courtLightValue.textContent = isCourtLightOn ? 
          window.lightControls.courtLightSlider.value : '0.0';
        break;
      case 'w':
        shotPower = clampShotPower(shotPower + SHOT_POWER_STEP);
        updateShotPowerDisplay();
        break;
      case 's':
        shotPower = clampShotPower(shotPower - SHOT_POWER_STEP);
        updateShotPowerDisplay();
        break;
      case 'q':
        // Increase vertical angle
        verticalAngle = clampVerticalAngle(verticalAngle + ANGLE_STEP);
        updateAngleDisplays();
        break;
      case 'e':
        // Decrease vertical angle
        verticalAngle = clampVerticalAngle(verticalAngle - ANGLE_STEP);
        updateAngleDisplays();
        break;
      case ' ':
        // Spacebar: shoot if not in flight
        if (!inFlight) {
          shotStartPosition = basketball.position.clone(); // Record where the shot was taken from
          const targetHoop = getNearestHoop(basketball.position);
          ballVelocity = getShotInitialVelocity(basketball.position, targetHoop, shotPower, verticalAngle);
          inFlight = true;
          attempts++;
          lastShotMade = false;
          shotInProgress = false;
          updateScoreUI();
          clearStatusMessage();
          hideTrajectory();
        }
        break;
      case 'r':
        resetBall();
        clearStatusMessage();
        break;
    }
  });

  // Keyboard controls for basketball movement
  function handleBasketballMovementKey(e, isDown) {
    // Only allow movement if not in flight and only for arrow keys
    if (!inFlight && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
      handleMovementKey(e, isDown, moveState);
    }
  }
  document.addEventListener('keydown', (e) => handleBasketballMovementKey(e, true));
  document.addEventListener('keyup', (e) => handleBasketballMovementKey(e, false));
}

setupEventListeners();

// --- Main animation loop changes ---
let lastTime = performance.now();
let prevBallPos = basketball.position.clone();
const hoopRims = getHoopRimPositions(COURT_LENGTH);

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();

  const now = performance.now();
  const delta = (now - lastTime) / 1000; // seconds
  lastTime = now;

  if (inFlight) {
    // Physics update
    ballVelocity.y += GRAVITY * delta;
    basketball.position.x += ballVelocity.x * delta;
    basketball.position.y += ballVelocity.y * delta;
    basketball.position.z += ballVelocity.z * delta;
    // Ball rotation
    updateBallRotation(ballVelocity, delta);
    // Rim/hoop collision detection (scoring)
    let hoopPos = getNearestHoop(basketball.position);
    if (!shotInProgress && isBallThroughHoop(basketball.position, prevBallPos, hoopPos)) {
      // Determine points based on shot distance
      let points = 2; // Default 2 points
      if (shotStartPosition && isThreePointShot(shotStartPosition, hoopPos)) {
        points = 3; // 3 points for shots beyond the 3-point line
      }
      
      score += points;
      shotsMade++;
      lastShotMade = true;
      setStatusMessage(`${points}-POINT SHOT MADE!`, '#00FF00');
      updateScoreUI();
      shotInProgress = true;
    }
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
        inFlight = false;
        // If shotInProgress is false, it means the shot missed
        if (!shotInProgress) {
          lastShotMade = false;
          setStatusMessage('MISSED SHOT', '#FF3333');
        }
        shotInProgress = false;
        setTimeout(clearStatusMessage, 1200);
      }
    }
    // Clamp to court boundaries
    basketball.position.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, basketball.position.x));
    basketball.position.z = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, basketball.position.z));
    prevBallPos.copy(basketball.position);
    handleBallRimCollision(basketball, ballVelocity);
  } else {
    // Basketball movement logic (Phase 1)
    updateBasketballPosition(basketball, moveState, delta, boundaries);
    // Ball rotation for rolling
    let moveVec = new THREE.Vector3(0,0,0);
    if (moveState.left) moveVec.x -= 1;
    if (moveState.right) moveVec.x += 1;
    if (moveState.up) moveVec.z -= 1;
    if (moveState.down) moveVec.z += 1;
    if (moveVec.lengthSq() > 0) {
      moveVec.normalize().multiplyScalar(6); // match BALL_MOVE_SPEED
      updateBallRotation(moveVec, delta);
    }
  }

  // Update shot power UI (in case of animation-based indicator in future)
  updateShotPowerDisplay();
  updateAngleDisplays();
  updateScoreUI();
  updateShotZoneDisplay(); // Update live zone indicator
  if (!inFlight) {
    const targetHoop = getNearestHoop(basketball.position);
    showTrajectory(basketball.position, targetHoop, shotPower, verticalAngle);
  } else {
    hideTrajectory();
  }

  renderer.render(scene, camera);
}
animate();

