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

// VIP seat dimensions
const VIP_STADIUM_DISTANCE = 4; // Distance from court edge
const VIP_SEAT_WIDTH = 0.7;
const VIP_SEAT_DEPTH = 0.7;
const VIP_SEAT_HEIGHT = 0.5;
const VIP_SEAT_BACK_HEIGHT = 0.8;
const VIP_SEAT_SPACING = 0.2;
const VIP_ROW_SPACING = 0.15;
const NUM_VIP_ROWS = 2;

import { createStadiumPerson } from './stadiumPerson.js';

export function createStadiumStands(scene, COURT_LENGTH, COURT_WIDTH) {
  const blueSeatMaterial = new THREE.MeshPhongMaterial({ color: 0x1e90ff }); // Dodger blue color
  const whiteSeatMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // White color
  const standGroup = new THREE.Group();

  // Calculate number of rows based on height difference
  const totalHeight = STADIUM_END_HEIGHT - STADIUM_START_HEIGHT;
  const numRows = Math.floor(totalHeight / (SEAT_HEIGHT + ROW_SPACING));

  // Create VIP rows first
  for (let side = 0; side < 4; side++) {
    const isLongSide = side % 2 === 0;
    const length = isLongSide ? COURT_LENGTH : COURT_WIDTH;
    
    for (let row = 0; row < NUM_VIP_ROWS; row++) {
      const rowHeight = row * (VIP_SEAT_HEIGHT + VIP_ROW_SPACING);
      const rowDistance = VIP_STADIUM_DISTANCE + row * (VIP_SEAT_DEPTH + VIP_ROW_SPACING);
      
      // Calculate number of VIP seats in this row
      const numSeats = Math.floor(length / (VIP_SEAT_WIDTH + VIP_SEAT_SPACING));
      
      for (let seat = 0; seat < numSeats; seat++) {
        const seatX = (seat - numSeats/2) * (VIP_SEAT_WIDTH + VIP_SEAT_SPACING);
        
        // Create VIP seat group
        const seatGroup = new THREE.Group();
        
        // Create VIP seat surface
        const seatSurface = new THREE.Mesh(
          new THREE.BoxGeometry(VIP_SEAT_WIDTH, VIP_SEAT_HEIGHT, VIP_SEAT_DEPTH),
          whiteSeatMaterial
        );
        seatSurface.position.y = VIP_SEAT_HEIGHT/2;
        seatSurface.castShadow = true;
        seatSurface.receiveShadow = true;
        seatGroup.add(seatSurface);
        
        // Create VIP seat back
        const seatBack = new THREE.Mesh(
          new THREE.BoxGeometry(VIP_SEAT_WIDTH, VIP_SEAT_BACK_HEIGHT, SEAT_BACK_THICKNESS),
          whiteSeatMaterial
        );
        seatBack.position.set(0, VIP_SEAT_HEIGHT + VIP_SEAT_BACK_HEIGHT/2, -VIP_SEAT_DEPTH/2);
        seatBack.castShadow = true;
        seatBack.receiveShadow = true;
        seatGroup.add(seatBack);
        
        // Position based on which side of the court
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
        
        // Add person to VIP seat
        createStadiumPerson(seatGroup, VIP_SEAT_HEIGHT, VIP_SEAT_WIDTH, VIP_SEAT_DEPTH);
        
        standGroup.add(seatGroup);
      }
    }
  }
  
  // Create regular stands for all four sides
  for (let side = 0; side < 4; side++) {
    const isLongSide = side % 2 === 0;
    const length = isLongSide ? COURT_LENGTH : COURT_WIDTH;
    const width = isLongSide ? COURT_WIDTH : COURT_LENGTH;
    
    for (let row = 0; row < numRows; row++) {
      const rowHeight = STADIUM_START_HEIGHT + row * (SEAT_HEIGHT + ROW_SPACING);
      const rowDistance = STADIUM_DISTANCE + row * (SEAT_DEPTH + ROW_SPACING);
      
      // Calculate number of seats in this row
      const numSeats = Math.floor(length / (SEAT_WIDTH + SEAT_SPACING));
      
      for (let seat = 0; seat < numSeats; seat++) {
        const seatX = (seat - numSeats/2) * (SEAT_WIDTH + SEAT_SPACING);
        
        // Create seat group
        const seatGroup = new THREE.Group();
        
        // Create seat surface
        const seatSurface = new THREE.Mesh(
          new THREE.BoxGeometry(SEAT_WIDTH, SEAT_HEIGHT, SEAT_DEPTH),
          blueSeatMaterial
        );
        seatSurface.position.y = SEAT_HEIGHT/2;
        seatSurface.castShadow = true;
        seatSurface.receiveShadow = true;
        seatGroup.add(seatSurface);
        
        // Create seat back
        const seatBack = new THREE.Mesh(
          new THREE.BoxGeometry(SEAT_WIDTH, SEAT_BACK_HEIGHT, SEAT_BACK_THICKNESS),
          blueSeatMaterial
        );
        seatBack.position.set(0, SEAT_HEIGHT + SEAT_BACK_HEIGHT/2, -SEAT_DEPTH/2);
        seatBack.castShadow = true;
        seatBack.receiveShadow = true;
        seatGroup.add(seatBack);
        
        // Position based on which side of the court
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
        
        // Add person to regular seat
        createStadiumPerson(seatGroup, SEAT_HEIGHT, SEAT_WIDTH, SEAT_DEPTH);
        
        standGroup.add(seatGroup);
      }
    }
  }

  scene.add(standGroup);
}
