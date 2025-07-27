// Collision detection system - handles rim collisions and scoring detection
import { RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, getRimColliderPositions } from '../basketballHoops.js';

export class CollisionSystem {
  constructor(COURT_LENGTH) {
    this.NUM_RIM_COLLIDERS = 48;
    this.RIM_COLLIDER_RADIUS = 0.015;
    this.BALL_RADIUS = 0.12;
    this.COURT_LENGTH = COURT_LENGTH;
    this.BACKBOARD_THICKNESS = 0.05;
    
    // Initialize rim colliders
    this.rimColliders = getRimColliderPositions(COURT_LENGTH, this.NUM_RIM_COLLIDERS);
  }

  // --- Rim/hoop collision detection using circular plane intersection ---
  isBallThroughHoop(ballPos, prevBallPos, hoopPos) {
    // Define the circular plane at rim height
    const rimY = RIM_HEIGHT_ABOVE_GROUND;
    const rimCenter = new THREE.Vector3(hoopPos.x, rimY, hoopPos.z);
    
    // Check if ball crossed the plane from above to below
    const wasAbove = prevBallPos.y > rimY;
    const isBelow = ballPos.y <= rimY;
    
    if (!wasAbove || !isBelow) {
      return false; // Ball didn't cross the plane from above
    }
    
    // Find the intersection point where the ball trajectory crosses the rim plane
    const trajectory = new THREE.Vector3().subVectors(ballPos, prevBallPos);
    const t = (rimY - prevBallPos.y) / trajectory.y;
    
    // Calculate the exact intersection point on the rim plane
    const intersectionPoint = new THREE.Vector3().addVectors(
      prevBallPos,
      trajectory.multiplyScalar(t)
    );
    
    // Check if the intersection point is within the circular rim
    const distanceFromRimCenter = new THREE.Vector2(
      intersectionPoint.x - rimCenter.x,
      intersectionPoint.z - rimCenter.z
    ).length();
    
    // Ball scores if it passes through the circular opening (accounting for ball radius)
    const effectiveRimRadius = (RIM_RADIUS - this.BALL_RADIUS * 0.8) * 1.5; // Increased by factor of 1.5
    return distanceFromRimCenter <= effectiveRimRadius;
  }

  getActiveRimColliders(ballPos) {
    if (!this.rimColliders) return [];
    return (ballPos.x < 0) ? this.rimColliders.left : this.rimColliders.right;
  }

  getNearestHoop(pos, COURT_LENGTH, BACKBOARD_THICKNESS) {
    // Returns the position of the hoop on the same half-court as the ball
    const leftHoop = new THREE.Vector3(-COURT_LENGTH/2 + BACKBOARD_THICKNESS + RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);
    const rightHoop = new THREE.Vector3(COURT_LENGTH/2 - BACKBOARD_THICKNESS - RIM_RADIUS, RIM_HEIGHT_ABOVE_GROUND, 0);
    return (pos.x < 0) ? leftHoop : rightHoop;
  }

  handleBallRimCollision(ball, velocity, scoringSystem) {
    const colliders = this.getActiveRimColliders(ball.position);
    if (!colliders || colliders.length === 0) return;
    
    // Only check for rim collisions if ball is near rim height (within reasonable range)
    const rimY = RIM_HEIGHT_ABOVE_GROUND;
    const ballDistanceFromRimHeight = Math.abs(ball.position.y - rimY);
    
    // Only detect rim collisions if ball is within 0.2m of rim height (more restrictive)
    if (ballDistanceFromRimHeight > 0.2) {
      return; // Ball is too far from rim level to cause rim collision
    }
    
    // Get horizontal distance to rim center for additional check
    const hoopPos = this.getNearestHoop(ball.position, this.COURT_LENGTH, this.BACKBOARD_THICKNESS);
    const horizontalDistToRim = Math.sqrt(
      Math.pow(ball.position.x - hoopPos.x, 2) + 
      Math.pow(ball.position.z - hoopPos.z, 2)
    );
    
    // Only check rim collisions if ball is close enough horizontally to the rim
    if (horizontalDistToRim > (RIM_RADIUS + this.BALL_RADIUS * 2)) {
      return; // Ball is too far from rim horizontally
    }
    
    for (const c of colliders) {
      const dist = ball.position.distanceTo(c);
      const collisionDistance = this.RIM_COLLIDER_RADIUS + this.BALL_RADIUS * 0.8; // Reduced collision distance
      
      if (dist < collisionDistance) {
        // Mark that rim was touched for swoosh detection
        scoringSystem.setRimTouched();
        
        // Move ball out of collider
        const dir = ball.position.clone().sub(c).normalize();
        ball.position.copy(c.clone().add(dir.multiplyScalar(collisionDistance + 0.01)));
        
        // Calculate reflection
        const vDotN = velocity.dot(dir);
        if (vDotN < 0) {
          // Only reflect if moving toward collider
          velocity.add(dir.multiplyScalar(-2 * vDotN));
          // Apply energy loss and make it more realistic
          velocity.multiplyScalar(0.6); // More energy loss for rim collisions
        }
        
        // Only handle one collision per frame for stability
        break;
      }
    }
    
    // Additional continuous collision detection for fast-moving ball
    if (velocity.length() > 8 && ballDistanceFromRimHeight <= 0.2 && horizontalDistToRim <= (RIM_RADIUS + this.BALL_RADIUS * 2)) {
      const prevPos = ball.position.clone().sub(velocity.clone().multiplyScalar(0.016)); // Approximate previous position
      
      for (const c of colliders) {
        // Check if the ball trajectory intersected with any rim collider
        const lineStart = prevPos;
        const lineEnd = ball.position;
        const lineDir = lineEnd.clone().sub(lineStart).normalize();
        const lineLength = lineStart.distanceTo(lineEnd);
        
        // Find closest point on line to rim collider center
        const toCollider = c.clone().sub(lineStart);
        const projectionLength = Math.max(0, Math.min(lineLength, toCollider.dot(lineDir)));
        const closestPoint = lineStart.clone().add(lineDir.multiplyScalar(projectionLength));
        const distToLine = c.distanceTo(closestPoint);
        
        if (distToLine < (this.RIM_COLLIDER_RADIUS + this.BALL_RADIUS * 0.8)) { // Reduced collision distance
          // Mark that rim was touched for swoosh detection
          scoringSystem.setRimTouched();
          
          // Collision detected along trajectory
          const collisionPoint = closestPoint;
          const dir = collisionPoint.clone().sub(c).normalize();
          
          // Move ball to collision point and reflect
          ball.position.copy(c.clone().add(dir.multiplyScalar(this.RIM_COLLIDER_RADIUS + this.BALL_RADIUS * 0.8 + 0.01)));
          
          const vDotN = velocity.dot(dir);
          if (vDotN < 0) {
            velocity.add(dir.multiplyScalar(-2 * vDotN));
            velocity.multiplyScalar(0.5); // Significant energy loss for trajectory collisions
          }
          break;
        }
      }
    }
  }
}
