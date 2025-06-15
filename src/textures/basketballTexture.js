export function createBasketballTexture(size = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
  
    // Background: dark orange radial gradient
    const grad = ctx.createRadialGradient(
      size/2, size/2, size*0.2,
      size/2, size/2, size*0.5
    );
    grad.addColorStop(0, "#e2761b");
    grad.addColorStop(1, "#8b3808");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  
    // Pebble dots (as before)
    ctx.save();
    ctx.globalAlpha = 0.44;
    const dots = Math.floor(size * 22);
    for (let i = 0; i < dots; i++) {
      const x = Math.random() * size * 0.96 + size * 0.02;
      const y = Math.random() * size * 0.96 + size * 0.02;
      const r = Math.random() * (size / 800) + (size / 1100);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#2a1405";
      ctx.fill();
    }
    ctx.restore();
  
    // --- Draw basketball seams ---
    ctx.save();
    ctx.strokeStyle = "#181717";
    ctx.lineWidth = size * 0.025;
    ctx.globalAlpha = 1.0;
    ctx.lineCap = "round";
  
    // Main vertical seam (prime meridian)
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.48, 0, 2*Math.PI);
    ctx.stroke();
  
    // Main horizontal seam (equator)
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.48, Math.PI/2, 3*Math.PI/2, false);
    ctx.stroke();
  
    // Two "C-shaped" seams (like real basketball)
    function drawCShape(cx, cy, r, startAngle, endAngle, flip=false) {
      ctx.beginPath();
      if (!flip)
        ctx.arc(cx, cy, r, startAngle, endAngle, false);
      else
        ctx.arc(cx, cy, r, endAngle, startAngle, true);
      ctx.stroke();
    }
    drawCShape(size/2, size*0.13, size*0.48, Math.PI*0.78, Math.PI*2.22);
    drawCShape(size/2, size*0.87, size*0.48, Math.PI*1.22, Math.PI*2.78);
  
    ctx.restore();
  
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }
  