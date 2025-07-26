import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 
import { createBasketballCourt } from './basketballCourt.js';
import {  createBasketballHoops } from './basketballHoops.js';
import { createBasketball } from './basketball.js';
import { createUI } from './ui.js';
import { createStadiumStands } from './seats.js';
import { createCourtLighting } from './courtLights.js';
import { drawScoreboards } from './scoreboard.js';
import { createMovementState, handleMovementKey, updateBasketballPosition, getCourtBoundaries } from './physics-hw06/basketballMovement.js';
import { RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, BACKBOARD_THICKNESS, getHoopRimPositions, getRimColliderPositions } from './basketballHoops.js';
import { 
  createPhysicsState, 
  getShotInitialVelocity, 
  updateBallPhysics, 
  updateBallRotation,
  isBallThroughHoop,
  handleBallRimCollision,
  showTrajectory,
  hideTrajectory,
  resetBallPhysics,
  getNearestHoop,
  getActiveRimColliders,
  clampShotPower,
  clampVerticalAngle,
  clampHorizontalAngle,
  updateShotPowerDisplay,
  updateAngleDisplays,
  calculateAutoAimHorizontalAngle,
  SHOT_POWER_STEP,
  ANGLE_STEP,
  GRAVITY,
  BOUNCE_RESTITUTION,
  BALL_RADIUS,
  BALL_GROUND_OFFSET
} from './physics-hw06/basketballPhysics.js';
import { 
  createScoringState,
  updateScoreUI,
  setStatusMessage,
  clearStatusMessage,
  recordShotMade,
  recordShotAttempt,
  recordShotMissed,
  resetScoring,
  updateShotTypeDisplay
} from './physics-hw06/basketballScoring.js';
import { isThreePointShot, getShotTypeDisplay, getShotPoints } from './physics-hw06/threePointDetection.js';

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

// Physics and shooting state (refactored to physics modules)
const physicsState = createPhysicsState();
const scoringState = createScoringState();

// Hoop positions (NBA standard, see basketballHoops.js)
const leftHoop = new THREE.Vector3(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);
const rightHoop = new THREE.Vector3(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);

function resetBall() {
  resetBallPhysics(basketball, physicsState);
  resetScoring(scoringState);
  updateShotPowerDisplay(physicsState.shotPower);
  // Auto-aim will calculate the horizontal angle automatically
  const targetHoop = getNearestHoop(basketball.position, leftHoop, rightHoop);
  physicsState.horizontalAngle = calculateAutoAimHorizontalAngle(basketball.position, targetHoop);
  updateAngleDisplays(physicsState.verticalAngle, physicsState.horizontalAngle);
  updateScoreUI(scoringState);
  updateShotTypeDisplay(getShotTypeDisplay(basketball.position));
  clearStatusMessage();
  physicsState.trajectoryLine = hideTrajectory(scene, physicsState.trajectoryLine);
}

// --- Rim collider setup ---
const NUM_RIM_COLLIDERS = 32;
const RIM_COLLIDER_RADIUS = 0.018; // slightly less than rim tube radius
const rimColliders = getRimColliderPositions(COURT_LENGTH, NUM_RIM_COLLIDERS);

// --- DEBUG: Visualize rim colliders ---
function addRimCollidersDebug(scene, colliders, color) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 });
  for (const pos of colliders) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(RIM_COLLIDER_RADIUS, 12, 12), mat);
    mesh.position.copy(pos);
    scene.add(mesh);
  }
}

// --- DEBUG: Visualize scoring circular planes ---
function addScoringPlanesDebug(scene, COURT_LENGTH) {
  const planeGeometry = new THREE.CircleGeometry((RIM_RADIUS - BALL_RADIUS * 0.8) * 1.5, 32);
  const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  
  // Left hoop scoring plane
  const leftPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  leftPlane.position.set(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + RIM_RADIUS + 0.1, RIM_HEIGHT_ABOVE_GROUND, 0);
  leftPlane.rotation.x = Math.PI / 2; // Make it horizontal
  scene.add(leftPlane);
  
  // Right hoop scoring plane
  const rightPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  rightPlane.position.set(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS - 0.1, RIM_HEIGHT_ABOVE_GROUND, 0);
  rightPlane.rotation.x = Math.PI / 2; // Make it horizontal
  scene.add(rightPlane);
}

// Uncomment to visualize:
addRimCollidersDebug(scene, rimColliders.left, 0xff0000);
addRimCollidersDebug(scene, rimColliders.right, 0x0000ff);
addScoringPlanesDebug(scene, COURT_LENGTH);

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
        physicsState.shotPower = clampShotPower(physicsState.shotPower + SHOT_POWER_STEP);
        updateShotPowerDisplay(physicsState.shotPower);
        break;
      case 's':
        physicsState.shotPower = clampShotPower(physicsState.shotPower - SHOT_POWER_STEP);
        updateShotPowerDisplay(physicsState.shotPower);
        break;
      case 'q':
        // Increase vertical angle
        physicsState.verticalAngle = clampVerticalAngle(physicsState.verticalAngle + ANGLE_STEP);
        updateAngleDisplays(physicsState.verticalAngle, physicsState.horizontalAngle);
        break;
      case 'e':
        // Decrease vertical angle
        physicsState.verticalAngle = clampVerticalAngle(physicsState.verticalAngle - ANGLE_STEP);
        updateAngleDisplays(physicsState.verticalAngle, physicsState.horizontalAngle);
        break;
      case ' ':
        // Spacebar: shoot if not in flight
        if (!physicsState.inFlight) {
          const targetHoop = getNearestHoop(basketball.position, leftHoop, rightHoop);
          physicsState.ballVelocity = getShotInitialVelocity(basketball.position, targetHoop, physicsState.shotPower, physicsState.verticalAngle, physicsState.horizontalAngle);
          physicsState.inFlight = true;
          // Store the shot position for scoring purposes
          physicsState.shotPosition = basketball.position.clone();
          recordShotAttempt(scoringState);
          physicsState.trajectoryLine = hideTrajectory(scene, physicsState.trajectoryLine);
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
    if (!physicsState.inFlight && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
      handleMovementKey(e, isDown, moveState);
    }
  }
  document.addEventListener('keydown', (e) => handleBasketballMovementKey(e, true));
  document.addEventListener('keyup', (e) => handleBasketballMovementKey(e, false));
}

setupEventListeners();

// --- Main animation loop changes ---
let lastTime = performance.now();
const hoopRims = getHoopRimPositions(COURT_LENGTH);

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();

  const now = performance.now();
  const delta = (now - lastTime) / 1000; // seconds
  lastTime = now;

  if (physicsState.inFlight) {
    // Store previous position for scoring detection
    physicsState.prevBallPos.copy(basketball.position);
    
    // Physics update
    const result = updateBallPhysics(basketball, physicsState, delta, boundaries);
    
    // Rim/hoop collision detection (scoring)
    let hoopPos = getNearestHoop(basketball.position, leftHoop, rightHoop);
    if (!scoringState.shotInProgress && isBallThroughHoop(basketball.position, physicsState.prevBallPos, hoopPos, RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND)) {
      const shotPoints = getShotPoints(physicsState.shotPosition); // Use shot position for scoring
      recordShotMade(scoringState, shotPoints);
    }
    
    // Handle rim collisions
    const activeRimColliders = getActiveRimColliders(basketball.position, rimColliders);
    handleBallRimCollision(basketball, physicsState.ballVelocity, activeRimColliders, RIM_COLLIDER_RADIUS);
    
    // Check if ball landed
    if (result.landed) {
      // If shotInProgress is false, it means the shot missed
      if (!scoringState.shotInProgress) {
        recordShotMissed(scoringState);
      }
      scoringState.shotInProgress = false;
      setTimeout(clearStatusMessage, 1200);
    }
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
      updateBallRotation(basketball, moveVec, delta);
    }
  }

  // Update UI displays
  updateShotPowerDisplay(physicsState.shotPower);
  
  // Auto-aim: calculate horizontal angle to nearest hoop
  const targetHoop = getNearestHoop(basketball.position, leftHoop, rightHoop);
  physicsState.horizontalAngle = calculateAutoAimHorizontalAngle(basketball.position, targetHoop);
  
  updateAngleDisplays(physicsState.verticalAngle, physicsState.horizontalAngle);
  updateScoreUI(scoringState);
  
  // Update shot type indicator based on current ball position
  const currentShotType = getShotTypeDisplay(basketball.position);
  updateShotTypeDisplay(currentShotType);
  
  // Show trajectory when not in flight
  if (!physicsState.inFlight) {
    physicsState.trajectoryLine = showTrajectory(scene, basketball.position, targetHoop, physicsState.shotPower, physicsState.verticalAngle, physicsState.horizontalAngle, physicsState.trajectoryLine);
  } else {
    physicsState.trajectoryLine = hideTrajectory(scene, physicsState.trajectoryLine);
  }

  renderer.render(scene, camera);
}
animate();

