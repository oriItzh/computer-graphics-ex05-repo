// Scoreboard dimensions
const SCOREBOARD_WIDTH = 4;
const SCOREBOARD_HEIGHT = 2;
const SCOREBOARD_DEPTH = 0.2;
const SCOREBOARD_POLE_HEIGHT = 4; // 4 meters as requested
const SCOREBOARD_POLE_RADIUS = 0.15;

// Bevel dimensions
const BEVEL_WIDTH = 0.1; // Width of the bevel
const BEVEL_HEIGHT_INNER = 0.1; // Inner height of the bevel
const BEVEL_HEIGHT_OUTER = 0.2; // Outer height of the bevel

// Helper function to create a texture from text
function createTextTexture(text, color, fontSize, backgroundColor = 'rgba(0, 0, 0, 0)') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set a larger canvas size for better resolution, then scale down
  canvas.width = 512;
  canvas.height = 256;

  context.font = `Bold ${fontSize}px Arial`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Draw background if specified
  if (backgroundColor !== 'rgba(0, 0, 0, 0)') {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Helper function to draw a single 7-segment digit on a canvas context
// x, y are the top-left coordinates where the digit will be drawn on the context
// digitWidth, digitHeight are the overall dimensions of the single digit
function drawSevenSegmentDigit(context, digit, color, x, y, digitWidth, digitHeight) {
  context.fillStyle = color;

  // Calculate segment dimensions based on overall digit size
  const segmentThickness = digitWidth * 0.15; // Adjusted thickness based on image
  const segmentBevel = segmentThickness * 0.2; // Small bevel for segment ends

  // Helper to draw a segment (a, d, g are horizontal; b, c, e, f are vertical)
  const drawHorizontalSegment = (startX, startY, length, thickness) => {
    context.beginPath();
    context.moveTo(startX + segmentBevel, startY);
    context.lineTo(startX + length - segmentBevel, startY);
    context.lineTo(startX + length, startY + thickness / 2);
    context.lineTo(startX + length - segmentBevel, startY + thickness);
    context.lineTo(startX + segmentBevel, startY + thickness);
    context.lineTo(startX, startY + thickness / 2);
    context.closePath();
    context.fill();
  };

  const drawVerticalSegment = (startX, startY, length, thickness) => {
    context.beginPath();
    context.moveTo(startX, startY + segmentBevel);
    context.lineTo(startX + thickness / 2, startY);
    context.lineTo(startX + thickness, startY + segmentBevel);
    context.lineTo(startX + thickness, startY + length - segmentBevel);
    context.lineTo(startX + thickness / 2, startY + length);
    context.lineTo(startX, startY + length - segmentBevel);
    context.closePath();
    context.fill();
  };

  // Calculate common positions
  const midY = y + digitHeight / 2;
  const midX = x + digitWidth / 2;
  const vSegLength = (digitHeight - 3 * segmentThickness) / 2; // Length for vertical segments

  // Define segments (a-g)
  const segmentsMap = {
    // Top (a)
    a: () => drawHorizontalSegment(x + segmentThickness, y, digitWidth - 2 * segmentThickness, segmentThickness),
    // Top Right (b)
    b: () => drawVerticalSegment(x + digitWidth - segmentThickness, y + segmentThickness, vSegLength, segmentThickness),
    // Bottom Right (c)
    c: () => drawVerticalSegment(x + digitWidth - segmentThickness, y + 2 * segmentThickness + vSegLength, vSegLength, segmentThickness),
    // Bottom (d)
    d: () => drawHorizontalSegment(x + segmentThickness, y + digitHeight - segmentThickness, digitWidth - 2 * segmentThickness, segmentThickness),
    // Bottom Left (e)
    e: () => drawVerticalSegment(x, y + 2 * segmentThickness + vSegLength, vSegLength, segmentThickness),
    // Top Left (f)
    f: () => drawVerticalSegment(x, y + segmentThickness, vSegLength, segmentThickness),
    // Middle (g)
    g: () => drawHorizontalSegment(x + segmentThickness, midY - segmentThickness / 2, digitWidth - 2 * segmentThickness, segmentThickness),

    // Colon dots (dp1, dp2)
    dp1: () => {
        context.beginPath();
        context.arc(midX, y + digitHeight * 0.3, segmentThickness / 2, 0, Math.PI * 2, true);
        context.fill();
    },
    dp2: () => {
        context.beginPath();
        context.arc(midX, y + digitHeight * 0.7, segmentThickness / 2, 0, Math.PI * 2, true);
        context.fill();
    }
  };

  // Mapping of digits to active segments (a-g)
  const digitPatternMap = {
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
    '1': ['b', 'c'],
    '2': ['a', 'b', 'd', 'e', 'g'],
    '3': ['a', 'b', 'c', 'd', 'g'],
    '4': ['b', 'c', 'f', 'g'],
    '5': ['a', 'c', 'd', 'f', 'g'],
    '6': ['a', 'c', 'd', 'e', 'f', 'g'],
    '7': ['a', 'b', 'c'],
    '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    '9': ['a', 'b', 'c', 'd', 'f', 'g'],
    ':': ['dp1', 'dp2']
  };

  const activeSegments = digitPatternMap[digit];

  if (activeSegments) {
    activeSegments.forEach(segmentKey => {
      segmentsMap[segmentKey]();
    });
  }
}

export function drawScoreboards(scene, COURT_LENGTH, COURT_WIDTH) {
  const scoreboardGroup = new THREE.Group();

  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
  const scoreboardMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black for the scoreboard body
  const redDigitMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red for digits
  const greenDigitMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for fouls

  // Create scoreboards for both sides of the court
  for (let side = -1; side <= 1; side += 2) { // -1 for one side, 1 for the other
    const scoreboardZ = (COURT_WIDTH / 2 + 2) * side; // Adjust distance from court as needed

    // Create pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(SCOREBOARD_POLE_RADIUS, SCOREBOARD_POLE_RADIUS, SCOREBOARD_POLE_HEIGHT, 8),
      poleMaterial
    );
    pole.position.set(0, SCOREBOARD_POLE_HEIGHT / 2, scoreboardZ);
    // pole.castShadow = true;
    scoreboardGroup.add(pole);

    // Create scoreboard body
    const scoreboard = new THREE.Mesh(
      new THREE.BoxGeometry(SCOREBOARD_WIDTH, SCOREBOARD_HEIGHT, SCOREBOARD_DEPTH),
      scoreboardMaterial
    );
    scoreboard.position.set(
      0,
      SCOREBOARD_POLE_HEIGHT + SCOREBOARD_HEIGHT / 2,
      scoreboardZ
    );
    // scoreboard.castShadow = true;

    // Make scoreboard face the court
    if (side === 1) {
      scoreboard.rotation.y = Math.PI; // Rotate 180 degrees to face the center for one side
    }

    // Create beveled edges
    const bevelMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 }); // Darker material for bevel

    // Top bevel
    const topBevel = new THREE.Mesh(
      new THREE.BoxGeometry(SCOREBOARD_WIDTH + BEVEL_WIDTH * 2, BEVEL_HEIGHT_OUTER, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    topBevel.position.set(0, SCOREBOARD_HEIGHT / 2 + BEVEL_HEIGHT_OUTER / 2, 0);
    scoreboard.add(topBevel);

    // Bottom bevel
    const bottomBevel = new THREE.Mesh(
      new THREE.BoxGeometry(SCOREBOARD_WIDTH + BEVEL_WIDTH * 2, BEVEL_HEIGHT_OUTER, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    bottomBevel.position.set(0, -SCOREBOARD_HEIGHT / 2 - BEVEL_HEIGHT_OUTER / 2, 0);
    scoreboard.add(bottomBevel);

    // Left bevel
    const leftBevel = new THREE.Mesh(
      new THREE.BoxGeometry(BEVEL_WIDTH, SCOREBOARD_HEIGHT + BEVEL_HEIGHT_OUTER * 2, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    leftBevel.position.set(-SCOREBOARD_WIDTH / 2 - BEVEL_WIDTH / 2, 0, 0);
    scoreboard.add(leftBevel);

    // Right bevel
    const rightBevel = new THREE.Mesh(
      new THREE.BoxGeometry(BEVEL_WIDTH, SCOREBOARD_HEIGHT + BEVEL_HEIGHT_OUTER * 2, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    rightBevel.position.set(SCOREBOARD_WIDTH / 2 + BEVEL_WIDTH / 2, 0, 0);
    scoreboard.add(rightBevel);

    // Inner top bevel
    const innerTopBevel = new THREE.Mesh(
      new THREE.BoxGeometry(SCOREBOARD_WIDTH, BEVEL_HEIGHT_INNER, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    innerTopBevel.position.set(0, SCOREBOARD_HEIGHT / 2 + BEVEL_HEIGHT_OUTER + BEVEL_HEIGHT_INNER / 2, 0);
    scoreboard.add(innerTopBevel);

    // Inner bottom bevel
    const innerBottomBevel = new THREE.Mesh(
      new THREE.BoxGeometry(SCOREBOARD_WIDTH, BEVEL_HEIGHT_INNER, SCOREBOARD_DEPTH),
      bevelMaterial
    );
    innerBottomBevel.position.set(0, -SCOREBOARD_HEIGHT / 2 - BEVEL_HEIGHT_OUTER - BEVEL_HEIGHT_INNER / 2, 0);
    scoreboard.add(innerBottomBevel);

    // Add HOME text
    const homeTextTexture = createTextTexture('HOME', '#ffffff', 80);
    const homeTextMaterial = new THREE.MeshBasicMaterial({ map: homeTextTexture, transparent: true });
    const homeTextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.5),
      homeTextMaterial
    );
    homeTextPlane.position.set(-1.2, 0.5, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(homeTextPlane);

    // Add separator line for HOME score
    const homeSeparator = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.05), // Thin white line
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    homeSeparator.position.set(-1.2, 0.25, SCOREBOARD_DEPTH / 2 + 0.01); // Position between text and score
    scoreboard.add(homeSeparator);

    // Add GUEST text
    const guestTextTexture = createTextTexture('GUEST', '#ffffff', 80);
    const guestTextMaterial = new THREE.MeshBasicMaterial({ map: guestTextTexture, transparent: true });
    const guestTextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.5),
      guestTextMaterial
    );
    guestTextPlane.position.set(1.2, 0.5, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(guestTextPlane);

    // Add separator line for GUEST score
    const guestSeparator = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.05), // Thin white line
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    guestSeparator.position.set(1.2, 0.25, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(guestSeparator);

    // Add PERIOD text
    const periodTextTexture = createTextTexture('PERIOD', '#ffffff', 50);
    const periodTextMaterial = new THREE.MeshBasicMaterial({ map: periodTextTexture, transparent: true });
    const periodTextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.3),
      periodTextMaterial
    );
    periodTextPlane.position.set(0, -0.3, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(periodTextPlane);

    // Add FOULS text (HOME)
    const homeFoulsTextTexture = createTextTexture('FOULS', '#ffffff', 50);
    const homeFoulsTextMaterial = new THREE.MeshBasicMaterial({ map: homeFoulsTextTexture, transparent: true });
    const homeFoulsTextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.3),
      homeFoulsTextMaterial
    );
    homeFoulsTextPlane.position.set(-1.2, -0.8, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(homeFoulsTextPlane);

    // Add FOULS text (GUEST)
    const guestFoulsTextTexture = createTextTexture('FOULS', '#ffffff', 50);
    const guestFoulsTextMaterial = new THREE.MeshBasicMaterial({ map: guestFoulsTextTexture, transparent: true });
    const guestFoulsTextPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.3),
      guestFoulsTextMaterial
    );
    guestFoulsTextPlane.position.set(1.2, -0.8, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(guestFoulsTextPlane);

    // Add time display (red digits)
    const timeCanvas = document.createElement('canvas');
    timeCanvas.width = 1024; // High resolution for digits
    timeCanvas.height = 512;
    const timeContext = timeCanvas.getContext('2d');
    timeContext.clearRect(0, 0, timeCanvas.width, timeCanvas.height);

    const singleTimeDigitWidth = 150;
    const singleTimeDigitHeight = 250;
    const timeDigitSpacing = 30; // Spacing between digits

    let currentXTime = (timeCanvas.width - (singleTimeDigitWidth * 4 + timeDigitSpacing * 3 + 50)) / 2; // Center alignment

    drawSevenSegmentDigit(timeContext, '8', '#ff0000', currentXTime, (timeCanvas.height - singleTimeDigitHeight) / 2, singleTimeDigitWidth, singleTimeDigitHeight);
    currentXTime += singleTimeDigitWidth + timeDigitSpacing;
    drawSevenSegmentDigit(timeContext, '8', '#ff0000', currentXTime, (timeCanvas.height - singleTimeDigitHeight) / 2, singleTimeDigitWidth, singleTimeDigitHeight);
    currentXTime += singleTimeDigitWidth + timeDigitSpacing / 2; // Adjust for colon placement
    drawSevenSegmentDigit(timeContext, ':', '#ff0000', currentXTime, (timeCanvas.height - singleTimeDigitHeight) / 2, 50, singleTimeDigitHeight); // Colon has different width
    currentXTime += 50 + timeDigitSpacing / 2; // Adjust for colon placement
    drawSevenSegmentDigit(timeContext, '8', '#ff0000', currentXTime, (timeCanvas.height - singleTimeDigitHeight) / 2, singleTimeDigitWidth, singleTimeDigitHeight);
    currentXTime += singleTimeDigitWidth + timeDigitSpacing;
    drawSevenSegmentDigit(timeContext, '8', '#ff0000', currentXTime, (timeCanvas.height - singleTimeDigitHeight) / 2, singleTimeDigitWidth, singleTimeDigitHeight);

    const timeTexture = new THREE.CanvasTexture(timeCanvas);
    timeTexture.minFilter = THREE.LinearFilter;
    timeTexture.wrapS = THREE.ClampToEdgeWrapping;
    timeTexture.wrapT = THREE.ClampToEdgeWrapping;

    const timeMaterial = new THREE.MeshBasicMaterial({ map: timeTexture, transparent: true });
    const timeDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.6),
      timeMaterial
    );
    timeDisplay.position.set(0, 0.8, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(timeDisplay);

    // Add home score display (red digits)
    const homeScoreCanvas = document.createElement('canvas');
    homeScoreCanvas.width = 512;
    homeScoreCanvas.height = 512;
    const homeScoreContext = homeScoreCanvas.getContext('2d');
    homeScoreContext.clearRect(0, 0, homeScoreCanvas.width, homeScoreCanvas.height);

    const singleScoreDigitWidth = 180;
    const singleScoreDigitHeight = 300;
    const scoreDigitSpacing = 40;

    let currentXScore = (homeScoreCanvas.width - (singleScoreDigitWidth * 2 + scoreDigitSpacing)) / 2;

    drawSevenSegmentDigit(homeScoreContext, '8', '#ff0000', currentXScore, (homeScoreCanvas.height - singleScoreDigitHeight) / 2, singleScoreDigitWidth, singleScoreDigitHeight);
    currentXScore += singleScoreDigitWidth + scoreDigitSpacing;
    drawSevenSegmentDigit(homeScoreContext, '8', '#ff0000', currentXScore, (homeScoreCanvas.height - singleScoreDigitHeight) / 2, singleScoreDigitWidth, singleScoreDigitHeight);

    const homeScoreTexture = new THREE.CanvasTexture(homeScoreCanvas);
    homeScoreTexture.minFilter = THREE.LinearFilter;
    homeScoreTexture.wrapS = THREE.ClampToEdgeWrapping;
    homeScoreTexture.wrapT = THREE.ClampToEdgeWrapping;

    const homeScoreMaterial = new THREE.MeshBasicMaterial({ map: homeScoreTexture, transparent: true });
    const homeScoreDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      homeScoreMaterial
    );
    homeScoreDisplay.position.set(-1.2, -0.2, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(homeScoreDisplay);

    // Add guest score display (red digits)
    const guestScoreCanvas = document.createElement('canvas');
    guestScoreCanvas.width = 512;
    guestScoreCanvas.height = 512;
    const guestScoreContext = guestScoreCanvas.getContext('2d');
    guestScoreContext.clearRect(0, 0, guestScoreCanvas.width, guestScoreCanvas.height);

    let currentXGuestScore = (guestScoreCanvas.width - (singleScoreDigitWidth * 2 + scoreDigitSpacing)) / 2;

    drawSevenSegmentDigit(guestScoreContext, '8', '#ff0000', currentXGuestScore, (guestScoreCanvas.height - singleScoreDigitHeight) / 2, singleScoreDigitWidth, singleScoreDigitHeight);
    currentXGuestScore += singleScoreDigitWidth + scoreDigitSpacing;
    drawSevenSegmentDigit(guestScoreContext, '8', '#ff0000', currentXGuestScore, (guestScoreCanvas.height - singleScoreDigitHeight) / 2, singleScoreDigitWidth, singleScoreDigitHeight);

    const guestScoreTexture = new THREE.CanvasTexture(guestScoreCanvas);
    guestScoreTexture.minFilter = THREE.LinearFilter;
    guestScoreTexture.wrapS = THREE.ClampToEdgeWrapping;
    guestScoreTexture.wrapT = THREE.ClampToEdgeWrapping;

    const guestScoreMaterial = new THREE.MeshBasicMaterial({ map: guestScoreTexture, transparent: true });
    const guestScoreDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      guestScoreMaterial
    );
    guestScoreDisplay.position.set(1.2, -0.2, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(guestScoreDisplay);

    // Add period display (red digit)
    const periodCanvas = document.createElement('canvas');
    periodCanvas.width = 256; // Smaller canvas for single digit
    periodCanvas.height = 256;
    const periodContext = periodCanvas.getContext('2d');
    periodContext.clearRect(0, 0, periodCanvas.width, periodCanvas.height);

    const singlePeriodDigitWidth = 100;
    const singlePeriodDigitHeight = 180;

    drawSevenSegmentDigit(periodContext, '8', '#ff0000', (periodCanvas.width - singlePeriodDigitWidth) / 2, (periodCanvas.height - singlePeriodDigitHeight) / 2, singlePeriodDigitWidth, singlePeriodDigitHeight);

    const periodTexture = new THREE.CanvasTexture(periodCanvas);
    periodTexture.minFilter = THREE.LinearFilter;
    periodTexture.wrapS = THREE.ClampToEdgeWrapping;
    periodTexture.wrapT = THREE.ClampToEdgeWrapping;

    const periodMaterial = new THREE.MeshBasicMaterial({ map: periodTexture, transparent: true });
    const periodDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      periodMaterial
    );
    periodDisplay.position.set(0, -0.6, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(periodDisplay);

    // Add home fouls display (green digit)
    const homeFoulsCanvas = document.createElement('canvas');
    homeFoulsCanvas.width = 256;
    homeFoulsCanvas.height = 256;
    const homeFoulsContext = homeFoulsCanvas.getContext('2d');
    homeFoulsContext.clearRect(0, 0, homeFoulsCanvas.width, homeFoulsCanvas.height);

    const singleFoulsDigitWidth = 100;
    const singleFoulsDigitHeight = 180;

    drawSevenSegmentDigit(homeFoulsContext, '8', '#00ff00', (homeFoulsCanvas.width - singleFoulsDigitWidth) / 2, (homeFoulsCanvas.height - singleFoulsDigitHeight) / 2, singleFoulsDigitWidth, singleFoulsDigitHeight);

    const homeFoulsTexture = new THREE.CanvasTexture(homeFoulsCanvas);
    homeFoulsTexture.minFilter = THREE.LinearFilter;
    homeFoulsTexture.wrapS = THREE.ClampToEdgeWrapping;
    homeFoulsTexture.wrapT = THREE.ClampToEdgeWrapping;

    const homeFoulsMaterial = new THREE.MeshBasicMaterial({ map: homeFoulsTexture, transparent: true });
    const homeFoulsDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      homeFoulsMaterial
    );
    homeFoulsDisplay.position.set(-1.2, -1.1, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(homeFoulsDisplay);

    // Add guest fouls display (green digit)
    const guestFoulsCanvas = document.createElement('canvas');
    guestFoulsCanvas.width = 256;
    guestFoulsCanvas.height = 256;
    const guestFoulsContext = guestFoulsCanvas.getContext('2d');
    guestFoulsContext.clearRect(0, 0, guestFoulsCanvas.width, guestFoulsCanvas.height);

    drawSevenSegmentDigit(guestFoulsContext, '8', '#00ff00', (guestFoulsCanvas.width - singleFoulsDigitWidth) / 2, (guestFoulsCanvas.height - singleFoulsDigitHeight) / 2, singleFoulsDigitWidth, singleFoulsDigitHeight);

    const guestFoulsTexture = new THREE.CanvasTexture(guestFoulsCanvas);
    guestFoulsTexture.minFilter = THREE.LinearFilter;
    guestFoulsTexture.wrapS = THREE.ClampToEdgeWrapping;
    guestFoulsTexture.wrapT = THREE.ClampToEdgeWrapping;

    const guestFoulsMaterial = new THREE.MeshBasicMaterial({ map: guestFoulsTexture, transparent: true });
    const guestFoulsDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      guestFoulsMaterial
    );
    guestFoulsDisplay.position.set(1.2, -1.1, SCOREBOARD_DEPTH / 2 + 0.01);
    scoreboard.add(guestFoulsDisplay);

    // Add small circular lights around the edge
    const lightDotMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, specular: 0xcccccc, shininess: 30 }); // Metallic look
    const lightDotRadius = 0.03;
    const lightDotGeometry = new THREE.SphereGeometry(lightDotRadius, 16, 16);

    // Top and Bottom rows of lights
    const numHorizontalLights = 25; // More lights for the longer side
    const horizontalSpacing = SCOREBOARD_WIDTH / (numHorizontalLights - 1);
    for (let i = 0; i < numHorizontalLights; i++) {
      const xPos = -SCOREBOARD_WIDTH / 2 + i * horizontalSpacing;

      // Top row
      const topDot = new THREE.Mesh(lightDotGeometry, lightDotMaterial);
      topDot.position.set(xPos, SCOREBOARD_HEIGHT / 2 - lightDotRadius, SCOREBOARD_DEPTH / 2 + 0.01);
      scoreboard.add(topDot);

      // Bottom row
      const bottomDot = new THREE.Mesh(lightDotGeometry, lightDotMaterial);
      bottomDot.position.set(xPos, -SCOREBOARD_HEIGHT / 2 + lightDotRadius, SCOREBOARD_DEPTH / 2 + 0.01);
      scoreboard.add(bottomDot);
    }

    // Left and Right columns of lights (avoiding corners already covered)
    const numVerticalLights = 15; // More lights for the longer side
    const verticalSpacing = SCOREBOARD_HEIGHT / (numVerticalLights - 1);
    for (let i = 1; i < numVerticalLights - 1; i++) { // Start and end one step in to avoid overlap
      const yPos = -SCOREBOARD_HEIGHT / 2 + i * verticalSpacing;

      // Left column
      const leftDot = new THREE.Mesh(lightDotGeometry, lightDotMaterial);
      leftDot.position.set(-SCOREBOARD_WIDTH / 2 + lightDotRadius, yPos, SCOREBOARD_DEPTH / 2 + 0.01);
      scoreboard.add(leftDot);

      // Right column
      const rightDot = new THREE.Mesh(lightDotGeometry, lightDotMaterial);
      rightDot.position.set(SCOREBOARD_WIDTH / 2 - lightDotRadius, yPos, SCOREBOARD_DEPTH / 2 + 0.01);
      scoreboard.add(rightDot);
    }

    scoreboardGroup.add(scoreboard);
  }

  scene.add(scoreboardGroup);
} 