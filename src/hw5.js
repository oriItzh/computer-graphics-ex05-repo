import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Create basketball court
function createBasketballCourt() {
  // Court floor - proper dimensions (28.65m x 15.24m)
  const courtGeometry = new THREE.BoxGeometry(28.65, 0.2, 15.24);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xc68642,  // Brown wood color
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);

  // Court lines material
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Center line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.11, -15.24 / 2), // Start at one sideline
    new THREE.Vector3(0, 0.11, 15.24 / 2)  // End at the other sideline
  ]);
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
  scene.add(centerLine);

  // Center circle
  const centerCircleRadius = 1.8;
  const centerCircleSegments = 32;
  const centerCircleGeometry = new THREE.BufferGeometry();
  const centerCirclePoints = [];
  for (let i = 0; i <= centerCircleSegments; i++) {
    const theta = (i / centerCircleSegments) * Math.PI * 2;
    centerCirclePoints.push(new THREE.Vector3(
      Math.cos(theta) * centerCircleRadius,
      0.11,
      Math.sin(theta) * centerCircleRadius
    ));
  }
  centerCircleGeometry.setFromPoints(centerCirclePoints);
  const centerCircle = new THREE.Line(centerCircleGeometry, lineMaterial);
  scene.add(centerCircle);

  // Three-point lines
  const threePointRadius = 6.75; // As per instructions
  const threePointSegments = 64; // More segments for smoother arc
  const courtHalfLength = 28.65 / 2;
  const rimLocalXOffset = 0.025 + 0.8; // Distance from hoopGroup origin to rim center in local X

  // Left three-point line
  const leftHoopX = -courtHalfLength; // X-coordinate of the left backboard (hoopGroup origin)
  const leftArcCenterX = leftHoopX + rimLocalXOffset; // Arc center is at the rim's X-position in world coordinates

  const leftThreePointGeometry = new THREE.BufferGeometry();
  const leftThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = (i / threePointSegments) * Math.PI - Math.PI / 2; // Theta from -PI/2 to PI/2
    leftThreePointPoints.push(new THREE.Vector3(
      leftArcCenterX - Math.cos(theta) * threePointRadius, // Changed sign to make it curve inwards (concave)
      0.11,
      Math.sin(theta) * threePointRadius
    ));
  }
  leftThreePointGeometry.setFromPoints(leftThreePointPoints);
  const leftThreePoint = new THREE.Line(leftThreePointGeometry, lineMaterial);
  scene.add(leftThreePoint);

  // Right three-point line
  const rightHoopX = courtHalfLength; // X-coordinate of the right backboard (hoopGroup origin)
  const rightArcCenterX = rightHoopX - rimLocalXOffset; // Arc center is at the rim's X-position in world coordinates (due to PI rotation)

  const rightThreePointGeometry = new THREE.BufferGeometry();
  const rightThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = (i / threePointSegments) * Math.PI - Math.PI / 2; // Theta from -PI/2 to PI/2
    rightThreePointPoints.push(new THREE.Vector3(
      rightArcCenterX + Math.cos(theta) * threePointRadius, // Changed sign to make it curve inwards (concave)
      0.11,
      Math.sin(theta) * threePointRadius
    ));
  }
  rightThreePointGeometry.setFromPoints(rightThreePointPoints);
  const rightThreePoint = new THREE.Line(rightThreePointGeometry, lineMaterial);
  scene.add(rightThreePoint);
}

// Create basketball hoop
function createBasketballHoop(hoopX, rotationY) {
  const hoopGroup = new THREE.Group();
  hoopGroup.position.x = hoopX;
  hoopGroup.rotation.y = rotationY; // Rotate the entire group for direction

  // Backboard (thin along X, wide along Z)
  const backboardGeometry = new THREE.BoxGeometry(0.05, 1.05, 1.8); 
  const backboardMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
  backboard.position.set(0.025, 3.05, 0); // Position relative to group origin (slightly in front of hoopX to be inside court)
  backboard.castShadow = true;
  hoopGroup.add(backboard);

  // Rim
  const rimRadius = 0.225;
  const rimSegments = 32;
  const rimGeometry = new THREE.TorusGeometry(rimRadius, 0.02, 16, rimSegments);
  const rimMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c00 }); // Orange color
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.set(0.025 + 0.8, 3.05, 0); // Rim in front of backboard (along local X)
  rim.rotation.x = Math.PI / 2; // Rotate to be horizontal
  rim.castShadow = true;
  hoopGroup.add(rim);

  // Net
  const netSegments = 8;
  const netHeight = 0.4;
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  
  for (let i = 0; i < netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    const netGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        0.025 + 0.8 + Math.cos(angle) * rimRadius,
        3.05,
        0 + Math.sin(angle) * rimRadius
      ),
      new THREE.Vector3(
        0.025 + 0.8 + Math.cos(angle) * (rimRadius * 0.8),
        3.05 - netHeight,
        0 + Math.sin(angle) * (rimRadius * 0.8)
      )
    ]);
    const netLine = new THREE.Line(netGeometry, netMaterial);
    hoopGroup.add(netLine);
  }

  // Support structure (pole)
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 }); // Gray color
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.set(0.025 - 1.2, 2, 0); // Pole behind backboard (along local X)
  pole.castShadow = true;
  hoopGroup.add(pole);

  // Support arm (connecting pole to backboard)
  const armGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.1); // Length, height, depth
  const armMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
  const arm = new THREE.Mesh(armGeometry, armMaterial);
  arm.position.set(0.025 - 0.6, 3.05, 0); // Midpoint between backboard and pole in local X
  arm.castShadow = true;
  hoopGroup.add(arm);

  scene.add(hoopGroup);
}

// Create static basketball
function createBasketball() {
  const ballRadius = 0.12;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
  
  // Create a custom material with black seams
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0xff8c00, // Orange color
    shininess: 30
  });
  
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, ballRadius + 0.1, 0); // Slightly above court surface
  ball.castShadow = true;
  scene.add(ball);

  // Add black seams
  const seamMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  
  // Create seams using curved lines
  const seamCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(-ballRadius, 0, 0),
    new THREE.Vector3(-ballRadius, ballRadius * 0.5, ballRadius * 0.5),
    new THREE.Vector3(0, ballRadius, 0),
    new THREE.Vector3(ballRadius, ballRadius * 0.5, ballRadius * 0.5)
  );

  const seamPoints = seamCurve.getPoints(20);
  const seamGeometry = new THREE.BufferGeometry().setFromPoints(seamPoints);
  const seam = new THREE.Line(seamGeometry, seamMaterial);
  ball.add(seam);

  // Add rotated copies of the seam
  const seam2 = seam.clone();
  seam2.rotation.y = Math.PI / 2;
  ball.add(seam2);

  const seam3 = seam.clone();
  seam3.rotation.z = Math.PI / 2;
  ball.add(seam3);

  const seam4 = seam3.clone();
  seam4.rotation.y = Math.PI / 2;
  ball.add(seam4);
}

// Create UI elements
function createUI() {
  // Score display container
  const scoreContainer = document.createElement('div');
  scoreContainer.style.position = 'absolute';
  scoreContainer.style.top = '20px';
  scoreContainer.style.left = '50%';
  scoreContainer.style.transform = 'translateX(-50%)';
  scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  scoreContainer.style.color = 'white';
  scoreContainer.style.padding = '10px 20px';
  scoreContainer.style.borderRadius = '5px';
  scoreContainer.style.fontFamily = 'Arial, sans-serif';
  scoreContainer.style.fontSize = '24px';
  scoreContainer.style.fontWeight = 'bold';
  scoreContainer.innerHTML = `
    <div id="score">Score: 0</div>
  `;
  document.body.appendChild(scoreContainer);

  // Controls display container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.position = 'absolute';
  controlsContainer.style.bottom = '20px';
  controlsContainer.style.left = '20px';
  controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  controlsContainer.style.color = 'white';
  controlsContainer.style.padding = '15px';
  controlsContainer.style.borderRadius = '5px';
  controlsContainer.style.fontFamily = 'Arial, sans-serif';
  controlsContainer.style.fontSize = '16px';
  controlsContainer.innerHTML = `
    <h3 style="margin: 0 0 10px 0">Controls:</h3>
    <p style="margin: 5px 0">O - Toggle orbit camera</p>
    <p style="margin: 5px 0">Arrow Keys - Move basketball (coming in HW06)</p>
    <p style="margin: 5px 0">W/S - Adjust power (coming in HW06)</p>
    <p style="margin: 5px 0">Spacebar - Shoot (coming in HW06)</p>
    <p style="margin: 5px 0">R - Reset ball position (coming in HW06)</p>
  `;
  document.body.appendChild(controlsContainer);
}

// Create all elements
createBasketballCourt();
const courtHalfLength = 28.65 / 2; // Recalculate for clarity
createBasketballHoop(-courtHalfLength, 0); // Left hoop: positioned at left baseline, faces positive X (towards center)
createBasketballHoop(courtHalfLength, Math.PI);  // Right hoop: positioned at right baseline, faces negative X (towards center)
createBasketball();
createUI();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();