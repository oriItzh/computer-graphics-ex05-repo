// Sound effects system
export class SoundSystem {
  constructor() {
    this.crowdCheeringSounds = [];
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
}
