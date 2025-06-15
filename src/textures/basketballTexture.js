export function createBasketballTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background color
  ctx.fillStyle = "#8b3808";
  ctx.fillRect(0, 0, size, size);

  // Pebble dots
  ctx.save();
  ctx.globalAlpha = 0.44;
  const dots = Math.floor(size * 30);
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * size * 0.98 + size * 0.02;
    const y = Math.random() * size * 0.98 + size * 0.02;
    const r = Math.random() * (size / 800) + (size / 1100);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "#4A1C1C";
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = "black";
  ctx.lineWidth = size * 0.012;

  const cx = size / 2;
  const cy = size / 2;

  // === 1. Longitude seam ===
  // Appears at both left and right sides of texture (maps to same seam on sphere)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, size);
  ctx.stroke();

  // === 2. Latitude seam (horizontal, equator) ===
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(size, cy);
  ctx.stroke();

  // === 3. Elliptical seam ===
  const ellipseMajor = 0.92 * size;
  const ellipseMinor = 0.6 * size;
  const pinchStrength = 0.55;
  const angleOffset = 14 * (Math.PI / 180);
  
  ctx.beginPath();
  const steps = 450;
  for (let i = 0; i <= steps; i++) {
    const t = angleOffset + (i / steps) * (2 * Math.PI - 2 * angleOffset);
    const x = cx + (ellipseMajor / 2) * Math.cos(t);
    const pinch = 1 - pinchStrength * Math.pow(Math.cos(2 * t), 2);
    const y = cy + (ellipseMinor / 2) * Math.sin(t) * pinch;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}
