import React, { useEffect, useRef, useState } from 'react';
import { Direction, GameLocation, Position, GitStatusMode } from '../types';
import { CharacterSprite } from './characterRenderer';
import { LOCATIONS, WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../data/mapData';
import { soundFx } from '../utils/audio';

interface GameCanvasProps {
  onInteractLocation: (location: GameLocation) => void;
  onNearLocationChange: (location: GameLocation | null) => void;
  externalMoveDir: Direction | null;
  teleportTarget: Position | null;
  onClearTeleport: () => void;
  gitStatus: GitStatusMode;
  playerName?: string;
  initialPosition?: Position;
  onMovementChange?: (isMoving: boolean, activeKeys: { up: boolean; down: boolean; left: boolean; right: boolean }) => void;
  onPlayerPositionChange?: (pos: Position, dir: Direction) => void;
  celebrationTimestamp?: number;
}

// Building collision bounding boxes (scaled for 1400x1000 world map)
const BUILDING_OBSTACLES = [
  // The Elder's stone chamber
  { minX: 624, minY: 131, maxX: 776, maxY: 231 },
  // Git Shrine obsidian cavern
  { minX: 1155, minY: 106, maxX: 1307, maxY: 225 },
  // Docs Library waterfall cliff & building
  { minX: 53, minY: 306, maxX: 181, maxY: 419 },
  // tests/ Sanctuary (Blue Roof)
  { minX: 397, minY: 313, maxX: 525, maxY: 419 },
  // README.md Manor (Red Roof)
  { minX: 875, minY: 313, maxX: 1003, maxY: 419 },
  // src/ Cottage (Green Roof)
  { minX: 274, minY: 563, maxX: 403, maxY: 669 },
  // assets/ Workshop (Purple Roof)
  { minX: 998, minY: 563, maxX: 1126, maxY: 669 },
  // package.json Tavern (Brown Roof)
  { minX: 467, minY: 781, maxX: 595, maxY: 888 },
  // .gitignore Fortress (Dark Roof)
  { minX: 805, minY: 781, maxX: 933, maxY: 888 },
  // Remote Origin Storage
  { minX: 1208, minY: 844, maxX: 1336, maxY: 950 },
  // Great Tree Trunk at Main Plaza
  { minX: 683, minY: 556, maxX: 718, maxY: 594 }
];

// Pre-defined torch locations across the village
const TORCH_LOCATIONS = [
  { x: 635, y: 195, label: 'elder_l' },
  { x: 765, y: 195, label: 'elder_r' },
  { x: 1165, y: 175, label: 'shrine_l' },
  { x: 1295, y: 175, label: 'shrine_r' },
  { x: 510, y: 835, label: 'tavern' },
  { x: 645, y: 580, label: 'plaza_l' },
  { x: 755, y: 580, label: 'plaza_r' }
];

// Sites where lava bubbles form and burst at Git Shrine
const LAVA_BUBBLE_SITES = [
  { ox: -18, oy: -8, phase: 0 },
  { ox: 14, oy: 10, phase: 1.2 },
  { ox: -6, oy: 14, phase: 2.5 },
  { ox: 18, oy: -12, phase: 3.7 },
  { ox: 0, oy: 2, phase: 4.8 },
  { ox: -22, oy: 6, phase: 5.9 }
];

// Foreground grass tufts and overhanging leaves (moving at 110% camera speed for parallax)
const FOREGROUND_ELEMENTS = [
  { x: 140, y: 920, type: 'grass', scale: 1.2 },
  { x: 260, y: 940, type: 'grass', scale: 1.0 },
  { x: 420, y: 930, type: 'grass', scale: 1.3 },
  { x: 620, y: 950, type: 'grass', scale: 1.1 },
  { x: 780, y: 935, type: 'grass', scale: 1.2 },
  { x: 980, y: 940, type: 'grass', scale: 1.4 },
  { x: 1140, y: 925, type: 'grass', scale: 1.0 },
  { x: 50, y: 180, type: 'leaves', scale: 1.5 },
  { x: 1350, y: 220, type: 'leaves', scale: 1.5 }
];

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onInteractLocation,
  onNearLocationChange,
  externalMoveDir,
  teleportTarget,
  onClearTeleport,
  gitStatus,
  playerName,
  initialPosition,
  onMovementChange,
  onPlayerPositionChange,
  celebrationTimestamp
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const spawnPos = initialPosition || { x: 700, y: 690 };

  // Character state in 1400x1000 world (spawn south of Main Plaza on paved path)
  const playerRef = useRef<Position>({ x: spawnPos.x, y: spawnPos.y });
  const directionRef = useRef<Direction>('down');
  const isMovingRef = useRef<boolean>(false);
  const lastReportedPosTimeRef = useRef<number>(0);
  const frameIndexRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);
  const targetPosRef = useRef<Position | null>(null); // For click-to-move

  // Physics: Smooth acceleration, deceleration (~100ms stopping), tilt angle, and E key bob
  const velXRef = useRef<number>(0);
  const velYRef = useRef<number>(0);
  const tiltAngleRef = useRef<number>(0);
  const interactionBobRef = useRef<number>(0);

  // Animation sequence states: Game entry, idle breathing/blinking, camera shake, and smooth building glow
  const gameStartTimeRef = useRef<number>(0);
  const lastMovingTimeRef = useRef<number>(0);
  const buildingGlowRef = useRef<Map<string, number>>(new Map());
  const prevGitStatusRef = useRef<GitStatusMode>(gitStatus);
  const shakeEndTimeRef = useRef<number>(0);

  // Smooth camera state (centered on player, clamped within world boundaries)
  const cameraPosRef = useRef<Position>({
    x: Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, spawnPos.x - VIEWPORT_WIDTH / 2)),
    y: Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, spawnPos.y - VIEWPORT_HEIGHT / 2))
  });
  const lastLoopTimeRef = useRef<number>(0);

  // Nearby location tracking
  const nearLocationRef = useRef<GameLocation | null>(null);
  const [nearLocation, setNearLocation] = useState<GameLocation | null>(null);

  // Background map image
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [, setMapLoaded] = useState<boolean>(false);

  // Particles & ambient effects
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }>>([]);
  const dustParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number }>>([]);
  const celebrationParticlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number }>>([]);
  const lastDustTimeRef = useRef<number>(0);

  // Trigger celebration explosion when a commit is forged
  useEffect(() => {
    if (celebrationTimestamp && celebrationTimestamp > 0) {
      const pX = playerRef.current.x;
      const pY = playerRef.current.y - 12;
      const colors = ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#ffffff', '#ec4899'];
      for (let i = 0; i < 45; i++) {
        const angle = (Math.PI * 2 * i) / 45 + (Math.random() - 0.5) * 0.35;
        const speed = 1.8 + Math.random() * 3.8;
        celebrationParticlesRef.current.push({
          x: pX,
          y: pY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.2, // initial upward arc
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2.5 + Math.random() * 2.5,
          life: 0,
          maxLife: 45 + Math.random() * 35
        });
      }
    }
  }, [celebrationTimestamp]);

  // Character sprite instance
  const characterSpriteRef = useRef<CharacterSprite | null>(null);

  // Keys currently held & press order tracking for diagonal priority
  const keysHeld = useRef<{ [key: string]: boolean }>({});
  const keyPressOrderRef = useRef<Direction[]>([]);

  // Teleport effect: smoothly lerp character and camera without hard cuts
  useEffect(() => {
    if (teleportTarget) {
      playerRef.current = { x: teleportTarget.x, y: teleportTarget.y };
      targetPosRef.current = null;
      velXRef.current = 0;
      velYRef.current = 0;
      soundFx.playInteract();
      onClearTeleport();
    }
  }, [teleportTarget, onClearTeleport]);

  // Load map background image and initialize ambient wind particles
  useEffect(() => {
    characterSpriteRef.current = new CharacterSprite();

    const img = new Image();
    img.src = '/assets/codequest_map.jpg';
    img.onload = () => {
      mapImageRef.current = img;
      setMapLoaded(true);
    };
    img.onerror = () => {
      setMapLoaded(true);
    };

    // Initialize 45 ambient floating leaves & wind particles
    const parts = [];
    for (let i = 0; i < 45; i++) {
      parts.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        vx: 0.4 + Math.random() * 0.5,
        vy: 0.2 + Math.random() * 0.3,
        life: Math.random() * 120,
        maxLife: 100 + Math.random() * 80,
        color: Math.random() > 0.65 ? '#86efac' : Math.random() > 0.3 ? '#fef08a' : '#f59e0b',
        size: 1.5 + Math.random() * 2.2
      });
    }
    particlesRef.current = parts;
  }, []);

  // Keyboard controls listener (WASD and Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      keysHeld.current[key] = true;

      let dir: Direction | null = null;
      if (key === 'w' || key === 'arrowup') dir = 'up';
      else if (key === 's' || key === 'arrowdown') dir = 'down';
      else if (key === 'a' || key === 'arrowleft') dir = 'left';
      else if (key === 'd' || key === 'arrowright') dir = 'right';

      if (dir) {
        keyPressOrderRef.current = [dir, ...keyPressOrderRef.current.filter(d => d !== dir)];
      }

      // Handle 'E' or 'Space' for immediate character bob & interaction
      if (key === 'e' || e.key === ' ') {
        e.preventDefault();
        interactionBobRef.current = 1.0; // Immediate slight character bob feedback
        if (nearLocationRef.current) {
          soundFx.playInteract();
          onInteractLocation(nearLocationRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysHeld.current[key] = false;

      let dir: Direction | null = null;
      if (key === 'w' || key === 'arrowup') dir = 'up';
      else if (key === 's' || key === 'arrowdown') dir = 'down';
      else if (key === 'a' || key === 'arrowleft') dir = 'left';
      else if (key === 'd' || key === 'arrowright') dir = 'right';

      if (dir) {
        keyPressOrderRef.current = keyPressOrderRef.current.filter(d => d !== dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onInteractLocation]);

  // Handle click on canvas: project viewport coordinate to world coordinate using camera offset
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEWPORT_WIDTH / rect.width;
    const scaleY = VIEWPORT_HEIGHT / rect.height;

    // Viewport position (0..960, 0..640)
    const viewClickX = (e.clientX - rect.left) * scaleX;
    const viewClickY = (e.clientY - rect.top) * scaleY;

    // Projected World position (view + camera offset)
    const worldClickX = cameraPosRef.current.x + viewClickX;
    const worldClickY = cameraPosRef.current.y + viewClickY;

    // Check if clicked within interaction radius of any building
    for (const loc of LOCATIONS) {
      const dist = Math.hypot(worldClickX - loc.x, worldClickY - loc.y);
      if (dist <= loc.interactionRadius) {
        interactionBobRef.current = 1.0;
        soundFx.playInteract();
        onInteractLocation(loc);
        return;
      }
    }

    // Otherwise, set destination for click-to-move
    targetPosRef.current = { x: worldClickX, y: worldClickY };
    soundFx.playStep();
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const speed = 3.6; // Max walking velocity in pixels per frame

    // Collision detection with building obstacles and world boundaries
    const isBlocked = (px: number, py: number): boolean => {
      // Map boundaries: player cannot move beyond visible map area
      if (px < 65 || px > WORLD_WIDTH - 65 || py < 80 || py > WORLD_HEIGHT - 70) {
        return true;
      }
      const radX = 12;
      const radY = 8;
      for (const obs of BUILDING_OBSTACLES) {
        if (
          px + radX > obs.minX &&
          px - radX < obs.maxX &&
          py + radY > obs.minY &&
          py - radY < obs.maxY
        ) {
          return true;
        }
      }
      return false;
    };

    const loop = (timestamp: number) => {
      // Initialize game start time & camera intro position
      if (gameStartTimeRef.current === 0) {
        gameStartTimeRef.current = timestamp;
        lastMovingTimeRef.current = timestamp;
        cameraPosRef.current = {
          x: Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, 700 - VIEWPORT_WIDTH / 2)),
          y: Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, 690 - VIEWPORT_HEIGHT / 2 + 45))
        };
      }
      const elapsed = timestamp - gameStartTimeRef.current;

      // Git status change: Trigger 200ms subtle camera shake (2-3px) & celebration burst
      if (gitStatus !== prevGitStatusRef.current) {
        prevGitStatusRef.current = gitStatus;
        shakeEndTimeRef.current = timestamp + 200;
        if (gitStatus === 'clean') {
          const pX = playerRef.current.x;
          const pY = playerRef.current.y - 12;
          const colors = ['#10b981', '#34d399', '#facc15', '#38bdf8', '#ffffff'];
          for (let i = 0; i < 35; i++) {
            const angle = (Math.PI * 2 * i) / 35 + (Math.random() - 0.5) * 0.4;
            const spd = 1.6 + Math.random() * 3.2;
            celebrationParticlesRef.current.push({
              x: pX,
              y: pY,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 2,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 2.5 + Math.random() * 2,
              life: 0,
              maxLife: 40 + Math.random() * 30
            });
          }
        }
      }

      // Calculate delta time
      const dt = lastLoopTimeRef.current > 0 ? Math.min((timestamp - lastLoopTimeRef.current) / 1000, 0.05) : 0.016;
      lastLoopTimeRef.current = timestamp;

      // 1. Process movement inputs
      let targetVx = 0;
      let targetVy = 0;

      const activeKeys = {
        up: Boolean(keysHeld.current['w'] || keysHeld.current['arrowup'] || externalMoveDir === 'up'),
        down: Boolean(keysHeld.current['s'] || keysHeld.current['arrowdown'] || externalMoveDir === 'down'),
        left: Boolean(keysHeld.current['a'] || keysHeld.current['arrowleft'] || externalMoveDir === 'left'),
        right: Boolean(keysHeld.current['d'] || keysHeld.current['arrowright'] || externalMoveDir === 'right')
      };

      if (externalMoveDir) {
        // Touch controls
        if (externalMoveDir === 'up') targetVy -= speed;
        if (externalMoveDir === 'down') targetVy += speed;
        if (externalMoveDir === 'left') targetVx -= speed;
        if (externalMoveDir === 'right') targetVx += speed;
        directionRef.current = externalMoveDir;
        targetPosRef.current = null;
      } else {
        // Keyboard inputs (WASD and Arrow keys)
        if (activeKeys.up) targetVy -= speed;
        if (activeKeys.down) targetVy += speed;
        if (activeKeys.left) targetVx -= speed;
        if (activeKeys.right) targetVx += speed;

        if (targetVx !== 0 || targetVy !== 0) {
          targetPosRef.current = null;

          if (targetVx !== 0 && targetVy !== 0) {
            // Diagonal movement normalization
            targetVx *= 0.72;
            targetVy *= 0.72;

            const activeDirs: Direction[] = [];
            if (targetVy < 0) activeDirs.push('up');
            if (targetVy > 0) activeDirs.push('down');
            if (targetVx < 0) activeDirs.push('left');
            if (targetVx > 0) activeDirs.push('right');

            const prioritized = keyPressOrderRef.current.find(d => activeDirs.includes(d));
            if (prioritized) {
              directionRef.current = prioritized;
            }
          } else if (targetVx !== 0) {
            directionRef.current = targetVx > 0 ? 'right' : 'left';
          } else if (targetVy !== 0) {
            directionRef.current = targetVy > 0 ? 'down' : 'up';
          }
        } else if (targetPosRef.current) {
          // Click to move
          const target = targetPosRef.current;
          const px = playerRef.current.x;
          const py = playerRef.current.y;
          const dist = Math.hypot(target.x - px, target.y - py);

          if (dist < speed) {
            if (!isBlocked(target.x, target.y)) {
              playerRef.current = { x: target.x, y: target.y };
            }
            targetPosRef.current = null;
          } else {
            const angle = Math.atan2(target.y - py, target.x - px);
            targetVx = Math.cos(angle) * speed;
            targetVy = Math.sin(angle) * speed;

            if (Math.abs(targetVx) > Math.abs(targetVy)) {
              directionRef.current = targetVx > 0 ? 'right' : 'left';
            } else {
              directionRef.current = targetVy > 0 ? 'down' : 'up';
            }
          }
        }
      }

      // 2. Smooth Acceleration & Smooth Deceleration (Takes ~100ms to stop moving)
      if (targetVx !== 0 || targetVy !== 0) {
        // Smooth acceleration (reaches speed within ~50ms)
        const accelRate = 1 - Math.exp(-18 * dt);
        velXRef.current += (targetVx - velXRef.current) * accelRate;
        velYRef.current += (targetVy - velYRef.current) * accelRate;
      } else {
        // Smooth deceleration (takes ~100ms to come to a stop)
        const decelRate = 1 - Math.exp(-12 * dt);
        velXRef.current += (0 - velXRef.current) * decelRate;
        velYRef.current += (0 - velYRef.current) * decelRate;
        if (Math.abs(velXRef.current) < 0.08) velXRef.current = 0;
        if (Math.abs(velYRef.current) < 0.08) velYRef.current = 0;
      }

      const velocityMag = Math.hypot(velXRef.current, velYRef.current);
      const isMoving = velocityMag > 0.15;
      isMovingRef.current = isMoving;

      // Character leans / tilts slightly into direction of movement (~4.5 deg max)
      const targetTilt = (velXRef.current / speed) * 0.08;
      tiltAngleRef.current += (targetTilt - tiltAngleRef.current) * (1 - Math.exp(-16 * dt));

      // Interaction bob decay (E key press feedback)
      if (interactionBobRef.current > 0) {
        interactionBobRef.current *= Math.exp(-14 * dt);
        if (interactionBobRef.current < 0.01) interactionBobRef.current = 0;
      }
      const verticalBob = Math.sin(interactionBobRef.current * Math.PI) * 4.5;

      // Notify parent for movement indicators
      onMovementChange?.(isMoving, activeKeys);

      // Update position with sliding physics
      if (isMoving) {
        let nextX = playerRef.current.x;
        let nextY = playerRef.current.y;

        const stepX = velXRef.current;
        const stepY = velYRef.current;

        if (!isBlocked(playerRef.current.x + stepX, playerRef.current.y + stepY)) {
          nextX += stepX;
          nextY += stepY;
        } else {
          // Wall sliding
          if (!isBlocked(playerRef.current.x + stepX, playerRef.current.y)) {
            nextX += stepX;
          }
          if (!isBlocked(playerRef.current.x, playerRef.current.y + stepY)) {
            nextY += stepY;
          }
        }

        if (targetPosRef.current && nextX === playerRef.current.x && nextY === playerRef.current.y) {
          targetPosRef.current = null;
        }

        playerRef.current = { x: nextX, y: nextY };

        // Report player position update (throttled to every ~250ms or direction change)
        if (timestamp - lastReportedPosTimeRef.current > 250) {
          lastReportedPosTimeRef.current = timestamp;
          onPlayerPositionChange?.({ x: Math.round(nextX), y: Math.round(nextY) }, directionRef.current);
        }

        // Footsteps
        if (timestamp - lastStepTimeRef.current > 250) {
          soundFx.playStep();
          lastStepTimeRef.current = timestamp;
        }

        // Dust puffs
        if (timestamp - lastDustTimeRef.current > 120) {
          lastDustTimeRef.current = timestamp;
          dustParticlesRef.current.push({
            x: playerRef.current.x + (Math.random() - 0.5) * 8,
            y: playerRef.current.y + 4,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.25 - Math.random() * 0.3,
            size: 2 + Math.random() * 2,
            life: 0,
            maxLife: 18 + Math.random() * 8
          });
        }
      }

      // 3. Animation frame timing: 150ms per frame loop & stationary idle tracking
      if (isMoving) {
        lastMovingTimeRef.current = timestamp;
        if (timestamp - lastFrameTimeRef.current > 150) {
          frameIndexRef.current = (frameIndexRef.current + 1) % 4;
          lastFrameTimeRef.current = timestamp;
        }
      } else {
        frameIndexRef.current = 0; // Relaxed idle pose
      }
      const stationaryTime = !isMoving ? (timestamp - lastMovingTimeRef.current) : 0;

      // 4. Proximity & smooth 300ms building glow sequence (80px radius)
      let closestLoc: GameLocation | null = null;
      let minDistance = Infinity;

      for (const loc of LOCATIONS) {
        const dist = Math.hypot(playerRef.current.x - loc.x, playerRef.current.y - loc.y);
        const inRange = dist <= 80;
        if (inRange && dist < minDistance) {
          closestLoc = loc;
          minDistance = dist;
        }

        // Building glow sequence: outline starts glowing at 0ms, increases over 300ms, stays steady, fades over 300ms when leaving
        const currentGlow = buildingGlowRef.current.get(loc.id) || 0;
        const glowDelta = dt / 0.3; // 300ms transition
        const newGlow = inRange ? Math.min(1.0, currentGlow + glowDelta) : Math.max(0.0, currentGlow - glowDelta);
        buildingGlowRef.current.set(loc.id, newGlow);
      }

      if (closestLoc !== nearLocationRef.current) {
        nearLocationRef.current = closestLoc;
        setNearLocation(closestLoc);
        onNearLocationChange(closestLoc);
      }

      // 5. CAMERA SMOOTH FOLLOW & 1000ms INTRO POSITIONING
      const targetCamX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, playerRef.current.x - VIEWPORT_WIDTH / 2));
      const targetCamY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, playerRef.current.y - VIEWPORT_HEIGHT / 2));

      // Over the first 1000ms, camera smoothly positions on the player character
      const lerpSpeed = elapsed < 1000 ? (1 - Math.exp(-4.2 * dt)) : (1 - Math.exp(-5.5 * dt));
      cameraPosRef.current.x += (targetCamX - cameraPosRef.current.x) * lerpSpeed;
      cameraPosRef.current.y += (targetCamY - cameraPosRef.current.y) * lerpSpeed;

      // Hard clamp bounds
      cameraPosRef.current.x = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraPosRef.current.x));
      cameraPosRef.current.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraPosRef.current.y));

      // Subtle camera shake on Git status change (2-3 pixels, 200ms)
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (timestamp < shakeEndTimeRef.current) {
        const shakeProgress = (shakeEndTimeRef.current - timestamp) / 200;
        const shakeMag = shakeProgress * 2.5; // 2-3 pixels
        shakeOffsetX = (Math.random() - 0.5) * 2 * shakeMag;
        shakeOffsetY = (Math.random() - 0.5) * 2 * shakeMag;
      }

      const camX = Math.round(cameraPosRef.current.x + shakeOffsetX);
      const camY = Math.round(cameraPosRef.current.y + shakeOffsetY);

      // ==========================================
      // 6. MULTI-LAYER RENDERING PIPELINE
      // ==========================================
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

      // ----------------------------------------------------
      // LAYER 0: PARALLAX BACKGROUND (20% camera speed)
      // ----------------------------------------------------
      ctx.save();
      const bgParallaxX = -camX * 0.2;
      const bgParallaxY = -camY * 0.2;

      // Atmospheric twilight sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
      skyGrad.addColorStop(0, '#0a0a14');
      skyGrad.addColorStop(0.6, '#18182b');
      skyGrad.addColorStop(1, '#272738');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, 160);

      // Distant mountain silhouettes (scrolling at 20% speed)
      ctx.fillStyle = '#1c192c';
      ctx.beginPath();
      ctx.moveTo(0, 160);
      for (let mx = -200; mx <= VIEWPORT_WIDTH + 200; mx += 80) {
        const peakY = 80 + Math.sin((mx - bgParallaxX) * 0.015) * 40;
        ctx.lineTo(mx + (bgParallaxX % 80), peakY + bgParallaxY * 0.1);
      }
      ctx.lineTo(VIEWPORT_WIDTH, 160);
      ctx.closePath();
      ctx.fill();

      // Distant stars
      for (let s = 0; s < 16; s++) {
        const sx = ((s * 73 - bgParallaxX * 0.5) % VIEWPORT_WIDTH + VIEWPORT_WIDTH) % VIEWPORT_WIDTH;
        const sy = 15 + (s * 17) % 65;
        const alpha = 0.4 + Math.sin(timestamp / 300 + s) * 0.4;
        ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();

      // ----------------------------------------------------
      // LAYER 1: MID-GROUND (Main World Map & Environment)
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(-camX, -camY);

      // A. Base World Map Image
      if (mapImageRef.current) {
        ctx.drawImage(mapImageRef.current, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      } else {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      }

      // B. Animated Living Overlays
      // (1) Waterfalls & Ripples
      const waterfallX = 110;
      const waterfallTop = 260;
      const waterfallHeight = 90;
      for (let st = 0; st < 8; st++) {
        const streamX = waterfallX + st * 4;
        const flowOffset = (timestamp * 0.25 + st * 15) % waterfallHeight;
        ctx.fillStyle = st % 2 === 0 ? '#cffafe' : '#a5f3fc';
        ctx.fillRect(streamX, waterfallTop + flowOffset, 2, 8);
      }
      for (let f = 0; f < 6; f++) {
        const foamX = waterfallX + f * 5 + Math.sin(timestamp / 120 + f) * 2;
        const foamY = waterfallTop + waterfallHeight + Math.cos(timestamp / 100 + f) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(foamX, foamY, 2, 2);
      }
      // Concentric circles emanate from water areas (1 ripple every 2 seconds, expands over 800ms, opacity 100% -> 0%, semi-transparent water blue)
      const waterRippleCycle = timestamp % 2000;
      if (waterRippleCycle < 800) {
        const rippleProgress = waterRippleCycle / 800;
        const rippleRadius = 4 + rippleProgress * 26;
        const rippleAlpha = 1 - rippleProgress;
        const waterSites = [
          { x: 120, y: 370 },
          { x: 620, y: 925 },
          { x: 1220, y: 885 }
        ];
        waterSites.forEach(ws => {
          ctx.strokeStyle = `rgba(56, 189, 248, ${rippleAlpha * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(ws.x, ws.y, rippleRadius, rippleRadius * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();

          if (waterRippleCycle >= 160) {
            const innerProgress = (waterRippleCycle - 160) / 640;
            const innerRadius = 4 + innerProgress * 20;
            const innerAlpha = 1 - innerProgress;
            ctx.strokeStyle = `rgba(56, 189, 248, ${innerAlpha * 0.5})`;
            ctx.beginPath();
            ctx.ellipse(ws.x, ws.y, innerRadius, innerRadius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }

      // (2) Coastal waves
      const oceanWavePhase = timestamp / 600;
      for (let w = 0; w < 3; w++) {
        const waveX = 1220 + w * 40;
        const waveY = 880 + Math.sin(oceanWavePhase + w) * 8;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + w * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(waveX, waveY, 25 + w * 8, -Math.PI * 0.2, Math.PI * 0.4);
        ctx.stroke();
      }

      // (3) Lava Fountain & Living Power Glow (Pulsing intensity: increases over 1s, decreases over 1s, range 50% to 100%, color #ff6b35)
      const shrineCenter = { x: 1230, y: 175 };
      const lavaPulsePhase = (timestamp % 2000) / 2000;
      const lavaBrightness = 0.50 + 0.50 * (Math.sin(lavaPulsePhase * 2 * Math.PI - Math.PI / 2) * 0.5 + 0.5);
      const lavaGlow = ctx.createRadialGradient(
        shrineCenter.x,
        shrineCenter.y,
        8,
        shrineCenter.x,
        shrineCenter.y,
        55 + lavaBrightness * 35
      );
      lavaGlow.addColorStop(0, `rgba(255, 107, 53, ${0.85 * lavaBrightness})`);
      lavaGlow.addColorStop(0.5, `rgba(255, 107, 53, ${0.45 * lavaBrightness})`);
      lavaGlow.addColorStop(1, 'rgba(255, 107, 53, 0)');
      ctx.fillStyle = lavaGlow;
      ctx.beginPath();
      ctx.arc(shrineCenter.x, shrineCenter.y, 90, 0, Math.PI * 2);
      ctx.fill();

      LAVA_BUBBLE_SITES.forEach((site) => {
        const bx = shrineCenter.x + site.ox;
        const by = shrineCenter.y + site.oy;
        const cycle = ((timestamp / 900) + site.phase) % 2.0;

        if (cycle < 1.5) {
          const bRadius = 1.5 + (cycle / 1.5) * 4.5;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bx - 1, by - bRadius * 0.5, 1.5, 1.5);
        } else {
          const popProgress = (cycle - 1.5) / 0.5;
          const popDist = popProgress * 7;
          const alpha = 1 - popProgress;
          ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
          ctx.fillRect(bx + popDist, by, 2, 2);
          ctx.fillRect(bx - popDist * 0.7, by - popDist * 0.7, 2, 2);
          ctx.fillRect(bx, by + popDist, 2, 2);
        }
      });

      for (let s = 0; s < 7; s++) {
        const sparkY = shrineCenter.y - ((timestamp / 8 + s * 22) % 55);
        const sparkX = shrineCenter.x + Math.sin(timestamp / 140 + s * 1.5) * 16;
        ctx.fillStyle = s % 2 === 0 ? '#fbbf24' : '#ef4444';
        ctx.fillRect(sparkX, sparkY, 2.5, 2.5);
      }

      // (4) Torches (exact 4-frame sequence: 1: full brightness, 2: 90%, 3: 80%, 4: 95%, 300ms per frame)
      const torchFrame = Math.floor((timestamp / 300) % 4);
      const torchBrightness = [1.0, 0.90, 0.80, 0.95][torchFrame];
      TORCH_LOCATIONS.forEach((t) => {
        const glowRadius = 24 + torchBrightness * 6;
        const glow = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, glowRadius);
        glow.addColorStop(0, `rgba(251, 191, 36, ${0.85 * torchBrightness})`);
        glow.addColorStop(0.5, `rgba(245, 158, 11, ${0.35 * torchBrightness})`);
        glow.addColorStop(1, 'rgba(217, 119, 6, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#44403c';
        ctx.fillRect(t.x - 2, t.y + 2, 4, 6);

        ctx.globalAlpha = torchBrightness;
        if (torchFrame === 0) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(t.x - 2, t.y - 1, 4, 3);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(t.x - 1.5, t.y - 4, 3, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(t.x - 1, t.y - 7, 2, 4);
        } else if (torchFrame === 1) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(t.x - 2.5, t.y - 1, 4, 3);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(t.x - 3, t.y - 4, 3.5, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(t.x - 2.5, t.y - 8, 2, 3);
          ctx.fillRect(t.x, t.y - 9, 1.5, 1.5);
        } else if (torchFrame === 2) {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(t.x - 1.5, t.y - 1, 4, 3);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(t.x - 1, t.y - 4, 3.5, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(t.x, t.y - 7, 2, 4);
        } else {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(t.x - 2, t.y - 1, 4, 3);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(t.x - 2, t.y - 4, 4, 4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(t.x - 1, t.y - 8, 2, 3.5);
        }
        ctx.globalAlpha = 1.0;
      });

      // (5) Ambient Wind Leaves
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.4;
        if (p.life > p.maxLife || p.x > WORLD_WIDTH || p.y > WORLD_HEIGHT) {
          p.x = Math.random() * WORLD_WIDTH * 0.4;
          p.y = Math.random() * WORLD_HEIGHT * 0.6;
          p.life = 0;
        }

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.65;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        const swayOffset = Math.sin(timestamp / 300 + p.x) * 1.5;
        ctx.fillRect(p.x + swayOffset, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      // C. NPC & BUILDING INTERACTION ZONES (80px radius, 300ms glow fade-in/out, "Press E to talk")
      for (const loc of LOCATIONS) {
        const glowIntensity = buildingGlowRef.current.get(loc.id) || 0;

        if (glowIntensity > 0.01) {
          ctx.save();
          ctx.globalAlpha = glowIntensity;

          // Visual indicator when in range: Building glows with subtle cyan outline
          ctx.strokeStyle = '#4dd0e1';
          ctx.shadowColor = '#4dd0e1';
          ctx.shadowBlur = 14 * glowIntensity;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            loc.x - loc.width / 2 - 4,
            loc.y - loc.height / 2 - 4,
            loc.width + 8,
            loc.height + 8
          );

          // Floating prompt: "Press E to talk"
          let badgeX = loc.x;
          let badgeY = loc.y - loc.height / 2 - 18 + Math.sin(timestamp / 180) * 3;

          // For the Elder, move prompt to the right side near the Elder to avoid overlapping top code banner
          if (loc.id === 'elder') {
            badgeX = loc.x + loc.width / 2 + 50;
            badgeY = loc.y - 10 + Math.sin(timestamp / 180) * 3;
          }

          ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
          ctx.strokeStyle = '#4dd0e1';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);

          const promptText = 'Press E to talk';
          ctx.font = 'bold 11px "Courier New", monospace';
          const textWidth = ctx.measureText(promptText).width;
          const boxW = textWidth + 18;
          const boxH = 22;

          ctx.fillRect(badgeX - boxW / 2, badgeY - boxH / 2, boxW, boxH);
          ctx.strokeRect(badgeX - boxW / 2, badgeY - boxH / 2, boxW, boxH);

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(promptText, badgeX, badgeY);

          ctx.restore();
        }
      }

      // C2. DRAW SPECIFIC NPC & FACILITY SPRITES IN WORLD SPACE
      // 1. Commit Station (Anvil of Staged Changes) at x: 480, y: 690
      ctx.save();
      const csX = 480;
      const csY = 690;
      // Stone block base
      ctx.fillStyle = '#292524';
      ctx.fillRect(csX - 16, csY, 32, 14);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(csX - 14, csY + 2, 28, 4);

      // Iron Anvil
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(csX - 12, csY - 10, 24, 10);
      ctx.fillStyle = '#57534e';
      ctx.fillRect(csX - 14, csY - 14, 28, 5); // anvil horn & face
      // Hammer on anvil
      ctx.fillStyle = '#d97706';
      ctx.fillRect(csX + 2, csY - 18, 4, 10);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(csX, csY - 20, 8, 4);

      // Emerald forge sparks
      for (let sp = 0; sp < 3; sp++) {
        const sparkPhase = (timestamp / 8 + sp * 35) % 40;
        const sx = csX + Math.sin(timestamp / 150 + sp) * 12;
        const sy = csY - 14 - sparkPhase;
        const sAlpha = 1 - sparkPhase / 40;
        ctx.fillStyle = `rgba(52, 211, 153, ${sAlpha})`;
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();

      // 2. Chronomancer Elena (Mistress of Parallel Branches) at x: 270, y: 430
      ctx.save();
      const ceX = 270;
      const ceY = 430;
      // Rotating timeline branch ring
      const ringAngle = timestamp / 1000;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ceX, ceY - 10, 18, ringAngle, ringAngle + Math.PI * 1.6);
      ctx.stroke();

      // Violet Robed NPC Sprite
      ctx.fillStyle = '#581c87'; // robe
      ctx.fillRect(ceX - 7, ceY - 16, 14, 22);
      ctx.fillStyle = '#9333ea'; // mantle
      ctx.fillRect(ceX - 9, ceY - 18, 18, 8);
      ctx.fillStyle = '#fde047'; // golden hair / hood trim
      ctx.fillRect(ceX - 5, ceY - 24, 10, 7);
      ctx.fillStyle = '#fbcfe8'; // face
      ctx.fillRect(ceX - 4, ceY - 21, 8, 5);
      // Staff with glowing branch orb
      ctx.fillStyle = '#78350f'; // staff
      ctx.fillRect(ceX + 9, ceY - 26, 2.5, 30);
      ctx.fillStyle = '#e879f9'; // orb
      ctx.beginPath();
      ctx.arc(ceX + 10, ceY - 28, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Merge Conflict Boss at x: 700, y: 470
      ctx.save();
      const mbX = 700;
      const mbY = 470;
      if (gitStatus === 'conflict') {
        // Active menacing Boss!
        const bossPulse = Math.sin(timestamp / 120) * 3;
        const bossGlow = ctx.createRadialGradient(mbX, mbY - 15, 5, mbX, mbY - 15, 45);
        bossGlow.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        bossGlow.addColorStop(0.6, 'rgba(185, 28, 28, 0.4)');
        bossGlow.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = bossGlow;
        ctx.beginPath();
        ctx.arc(mbX, mbY - 15, 45, 0, Math.PI * 2);
        ctx.fill();

        // Demonic Obsidian Core
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(mbX - 16, mbY - 32 + bossPulse, 32, 34);

        // Crimson Horns
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(mbX - 14, mbY - 30 + bossPulse);
        ctx.lineTo(mbX - 24, mbY - 48 + bossPulse);
        ctx.lineTo(mbX - 8, mbY - 32 + bossPulse);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(mbX + 14, mbY - 30 + bossPulse);
        ctx.lineTo(mbX + 24, mbY - 48 + bossPulse);
        ctx.lineTo(mbX + 8, mbY - 32 + bossPulse);
        ctx.fill();

        // Glowing red horizontal eye slits
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(mbX - 10, mbY - 22 + bossPulse, 6, 2.5);
        ctx.fillRect(mbX + 4, mbY - 22 + bossPulse, 6, 2.5);

        // Floating conflict glyphs
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('<<<<<<< HEAD', mbX - 35, mbY - 55 + Math.sin(timestamp / 200) * 4);
        ctx.fillText('=======', mbX - 18, mbY - 44);
        ctx.fillText('>>>>>>> INCOMING', mbX - 42, mbY - 33 - Math.sin(timestamp / 200) * 4);
      } else {
        // Dormant ancient seal on ground
        ctx.strokeStyle = 'rgba(77, 208, 225, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mbX, mbY, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(77, 208, 225, 0.15)';
        ctx.fillRect(mbX - 4, mbY - 4, 8, 8);
      }
      ctx.restore();

      // D. DRAW WALKING DUST PARTICLES
      for (let i = dustParticlesRef.current.length - 1; i >= 0; i--) {
        const dp = dustParticlesRef.current[i];
        dp.x += dp.vx;
        dp.y += dp.vy;
        dp.life++;
        if (dp.life >= dp.maxLife) {
          dustParticlesRef.current.splice(i, 1);
          continue;
        }
        const progress = dp.life / dp.maxLife;
        const alpha = (1 - progress) * 0.45;
        ctx.fillStyle = `rgba(214, 211, 209, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, dp.size * (1 + progress * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // E. PROGRESSION INDICATORS (Clean serenity / Dirty corruption / Ready to Push path)
      // (1) Ready to Push Path Illumination (Ahead of Remote)
      if (gitStatus === 'ahead') {
        ctx.save();
        const waypoints = [
          { x: 740, y: 530 },
          { x: 820, y: 460 },
          { x: 910, y: 390 },
          { x: 1010, y: 320 },
          { x: 1110, y: 250 },
          { x: 1200, y: 195 },
          { x: 760, y: 640 },
          { x: 860, y: 700 },
          { x: 970, y: 760 },
          { x: 1090, y: 820 },
          { x: 1210, y: 880 }
        ];

        waypoints.forEach((wp, idx) => {
          const pulse = Math.sin(timestamp / 250 + idx * 0.8) * 0.5 + 0.5;
          const runeGlow = ctx.createRadialGradient(wp.x, wp.y, 2, wp.x, wp.y, 16 + pulse * 6);
          runeGlow.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
          runeGlow.addColorStop(0.6, 'rgba(14, 165, 233, 0.35)');
          runeGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.fillStyle = runeGlow;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, 20, 0, Math.PI * 2);
          ctx.fill();

          // Sacred rune diamond stone
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(wp.x, wp.y - 6);
          ctx.lineTo(wp.x + 5, wp.y);
          ctx.lineTo(wp.x, wp.y + 6);
          ctx.lineTo(wp.x - 5, wp.y);
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(wp.x - 1, wp.y - 1, 2, 2);
        });
        ctx.restore();
      }

      // (2) Dirty Tree Corruption Embers
      if (gitStatus === 'dirty' || gitStatus === 'conflict') {
        const dirtyLocations = [
          { x: 338, y: 616 }, // src/ Cottage
          { x: 531, y: 834 }  // package.json Tavern
        ];
        dirtyLocations.forEach((dl, dIdx) => {
          for (let e = 0; e < 4; e++) {
            const emberLife = (timestamp / 10 + e * 35 + dIdx * 70) % 55;
            const emberX = dl.x + Math.sin(timestamp / 140 + e) * 20;
            const emberY = dl.y - emberLife;
            const emberAlpha = 1 - emberLife / 55;
            ctx.fillStyle = gitStatus === 'conflict'
              ? `rgba(239, 68, 68, ${emberAlpha})`
              : `rgba(245, 158, 11, ${emberAlpha})`;
            ctx.fillRect(emberX, emberY, 2.5, 2.5);
          }
        });
      }

      // (3) Clean Tree Serenity Fireflies
      if (gitStatus === 'clean') {
        const fireflySpots = [
          { x: 680, y: 520 },
          { x: 740, y: 620 },
          { x: 450, y: 480 },
          { x: 920, y: 500 },
          { x: 600, y: 720 },
          { x: 800, y: 740 }
        ];
        fireflySpots.forEach((spot, idx) => {
          const fx = spot.x + Math.sin(timestamp / 700 + idx * 2) * 25;
          const fy = spot.y + Math.cos(timestamp / 600 + idx * 1.5) * 15;
          const fAlpha = (Math.sin(timestamp / 350 + idx) + 1) * 0.45;
          ctx.fillStyle = `rgba(110, 231, 183, ${fAlpha})`;
          ctx.fillRect(fx, fy, 2.5, 2.5);
          ctx.fillStyle = `rgba(167, 243, 208, ${fAlpha * 0.4})`;
          ctx.fillRect(fx - 1, fy - 1, 4.5, 4.5);
        });
      }

      // (4) Ready to Commit Glow Effect around Player
      if (gitStatus === 'dirty' || gitStatus === 'conflict') {
        ctx.save();
        const auraPulse = Math.sin(timestamp / 180) * 4;
        const auraColor = gitStatus === 'conflict' ? 'rgba(239, 68, 68, ' : 'rgba(245, 158, 11, ';
        ctx.strokeStyle = auraColor + '0.7)';
        ctx.fillStyle = auraColor + '0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(playerRef.current.x, playerRef.current.y + 14, 20 + auraPulse, 10 + auraPulse * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      }

      // F. DRAW GORILLAZ CHARACTER SPRITE (with movement tilt, breathing, blinking, and interaction pose!)
      if (characterSpriteRef.current) {
        characterSpriteRef.current.draw(
          ctx,
          playerRef.current.x,
          playerRef.current.y,
          directionRef.current,
          isMovingRef.current,
          frameIndexRef.current,
          48,
          timestamp,
          tiltAngleRef.current,
          verticalBob,
          stationaryTime,
          interactionBobRef.current > 0.1
        );
      }

      // G. DRAW CELEBRATION PARTICLES (Post-Commit Burst)
      for (let i = celebrationParticlesRef.current.length - 1; i >= 0; i--) {
        const cp = celebrationParticlesRef.current[i];
        cp.x += cp.vx;
        cp.y += cp.vy;
        cp.vy += 0.08; // gravity
        cp.life++;
        if (cp.life >= cp.maxLife) {
          celebrationParticlesRef.current.splice(i, 1);
          continue;
        }
        const alpha = 1 - cp.life / cp.maxLife;
        ctx.fillStyle = cp.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(cp.x - cp.size / 2, cp.y - cp.size / 2, cp.size, cp.size);
      }
      ctx.globalAlpha = 1.0;

      // H. DRAW PLAYER NAME TAG OVER CHARACTER
      ctx.save();
      const tagY = playerRef.current.y - 52 - verticalBob;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(28, 25, 23, 0.85)';
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.8)';
      ctx.lineWidth = 1;
      const name = (playerName || 'HERO').toUpperCase();
      const nw = ctx.measureText(name).width + 10;
      ctx.fillRect(playerRef.current.x - nw / 2, tagY - 7, nw, 14);
      ctx.strokeRect(playerRef.current.x - nw / 2, tagY - 7, nw, 14);
      ctx.fillStyle = '#fef3c7';
      ctx.fillText(name, playerRef.current.x, tagY + 3);
      ctx.restore();

      // G. WORLD BOUNDARY DARK VIGNETTE FADE AT WORLD EDGES
      const edgeDepth = 75;

      const topFade = ctx.createLinearGradient(0, 0, 0, edgeDepth);
      topFade.addColorStop(0, '#09090b');
      topFade.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, WORLD_WIDTH, edgeDepth);

      const botFade = ctx.createLinearGradient(0, WORLD_HEIGHT - edgeDepth, 0, WORLD_HEIGHT);
      botFade.addColorStop(0, 'rgba(9, 9, 11, 0)');
      botFade.addColorStop(1, '#09090b');
      ctx.fillStyle = botFade;
      ctx.fillRect(0, WORLD_HEIGHT - edgeDepth, WORLD_WIDTH, edgeDepth);

      const leftFade = ctx.createLinearGradient(0, 0, edgeDepth, 0);
      leftFade.addColorStop(0, '#09090b');
      leftFade.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = leftFade;
      ctx.fillRect(0, 0, edgeDepth, WORLD_HEIGHT);

      const rightFade = ctx.createLinearGradient(WORLD_WIDTH - edgeDepth, 0, WORLD_WIDTH, 0);
      rightFade.addColorStop(0, 'rgba(9, 9, 11, 0)');
      rightFade.addColorStop(1, '#09090b');
      ctx.fillStyle = rightFade;
      ctx.fillRect(WORLD_WIDTH - edgeDepth, 0, edgeDepth, WORLD_HEIGHT);

      ctx.restore();

      // ----------------------------------------------------
      // LAYER 2: FOREGROUND & DEPTH PARALLAX (110% camera speed)
      // ----------------------------------------------------
      ctx.save();
      FOREGROUND_ELEMENTS.forEach((fg) => {
        const fgScreenX = fg.x - camX - (camX * 0.1);
        const fgScreenY = fg.y - camY - (camY * 0.1);

        if (fgScreenX >= -60 && fgScreenX <= VIEWPORT_WIDTH + 60 && fgScreenY >= -60 && fgScreenY <= VIEWPORT_HEIGHT + 60) {
          if (fg.type === 'grass') {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(fgScreenX, fgScreenY, 3 * fg.scale, 10 * fg.scale);
            ctx.fillRect(fgScreenX + 4 * fg.scale, fgScreenY - 2 * fg.scale, 3 * fg.scale, 12 * fg.scale);
            ctx.fillRect(fgScreenX + 8 * fg.scale, fgScreenY + 2 * fg.scale, 3 * fg.scale, 8 * fg.scale);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(fgScreenX + 1 * fg.scale, fgScreenY, 1.5 * fg.scale, 4 * fg.scale);
            ctx.fillRect(fgScreenX + 5 * fg.scale, fgScreenY - 2 * fg.scale, 1.5 * fg.scale, 5 * fg.scale);
          }
        }
      });
      ctx.restore();

      // ----------------------------------------------------
      // LAYER 3: GIT STATUS AESTHETIC & CORRUPTION OVERLAYS
      // ----------------------------------------------------
      if (gitStatus === 'conflict') {
        // Merge conflict: Red flashing, world corruption visual
        const conflictPulse = (Math.sin(timestamp / 160) + 1) * 0.5;
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + conflictPulse * 0.08})`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        // Corruption scanlines
        for (let g = 0; g < 3; g++) {
          const gy = (timestamp * 0.25 + g * 190) % VIEWPORT_HEIGHT;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(0, gy, VIEWPORT_WIDTH, 2);
        }
        ctx.restore();
      } else if (gitStatus === 'ahead') {
        // Ahead of remote: Blue glow, synchronization theme
        const bluePulse = (Math.sin(timestamp / 350) + 1) * 0.5;
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${0.025 + bluePulse * 0.035})`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.restore();
      }

      // ----------------------------------------------------
      // LAYER 4: SCREEN FADE-IN OVER 500ms (Black to game world)
      // ----------------------------------------------------
      if (elapsed < 500) {
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 1 - elapsed / 500)})`;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [externalMoveDir, onNearLocationChange, onInteractLocation, gitStatus, onMovementChange]);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full h-full flex items-center justify-center bg-stone-950 p-2 sm:p-4 overflow-hidden cursor-crosshair select-none"
    >
      {/* 960x640 Widescreen Retro Pixel Viewport */}
      <div
        id="game-viewport-frame"
        className="relative flex items-center justify-center rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border-4 border-stone-800 bg-black"
        style={{
          width: 'min(960px, 100%)',
          aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}`
        }}
      >
        <canvas
          ref={canvasRef}
          id="codequest-canvas"
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain pixelated"
          style={{
            imageRendering: 'pixelated'
          }}
        />

        {/* Floating Proximity Prompt for quick click/touch on mobile */}
        {nearLocation && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <button
              id="proximity-interact-button"
              onClick={() => {
                interactionBobRef.current = 1.0;
                soundFx.playInteract();
                onInteractLocation(nearLocation);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900/90 hover:bg-stone-800 border-2 border-[#4dd0e1] rounded-lg text-white font-mono text-xs shadow-2xl transition"
              style={{
                fontFamily: '"Courier New", Courier, monospace',
                boxShadow: '0 0 15px rgba(77, 208, 225, 0.4)'
              }}
            >
              <span className="px-1.5 py-0.5 bg-cyan-950 text-[#4dd0e1] border border-[#4dd0e1] rounded font-bold">[E]</span>
              <span>Talk to {nearLocation.name}</span>
            </button>
          </div>
        )}

        {/* Subtle retro CRT scanline & border vignette styling */}
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.7)'
          }}
        />
      </div>
    </div>
  );
};
