export function createUI() {
  const scoreContainer = document.createElement('div');
  scoreContainer.style.position = 'absolute';
  scoreContainer.style.top = '20px';
  scoreContainer.style.right = '20px';
  scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  scoreContainer.style.color = 'white';
  scoreContainer.style.padding = '10px 20px';
  scoreContainer.style.borderRadius = '5px';
  scoreContainer.style.fontFamily = 'Arial, sans-serif';
  scoreContainer.style.fontSize = '18px';
  scoreContainer.style.fontWeight = 'bold';
  scoreContainer.innerHTML = `
    <div id="score">Score: 0</div>
    <div id="attempts">Attempts: 0</div>
    <div id="made">Shots Made: 0</div>
    <div id="accuracy">Accuracy: 0%</div>
    <div id="shot-type-indicator" style="margin-top:8px;color:#FFD700;">Shot Type: 2-POINT</div>
    <div id="shot-power-indicator" style="margin-top:6px;">Shot Power: 50%</div>
    <div id="vertical-angle-indicator" style="margin-top:6px;">Vertical Angle: 50°</div>
    <div id="status-message" style="margin-top:10px;color:#FFD700;"></div>
  `;
  document.body.appendChild(scoreContainer);

  const controlsContainer = document.createElement('div');
  controlsContainer.style.position = 'absolute';
  controlsContainer.style.bottom = '20px';
  controlsContainer.style.left = '20px';
  controlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  controlsContainer.style.color = 'white';
  controlsContainer.style.padding = '15px';
  controlsContainer.style.borderRadius = '5px';
  controlsContainer.style.fontFamily = 'Arial, sans-serif';
  controlsContainer.style.fontSize = '16px';
  controlsContainer.innerHTML = `
    <h3 style="margin: 0 0 10px 0">Controls:</h3>
    <p style="margin: 5px 0">O - Toggle orbit camera</p>
    <p style="margin: 5px 0">1 - Default view</p>
    <p style="margin: 5px 0">2 - Top view</p>
    <p style="margin: 5px 0">3 - Left hoop view</p>
    <p style="margin: 5px 0">4 - Right hoop view</p>
    <p style="margin: 5px 0">L - Toggle main lights</p>
    <p style="margin: 5px 0">K - Toggle court lights</p>
    <p style="margin: 5px 0">Arrow Keys - Move basketball</p>
    <p style="margin: 5px 0">W/S - Adjust shot power</p>
    <p style="margin: 5px 0">Q/E - Adjust vertical angle</p>
    <p style="margin: 5px 0; color: #FFD700">Auto-aim at nearest hoop</p>
    <p style="margin: 5px 0">Spacebar - Shoot</p>
    <p style="margin: 5px 0">R - Reset ball position</p>
  `;
  document.body.appendChild(controlsContainer);

  // Add light intensity controls
  const lightControlsContainer = document.createElement('div');
  lightControlsContainer.style.position = 'absolute';
  lightControlsContainer.style.bottom = '20px';
  lightControlsContainer.style.right = '20px';
  lightControlsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  lightControlsContainer.style.color = 'white';
  lightControlsContainer.style.padding = '15px';
  lightControlsContainer.style.borderRadius = '5px';
  lightControlsContainer.style.fontFamily = 'Arial, sans-serif';
  lightControlsContainer.style.fontSize = '14px';
  lightControlsContainer.style.width = '200px';
  lightControlsContainer.innerHTML = `
    <h3 style="margin: 0 0 10px 0">Light Controls:</h3>
    <div style="margin-bottom: 10px">
      <label for="mainLightIntensity" style="display: block; margin-bottom: 5px">Main Light Intensity:</label>
      <input type="range" id="mainLightIntensity" min="0" max="1" step="0.1" value="0.7" style="width: 100%">
      <span id="mainLightValue" style="float: right">0.7</span>
    </div>
    <div>
      <label for="courtLightIntensity" style="display: block; margin-bottom: 5px">Court Light Intensity:</label>
      <input type="range" id="courtLightIntensity" min="0" max="1" step="0.1" value="0.4" style="width: 100%">
      <span id="courtLightValue" style="float: right">0.4</span>
    </div>
  `;
  document.body.appendChild(lightControlsContainer);

  // Add event listeners for the sliders
  const mainLightSlider = document.getElementById('mainLightIntensity');
  const courtLightSlider = document.getElementById('courtLightIntensity');
  const mainLightValue = document.getElementById('mainLightValue');
  const courtLightValue = document.getElementById('courtLightValue');

  // Store the elements in the window object so they can be accessed from hw5.js
  window.lightControls = {
    mainLightSlider,
    courtLightSlider,
    mainLightValue,
    courtLightValue
  };
}