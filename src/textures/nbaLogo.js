// This is an approximate SVG path for the NBA player silhouette.
// For a perfect replica, use the exact SVG path of the logo.
const NBA_SILHOUETTE_PATH =
  "M220,35 C245,55 255,95 238,120 C235,135 240,180 245,210 C253,270 230,340 180,395 C160,420 145,450 155,480 C180,520 220,545 265,545 C295,545 335,520 360,480 C370,460 375,450 370,440 C355,425 330,420 310,435 C290,450 278,462 275,495 C273,505 265,510 255,505 C235,485 235,455 240,425 C247,400 270,390 285,385 C310,375 325,345 330,310 C338,255 335,205 335,145 C335,110 300,75 265,55 C250,45 230,35 220,35 Z";

export function createNbaLogoTexture(size = 512) {
  const aspect = 1.0 / 2.22; // official aspect ratio ~0.45 (width/height)
  const width = size;
  const height = Math.round(size / aspect);

  // 1. Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 2. Draw background (blue left, red right)
  ctx.fillStyle = '#17408B'; // blue
  ctx.fillRect(0, 0, width / 2, height);
  ctx.fillStyle = '#C9082A'; // red
  ctx.fillRect(width / 2, 0, width / 2, height);

  // 3. Draw the silhouette using SVG path
  ctx.save();
  ctx.translate(width * 0.25, height * 0.05); // Center and scale
  ctx.scale(width * 0.0015, height * 0.0017); // Tune scaling to fit well

  ctx.fillStyle = '#fff';
  const path = new Path2D(NBA_SILHOUETTE_PATH);
  ctx.fill(path);
  ctx.restore();

  // 4. Draw NBA text at the bottom
  ctx.font = `${Math.floor(height * 0.15)}px Arial Black, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('NBA', width / 2, height * 0.93);

  // 5. Create a THREE.js texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}