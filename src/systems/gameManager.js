// Game state management - coordinates all systems and handles game logic
import { isThreePointShot } from '../basketballCourt.js';

export class GameManager {
  constructor(scene, basketball, COURT_LENGTH, COURT_WIDTH) {
    this.scene = scene;
    this.basketball = basketball;
    this.COURT_LENGTH = COURT_LENGTH;
    this.COURT_WIDTH = COURT_WIDTH;
    this.BACKBOARD_THICKNESS = 0.05; // Should be imported from basketballHoops.js
    
    this.prevBallPos = basketball.position.clone();
    this.lastTime = performance.now();
  }

  initializeSystems(physicsSystem, shootingSystem, scoringSystem, collisionSystem, soundSystem, cameraSystem) {
    this.physicsSystem = physicsSystem;
    this.shootingSystem = shootingSystem;
    this.scoringSystem = scoringSystem;
    this.collisionSystem = collisionSystem;
    this.soundSystem = soundSystem;
    this.cameraSystem = cameraSystem;
  }

  updateShotZoneDisplay() {
    const shotZoneEl = document.getElementById('shot-zone');
    if (shotZoneEl && !this.physicsSystem.isInFlight()) {
      const targetHoop = this.collisionSystem.getNearestHoop(this.basketball.position, this.COURT_LENGTH, this.BACKBOARD_THICKNESS);
      const isThreePoint = isThreePointShot(this.basketball.position, targetHoop);
      
      // Debug logging
      console.log('Ball position:', this.basketball.position);
      console.log('Target hoop:', targetHoop);
      console.log('Distance to hoop:', this.basketball.position.distanceTo(new THREE.Vector3(targetHoop.x, this.basketball.position.y, targetHoop.z)));
      console.log('Is three point:', isThreePoint);
      
      if (isThreePoint) {
        shotZoneEl.textContent = "3-Point Zone";
        shotZoneEl.style.backgroundColor = "#FF6B35";
        shotZoneEl.style.color = "#FFFFFF";
      } else {
        shotZoneEl.textContent = "2-Point Zone";
        shotZoneEl.style.backgroundColor = "#4CAF50";
        shotZoneEl.style.color = "#FFFFFF";
      }
    }
  }

  resetBall() {
    this.basketball.position.set(0, this.physicsSystem.BALL_RADIUS + this.physicsSystem.BALL_GROUND_OFFSET, 0);
    this.physicsSystem.reset();
    this.shootingSystem.reset();
    this.scoringSystem.reset();
  }

  shoot() {
    if (!this.physicsSystem.isInFlight()) {
      this.scoringSystem.startShot(this.basketball.position);
      const targetHoop = this.collisionSystem.getNearestHoop(this.basketball.position, this.COURT_LENGTH, this.BACKBOARD_THICKNESS);
      this.physicsSystem.shoot(this.basketball.position, targetHoop, this.shootingSystem.getShotPower(), this.shootingSystem.getVerticalAngle());
      this.shootingSystem.hideTrajectory();
    }
  }

  update(moveState, boundaries, delta) {
    this.cameraSystem.update();

    if (this.physicsSystem.isInFlight()) {
      // Handle ball physics
      const physicsResult = this.physicsSystem.updatePhysics(this.basketball, delta, boundaries);
      const ballLanded = physicsResult.ballLanded;
      const firstGroundContact = physicsResult.firstGroundContact;
      
      // Check for scoring
      const hoopPos = this.collisionSystem.getNearestHoop(this.basketball.position, this.COURT_LENGTH, this.BACKBOARD_THICKNESS);
      if (!this.scoringSystem.shotInProgress && this.collisionSystem.isBallThroughHoop(this.basketball.position, this.prevBallPos, hoopPos)) {
        const shotResult = this.scoringSystem.makeShot(hoopPos, isThreePointShot);
        
        // Play appropriate sound based on milestone and swoosh status
        if (shotResult.isRhythmicMilestone) {
          this.soundSystem.playRhythmicCheeringSound(); // Every 5 straight scores
        } else if (shotResult.isSwoosh) {
          this.soundSystem.playRandomSwooshSound(); // 50% chance for rak-reshet, 50% for regular cheer
        } else {
          this.soundSystem.playRandomCheerSound(); // Regular cheering for non-swoosh shots
        }
      }
      
      // Handle rim collisions
      this.collisionSystem.handleBallRimCollision(this.basketball, this.physicsSystem.getVelocity(), this.scoringSystem);
      
      // Play disappointment sound on first ground contact (if not scored)
      if (firstGroundContact && !this.scoringSystem.lastShotMade) {
        // Check if combo was active to determine which disappointment sound to play
        const wasComboActive = this.scoringSystem.consecutiveHits >= 3;
        this.soundSystem.playRandomDisappointmentSound(wasComboActive);
      }
      
      // Check if ball landed
      if (ballLanded) {
        // Only process miss if the shot wasn't already made
        if (!this.scoringSystem.lastShotMade) {
          const missResult = this.scoringSystem.missShot();
          // Note: disappointment sound already played on first ground contact
        } else {
          // Shot was made, just reset the shot progress
          this.scoringSystem.shotInProgress = false;
        }
      }
      
      this.prevBallPos.copy(this.basketball.position);
    } else {
      // Handle ground movement - this should use the existing basketball movement system
      // Basketball movement logic would be handled here
      
      // Show trajectory preview
      const targetHoop = this.collisionSystem.getNearestHoop(this.basketball.position, this.COURT_LENGTH, this.BACKBOARD_THICKNESS);
      this.shootingSystem.showTrajectory(this.basketball.position, targetHoop, this.physicsSystem);
    }

    // Update UI displays
    this.shootingSystem.updateShotPowerDisplay();
    this.shootingSystem.updateAngleDisplays();
    this.scoringSystem.updateScoreUI();
    this.updateShotZoneDisplay();
  }
}
