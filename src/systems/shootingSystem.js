// Shooting system - handles shot power, angles, and trajectory visualization
export class ShootingSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Shot power state
    this.shotPower = 50; // percent, 0-100
    this.SHOT_POWER_STEP = 2; // percent per key press
    this.SHOT_POWER_MIN = 0;
    this.SHOT_POWER_MAX = 100;

    // Shot angle controls
    this.verticalAngle = 50; // degrees, 0-180 (launch angle)
    this.ANGLE_STEP = 5; // degrees per key press
    this.VERTICAL_ANGLE_MIN = 0;
    this.VERTICAL_ANGLE_MAX = 180;

    // Trajectory visualization
    this.trajectoryLine = null;
  }

  adjustShotPower(increase) {
    if (increase) {
      this.shotPower = this.clampShotPower(this.shotPower + this.SHOT_POWER_STEP);
    } else {
      this.shotPower = this.clampShotPower(this.shotPower - this.SHOT_POWER_STEP);
    }
    this.updateShotPowerDisplay();
  }

  adjustVerticalAngle(increase) {
    if (increase) {
      this.verticalAngle = this.clampVerticalAngle(this.verticalAngle + this.ANGLE_STEP);
    } else {
      this.verticalAngle = this.clampVerticalAngle(this.verticalAngle - this.ANGLE_STEP);
    }
    this.updateAngleDisplays();
  }

  clampShotPower(val) {
    return Math.max(this.SHOT_POWER_MIN, Math.min(this.SHOT_POWER_MAX, val));
  }

  clampVerticalAngle(val) {
    return Math.max(this.VERTICAL_ANGLE_MIN, Math.min(this.VERTICAL_ANGLE_MAX, val));
  }

  updateShotPowerDisplay() {
    const el = document.getElementById('shot-power-indicator');
    if (el) el.textContent = `Shot Power: ${this.shotPower}%`;
  }

  updateAngleDisplays() {
    const vertEl = document.getElementById('vertical-angle-indicator');
    if (vertEl) vertEl.textContent = `Vertical Angle: ${this.verticalAngle}°`;
  }

  showTrajectory(ballPos, targetHoop, physicsSystem) {
    // Remove old trajectory if exists
    this.hideTrajectory();
    
    // Calculate initial velocity using current angles with auto-aiming
    const v0 = physicsSystem.getShotInitialVelocity(ballPos, targetHoop, this.shotPower, this.verticalAngle);
    const points = [];
    const N = 60; // number of points
    
    for (let i = 0; i < N; ++i) {
      const t = i * 0.05;
      // Parabolic motion: x = x0 + vx*t, y = y0 + vy*t + 0.5*gt^2, z = z0 + vz*t
      const x = ballPos.x + v0.x * t;
      const y = ballPos.y + v0.y * t + 0.5 * physicsSystem.GRAVITY * t * t;
      const z = ballPos.z + v0.z * t;
      points.push(new THREE.Vector3(x, y, z));
      // Stop if below ground
      if (y < physicsSystem.BALL_RADIUS + physicsSystem.BALL_GROUND_OFFSET) break;
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ 
      color: 0xff0000, 
      linewidth: 4,
      dashSize: 0.3,
      gapSize: 0.1
    });
    this.trajectoryLine = new THREE.Line(geometry, material);
    this.trajectoryLine.computeLineDistances(); // Required for dashed lines
    this.scene.add(this.trajectoryLine);
  }

  hideTrajectory() {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      this.trajectoryLine.material.dispose();
      this.trajectoryLine = null;
    }
  }

  reset() {
    this.shotPower = 50;
    this.verticalAngle = 50;
    this.updateShotPowerDisplay();
    this.updateAngleDisplays();
    this.hideTrajectory();
  }

  getShotPower() {
    return this.shotPower;
  }

  getVerticalAngle() {
    return this.verticalAngle;
  }
}
