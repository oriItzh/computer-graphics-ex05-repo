// Scoring system - handles score tracking, statistics, and visual feedback
export class ScoringSystem {
  constructor() {
    this.score = 0;
    this.attempts = 0;
    this.shotsMade = 0;
    this.lastShotMade = false;
    this.shotInProgress = false;
    this.shotStartPosition = null; // Track where the shot was taken from
    
    // Swoosh and Combo system
    this.consecutiveHits = 0;
    this.rimTouched = false; // Track if ball touched rim during current shot
  }

  startShot(ballPosition) {
    this.shotStartPosition = ballPosition.clone();
    this.attempts++;
    this.lastShotMade = false;
    this.shotInProgress = false;
    this.rimTouched = false; // Reset for new shot
    this.updateScoreUI();
  }

  makeShot(hoopPos, isThreePointShot) {
    // Determine points based on shot distance
    let points = 2; // Default 2 points
    if (this.shotStartPosition && isThreePointShot(this.shotStartPosition, hoopPos)) {
      points = 3; // 3 points for shots beyond the 3-point line
    }
    
    // Increment consecutive hits counter
    this.consecutiveHits++;
    
    // Calculate combo bonus points
    let bonusPoints = 0;
    if (this.consecutiveHits >= 3) {
      bonusPoints = this.consecutiveHits - 2; // 3rd hit = 1 bonus, 4th hit = 2 bonus, etc.
    }
    
    // Check for swoosh (no rim contact)
    const isSwoosh = !this.rimTouched;
    
    // Debug logging for swoosh detection
    console.log('Shot made - rimTouched:', this.rimTouched, 'isSwoosh:', isSwoosh);
    
    this.score += points + bonusPoints;
    this.shotsMade++;
    this.lastShotMade = true;
    this.shotInProgress = true;
    
    // Display appropriate messages
    if (isSwoosh) {
      console.log('Showing swoosh message!');
      this.showSwooshMessage();
    }
    
    if (bonusPoints > 0) {
      this.showComboMessage(this.consecutiveHits, bonusPoints);
      this.setStatusMessage(`${points}+${bonusPoints}-POINT COMBO SHOT MADE!`, '#FFD700');
    } else {
      this.setStatusMessage(`${points}-POINT SHOT MADE!`, '#00FF00');
    }
    
    this.updateScoreUI();
    
    return { isSwoosh, points, bonusPoints };
  }

  missShot() {
    if (!this.shotInProgress) {
      this.lastShotMade = false;
      this.consecutiveHits = 0; // Reset combo streak on miss
      this.setStatusMessage('MISSED SHOT', '#FF3333');
    }
    this.shotInProgress = false;
    setTimeout(() => this.clearStatusMessage(), 1200);
  }

  setRimTouched() {
    if (!this.rimTouched) {
      console.log('Rim collision detected! Setting rimTouched to true');
      this.rimTouched = true;
    }
  }

  updateScoreUI() {
    const scoreEl = document.getElementById('score');
    const attemptsEl = document.getElementById('attempts');
    const madeEl = document.getElementById('made');
    const accuracyEl = document.getElementById('accuracy');
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
    if (attemptsEl) attemptsEl.textContent = `Attempts: ${this.attempts}`;
    if (madeEl) madeEl.textContent = `Shots Made: ${this.shotsMade}`;
    if (accuracyEl) accuracyEl.textContent = `Accuracy: ${this.attempts > 0 ? Math.round((this.shotsMade/this.attempts)*100) : 0}%`;
  }

  setStatusMessage(msg, color = '#FFD700') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = color;
    }
  }

  clearStatusMessage() {
    this.setStatusMessage('');
  }

  showSwooshMessage() {
    // Create a big swoosh message
    const swooshEl = document.createElement('div');
    swooshEl.textContent = 'SWOOOOOSH!';
    swooshEl.style.position = 'fixed';
    swooshEl.style.top = '40%';
    swooshEl.style.left = '50%';
    swooshEl.style.transform = 'translate(-50%, -50%)';
    swooshEl.style.fontSize = '80px';
    swooshEl.style.fontWeight = 'bold';
    swooshEl.style.color = 'white';
    swooshEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    swooshEl.style.fontFamily = 'Arial, sans-serif';
    swooshEl.style.zIndex = '1000';
    swooshEl.style.pointerEvents = 'none';
    swooshEl.style.animation = 'fadeInOut 2s ease-in-out';
    
    // Add CSS animation if not already added
    if (!document.querySelector('#swoosh-animation-style')) {
      const style = document.createElement('style');
      style.id = 'swoosh-animation-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(swooshEl);
    
    // Remove the message after animation
    setTimeout(() => {
      if (swooshEl && swooshEl.parentNode) {
        swooshEl.parentNode.removeChild(swooshEl);
      }
    }, 2000);
  }

  showComboMessage(hits, extraPoints) {
    // Create combo message
    const comboEl = document.createElement('div');
    comboEl.textContent = `COMBO x${hits} +${extraPoints} BONUS!`;
    comboEl.style.position = 'fixed';
    comboEl.style.top = '55%';
    comboEl.style.left = '50%';
    comboEl.style.transform = 'translate(-50%, -50%)';
    comboEl.style.fontSize = '48px';
    comboEl.style.fontWeight = 'bold';
    comboEl.style.color = '#FFD700'; // Golden color
    comboEl.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    comboEl.style.fontFamily = 'Arial, sans-serif';
    comboEl.style.zIndex = '1000';
    comboEl.style.pointerEvents = 'none';
    comboEl.style.whiteSpace = 'nowrap'; // Ensure single line display
    comboEl.style.animation = 'comboAnimation 2.5s ease-in-out';
    
    // Add CSS animation for combo if not already added
    if (!document.querySelector('#combo-animation-style')) {
      const style = document.createElement('style');
      style.id = 'combo-animation-style';
      style.textContent = `
        @keyframes comboAnimation {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          75% { opacity: 1; transform: translate(-50%, -50%) scale(1.05) rotate(-2deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(0deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(comboEl);
    
    // Remove the message after animation
    setTimeout(() => {
      if (comboEl && comboEl.parentNode) {
        comboEl.parentNode.removeChild(comboEl);
      }
    }, 2500);
  }

  reset() {
    this.shotStartPosition = null;
    this.rimTouched = false;
    // Don't reset consecutiveHits here - only reset on miss
    this.clearStatusMessage();
  }
}
