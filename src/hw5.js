import { OrbitControls } from './OrbitControls.js'; // OrbitControls.js is a custom implementation of the OrbitControls class 
// import { createBasketballCourt } from './basketballCourt.js';

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

// --- DIMENSIONS & CONSTANTS (all units in meters) ---
const VISIBLE_COURT_OFFSET = 4;
const COURT_LENGTH = 28.65; // NBA: 94 feet = 28.65 meters
const COURT_WIDTH = 15.24; // NBA: 50 feet = 15.24 meters
const VISIBLE_COURT_LENGTH = COURT_LENGTH + VISIBLE_COURT_OFFSET;
const VISIBLE_COURT_WIDTH = COURT_WIDTH + VISIBLE_COURT_OFFSET;
const COURT_HEIGHT = 0.2; // for debugging

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
const NET_BOTTOM_RADIUS = RIM_RADIUS * 0.5;

const POLE_RADIUS = 0.1;
const POLE_HEIGHT = 4;
const POLE_TO_BACKBOARD_X = 1.2; // Distance from backboard to pole (arm length)
const ARM_LENGTH = POLE_TO_BACKBOARD_X;
const ARM_HEIGHT = 0.1;
const ARM_DEPTH = 0.1;

// Court lighting constants
const LIGHT_POLE_HEIGHT = 8; // Height of the lighting poles
const LIGHT_POLE_RADIUS = 0.15; // Radius of the lighting poles
const LIGHT_POLE_DISTANCE = 3; // Distance from court lines
const LIGHT_POLE_SPACING = COURT_LENGTH / 3; // Space between poles evenly
const LIGHT_INTENSITY = 0.8; // Intensity of the spotlights

// Lamp dimensions
const LAMP_WIDTH = 1.5;
const LAMP_HEIGHT = 0.5;
const LAMP_DEPTH = 0.4;
const LIGHT_PANEL_RADIUS = 0.15;
const LIGHT_PANEL_SPACING = 0.4; // Space between light panels

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

  // drawOuterLines(scene, VISIBLE_COURT_LENGTH, VISIBLE_COURT_WIDTH, COURT_HEIGHT);
  // drawThreePointLines(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT);
  // drawCenterCircle(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT);
  // drawKey(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT);
  // drawFreeThrowLines(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT);
  // drawRestrictedArea(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT);

  const courtGeometry = new THREE.BoxGeometry(VISIBLE_COURT_LENGTH, COURT_HEIGHT, VISIBLE_COURT_WIDTH);
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

  const courtOutlinePoints = [
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, COURT_WIDTH/2),
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    new THREE.Vector3(COURT_LENGTH/2, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    new THREE.Vector3(COURT_LENGTH/2, COURT_HEIGHT/2 + 0.01, COURT_WIDTH/2),
    new THREE.Vector3(-COURT_LENGTH/2, COURT_HEIGHT/2 + 0.01, COURT_WIDTH/2),
    new THREE.Vector3(-COURT_LENGTH/2, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    ];
  const courtOutline = new THREE.BufferGeometry().setFromPoints(courtOutlinePoints);
  scene.add(new THREE.Line(courtOutline, lineMaterial));
  // Center circle
  const centerCircleRadius = 1.83; // NBA: 12ft diameter (6ft radius) = 3.66m diameter (1.83m radius)
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

  // Three-point lines (arcs and straight lines)
  const threePointArcRadius = 7.24; // NBA: 23ft 9in = 7.24m
  const threePointSideZ = COURT_WIDTH / 2 - 0.91; // NBA: 3ft from sideline = 0.91m from sideline
  const threePointSegments = 64;
  const courtHalfLength = COURT_LENGTH / 2;
  const X_OFFSET = 1;

  // Calculate the X coordinate where the straight line meets the arc
  // arcRadius^2 = deltaX^2 + deltaZ^2
  // deltaX = sqrt(arcRadius^2 - deltaZ^2)
  const threePointXOffsetFromBasket = Math.sqrt(
    threePointArcRadius * threePointArcRadius - threePointSideZ * threePointSideZ
  );

  // Left three-point line
  const leftHoopX = -courtHalfLength;
  const leftBasketCenterX = leftHoopX + RIM_TO_BACKBOARD_X + X_OFFSET; // X-coordinate of the basket center

  const leftThreePointPoints = [];
  // Straight line segment (bottom left)
  leftThreePointPoints.push(new THREE.Vector3(
    leftHoopX,
    COURT_HEIGHT/2 + 0.01,
    -threePointSideZ
  ));
  leftThreePointPoints.push(new THREE.Vector3(
    leftBasketCenterX + threePointXOffsetFromBasket,
    COURT_HEIGHT/2 + 0.01,
    -threePointSideZ
  ));

  // Arc segment
  const startAngleLeft = Math.atan2(-threePointSideZ, threePointXOffsetFromBasket);
  const endAngleLeft = Math.atan2(threePointSideZ, threePointXOffsetFromBasket);

  for (let i = 0; i <= threePointSegments; i++) {
    const theta = startAngleLeft + (i / threePointSegments) * (endAngleLeft - startAngleLeft);
    leftThreePointPoints.push(new THREE.Vector3(
      leftBasketCenterX + Math.cos(theta) * threePointArcRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * threePointArcRadius
    ));
  }

  // Straight line segment (top left)
  leftThreePointPoints.push(new THREE.Vector3(
    leftBasketCenterX + threePointXOffsetFromBasket,
    COURT_HEIGHT/2 + 0.01,
    threePointSideZ
  ));
  leftThreePointPoints.push(new THREE.Vector3(
    leftHoopX,
    COURT_HEIGHT/2 + 0.01,
    threePointSideZ
  ));

  const leftThreePointGeometry = new THREE.BufferGeometry().setFromPoints(leftThreePointPoints);
  scene.add(new THREE.Line(leftThreePointGeometry, lineMaterial));

  // Right three-point line
  const rightHoopX = courtHalfLength;
  const rightBasketCenterX = rightHoopX - RIM_TO_BACKBOARD_X - X_OFFSET; // X-coordinate of the basket center

  const rightThreePointPoints = [];
  // Straight line segment (bottom right)
  rightThreePointPoints.push(new THREE.Vector3(
    rightHoopX,
    COURT_HEIGHT/2 + 0.01,
    -threePointSideZ
  ));
  rightThreePointPoints.push(new THREE.Vector3(
    rightBasketCenterX - threePointXOffsetFromBasket,
    COURT_HEIGHT/2 + 0.01,
    -threePointSideZ
  ));

  // Arc segment
  const startAngleRight = Math.atan2(-threePointSideZ, threePointXOffsetFromBasket);
  const endAngleRight = Math.atan2(threePointSideZ, threePointXOffsetFromBasket);

  for (let i = 0; i <= threePointSegments; i++) {
    const theta = startAngleRight + (i / threePointSegments) * (endAngleRight - startAngleRight);
    rightThreePointPoints.push(new THREE.Vector3(
      rightBasketCenterX - Math.cos(theta) * threePointArcRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * threePointArcRadius
    ));
  }

  // Straight line segment (top right)
  rightThreePointPoints.push(new THREE.Vector3(
    rightBasketCenterX - threePointXOffsetFromBasket,
    COURT_HEIGHT/2 + 0.01,
    threePointSideZ
  ));
  rightThreePointPoints.push(new THREE.Vector3(
    rightHoopX,
    COURT_HEIGHT/2 + 0.01,
    threePointSideZ
  ));

  const rightThreePointGeometry = new THREE.BufferGeometry().setFromPoints(rightThreePointPoints);
  scene.add(new THREE.Line(rightThreePointGeometry, lineMaterial));

  // Key (Free Throw Lane)
  const keyWidth = 4.88; // NBA: 16 feet = 4.88m
  const keyLength = 5.79; // NBA: 19 feet from baseline to foul line = 5.79m

  // Left Key
  const leftKeyPoints = [
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2) // Close the rectangle
  ];
  const leftKeyGeometry = new THREE.BufferGeometry().setFromPoints(leftKeyPoints);
  scene.add(new THREE.Line(leftKeyGeometry, lineMaterial));

  // Right Key
  const rightKeyPoints = [
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2) // Close the rectangle
  ];
  const rightKeyGeometry = new THREE.BufferGeometry().setFromPoints(rightKeyPoints);
  scene.add(new THREE.Line(rightKeyGeometry, lineMaterial));

  // Free Throw Circles (Semicircles)
  const freeThrowCircleRadius = 1.83; // NBA: 6ft radius = 1.83m
  const freeThrowCircleSegments = 32;

  // Left Free Throw Circle (semicircle)
  const leftFreeThrowLineX = leftHoopX + keyLength;
  const leftFreeThrowCirclePoints = [];
  for (let i = 0; i <= freeThrowCircleSegments; i++) { // Half circle from 0 to PI
    const theta = -Math.PI / 2 + (i / freeThrowCircleSegments) * Math.PI;
    leftFreeThrowCirclePoints.push(new THREE.Vector3(
      leftFreeThrowLineX + Math.cos(theta) * freeThrowCircleRadius,
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * freeThrowCircleRadius
    ));
  }
  const leftFreeThrowCircleGeometry = new THREE.BufferGeometry().setFromPoints(leftFreeThrowCirclePoints);
  scene.add(new THREE.Line(leftFreeThrowCircleGeometry, lineMaterial));

  // Right Free Throw Circle (semicircle)
  const rightFreeThrowLineX = rightHoopX - keyLength;
  const rightFreeThrowCirclePoints = [];
  for (let i = 0; i <= freeThrowCircleSegments; i++) { // Half circle, but flipped
    const theta = Math.PI / 2 + (i / freeThrowCircleSegments) * Math.PI;
    rightFreeThrowCirclePoints.push(new THREE.Vector3(
      rightFreeThrowLineX + Math.cos(theta) * freeThrowCircleRadius, // Subtract for x, as it's mirrored
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * freeThrowCircleRadius
    ));
  }
  const rightFreeThrowCircleGeometry = new THREE.BufferGeometry().setFromPoints(rightFreeThrowCirclePoints);
  scene.add(new THREE.Line(rightFreeThrowCircleGeometry, lineMaterial));

  // Restricted Area (No Charge Arc)
  const restrictedAreaRadius = 1.22; // NBA: 4ft radius = 1.22m

  // Left Restricted Area
  const leftRestrictedAreaPoints = [];
  const restrictedArcSegments = 32;
  for (let i = 0; i <= restrictedArcSegments; i++) {
    const theta = -Math.PI / 2 + (i / restrictedArcSegments) * Math.PI; // Semicircle from -PI/2 to PI/2
    leftRestrictedAreaPoints.push(new THREE.Vector3(
      leftBasketCenterX - X_OFFSET + Math.cos(theta) * restrictedAreaRadius, // Corrected X-coordinate calculation
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * restrictedAreaRadius
    ));
  }
  const leftRestrictedAreaGeometry = new THREE.BufferGeometry().setFromPoints(leftRestrictedAreaPoints);
  scene.add(new THREE.Line(leftRestrictedAreaGeometry, lineMaterial));

  // Right Restricted Area
  const rightRestrictedAreaPoints = [];
  for (let i = 0; i <= restrictedArcSegments; i++) {
    const theta = Math.PI / 2 + (i / restrictedArcSegments) * Math.PI; // Semicircle from PI/2 to 3*PI/2
    rightRestrictedAreaPoints.push(new THREE.Vector3(
      rightBasketCenterX + X_OFFSET + Math.cos(theta) * restrictedAreaRadius, // Corrected X-coordinate calculation
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * restrictedAreaRadius
    ));
  }
  const rightRestrictedAreaGeometry = new THREE.BufferGeometry().setFromPoints(rightRestrictedAreaPoints);
  scene.add(new THREE.Line(rightRestrictedAreaGeometry, lineMaterial));
}

// ========== HOOP & COMPONENTS (all relative) ==========
function createBasketballHoop(hoopX, rotationY) {
  // createRim(scene, hoopX, rotationY);
  // createBackboard(scene, hoopX, rotationY);
  // createNet(scene, hoopX, rotationY);
  // createPole(scene, hoopX, rotationY);
  // createArm(scene, hoopX, rotationY);
  // createShootersSquare(scene, hoopX, rotationY);

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
  
  // Create diagonal net segments
  const netSegments = NET_SEGMENTS;
  const netPoints = [];
  
  // Create points for the net
  for (let i = 0; i <= netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    // Top rim points
    netPoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * RIM_RADIUS,
      rim.position.y,
      rim.position.z + Math.sin(angle) * RIM_RADIUS
    ));
    // Bottom rim points
    netPoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
      netBottomY,
      rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
    ));
  }

  // Create diagonal segments
  for (let i = 0; i < netSegments; i++) {
    // Vertical segments
    const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
      netPoints[i * 2],
      netPoints[i * 2 + 1]
    ]);
    hoopGroup.add(new THREE.Line(verticalGeometry, netMaterial));

    // Diagonal segments (forward)
    const diagonalForwardGeometry = new THREE.BufferGeometry().setFromPoints([
      netPoints[i * 2],
      netPoints[((i + 1) * 2 + 1) % (netSegments * 2)]
    ]);
    hoopGroup.add(new THREE.Line(diagonalForwardGeometry, netMaterial));

    // Diagonal segments (backward)
    const diagonalBackwardGeometry = new THREE.BufferGeometry().setFromPoints([
      netPoints[i * 2 + 1],
      netPoints[((i + 1) * 2) % (netSegments * 2)]
    ]);
    hoopGroup.add(new THREE.Line(diagonalBackwardGeometry, netMaterial));
  }

  // Net bottom circle
  const bottomCirclePoints = [];
  for (let i = 0; i <= netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
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
    new THREE.LineBasicMaterial({ color: 0xffffff , linewidth: 10 })
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

// ========== COURT LIGHTING ==========
function createCourtLighting() {
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
  const lampMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
  const lightPanelMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const lightPoleGroup = new THREE.Group();

  // Create poles and lights for both sides of the court
  for (let side = -1; side <= 1; side += 2) { // -1 for left side, 1 for right side
    for (let i = -1; i <= 1; i++) { // Create 3 poles on each side
      const poleX = i * LIGHT_POLE_SPACING;
      const poleZ = (COURT_WIDTH/2 + LIGHT_POLE_DISTANCE) * side;

      // Create pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(LIGHT_POLE_RADIUS, LIGHT_POLE_RADIUS, LIGHT_POLE_HEIGHT, 8),
        poleMaterial
      );
      pole.position.set(poleX, LIGHT_POLE_HEIGHT/2, poleZ);
      pole.castShadow = true;
      lightPoleGroup.add(pole);

      // Create lamp fixture
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(LAMP_WIDTH, LAMP_HEIGHT, LAMP_DEPTH),
        lampMaterial
      );
      lamp.position.set(
        poleX,
        LIGHT_POLE_HEIGHT + LAMP_HEIGHT/2,
        poleZ
      );
      lamp.castShadow = true;
      lightPoleGroup.add(lamp);

      // Create three white circular light panels
      for (let j = -1; j <= 1; j++) {
        const lightPanel = new THREE.Mesh(
          new THREE.CircleGeometry(LIGHT_PANEL_RADIUS, 32),
          lightPanelMaterial
        );
        lightPanel.position.set(
          poleX + j * LIGHT_PANEL_SPACING,
          LIGHT_POLE_HEIGHT + LAMP_HEIGHT/2,
          poleZ + (LAMP_DEPTH/2 + 0.02) * (side === 1 ? -1 : 1)
        );
        // lightPanel.rotation.y = Math.PI / 2;
        lightPoleGroup.add(lightPanel);
      }

      // Create spotlight
      const spotlight = new THREE.SpotLight(0xffffff, LIGHT_INTENSITY);
      spotlight.position.set(
        poleX,
        LIGHT_POLE_HEIGHT + LAMP_HEIGHT/2,
        poleZ
      );
      spotlight.angle = Math.PI / 4; // 45 degrees
      spotlight.penumbra = 0.2;
      spotlight.decay = 1;
      spotlight.distance = 20;
      spotlight.castShadow = true;
      
      // Make light face the court
      spotlight.target.position.set(poleX, 0, poleZ/5);
      lightPoleGroup.add(spotlight.target);
      lightPoleGroup.add(spotlight);
    }
  }

  scene.add(lightPoleGroup);
}

// Build scene
createBasketballCourt(scene, COURT_LENGTH, COURT_WIDTH, COURT_HEIGHT, RIM_TO_BACKBOARD_X, VISIBLE_COURT_OFFSET);
const courtHalfLength = COURT_LENGTH / 2;
createBasketballHoop(-courtHalfLength, 0);         // Left hoop
createBasketballHoop(courtHalfLength, Math.PI);    // Right hoop
createBasketball();
createCourtLighting(); // Add court lighting
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
