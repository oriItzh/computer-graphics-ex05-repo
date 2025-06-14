const BALL_RADIUS = 0.12;
const BALL_GROUND_OFFSET = 0.1;

export function createBasketball(scene) {
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 64, 64);
  const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xd35400, shininess: 8, specular: 0x444444 });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  ball.castShadow = true;
  scene.add(ball);

  // Seam material
  const seamThickness = 0.003;
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  function createMainCurvedSeam() {
    const steps = 200, curvePoints = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, theta = t * Math.PI * 2;
      const latitudeVariation = Math.PI / 4 * Math.sin(2 * theta);
      const phi = latitudeVariation;
      const x = BALL_RADIUS * Math.cos(phi) * Math.cos(theta);
      const y = BALL_RADIUS * Math.sin(phi);
      const z = BALL_RADIUS * Math.cos(phi) * Math.sin(theta);
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    curvePoints.push(curvePoints[0]);
    const curvePath = new THREE.CatmullRomCurve3(curvePoints, true);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curvePath, steps, seamThickness, 8, true),
      seamMat
    );
  }
  const seam1 = createMainCurvedSeam();
  ball.add(seam1);
  const seam2 = createMainCurvedSeam();
  seam2.rotation.y = Math.PI / 2;
  ball.add(seam2);
  return ball;
}