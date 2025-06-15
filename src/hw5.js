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
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(10, 20, 15);
// scene.add(directionalLight);
renderer.shadowMap.enabled = true;
// directionalLight.castShadow = true;

// --- DIMENSIONS & CONSTANTS (all units in meters) ---
const COURT_LENGTH = 28.65; // NBA: 94 feet = 28.65 meters
const COURT_WIDTH = 15.4

// Build scene
createBasketballCourt(scene);
createBasketballHoops(scene, COURT_LENGTH);         // Left hoop
createStadiumStands(scene, COURT_LENGTH, COURT_WIDTH); // 15 meters wide court
createCourtLighting(scene, COURT_LENGTH, COURT_WIDTH); // 15 meters wide court
createBasketball(scene);
drawScoreboards(scene, COURT_LENGTH, COURT_WIDTH);
createUI();

const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;
document.addEventListener('keydown', (e) => { if (e.key === "o") isOrbitEnabled = !isOrbitEnabled; });

function animate() {
  requestAnimationFrame(animate);
  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);
}
animate();
