// Ball physics system - handles velocity, gravity, collisions, and rotation
export class BallPhysicsSystem {
  constructor() {
    this.ballVelocity = new THREE.Vector3(0, 0, 0);
    this.inFlight = false;
    this.ballRotationAxis = new THREE.Vector3(1, 0, 0);
    this.ballRotationSpeed = 0;
    this.firstGroundContact = false; // Track first ground contact after shot
    
    // Physics constants
    this.GRAVITY = -9.8; // m/s^2
    this.BOUNCE_RESTITUTION = 0.65; // energy loss on bounce
    this.BALL_RADIUS = 0.12; // must match basketball.js
    this.BALL_GROUND_OFFSET = 0.15; // must match basketball.js
  }

  updateBallRotation(velocity, delta, basketball) {
    // Only rotate if moving
    const speed = velocity.length();
    if (speed > 0.01) {
      // Axis is perpendicular to velocity (in XZ plane for rolling, in 3D for flight)
      const axis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();
      this.ballRotationAxis.copy(axis);
      this.ballRotationSpeed = speed / this.BALL_RADIUS; // radians/sec
      basketball.rotateOnAxis(this.ballRotationAxis, this.ballRotationSpeed * delta);
    }
  }

  updatePhysics(basketball, delta, boundaries) {
    if (!this.inFlight) return false;

    // Apply gravity
    this.ballVelocity.y += this.GRAVITY * delta;
    
    // Update position
    basketball.position.x += this.ballVelocity.x * delta;
    basketball.position.y += this.ballVelocity.y * delta;
    basketball.position.z += this.ballVelocity.z * delta;
    
    // Update ball rotation
    this.updateBallRotation(this.ballVelocity, delta, basketball);
    
    // Ground collision
    const groundY = this.BALL_RADIUS + this.BALL_GROUND_OFFSET;
    let firstGroundContactThisFrame = false;
    
    if (basketball.position.y <= groundY) {
      // Check if this is the first ground contact
      if (!this.firstGroundContact) {
        this.firstGroundContact = true;
        firstGroundContactThisFrame = true;
      }
      
      basketball.position.y = groundY;
      if (Math.abs(this.ballVelocity.y) > 0.5) { // Only bounce if moving fast enough
        this.ballVelocity.y = -this.ballVelocity.y * this.BOUNCE_RESTITUTION;
        // Apply friction to horizontal velocity
        this.ballVelocity.x *= 0.85;
        this.ballVelocity.z *= 0.85;
      } else {
        // Ball comes to rest
        this.ballVelocity.set(0, 0, 0);
        this.inFlight = false;
        return { ballLanded: true, firstGroundContact: firstGroundContactThisFrame }; // Signal that ball has landed
      }
    }
    
    // Clamp to court boundaries
    basketball.position.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, basketball.position.x));
    basketball.position.z = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, basketball.position.z));
    
    return { ballLanded: false, firstGroundContact: firstGroundContactThisFrame }; // Ball still in flight
  }

  shoot(ballPos, targetHoop, powerPercent, vertAngle) {
    this.ballVelocity = this.getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle);
    this.inFlight = true;
    this.firstGroundContact = false; // Reset ground contact tracking for new shot
  }

  getShotInitialVelocity(ballPos, targetHoop, powerPercent, vertAngle) {
    // Calculate initial velocity vector with automatic aiming at the hoop
    const vertAngleRad = vertAngle * Math.PI / 180;
    
    // Calculate horizontal angle to aim at the target hoop
    const dx = targetHoop.x - ballPos.x;
    const dz = targetHoop.z - ballPos.z;
    const horizAngleRad = Math.atan2(dz, dx); // Automatically aim at hoop
    
    // Power scales the initial speed
    const minSpeed = 6.5; // m/s (tunable)
    const maxSpeed = 13.0; // m/s (tunable)
    const speed = minSpeed + (maxSpeed - minSpeed) * (powerPercent / 100);
    
    // Calculate velocity components based on angles
    const vx = speed * Math.cos(vertAngleRad) * Math.cos(horizAngleRad);
    const vy = speed * Math.sin(vertAngleRad);
    const vz = speed * Math.cos(vertAngleRad) * Math.sin(horizAngleRad);
    
    return new THREE.Vector3(vx, vy, vz);
  }

  reset() {
    this.ballVelocity.set(0, 0, 0);
    this.inFlight = false;
  }

  isInFlight() {
    return this.inFlight;
  }

  getVelocity() {
    return this.ballVelocity;
  }
}
