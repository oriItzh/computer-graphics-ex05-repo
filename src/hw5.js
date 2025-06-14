import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0x000000);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

// --- DIMENSIONS & CONSTANTS (all units in meters) ---
const COURT_LENGTH = 28.65;
const COURT_WIDTH = 15.24;
const COURT_HEIGHT = 0.2;

const RIM_RADIUS = 0.225;
const RIM_TUBE_RADIUS = 0.02;
const RIM_HEIGHT_ABOVE_GROUND = 3.05;
const RIM_SEGMENTS = 32;

const BACKBOARD_WIDTH = 1.8;
const BACKBOARD_HEIGHT = 1.05;
const BACKBOARD_THICKNESS = 0.05;
const BACKBOARD_BOTTOM_Y = RIM_HEIGHT_ABOVE_GROUND - BACKBOARD_HEIGHT / 8;


const RIM_TO_BACKBOARD_X = BACKBOARD_THICKNESS + RIM_RADIUS; // front edge of backboard to center of rim

const NET_SEGMENTS = 8;
const NET_HEIGHT = 0.4;
const NET_BOTTOM_RADIUS = RIM_RADIUS * 0.7;

const POLE_RADIUS = 0.1;
const POLE_HEIGHT = 4;
const POLE_TO_BACKBOARD_X = 1.2; // Distance from backboard to pole (arm length)
const ARM_LENGTH = POLE_TO_BACKBOARD_X;
const ARM_HEIGHT = 0.1;
const ARM_DEPTH = 0.1;

const SHOOTER_SQUARE_WIDTH = BACKBOARD_WIDTH / 2.5;
const SHOOTER_SQUARE_HEIGHT = BACKBOARD_HEIGHT / 2.5;
const SHOOTER_SQUARE_ABOVE_RIM = 0.05; // vertical distance above rim
const SHOOTER_SQUARE_FRONT = 0.01; // just in front of backboard

// --- BASKETBALL DIMENSIONS ---
const BALL_RADIUS = 0.12;
const BALL_GROUND_OFFSET = 0.1;

// ========== COURT ROOT ==========
function createBasketballCourt() {
  // Floor
  const courtGeometry = new THREE.BoxGeometry(COURT_LENGTH, COURT_HEIGHT, COURT_WIDTH);
  const courtMaterial = new THREE.MeshPhongMaterial({ color: 0xc68642, shininess: 50 });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);

  // --- Court Lines ---
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Center line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, COURT_WIDTH/2)
  ]);
  scene.add(new THREE.Line(centerLineGeometry, lineMaterial));

  // Center circle
  const centerCircleRadius = 1.8;
  const centerCircleSegments = 32;
  const centerCirclePoints = [];
  for (let i = 0; i <= centerCircleSegments; i++) {
    const theta = (i / centerCircleSegments) * Math.PI * 2;
    centerCirclePoints.push(new THREE.Vector3(
      Math.cos(theta) * centerCircleRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * centerCircleRadius
    ));
  }
  const centerCircleGeometry = new THREE.BufferGeometry().setFromPoints(centerCirclePoints);
  scene.add(new THREE.Line(centerCircleGeometry, lineMaterial));

  // Three-point lines (arcs)
  const threePointRadius = 6.75;
  const threePointSegments = 64;
  const courtHalfLength = COURT_LENGTH / 2;
  const rimLocalXOffset = RIM_TO_BACKBOARD_X;

  // Left three-point line
  const leftHoopX = -courtHalfLength;
  const leftArcCenterX = leftHoopX + rimLocalXOffset;
  const leftThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = (i / threePointSegments) * Math.PI - Math.PI / 2;
    leftThreePointPoints.push(new THREE.Vector3(
      leftArcCenterX + Math.cos(theta) * threePointRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * threePointRadius
    ));
  }
  const leftThreePointGeometry = new THREE.BufferGeometry().setFromPoints(leftThreePointPoints);
  scene.add(new THREE.Line(leftThreePointGeometry, lineMaterial));

  // Right three-point line
  const rightHoopX = courtHalfLength;
  const rightArcCenterX = rightHoopX - rimLocalXOffset;
  const rightThreePointPoints = [];
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = (i / threePointSegments) * Math.PI - Math.PI / 2;
    rightThreePointPoints.push(new THREE.Vector3(
      rightArcCenterX - Math.cos(theta) * threePointRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * threePointRadius
    ));
  }
  const rightThreePointGeometry = new THREE.BufferGeometry().setFromPoints(rightThreePointPoints);
  scene.add(new THREE.Line(rightThreePointGeometry, lineMaterial));
}

// ========== HOOP & COMPONENTS (all relative) ==========
function createBasketballHoop(hoopX, rotationY) {
  const hoopGroup = new THREE.Group();
  hoopGroup.position.x = hoopX;
  hoopGroup.rotation.y = rotationY;

  // --- Backboard ---
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(BACKBOARD_THICKNESS, BACKBOARD_HEIGHT, BACKBOARD_WIDTH),
    new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
  );
  // Position so bottom of backboard is at BACKBOARD_BOTTOM_Y
  backboard.position.set(
    BACKBOARD_THICKNESS / 2,           // X: attached to group origin
    BACKBOARD_BOTTOM_Y + BACKBOARD_HEIGHT / 2, // Y: bottom at 3.05m
    0
  );
  backboard.castShadow = true;
  hoopGroup.add(backboard);

  // --- Rim ---
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(RIM_RADIUS, RIM_TUBE_RADIUS, 16, RIM_SEGMENTS),
    new THREE.MeshPhongMaterial({ color: 0xff8c00 })
  );
  rim.position.set(
    BACKBOARD_THICKNESS + RIM_RADIUS, // X: in front of backboard
    RIM_HEIGHT_ABOVE_GROUND,
    0
  );
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  hoopGroup.add(rim);

  // --- Net ---
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const netBottomY = rim.position.y - NET_HEIGHT;
  // Net lines
  for (let i = 0; i < NET_SEGMENTS; i++) {
    const angle = (i / NET_SEGMENTS) * Math.PI * 2;
    const netGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        rim.position.x + Math.cos(angle) * RIM_RADIUS,
        rim.position.y,
        rim.position.z + Math.sin(angle) * RIM_RADIUS
      ),
      new THREE.Vector3(
        rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
        netBottomY,
        rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
      )
    ]);
    hoopGroup.add(new THREE.Line(netGeometry, netMaterial));
  }
  // Net bottom circle
  const bottomCirclePoints = [];
  for (let i = 0; i <= NET_SEGMENTS; i++) {
    const angle = (i / NET_SEGMENTS) * Math.PI * 2;
    bottomCirclePoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
      netBottomY,
      rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
    ));
  }
  hoopGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(bottomCirclePoints), netMaterial));

  // --- Pole ---
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 8),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  // Centered vertically, placed behind backboard
  pole.position.set(
    backboard.position.x - POLE_TO_BACKBOARD_X,
    POLE_HEIGHT / 2,
    0
  );
  pole.castShadow = true;
  hoopGroup.add(pole);

  // --- Arm ---
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(ARM_LENGTH, ARM_HEIGHT, ARM_DEPTH),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  // Stretches from pole to backboard, at the same Y as backboard center
  arm.position.set(
    backboard.position.x - (POLE_TO_BACKBOARD_X / 2),
    backboard.position.y,
    0
  );
  arm.castShadow = true;
  hoopGroup.add(arm);

  // --- Shooter's Square ---
  const squarePoints = [
    new THREE.Vector3(-SHOOTER_SQUARE_WIDTH/2,  SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3( SHOOTER_SQUARE_WIDTH/2,  SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3( SHOOTER_SQUARE_WIDTH/2,  SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3( SHOOTER_SQUARE_WIDTH/2, -SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3( SHOOTER_SQUARE_WIDTH/2, -SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3(-SHOOTER_SQUARE_WIDTH/2, -SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3(-SHOOTER_SQUARE_WIDTH/2, -SHOOTER_SQUARE_HEIGHT/2, 0),
    new THREE.Vector3(-SHOOTER_SQUARE_WIDTH/2,  SHOOTER_SQUARE_HEIGHT/2, 0)
  ];
  const shooterSquare = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(squarePoints),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  shooterSquare.position.set(
    backboard.position.x + (BACKBOARD_THICKNESS/2) + SHOOTER_SQUARE_FRONT,
    RIM_HEIGHT_ABOVE_GROUND + (SHOOTER_SQUARE_HEIGHT / 2) + SHOOTER_SQUARE_ABOVE_RIM,
    0
  );
  shooterSquare.rotation.y = Math.PI / 2;
  hoopGroup.add(shooterSquare);

  scene.add(hoopGroup);
}

// ========== BASKETBALL (just ball & seams, all relative) ==========
function createBasketball() {
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
  const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xd35400, shininess: 8, specular: 0x444444 });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  ball.castShadow = true;
  scene.add(ball);

  // Seam material
  const seamThickness = 0.003;
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  function createMainCurvedSeam() {
    const steps = 200, curvePoints = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, theta = t * Math.PI * 2;
      const latitudeVariation = Math.PI / 4 * Math.sin(2 * theta);
      const phi = latitudeVariation;
      const x = BALL_RADIUS * Math.cos(phi) * Math.cos(theta);
      const y = BALL_RADIUS * Math.sin(phi);
      const z = BALL_RADIUS * Math.cos(phi) * Math.sin(theta);
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    curvePoints.push(curvePoints[0]);
    const curvePath = new THREE.CatmullRomCurve3(curvePoints, true);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curvePath, steps, seamThickness, 8, true),
      seamMat
    );
  }
  const seam1 = createMainCurvedSeam();
  ball.add(seam1);
  const seam2 = createMainCurvedSeam();
  seam2.rotation.y = Math.PI / 2;
  ball.add(seam2);
  return ball;
}

// ========== UI & MAIN LOOP (unchanged) ==========
function createUI() {
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
  scoreContainer.innerHTML = `<div id="score">Score: 0</div>`;
  document.body.appendChild(scoreContainer);

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

// Build scene
createBasketballCourt();
const courtHalfLength = COURT_LENGTH / 2;
createBasketballHoop(-courtHalfLength, 0);         // Left hoop
createBasketballHoop(courtHalfLength, Math.PI);    // Right hoop
createBasketball();
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
