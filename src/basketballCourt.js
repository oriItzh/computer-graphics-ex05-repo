const VISIBLE_COURT_OFFSET = 2;
const COURT_LENGTH = 28.65;
const COURT_WIDTH = 15.24;
const VISIBLE_COURT_LENGTH = COURT_LENGTH + VISIBLE_COURT_OFFSET;
const VISIBLE_COURT_WIDTH = COURT_WIDTH + VISIBLE_COURT_OFFSET;
const COURT_HEIGHT = 0.2;
const RIM_RADIUS = 0.225;
const BACKBOARD_THICKNESS = 0.05;
const RIM_TO_BACKBOARD_X = BACKBOARD_THICKNESS + RIM_RADIUS;

export function createBasketballCourt(scene) {
  addCourtFloor(scene);
  addCourtLines(scene);
  addThreePointLines(scene);
  addKeys(scene);
  addFreeThrowCircles(scene);
  addRestrictedAreas(scene);
}

function addCourtFloor(scene) {
  const courtGeometry = new THREE.BoxGeometry(VISIBLE_COURT_LENGTH, COURT_HEIGHT, VISIBLE_COURT_WIDTH);
  const courtMaterial = new THREE.MeshPhongMaterial({ color: 0xc68642, shininess: 50 });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);
}

function addCourtLines(scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Center line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, -COURT_WIDTH/2),
    new THREE.Vector3(0, COURT_HEIGHT/2 + 0.01, COURT_WIDTH/2)
  ]);
  scene.add(new THREE.Line(centerLineGeometry, lineMaterial));

  // Court outline
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
  const centerCircleRadius = 1.83;
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
}

function addThreePointLines(scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
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
  leftThreePointPoints.push(new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, -threePointSideZ));
  leftThreePointPoints.push(new THREE.Vector3(leftBasketCenterX + threePointXOffsetFromBasket, COURT_HEIGHT/2 + 0.01, -threePointSideZ));
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
  leftThreePointPoints.push(new THREE.Vector3(leftBasketCenterX + threePointXOffsetFromBasket, COURT_HEIGHT/2 + 0.01, threePointSideZ));
  leftThreePointPoints.push(new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, threePointSideZ));
  const leftThreePointGeometry = new THREE.BufferGeometry().setFromPoints(leftThreePointPoints);
  scene.add(new THREE.Line(leftThreePointGeometry, lineMaterial));

  // Right
  const rightHoopX = courtHalfLength;
  const rightBasketCenterX = rightHoopX - RIM_TO_BACKBOARD_X - X_OFFSET;
  const rightThreePointPoints = [];
  rightThreePointPoints.push(new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, -threePointSideZ));
  rightThreePointPoints.push(new THREE.Vector3(rightBasketCenterX - threePointXOffsetFromBasket, COURT_HEIGHT/2 + 0.01, -threePointSideZ));
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
  rightThreePointPoints.push(new THREE.Vector3(rightBasketCenterX - threePointXOffsetFromBasket, COURT_HEIGHT/2 + 0.01, threePointSideZ));
  rightThreePointPoints.push(new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, threePointSideZ));
  const rightThreePointGeometry = new THREE.BufferGeometry().setFromPoints(rightThreePointPoints);
  scene.add(new THREE.Line(rightThreePointGeometry, lineMaterial));
}

function addKeys(scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const keyWidth = 4.88;
  const keyLength = 5.79;
  const courtHalfLength = COURT_LENGTH / 2;
  const leftHoopX = -courtHalfLength;
  const rightHoopX = courtHalfLength;

  // Left Key
  const leftKeyPoints = [
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(leftHoopX + keyLength, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(leftHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2)
  ];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftKeyPoints), lineMaterial));

  // Right Key
  const rightKeyPoints = [
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + 0.01, keyWidth / 2),
    new THREE.Vector3(rightHoopX - keyLength, COURT_HEIGHT/2 + 0.01, -keyWidth / 2),
    new THREE.Vector3(rightHoopX, COURT_HEIGHT/2 + 0.01, -keyWidth / 2)
  ];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightKeyPoints), lineMaterial));
}

function addFreeThrowCircles(scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
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
      COURT_HEIGHT/2 + 0.01,
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
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * freeThrowCircleRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightFreeThrowCirclePoints), lineMaterial));
}

function addRestrictedAreas(scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
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
      COURT_HEIGHT/2 + 0.01,
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
      COURT_HEIGHT/2 + 0.01,
      Math.sin(theta) * restrictedAreaRadius
    ));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightRestrictedAreaPoints), lineMaterial));
}