// Helper to get a random color close to base
function randomWoodColor(base = [200, 140, 60], variation = 15) {
  return `rgb(${
    base[0] + Math.round((Math.random() - 0.5) * 2 * variation)
  }, ${
    base[1] + Math.round((Math.random() - 0.5) * 2 * variation)
  }, ${
    base[2] + Math.round((Math.random() - 0.5) * 2 * variation)
  })`;
}

/**
 * Creates a procedural parquet floor texture.
 * @param {number} size - Size of the texture (pixels).
 * @param {number} tileSize - Size of each wood "plank" block (pixels).
 * @returns {THREE.Texture}
 */
export function createParquetTexture(size = 4096, tileSize = 2048, plankWidth = tileSize/8) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
  
    // Fill background with a wood base (in case of gaps)
    ctx.fillStyle = "rgb(215, 170, 100)";
    ctx.fillRect(0, 0, size, size);
  
    // Draw horizontal planks offset for classic parquet
    for (let y = 0; y < size; y += plankWidth) {
      const offset = (Math.floor(y / plankWidth) % 2) * (tileSize / 2);
      for (let x = -offset; x < size; x += tileSize) {
        // Slight random color variation for realism
        ctx.fillStyle = randomWoodColor([220, 170, 100], 14);
  
        ctx.fillRect(x, y, tileSize, plankWidth);
  
        // Draw a thin, light groove below each plank
        ctx.strokeStyle = "rgba(148, 125, 78, 0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + plankWidth - 0.5);
        ctx.lineTo(x + tileSize, y + plankWidth - 0.5);
        ctx.stroke();
  
        // Draw a thin, light groove at the end of each plank
        ctx.beginPath();
        ctx.moveTo(x + tileSize - 0.5, y);
        ctx.lineTo(x + tileSize - 0.5, y + plankWidth);
        ctx.stroke();
      }
    }
  
    // Optional: slight vignette
    const gradient = ctx.createRadialGradient(
      size/2, size/2, size*0.1,
      size/2, size/2, size*0.7
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,size,size);
  
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }
  