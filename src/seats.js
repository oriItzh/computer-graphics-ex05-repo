// Stadium dimensions
const STADIUM_START_HEIGHT = 2; // Height where stands begin
const STADIUM_END_HEIGHT = 12; // Maximum height of stands
const STADIUM_DISTANCE = 6; // Distance from court edge
const SEAT_WIDTH = 0.5;
const SEAT_DEPTH = 0.5;
const SEAT_HEIGHT = 0.4;
const SEAT_BACK_HEIGHT = 0.6;
const SEAT_BACK_THICKNESS = 0.05;
const SEAT_SPACING = 0.1;
const ROW_SPACING = 0.1;
const STADIUM_CAPACITY_FACTOR = 0.75;

// VIP seat dimensions
const VIP_STADIUM_DISTANCE = 4; // Distance from court edge
const VIP_SEAT_WIDTH = 0.7;
const VIP_SEAT_DEPTH = 0.7;
const VIP_SEAT_HEIGHT = 0.5;
const VIP_SEAT_BACK_HEIGHT = 0.8;
const VIP_SEAT_SPACING = 0.2;
const VIP_ROW_SPACING = 0.15;
const VIP_CAPACITY_FACTOR = 1.0;

const NUM_VIP_ROWS = 2;

import { createStadiumPerson } from './stadiumPerson.js';

export function createStadiumStands(scene, COURT_LENGTH, COURT_WIDTH) {
  const standGroup = new THREE.Group();

  // Calculate number of rows for regular seats
  const totalHeight = STADIUM_END_HEIGHT - STADIUM_START_HEIGHT;
  const numRows = Math.floor(totalHeight / (SEAT_HEIGHT + ROW_SPACING));

  // Create VIP rows first
  for (let side = 0; side < 4; side++) {
    for (let row = 0; row < NUM_VIP_ROWS; row++) {
      const isLongSide = side % 2 === 0;
      const length = isLongSide ? COURT_LENGTH : COURT_WIDTH;
      const numSeats = Math.floor(length / (VIP_SEAT_WIDTH + VIP_SEAT_SPACING));
      
      for (let seat = 0; seat < numSeats; seat++) {
        const seatGroup = createSeat(side, row, seat, true, COURT_LENGTH, COURT_WIDTH);
        standGroup.add(seatGroup);
      }
    }
  }
  
  // Create regular stands
  for (let side = 0; side < 4; side++) {
    for (let row = 0; row < numRows; row++) {
      const isLongSide = side % 2 === 0;
      const length = isLongSide ? COURT_LENGTH : COURT_WIDTH;
      const numSeats = Math.floor(length / (SEAT_WIDTH + SEAT_SPACING));
      
      for (let seat = 0; seat < numSeats; seat++) {
        const seatGroup = createSeat(side, row, seat, false, COURT_LENGTH, COURT_WIDTH);
        standGroup.add(seatGroup);
      }
    }
  }

  scene.add(standGroup);
}

function createSeat(side, row, seat, isVIP, COURT_LENGTH, COURT_WIDTH) {
  const seatGroup = new THREE.Group();
  
  // Determine seat dimensions and spacing based on VIP status
  const seatWidth = isVIP ? VIP_SEAT_WIDTH : SEAT_WIDTH;
  const seatHeight = isVIP ? VIP_SEAT_HEIGHT : SEAT_HEIGHT;
  const seatDepth = isVIP ? VIP_SEAT_DEPTH : SEAT_DEPTH;
  const seatBackHeight = isVIP ? VIP_SEAT_BACK_HEIGHT : SEAT_BACK_HEIGHT;
  const seatSpacing = isVIP ? VIP_SEAT_SPACING : SEAT_SPACING;
  const rowSpacing = isVIP ? VIP_ROW_SPACING : ROW_SPACING;
  const stadiumDistance = isVIP ? VIP_STADIUM_DISTANCE : STADIUM_DISTANCE;
  const capacity_factor =  isVIP ? VIP_CAPACITY_FACTOR : STADIUM_CAPACITY_FACTOR;
  const material = isVIP ? 
    new THREE.MeshPhongMaterial({ color: 0xffffff }) : // White for VIP
    new THREE.MeshPhongMaterial({ color: 0x1e90ff });  // Blue for regular

  // Calculate row-specific values
  const rowHeight = isVIP ? 
    row * (VIP_SEAT_HEIGHT + VIP_ROW_SPACING) :
    STADIUM_START_HEIGHT + row * (SEAT_HEIGHT + ROW_SPACING);
  const rowDistance = stadiumDistance + row * (seatDepth + rowSpacing);

  // Calculate seat position
  const isLongSide = side % 2 === 0;
  const length = isLongSide ? COURT_LENGTH : COURT_WIDTH;
  const numSeats = Math.floor(length / (seatWidth + seatSpacing));
  const seatX = (seat - numSeats/2) * (seatWidth + seatSpacing);
  
  // Create seat surface
  const seatSurface = new THREE.Mesh(
    new THREE.BoxGeometry(seatWidth, seatHeight, seatDepth),
    material
  );
  seatSurface.position.y = seatHeight/2;
  seatSurface.castShadow = true;
  seatSurface.receiveShadow = true;
  seatGroup.add(seatSurface);
  
  // Create seat back
  const seatBack = new THREE.Mesh(
    new THREE.BoxGeometry(seatWidth, seatBackHeight, SEAT_BACK_THICKNESS),
    material
  );
  seatBack.position.set(0, seatHeight + seatBackHeight/2, -seatDepth/2);
  seatBack.castShadow = true;
  seatBack.receiveShadow = true;
  seatGroup.add(seatBack);

  // Add person to seat
  if (Math.random() < capacity_factor){
    createStadiumPerson(seatGroup, seatHeight);

  }

  // Position and rotate based on which side of the court
  switch(side) {
    case 0: // Top
      seatGroup.position.set(seatX, rowHeight, COURT_WIDTH/2 + rowDistance);
      seatGroup.rotation.y = Math.PI;
      break;
    case 1: // Right
      seatGroup.position.set(COURT_LENGTH/2 + rowDistance, rowHeight, seatX);
      seatGroup.rotation.y = -Math.PI/2;
      break;
    case 2: // Bottom
      seatGroup.position.set(seatX, rowHeight, -COURT_WIDTH/2 - rowDistance);
      seatGroup.rotation.y = 0;
      break;
    case 3: // Left
      seatGroup.position.set(-COURT_LENGTH/2 - rowDistance, rowHeight, seatX);
      seatGroup.rotation.y = Math.PI/2;
      break;
  }

  return seatGroup;
}


