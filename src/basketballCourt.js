// --- DIMENSIONS & CONSTANTS (all units in meters) ---

import * as THREE from 'three';
// import { scene } from './scene.js';   

export function createBasketballCourt(scene, COURT_LENGTH = 28, COURT_WIDTH = 15, COURT_HEIGHT = 0.1, RIM_TO_BACKBOARD_X = 1.2, VISIBLE_COURT_OFFSET = 0.1) {
  // Floor
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