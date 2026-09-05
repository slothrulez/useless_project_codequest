import { Direction } from '../types';

/**
 * Character renderer for the 16x16 pixel Gorillaz-style chibi character:
 * - Messy black anime/Gorillaz hair
 * - Warm tan skin with shading and highlights
 * - White t-shirt with GORILLAZ print
 * - Dark black jeans/pants
 * - Black & white sneakers
 * 
 * Implements exact 4-frame walking cycles for DOWN, UP, LEFT, RIGHT:
 * - DOWN:
 *     Frame 1: Both feet together, neutral stance
 *     Frame 2: Left leg forward, right arm back
 *     Frame 3: Feet together, mid-stride
 *     Frame 4: Right leg forward, left arm back
 * - UP:
 *     Frame 1: Both feet together
 *     Frame 2: Right leg forward
 *     Frame 3: Feet together, mid-stride
 *     Frame 4: Left leg forward
 * - LEFT:
 *     Frame 1: Facing left, neutral
 *     Frame 2: Left leg back, body leaning into step
 *     Frame 3: Neutral mid-stride
 *     Frame 4: Left leg forward, stepping motion
 * - RIGHT:
 *     Frame 1: Facing right, neutral
 *     Frame 2: Right leg back, body leaning
 *     Frame 3: Neutral mid-stride
 *     Frame 4: Right leg forward, stepping motion
 * 
 * - Idle animations: single relaxed idle frame matching last direction faced
 * - Idle breathing effect: subtle 1-2 pixel float cycle
 * - Walking bob: 1-2 pixels up-down
 * - Semi-transparent oval shadow under feet
 */

export class CharacterSprite {
  public draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction,
    isMoving: boolean,
    frameIndex: number, // 0 to 3
    targetSize: number = 40, // drawn size on canvas (scaled from 16x16)
    timestamp: number = 0,
    tiltAngle: number = 0,
    verticalBob: number = 0,
    stationaryTime: number = 0,
    isInteracting: boolean = false
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 1. Semi-transparent dark oval shadow under character's feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + 3, targetSize * 0.36, targetSize * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apply movement tilt (leaning into step) and interaction bob
    ctx.translate(x, y);
    if (tiltAngle !== 0) {
      ctx.rotate(tiltAngle);
    }
    ctx.translate(-x, -y - verticalBob);

    // 2. High-precision procedural 16x16 pixel renderer
    this.drawProceduralPixelSprite(
      ctx,
      x,
      y,
      direction,
      isMoving,
      frameIndex,
      targetSize,
      timestamp,
      stationaryTime,
      isInteracting
    );

    ctx.restore();
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

