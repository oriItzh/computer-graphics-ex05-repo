// Constants for the peripheral court light
const POLE_HEIGHT = 12; // 12 meters height
const POLE_RADIUS = 0.3; // 0.3 meters radius
const ARM_LENGTH = 3; // Length of the extending arm
const ARM_RADIUS = 0.15; // Radius of the arm
const LAMP_SIZE = 1.2; // Size of the lamp fixture
const LIGHT_INTENSITY = 1.0; // Intensity of the spotlight
const LIGHT_PANEL_RADIUS = 0.15; // Radius of the light panels
const SIDE_LAMP_SIZE = 0.6; // Size of the side lamps
const LAMP_DEPTH = 0.2; // Depth of the lamp face

function createLightPole(poleMaterial, armMaterial, lampMaterial, lightPanelMaterial) {
    const poleGroup = new THREE.Group();
    
    // Create the main pole
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 16),
        poleMaterial
    );
    pole.position.y = POLE_HEIGHT / 2;
    pole.castShadow = true;
    poleGroup.add(pole);
    
    // Create the extending arm
    const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(ARM_RADIUS, ARM_RADIUS, ARM_LENGTH, 8),
        armMaterial
    );
    arm.position.set(ARM_LENGTH / 2, POLE_HEIGHT, 0);
    arm.rotation.z = -Math.PI / 2; // Rotate to extend horizontally
    arm.castShadow = true;
    poleGroup.add(arm);
    
    // Create the main lamp face
    const lampFace = new THREE.Mesh(
        new THREE.BoxGeometry(LAMP_SIZE, LAMP_SIZE, LAMP_DEPTH),
        lampMaterial
    );
    lampFace.position.set(ARM_LENGTH, POLE_HEIGHT, 0);
    lampFace.rotation.z = -Math.PI / 2; // Rotate to align with arm
    lampFace.castShadow = true;
    poleGroup.add(lampFace);

    // Create four white light panels on the main face
    const panelPositions = [
        [-LAMP_SIZE/4, LAMP_SIZE/4, LAMP_DEPTH/2 + 0.01],
        [LAMP_SIZE/4, LAMP_SIZE/4, LAMP_DEPTH/2 + 0.01],
        [-LAMP_SIZE/4, -LAMP_SIZE/4, LAMP_DEPTH/2 + 0.01],
        [LAMP_SIZE/4, -LAMP_SIZE/4, LAMP_DEPTH/2 + 0.01]
    ];

    panelPositions.forEach(pos => {
        const lightPanel = new THREE.Mesh(
            new THREE.CircleGeometry(LIGHT_PANEL_RADIUS, 32),
            lightPanelMaterial
        );
        lightPanel.position.set(...pos);
        lampFace.add(lightPanel);
    });

    // Create two side squares
    const sideLampPositions = [
        [LAMP_SIZE/2 + SIDE_LAMP_SIZE/2, 0, 0],
        [-LAMP_SIZE/2 - SIDE_LAMP_SIZE/2, 0, 0]
    ];

    sideLampPositions.forEach(pos => {
        const sideLamp = new THREE.Mesh(
            new THREE.BoxGeometry(SIDE_LAMP_SIZE, SIDE_LAMP_SIZE, LAMP_DEPTH),
            lampMaterial
        );
        sideLamp.position.set(...pos);
        sideLamp.castShadow = true;
        lampFace.add(sideLamp);

        // Add a light panel to each side square
        const sideLightPanel = new THREE.Mesh(
            new THREE.CircleGeometry(LIGHT_PANEL_RADIUS * 0.7, 32),
            lightPanelMaterial
        );
        sideLightPanel.position.set(
            pos[0] > 0 ? LAMP_DEPTH/2 + 0.01 : -LAMP_DEPTH/2 - 0.01,
            0,
            0
        );
        sideLightPanel.rotation.y = Math.PI/2;
        sideLamp.add(sideLightPanel);
    });

    return poleGroup;
}

export function createPeripheralCourtLight(scene, position = new THREE.Vector3(0, 0, 0)) {
    // Create a group to hold all components
    const lightGroup = new THREE.Group();
    
    // Materials
    const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x606060 });
    const lampMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    const lightPanelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0xffffff, 
        emissiveIntensity: 0.5 
    });
    
    // Create the light pole
    const poleGroup = createLightPole(poleMaterial, armMaterial, lampMaterial, lightPanelMaterial);
    lightGroup.add(poleGroup);
    
    // Create the spotlight
    const spotlight = new THREE.SpotLight(0xffffff, LIGHT_INTENSITY);
    spotlight.position.set(ARM_LENGTH, POLE_HEIGHT, 0);
    spotlight.angle = Math.PI / 6; // 30 degrees
    spotlight.penumbra = 0.3;
    spotlight.decay = 0.8;
    spotlight.distance = 35;
    spotlight.castShadow = true;
    
    // Create a target for the spotlight
    const target = new THREE.Object3D();
    target.position.set(ARM_LENGTH, POLE_HEIGHT - 5, 0); // Point downward
    spotlight.target = target;
    
    lightGroup.add(spotlight);
    lightGroup.add(target);
    
    // Set the position of the entire group
    lightGroup.position.copy(position);
    
    // Add to scene
    scene.add(lightGroup);
    
    return lightGroup; // Return the group so it can be manipulated later
} 