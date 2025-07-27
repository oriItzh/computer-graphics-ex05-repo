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
  scoreContainer.style.fontSize = '24px';
  scoreContainer.style.fontWeight = 'bold';
  scoreContainer.innerHTML = `
    <div id="score" style="font-size:20px;margin-bottom:6px;">Score: 0</div>
    <div id="attempts" style="font-size:20px;margin-bottom:6px;">Attempts: 0</div>
    <div id="made" style="font-size:20px;margin-bottom:6px;">Shots Made: 0</div>
    <div id="accuracy" style="font-size:20px;margin-bottom:6px;">Accuracy: 0%</div>
    <div id="shot-zone" style="font-size:18px;margin-top:8px;margin-bottom:8px;padding:4px 8px;border-radius:3px;text-align:center;font-weight:bold;">2-Point Zone</div>
    <div id="shot-power-indicator" style="font-size:18px;margin-bottom:4px;">Shot Power: 50%</div>
    <div id="vertical-angle-indicator" style="font-size:18px;margin-bottom:4px;">Vertical Angle: 50°</div>
    <div id="status-message" style="font-size:20px;margin-top:10px;color:#FFD700;font-weight:bold;"></div>
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
    <h3 style="margin: 0 0 12px 0; font-size: 16px;">Controls:</h3>
    <p style="margin: 4px 0; font-size: 14px;">O - Toggle orbit camera</p>
    <p style="margin: 4px 0; font-size: 14px;">1 - Default view</p>
    <p style="margin: 4px 0; font-size: 14px;">2 - Top view</p>
    <p style="margin: 4px 0; font-size: 14px;">3 - Left hoop view</p>
    <p style="margin: 4px 0; font-size: 14px;">4 - Right hoop view</p>
    <p style="margin: 4px 0; font-size: 14px;">L - Toggle main lights</p>
    <p style="margin: 4px 0; font-size: 14px;">K - Toggle court lights</p>
    <p style="margin: 4px 0; font-size: 14px;">Arrow Keys - Move basketball</p>
    <p style="margin: 4px 0; font-size: 14px;">W/S - Adjust shot power</p>
    <p style="margin: 4px 0; font-size: 14px;">Q/E - Adjust vertical angle</p>
    <p style="margin: 4px 0; font-size: 14px;">Spacebar - Shoot</p>
    <p style="margin: 4px 0; font-size: 14px;">R - Reset ball position</p>
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
    <h3 style="margin: 0 0 12px 0; font-size: 16px;">Light Controls:</h3>
    <div style="margin-bottom: 12px">
      <label for="mainLightIntensity" style="display: block; margin-bottom: 6px; font-size: 14px;">Main Light Intensity:</label>
      <input type="range" id="mainLightIntensity" min="0" max="1" step="0.1" value="0.7" style="width: 100%">
      <span id="mainLightValue" style="float: right; font-size: 14px;">0.7</span>
    </div>
    <div>
      <label for="courtLightIntensity" style="display: block; margin-bottom: 6px; font-size: 14px;">Court Light Intensity:</label>
      <input type="range" id="courtLightIntensity" min="0" max="1" step="0.1" value="0.4" style="width: 100%">
      <span id="courtLightValue" style="float: right; font-size: 14px;">0.4</span>
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