// Basketball scoring and statistics management for HW06
// Handles score tracking, shot attempts, and status messages

// --- Scoring State ---
export function createScoringState() {
  return {
    score: 0,
    attempts: 0,
    shotsMade: 0,
    lastShotMade: false,
    shotInProgress: false
  };
}

// --- Scoring Functions ---
export function updateScoreUI(scoringState) {
  const { score, attempts, shotsMade } = scoringState;
  const scoreEl = document.getElementById('score');
  const attemptsEl = document.getElementById('attempts');
  const madeEl = document.getElementById('made');
  const accuracyEl = document.getElementById('accuracy');
  
  if (scoreEl) scoreEl.textContent = `Score: ${score}`;
  if (attemptsEl) attemptsEl.textContent = `Attempts: ${attempts}`;
  if (madeEl) madeEl.textContent = `Shots Made: ${shotsMade}`;
  if (accuracyEl) accuracyEl.textContent = `Accuracy: ${attempts > 0 ? Math.round((shotsMade/attempts)*100) : 0}%`;
}

export function setStatusMessage(msg, color = '#FFD700') {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = color;
  }
}

export function clearStatusMessage() {
  setStatusMessage('');
}

export function recordShotMade(scoringState, points = 2) {
  scoringState.score += points;
  scoringState.shotsMade++;
  scoringState.lastShotMade = true;
  scoringState.shotInProgress = true;
  setStatusMessage('SHOT MADE!', '#00FF00');
  updateScoreUI(scoringState);
}

export function recordShotAttempt(scoringState) {
  scoringState.attempts++;
  scoringState.lastShotMade = false;
  scoringState.shotInProgress = false;
  updateScoreUI(scoringState);
  clearStatusMessage();
}

export function recordShotMissed(scoringState) {
  if (!scoringState.shotInProgress) {
    scoringState.lastShotMade = false;
    setStatusMessage('MISSED SHOT', '#FF3333');
  }
  scoringState.shotInProgress = false;
}

export function resetScoring(scoringState) {
  scoringState.score = 0;
  scoringState.attempts = 0;
  scoringState.shotsMade = 0;
  scoringState.lastShotMade = false;
  scoringState.shotInProgress = false;
  updateScoreUI(scoringState);
  clearStatusMessage();
}
