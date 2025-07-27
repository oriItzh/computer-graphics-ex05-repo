import { OrbitControls } from './OrbitControls.js';
import { createBasketballCourt } from './basketballCourt.js';
import { createBasketballHoops } from './basketballHoops.js';
import { createBasketball } from './basketball.js';
import { createUI } from './ui.js';
import { createStadiumStands } from './seats.js';
import { createCourtLighting } from './courtLights.js';
import { drawScoreboards } from './scoreboard.js';
import { createMovementState, handleMovementKey, updateBasketballPosition, getCourtBoundaries } from './physics-hw06/basketballMovement.js';

// Import all game systems
import { BallPhysicsSystem } from './systems/ballPhysics.js';
import { ShootingSystem } from './systems/shootingSystem.js';
import { ScoringSystem } from './systems/scoringSystem.js';
import { CollisionSystem } from './systems/collisionSystem.js';
import { SoundSystem } from './systems/soundSystem.js';
import { CameraSystem } from './systems/cameraSystem.js';
import { GameManager } from './systems/gameManager.js';

/**
 * Three.js Basketball Game Main Application
 * Initializes scene, lighting, game systems and handles the main game loop
 */

// Scene setup with performance optimizations
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better performance than PCFShadowMap
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);

// Scene lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 20, 15);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Performance optimizations
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance

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

// Initialize game systems
const physicsSystem = new BallPhysicsSystem();
const shootingSystem = new ShootingSystem(scene);
const scoringSystem = new ScoringSystem();
const collisionSystem = new CollisionSystem(COURT_LENGTH);
const soundSystem = new SoundSystem();
const cameraSystem = new CameraSystem(camera, renderer, COURT_LENGTH, COURT_WIDTH);
const gameManager = new GameManager(scene, basketball, COURT_LENGTH, COURT_WIDTH);

// Set up camera controls
const controls = new OrbitControls(camera, renderer.domElement);
cameraSystem.setControls(controls);

// Initialize game manager with all systems
gameManager.initializeSystems(physicsSystem, shootingSystem, scoringSystem, collisionSystem, soundSystem, cameraSystem);

// Basketball movement state
const moveState = createMovementState();
const boundaries = getCourtBoundaries(COURT_LENGTH, COURT_WIDTH);

/**
 * Sets up all event listeners for game controls
 * Handles keyboard input, light controls, camera presets, and basketball movement
 */
function setupEventListeners() {
  // Main light intensity control
  window.lightControls.mainLightSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    window.lightControls.mainLightValue.textContent = value.toFixed(1);
    if (isMainLightOn) {
      directionalLight.intensity = value;
      ambientLight.intensity = value * 0.5;
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
        cameraSystem.toggleOrbitControls();
        break;
      case '1':
        cameraSystem.setCameraPreset('default');
        break;
      case '2':
        cameraSystem.setCameraPreset('top');
        break;
      case '3':
        cameraSystem.setCameraPreset('leftHoop');
        break;
      case '4':
        cameraSystem.setCameraPreset('rightHoop');
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
        window.lightControls.courtLightValue.textContent = isCourtLightOn ? 
          window.lightControls.courtLightSlider.value : '0.0';
        break;
      case 'w':
        shootingSystem.adjustShotPower(true);
        break;
      case 's':
        shootingSystem.adjustShotPower(false);
        break;
      case 'q':
        shootingSystem.adjustVerticalAngle(true);
        break;
      case 'e':
        shootingSystem.adjustVerticalAngle(false);
        break;
      case ' ':
        gameManager.shoot();
        break;
      case 'r':
        gameManager.resetBall();
        break;
    }
  });

  // Basketball movement controls
  function handleBasketballMovementKey(e, isDown) {
    if (!physicsSystem.isInFlight() && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
      handleMovementKey(e, isDown, moveState);
    }
  }
  document.addEventListener('keydown', (e) => handleBasketballMovementKey(e, true));
  document.addEventListener('keyup', (e) => handleBasketballMovementKey(e, false));
}

/**
 * Main animation loop with fixed timestep physics
 * Uses fixed timestep for consistent physics regardless of framerate
 * Includes performance monitoring and adaptive rendering quality
 */
// Animation constants
let lastTime = performance.now();
const FIXED_TIMESTEP = 1/60; // 60 FPS for physics
const MAX_DELTA = 1/30; // Cap delta to prevent large jumps
let accumulator = 0;

// Performance monitoring
let frameCount = 0;
let lastFPSTime = performance.now();
let currentFPS = 60;

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  let frameTime = (now - lastTime) / 1000; // seconds
  lastTime = now;
  
  // Calculate FPS for monitoring
  frameCount++;
  if (now - lastFPSTime >= 1000) {
    currentFPS = Math.round((frameCount * 1000) / (now - lastFPSTime));
    frameCount = 0;
    lastFPSTime = now;
    
    // Warn about performance issues that affect physics
    if (currentFPS < 45) {
      console.warn(`Low FPS detected: ${currentFPS}fps - Physics may be affected`);
    }
  }
  
  // Cap frame time to prevent physics instability
  frameTime = Math.min(frameTime, MAX_DELTA);
  accumulator += frameTime;

  // Fixed timestep physics updates
  while (accumulator >= FIXED_TIMESTEP) {
    // Handle ball physics and movement when not in flight
    if (!physicsSystem.isInFlight()) {
      updateBasketballPosition(basketball, moveState, FIXED_TIMESTEP, boundaries);
      // Ball rotation for rolling
      let moveVec = new THREE.Vector3(0,0,0);
      if (moveState.left) moveVec.x -= 1;
      if (moveState.right) moveVec.x += 1;
      if (moveState.up) moveVec.z -= 1;
      if (moveState.down) moveVec.z += 1;
      if (moveVec.lengthSq() > 0) {
        moveVec.normalize().multiplyScalar(6); // match BALL_MOVE_SPEED
        physicsSystem.updateBallRotation(moveVec, FIXED_TIMESTEP, basketball);
      }
    }

    // Update all game systems with fixed timestep
    gameManager.update(moveState, boundaries, FIXED_TIMESTEP);
    
    accumulator -= FIXED_TIMESTEP;
  }

  // Limit expensive operations when FPS is low
  if (currentFPS > 45) {
    renderer.render(scene, camera);
  } else {
    // Reduce rendering quality when performance is poor
    const oldPixelRatio = renderer.getPixelRatio();
    renderer.setPixelRatio(Math.min(oldPixelRatio, 1));
    renderer.render(scene, camera);
    renderer.setPixelRatio(oldPixelRatio);
  }
}

// Initialize the application
setupEventListeners();
animate();
