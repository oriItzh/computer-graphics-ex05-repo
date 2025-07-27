// Sound effects system
export class SoundSystem {
  constructor() {
    this.crowdCheeringSounds = [];
    this.disappointmentSounds = [];
    this.rakReshetSound = null;
    this.rhythmicCheeringSound = null;
    this.soundsLoaded = false;
    this.loadSounds();
  }

  loadSounds() {
    // Load the 3 crowd cheering sounds
    for (let i = 1; i <= 3; i++) {
      const audio = new Audio(`./src/sounds/crowd-cheering${i}.mp3`);
      audio.preload = 'auto';
      audio.volume = 0.5; // Set volume to 50%
      this.crowdCheeringSounds.push(audio);
    }

    // Load disappointment sounds separately
    this.crowdDisappointmentSound = new Audio('./src/sounds/crowd-disappointment.mp3');
    this.crowdDisappointmentSound.preload = 'auto';
    this.crowdDisappointmentSound.volume = 0.4;
    
    this.sadTromboneSound = new Audio('./src/sounds/sad-trombone.mp3');
    this.sadTromboneSound.preload = 'auto';
    this.sadTromboneSound.volume = 0.4;

    // Load rak-reshet sound for swooshes
    this.rakReshetSound = new Audio('./src/sounds/rak-reshet.mp3');
    this.rakReshetSound.preload = 'auto';
    this.rakReshetSound.volume = 0.5; // Same volume as cheering sounds

    // Load rhythmic cheering sound for every 5 straight scores
    this.rhythmicCheeringSound = new Audio('./src/sounds/crowd-cheering-rhythmic-cheering.mp3');
    this.rhythmicCheeringSound.preload = 'auto';
    this.rhythmicCheeringSound.volume = 0.6; // Slightly louder for special occasion

    this.soundsLoaded = true;
  }

  playRandomCheerSound() {
    if (this.soundsLoaded && this.crowdCheeringSounds.length > 0) {
      // Pick a random cheering sound from the 3 available
      const randomIndex = Math.floor(Math.random() * this.crowdCheeringSounds.length);
      const sound = this.crowdCheeringSounds[randomIndex];
      
      // Reset the sound to beginning and play
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.log('Could not play sound:', error);
      });
    }
  }

  playRandomDisappointmentSound(wasComboActive = false) {
    if (!this.soundsLoaded) return;
    
    let sound;
    if (wasComboActive && this.sadTromboneSound) {
      // Play sad trombone for combo miss
      sound = this.sadTromboneSound;
    } else if (this.crowdDisappointmentSound) {
      // Play crowd disappointment for regular miss
      sound = this.crowdDisappointmentSound;
    } else {
      return;
    }
    
    // Reset the sound to beginning and play
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.log('Could not play disappointment sound:', error);
    });
  }

  playRandomSwooshSound() {
    if (!this.soundsLoaded) return;
    
    // 50% chance to play rak-reshet, 50% chance to play regular cheering
    const random = Math.random();
    
    if (random > 0.5 && this.rakReshetSound) {
      // Play rak-reshet sound
      this.rakReshetSound.currentTime = 0;
      this.rakReshetSound.play().catch(error => {
        console.log('Could not play rak-reshet sound:', error);
      });
    } else {
      // Play regular cheering sound
      this.playRandomCheerSound();
    }
  }

  playRhythmicCheeringSound() {
    if (this.soundsLoaded && this.rhythmicCheeringSound) {
      // Play rhythmic cheering for special milestone
      this.rhythmicCheeringSound.currentTime = 0;
      this.rhythmicCheeringSound.play().catch(error => {
        console.log('Could not play rhythmic cheering sound:', error);
      });
    }
  }
}
