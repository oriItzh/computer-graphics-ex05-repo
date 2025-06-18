# Basketball Court 3D Scene

## Group Members
- Ori Itzhaki
- Tomer Cohen

A detailed 3D basketball court scene built with Three.js, featuring realistic lighting, camera controls, and interactive elements.

## Features

- **Realistic Court**: NBA-standard dimensions (94 feet × 50 feet) with detailed parquet flooring
- **Dynamic Lighting System**:
  - Adjustable main court lighting
  - Controllable court-side spotlights
  - Realistic shadows and ambient lighting
- **Multiple Camera Views**:
  - Default view
  - Top-down view
  - Left hoop view
  - Right hoop view
  - Orbit controls for free camera movement
- **Interactive Elements**:
  - Light intensity controls
  - Camera preset switching
  - Light toggling
- **Detailed Components**:
  - Basketball hoops with backboards
  - Court lighting fixtures
  - Stadium seating
  - Scoreboards

## Controls

### Camera Controls
- **O**: Toggle orbit camera controls
- **1**: Default view
- **2**: Top view
- **3**: Left hoop view
- **4**: Right hoop view
- **Mouse**: 
  - Left click + drag: Rotate camera
  - Right click + drag: Pan camera
  - Scroll: Zoom in/out

### Lighting Controls
- **L**: Toggle main court lights
- **K**: Toggle court-side spotlights
- **UI Sliders**: Adjust light intensities
  - Main light intensity (0.0 - 1.0)
  - Court light intensity (0.0 - 1.0)

## Technical Details

### Scene Components
- **Court**: Built to NBA specifications with realistic parquet flooring
- **Lighting**: 
  - Directional light for main court illumination
  - Ambient light for overall scene brightness
  - Spotlights for court-side lighting
- **Camera**: Perspective camera with multiple preset views
- **Controls**: Custom implementation of OrbitControls



## Project Structure

```
src/
├── hw5.js              # Main scene setup and controls
├── basketball.js       # Basketball mesh creation
├── basketballCourt.js  # Court floor and markings
├── basketballHoops.js  # Hoop and backboard creation
├── courtLights.js      # Court lighting system
├── seats.js           # Stadium seating
├── scoreboard.js      # Scoreboard creation
├── ui.js              # User interface elements
└── textures/          # Texture generation utilities
```

## Future Enhancements (HW 6)

- Basketball physics and shooting mechanics
- Player models and animations
- More interactive elements

### Dependencies
- Three.js
- Custom implementations of:
  - OrbitControls
  - Basketball texture generation
  - Court lighting system
  
## Setup and Running

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:8000`

