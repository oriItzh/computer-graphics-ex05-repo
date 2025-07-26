// Basketball sound effects for HW06
// Handles crowd cheering sounds when scoring - plays full length audio clips

// --- Sound Configuration ---
const SOUND_PATHS = [
  'src/sounds/crowd-cheering-rhythmic-cheering.mp3',
  'src/sounds/crowd-cheering1.mp3',
  'src/sounds/crowd-cheering2.mp3',
  'src/sounds/crowd-cheering3.mp3'
];

// --- Sound State ---
let audioElements = [];
let currentlyPlaying = null;

// --- Sound System Initialization ---
export function initializeSoundSystem() {
  // Pre-load all sound files
  audioElements = SOUND_PATHS.map((path, index) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.volume = 0.6; // Set to 60% volume
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => {
      console.log(`Sound ${index + 1}: Loading started - ${path}`);
    });
    
    audio.addEventListener('canplay', () => {
      console.log(`Sound ${index + 1}: Ready to play - ${path}`);
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`Sound ${index + 1}: Can play through - ${path}`);
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`Sound ${index + 1}: Failed to load - ${path}`, e);
      console.error(`Error details:`, e.target.error);
    });
    
    audio.addEventListener('loadeddata', () => {
      console.log(`Sound ${index + 1}: Data loaded - ${path}`);
    });
    
    // Test if the file actually exists by trying to load it
    setTimeout(() => {
      if (audio.readyState === 0) {
        console.warn(`Sound ${index + 1}: Still not ready after timeout - ${path}`);
      }
    }, 2000);
    
    return audio;
  });
  
  console.log('Basketball sound system initialized with', audioElements.length, 'sounds');
  console.log('Sound paths:', SOUND_PATHS);
  
  // Test loading after a short delay
  setTimeout(() => {
    console.log('Sound loading status check:');
    audioElements.forEach((audio, index) => {
      console.log(`Sound ${index + 1}: Ready state = ${audio.readyState}, Network state = ${audio.networkState}`);
    });
  }, 3000);
}

// --- Sound Playback Functions ---
export function playScoringSound() {
  console.log('playScoringSound() called');
  
  // Check if audio elements are loaded
  if (audioElements.length === 0) {
    console.warn('No audio elements loaded!');
    return;
  }
  
  // Stop any currently playing sound
  if (currentlyPlaying) {
    currentlyPlaying.pause();
    currentlyPlaying.currentTime = 0;
  }
  
  // Find a working audio element
  let selectedAudio = null;
  let randomIndex = Math.floor(Math.random() * audioElements.length);
  let attempts = 0;
  
  // Try to find a loaded audio file
  while (attempts < audioElements.length) {
    const testAudio = audioElements[randomIndex];
    if (testAudio.readyState >= 2) { // HAVE_CURRENT_DATA or better
      selectedAudio = testAudio;
      break;
    }
    randomIndex = (randomIndex + 1) % audioElements.length;
    attempts++;
  }
  
  // If no audio is ready, try the first one anyway
  if (!selectedAudio) {
    console.warn('No audio files are ready, trying first one anyway');
    selectedAudio = audioElements[0];
    randomIndex = 0;
  }
  
  console.log(`Attempting to play sound ${randomIndex + 1}/${audioElements.length}`);
  console.log(`Audio ready state: ${selectedAudio.readyState}`);
  console.log(`Audio network state: ${selectedAudio.networkState}`);
  console.log(`Audio volume: ${selectedAudio.volume}`);
  console.log(`Audio src: ${selectedAudio.src}`);
  
  // Play the selected sound
  selectedAudio.currentTime = 0; // Reset to beginning
  
  const playPromise = selectedAudio.play();
  
  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log(`Successfully started playing sound ${randomIndex + 1}`);
      currentlyPlaying = selectedAudio;
      
      // Let the sound play to its full length
      selectedAudio.addEventListener('ended', () => {
        if (currentlyPlaying === selectedAudio) {
          currentlyPlaying = null;
          console.log(`Sound ${randomIndex + 1} finished playing`);
        }
      }, { once: true }); // Remove listener after first use
      
    }).catch(error => {
      console.error('Could not play scoring sound:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if (error.name === 'NotSupportedError') {
        console.error('The audio file format is not supported or the file path is incorrect');
      } else if (error.name === 'NotAllowedError') {
        console.error('Audio playback blocked by browser autoplay policy');
      }
    });
  }
}

// --- Test Functions ---
export function testSound(index = 0) {
  console.log(`Testing sound ${index + 1}`);
  if (audioElements[index]) {
    const audio = audioElements[index];
    audio.currentTime = 0;
    audio.play().then(() => {
      console.log(`Test sound ${index + 1} playing successfully`);
    }).catch(error => {
      console.error(`Test sound ${index + 1} failed:`, error);
    });
  } else {
    console.error(`Sound ${index + 1} not found`);
  }
}

// --- User Interaction Handler ---
let userInteracted = false;

export function enableAudioAfterUserInteraction() {
  if (!userInteracted) {
    // Try to play a silent sound to enable audio context
    audioElements.forEach((audio, index) => {
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.volume = 0.6; // Restore volume
        console.log(`Audio ${index + 1} context enabled`);
      }).catch(() => {
        console.log(`Audio ${index + 1} still requires user interaction`);
      });
    });
    userInteracted = true;
  }
}

// --- Utility Functions ---
export function stopAllSounds() {
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  currentlyPlaying = null;
}

export function setSoundVolume(volume) {
  // Volume should be between 0.0 and 1.0
  const clampedVolume = Math.max(0, Math.min(1, volume));
  audioElements.forEach(audio => {
    audio.volume = clampedVolume;
  });
}
