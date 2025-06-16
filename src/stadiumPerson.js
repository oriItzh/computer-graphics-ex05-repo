// Person dimensions (in meters)
const PERSON_TORSO_HEIGHT = 0.4;
const PERSON_TORSO_WIDTH = 0.3;
const PERSON_TORSO_DEPTH = 0.2;
const PERSON_HEAD_RADIUS = 0.1;
const PERSON_ARM_LENGTH = 0.25;
const PERSON_ARM_RADIUS = 0.03;

// Skin tone ranges (RGB values)
const SKIN_TONES = [
    [0.98, 0.91, 0.84], // Light
    [0.93, 0.79, 0.69], // Medium-Light
    [0.85, 0.65, 0.52], // Medium
    [0.75, 0.55, 0.40], // Medium-Dark
    [0.65, 0.45, 0.30], // Dark
];

// Shirt colors (RGB values)
const SHIRT_COLORS = [
    [0.2, 0.4, 0.8],   // Blue
    [0.8, 0.2, 0.2],   // Red
    [0.2, 0.8, 0.2],   // Green
    [0.8, 0.8, 0.2],   // Yellow
    [0.8, 0.4, 0.2],   // Orange
    [0.6, 0.2, 0.8],   // Purple
    [0.8, 0.8, 0.8],   // White
    [0.2, 0.2, 0.2],   // Black
];

function getRandomColor(colors) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.Color(color[0], color[1], color[2]);
}

export function createStadiumPerson(seatGroup, seatSurfaceHeight, seatWidth, seatDepth) {
    // 75% chance to create a person
    if (Math.random() < 0.25) return;
    const personGroup = new THREE.Group();
    personGroup.position.y = seatSurfaceHeight; // Move the entire person group up by the seat's height
    
    // Create materials
    const skinMaterial = new THREE.MeshPhongMaterial({ color: getRandomColor(SKIN_TONES) });
    const shirtMaterial = new THREE.MeshPhongMaterial({ color: getRandomColor(SHIRT_COLORS) });
    
    // Create torso (shirt) - positioned so its bottom is at the personGroup's origin (on top of the seat)
    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(PERSON_TORSO_WIDTH, PERSON_TORSO_HEIGHT, PERSON_TORSO_DEPTH),
        shirtMaterial
    );
    torso.position.y = PERSON_TORSO_HEIGHT / 2; 
    torso.castShadow = true;
    personGroup.add(torso);
    
    // Create head - positioned above torso
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(PERSON_HEAD_RADIUS, 16, 16),
        skinMaterial
    );
    head.position.y = PERSON_TORSO_HEIGHT + PERSON_HEAD_RADIUS;
    head.castShadow = true;
    personGroup.add(head);
    
    // Create arms
    const armGeometry = new THREE.CylinderGeometry(
        PERSON_ARM_RADIUS,
        PERSON_ARM_RADIUS,
        PERSON_ARM_LENGTH,
        8
    );
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(
        -PERSON_TORSO_WIDTH / 2 - PERSON_ARM_LENGTH / 2,
        PERSON_TORSO_HEIGHT / 2, // Align with torso's center
        0
    );
    leftArm.rotation.z = Math.PI / 2;
    leftArm.castShadow = true;
    personGroup.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(
        PERSON_TORSO_WIDTH / 2 + PERSON_ARM_LENGTH / 2,
        PERSON_TORSO_HEIGHT / 2, // Align with torso's center
        0
    );
    rightArm.rotation.z = -Math.PI / 2;
    rightArm.castShadow = true;
    personGroup.add(rightArm);
    
    // Add person to seat group
    seatGroup.add(personGroup);
} 