export function createBasketball() {
  const ballRadius = 0.12;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0xd35400,
    shininess: 8,
    specular: 0x444444
  });
  
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.set(0, ballRadius + 0.1, 0);
  ball.castShadow = true;
  scene.add(ball);
  
  // Seam material
  const seamThickness = 0.003;
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  // Create the main curved seam that goes around the ball
  function createMainCurvedSeam() {
    const steps = 200;
    const curvePoints = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const theta = t * Math.PI * 2; // Full circle
      
      // Create the characteristic S-curve by varying the latitude
      const latitudeVariation = Math.PI / 4 * Math.sin(2 * theta); // Creates the S-shape
      const phi = latitudeVariation;
      
      const x = ballRadius * Math.cos(phi) * Math.cos(theta);
      const y = ballRadius * Math.sin(phi);
      const z = ballRadius * Math.cos(phi) * Math.sin(theta);
      
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    // Close the curve
    curvePoints.push(curvePoints[0]);
    
    const curvePath = new THREE.CatmullRomCurve3(curvePoints, true);
    const curveGeometry = new THREE.TubeGeometry(curvePath, steps, seamThickness, 8, true);
    return new THREE.Mesh(curveGeometry, seamMat);
  }
  
  // Create the first curved seam
  const seam1 = createMainCurvedSeam();
  ball.add(seam1);
  
  // Create the second curved seam (perpendicular to the first)
  const seam2 = createMainCurvedSeam();
  seam2.rotation.y = Math.PI / 2; // Rotate 90 degrees
  ball.add(seam2);
  
  return ball;
}
