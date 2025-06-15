import { createBasketballTexture } from "./textures/basketballTexture.js";
const BALL_RADIUS = 0.12;
const BALL_GROUND_OFFSET = 0.15;

export function createBasketball(scene) {
  const ballGeometry = new THREE.SphereGeometry(BALL_RADIUS, 48, 48);
  const ballMaterial = new THREE.MeshPhongMaterial({
  map: createBasketballTexture(1024),
  shininess: 5,
  specular: 0x222222
  });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, BALL_RADIUS + BALL_GROUND_OFFSET, 0);
  scene.add(ball);
  return ball;

  // Seam material
  // const seamThickness = 0.002;
  // const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // // Latitude seam (equator)
  // function createLatitudeSeam() {
  //   const steps = 200, curvePoints = [];
  //   for (let i = 0; i <= steps; i++) {
  //     const theta = (i / steps) * Math.PI * 2;
  //     curvePoints.push(new THREE.Vector3(
  //       BALL_RADIUS * Math.cos(theta),
  //       0,
  //       BALL_RADIUS * Math.sin(theta)
  //     ));
  //   }
  //   const curvePath = new THREE.CatmullRomCurve3(curvePoints, true);
  //   return new THREE.Mesh(
  //     new THREE.TubeGeometry(curvePath, steps, seamThickness, 8, true),
  //     seamMat
  //   );
  // }

  // // Longitude seam (prime meridian)
  // function createLongitudeSeam() {
  //   const steps = 200, curvePoints = [];
  //   for (let i = 0; i <= steps; i++) {
  //     const phi = (i / steps) * Math.PI * 2;
  //     curvePoints.push(new THREE.Vector3(
  //       0,
  //       BALL_RADIUS * Math.cos(phi),
  //       BALL_RADIUS * Math.sin(phi)
  //     ));
  //   }
  //   const curvePath = new THREE.CatmullRomCurve3(curvePoints, true);
  //   return new THREE.Mesh(
  //     new THREE.TubeGeometry(curvePath, steps, seamThickness, 8, true),
  //     seamMat
  //   );
  // }

  // // Add 4 latitude seams (rotated by 0, 90, 45, -45 degrees)
  // const seamLat0 = createLatitudeSeam();
  // ball.add(seamLat0);

  // const seamLat90 = createLatitudeSeam();
  // seamLat90.rotation.z = Math.PI / 2;
  // ball.add(seamLat90);

  // const seamLat45 = createLatitudeSeam();
  // seamLat45.rotation.z = Math.PI / 4;
  // ball.add(seamLat45);

  // const seamLat_45 = createLatitudeSeam();
  // seamLat_45.rotation.z = -Math.PI / 4;
  // ball.add(seamLat_45);

  // // Add 4 longitude seams (rotated by 0, 90, 45, -45 degrees)
  // const seamLong0 = createLongitudeSeam();
  // ball.add(seamLong0);

  // const seamLong90 = createLongitudeSeam();
  // seamLong90.rotation.x = Math.PI / 2;
  // ball.add(seamLong90);

  // const seamLong45 = createLongitudeSeam();
  // seamLong45.rotation.x = Math.PI / 4;
  // ball.add(seamLong45);

  // const seamLong_45 = createLongitudeSeam();
  // seamLong_45.rotation.x = -Math.PI / 4;
  // ball.add(seamLong_45);

  // return ball;
}