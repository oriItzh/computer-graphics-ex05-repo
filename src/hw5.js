import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 
import { createBasketballCourt } from './basketballCourt.js';
import {  createBasketballHoops } from './basketballHoops.js';
import { createBasketball } from './basketball.js';
import { createUI } from './ui.js';
import { createStadiumStands } from './seats.js';
import { createCourtLighting } from './courtLights.js';
import { drawScoreboards } from './scoreboard.js';
import { createMovementState, handleMovementKey, updateBasketballPosition, getCourtBoundaries } from './physics-hw06/basketballMovement.js';
import { RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, getHoopRimPositions } from './basketballHoops.js';

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

// --- Shooting & Physics State (Phase 3) ---
let ballVelocity = new THREE.Vector3(0, 0, 0);
let inFlight = false;
const GRAVITY = -9.8; // m/s^2
const BOUNCE_RESTITUTION = 0.65; // energy loss on bounce
const BALL_RADIUS = 0.12; // must match basketball.js
const BALL_GROUND_OFFSET = 0.15; // must match basketball.js

// Hoop positions (NBA standard, see basketballHoops.js)
const leftHoop = new THREE.Vector3(-COURT_LENGTH/2, 3.05, 0);
const rightHoop = new THREE.Vector3(COURT_LENGTH/2, 3.05, 0);

function getNearestHoop(pos) {
  // Returns the position of the hoop on the same half-court as the ball
  // Left half: x < 0 -> leftHoop; Right half: x >= 0 -> rightHoop
  return (pos.x < 0) ? leftHoop : rightHoop;
}

function getShotInitialVelocity(ballPos, targetHoop, powerPercent) {
  // Calculate initial velocity vector to reach the hoop with a nice arc
  // We'll use a fixed arc angle (e.g., 50 deg) and scale speed by power
  const ARC_ANGLE_DEG = 50;
  const ARC_ANGLE_RAD = ARC_ANGLE_DEG * Math.PI / 180;
  const g = -GRAVITY;
  const dx = targetHoop.x - ballPos.x;
  const dz = targetHoop.z - ballPos.z;
  const dy = targetHoop.y - ballPos.y;
  const distXZ = Math.sqrt(dx*dx + dz*dz);
  // Power scales the initial speed (min 40%, max 100%)
  const minSpeed = 6.5; // m/s (tunable)
  const maxSpeed = 13.0; // m/s (tunable)
  const speed = minSpeed + (maxSpeed - minSpeed) * (powerPercent / 100);
  // Decompose speed into components
  const vxz = speed * Math.cos(ARC_ANGLE_RAD);
  const vy = speed * Math.sin(ARC_ANGLE_RAD);
  // Direction in XZ
  const dirXZ = new THREE.Vector3(dx, 0, dz).normalize();
  const vx = dirXZ.x * vxz;
  const vz = dirXZ.z * vxz;
  return new THREE.Vector3(vx, vy, vz);
}

// --- Scoring sphere for rim detection ---
const SCORING_SPHERE_RADIUS = RIM_RADIUS - BALL_RADIUS * 0.2; // slightly smaller than rim
const leftScoringSphere = {
  center: new THREE.Vector3(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0),
  radius: SCORING_SPHERE_RADIUS
};
const rightScoringSphere = {
  center: new THREE.Vector3(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0),
  radius: SCORING_SPHERE_RADIUS
};

function getScoringSphere(ballPos) {
  // Returns the scoring sphere for the current half-court
  return (ballPos.x < 0) ? leftScoringSphere : rightScoringSphere;
}

function isBallThroughHoop(ballPos, prevBallPos, scoringSphere) {
  // Ball must pass from above to below the scoring sphere, intersecting it, and be moving downward
  const wasAbove = prevBallPos.y > scoringSphere.center.y;
  const isBelow = ballPos.y <= scoringSphere.center.y;
  const distNow = ballPos.distanceTo(scoringSphere.center);
  const distPrev = prevBallPos.distanceTo(scoringSphere.center);
  const intersectsNow = distNow < (scoringSphere.radius + BALL_RADIUS);
  const intersectsPrev = distPrev > (scoringSphere.radius + BALL_RADIUS);
  const movingDown = (ballPos.y - prevBallPos.y) < 0;
  return wasAbove && isBelow && intersectsNow && intersectsPrev && movingDown;
}

// --- Scoring and statistics state ---
let score = 0;
let attempts = 0;
let shotsMade = 0;
let lastShotMade = false;
let shotInProgress = false;

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
  lastShotMade = false;
  shotInProgress = false;
  updateShotPowerDisplay();
  updateScoreUI();
  clearStatusMessage();
}

function clampShotPower(val) {
  return Math.max(SHOT_POWER_MIN, Math.min(SHOT_POWER_MAX, val));
}

function updateShotPowerDisplay() {
  const el = document.getElementById('shot-power-indicator');
  if (el) el.textContent = `Shot Power: ${shotPower}%`;
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
      case ' ':
        // Spacebar: shoot if not in flight
        if (!inFlight) {
          const targetHoop = getNearestHoop(basketball.position);
          ballVelocity = getShotInitialVelocity(basketball.position, targetHoop, shotPower);
          inFlight = true;
          attempts++;
          lastShotMade = false;
          shotInProgress = false;
          updateScoreUI();
          clearStatusMessage();
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
    let scoringSphere = getScoringSphere(basketball.position);
    if (!shotInProgress && isBallThroughHoop(basketball.position, prevBallPos, scoringSphere)) {
      score += 2;
      shotsMade++;
      lastShotMade = true;
      setStatusMessage('SHOT MADE!', '#00FF00');
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
  updateScoreUI();

  renderer.render(scene, camera);
}
animate();

