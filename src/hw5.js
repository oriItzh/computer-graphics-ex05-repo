import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 
import { createBasketballCourt } from './basketballCourt.js';
import {  createBasketballHoops } from './basketballHoops.js';
import { createBasketball } from './basketball.js';
import { createUI } from './ui.js';
import { createStadiumStands } from './seats.js';
import { createCourtLighting } from './courtLights.js';
import { drawScoreboards } from './scoreboard.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);

// Add Axes Helper for debugging
// const axesHelper = new THREE.AxesHelper(15); // Size of the axes, you can adjust this
// scene.add(axesHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

// Track light states
let isMainLightOn = true;
let isCourtLightOn = true;
let courtLightGroup = null;

// --- DIMENSIONS & CONSTANTS (all units in meters) ---
const COURT_LENGTH = 28.65; // NBA: 94 feet = 28.65 meters
const COURT_WIDTH = 15.4

// Build scene
createBasketballCourt(scene);
createBasketballHoops(scene, COURT_LENGTH);         // Left hoop
createStadiumStands(scene, COURT_LENGTH, COURT_WIDTH); // 15 meters wide court
courtLightGroup = createCourtLighting(scene, COURT_LENGTH, COURT_WIDTH); // Store reference to court lights
createBasketball(scene);
drawScoreboards(scene, COURT_LENGTH, COURT_WIDTH);
createUI();

const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Camera preset positions
const cameraPresets = {
  default: {
    position: new THREE.Vector3(0, 15, 30),
    target: new THREE.Vector3(0, 0, 0)
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

const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Function to set camera position and target
function setCameraPreset(preset) {
  camera.position.copy(preset.position);
  controls.target.copy(preset.target);
  controls.update();
}

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
      break;
    case 'k':
      // Toggle court lights
      isCourtLightOn = !isCourtLightOn;
      if (courtLightGroup) {
        courtLightGroup.traverse((child) => {
          if (child instanceof THREE.SpotLight) {
            child.visible = isCourtLightOn;
            child.intensity = isCourtLightOn ? 0.6 : 0; // Also toggle intensity
          }
        });
      }
      break;
  }
});

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);
}
animate();
