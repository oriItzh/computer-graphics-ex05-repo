import { createNbaLogoTexture } from "./textures/nbaLogo.js";

const RIM_RADIUS = 0.225;
const RIM_TUBE_RADIUS = 0.02;
const RIM_HEIGHT_ABOVE_GROUND = 3.05;
const RIM_SEGMENTS = 32;

const BACKBOARD_WIDTH = 1.8;
const BACKBOARD_HEIGHT = 1.05;
const BACKBOARD_THICKNESS = 0.05;
const BACKBOARD_BOTTOM_Y = RIM_HEIGHT_ABOVE_GROUND - BACKBOARD_HEIGHT / 8;

const NET_SEGMENTS = 16;
const NET_HEIGHT = 0.45;
const NET_BOTTOM_RADIUS = RIM_RADIUS * 0.55;
const NET_MIDDLE_RADIUS = RIM_RADIUS * 0.70;
const NET_MIDDLE_Y = RIM_HEIGHT_ABOVE_GROUND - NET_HEIGHT * 0.4;

const POLE_RADIUS = 0.1;
const POLE_HEIGHT = 4;
const POLE_TO_BACKBOARD_X = 1.2;
const ARM_LENGTH = POLE_TO_BACKBOARD_X;
const ARM_HEIGHT = 0.1;
const ARM_DEPTH = 0.1;

const SHOOTER_SQUARE_WIDTH = BACKBOARD_WIDTH / 2.5;
const SHOOTER_SQUARE_HEIGHT = BACKBOARD_HEIGHT / 2.5;
const SHOOTER_SQUARE_ABOVE_RIM = 0.05;
const SHOOTER_SQUARE_FRONT = 0.01;

// Helper to set shadow properties recursively
function setShadowRecursively(object, cast = true, receive = true) {
  object.traverse(child => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

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
  setShadowRecursively(backboard);
  hoopGroup.add(backboard);

  const rim = createRim();
  setShadowRecursively(rim);
  hoopGroup.add(rim);

  // Add the rim brackets that connect to the backboard (like in your reference image)
  const rimBracket = createRimBracket(backboard);
  setShadowRecursively(rimBracket);
  hoopGroup.add(rimBracket);

  const net = createNet(rim);
  net.forEach(line => setShadowRecursively(line, false, false));
  hoopGroup.add(...net);

  const pole = createPole(backboard);
  setShadowRecursively(pole);
  hoopGroup.add(pole);

  const arm = createArm(backboard);
  setShadowRecursively(arm);
  hoopGroup.add(arm);

  const shooterSquare = createShootersSquare(backboard);
  setShadowRecursively(shooterSquare);
  hoopGroup.add(shooterSquare);

  setShadowRecursively(hoopGroup);
  scene.add(hoopGroup);
}

function createRimBracket(backboard) {
  const bracketGroup = new THREE.Group();
  
  // Orange metal material for brackets (similar to rim color)
  const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c00, shininess: 60 });
  
  // Adjust the bracket dimensions to make it shorter
  const rimOffset = 0.01;  // Reduced from 0.1
  const bracketLength = RIM_RADIUS + rimOffset;
  
  // Keep the bracket thin and narrow
  const bracketHeight = 0.02;
  const bracketWidth = 0.253;
  
  // Create shorter horizontal support connecting rim to backboard
  const horizontalSupport = new THREE.Mesh(
    new THREE.BoxGeometry(bracketLength, bracketHeight, bracketWidth),
    bracketMaterial
  );
  horizontalSupport.position.set(
    backboard.position.x + BACKBOARD_THICKNESS/2 + bracketLength/2,
    RIM_HEIGHT_ABOVE_GROUND,
    0
  );
  
  bracketGroup.add(horizontalSupport);
  return bracketGroup;
}

function createBackboardFrame(backboardMesh) {
  const FRAME_THICKNESS = 0.07;
  const FRAME_DEPTH = BACKBOARD_THICKNESS + 0.02;
  const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, metalness: 0.8, shininess: 80 });

  // Top frame
  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_DEPTH, FRAME_THICKNESS, BACKBOARD_WIDTH + 2 * FRAME_THICKNESS),
    frameMaterial
  );
  topFrame.position.set(0, BACKBOARD_HEIGHT / 2 + FRAME_THICKNESS / 2, 0);
  backboardMesh.add(topFrame);

  // Bottom frame
  const bottomFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_DEPTH, FRAME_THICKNESS, BACKBOARD_WIDTH + 2 * FRAME_THICKNESS),
    frameMaterial
  );
  bottomFrame.position.set(0, -BACKBOARD_HEIGHT / 2 - FRAME_THICKNESS / 2, 0);
  backboardMesh.add(bottomFrame);

  // Left frame
  const leftFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_DEPTH, BACKBOARD_HEIGHT, FRAME_THICKNESS),
    frameMaterial
  );
  leftFrame.position.set(0, 0, -BACKBOARD_WIDTH / 2 - FRAME_THICKNESS / 2);
  backboardMesh.add(leftFrame);

  // Right frame
  const rightFrame = new THREE.Mesh(
    new THREE.BoxGeometry(FRAME_DEPTH, BACKBOARD_HEIGHT, FRAME_THICKNESS),
    frameMaterial
  );
  rightFrame.position.set(0, 0, BACKBOARD_WIDTH / 2 + FRAME_THICKNESS / 2);
  backboardMesh.add(rightFrame);
}

function createBackboard() {
  const texture = createBackboardTexture(BACKBOARD_WIDTH, BACKBOARD_HEIGHT, Math.floor(0.25 * 200));
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    transparent: true,
    opacity: 1
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
  mesh.receiveShadow = true;

  createBackboardFrame(mesh);

  return mesh;
}

function createRim() {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(RIM_RADIUS, RIM_TUBE_RADIUS, 16, RIM_SEGMENTS),
    new THREE.MeshPhongMaterial({ color: 0xff8c00, shininess: 60 })
  );
  
  // Reduce the rim offset to make it closer to backboard
  const rimOffset = 0.2;  // Reduced from 0.1
  mesh.position.set(
    BACKBOARD_THICKNESS + RIM_RADIUS + rimOffset,
    RIM_HEIGHT_ABOVE_GROUND,
    0
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createBackboardTexture(width, height, nbaLogoSizePx = 96) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * 200);
  canvas.height = Math.ceil(height * 200);
  const ctx = canvas.getContext('2d');

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;

  const nbaLogoTexture = createNbaLogoTexture(nbaLogoSizePx);
  const logoImage = nbaLogoTexture.image;
  const margin = Math.floor(canvas.width * 0.03);
  ctx.drawImage(
    logoImage,
    margin,
    margin,
    nbaLogoSizePx,
    nbaLogoSizePx * 2.22
  );

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
      rim.position.x + Math.cos(angle) * NET_MIDDLE_RADIUS,
      NET_MIDDLE_Y,
      rim.position.z + Math.sin(angle) * NET_MIDDLE_RADIUS
    ));
    netPoints.push(new THREE.Vector3(
      rim.position.x + Math.cos(angle) * NET_BOTTOM_RADIUS,
      netBottomY,
      rim.position.z + Math.sin(angle) * NET_BOTTOM_RADIUS
    ));
  }

  const netLines = [];
  for (let i = 0; i < netSegments; i++) {
    const baseIndex = i * 3;
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[baseIndex], netPoints[baseIndex + 1]]),
      netMaterial
    ));
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[baseIndex + 1], netPoints[baseIndex + 2]]),
      netMaterial
    ));
  }
  for (let i = 0; i < netSegments; i++) {
    const baseIndex = i * 3;
    const nextBaseIndex = ((i + 1) % netSegments) * 3;
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[baseIndex], netPoints[nextBaseIndex + 1]]),
      netMaterial
    ));
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[baseIndex + 1], netPoints[nextBaseIndex + 2]]),
      netMaterial
    ));
    netLines.push(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([netPoints[baseIndex + 1], netPoints[nextBaseIndex + 1]]),
      netMaterial
    ));
  }
  for (let level = 0; level < 3; level++) {
    const circlePoints = [];
    for (let i = 0; i <= netSegments; i++) {
      circlePoints.push(netPoints[i * 3 + level]);
    }
    netLines.push(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(circlePoints),
      netMaterial
    ));
  }
  return netLines;
}

function createPole(backboard) {
  // Main pole
  const mainPole = new THREE.Mesh(
    new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 8),
    new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 10 })
  );
  mainPole.position.set(
    backboard.position.x - POLE_TO_BACKBOARD_X,
    POLE_HEIGHT / 2,
    0
  );
  mainPole.castShadow = true;
  mainPole.receiveShadow = true;
  
  return mainPole;  // Keep it simple, the arm connection will be handled in createArm
}

function createArm(backboard) {
  const armGroup = new THREE.Group();
  
  // Main horizontal arm connecting pole to backboard
  const mainArm = new THREE.Mesh(
    new THREE.BoxGeometry(ARM_LENGTH, ARM_HEIGHT, ARM_DEPTH),
    new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 10 })
  );
  mainArm.position.set(
    backboard.position.x - (POLE_TO_BACKBOARD_X / 2),
    backboard.position.y,
    0
  );
  
  // Create a connection piece between arm and backboard
  const backboardConnector = new THREE.Mesh(
    new THREE.BoxGeometry(ARM_HEIGHT, ARM_HEIGHT*2, ARM_DEPTH*1.5),
    new THREE.MeshPhongMaterial({ color: 0x707070, shininess: 10 })
  );
  backboardConnector.position.set(
    backboard.position.x - ARM_HEIGHT/2,
    backboard.position.y,
    0
  );
  
  // Create a connection piece between arm and pole
  const poleConnector = new THREE.Mesh(
    new THREE.BoxGeometry(ARM_HEIGHT, ARM_HEIGHT*2, ARM_DEPTH*1.5),
    new THREE.MeshPhongMaterial({ color: 0x707070, shininess: 10 })
  );
  poleConnector.position.set(
    backboard.position.x - POLE_TO_BACKBOARD_X + ARM_HEIGHT/2,
    backboard.position.y,
    0
  );
  
  armGroup.add(mainArm, backboardConnector, poleConnector);
  armGroup.castShadow = true;
  armGroup.receiveShadow = true;
  return armGroup;
}

// Shooter's square as four thin planes (not lines)
function createShootersSquare(backboard) {
  const squareThickness = 0.01;
  const squareMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  // Top edge
  const topEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOOTER_SQUARE_WIDTH, squareThickness),
    squareMaterial
  );
  topEdge.position.set(0, SHOOTER_SQUARE_HEIGHT / 2, 0.01);

  // Bottom edge
  const bottomEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(SHOOTER_SQUARE_WIDTH, squareThickness),
    squareMaterial
  );
  bottomEdge.position.set(0, -SHOOTER_SQUARE_HEIGHT / 2, 0.01);

  // Left edge
  const leftEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(squareThickness, SHOOTER_SQUARE_HEIGHT),
    squareMaterial
  );
  leftEdge.position.set(-SHOOTER_SQUARE_WIDTH / 2, 0, 0.01);

  // Right edge
  const rightEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(squareThickness, SHOOTER_SQUARE_HEIGHT),
    squareMaterial
  );
  rightEdge.position.set(SHOOTER_SQUARE_WIDTH / 2, 0, 0.01);

  const shooterSquareGroup = new THREE.Group();
  shooterSquareGroup.add(topEdge, bottomEdge, leftEdge, rightEdge);

  shooterSquareGroup.position.set(
    backboard.position.x + (BACKBOARD_THICKNESS / 2) + SHOOTER_SQUARE_FRONT,
    RIM_HEIGHT_ABOVE_GROUND + (SHOOTER_SQUARE_HEIGHT / 2) + SHOOTER_SQUARE_ABOVE_RIM,
    0
  );
  shooterSquareGroup.rotation.y = Math.PI / 2;

  return shooterSquareGroup;
}