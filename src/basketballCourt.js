import { createParquetTexture } from "./textures/parquetTexture.js";

const VISIBLE_COURT_OFFSET = 2;
const COURT_LENGTH = 28.65;
const COURT_WIDTH = 15.24;
const VISIBLE_COURT_LENGTH = COURT_LENGTH + VISIBLE_COURT_OFFSET;
const VISIBLE_COURT_WIDTH = COURT_WIDTH + VISIBLE_COURT_OFFSET;
const COURT_HEIGHT = 0.2;
const RIM_RADIUS = 0.225;
const BACKBOARD_THICKNESS = 0.05;
const RIM_TO_BACKBOARD_X = BACKBOARD_THICKNESS + RIM_RADIUS;
const LINE_OFFSET = 0.04;
const COURT_SHININESS = 0.2;

// Global line material with increased width
const LINE_WIDTH = 2;
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: LINE_WIDTH });

export function createBasketballCourt(scene) {
  addCourtFloor(scene);
  addCourtLines(scene);
  addThreePointLines(scene);
  addKeys(scene);
  addFreeThrowCircles(scene);
  addRestrictedAreas(scene);
}

function addCourtFloor(scene) {
  // Create and configure the parquet floor texture
  const parquetTexture = createParquetTexture();
  
  // Scale texture to match court dimensions
  parquetTexture.repeat.set(
    VISIBLE_COURT_LENGTH / 8,   // Number of texture tiles along length
    VISIBLE_COURT_WIDTH / 8     // Number of texture tiles along width
  );
  parquetTexture.wrapS = parquetTexture.wrapT = THREE.RepeatWrapping;
  parquetTexture.anisotropy = 16; // Improve texture quality at angles

  // Create court floor mesh
  const courtGeometry = new THREE.BoxGeometry(VISIBLE_COURT_LENGTH, COURT_HEIGHT, VISIBLE_COURT_WIDTH);
  const courtMaterial = new THREE.MeshPhongMaterial({
    map: parquetTexture,
    shininess: COURT_SHININESS
  });

  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  court.position.y = COURT_HEIGHT / 8; // Position court floor
  scene.add(court);
}

function addCourtLines(scene) {
  const lineWidth = 0.05; 
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  // Center line (vertical, at x=0)
  const centerLinePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(lineWidth, COURT_WIDTH),
    lineMaterial
  );
  centerLinePlane.position.set(0, COURT_HEIGHT/2 + 0.03, 0);
  centerLinePlane.rotation.x = -Math.PI / 2;
  scene.add(centerLinePlane);

  // Court outline (4 sides as planes)
  // Top
  const topLine = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_LENGTH, lineWidth),
    lineMaterial
  );
  topLine.position.set(0, COURT_HEIGHT/2 + 0.03, COURT_WIDTH/2);
  topLine.rotation.x = -Math.PI / 2;
  scene.add(topLine);

  // Bottom
  const bottomLine = new THREE.Mesh(
    new THREE.PlaneGeometry(COURT_LENGTH, lineWidth),
    lineMaterial
  );
  bottomLine.position.set(0, COURT_HEIGHT/2 + 0.03, -COURT_WIDTH/2);
  bottomLine.rotation.x = -Math.PI / 2;
  scene.add(bottomLine);

  // Left
  const leftLine = new THREE.Mesh(
    new THREE.PlaneGeometry(lineWidth, COURT_WIDTH),
    lineMaterial
  );
  leftLine.position.set(-COURT_LENGTH/2, COURT_HEIGHT/2 + 0.03, 0);
  leftLine.rotation.x = -Math.PI / 2;
  scene.add(leftLine);

  // Right
  const rightLine = new THREE.Mesh(
    new THREE.PlaneGeometry(lineWidth, COURT_WIDTH),
    lineMaterial
  );
  rightLine.position.set(COURT_LENGTH/2, COURT_HEIGHT/2 + 0.03, 0);
  rightLine.rotation.x = -Math.PI / 2;
  scene.add(rightLine);

  // Center circle (as a thin ring/torus)
  const centerCircleRadius = 1.83;
  const centerCircleThickness = 0.03; // Adjust for desired thickness
  const centerCircleGeometry = new THREE.TorusGeometry(centerCircleRadius, centerCircleThickness, 16, 64);
  const centerCircle = new THREE.Mesh(centerCircleGeometry, lineMaterial);
  centerCircle.position.set(0, COURT_HEIGHT/2 + 0.016, 0);
  centerCircle.rotation.x = Math.PI / 2;
  scene.add(centerCircle);
}

function addThreePointLines(scene) {
  const threePointArcRadius = 7.24;
  const threePointSideZ = COURT_WIDTH / 2 - 0.91;
  const threePointSegments = 64;
  const courtHalfLength = COURT_LENGTH / 2;
  const X_OFFSET = 1;
  const threePointXOffsetFromBasket = Math.sqrt(
    threePointArcRadius * threePointArcRadius - threePointSideZ * threePointSideZ
  );

  // Left
  const leftHoopX = -courtHalfLength;
  const leftBasketCenterX = leftHoopX + RIM_TO_BACKBOARD_X + X_OFFSET;
  const leftThreePointPoints = [];
  leftThreePointPoints.push(new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -threePointSideZ));
  leftThreePointPoints.push(new THREE.Vector3(leftBasketCenterX + threePointXOffsetFromBasket, COURT_HEIGHT/2 + LINE_OFFSET, -threePointSideZ));
  const startAngleLeft = Math.atan2(-threePointSideZ, threePointXOffsetFromBasket);
  const endAngleLeft = Math.atan2(threePointSideZ, threePointXOffsetFromBasket);
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = startAngleLeft + (i / threePointSegments) * (endAngleLeft - startAngleLeft);
    leftThreePointPoints.push(new THREE.Vector3(
      leftBasketCenterX + Math.cos(theta) * threePointArcRadius,
      COURT_HEIGHT/2 + LINE_OFFSET,
      Math.sin(theta) * threePointArcRadius
    ));
  }
  leftThreePointPoints.push(new THREE.Vector3(leftBasketCenterX + threePointXOffsetFromBasket, COURT_HEIGHT/2 + LINE_OFFSET, threePointSideZ));
  leftThreePointPoints.push(new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + LINE_OFFSET, threePointSideZ));
  const leftThreePointGeometry = new THREE.BufferGeometry().setFromPoints(leftThreePointPoints);
  scene.add(new THREE.Line(leftThreePointGeometry, lineMaterial));

  // Right
  const rightHoopX = courtHalfLength;
  const rightBasketCenterX = rightHoopX - RIM_TO_BACKBOARD_X - X_OFFSET;
  const rightThreePointPoints = [];
  rightThreePointPoints.push(new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -threePointSideZ));
  rightThreePointPoints.push(new THREE.Vector3(rightBasketCenterX - threePointXOffsetFromBasket, COURT_HEIGHT/2 + LINE_OFFSET, -threePointSideZ));
  const startAngleRight = Math.atan2(-threePointSideZ, threePointXOffsetFromBasket);
  const endAngleRight = Math.atan2(threePointSideZ, threePointXOffsetFromBasket);
  for (let i = 0; i <= threePointSegments; i++) {
    const theta = startAngleRight + (i / threePointSegments) * (endAngleRight - startAngleRight);
    rightThreePointPoints.push(new THREE.Vector3(
      rightBasketCenterX - Math.cos(theta) * threePointArcRadius,
      COURT_HEIGHT/2 + LINE_OFFSET,
      Math.sin(theta) * threePointArcRadius
    ));
  }
  rightThreePointPoints.push(new THREE.Vector3(rightBasketCenterX - threePointXOffsetFromBasket, COURT_HEIGHT/2 + LINE_OFFSET, threePointSideZ));
  rightThreePointPoints.push(new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + LINE_OFFSET, threePointSideZ));
  const rightThreePointGeometry = new THREE.BufferGeometry().setFromPoints(rightThreePointPoints);
  scene.add(new THREE.Line(rightThreePointGeometry, lineMaterial));
}

function addKeys(scene) {
  const keyWidth = 4.88;
  const keyLength = 5.79;
  const courtHalfLength = COURT_LENGTH / 2;
  const leftHoopX = -courtHalfLength;
  const rightHoopX = courtHalfLength;

  // Left Key
  const leftKeyPoints = [
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + LINE_OFFSET, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + LINE_OFFSET, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2)
  ];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftKeyPoints), lineMaterial));

  // Right Key
  const rightKeyPoints = [
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + LINE_OFFSET, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + LINE_OFFSET, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + LINE_OFFSET, -keyWidth / 2)
  ];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightKeyPoints), lineMaterial));
}

function addFreeThrowCircles(scene) {
  const keyLength = 5.79;
  const freeThrowCircleRadius = 1.83;
  const freeThrowCircleSegments = 32;
  const courtHalfLength = COURT_LENGTH / 2;
  const leftHoopX = -courtHalfLength;
  const rightHoopX = courtHalfLength;

  // Left
  const leftFreeThrowLineX = leftHoopX + keyLength;
  const leftFreeThrowCirclePoints = [];
  for (let i = 0; i <= freeThrowCircleSegments; i++) {
    const theta = -Math.PI / 2 + (i / freeThrowCircleSegments) * Math.PI;
    leftFreeThrowCirclePoints.push(new THREE.Vector3(
      leftFreeThrowLineX + Math.cos(theta) * freeThrowCircleRadius,
      COURT_HEIGHT/2 + LINE_OFFSET,
      Math.sin(theta) * freeThrowCircleRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftFreeThrowCirclePoints), lineMaterial));

  // Right
  const rightFreeThrowLineX = rightHoopX - keyLength;
  const rightFreeThrowCirclePoints = [];
  for (let i = 0; i <= freeThrowCircleSegments; i++) {
    const theta = Math.PI / 2 + (i / freeThrowCircleSegments) * Math.PI;
    rightFreeThrowCirclePoints.push(new THREE.Vector3(
      rightFreeThrowLineX + Math.cos(theta) * freeThrowCircleRadius,
      COURT_HEIGHT/2 +LINE_OFFSET,
      Math.sin(theta) * freeThrowCircleRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightFreeThrowCirclePoints), lineMaterial));
}

function addRestrictedAreas(scene) {
  const restrictedAreaRadius = 1.22;
  const restrictedArcSegments = 32;
  const courtHalfLength = COURT_LENGTH / 2;
  const X_OFFSET = 1;
  const leftHoopX = -courtHalfLength;
  const rightHoopX = courtHalfLength;
  const leftBasketCenterX = leftHoopX + RIM_TO_BACKBOARD_X + X_OFFSET;
  const rightBasketCenterX = rightHoopX - RIM_TO_BACKBOARD_X - X_OFFSET;

  // Left
  const leftRestrictedAreaPoints = [];
  for (let i = 0; i <= restrictedArcSegments; i++) {
    const theta = -Math.PI / 2 + (i / restrictedArcSegments) * Math.PI;
    leftRestrictedAreaPoints.push(new THREE.Vector3(
      leftBasketCenterX - X_OFFSET + Math.cos(theta) * restrictedAreaRadius,
      COURT_HEIGHT/2 +LINE_OFFSET,
      Math.sin(theta) * restrictedAreaRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftRestrictedAreaPoints), lineMaterial));

  // Right
  const rightRestrictedAreaPoints = [];
  for (let i = 0; i <= restrictedArcSegments; i++) {
    const theta = Math.PI / 2 + (i / restrictedArcSegments) * Math.PI;
    rightRestrictedAreaPoints.push(new THREE.Vector3(
      rightBasketCenterX + X_OFFSET + Math.cos(theta) * restrictedAreaRadius,
      COURT_HEIGHT/2 +LINE_OFFSET,
      Math.sin(theta) * restrictedAreaRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightRestrictedAreaPoints), lineMaterial));
}