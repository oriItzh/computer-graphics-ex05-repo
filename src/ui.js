export function createUI() {
  const scoreContainer = document.createElement('div');
  scoreContainer.style.position = 'absolute';
  scoreContainer.style.top = '20px';
  scoreContainer.style.left = '50%';
  scoreContainer.style.transform = 'translateX(-50%)';
  scoreContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  scoreContainer.style.color = 'white';
  scoreContainer.style.padding = '10px 20px';
  scoreContainer.style.borderRadius = '5px';
  scoreContainer.style.fontFamily = 'Arial, sans-serif';
  scoreContainer.style.fontSize = '24px';
  scoreContainer.style.fontWeight = 'bold';
  scoreContainer.innerHTML = `<div id="score">Score: 0</div>`;
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
    <p style="margin: 5px 0">Arrow Keys - Move basketball (coming in HW06)</p>
    <p style="margin: 5px 0">W/S - Adjust power (coming in HW06)</p>
    <p style="margin: 5px 0">Spacebar - Shoot (coming in HW06)</p>
    <p style="margin: 5px 0">R - Reset ball position (coming in HW06)</p>
  `;
  document.body.appendChild(controlsContainer);
}