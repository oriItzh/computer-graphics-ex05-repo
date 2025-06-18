import { createBasketballTexture } from "./textures/basketballTexture.js";

// Basketball dimensions
const BALL_RADIUS = 0.12; // Standard basketball radius in meters
const BALL_GROUND_OFFSET = 0.15; // Height above ground in meters

export function createBasketball(scene) {
  // Create static basketball mesh with high-quality texture
  // Note: The ball remains static as per requirements - no physics or movement
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 48, 48);
  const ballMaterial = new THREE.MeshPhongMaterial({
    map: createBasketballTexture(1024),
    shininess: 5,
    specular: 0x222222
  });
  
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  ball.castShadow = true;
  ball.receiveShadow = true;
  scene.add(ball);
  return ball;
}