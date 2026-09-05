import { Direction } from '../types';

/**
 * Character renderer for the Gorillaz chibi sprite sheet:
 * - 4x4 Sprite Sheet Grid:
 *   Row 0: Down (Facing forward, walking frames 0-3)
 *   Row 1: Up (Facing away, walking frames 0-3)
 *   Row 2: Left (Facing left, walking frames 0-3)
 *   Row 3: Right (Facing right, walking frames 0-3)
 * 
 * Features:
 * - Real-time alpha masking for clean transparent game-world integration
 * - Smooth 4-frame walk cycles + breathing idle state
 * - Ground contact shadow & lean physics
 * - High-precision fallback procedural renderer
 */

export class CharacterSprite {
  private static spriteCanvas: HTMLCanvasElement | null = null;
  private static isLoaded: boolean = false;
  private static isProcessing: boolean = false;
  private static loadAttempted: boolean = false;

  private static initSprite() {
    if (this.loadAttempted || typeof window === 'undefined') return;
    this.loadAttempted = true;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.naturalWidth || img.width;
        offCanvas.height = img.naturalHeight || img.height;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        if (!offCtx) return;

        offCtx.drawImage(img, 0, 0);
        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imgData.data;

        const w = offCanvas.width;
        const h = offCanvas.height;
        const cols = 4;
        const rows = 4;
        const cw = Math.floor(w / cols);
        const ch = Math.floor(h / rows);

        // Flood fill to mark ONLY the extreme exterior corners outside the sprite frames
        // This ensures the character's white dress / tunic and sneakers remain 100% solid, crisp, and opaque!
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        // Strict background check: only outer border whitespace is marked as background
        const isBgCandidate = (px: number, py: number): boolean => {
          if (px < 0 || px >= w || py < 0 || py >= h) return false;
          const idx = (py * w + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          return r > 235 && g > 235 && b > 235;
        };

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const minX = c * cw;
            const maxX = (c + 1) * cw - 1;
            const minY = r * ch;
            const maxY = (r + 1) * ch - 1;

            // Only seed from the outer 2-pixel margin of each frame cell
            const seeds: [number, number][] = [
              [minX + 1, minY + 1],
              [maxX - 1, minY + 1],
              [minX + 1, maxY - 1],
              [maxX - 1, maxY - 1],
              [Math.floor((minX + maxX) / 2), minY + 1],
              [minX + 1, Math.floor((minY + maxY) / 2)],
              [maxX - 1, Math.floor((minY + maxY) / 2)],
              [Math.floor((minX + maxX) / 2), maxY - 1]
            ];

            for (const [sx, sy] of seeds) {
              const pos = sy * w + sx;
              if (isBgCandidate(sx, sy) && !visited[pos]) {
                visited[pos] = 1;
                queue.push(pos);
              }
            }
          }
        }

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);

          const neighbors: [number, number][] = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1]
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const npos = ny * w + nx;
              if (!visited[npos] && isBgCandidate(nx, ny)) {
                visited[npos] = 1;
                queue.push(npos);
              }
            }
          }
        }

        // Apply alpha channel: exterior background and outer frame borders become transparent,
        // while character body, skin, hair, and white dress stay 100% solid opaque.
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pos = y * w + x;
            const idx = pos * 4;
            if (visited[pos] || x < 2 || x >= w - 2 || y < 2 || y >= h - 2) {
              data[idx + 3] = 0;
            } else {
              data[idx + 3] = 255;
              // If within character area and light, ensure it is opaque solid white
              if (data[idx] > 200 && data[idx + 1] > 200 && data[idx + 2] > 200) {
                data[idx] = 255;
                data[idx + 1] = 255;
                data[idx + 2] = 255;
                data[idx + 3] = 255;
              }
            }
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        // Convert into authentic retro pixel-art grid (24x24 pixels per cell)
        const cellPixelRes = 24;
        const pixelCanvas = document.createElement('canvas');
        pixelCanvas.width = cols * cellPixelRes;
        pixelCanvas.height = rows * cellPixelRes;
        const pixCtx = pixelCanvas.getContext('2d', { willReadFrequently: true });

        if (pixCtx) {
          pixCtx.imageSmoothingEnabled = false;
          const pixW = pixelCanvas.width;
          const pixH = pixelCanvas.height;
          const pixImgData = pixCtx.createImageData(pixW, pixH);
          const pixData = pixImgData.data;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              for (let py = 0; py < cellPixelRes; py++) {
                for (let px = 0; px < cellPixelRes; px++) {
                  const destX = c * cellPixelRes + px;
                  const destY = r * cellPixelRes + py;
                  const destIdx = (destY * pixW + destX) * 4;

                  const srcStartX = Math.floor(c * cw + (px * cw) / cellPixelRes);
                  const srcEndX = Math.floor(c * cw + ((px + 1) * cw) / cellPixelRes);
                  const srcStartY = Math.floor(r * ch + (py * ch) / cellPixelRes);
                  const srcEndY = Math.floor(r * ch + ((py + 1) * ch) / cellPixelRes);

                  let sumR = 0;
                  let sumG = 0;
                  let sumB = 0;
                  let opaqueCount = 0;
                  let totalCount = 0;

                  for (let sy = srcStartY; sy < srcEndY; sy++) {
                    for (let sx = srcStartX; sx < srcEndX; sx++) {
                      const sIdx = (sy * w + sx) * 4;
                      totalCount++;
                      if (data[sIdx + 3] > 100) {
                        opaqueCount++;
                        sumR += data[sIdx];
                        sumG += data[sIdx + 1];
                        sumB += data[sIdx + 2];
                      }
                    }
                  }

                  if (opaqueCount > totalCount * 0.25) {
                    const avgR = Math.round(sumR / opaqueCount);
                    const avgG = Math.round(sumG / opaqueCount);
                    const avgB = Math.round(sumB / opaqueCount);

                    // If light color, guarantee crisp opaque white dress
                    if (avgR > 185 && avgG > 185 && avgB > 185) {
                      pixData[destIdx] = 255;
                      pixData[destIdx + 1] = 255;
                      pixData[destIdx + 2] = 255;
                    } else {
                      pixData[destIdx] = avgR;
                      pixData[destIdx + 1] = avgG;
                      pixData[destIdx + 2] = avgB;
                    }
                    pixData[destIdx + 3] = 255;
                  } else {
                    pixData[destIdx + 3] = 0;
                  }
                }
              }
            }
          }

          pixCtx.putImageData(pixImgData, 0, 0);
          CharacterSprite.spriteCanvas = pixelCanvas;
        } else {
          CharacterSprite.spriteCanvas = offCanvas;
        }

        CharacterSprite.isLoaded = true;
      } catch (err) {
        console.warn('Could not process sprite transparency:', err);
      }
    };

    img.onerror = () => {
      // Retry with fallback path
      if (!img.src.includes('gorillaz_spritesheet')) {
        img.src = '/assets/gorillaz_spritesheet.jpg';
      }
    };

    img.src = '/assets/player_spritesheet.jpg';
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction,
    isMoving: boolean,
    frameIndex: number, // 0 to 3
    targetSize: number = 44, // drawn size on canvas
    timestamp: number = 0,
    tiltAngle: number = 0,
    verticalBob: number = 0,
    stationaryTime: number = 0,
    isInteracting: boolean = false
  ) {
    // Ensure sprite is initialized
    if (!CharacterSprite.loadAttempted) {
      CharacterSprite.initSprite();
    }

    ctx.save();
    // Pixel-art crisp nearest-neighbor rendering
    ctx.imageSmoothingEnabled = false;

    // 1. Semi-transparent dark oval shadow under character's feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, targetSize * 0.38, targetSize * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply movement tilt and bob
    ctx.translate(x, y);
    if (tiltAngle !== 0) {
      ctx.rotate(tiltAngle);
    }
    ctx.translate(-x, -y - verticalBob);

    // Calculate vertical offset for breathing / walking
    let yOffset = 0;
    const isStationary = !isMoving && stationaryTime > 200;
    if (isStationary) {
      yOffset = Math.sin((timestamp / 2000) * 2 * Math.PI) * 1.5;
    } else if (isMoving) {
      yOffset = (frameIndex === 1 || frameIndex === 3) ? -1.5 : 0;
    }

    // 2. Draw from loaded sprite sheet if ready, else procedural fallback
    if (CharacterSprite.isLoaded && CharacterSprite.spriteCanvas) {
      this.drawSpriteSheetFrame(
        ctx,
        CharacterSprite.spriteCanvas,
        x,
        y + yOffset,
        direction,
        isMoving,
        frameIndex,
        targetSize
      );
    } else {
      this.drawProceduralPixelSprite(
        ctx,
        x,
        y + yOffset,
        direction,
        isMoving,
        frameIndex,
        targetSize,
        timestamp,
        stationaryTime,
        isInteracting
      );
    }

    ctx.restore();
  }

  /**
   * Draw a specific frame from the 4x4 sprite sheet:
   * Rows:
   *   0: Down (Facing forward)
   *   1: Up (Facing backward)
   *   2: Side Profile (Left-facing frames: Col 0 = Neutral, Col 1 = Step A, Col 2 = Step B)
   *   Right: Side Profile horizontally mirrored (flipX = true) for a seamless 4-frame stride
   */
  private drawSpriteSheetFrame(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLCanvasElement,
    x: number,
    y: number,
    direction: Direction,
    isMoving: boolean,
    frameIndex: number,
    size: number
  ) {
    const cols = 4;
    const rows = 4;
    const cellW = sheet.width / cols;
    const cellH = sheet.height / rows;

    let rowIndex = 0;
    let colIndex = 0;
    let flipX = false;
    const walkFrame = Math.abs(frameIndex % 4);

    switch (direction) {
      case 'down':
        rowIndex = 0;
        colIndex = isMoving ? walkFrame : 0;
        flipX = false;
        break;
      case 'up':
        rowIndex = 1;
        colIndex = isMoving ? walkFrame : 0;
        flipX = false;
        break;
      case 'left':
        rowIndex = 2;
        // 4-step walk cycle: Neutral (0) -> Stride A (1) -> Neutral (0) -> Stride B (2)
        colIndex = isMoving ? (walkFrame === 0 ? 0 : walkFrame === 1 ? 1 : walkFrame === 2 ? 0 : 2) : 0;
        flipX = false;
        break;
      case 'right':
        rowIndex = 2;
        // Use side profile mirrored horizontally for clean symmetric right movement
        colIndex = isMoving ? (walkFrame === 0 ? 0 : walkFrame === 1 ? 1 : walkFrame === 2 ? 0 : 2) : 0;
        flipX = true;
        break;
    }

    const sx = colIndex * cellW;
    const sy = rowIndex * cellH;

    const destW = size;
    const destH = size;
    const destX = Math.round(x - destW / 2);
    const destY = Math.round(y - destH + 4);

    if (flipX) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
      ctx.drawImage(
        sheet,
        sx,
        sy,
        cellW,
        cellH,
        destX,
        destY,
        destW,
        destH
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        sheet,
        sx,
        sy,
        cellW,
        cellH,
        destX,
        destY,
        destW,
        destH
      );
    }
  }

  /**
   * Pixel-perfect 16x16 Gorillaz character generator with exact frame breakdown
   */
  private drawProceduralPixelSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction,
    isMoving: boolean,
    frameIndex: number, // 0 = Frame 1, 1 = Frame 2, 2 = Frame 3, 3 = Frame 4
    size: number,
    timestamp: number,
    stationaryTime: number,
    isInteracting: boolean
  ) {
    const pixelSize = size / 16;
    const startX = Math.round(x - size / 2);
    const baseY = Math.round(y - size + 4);

    // Color palette
    const C = {
      hair: '#141416',
      hairHighlight: '#262629',
      hairEdge: '#0a0a0c',
      skin: '#d97706',
      skinShadow: '#b45309',
      skinHighlight: '#f59e0b',
      whiteTee: '#f8fafc',
      teeShadow: '#cbd5e1',
      teeText: '#09090b',
      pants: '#18181b',
      pantsShadow: '#09090b',
      shoes: '#09090b',
      shoeWhite: '#ffffff',
      eyes: '#09090b',
      mouth: '#78350f'
    };

    // Calculate vertical offset:
    // - Idle: when stationary for >200ms, breathing effect bobs 1-2 pixels with 2000ms period
    // - Moving: slight bounce/bob on stepping frames (Frame 2 and Frame 4)
    let yOffset = 0;
    const isStationary = !isMoving && stationaryTime > 200;
    if (isStationary) {
      // Exactly 1 complete breath every 2 seconds (2000ms), 1-2px range
      yOffset = Math.sin((timestamp / 2000) * 2 * Math.PI) * 1.4;
    } else if (isMoving) {
      // Walking bounce/bob: frames 1 and 3 dip by 1px
      yOffset = (frameIndex === 1 || frameIndex === 3) ? -1 : 0;
    }

    // Eyes blink every 3-4 seconds (3500ms cycle, 140ms duration) when idle
    const blinkCycle = timestamp % 3500;
    const isBlinking = isStationary && blinkCycle > 3360;

    const startY = baseY + yOffset;

    const fillPixel = (px: number, py: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(startX + px * pixelSize),
        Math.round(startY + py * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    };

    // ----------------------------------------------------
    // DOWN: Facing Camera
    // Frame 1: Both feet together, neutral stance
    // Frame 2: Left leg forward, right arm back
    // Frame 3: Feet together, mid-stride
    // Frame 4: Right leg forward, left arm back
    // ----------------------------------------------------
    if (direction === 'down') {
      // Hair (messy Gorillaz anime tufts)
      for (let px = 4; px <= 11; px++) fillPixel(px, 1, C.hair);
      for (let px = 2; px <= 13; px++) fillPixel(px, 2, px === 5 || px === 9 ? C.hairHighlight : C.hair);
      for (let px = 1; px <= 14; px++) fillPixel(px, 3, C.hair);
      // Bangs
      fillPixel(1, 4, C.hair);
      fillPixel(2, 4, C.hair);
      fillPixel(13, 4, C.hair);
      fillPixel(14, 4, C.hair);

      // Face & Forehead
      for (let px = 3; px <= 12; px++) fillPixel(px, 4, px === 4 || px === 7 || px === 11 ? C.hair : C.skin);
      for (let px = 3; px <= 12; px++) fillPixel(px, 5, C.skin);

      // Distinct Gorillaz Eyes / Blink
      if (isBlinking) {
        fillPixel(4, 5, C.skinShadow);
        fillPixel(5, 5, C.skinShadow);
        fillPixel(10, 5, C.skinShadow);
        fillPixel(11, 5, C.skinShadow);
      } else {
        fillPixel(4, 5, C.eyes);
        fillPixel(5, 5, C.eyes);
        fillPixel(10, 5, C.eyes);
        fillPixel(11, 5, C.eyes);
      }

      // Cheeks & Nose
      for (let px = 3; px <= 12; px++) fillPixel(px, 6, C.skin);
      fillPixel(7, 6, C.skinShadow);
      fillPixel(8, 6, C.skinShadow);

      // Mouth & Chin
      for (let px = 4; px <= 11; px++) fillPixel(px, 7, C.skin);
      fillPixel(7, 7, C.mouth);
      fillPixel(8, 7, C.mouth);
      fillPixel(7, 8, C.hair); // goatee tuft
      fillPixel(8, 8, C.hair);

      // White T-shirt with GORILLAZ print
      for (let px = 4; px <= 11; px++) fillPixel(px, 9, C.whiteTee);
      for (let px = 3; px <= 12; px++) fillPixel(px, 10, C.whiteTee);
      for (let px = 3; px <= 12; px++) fillPixel(px, 11, C.whiteTee);

      // Front Logo details
      fillPixel(5, 10, C.teeText);
      fillPixel(7, 10, C.teeText);
      fillPixel(9, 10, C.teeText);
      fillPixel(10, 10, C.teeText);
      fillPixel(6, 11, C.teeText);
      fillPixel(8, 11, C.teeText);

      // Arm positions based on 4-frame cycle:
      // Frame 1 (idle/neutral): both arms at side (y: 10-11)
      // Frame 2 (left leg forward): right arm back (y: 9-10), left arm forward/down (y: 11-12)
      // Frame 3 (mid-stride): both arms at side (y: 10-11)
      // Frame 4 (right leg forward): left arm back (y: 9-10), right arm forward/down (y: 11-12)
      let leftArmY1 = 10;
      let leftArmY2 = 11;
      let rightArmY1 = 10;
      let rightArmY2 = 11;

      if (isMoving) {
        if (frameIndex === 1) {
          // Frame 2: left arm forward/down, right arm back/up
          leftArmY1 = 11;
          leftArmY2 = 12;
          rightArmY1 = 9;
          rightArmY2 = 10;
        } else if (frameIndex === 3) {
          // Frame 4: right arm forward/down, left arm back/up
          leftArmY1 = 9;
          leftArmY2 = 10;
          rightArmY1 = 11;
          rightArmY2 = 12;
        }
      }

      // Left Arm (on character's right side x=2)
      fillPixel(2, leftArmY1, C.skin);
      fillPixel(2, leftArmY2, C.skinShadow);

      // Right Arm (on character's left side x=13)
      fillPixel(13, rightArmY1, C.skin);
      fillPixel(13, rightArmY2, C.skinShadow);

      // Pants (Black jeans)
      for (let px = 4; px <= 11; px++) fillPixel(px, 12, C.pants);

      // Legs & Feet positions:
      // Frame 1 & 3: both feet together at y=14..15
      // Frame 2: Left leg forward (stepped forward y=15), Right leg back (y=13..14)
      // Frame 4: Right leg forward (stepped forward y=15), Left leg back (y=13..14)
      let leftLegY = 13;
      let rightLegY = 13;
      let leftShoeY = 14;
      let rightShoeY = 14;

      if (isMoving) {
        if (frameIndex === 1) {
          // Left leg forward
          leftLegY = 13;
          leftShoeY = 15;
          rightLegY = 12;
          rightShoeY = 13;
        } else if (frameIndex === 3) {
          // Right leg forward
          rightLegY = 13;
          rightShoeY = 15;
          leftLegY = 12;
          leftShoeY = 13;
        }
      }

      // Left Leg (x: 4..6)
      for (let px = 4; px <= 6; px++) fillPixel(px, leftLegY, C.pants);
      for (let px = 4; px <= 6; px++) {
        fillPixel(px, leftShoeY, C.shoes);
        fillPixel(px, leftShoeY + 1, C.shoeWhite);
      }

      // Right Leg (x: 9..11)
      for (let px = 9; px <= 11; px++) fillPixel(px, rightLegY, C.pants);
      for (let px = 9; px <= 11; px++) {
        fillPixel(px, rightShoeY, C.shoes);
        fillPixel(px, rightShoeY + 1, C.shoeWhite);
      }
    }

    // ----------------------------------------------------
    // UP: Facing Away
    // Frame 1: Both feet together
    // Frame 2: Right leg forward (moving upward)
    // Frame 3: Feet together, mid-stride
    // Frame 4: Left leg forward (moving upward)
    // ----------------------------------------------------
    else if (direction === 'up') {
      // Full back of messy hair
      for (let px = 4; px <= 11; px++) fillPixel(px, 1, C.hair);
      for (let px = 2; px <= 13; px++) fillPixel(px, 2, C.hair);
      for (let px = 1; px <= 14; px++) fillPixel(px, 3, C.hairHighlight);
      for (let px = 1; px <= 14; px++) fillPixel(px, 4, C.hair);
      for (let px = 2; px <= 13; px++) fillPixel(px, 5, C.hair);
      for (let px = 2; px <= 13; px++) fillPixel(px, 6, C.hair);
      for (let px = 3; px <= 12; px++) fillPixel(px, 7, C.hair);
      for (let px = 5; px <= 10; px++) fillPixel(px, 8, C.skinShadow); // nape

      // White T-shirt back
      for (let px = 4; px <= 11; px++) fillPixel(px, 9, C.whiteTee);
      for (let px = 3; px <= 12; px++) fillPixel(px, 10, C.whiteTee);
      for (let px = 3; px <= 12; px++) fillPixel(px, 11, C.whiteTee);

      // Arms swinging
      let leftArmY1 = 10;
      let leftArmY2 = 11;
      let rightArmY1 = 10;
      let rightArmY2 = 11;

      if (isMoving) {
        if (frameIndex === 1) {
          // Frame 2: Right arm forward (upwards), left arm back
          rightArmY1 = 9;
          rightArmY2 = 10;
          leftArmY1 = 11;
          leftArmY2 = 12;
        } else if (frameIndex === 3) {
          // Frame 4: Left arm forward (upwards), right arm back
          leftArmY1 = 9;
          leftArmY2 = 10;
          rightArmY1 = 11;
          rightArmY2 = 12;
        }
      }

      fillPixel(2, leftArmY1, C.skin);
      fillPixel(2, leftArmY2, C.skin);
      fillPixel(13, rightArmY1, C.skin);
      fillPixel(13, rightArmY2, C.skin);

      // Pants back
      for (let px = 4; px <= 11; px++) fillPixel(px, 12, C.pants);

      // Stepping positions:
      // Frame 1 & 3: feet together
      // Frame 2: Right leg forward (higher up y=13), left leg back (y=15)
      // Frame 4: Left leg forward (higher up y=13), right leg back (y=15)
      let leftLegY = 13;
      let rightLegY = 13;
      let leftShoeY = 14;
      let rightShoeY = 14;

      if (isMoving) {
        if (frameIndex === 1) {
          rightLegY = 12;
          rightShoeY = 13;
          leftLegY = 13;
          leftShoeY = 15;
        } else if (frameIndex === 3) {
          leftLegY = 12;
          leftShoeY = 13;
          rightLegY = 13;
          rightShoeY = 15;
        }
      }

      // Left leg & shoe
      for (let px = 4; px <= 6; px++) fillPixel(px, leftLegY, C.pants);
      for (let px = 4; px <= 6; px++) {
        fillPixel(px, leftShoeY, C.shoes);
        fillPixel(px, leftShoeY + 1, C.shoeWhite);
      }

      // Right leg & shoe
      for (let px = 9; px <= 11; px++) fillPixel(px, rightLegY, C.pants);
      for (let px = 9; px <= 11; px++) {
        fillPixel(px, rightShoeY, C.shoes);
        fillPixel(px, rightShoeY + 1, C.shoeWhite);
      }
    }

    // ----------------------------------------------------
    // LEFT: Facing Left Profile
    // Frame 1: Facing left, neutral
    // Frame 2: Left leg back, body leaning into step
    // Frame 3: Neutral mid-stride
    // Frame 4: Left leg forward, stepping motion
    // ----------------------------------------------------
    else if (direction === 'left') {
      // Body lean shift: on frame 2, shift upper body left by 1px
      const lean = (isMoving && frameIndex === 1) ? -1 : 0;

      // Hair profile (pointed left)
      for (let px = 6 + lean; px <= 12 + lean; px++) fillPixel(px, 1, C.hair);
      for (let px = 3 + lean; px <= 13 + lean; px++) fillPixel(px, 2, C.hair);
      for (let px = 2 + lean; px <= 14 + lean; px++) fillPixel(px, 3, C.hair);
      for (let px = 2 + lean; px <= 14 + lean; px++) fillPixel(px, 4, C.hair);

      // Face profile
      for (let px = 4 + lean; px <= 9 + lean; px++) fillPixel(px, 5, C.skin);
      fillPixel(5 + lean, 5, isBlinking ? C.skinShadow : C.eyes);
      fillPixel(3 + lean, 5, C.skin);
      for (let px = 3 + lean; px <= 9 + lean; px++) fillPixel(px, 6, C.skin);
      fillPixel(3 + lean, 6, C.skinHighlight); // nose tip
      for (let px = 4 + lean; px <= 9 + lean; px++) fillPixel(px, 7, C.skin);
      fillPixel(5 + lean, 7, C.mouth);

      // White Tee profile
      for (let px = 5 + lean; px <= 11 + lean; px++) fillPixel(px, 9, C.whiteTee);
      for (let px = 4 + lean; px <= 11 + lean; px++) fillPixel(px, 10, C.whiteTee);
      for (let px = 4 + lean; px <= 11 + lean; px++) fillPixel(px, 11, C.whiteTee);
      fillPixel(6 + lean, 10, C.teeText);
      fillPixel(7 + lean, 10, C.teeText);
      fillPixel(8 + lean, 10, C.teeText);

      // Arm profile: swings with stride or gestures when interacting
      let armX = 6 + lean;
      let armY = 11;
      if (isInteracting) {
        armX = 4 + lean;
        armY = 9; // raised interactive hand
      } else if (isMoving) {
        if (frameIndex === 1) {
          armX = 7 + lean; // arm swings back
        } else if (frameIndex === 3) {
          armX = 4 + lean; // arm swings forward
        }
      }
      fillPixel(armX, armY, C.skin);
      fillPixel(armX, armY + 1, C.skinShadow);

      // Pants waist
      for (let px = 5; px <= 10; px++) fillPixel(px, 12, C.pants);

      // Frame 1: Neutral stance (both feet centered around x: 6..9, y: 14)
      // Frame 2: Left leg back (x: 8..11), right leg front (x: 5..7)
      // Frame 3: Neutral mid-stride (passing center)
      // Frame 4: Left leg forward (x: 4..6), right leg trailing (x: 8..10)
      if (!isMoving || frameIndex === 0 || frameIndex === 2) {
        // Neutral feet
        for (let px = 6; px <= 9; px++) {
          fillPixel(px, 13, C.pants);
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      } else if (frameIndex === 1) {
        // Frame 2: Left leg back, right leg front
        // Front leg (right)
        for (let px = 5; px <= 7; px++) fillPixel(px, 13, C.pants);
        for (let px = 4; px <= 7; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
        // Back leg (left leg back)
        for (let px = 8; px <= 10; px++) fillPixel(px, 13, C.pants);
        for (let px = 8; px <= 11; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      } else if (frameIndex === 3) {
        // Frame 4: Left leg forward, stepping motion
        // Forward leg (left)
        for (let px = 4; px <= 6; px++) fillPixel(px, 13, C.pants);
        for (let px = 3; px <= 6; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
        // Trailing leg (right)
        for (let px = 8; px <= 10; px++) fillPixel(px, 13, C.pants);
        for (let px = 8; px <= 10; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      }
    }

    // ----------------------------------------------------
    // RIGHT: Facing Right Profile
    // Frame 1: Facing right, neutral
    // Frame 2: Right leg back, body leaning
    // Frame 3: Neutral mid-stride
    // Frame 4: Right leg forward, stepping motion
    // ----------------------------------------------------
    else if (direction === 'right') {
      // Body lean shift: on frame 2, shift upper body right by 1px
      const lean = (isMoving && frameIndex === 1) ? 1 : 0;

      // Hair profile (pointed right)
      for (let px = 3 + lean; px <= 9 + lean; px++) fillPixel(px, 1, C.hair);
      for (let px = 2 + lean; px <= 12 + lean; px++) fillPixel(px, 2, C.hair);
      for (let px = 1 + lean; px <= 13 + lean; px++) fillPixel(px, 3, C.hair);
      for (let px = 1 + lean; px <= 13 + lean; px++) fillPixel(px, 4, C.hair);

      // Face profile
      for (let px = 6 + lean; px <= 11 + lean; px++) fillPixel(px, 5, C.skin);
      fillPixel(10 + lean, 5, isBlinking ? C.skinShadow : C.eyes);
      fillPixel(12 + lean, 5, C.skin);
      for (let px = 6 + lean; px <= 12 + lean; px++) fillPixel(px, 6, C.skin);
      fillPixel(12 + lean, 6, C.skinHighlight); // nose tip
      for (let px = 6 + lean; px <= 11 + lean; px++) fillPixel(px, 7, C.skin);
      fillPixel(10 + lean, 7, C.mouth);

      // White Tee profile
      for (let px = 4 + lean; px <= 10 + lean; px++) fillPixel(px, 9, C.whiteTee);
      for (let px = 4 + lean; px <= 11 + lean; px++) fillPixel(px, 10, C.whiteTee);
      for (let px = 4 + lean; px <= 11 + lean; px++) fillPixel(px, 11, C.whiteTee);
      fillPixel(7 + lean, 10, C.teeText);
      fillPixel(8 + lean, 10, C.teeText);
      fillPixel(9 + lean, 10, C.teeText);

      // Arm profile
      let armX = 9 + lean;
      let armY = 11;
      if (isInteracting) {
        armX = 11 + lean;
        armY = 9; // raised interactive hand
      } else if (isMoving) {
        if (frameIndex === 1) {
          armX = 8 + lean; // arm swings back
        } else if (frameIndex === 3) {
          armX = 11 + lean; // arm swings forward
        }
      }
      fillPixel(armX, armY, C.skin);
      fillPixel(armX, armY + 1, C.skinShadow);

      // Pants waist
      for (let px = 5; px <= 10; px++) fillPixel(px, 12, C.pants);

      // Frame 1: Neutral stance
      // Frame 2: Right leg back, left leg front
      // Frame 3: Neutral mid-stride
      // Frame 4: Right leg forward, stepping motion
      if (!isMoving || frameIndex === 0 || frameIndex === 2) {
        // Neutral feet
        for (let px = 6; px <= 9; px++) {
          fillPixel(px, 13, C.pants);
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      } else if (frameIndex === 1) {
        // Frame 2: Right leg back, left leg front
        // Front leg (left)
        for (let px = 8; px <= 10; px++) fillPixel(px, 13, C.pants);
        for (let px = 8; px <= 11; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
        // Back leg (right leg back)
        for (let px = 5; px <= 7; px++) fillPixel(px, 13, C.pants);
        for (let px = 4; px <= 7; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      } else if (frameIndex === 3) {
        // Frame 4: Right leg forward, stepping motion
        // Forward leg (right)
        for (let px = 9; px <= 11; px++) fillPixel(px, 13, C.pants);
        for (let px = 9; px <= 12; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
        // Trailing leg (left)
        for (let px = 5; px <= 7; px++) fillPixel(px, 13, C.pants);
        for (let px = 5; px <= 7; px++) {
          fillPixel(px, 14, C.shoes);
          fillPixel(px, 15, C.shoeWhite);
        }
      }
    }
  }
}

