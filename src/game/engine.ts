import { drawSkinPattern, drawVipOuterGlow, getDynamicSkinStroke, SKINS, SKIN_MAP } from './skins';
import { soundFX } from './sound';
import {
  ArenaTheme,
  Cell,
  EjectedMass,
  FoodPellet,
  GameConfig,
  GameMode,
  HudSnapshot,
  LeaderboardEntry,
  MinimapDot,
  NetStatePayload,
  OwnerPowers,
  Particle,
  Ripple,
  SkinId,
  SkinLevel,
  Virus,
} from './types';

export const WORLD_SIZE = 4200;
const MAX_CELLS_PER_OWNER = 16;
const MAX_CELL_MASS = 25000;
const MAX_EJECTED_COUNT = 260;
const TARGET_FOOD_COUNT = 640;
const TARGET_BOT_COUNT = 36;
const TARGET_VIRUS_COUNT = 24;
const MAX_VIRUS_COUNT = 34;

const PELLET_COLORS = [
  '#F43F5E',
  '#F59E0B',
  '#10B981',
  '#0EA5E9',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

const BOT_NAMES = [
  'شێرە',
  'ئەستێرە',
  'کوردۆ',
  'ڕەشەبا',
  'پڵنگ',
  'زانا',
  'خێرا',
  'نێچیر',
  'ئاسۆ',
  'باوەڕ',
  'هەڵۆ',
  'بروسکە',
  'چیا',
  'دەریا',
  'کانی',
  'ڕێباز',
  'سۆران',
  'ئاگر',
  'تیشک',
  'بەفرین',
  'هێمن',
  'لاوین',
  'دیلان',
  'ئارام',
  'شنە',
  'بەهێز',
  'ڕووناک',
  'ژیار',
  'پاشا',
  'شاخەوان',
  'ڕاوچی',
  'گورج',
  'بەردین',
  'چالاک',
  'تۆفان',
  'زاگرۆس',
  'هەوراز',
  'ژیلەمۆ',
  'بەختیار',
  'ئاشتی',
  'سەرکەوت',
  'بڵند',
  'داستان',
  'کاروان',
  'سەردار',
  'شەپۆل',
];

let uidCounter = 1;
function nextId(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}`;
}

export function massToRadius(mass: number): number {
  return 5.4 * Math.sqrt(Math.max(mass, 1)) + 4;
}

export class AgarEngine {
  public cells: Cell[] = [];
  public foods: FoodPellet[] = [];
  public ejected: EjectedMass[] = [];
  public viruses: Virus[] = [];
  public particles: Particle[] = [];
  public ripples: Ripple[] = [];

  public cameraX = WORLD_SIZE / 2;
  public cameraY = WORLD_SIZE / 2;
  public cameraZoom = 1;
  public userZoomMultiplier = 1;

  public pointerScreenX = 0;
  public pointerScreenY = 0;
  public viewportWidth = 1280;
  public viewportHeight = 720;

  public playerAlive = false;
  public peakMass = 0;
  public cellsEaten = 0;
  public foodsEaten = 0;
  public splitsUsed = 0;
  public elapsedSeconds = 0;
  public killerName: string | null = null;

  private time = 0;
  private mode: GameMode = 'classic';
  private theme: ArenaTheme = 'light';
  private showMassOnCells = true;
  private botCounter = 0;
  private lastPlayerAimAngle = 0;
  private botBrains = new Map<
    string,
    {
      targetX: number;
      targetY: number;
      cooldown: number;
      ejectCooldown: number;
    }
  >();
  private onPlayerDeath?: (snapshot: HudSnapshot) => void;

  public ownerPowers: OwnerPowers = {
    godMode: false,
    virusShield: false,
    speedMultiplier: 1,
    foodMagnet: false,
    autoFastMerge: false,
  };

  public isNetworkMode = false;
  private netCellTargets = new Map<string, { x: number; y: number; radius: number; mass: number }>();
  private netEjectedTargets = new Map<string, { x: number; y: number }>();
  private netHudSnapshot: HudSnapshot | null = null;
  private lastNetMass = 0;
  private lastNetCellCount = 0;

  constructor(onPlayerDeath?: (snapshot: HudSnapshot) => void) {
    this.onPlayerDeath = onPlayerDeath;
    this.initArena();
  }

  public setUserZoom(multiplier: number) {
    this.userZoomMultiplier = clamp(multiplier, 0.55, 1.65);
  }

  public setNetworkMode(enabled: boolean) {
    this.isNetworkMode = enabled;
    this.netCellTargets.clear();
    this.netEjectedTargets.clear();
    this.netHudSnapshot = null;
    this.lastNetMass = 0;
    this.lastNetCellCount = 0;
    if (enabled) {
      this.cells = [];
      this.foods = [];
      this.ejected = [];
      this.viruses = [];
      this.particles = [];
      this.ripples = [];
      this.playerAlive = true;
    } else {
      this.initArena();
    }
  }

  public applyNetworkState(payload: NetStatePayload): HudSnapshot {
    const existingById = new Map(this.cells.map((c) => [c.id, c]));
    const nextCells: Cell[] = [];
    const nextTargets = new Map<string, { x: number; y: number; radius: number; mass: number }>();

    for (const nc of payload.cells) {
      const prev = existingById.get(nc.id);
      const isMe = nc.ownerId === payload.playerId;
      nextTargets.set(nc.id, { x: nc.x, y: nc.y, radius: nc.radius, mass: nc.mass });

      if (prev) {
        if (isMe && nc.mass > prev.mass + 2) {
          prev.eatPulse = 0.35;
        }
        prev.name = nc.name;
        prev.skinId = nc.skinId;
        prev.skinLevel = nc.skinLevel ?? 1;
        prev.isPlayer = isMe;
        prev.isHuman = nc.isHuman;
        prev.mass = nc.mass;
        nextCells.push(prev);
      } else {
        nextCells.push({
          id: nc.id,
          ownerId: nc.ownerId,
          name: nc.name,
          isPlayer: isMe,
          isHuman: nc.isHuman,
          skinId: nc.skinId,
          skinLevel: nc.skinLevel ?? 1,
          x: nc.x,
          y: nc.y,
          vx: 0,
          vy: 0,
          boostVx: 0,
          boostVy: 0,
          mass: nc.mass,
          radius: nc.radius,
          mergeTimer: 0,
          wobblePhase: Math.random() * Math.PI * 2,
          eatPulse: 0.25,
        });
      }
    }

    const myCells = nextCells.filter((c) => c.isPlayer);
    if (this.lastNetMass > 0 && payload.mass > this.lastNetMass) {
      if (payload.mass - this.lastNetMass > 14) {
        soundFX.playEatCell();
      } else {
        soundFX.playEatPellet(payload.mass - this.lastNetMass >= 4.5);
      }
    }
    if (this.lastNetCellCount > 0 && myCells.length > this.lastNetCellCount) {
      soundFX.playSplit();
    }
    this.lastNetMass = payload.mass;
    this.lastNetCellCount = myCells.length;

    this.cells = nextCells;
    this.netCellTargets = nextTargets;
    this.playerAlive = myCells.length > 0;

    this.foods = payload.foods.map((f) => ({
      id: f.id,
      x: f.x,
      y: f.y,
      mass: f.g ? 5 : 1.4,
      radius: f.r,
      color: f.c,
      isGolden: f.g,
      pulseOffset: (f.x + f.y) * 0.01,
    }));

    const prevEjectedById = new Map(this.ejected.map((e) => [e.id, e]));
    const nextEjectedTargets = new Map<string, { x: number; y: number }>();
    this.ejected = payload.ejected.map((e) => {
      nextEjectedTargets.set(e.id, { x: e.x, y: e.y });
      const prev = prevEjectedById.get(e.id);
      if (prev) {
        prev.radius = e.r;
        prev.color = e.c;
        prev.stroke = e.s;
        return prev;
      }
      return {
        id: e.id,
        ownerId: '',
        x: e.x,
        y: e.y,
        vx: 0,
        vy: 0,
        mass: 14,
        radius: e.r,
        color: e.c,
        stroke: e.s,
        age: 0,
      };
    });
    this.netEjectedTargets = nextEjectedTargets;

    this.viruses = payload.viruses.map((v) => ({
      id: v.id,
      x: v.x,
      y: v.y,
      vx: 0,
      vy: 0,
      mass: 100,
      radius: v.r,
      feedCount: 0,
      lastFeedAngle: 0,
      pulsePhase: (v.x + v.y) * 0.01,
    }));

    const liveScore = Math.round(
      payload.peakMass * 2 + payload.cellsEaten * 85 + payload.elapsedSeconds * 1.5
    );
    const snapshot: HudSnapshot = {
      mass: payload.mass,
      peakMass: payload.peakMass,
      score: liveScore,
      rank: payload.rank,
      totalPlayers: payload.totalPlayers,
      cellsEaten: payload.cellsEaten,
      cellCount: myCells.length,
      elapsedSeconds: payload.elapsedSeconds,
      leaderboard: payload.leaderboard.slice(0, 5),
      minimapDots: payload.minimapDots,
      worldSize: WORLD_SIZE,
      canSplit: payload.canSplit,
      canEject: payload.canEject,
      killerName: null,
      onlinePlayers: payload.onlinePlayers,
      roomId: payload.roomId,
    };
    this.netHudSnapshot = snapshot;
    return snapshot;
  }

  public setConfig(config: Pick<GameConfig, 'mode' | 'theme' | 'showMassOnCells'>) {
    this.mode = config.mode;
    this.theme = config.theme;
    this.showMassOnCells = config.showMassOnCells;
  }

  public setViewport(width: number, height: number) {
    this.viewportWidth = Math.max(width, 1);
    this.viewportHeight = Math.max(height, 1);
  }

  public setPointerScreen(x: number, y: number) {
    this.pointerScreenX = x;
    this.pointerScreenY = y;
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    if (Math.hypot(x - cx, y - cy) > 22) {
      this.lastPlayerAimAngle = Math.atan2(y - cy, x - cx);
    }
  }

  public initArena() {
    this.cells = [];
    this.foods = [];
    this.ejected = [];
    this.viruses = [];
    this.particles = [];
    this.ripples = [];
    this.botBrains.clear();
    this.playerAlive = false;
    this.peakMass = 0;
    this.cellsEaten = 0;
    this.foodsEaten = 0;
    this.splitsUsed = 0;
    this.elapsedSeconds = 0;
    this.killerName = null;

    for (let i = 0; i < TARGET_FOOD_COUNT; i++) {
      this.spawnFood();
    }
    for (let i = 0; i < TARGET_VIRUS_COUNT; i++) {
      this.spawnVirus();
    }
    for (let i = 0; i < TARGET_BOT_COUNT; i++) {
      this.spawnBot(true);
    }

    this.cameraX = WORLD_SIZE / 2;
    this.cameraY = WORLD_SIZE / 2;
    this.cameraZoom = 0.72;
  }

  public spawnPlayer(config: GameConfig, startMassBonus = 0, skinLevel: SkinLevel = 1) {
    this.setConfig(config);
    // Remove any leftover player cells
    this.cells = this.cells.filter((c) => !c.isPlayer);

    const safePos = this.findSafeSpawn(180);
    const baseStartMass = this.mode === 'blitz' ? 42 : this.mode === 'merge' ? 32 : 24;
    const startMass = baseStartMass + Math.max(0, startMassBonus);
    const playerCell: Cell = {
      id: nextId('p'),
      ownerId: 'player',
      name: config.nickname.trim() || 'یاریزان',
      isPlayer: true,
      skinId: config.skinId,
      skinLevel,
      x: safePos.x,
      y: safePos.y,
      vx: 0,
      vy: 0,
      boostVx: 0,
      boostVy: 0,
      mass: startMass,
      radius: massToRadius(startMass),
      mergeTimer: 0,
      wobblePhase: Math.random() * Math.PI * 2,
      eatPulse: 0,
    };

    this.cells.push(playerCell);
    this.playerAlive = true;
    this.peakMass = startMass;
    this.cellsEaten = 0;
    this.foodsEaten = 0;
    this.splitsUsed = 0;
    this.elapsedSeconds = 0;
    this.killerName = null;
    this.cameraX = safePos.x;
    this.cameraY = safePos.y;
    this.cameraZoom = 1.05;
  }

  private findSafeSpawn(padding: number): { x: number; y: number } {
    let best = {
      x: padding + Math.random() * (WORLD_SIZE - padding * 2),
      y: padding + Math.random() * (WORLD_SIZE - padding * 2),
    };
    let bestMinDist = -1;

    for (let attempt = 0; attempt < 16; attempt++) {
      const x = padding + Math.random() * (WORLD_SIZE - padding * 2);
      const y = padding + Math.random() * (WORLD_SIZE - padding * 2);
      let minDist = Infinity;

      for (const c of this.cells) {
        if (c.mass < 35) continue;
        const d = Math.hypot(c.x - x, c.y - y) - c.radius;
        if (d < minDist) minDist = d;
      }
      for (const v of this.viruses) {
        const d = Math.hypot(v.x - x, v.y - y) - v.radius;
        if (d < minDist) minDist = d;
      }

      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        best = { x, y };
      }
      if (minDist > 360) break;
    }

    return best;
  }

  private spawnFood() {
    const isGolden = Math.random() < 0.045;
    const mass = isGolden ? 4 : 1;
    const color = isGolden
      ? '#FACC15'
      : PELLET_COLORS[Math.floor(Math.random() * PELLET_COLORS.length)];

    this.foods.push({
      id: nextId('f'),
      x: 40 + Math.random() * (WORLD_SIZE - 80),
      y: 40 + Math.random() * (WORLD_SIZE - 80),
      mass,
      radius: isGolden ? 10.5 : 6.2 + Math.random() * 1.6,
      color,
      isGolden,
      pulseOffset: Math.random() * Math.PI * 2,
    });
  }

  private spawnVirus(x?: number, y?: number, vx = 0, vy = 0) {
    const pos = x !== undefined && y !== undefined ? { x, y } : this.findSafeSpawn(180);
    const mass = 100;
    this.viruses.push({
      id: nextId('v'),
      x: pos.x,
      y: pos.y,
      vx,
      vy,
      mass,
      radius: massToRadius(mass),
      feedCount: 0,
      lastFeedAngle: 0,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  private spawnBot(initial = false) {
    this.botCounter += 1;
    const ownerId = `bot_${this.botCounter}`;
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const botSkinPool = SKINS.filter((s) => !s.seasonExclusive);
    const skin = botSkinPool[Math.floor(Math.random() * botSkinPool.length)] || SKINS[0];
    const pos = this.findSafeSpawn(160);

    let mass = 65 + Math.random() * 75;
    if (initial) {
      const roll = Math.random();
      if (roll > 0.84) mass = 680 + Math.random() * 520;
      else if (roll > 0.52) mass = 280 + Math.random() * 280;
      else if (roll > 0.20) mass = 115 + Math.random() * 135;
      else mass = 45 + Math.random() * 55;
    } else {
      const roll = Math.random();
      if (roll > 0.72) mass = 220 + Math.random() * 200;
      else if (roll > 0.28) mass = 95 + Math.random() * 115;
      else mass = 38 + Math.random() * 52;
    }

    this.cells.push({
      id: nextId('b'),
      ownerId,
      name,
      isPlayer: false,
      skinId: skin.id,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      boostVx: 0,
      boostVy: 0,
      mass,
      radius: massToRadius(mass),
      mergeTimer: 0,
      wobblePhase: Math.random() * Math.PI * 2,
      eatPulse: 0,
      aiTargetX: Math.random() * WORLD_SIZE,
      aiTargetY: Math.random() * WORLD_SIZE,
      aiCooldown: 0,
    });
  }

  public isPointerCentered(): boolean {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    return Math.hypot(this.pointerScreenX - cx, this.pointerScreenY - cy) <= 22;
  }

  public getPointerWorld(): { x: number; y: number } {
    if (this.isPointerCentered()) {
      const playerCells = this.cells.filter((c) => c.isPlayer);
      if (playerCells.length > 0) {
        let total = 0;
        let sx = 0;
        let sy = 0;
        for (const c of playerCells) {
          total += c.mass;
          sx += c.x * c.mass;
          sy += c.y * c.mass;
        }
        return { x: sx / total, y: sy / total };
      }
      return { x: this.cameraX, y: this.cameraY };
    }
    const dx = (this.pointerScreenX - this.viewportWidth / 2) / this.cameraZoom;
    const dy = (this.pointerScreenY - this.viewportHeight / 2) / this.cameraZoom;
    return {
      x: this.cameraX + dx,
      y: this.cameraY + dy,
    };
  }

  public splitPlayer() {
    if (!this.playerAlive) return;
    let targetX = 0;
    let targetY = 0;
    if (this.isPointerCentered()) {
      const playerCells = this.cells.filter((c) => c.isPlayer);
      let cx = this.cameraX;
      let cy = this.cameraY;
      if (playerCells.length > 0) {
        let total = 0;
        let sx = 0;
        let sy = 0;
        for (const c of playerCells) {
          total += c.mass;
          sx += c.x * c.mass;
          sy += c.y * c.mass;
        }
        cx = sx / total;
        cy = sy / total;
      }
      targetX = cx + Math.cos(this.lastPlayerAimAngle) * 420;
      targetY = cy + Math.sin(this.lastPlayerAimAngle) * 420;
    } else {
      const pointer = this.getPointerWorld();
      targetX = pointer.x;
      targetY = pointer.y;
    }

    const didSplit = this.splitOwner('player', targetX, targetY);
    if (didSplit) {
      this.splitsUsed += 1;
      soundFX.playSplit();
      const playerCells = this.cells.filter((c) => c.isPlayer);
      if (playerCells.length > 0) {
        const front = playerCells[playerCells.length - 1];
        this.ripples.push({
          x: front.x,
          y: front.y,
          radius: front.radius * 0.75,
          maxRadius: front.radius * 1.9,
          color: SKIN_MAP[front.skinId]?.secondary || '#38BDF8',
          alpha: 0.42,
        });
      }
    }
  }

  private splitOwner(ownerId: string, targetX: number, targetY: number): boolean {
    const owned = this.cells.filter((c) => c.ownerId === ownerId);
    if (owned.length >= MAX_CELLS_PER_OWNER) return false;

    const newCells: Cell[] = [];
    let availableSlots = MAX_CELLS_PER_OWNER - owned.length;

    // Sort larger first so biggest cells split first
    const sorted = [...owned].sort((a, b) => b.mass - a.mass);

    for (const cell of sorted) {
      if (availableSlots <= 0) break;
      if (cell.mass < 36) continue;

      const halfMass = cell.mass / 2;
      cell.mass = halfMass;
      cell.radius = massToRadius(halfMass);
      cell.eatPulse = 0.35;
      const mergeDelay =
        this.mode === 'merge' ? 0.85 : Math.max(8.5, 6.5 + halfMass * 0.04);
      cell.mergeTimer = mergeDelay;

      const distToTarget = Math.hypot(targetY - cell.y, targetX - cell.x);
      let angle =
        distToTarget > 3
          ? Math.atan2(targetY - cell.y, targetX - cell.x)
          : cell.isPlayer
          ? this.lastPlayerAimAngle
          : Math.atan2(cell.vy, cell.vx) || 0;
      if (Number.isNaN(angle)) angle = 0;

      const launchSpeed = Math.min(980, 650 + cell.radius * 3.8);
      const childRadius = massToRadius(halfMass);
      const childMargin = getSoftBorderMargin(childRadius);

      // Slight recoil stabilization on parent for cleaner forward separation
      cell.boostVx -= Math.cos(angle) * launchSpeed * 0.08;
      cell.boostVy -= Math.sin(angle) * launchSpeed * 0.08;

      const child: Cell = {
        id: nextId(cell.isPlayer ? 'p' : 'b'),
        ownerId: cell.ownerId,
        name: cell.name,
        isPlayer: cell.isPlayer,
        skinId: cell.skinId,
        skinLevel: cell.skinLevel,
        x: clamp(cell.x + Math.cos(angle) * childRadius * 1.12, childMargin, WORLD_SIZE - childMargin),
        y: clamp(cell.y + Math.sin(angle) * childRadius * 1.12, childMargin, WORLD_SIZE - childMargin),
        vx: cell.vx,
        vy: cell.vy,
        boostVx: Math.cos(angle) * launchSpeed,
        boostVy: Math.sin(angle) * launchSpeed,
        mass: halfMass,
        radius: childRadius,
        mergeTimer: mergeDelay,
        wobblePhase: Math.random() * Math.PI * 2,
        eatPulse: 0.55,
      };

      newCells.push(child);
      availableSlots -= 1;
    }

    if (newCells.length > 0) {
      this.cells.push(...newCells);
      return true;
    }
    return false;
  }

  public ejectPlayerMass(burstCount = 1, playSound = true) {
    if (!this.playerAlive) return;
    const pointer = this.getPointerWorld();
    const owned = this.cells.filter((c) => c.ownerId === 'player');
    const safeBurst = Math.max(1, Math.min(3, Math.round(burstCount)));
    let ejectedAny = false;
    const ejectRadius = massToRadius(14);
    const speed = safeBurst > 1 ? 900 : 760;

    for (let b = 0; b < safeBurst; b++) {
      for (const cell of owned) {
        if (cell.mass < 34) continue;
        cell.mass -= 14;
        cell.radius = massToRadius(cell.mass);
        const baseAngle = Math.atan2(pointer.y - cell.y, pointer.x - cell.x);
        const jitter = safeBurst > 1 ? (Math.random() - 0.5) * 0.10 : 0;
        const angle = baseAngle + jitter;
        const skin = SKIN_MAP[cell.skinId] || SKIN_MAP.ocean;

        this.ejected.push({
          id: nextId('e'),
          ownerId: cell.ownerId,
          x: cell.x + Math.cos(angle) * (cell.radius + 10),
          y: cell.y + Math.sin(angle) * (cell.radius + 10),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          mass: 14,
          radius: ejectRadius,
          color: skin.secondary,
          stroke: getDynamicSkinStroke(cell.skinId, this.time, cell.skinLevel ?? 1),
          age: 0,
        });
        ejectedAny = true;
      }
    }

    if (this.ejected.length > MAX_EJECTED_COUNT) {
      this.ejected.splice(0, this.ejected.length - MAX_EJECTED_COUNT);
    }

    if (ejectedAny && playSound) {
      soundFX.playEject();
    }
  }

  private ejectCellToward(cell: Cell, targetX: number, targetY: number, speed = 710): boolean {
    if (cell.mass < 36) return false;
    cell.mass -= 14;
    cell.radius = massToRadius(cell.mass);
    let angle = Math.atan2(targetY - cell.y, targetX - cell.x);
    if (Number.isNaN(angle)) angle = 0;
    const skin = SKIN_MAP[cell.skinId] || SKIN_MAP.ocean;

    this.ejected.push({
      id: nextId('e'),
      ownerId: cell.ownerId,
      x: clamp(cell.x + Math.cos(angle) * (cell.radius + 10), 14, WORLD_SIZE - 14),
      y: clamp(cell.y + Math.sin(angle) * (cell.radius + 10), 14, WORLD_SIZE - 14),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      mass: 14,
      radius: massToRadius(14),
      color: skin.secondary,
      stroke: skin.stroke,
      age: 0,
    });
    return true;
  }

  public addPlayerMass(amount: number): number {
    if (!this.playerAlive || this.isNetworkMode || amount <= 0) return 0;
    const owned = this.cells.filter((c) => c.ownerId === 'player');
    if (owned.length === 0) return 0;
    const perCell = amount / owned.length;
    for (const cell of owned) {
      cell.mass += perCell;
      cell.radius = massToRadius(cell.mass);
      cell.eatPulse = 0.85;
    }
    this.enforceMaxCellMass();
    let total = 0;
    for (const cell of this.cells) {
      if (cell.ownerId === 'player') {
        total += cell.mass;
      }
    }
    const rounded = Math.round(total);
    if (rounded > this.peakMass) {
      this.peakMass = rounded;
    }
    soundFX.playEatCell();
    return rounded;
  }

  public setOwnerPowers(powers: OwnerPowers) {
    this.ownerPowers = { ...powers };
    if (powers.autoFastMerge && !this.isNetworkMode) {
      for (const c of this.cells) {
        if (c.isPlayer) c.mergeTimer = 0;
      }
    }
  }

  public instantMergePlayer(): boolean {
    if (!this.playerAlive || this.isNetworkMode) return false;
    let changed = false;
    for (const c of this.cells) {
      if (c.isPlayer && c.mergeTimer > 0) {
        c.mergeTimer = 0;
        changed = true;
      }
    }
    return changed;
  }

  public spawnGoldenFoodRain(count = 40) {
    if (this.isNetworkMode) return;
    const playerCells = this.cells.filter((c) => c.isPlayer);
    const hasPlayer = playerCells.length > 0;
    const cx = hasPlayer
      ? playerCells.reduce((s, c) => s + c.x, 0) / playerCells.length
      : WORLD_SIZE / 2;
    const cy = hasPlayer
      ? playerCells.reduce((s, c) => s + c.y, 0) / playerCells.length
      : WORLD_SIZE / 2;

    for (let i = 0; i < count; i++) {
      const x = hasPlayer
        ? clamp(cx + (Math.random() - 0.5) * 1400, 40, WORLD_SIZE - 40)
        : 40 + Math.random() * (WORLD_SIZE - 80);
      const y = hasPlayer
        ? clamp(cy + (Math.random() - 0.5) * 1400, 40, WORLD_SIZE - 40)
        : 40 + Math.random() * (WORLD_SIZE - 80);
      this.foods.push({
        id: nextId('f'),
        x,
        y,
        mass: 4,
        radius: 10.5,
        color: '#FACC15',
        isGolden: true,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  public spawnExtraBots(count = 5) {
    if (this.isNetworkMode) return;
    const safeCount = Math.max(1, Math.min(20, Math.round(count)));
    for (let i = 0; i < safeCount; i++) {
      this.spawnBot(true);
    }
  }

  public resetArenaBots() {
    if (this.isNetworkMode) return;
    this.cells = this.cells.filter((c) => c.isPlayer);
    this.botBrains.clear();
    for (let i = 0; i < TARGET_BOT_COUNT; i++) {
      this.spawnBot(true);
    }
  }

  public update(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.06);
    this.time += dt;

    if (this.isNetworkMode) {
      const lerpFactor = 1 - Math.exp(-16 * dt);
      const ejectLerpFactor = 1 - Math.exp(-22 * dt);
      for (const cell of this.cells) {
        const target = this.netCellTargets.get(cell.id);
        if (target) {
          cell.x += (target.x - cell.x) * lerpFactor;
          cell.y += (target.y - cell.y) * lerpFactor;
          cell.radius += (target.radius - cell.radius) * lerpFactor;
          cell.mass = target.mass;
        }
        if (cell.eatPulse > 0) {
          cell.eatPulse = Math.max(0, cell.eatPulse - dt * 2.5);
        }
      }
      for (const e of this.ejected) {
        const et = this.netEjectedTargets.get(e.id);
        if (et) {
          e.x += (et.x - e.x) * ejectLerpFactor;
          e.y += (et.y - e.y) * ejectLerpFactor;
        }
      }
      for (const v of this.viruses) {
        v.pulsePhase += dt * 2.2;
      }
      this.updateEffects(dt);
      this.updatePlayerStatsAndCamera(dt);
      return;
    }

    if (this.playerAlive) {
      this.elapsedSeconds += dt;
    }

    // 1. Compute one unified decision per bot ownerId, then update cell movement
    this.updateUnifiedBotBrains(dt);

    const pointer = this.getPointerWorld();
    const playerCentered = this.isPointerCentered();
    const speedMult =
      this.mode === 'blitz'
        ? 1.28
        : this.mode === 'merge'
        ? 1.15
        : this.mode === 'relaxed'
        ? 0.96
        : 1.0;

    // Compute player's center of mass so split pieces converge cleanly when centered
    const playerCells = this.cells.filter((c) => c.isPlayer);
    let playerCx = this.cameraX;
    let playerCy = this.cameraY;
    if (playerCells.length > 0) {
      let sumMass = 0;
      let sx = 0;
      let sy = 0;
      for (const pc of playerCells) {
        sumMass += pc.mass;
        sx += pc.x * pc.mass;
        sy += pc.y * pc.mass;
      }
      playerCx = sx / sumMass;
      playerCy = sy / sumMass;
    }

    for (const cell of this.cells) {
      if (cell.mergeTimer > 0) {
        if (cell.isPlayer && this.ownerPowers.autoFastMerge) {
          cell.mergeTimer = 0;
        } else {
          cell.mergeTimer = Math.max(0, cell.mergeTimer - dt);
        }
      }
      if (cell.eatPulse > 0) {
        cell.eatPulse = Math.max(0, cell.eatPulse - dt * 2.5);
      }

      // Gentle mass decay for big cells
      if (cell.mass > 140) {
        const decayRate = this.mode === 'blitz' ? 0.0022 : 0.0014;
        cell.mass -= cell.mass * decayRate * dt;
        cell.radius = massToRadius(cell.mass);
      }

      let targetX = cell.x;
      let targetY = cell.y;
      let isStopped = false;

      if (cell.isPlayer) {
        if (playerCentered) {
          if (playerCells.length <= 1 || Math.hypot(playerCx - cell.x, playerCy - cell.y) < 4) {
            isStopped = true;
            targetX = cell.x;
            targetY = cell.y;
          } else {
            targetX = playerCx;
            targetY = playerCy;
          }
        } else {
          targetX = pointer.x;
          targetY = pointer.y;
        }
      } else {
        const brain = this.botBrains.get(cell.ownerId);
        targetX = brain ? brain.targetX : (cell.aiTargetX ?? cell.x);
        targetY = brain ? brain.targetY : (cell.aiTargetY ?? cell.y);
      }

      const dx = targetX - cell.x;
      const dy = targetY - cell.y;
      const dist = Math.hypot(dx, dy);

      const botAgility = cell.isPlayer ? 1.0 : 1.12;
      const ownerSpeedMult = cell.isPlayer ? this.ownerPowers.speedMultiplier : 1;
      const baseSpeed = (340 / Math.pow(cell.mass, 0.34)) * speedMult * botAgility * ownerSpeedMult;
      const throttle = dist < 14 ? dist / 14 : 1;

      if (!isStopped && dist > 1.5) {
        const desiredVx = (dx / dist) * baseSpeed * throttle;
        const desiredVy = (dy / dist) * baseSpeed * throttle;
        const accel = (cell.isPlayer ? 9.5 : 16.5) * dt;
        cell.vx += (desiredVx - cell.vx) * Math.min(1, accel);
        cell.vy += (desiredVy - cell.vy) * Math.min(1, accel);
      } else {
        const brake = Math.pow(0.0004, dt);
        cell.vx *= brake;
        cell.vy *= brake;
        if (Math.hypot(cell.vx, cell.vy) < 1.5) {
          cell.vx = 0;
          cell.vy = 0;
        }
      }

      // Decay boost velocity smoothly for crisp split glide
      cell.boostVx *= Math.pow(0.055, dt);
      cell.boostVy *= Math.pow(0.055, dt);

      cell.x += (cell.vx + cell.boostVx) * dt;
      cell.y += (cell.vy + cell.boostVy) * dt;

      // Soft elastic arena bounds clamping (allows big cells to squeeze smoothly into corners)
      applySoftArenaBounds(cell, dt);
    }

    // 2. Same-owner repulsion / merging
    this.resolveSameOwnerInteractions(dt);

    // 2b. Owner food magnet pull
    if (this.ownerPowers.foodMagnet && playerCells.length > 0) {
      const pullRadius = 320;
      const pullStep = 340 * dt;
      for (const f of this.foods) {
        for (const pc of playerCells) {
          const dx = pc.x - f.x;
          const dy = pc.y - f.y;
          const range = pc.radius + pullRadius;
          if (Math.abs(dx) > range || Math.abs(dy) > range) continue;
          const d = Math.hypot(dx, dy);
          if (d > 2 && d < range) {
            f.x += (dx / d) * pullStep;
            f.y += (dy / d) * pullStep;
            break;
          }
        }
      }
      for (const e of this.ejected) {
        if (e.age < 0.25) continue;
        for (const pc of playerCells) {
          const dx = pc.x - e.x;
          const dy = pc.y - e.y;
          const range = pc.radius + pullRadius;
          if (Math.abs(dx) > range || Math.abs(dy) > range) continue;
          const d = Math.hypot(dx, dy);
          if (d > 2 && d < range) {
            e.x += (dx / d) * pullStep;
            e.y += (dy / d) * pullStep;
            break;
          }
        }
      }
    }

    // 3. Ejected mass physics & virus feeding
    this.updateEjectedMass(dt);

    // 4. Virus physics & cell collisions
    this.updateViruses(dt);

    // 5. Food eating
    this.resolveFoodEating();

    // 6. Cell vs Cell eating & 25k per-cell cap
    this.resolveCellEating();
    this.enforceMaxCellMass();

    // 7. Particles & ripples
    this.updateEffects(dt);

    // 8. Replenish food, viruses, and bots
    while (this.foods.length < TARGET_FOOD_COUNT) {
      this.spawnFood();
    }
    while (this.viruses.length < TARGET_VIRUS_COUNT) {
      this.spawnVirus();
    }
    const activeBotOwners = new Set(this.cells.filter((c) => !c.isPlayer).map((c) => c.ownerId));
    while (activeBotOwners.size < TARGET_BOT_COUNT) {
      this.spawnBot(false);
      const latest = this.cells[this.cells.length - 1];
      if (latest) activeBotOwners.add(latest.ownerId);
    }

    // 9. Update player stats & camera
    this.updatePlayerStatsAndCamera(dt);
  }

  private updateUnifiedBotBrains(dt: number) {
    const groups = new Map<string, Cell[]>();
    for (const c of this.cells) {
      if (c.isPlayer) continue;
      let list = groups.get(c.ownerId);
      if (!list) {
        list = [];
        groups.set(c.ownerId, list);
      }
      list.push(c);
    }

    // Remove dead bot brains
    for (const ownerId of this.botBrains.keys()) {
      if (!groups.has(ownerId)) {
        this.botBrains.delete(ownerId);
      }
    }

    const aggression = this.mode === 'relaxed' ? 0.95 : this.mode === 'blitz' ? 1.55 : 1.38;
    const maxBotSplitPieces = this.mode === 'merge' ? 12 : 10;

    // Pre-count pieces per owner so bots recognize freshly popped / split rivals
    const ownerPieceCount = new Map<string, number>();
    for (const c of this.cells) {
      ownerPieceCount.set(c.ownerId, (ownerPieceCount.get(c.ownerId) || 0) + 1);
    }

    for (const [ownerId, owned] of groups) {
      let brain = this.botBrains.get(ownerId);
      if (!brain) {
        brain = {
          targetX: owned[0].aiTargetX ?? Math.random() * WORLD_SIZE,
          targetY: owned[0].aiTargetY ?? Math.random() * WORLD_SIZE,
          cooldown: 0,
          ejectCooldown: 0,
        };
        this.botBrains.set(ownerId, brain);
      }
      brain.cooldown = Math.max(0, brain.cooldown - dt);
      brain.ejectCooldown = Math.max(0, brain.ejectCooldown - dt);

      // Compute center of mass and largest/smallest cell for this unified pro bot
      let totalMass = 0;
      let sumX = 0;
      let sumY = 0;
      let largest = owned[0];
      let smallest = owned[0];
      for (const c of owned) {
        totalMass += c.mass;
        sumX += c.x * c.mass;
        sumY += c.y * c.mass;
        if (c.mass > largest.mass) largest = c;
        if (c.mass < smallest.mass) smallest = c;
      }
      const cx = sumX / totalMass;
      const cy = sumY / totalMass;

      let fleeX = 0;
      let fleeY = 0;
      let fleeing = false;
      let bestPrey: Cell | null = null;
      let bestAttacker: Cell = largest;
      let bestPreyScore = -Infinity;
      let distantHuntTarget: Cell | null = null;
      let distantHuntScore = -Infinity;
      let nearestThreatDist = Infinity;
      let nearestThreatMass = 0;

      const awarenessRange = 1320;
      const huntRange = 2300;

      for (const other of this.cells) {
        if (other.ownerId === ownerId) continue;
        const dx = other.x - cx;
        const dy = other.y - cy;
        const dist = Math.hypot(dx, dy);

        // Long-range rival hunter: large bots actively seek out bot-vs-bot fights
        if (dist > awarenessRange && dist <= huntRange && largest.mass >= 135) {
          if (largest.mass > other.mass * 1.32 && other.mass >= largest.mass * 0.14) {
            const rivalPieces = ownerPieceCount.get(other.ownerId) || 1;
            const splitVulnerability = rivalPieces > 1 ? 1.45 : 1.0;
            const huntScore = other.mass * splitVulnerability * (other.isPlayer ? 1.25 : 1.1) - dist * 0.18;
            if (huntScore > distantHuntScore) {
              distantHuntScore = huntScore;
              distantHuntTarget = other;
            }
          }
          continue;
        }

        if (dist > awarenessRange) continue;

        if (other.mass > largest.mass * 0.68 && dist < nearestThreatDist) {
          nearestThreatDist = dist;
          nearestThreatMass = Math.max(nearestThreatMass, other.mass);
        }

        // Pro threat assessment: only flee from threats within genuine danger/split range
        // so bots don't run away from weak neighbors just because of a small split piece
        const enemySplitReach = Math.min(720, 300 + other.radius * 2.6);
        const distToLargest = Math.hypot(other.x - largest.x, other.y - largest.y);
        const distToSmallest = Math.hypot(other.x - smallest.x, other.y - smallest.y);

        const threatensLargest =
          (other.mass > largest.mass * 1.24 && distToLargest < other.radius + largest.radius + 230) ||
          (other.mass > largest.mass * 2.48 && distToLargest < enemySplitReach);

        const threatensSmallest =
          owned.length > 1 &&
          smallest !== largest &&
          ((other.mass > smallest.mass * 1.24 && distToSmallest < other.radius + smallest.radius + 170) ||
            (other.mass > smallest.mass * 2.48 && distToSmallest < Math.min(540, 240 + other.radius * 2.1))) &&
          (other.mass > largest.mass * 0.72 || distToSmallest < 235);

        if (threatensLargest || threatensSmallest) {
          const refDist = threatensLargest ? distToLargest : distToSmallest;
          const isSplitDanger = other.mass > (threatensLargest ? largest.mass : smallest.mass) * 2.45;
          const threatWeight =
            ((awarenessRange - Math.min(refDist, awarenessRange)) / awarenessRange) *
            (isSplitDanger ? 4.8 : 3.1);
          const tdx = other.x - (threatensLargest ? largest.x : smallest.x);
          const tdy = other.y - (threatensLargest ? largest.y : smallest.y);
          const tLen = Math.hypot(tdx, tdy) || 1;
          fleeX -= (tdx / tLen) * threatWeight;
          fleeY -= (tdy / tLen) * threatWeight;
          fleeing = true;
          continue;
        }

        // Find the best owned piece capable of eating or split-killing this rival
        let capPiece: Cell | null = null;
        let capDist = Infinity;
        for (const piece of owned) {
          if (piece.mass > other.mass * 1.23) {
            const pd = Math.hypot(other.x - piece.x, other.y - piece.y);
            if (pd < capDist) {
              capDist = pd;
              capPiece = piece;
            }
          }
        }

        if (capPiece && owned.length <= maxBotSplitPieces) {
          const splitReach = Math.min(700, 300 + capPiece.radius * 2.6);
          const canSplitKill = capPiece.mass > other.mass * 2.50 && capDist < splitReach;
          const rivalPieces = ownerPieceCount.get(other.ownerId) || 1;
          const poppedBonus = rivalPieces >= 3 ? 1.55 : rivalPieces === 2 ? 1.22 : 1.0;
          const humanBonus = other.isPlayer ? 1.25 : 1.12;
          const score =
            other.mass * (canSplitKill ? 6.2 : 3.9) * poppedBonus * humanBonus - capDist * 0.26;
          if (score > bestPreyScore) {
            bestPreyScore = score;
            bestPrey = other;
            bestAttacker = capPiece;
          }
        }
      }

      const wallMargin = 240;
      if (cx < wallMargin) fleeX += ((wallMargin - cx) / wallMargin) * 1.65;
      if (cx > WORLD_SIZE - wallMargin) fleeX -= ((cx - (WORLD_SIZE - wallMargin)) / wallMargin) * 1.65;
      if (cy < wallMargin) fleeY += ((wallMargin - cy) / wallMargin) * 1.65;
      if (cy > WORLD_SIZE - wallMargin) fleeY -= ((cy - (WORLD_SIZE - wallMargin)) / wallMargin) * 1.65;

      // Virus evasion + pro offensive virus-popping targeting (both bots & player)
      let virusShot: { virus: Virus; rival: Cell; distToVirus: number; priority: number } | null = null;
      if (largest.mass >= 112) {
        for (const v of this.viruses) {
          const dx = v.x - largest.x;
          const dy = v.y - largest.y;
          const dist = Math.hypot(dx, dy);
          const dangerZone = largest.radius + v.radius + 88;
          if (dist < dangerZone) {
            const weight = ((dangerZone - dist) / dangerZone) * 2.6 + 0.95;
            fleeX -= (dx / (dist || 1)) * weight;
            fleeY -= (dy / (dist || 1)) * weight;
            fleeing = true;
          }

          // Shoot viruses at rivals (both player and other bots) to pop & devour them
          if (
            this.mode !== 'relaxed' &&
            largest.mass >= 138 &&
            dist > largest.radius + v.radius + 16 &&
            dist < 620
          ) {
            for (const other of this.cells) {
              if (other.ownerId === ownerId) continue;
              if (other.mass < 118) continue;
              if (!other.isPlayer && other.mass < largest.mass * 0.45) continue;

              const predRx = other.x + (other.vx + other.boostVx) * 0.26;
              const predRy = other.y + (other.vy + other.boostVy) * 0.26;
              const vToRival = Math.hypot(predRx - v.x, predRy - v.y);
              if (vToRival < other.radius + v.radius + 310) {
                const priority =
                  (other.isPlayer ? 4500 : 2800) + other.mass * 1.4 - vToRival * 2.1 - dist;
                if (!virusShot || priority > virusShot.priority) {
                  virusShot = { virus: v, rival: other, distToVirus: dist, priority };
                }
              }
            }
          }
        }
      }

      if (fleeing && (Math.abs(fleeX) > 0.08 || Math.abs(fleeY) > 0.08)) {
        brain.targetX = clamp(cx + fleeX * 390, 140, WORLD_SIZE - 140);
        brain.targetY = clamp(cy + fleeY * 390, 140, WORLD_SIZE - 140);
        continue;
      }

      // Offensive pro virus-shooting attack to pop rivals & bots
      if (virusShot && nearestThreatDist > 185) {
        const { virus: v, rival, distToVirus } = virusShot;
        const predRx = rival.x + (rival.vx + rival.boostVx) * 0.26;
        const predRy = rival.y + (rival.vy + rival.boostVy) * 0.26;
        const vrDx = predRx - v.x;
        const vrDy = predRy - v.y;
        const vrDist = Math.hypot(vrDx, vrDy) || 1;
        const aimDirX = vrDx / vrDist;
        const aimDirY = vrDy / vrDist;

        const botToVDirX = (v.x - largest.x) / (distToVirus || 1);
        const botToVDirY = (v.y - largest.y) / (distToVirus || 1);
        const alignment = botToVDirX * aimDirX + botToVDirY * aimDirY;

        if (alignment > 0.84 && distToVirus < largest.radius + v.radius + 260) {
          const holdDist = largest.radius + v.radius + 60;
          brain.targetX = clamp(v.x - aimDirX * holdDist, 140, WORLD_SIZE - 140);
          brain.targetY = clamp(v.y - aimDirY * holdDist, 140, WORLD_SIZE - 140);
          if (brain.ejectCooldown <= 0 && largest.mass >= 136) {
            if (this.ejectCellToward(largest, v.x, v.y, 820)) {
              brain.ejectCooldown = 0.085;
            }
          }
        } else {
          const standOff = largest.radius + v.radius + 68;
          brain.targetX = clamp(v.x - aimDirX * standOff, 140, WORLD_SIZE - 140);
          brain.targetY = clamp(v.y - aimDirY * standOff, 140, WORLD_SIZE - 140);
        }
        continue;
      }

      if (bestPrey) {
        const distToPrey = Math.hypot(bestPrey.x - bestAttacker.x, bestPrey.y - bestAttacker.y);
        const leadT = clamp(distToPrey / 680, 0.05, 0.44);
        const predX = clamp(
          bestPrey.x + (bestPrey.vx + bestPrey.boostVx) * leadT,
          bestPrey.radius,
          WORLD_SIZE - bestPrey.radius
        );
        const predY = clamp(
          bestPrey.y + (bestPrey.vy + bestPrey.boostVy) * leadT,
          bestPrey.radius,
          WORLD_SIZE - bestPrey.radius
        );
        brain.targetX = predX;
        brain.targetY = predY;

        const splitReach = Math.min(700, 300 + bestAttacker.radius * 2.6);
        const canDoubleSplit =
          bestAttacker.mass > bestPrey.mass * 5.0 &&
          owned.length <= 4 &&
          distToPrey < 860 &&
          nearestThreatDist > 380;
        const safeSplitAfterMass = bestAttacker.mass * 0.5 > nearestThreatMass * 1.22;

        if (
          brain.cooldown <= 0 &&
          owned.length < maxBotSplitPieces &&
          bestAttacker.mass >= 74 &&
          bestAttacker.mass > bestPrey.mass * 2.50 &&
          distToPrey > bestAttacker.radius * 0.96 &&
          (distToPrey < splitReach || canDoubleSplit) &&
          (nearestThreatDist > 330 || safeSplitAfterMass) &&
          Math.random() < 0.84 * aggression
        ) {
          brain.cooldown = canDoubleSplit ? 0.16 : 0.95;
          this.splitOwner(ownerId, predX, predY);
        }
        continue;
      }

      // No close prey — if large enough, roam toward active bot fights across the map
      if (distantHuntTarget && Math.hypot(brain.targetX - cx, brain.targetY - cy) < largest.radius + 90) {
        brain.targetX = clamp(distantHuntTarget.x, 160, WORLD_SIZE - 160);
        brain.targetY = clamp(distantHuntTarget.y, 160, WORLD_SIZE - 160);
        brain.cooldown = Math.min(brain.cooldown, 0.45);
        continue;
      }

      // Smart farming: prioritize nearby ejected mass & golden pellets
      if (
        brain.cooldown <= 0 ||
        Math.hypot(brain.targetX - cx, brain.targetY - cy) < largest.radius + 40
      ) {
        let bestTarget: { x: number; y: number } | null = null;
        let bestScore = -Infinity;

        for (const e of this.ejected) {
          if (e.ownerId === ownerId && e.age < 0.35) continue;
          const d = Math.hypot(e.x - cx, e.y - cy);
          if (d > 720) continue;
          const val = 280 - d * 0.25;
          if (val > bestScore) {
            bestScore = val;
            bestTarget = e;
          }
        }

        for (let i = 0; i < Math.min(this.foods.length, 115); i++) {
          const f = this.foods[Math.floor(Math.random() * this.foods.length)];
          const d = Math.hypot(f.x - cx, f.y - cy);
          const val = (f.isGolden ? 290 : 42) - d * 0.18;
          if (val > bestScore) {
            bestScore = val;
            bestTarget = f;
          }
        }

        if (bestTarget) {
          brain.targetX = bestTarget.x;
          brain.targetY = bestTarget.y;
          brain.cooldown = Math.min(brain.cooldown, 0.26);
        } else if (distantHuntTarget) {
          brain.targetX = distantHuntTarget.x;
          brain.targetY = distantHuntTarget.y;
        } else {
          brain.targetX = 260 + Math.random() * (WORLD_SIZE - 520);
          brain.targetY = 260 + Math.random() * (WORLD_SIZE - 520);
        }
      }
    }
  }

  private resolveSameOwnerInteractions(dt: number) {
    const removedIds = new Set<string>();

    for (let i = 0; i < this.cells.length; i++) {
      const a = this.cells[i];
      if (removedIds.has(a.id)) continue;

      for (let j = i + 1; j < this.cells.length; j++) {
        const b = this.cells[j];
        if (removedIds.has(b.id)) continue;
        if (a.ownerId !== b.ownerId) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        const canMerge = a.mergeTimer <= 0 && b.mergeTimer <= 0;
        const mergeThreshold = this.mode === 'merge' ? minDist * 0.82 : minDist * 0.65;
        const pullRange = this.mode === 'merge' ? minDist * 3.2 : minDist * 2.2;
        const pullSpeed = this.mode === 'merge' ? 185 * dt : 55 * dt;

        const eater = a.mass >= b.mass ? a : b;
        const prey = a.mass >= b.mass ? b : a;
        const eaterHasRoom = eater.mass < MAX_CELL_MASS - 0.5;

        if (canMerge && eaterHasRoom) {
          if (dist < mergeThreshold) {
            if (eater.mass + prey.mass <= MAX_CELL_MASS) {
              eater.mass += prey.mass;
              eater.radius = massToRadius(eater.mass);
              eater.eatPulse = 0.5;
              removedIds.add(prey.id);
            } else {
              const transfer = MAX_CELL_MASS - eater.mass;
              eater.mass = MAX_CELL_MASS;
              eater.radius = massToRadius(eater.mass);
              eater.eatPulse = 0.5;
              prey.mass -= transfer;
              if (prey.mass < 2) {
                removedIds.add(prey.id);
              } else {
                prey.radius = massToRadius(prey.mass);
              }
            }
          } else if (dist < pullRange && dist > 1) {
            // Attraction so ready cells merge cleanly
            a.x += (dx / dist) * pullSpeed;
            a.y += (dy / dist) * pullSpeed;
            b.x -= (dx / dist) * pullSpeed;
            b.y -= (dy / dist) * pullSpeed;
          }
        } else if (dist < minDist && dist > 0.001) {
          // Elastic separation while on merge cooldown or when a piece is already capped at 25,000
          const isDashing =
            Math.hypot(a.boostVx, a.boostVy) > 140 || Math.hypot(b.boostVx, b.boostVy) > 140;
          const pushFactor = isDashing ? 0.36 : canMerge ? 0.52 : 0.65;
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const totalMass = a.mass + b.mass;
          const ratioA = b.mass / totalMass;
          const ratioB = a.mass / totalMass;

          a.x -= nx * overlap * ratioA * pushFactor;
          a.y -= ny * overlap * ratioA * pushFactor;
          b.x += nx * overlap * ratioB * pushFactor;
          b.y += ny * overlap * ratioB * pushFactor;

          const mA = getSoftBorderMargin(a.radius);
          const mB = getSoftBorderMargin(b.radius);
          a.x = clamp(a.x, mA, WORLD_SIZE - mA);
          a.y = clamp(a.y, mA, WORLD_SIZE - mA);
          b.x = clamp(b.x, mB, WORLD_SIZE - mB);
          b.y = clamp(b.y, mB, WORLD_SIZE - mB);
        }
      }
    }

    if (removedIds.size > 0) {
      this.cells = this.cells.filter((c) => !removedIds.has(c.id));
    }
  }

  private enforceMaxCellMass() {
    const ownerCounts = new Map<string, number>();
    for (const c of this.cells) {
      ownerCounts.set(c.ownerId, (ownerCounts.get(c.ownerId) || 0) + 1);
    }

    const spawned: Cell[] = [];
    for (const cell of this.cells) {
      if (cell.mass <= MAX_CELL_MASS) continue;

      let count = ownerCounts.get(cell.ownerId) || 1;
      while (cell.mass > MAX_CELL_MASS && count < MAX_CELLS_PER_OWNER) {
        const halfMass = cell.mass / 2;
        cell.mass = halfMass;
        cell.radius = massToRadius(halfMass);
        const mergeDelay =
          this.mode === 'merge' ? 0.85 : Math.max(8.5, 6.5 + halfMass * 0.04);
        cell.mergeTimer = Math.max(cell.mergeTimer, mergeDelay);

        let angle = Math.atan2(cell.vy, cell.vx);
        if ((cell.vx === 0 && cell.vy === 0) || Number.isNaN(angle)) {
          angle = Math.random() * Math.PI * 2;
        }
        angle += (Math.random() - 0.5) * 0.35;

        const childRadius = massToRadius(halfMass);
        const childMargin = getSoftBorderMargin(childRadius);
        const launchSpeed = Math.min(820, 480 + childRadius * 2.2);

        spawned.push({
          id: nextId(cell.isPlayer ? 'p' : 'b'),
          ownerId: cell.ownerId,
          name: cell.name,
          isPlayer: cell.isPlayer,
          skinId: cell.skinId,
          skinLevel: cell.skinLevel,
          x: clamp(cell.x + Math.cos(angle) * childRadius * 0.95, childMargin, WORLD_SIZE - childMargin),
          y: clamp(cell.y + Math.sin(angle) * childRadius * 0.95, childMargin, WORLD_SIZE - childMargin),
          vx: cell.vx,
          vy: cell.vy,
          boostVx: Math.cos(angle) * launchSpeed,
          boostVy: Math.sin(angle) * launchSpeed,
          mass: halfMass,
          radius: childRadius,
          mergeTimer: mergeDelay,
          wobblePhase: Math.random() * Math.PI * 2,
          eatPulse: 0.45,
        });
        count += 1;
      }
      ownerCounts.set(cell.ownerId, count);

      if (cell.mass > MAX_CELL_MASS) {
        cell.mass = MAX_CELL_MASS;
        cell.radius = massToRadius(MAX_CELL_MASS);
      }
    }

    if (spawned.length > 0) {
      this.cells.push(...spawned);
    }
  }

  private updateEjectedMass(dt: number) {
    const remaining: EjectedMass[] = [];
    const drag = Math.pow(0.04, dt);

    for (const e of this.ejected) {
      e.age += dt;
      if (Math.abs(e.vx) > 0.5 || Math.abs(e.vy) > 0.5) {
        e.vx *= drag;
        e.vy *= drag;
        e.x = clamp(e.x + e.vx * dt, e.radius, WORLD_SIZE - e.radius);
        e.y = clamp(e.y + e.vy * dt, e.radius, WORLD_SIZE - e.radius);
      }

      let consumed = false;

      // Check virus feeding (fast AABB + squared distance)
      for (const v of this.viruses) {
        const hitR = v.radius + e.radius * 0.5;
        const dx = e.x - v.x;
        const dy = e.y - v.y;
        if (Math.abs(dx) > hitR || Math.abs(dy) > hitR) continue;
        if (dx * dx + dy * dy < hitR * hitR) {
          v.feedCount += 1;
          v.lastFeedAngle = Math.atan2(e.vy, e.vx);
          v.mass += 6;
          v.radius = massToRadius(v.mass);
          consumed = true;

          if (v.feedCount >= 7 && this.viruses.length < MAX_VIRUS_COUNT) {
            v.feedCount = 0;
            v.mass = 100;
            v.radius = massToRadius(100);
            const angle = v.lastFeedAngle;
            this.spawnVirus(
              clamp(v.x + Math.cos(angle) * (v.radius * 2 + 12), 100, WORLD_SIZE - 100),
              clamp(v.y + Math.sin(angle) * (v.radius * 2 + 12), 100, WORLD_SIZE - 100),
              Math.cos(angle) * 580,
              Math.sin(angle) * 580
            );
          }
          break;
        }
      }

      if (consumed) continue;

      // Check cell eating ejected mass (fast AABB + squared distance)
      for (const c of this.cells) {
        if (c.ownerId === e.ownerId && e.age < 0.25) continue;
        const dx = e.x - c.x;
        const dy = e.y - c.y;
        if (Math.abs(dx) > c.radius || Math.abs(dy) > c.radius) continue;
        if (dx * dx + dy * dy < c.radius * c.radius) {
          c.mass += e.mass;
          c.radius = massToRadius(c.mass);
          c.eatPulse = 0.25;
          if (c.isPlayer) {
            soundFX.playEatPellet(false);
          }
          consumed = true;
          break;
        }
      }

      if (!consumed && e.age < 24) {
        remaining.push(e);
      }
    }

    if (remaining.length > MAX_EJECTED_COUNT) {
      this.ejected = remaining.slice(remaining.length - MAX_EJECTED_COUNT);
    } else {
      this.ejected = remaining;
    }
  }

  private updateViruses(dt: number) {
    const newFragments: Cell[] = [];
    const poppedViruses = new Set<string>();

    for (const v of this.viruses) {
      v.pulsePhase += dt * 2.2;
      v.vx *= Math.pow(0.06, dt);
      v.vy *= Math.pow(0.06, dt);
      v.x = clamp(v.x + v.vx * dt, v.radius + 20, WORLD_SIZE - v.radius - 20);
      v.y = clamp(v.y + v.vy * dt, v.radius + 20, WORLD_SIZE - v.radius - 20);

      for (const cell of this.cells) {
        if (cell.mass < 122) continue;
        if (cell.isPlayer && this.ownerPowers.virusShield) continue;
        const dist = Math.hypot(cell.x - v.x, cell.y - v.y);
        if (dist < cell.radius - v.radius * 0.2) {
          poppedViruses.add(v.id);
          const ownerCount = this.cells.filter((c) => c.ownerId === cell.ownerId).length + newFragments.filter((c) => c.ownerId === cell.ownerId).length;
          const maxSplits = Math.min(8, MAX_CELLS_PER_OWNER - ownerCount);

          cell.mass += 24;
          if (maxSplits > 0) {
            const virusMergeDelay = this.mode === 'merge' ? 1.6 : 14;
            const totalPieces = maxSplits + 1;
            const pieceMass = Math.max(16, cell.mass / totalPieces);
            cell.mass = pieceMass;
            cell.radius = massToRadius(pieceMass);
            cell.mergeTimer = virusMergeDelay;

            for (let k = 0; k < maxSplits; k++) {
              const angle = (k * Math.PI * 2) / maxSplits + (Math.random() - 0.5) * 0.3;
              const speed = 420 + Math.random() * 240;
              const r = massToRadius(pieceMass);
              const fragMargin = getSoftBorderMargin(r);
              newFragments.push({
                id: nextId(cell.isPlayer ? 'p' : 'b'),
                ownerId: cell.ownerId,
                name: cell.name,
                isPlayer: cell.isPlayer,
                skinId: cell.skinId,
                skinLevel: cell.skinLevel,
                x: clamp(cell.x + Math.cos(angle) * (r * 0.9), fragMargin, WORLD_SIZE - fragMargin),
                y: clamp(cell.y + Math.sin(angle) * (r * 0.9), fragMargin, WORLD_SIZE - fragMargin),
                vx: cell.vx,
                vy: cell.vy,
                boostVx: Math.cos(angle) * speed,
                boostVy: Math.sin(angle) * speed,
                mass: pieceMass,
                radius: r,
                mergeTimer: virusMergeDelay,
                wobblePhase: Math.random() * Math.PI * 2,
                eatPulse: 0.6,
              });
            }
          } else {
            cell.radius = massToRadius(cell.mass);
          }

          this.spawnExplosion(v.x, v.y, '#22C55E', 18);
          this.ripples.push({
            x: v.x,
            y: v.y,
            radius: v.radius,
            maxRadius: v.radius * 2.8,
            color: '#22C55E',
            alpha: 0.65,
          });
          if (cell.isPlayer) {
            soundFX.playVirusPop();
          }
          break;
        }
      }
    }

    if (poppedViruses.size > 0) {
      this.viruses = this.viruses.filter((v) => !poppedViruses.has(v.id));
    }
    if (newFragments.length > 0) {
      this.cells.push(...newFragments);
    }
  }

  private resolveFoodEating() {
    const remainingFoods: FoodPellet[] = [];

    for (const f of this.foods) {
      let eaten = false;
      for (const c of this.cells) {
        const dx = f.x - c.x;
        const dy = f.y - c.y;
        if (Math.abs(dx) > c.radius || Math.abs(dy) > c.radius) continue;
        if (dx * dx + dy * dy < c.radius * c.radius) {
          c.mass += f.mass;
          c.radius = massToRadius(c.mass);
          c.eatPulse = Math.min(0.45, c.eatPulse + 0.14);
          if (c.isPlayer) {
            this.foodsEaten += 1;
            soundFX.playEatPellet(f.isGolden);
          }
          if (f.isGolden) {
            this.spawnExplosion(f.x, f.y, '#FACC15', 8);
          }
          eaten = true;
          break;
        }
      }
      if (!eaten) {
        remainingFoods.push(f);
      }
    }

    this.foods = remainingFoods;
  }

  private resolveCellEating() {
    const deadIds = new Set<string>();
    const sorted = [...this.cells].sort((a, b) => b.mass - a.mass);

    for (let i = 0; i < sorted.length; i++) {
      const eater = sorted[i];
      if (deadIds.has(eater.id)) continue;

      for (let j = i + 1; j < sorted.length; j++) {
        const prey = sorted[j];
        if (deadIds.has(prey.id)) continue;
        if (eater.ownerId === prey.ownerId) continue;
        if (prey.isPlayer && this.ownerPowers.godMode) continue;
        if (eater.mass <= prey.mass * 1.22) continue;

        const dist = Math.hypot(eater.x - prey.x, eater.y - prey.y);
        if (dist < eater.radius - prey.radius * 0.32) {
          eater.mass += prey.mass;
          eater.radius = massToRadius(eater.mass);
          eater.eatPulse = 0.7;
          deadIds.add(prey.id);

          const skin = SKIN_MAP[prey.skinId] || SKIN_MAP.ocean;
          this.spawnExplosion(prey.x, prey.y, skin.secondary, 12);
          this.ripples.push({
            x: eater.x,
            y: eater.y,
            radius: eater.radius * 0.85,
            maxRadius: eater.radius * 1.45,
            color: SKIN_MAP[eater.skinId]?.secondary || '#38BDF8',
            alpha: 0.45,
          });

          if (eater.isPlayer) {
            this.cellsEaten += 1;
            soundFX.playEatCell();
          }

          if (prey.isPlayer) {
            const remainingPlayerCells = this.cells.filter(
              (c) => c.isPlayer && !deadIds.has(c.id)
            );
            if (remainingPlayerCells.length === 0) {
              this.killerName = eater.name;
            }
          }
        }
      }
    }

    if (deadIds.size > 0) {
      this.cells = this.cells.filter((c) => !deadIds.has(c.id));
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
      const maxLife = 0.35 + Math.random() * 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4.5,
        color,
        alpha: 1,
        life: 0,
        maxLife,
      });
    }
  }

  private updateEffects(dt: number) {
    const nextParticles: Particle[] = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.15, dt);
      p.vy *= Math.pow(0.15, dt);
      p.alpha = 1 - p.life / p.maxLife;
      nextParticles.push(p);
    }
    this.particles = nextParticles;

    const nextRipples: Ripple[] = [];
    for (const r of this.ripples) {
      r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 8);
      r.alpha -= dt * 1.4;
      if (r.alpha > 0.02) nextRipples.push(r);
    }
    this.ripples = nextRipples;
  }

  private updatePlayerStatsAndCamera(dt: number) {
    const playerCells = this.cells.filter((c) => c.isPlayer);

    if (!this.isNetworkMode && this.playerAlive && playerCells.length === 0) {
      this.playerAlive = false;
      soundFX.playGameOver();
      if (this.onPlayerDeath) {
        this.onPlayerDeath(this.getHudSnapshot());
      }
      return;
    }

    if (playerCells.length > 0) {
      let totalMass = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const c of playerCells) {
        totalMass += c.mass;
        sumX += c.x * c.mass;
        sumY += c.y * c.mass;
        if (c.x - c.radius < minX) minX = c.x - c.radius;
        if (c.x + c.radius > maxX) maxX = c.x + c.radius;
        if (c.y - c.radius < minY) minY = c.y - c.radius;
        if (c.y + c.radius > maxY) maxY = c.y + c.radius;
      }

      if (totalMass > this.peakMass) {
        this.peakMass = totalMass;
      }

      const cx = sumX / totalMass;
      const cy = sumY / totalMass;

      const spread = Math.max(maxX - minX, maxY - minY);
      const effectiveRadius = Math.max(massToRadius(totalMass), spread * 0.52);
      const viewportScale = this.viewportWidth < 640 ? 0.78 : 1.0;
      const targetZoom = clamp(
        Math.pow(62 / effectiveRadius, 0.42) * viewportScale * this.userZoomMultiplier,
        0.22,
        1.85
      );

      const camSmooth = 1 - Math.exp(-8 * dt);
      this.cameraX += (cx - this.cameraX) * camSmooth;
      this.cameraY += (cy - this.cameraY) * camSmooth;
      this.cameraZoom += (targetZoom - this.cameraZoom) * (1 - Math.exp(-5.5 * dt));
    } else {
      // Spectate the top cell gently in background
      const leader = this.cells.reduce<Cell | null>(
        (best, c) => (!best || c.mass > best.mass ? c : best),
        null
      );
      if (leader) {
        const camSmooth = 1 - Math.exp(-2 * dt);
        this.cameraX += (leader.x - this.cameraX) * camSmooth;
        this.cameraY += (leader.y - this.cameraY) * camSmooth;
        this.cameraZoom += (0.65 - this.cameraZoom) * (1 - Math.exp(-1.6 * dt));
      }
    }
  }

  public getHudSnapshot(): HudSnapshot {
    const ownerTotals = new Map<
      string,
      { ownerId: string; name: string; mass: number; isPlayer: boolean; skinId: SkinId; skinLevel: SkinLevel; x: number; y: number }
    >();

    for (const c of this.cells) {
      const existing = ownerTotals.get(c.ownerId);
      if (existing) {
        existing.x = (existing.x * existing.mass + c.x * c.mass) / (existing.mass + c.mass);
        existing.y = (existing.y * existing.mass + c.y * c.mass) / (existing.mass + c.mass);
        existing.mass += c.mass;
      } else {
        ownerTotals.set(c.ownerId, {
          ownerId: c.ownerId,
          name: c.name,
          mass: c.mass,
          isPlayer: c.isPlayer,
          skinId: c.skinId,
          skinLevel: c.skinLevel ?? 1,
          x: c.x,
          y: c.y,
        });
      }
    }

    if (this.isNetworkMode && this.netHudSnapshot) {
      return this.netHudSnapshot;
    }

    const sorted = Array.from(ownerTotals.values()).sort((a, b) => b.mass - a.mass);
    const leaderboard: LeaderboardEntry[] = sorted.slice(0, 5).map((entry, idx) => ({
      ownerId: entry.ownerId,
      name: entry.name,
      mass: Math.round(entry.mass),
      isPlayer: entry.isPlayer,
      skinId: entry.skinId,
      skinLevel: entry.skinLevel,
      rank: idx + 1,
    }));

    const playerIndex = sorted.findIndex((e) => e.isPlayer);
    const playerEntry = playerIndex >= 0 ? sorted[playerIndex] : null;
    const playerCells = this.cells.filter((c) => c.isPlayer);

    const leaderId = sorted[0]?.ownerId;
    const minimapDots: MinimapDot[] = [];

    for (const c of this.cells) {
      if (c.isPlayer || c.ownerId === leaderId) {
        minimapDots.push({
          x: c.x,
          y: c.y,
          radius: c.radius,
          isPlayer: c.isPlayer,
          isLeader: c.ownerId === leaderId,
        });
      }
    }

    return {
      mass: playerEntry ? Math.round(playerEntry.mass) : 0,
      peakMass: Math.round(this.peakMass),
      score: Math.round(this.peakMass * 2 + this.cellsEaten * 85 + this.elapsedSeconds * 1.5),
      rank: playerIndex >= 0 ? playerIndex + 1 : 0,
      totalPlayers: sorted.length,
      cellsEaten: this.cellsEaten,
      cellCount: playerCells.length,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      leaderboard,
      minimapDots,
      worldSize: WORLD_SIZE,
      canSplit:
        playerCells.length < MAX_CELLS_PER_OWNER && playerCells.some((c) => c.mass >= 36),
      canEject: playerCells.some((c) => c.mass >= 34),
      killerName: this.killerName,
      foodsEaten: this.foodsEaten,
      splitsUsed: this.splitsUsed,
    };
  }

  public render(ctx: CanvasRenderingContext2D) {
    const w = this.viewportWidth;
    const h = this.viewportHeight;
    const isDark = this.theme === 'dark';

    // Atmospheric Radial Petri/Bio-Cosmos Gradient Fill
    const bgGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.45,
      Math.min(w, h) * 0.08,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.85
    );
    if (isDark) {
      bgGrad.addColorStop(0, '#0F1A34');
      bgGrad.addColorStop(0.55, '#091124');
      bgGrad.addColorStop(1, '#040814');
    } else {
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.55, '#F4F8FD');
      bgGrad.addColorStop(1, '#E7F0FA');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    const halfW = w / (2 * this.cameraZoom) + 160;
    const halfH = h / (2 * this.cameraZoom) + 160;
    const viewMinX = this.cameraX - halfW;
    const viewMaxX = this.cameraX + halfW;
    const viewMinY = this.cameraY - halfH;
    const viewMaxY = this.cameraY + halfH;

    // 1. Arena Dual-Tier Grid & Ambient Spores
    this.renderGrid(ctx, viewMinX, viewMaxX, viewMinY, viewMaxY, isDark);

    // 2. Glowing Arena Boundary & Outer Void
    ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(203, 213, 225, 0.62)';
    if (viewMinX < 0) ctx.fillRect(viewMinX, viewMinY, -viewMinX, viewMaxY - viewMinY);
    if (viewMaxX > WORLD_SIZE)
      ctx.fillRect(WORLD_SIZE, viewMinY, viewMaxX - WORLD_SIZE, viewMaxY - viewMinY);
    if (viewMinY < 0)
      ctx.fillRect(
        Math.max(0, viewMinX),
        viewMinY,
        Math.min(WORLD_SIZE, viewMaxX) - Math.max(0, viewMinX),
        -viewMinY
      );
    if (viewMaxY > WORLD_SIZE)
      ctx.fillRect(
        Math.max(0, viewMinX),
        WORLD_SIZE,
        Math.min(WORLD_SIZE, viewMaxX) - Math.max(0, viewMinX),
        viewMaxY - WORLD_SIZE
      );

    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.22)';
    ctx.lineWidth = 22;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.strokeStyle = isDark ? '#38BDF8' : '#0284C7';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.restore();

    // 3. Ripples
    for (const r of this.ripples) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Food pellets
    for (const f of this.foods) {
      if (f.x < viewMinX || f.x > viewMaxX || f.y < viewMinY || f.y > viewMaxY) continue;
      if (f.isGolden) {
        const pulse = 1 + Math.sin(this.time * 4 + f.pulseOffset) * 0.14;
        ctx.save();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 1.55 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Ejected mass
    for (const e of this.ejected) {
      if (e.x < viewMinX || e.x > viewMaxX || e.y < viewMinY || e.y > viewMaxY) continue;
      ctx.fillStyle = e.color;
      ctx.strokeStyle = e.stroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 6. Particles
    for (const p of this.particles) {
      if (p.x < viewMinX || p.x > viewMaxX || p.y < viewMinY || p.y > viewMaxY) continue;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Sort cells ascending by mass; interleave viruses at mass 115 so small cells hide under viruses!
    const sortedCells = [...this.cells].sort((a, b) => a.mass - b.mass);
    let virusDrawn = false;

    for (const cell of sortedCells) {
      if (!virusDrawn && cell.mass >= 115) {
        this.renderViruses(ctx, viewMinX, viewMaxX, viewMinY, viewMaxY);
        virusDrawn = true;
      }
      if (
        cell.x + cell.radius < viewMinX ||
        cell.x - cell.radius > viewMaxX ||
        cell.y + cell.radius < viewMinY ||
        cell.y - cell.radius > viewMaxY
      ) {
        continue;
      }
      this.renderCell(ctx, cell);
    }

    if (!virusDrawn) {
      this.renderViruses(ctx, viewMinX, viewMaxX, viewMinY, viewMaxY);
    }

    ctx.restore();
  }

  private renderGrid(
    ctx: CanvasRenderingContext2D,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    isDark: boolean
  ) {
    const step = 64;
    const majorStep = 320;
    const startX = Math.max(0, Math.floor(minX / step) * step);
    const endX = Math.min(WORLD_SIZE, Math.ceil(maxX / step) * step);
    const startY = Math.max(0, Math.floor(minY / step) * step);
    const endY = Math.min(WORLD_SIZE, Math.ceil(maxY / step) * step);

    // Subtle floating bio-spores anchored to 320px sectors (distinct from food pellets)
    const sectorStartX = Math.max(majorStep, Math.floor(minX / majorStep) * majorStep);
    const sectorEndX = Math.min(WORLD_SIZE - majorStep, Math.ceil(maxX / majorStep) * majorStep);
    const sectorStartY = Math.max(majorStep, Math.floor(minY / majorStep) * majorStep);
    const sectorEndY = Math.min(WORLD_SIZE - majorStep, Math.ceil(maxY / majorStep) * majorStep);

    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.07)';
    for (let sx = sectorStartX; sx <= sectorEndX; sx += majorStep) {
      for (let sy = sectorStartY; sy <= sectorEndY; sy += majorStep) {
        const seed = (sx * 13 + sy * 29) % 360;
        const ox = sx + 120 + Math.sin(this.time * 0.45 + seed) * 28;
        const oy = sy + 120 + Math.cos(this.time * 0.38 + seed * 0.7) * 28;
        ctx.beginPath();
        ctx.arc(ox, oy, 16 + (seed % 14), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Minor grid lines
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.09)' : 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      if (x % majorStep === 0) continue;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      if (y % majorStep === 0) continue;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Major sector grid lines
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(14, 165, 233, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      if (x % majorStep !== 0) continue;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      if (y % majorStep !== 0) continue;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Crisp crosshairs at major sector intersections
    ctx.strokeStyle = isDark ? 'rgba(125, 211, 252, 0.32)' : 'rgba(2, 132, 199, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = sectorStartX; x <= sectorEndX; x += majorStep) {
      for (let y = sectorStartY; y <= sectorEndY; y += majorStep) {
        ctx.moveTo(x - 7, y);
        ctx.lineTo(x + 7, y);
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x, y + 7);
      }
    }
    ctx.stroke();
  }

  private renderViruses(
    ctx: CanvasRenderingContext2D,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) {
    for (const v of this.viruses) {
      if (
        v.x + v.radius < minX ||
        v.x - v.radius > maxX ||
        v.y + v.radius < minY ||
        v.y - v.radius > maxY
      ) {
        continue;
      }

      const spikes = 22;
      const outerR = v.radius * (1.06 + Math.sin(v.pulsePhase) * 0.02);
      const innerR = v.radius * 0.9;

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes + v.pulsePhase * 0.08;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = v.x + Math.cos(angle) * r;
        const py = v.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = 'rgba(34, 197, 94, 0.88)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#15803D';
      ctx.stroke();

      // Inner translucent nucleus ring
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.radius * 0.56, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(134, 239, 172, 0.25)';
      ctx.fill();
      ctx.restore();
    }
  }

  private renderCell(ctx: CanvasRenderingContext2D, cell: Cell) {
    const skinLevel: SkinLevel = cell.skinLevel ?? 1;
    const points = cell.radius > 70 ? 48 : cell.radius > 35 ? 36 : 24;
    const pulseScale = 1 + cell.eatPulse * 0.08;

    ctx.save();
    if (skinLevel >= 2) {
      drawVipOuterGlow(ctx, cell.skinId, cell.x, cell.y, cell.radius * pulseScale, this.time, skinLevel);
    }

    ctx.beginPath();

    for (let i = 0; i < points; i++) {
      const angle = (i * Math.PI * 2) / points;
      const wobbleAmp = Math.min(2.6, cell.radius * 0.025) * (1 + cell.eatPulse * 1.4);
      const wobble =
        Math.sin(angle * 4 + this.time * 4.2 + cell.wobblePhase) * wobbleAmp +
        Math.cos(angle * 3 - this.time * 2.8 + cell.wobblePhase) * (wobbleAmp * 0.5);
      const r = cell.radius * pulseScale + wobble;
      let px = cell.x + Math.cos(angle) * r;
      let py = cell.y + Math.sin(angle) * r;
      if (px < 0) px *= 0.36;
      else if (px > WORLD_SIZE) px = WORLD_SIZE + (px - WORLD_SIZE) * 0.36;
      if (py < 0) py *= 0.36;
      else if (py > WORLD_SIZE) py = WORLD_SIZE + (py - WORLD_SIZE) * 0.36;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    drawSkinPattern(ctx, cell.skinId, cell.x, cell.y, cell.radius * pulseScale, this.time, skinLevel);

    ctx.lineWidth = Math.max(3, Math.min(8, cell.radius * 0.08));
    ctx.strokeStyle = getDynamicSkinStroke(cell.skinId, this.time, skinLevel);
    ctx.stroke();

    // Name & Mass text
    if (cell.radius * this.cameraZoom > 15) {
      const fontSize = Math.max(12, Math.min(44, cell.radius * 0.36));
      ctx.font = `700 ${Math.round(fontSize)}px 'Noto Sans Arabic', 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2.5, fontSize * 0.16);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillStyle = '#FFFFFF';

      const yOffset = this.showMassOnCells && cell.radius * this.cameraZoom > 26 ? -fontSize * 0.3 : 0;
      ctx.strokeText(cell.name, cell.x, cell.y + yOffset);
      ctx.fillText(cell.name, cell.x, cell.y + yOffset);

      if (this.showMassOnCells && cell.radius * this.cameraZoom > 26) {
        const massFont = Math.max(10, Math.round(fontSize * 0.58));
        ctx.font = `700 ${massFont}px 'JetBrains Mono', monospace`;
        ctx.lineWidth = Math.max(2, massFont * 0.18);
        const massLabel = String(Math.round(cell.mass));
        ctx.strokeText(massLabel, cell.x, cell.y + fontSize * 0.48);
        ctx.fillText(massLabel, cell.x, cell.y + fontSize * 0.48);
      }
    }

    ctx.restore();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getSoftBorderMargin(radius: number): number {
  return radius <= 36 ? radius : 36 + (radius - 36) * 0.44;
}

function applySoftArenaBounds(
  cell: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    boostVx: number;
    boostVy: number;
    radius: number;
  },
  dt: number
) {
  const minMargin = getSoftBorderMargin(cell.radius);
  const maxX = WORLD_SIZE - minMargin;
  const maxY = WORLD_SIZE - minMargin;

  if (cell.radius > 36) {
    const cushionSpan = Math.max(1, cell.radius - minMargin);
    const frameScale = dt * 60;
    if (cell.x < cell.radius && cell.vx + cell.boostVx < 0) {
      const depth = clamp((cell.radius - cell.x) / cushionSpan, 0, 1);
      const damp = Math.pow(1 - 0.16 * depth, frameScale);
      cell.vx *= damp;
      cell.boostVx *= damp;
    } else if (cell.x > WORLD_SIZE - cell.radius && cell.vx + cell.boostVx > 0) {
      const depth = clamp((cell.x - (WORLD_SIZE - cell.radius)) / cushionSpan, 0, 1);
      const damp = Math.pow(1 - 0.16 * depth, frameScale);
      cell.vx *= damp;
      cell.boostVx *= damp;
    }

    if (cell.y < cell.radius && cell.vy + cell.boostVy < 0) {
      const depth = clamp((cell.radius - cell.y) / cushionSpan, 0, 1);
      const damp = Math.pow(1 - 0.16 * depth, frameScale);
      cell.vy *= damp;
      cell.boostVy *= damp;
    } else if (cell.y > WORLD_SIZE - cell.radius && cell.vy + cell.boostVy > 0) {
      const depth = clamp((cell.y - (WORLD_SIZE - cell.radius)) / cushionSpan, 0, 1);
      const damp = Math.pow(1 - 0.16 * depth, frameScale);
      cell.vy *= damp;
      cell.boostVy *= damp;
    }
  }

  if (cell.x < minMargin) {
    cell.x = minMargin;
    if (cell.boostVx < 0) cell.boostVx *= 0.12;
  } else if (cell.x > maxX) {
    cell.x = maxX;
    if (cell.boostVx > 0) cell.boostVx *= 0.12;
  }

  if (cell.y < minMargin) {
    cell.y = minMargin;
    if (cell.boostVy < 0) cell.boostVy *= 0.12;
  } else if (cell.y > maxY) {
    cell.y = maxY;
    if (cell.boostVy > 0) cell.boostVy *= 0.12;
  }
}
