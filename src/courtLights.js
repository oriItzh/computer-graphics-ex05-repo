// Court lighting constants
const LIGHT_POLE_HEIGHT = 8; // Height of the lighting poles
const LIGHT_POLE_RADIUS = 0.15; // Radius of the lighting poles
const LIGHT_POLE_DISTANCE = 3; // Distance from court lines
const LIGHT_INTENSITY = 0.8; // Intensity of the spotlights

// Lamp dimensions
const LAMP_WIDTH = 1.5;
const LAMP_HEIGHT = 0.5;
const LAMP_DEPTH = 0.4;
const LIGHT_PANEL_RADIUS = 0.15;
const LIGHT_PANEL_SPACING = 0.4; // Space between light panels

export function createCourtLighting(scene, COURT_LENGTH, COURT_WIDTH) {
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
  const lampMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
  const lightPanelMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const lightPoleGroup = new THREE.Group();
  const LIGHT_POLE_SPACING = COURT_LENGTH / 3; // Space between poles evenly

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
