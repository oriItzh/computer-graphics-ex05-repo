import { createNbaLogoTexture } from "./textures/nbaLogo.js";
const RIM_RADIUS = 0.225;
const RIM_TUBE_RADIUS = 0.02;
const RIM_HEIGHT_ABOVE_GROUND = 3.05;
const RIM_SEGMENTS = 32;

const BACKBOARD_WIDTH = 1.8;
const BACKBOARD_HEIGHT = 1.05;
const BACKBOARD_THICKNESS = 0.05;
const BACKBOARD_BOTTOM_Y = RIM_HEIGHT_ABOVE_GROUND - BACKBOARD_HEIGHT / 8;

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

export function createBasketballHoops(scene, COURT_LENGTH) {
  const courtHalfLength = COURT_LENGTH / 2;
  createBasketballHoop(scene, -courtHalfLength, 0);         // Left hoop
  createBasketballHoop(scene, courtHalfLength, Math.PI);    // Right hoop
}

function createBasketballHoop(scene, hoopX, rotationY) {
  const hoopGroup = new THREE.Group();
  hoopGroup.position.x = hoopX;
  hoopGroup.rotation.y = rotationY;

  const backboard = createBackboard();
  hoopGroup.add(backboard);

  const rim = createRim();
  hoopGroup.add(rim);

  const net = createNet(rim);
  hoopGroup.add(...net);

  const pole = createPole(backboard);
  hoopGroup.add(pole);

  const arm = createArm(backboard);
  hoopGroup.add(arm);

  const shooterSquare = createShootersSquare(backboard);
  hoopGroup.add(shooterSquare);

  scene.add(hoopGroup);
}

function createBackboard() { 
  // Use your own values for BACKBOARD_WIDTH and BACKBOARD_HEIGHT (in meters)
  const texture = createBackboardTexture(BACKBOARD_WIDTH, BACKBOARD_HEIGHT, Math.floor(0.25 * 200)); // NBA logo ~25% of board height

  const material = new THREE.MeshPhongMaterial({
    map: texture,
    transparent: true,
    opacity: 1 // Canvas already simulates opacity
  });

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(BACKBOARD_THICKNESS, BACKBOARD_HEIGHT, BACKBOARD_WIDTH),
    material
  );
  mesh.position.set(
    BACKBOARD_THICKNESS / 2,
    BACKBOARD_BOTTOM_Y + BACKBOARD_HEIGHT / 2,
    0
  );
  mesh.castShadow = true;
  return mesh;
}


function createRim() {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(RIM_RADIUS, RIM_TUBE_RADIUS, 16, RIM_SEGMENTS),
    new THREE.MeshPhongMaterial({ color: 0xff8c00 })
  );
  mesh.position.set(
    BACKBOARD_THICKNESS + RIM_RADIUS,
    RIM_HEIGHT_ABOVE_GROUND,
    0
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  return mesh;
}

// You must already have createNbaLogoTexture imported!

function createBackboardTexture(width, height, nbaLogoSizePx = 96) {
  // Make the canvas the same size as the backboard (for max fidelity)
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * 200);   // for sharpness, 200 px per meter
  canvas.height = Math.ceil(height * 200);
  const ctx = canvas.getContext('2d');

  // Draw white background, partial opacity (simulate 0.8 opacity)
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;

  // Draw NBA logo in top-left corner (with some margin)
  const nbaLogoTexture = createNbaLogoTexture(nbaLogoSizePx);
  // We need to extract the image from the THREE.Texture:
  const logoImage = nbaLogoTexture.image;
  const margin = Math.floor(canvas.width * 0.03);
  ctx.drawImage(
    logoImage,
    margin,
    margin,
    nbaLogoSizePx,
    nbaLogoSizePx * 2.22 // maintain logo aspect ratio
  );

  // Return as THREE.js texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}


function createNet(rim) {
  const netMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const netBottomY = rim.position.y - NET_HEIGHT;
  const netSegments = NET_SEGMENTS;
  const netPoints = [];

  for (let i = 0; i <= netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    netPoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * RIM_RADIUS,
      rim.position.y,
      rim.position.z + Math.sin(angle) * RIM_RADIUS
    ));
    netPoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
      netBottomY,
      rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
    ));
  }

  const netLines = [];
  for (let i = 0; i < netSegments; i++) {
    // Vertical
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[i * 2], netPoints[i * 2 + 1]]),
      netMaterial
    ));
    // Diagonal forward
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[i * 2], netPoints[((i + 1) * 2 + 1) % (netSegments * 2)]]),
      netMaterial
    ));
    // Diagonal backward
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[i * 2 + 1], netPoints[((i + 1) * 2) % (netSegments * 2)]]),
      netMaterial
    ));
  }
  // Bottom circle
  const bottomCirclePoints = [];
  for (let i = 0; i <= netSegments; i++) {
    const angle = (i / netSegments) * Math.PI * 2;
    bottomCirclePoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
      netBottomY,
      rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
    ));
  }
  netLines.push(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(bottomCirclePoints),
    netMaterial
  ));
  return netLines;
}

function createPole(backboard) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 8),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  mesh.position.set(
    backboard.position.x - POLE_TO_BACKBOARD_X,
    POLE_HEIGHT / 2,
    0
  );
  mesh.castShadow = true;
  return mesh;
}

function createArm(backboard) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(ARM_LENGTH, ARM_HEIGHT, ARM_DEPTH),
    new THREE.MeshPhongMaterial({ color: 0x808080 })
  );
  mesh.position.set(
    backboard.position.x - (POLE_TO_BACKBOARD_X / 2),
    backboard.position.y,
    0
  );
  mesh.castShadow = true;
  return mesh;
}

function createShootersSquare(backboard) {
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
  const mesh = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(squarePoints),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  mesh.position.set(
    backboard.position.x + (BACKBOARD_THICKNESS/2) + SHOOTER_SQUARE_FRONT,
    RIM_HEIGHT_ABOVE_GROUND + (SHOOTER_SQUARE_HEIGHT / 2) + SHOOTER_SQUARE_ABOVE_RIM,
    0
  );
  mesh.rotation.y = Math.PI / 2;
  return mesh;
}