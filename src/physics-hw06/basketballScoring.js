// Basketball scoring and statistics management for HW06
// Handles score tracking, shot attempts, and status messages

import { playScoringSound } from './basketballSounds.js';

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

export function updateShotTypeDisplay(shotType) {
  const shotTypeEl = document.getElementById('shot-type-indicator');
  if (shotTypeEl) {
    shotTypeEl.textContent = `Shot Type: ${shotType}`;
    // Color-code the shot type
    shotTypeEl.style.color = shotType === '3-POINT' ? '#FFD700' : '#87CEEB';
  }
}

export function recordShotMade(scoringState, points = 2) {
  scoringState.score += points;
  scoringState.shotsMade++;
  scoringState.lastShotMade = true;
  scoringState.shotInProgress = true;
  const shotType = points === 3 ? '3-POINT' : '2-POINT';
  setStatusMessage(`${shotType} SHOT MADE!`, '#00FF00');
  updateScoreUI(scoringState);
  
  // Play random crowd cheering sound for 3 seconds
  playScoringSound();
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
