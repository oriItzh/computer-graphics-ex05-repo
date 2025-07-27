// Camera system - handles camera presets and controls
export class CameraSystem {
  constructor(camera, renderer, COURT_LENGTH, COURT_WIDTH) {
    this.camera = camera;
    this.controls = null; // Will be set later
    this.isOrbitEnabled = true;
    
    // Camera preset positions for different views
    this.cameraPresets = {
      default: {
        position: new THREE.Vector3(-(COURT_LENGTH/2 + 4), 15, COURT_WIDTH/2 + 4),
        target: new THREE.Vector3(0, 5, 0)
      },
      top: {
        position: new THREE.Vector3(0, 40, 0),
        target: new THREE.Vector3(0, 0, 0)
      },
      leftHoop: {
        position: new THREE.Vector3(-COURT_LENGTH/2 + 5.79, 3, 0), // Behind free throw line
        target: new THREE.Vector3(-COURT_LENGTH/2, 3, 0) // Looking at the hoop
      },
      rightHoop: {
        position: new THREE.Vector3(COURT_LENGTH/2 - 5.79, 3, 0), // Behind free throw line
        target: new THREE.Vector3(COURT_LENGTH/2, 3, 0) // Looking at the hoop
      }
    };

    // Initial camera setup
    this.camera.position.copy(this.cameraPresets.default.position);
    this.camera.lookAt(this.cameraPresets.default.target);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setControls(controls) {
    this.controls = controls;
  }

  setCameraPreset(presetName) {
    const preset = this.cameraPresets[presetName];
    if (preset && this.controls) {
      this.camera.position.copy(preset.position);
      this.controls.target.copy(preset.target);
      this.controls.update();
    }
  }

  toggleOrbitControls() {
    this.isOrbitEnabled = !this.isOrbitEnabled;
  }

  update() {
    if (this.controls) {
      this.controls.enabled = this.isOrbitEnabled;
      this.controls.update();
    }
  }

  getIsOrbitEnabled() {
    return this.isOrbitEnabled;
  }
}
