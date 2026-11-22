import { SKINS, SKIN_MAP } from './skins.ts';
import type {
  Cell,
  EjectedMass,
  FoodPellet,
  GameMode,
  LeaderboardEntry,
  MinimapDot,
  NetStatePayload,
  SkinId,
  Virus,
} from './types.ts';

export const WORLD_SIZE = 4200;
const MAX_CELLS_PER_OWNER = 16;
const MAX_CELL_MASS = 25000;
const TARGET_FOOD_COUNT = 600;
const TARGET_BOT_COUNT = 32;
const TARGET_VIRUS_COUNT = 22;
const MAX_VIRUS_COUNT = 32;

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

export interface HumanSession {
  id: string;
  name: string;
  skinId: SkinId;
  targetX: number;
  targetY: number;
  stopped?: boolean;
  peakMass: number;
  cellsEaten: number;
  foodsEaten: number;
  splitsUsed: number;
  elapsedSeconds: number;
  alive: boolean;
  killerName: string | null;
}

export interface DeathNotification {
  playerId: string;
  peakMass: number;
  cellsEaten: number;
  foodsEaten: number;
  splitsUsed: number;
  elapsedSeconds: number;
  killerName: string | null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function massToRadius(mass: number): number {
  return 5.4 * Math.sqrt(Math.max(mass, 1)) + 4;
}

export class ServerArena {
  public readonly roomId: string;
  public readonly mode: GameMode;

  public cells: Cell[] = [];
  public foods: FoodPellet[] = [];
  public ejected: EjectedMass[] = [];
  public viruses: Virus[] = [];
  public humans = new Map<string, HumanSession>();

  private uidCounter = 1;
  private botCounter = 0;
  private botBrains = new Map<
    string,
    {
      targetX: number;
      targetY: number;
      cooldown: number;
      ejectCooldown: number;
    }
  >();

  constructor(roomId: string, mode: GameMode = 'classic') {
    this.roomId = roomId;
    this.mode = mode;

    for (let i = 0; i < TARGET_FOOD_COUNT; i++) {
      this.spawnFood();
    }
    for (let i = 0; i < TARGET_VIRUS_COUNT; i++) {
      this.spawnVirus();
    }
    for (let i = 0; i < TARGET_BOT_COUNT; i++) {
      this.spawnBot(true);
    }
  }

  private nextId(prefix: string): string {
    this.uidCounter += 1;
    return `${prefix}_${this.uidCounter}`;
  }

  public addHuman(
    playerId: string,
    name: string,
    skinId: SkinId,
    startMassBonus = 0
  ): HumanSession {
    this.removeHumanCells(playerId);

    const safePos = this.findSafeSpawn(180);
    const bonus = clamp(Number(startMassBonus) || 0, 0, 20);
    const baseStartMass = this.mode === 'blitz' ? 42 : this.mode === 'merge' ? 32 : 24;
    const startMass = baseStartMass + bonus;
    const cleanName = name.trim().slice(0, 16) || 'یاریزان';
    const validSkin: SkinId = SKIN_MAP[skinId] ? skinId : 'kurdish_sun';

    const session: HumanSession = {
      id: playerId,
      name: cleanName,
      skinId: validSkin,
      targetX: safePos.x,
      targetY: safePos.y,
      stopped: false,
      peakMass: startMass,
      cellsEaten: 0,
      foodsEaten: 0,
      splitsUsed: 0,
      elapsedSeconds: 0,
      alive: true,
      killerName: null,
    };

    this.humans.set(playerId, session);

    this.cells.push({
      id: this.nextId('h'),
      ownerId: playerId,
      name: cleanName,
      isPlayer: false,
      isHuman: true,
      skinId: validSkin,
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
    });

    return session;
  }

  public removeHuman(playerId: string) {
    this.humans.delete(playerId);
    this.removeHumanCells(playerId);
  }

  public getHumanMass(playerId: string): number {
    let total = 0;
    for (const c of this.cells) {
      if (c.ownerId === playerId) total += c.mass;
    }
    return Math.round(total);
  }

  public addHumanMass(playerId: string, amount: number): number {
    const human = this.humans.get(playerId);
    if (!human || !human.alive || amount <= 0) return 0;
    const owned = this.cells.filter((c) => c.ownerId === playerId);
    if (owned.length === 0) return 0;
    const perCell = amount / owned.length;
    for (const c of owned) {
      c.mass += perCell;
      c.radius = massToRadius(c.mass);
      c.eatPulse = 0.85;
    }
    this.enforceMaxCellMass();
    let total = 0;
    for (const c of this.cells) {
      if (c.ownerId === playerId) {
        total += c.mass;
      }
    }
    const rounded = Math.round(total);
    if (rounded > human.peakMass) {
      human.peakMass = rounded;
    }
    return rounded;
  }

  private removeHumanCells(playerId: string) {
    this.cells = this.cells.filter((c) => c.ownerId !== playerId);
  }

  public setHumanInput(playerId: string, targetX: number, targetY: number, stop = false) {
    const human = this.humans.get(playerId);
    if (!human || !human.alive) return;
    human.stopped = stop;
    if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
      human.targetX = clamp(targetX, 0, WORLD_SIZE);
      human.targetY = clamp(targetY, 0, WORLD_SIZE);
    }
  }

  public splitHuman(playerId: string) {
    const human = this.humans.get(playerId);
    if (!human || !human.alive) return;
    if (this.splitOwner(playerId, human.targetX, human.targetY)) {
      human.splitsUsed += 1;
    }
  }

  public ejectHuman(playerId: string, burstCount = 1) {
    const human = this.humans.get(playerId);
    if (!human || !human.alive) return;
    const owned = this.cells.filter((c) => c.ownerId === playerId);
    const safeBurst = Math.max(1, Math.min(3, Math.round(burstCount)));

    for (let b = 0; b < safeBurst; b++) {
      for (const cell of owned) {
        if (cell.mass < 34) continue;
        cell.mass -= 14;
        cell.radius = massToRadius(cell.mass);
        const baseAngle = Math.atan2(human.targetY - cell.y, human.targetX - cell.x);
        const jitter = safeBurst > 1 ? (Math.random() - 0.5) * 0.14 : 0;
        const angle = baseAngle + jitter;
        const skin = SKIN_MAP[cell.skinId] || SKIN_MAP.ocean;
        const speed = safeBurst > 1 ? 820 : 690;

        this.ejected.push({
          id: this.nextId('e'),
          ownerId: cell.ownerId,
          x: cell.x + Math.cos(angle) * (cell.radius + 10),
          y: cell.y + Math.sin(angle) * (cell.radius + 10),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          mass: 14,
          radius: massToRadius(14),
          color: skin.secondary,
          stroke: skin.stroke,
          age: 0,
        });
      }
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
      id: this.nextId('e'),
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

  public step(dtRaw: number): DeathNotification[] {
    const dt = Math.min(dtRaw, 0.06);
    const deaths: DeathNotification[] = [];

    for (const human of this.humans.values()) {
      if (human.alive) {
        human.elapsedSeconds += dt;
      }
    }

    const speedMult =
      this.mode === 'blitz'
        ? 1.28
        : this.mode === 'merge'
        ? 1.15
        : this.mode === 'relaxed'
        ? 0.96
        : 1.0;

    // Precompute each human's center of mass so centered split pieces gather together
    const humanCenters = new Map<string, { cx: number; cy: number; count: number; totalMass: number; sx: number; sy: number }>();
    for (const c of this.cells) {
      if (!this.humans.has(c.ownerId)) continue;
      const entry = humanCenters.get(c.ownerId);
      if (entry) {
        entry.count += 1;
        entry.totalMass += c.mass;
        entry.sx += c.x * c.mass;
        entry.sy += c.y * c.mass;
      } else {
        humanCenters.set(c.ownerId, {
          cx: c.x,
          cy: c.y,
          count: 1,
          totalMass: c.mass,
          sx: c.x * c.mass,
          sy: c.y * c.mass,
        });
      }
    }
    for (const entry of humanCenters.values()) {
      entry.cx = entry.sx / entry.totalMass;
      entry.cy = entry.sy / entry.totalMass;
    }

    // 1. Compute unified decision per bot ownerId, then update cell movement
    this.updateUnifiedBotBrains(dt);

    for (const cell of this.cells) {
      if (cell.mergeTimer > 0) {
        cell.mergeTimer = Math.max(0, cell.mergeTimer - dt);
      }

      if (cell.mass > 140) {
        const decayRate = this.mode === 'blitz' ? 0.0022 : 0.0014;
        cell.mass -= cell.mass * decayRate * dt;
        cell.radius = massToRadius(cell.mass);
      }

      let targetX = cell.x;
      let targetY = cell.y;
      let isStopped = false;

      const human = this.humans.get(cell.ownerId);
      if (human) {
        if (human.stopped) {
          const center = humanCenters.get(cell.ownerId);
          if (!center || center.count <= 1 || Math.hypot(center.cx - cell.x, center.cy - cell.y) < 4) {
            isStopped = true;
            targetX = cell.x;
            targetY = cell.y;
          } else {
            targetX = center.cx;
            targetY = center.cy;
          }
        } else {
          targetX = human.targetX;
          targetY = human.targetY;
        }
      } else {
        const brain = this.botBrains.get(cell.ownerId);
        targetX = brain ? brain.targetX : (cell.aiTargetX ?? cell.x);
        targetY = brain ? brain.targetY : (cell.aiTargetY ?? cell.y);
      }

      const dx = targetX - cell.x;
      const dy = targetY - cell.y;
      const dist = Math.hypot(dx, dy);

      const isHumanCell = this.humans.has(cell.ownerId);
      const botAgility = isHumanCell ? 1.0 : 1.12;
      const baseSpeed = (340 / Math.pow(cell.mass, 0.34)) * speedMult * botAgility;
      const throttle = dist < 14 ? dist / 14 : 1;

      if (!isStopped && dist > 1.5) {
        const desiredVx = (dx / dist) * baseSpeed * throttle;
        const desiredVy = (dy / dist) * baseSpeed * throttle;
        const accel = (isHumanCell ? 9.5 : 16.5) * dt;
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

      cell.boostVx *= Math.pow(0.055, dt);
      cell.boostVy *= Math.pow(0.055, dt);

      cell.x += (cell.vx + cell.boostVx) * dt;
      cell.y += (cell.vy + cell.boostVy) * dt;

      if (cell.x < cell.radius) {
        cell.x = cell.radius;
        cell.boostVx = Math.abs(cell.boostVx) * 0.4;
      } else if (cell.x > WORLD_SIZE - cell.radius) {
        cell.x = WORLD_SIZE - cell.radius;
        cell.boostVx = -Math.abs(cell.boostVx) * 0.4;
      }
      if (cell.y < cell.radius) {
        cell.y = cell.radius;
        cell.boostVy = Math.abs(cell.boostVy) * 0.4;
      } else if (cell.y > WORLD_SIZE - cell.radius) {
        cell.y = WORLD_SIZE - cell.radius;
        cell.boostVy = -Math.abs(cell.boostVy) * 0.4;
      }
    }

    // 2. Same-owner repulsion / merging
    this.resolveSameOwnerInteractions(dt);

    // 3. Ejected mass & virus feeding
    this.updateEjectedMass(dt);

    // 4. Virus collisions
    this.updateViruses(dt);

    // 5. Food eating
    this.resolveFoodEating();

    // 6. Cell vs cell eating & 25k per-cell cap
    this.resolveCellEating();
    this.enforceMaxCellMass();

    // 7. Replenish world
    while (this.foods.length < TARGET_FOOD_COUNT) {
      this.spawnFood();
    }
    while (this.viruses.length < TARGET_VIRUS_COUNT) {
      this.spawnVirus();
    }
    const activeBotOwners = new Set(
      this.cells.filter((c) => !this.humans.has(c.ownerId)).map((c) => c.ownerId)
    );
    const botCap = Math.max(12, TARGET_BOT_COUNT - Math.max(0, this.humans.size - 1));
    while (activeBotOwners.size < botCap) {
      this.spawnBot(false);
      const latest = this.cells[this.cells.length - 1];
      if (latest) activeBotOwners.add(latest.ownerId);
    }

    // 8. Track human peak mass and deaths
    for (const human of this.humans.values()) {
      if (!human.alive) continue;
      const owned = this.cells.filter((c) => c.ownerId === human.id);
      if (owned.length === 0) {
        human.alive = false;
        deaths.push({
          playerId: human.id,
          peakMass: Math.round(human.peakMass),
          cellsEaten: human.cellsEaten,
          foodsEaten: human.foodsEaten,
          splitsUsed: human.splitsUsed,
          elapsedSeconds: Math.floor(human.elapsedSeconds),
          killerName: human.killerName,
        });
      } else {
        const totalMass = owned.reduce((sum, c) => sum + c.mass, 0);
        if (totalMass > human.peakMass) {
          human.peakMass = totalMass;
        }
      }
    }

    return deaths;
  }

  public getStateForPlayer(playerId: string): NetStatePayload | null {
    const human = this.humans.get(playerId);
    if (!human) return null;

    const ownerTotals = new Map<
      string,
      { ownerId: string; name: string; mass: number; skinId: SkinId; isHuman: boolean }
    >();

    for (const c of this.cells) {
      const existing = ownerTotals.get(c.ownerId);
      if (existing) {
        existing.mass += c.mass;
      } else {
        ownerTotals.set(c.ownerId, {
          ownerId: c.ownerId,
          name: c.name,
          mass: c.mass,
          skinId: c.skinId,
          isHuman: Boolean(c.isHuman),
        });
      }
    }

    const sorted = Array.from(ownerTotals.values()).sort((a, b) => b.mass - a.mass);
    const leaderboard: LeaderboardEntry[] = sorted.slice(0, 5).map((entry, idx) => ({
      ownerId: entry.ownerId,
      name: entry.name,
      mass: Math.round(entry.mass),
      isPlayer: entry.ownerId === playerId,
      skinId: entry.skinId,
      rank: idx + 1,
    }));

    const playerIndex = sorted.findIndex((e) => e.ownerId === playerId);
    const playerEntry = playerIndex >= 0 ? sorted[playerIndex] : null;
    const playerCells = this.cells.filter((c) => c.ownerId === playerId);

    // Center for food culling
    let cx = WORLD_SIZE / 2;
    let cy = WORLD_SIZE / 2;
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

    const cullDist = 1750;
    const foods = this.foods
      .filter((f) => Math.abs(f.x - cx) < cullDist && Math.abs(f.y - cy) < cullDist)
      .map((f) => ({
        id: f.id,
        x: Math.round(f.x),
        y: Math.round(f.y),
        r: Number(f.radius.toFixed(1)),
        c: f.color,
        g: f.isGolden,
      }));

    const leaderId = sorted[0]?.ownerId;
    const minimapDots: MinimapDot[] = [];
    for (const c of this.cells) {
      if (c.ownerId === playerId || c.ownerId === leaderId || c.isHuman) {
        minimapDots.push({
          x: Math.round(c.x),
          y: Math.round(c.y),
          radius: Math.round(c.radius),
          isPlayer: c.ownerId === playerId,
          isLeader: c.ownerId === leaderId,
        });
      }
    }

    return {
      type: 'state',
      playerId,
      roomId: this.roomId,
      onlinePlayers: this.humans.size,
      cells: this.cells.map((c) => ({
        id: c.id,
        ownerId: c.ownerId,
        name: c.name,
        skinId: c.skinId,
        x: Math.round(c.x * 10) / 10,
        y: Math.round(c.y * 10) / 10,
        mass: Math.round(c.mass * 10) / 10,
        radius: Math.round(c.radius * 10) / 10,
        isHuman: Boolean(c.isHuman),
      })),
      foods,
      ejected: this.ejected.map((e) => ({
        id: e.id,
        x: Math.round(e.x),
        y: Math.round(e.y),
        r: Math.round(e.radius),
        c: e.color,
        s: e.stroke,
      })),
      viruses: this.viruses.map((v) => ({
        id: v.id,
        x: Math.round(v.x),
        y: Math.round(v.y),
        r: Math.round(v.radius),
      })),
      leaderboard,
      minimapDots,
      rank: playerIndex >= 0 ? playerIndex + 1 : 0,
      totalPlayers: sorted.length,
      mass: playerEntry ? Math.round(playerEntry.mass) : 0,
      peakMass: Math.round(human.peakMass),
      cellsEaten: human.cellsEaten,
      elapsedSeconds: Math.floor(human.elapsedSeconds),
      canSplit:
        playerCells.length < MAX_CELLS_PER_OWNER && playerCells.some((c) => c.mass >= 36),
      canEject: playerCells.some((c) => c.mass >= 34),
    };
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
      id: this.nextId('f'),
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
      id: this.nextId('v'),
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
      id: this.nextId('b'),
      ownerId,
      name,
      isPlayer: false,
      isHuman: false,
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

  private splitOwner(ownerId: string, targetX: number, targetY: number): boolean {
    const owned = this.cells.filter((c) => c.ownerId === ownerId);
    if (owned.length >= MAX_CELLS_PER_OWNER) return false;

    const newCells: Cell[] = [];
    let availableSlots = MAX_CELLS_PER_OWNER - owned.length;
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
          : Math.atan2(cell.vy, cell.vx) || 0;
      if (Number.isNaN(angle)) angle = 0;

      const launchSpeed = Math.min(980, 650 + cell.radius * 3.8);
      const childRadius = massToRadius(halfMass);

      cell.boostVx -= Math.cos(angle) * launchSpeed * 0.08;
      cell.boostVy -= Math.sin(angle) * launchSpeed * 0.08;

      newCells.push({
        id: this.nextId(cell.isHuman ? 'h' : 'b'),
        ownerId: cell.ownerId,
        name: cell.name,
        isPlayer: false,
        isHuman: cell.isHuman,
        skinId: cell.skinId,
        x: clamp(cell.x + Math.cos(angle) * childRadius * 1.12, childRadius, WORLD_SIZE - childRadius),
        y: clamp(cell.y + Math.sin(angle) * childRadius * 1.12, childRadius, WORLD_SIZE - childRadius),
        vx: cell.vx,
        vy: cell.vy,
        boostVx: Math.cos(angle) * launchSpeed,
        boostVy: Math.sin(angle) * launchSpeed,
        mass: halfMass,
        radius: childRadius,
        mergeTimer: mergeDelay,
        wobblePhase: Math.random() * Math.PI * 2,
        eatPulse: 0.55,
      });
      availableSlots -= 1;
    }

    if (newCells.length > 0) {
      this.cells.push(...newCells);
      return true;
    }
    return false;
  }

  private updateUnifiedBotBrains(dt: number) {
    const groups = new Map<string, Cell[]>();
    for (const c of this.cells) {
      if (this.humans.has(c.ownerId)) continue;
      let list = groups.get(c.ownerId);
      if (!list) {
        list = [];
        groups.set(c.ownerId, list);
      }
      list.push(c);
    }

    for (const ownerId of this.botBrains.keys()) {
      if (!groups.has(ownerId)) {
        this.botBrains.delete(ownerId);
      }
    }

    const aggression = this.mode === 'relaxed' ? 0.95 : this.mode === 'blitz' ? 1.55 : 1.38;
    const maxBotSplitPieces = this.mode === 'merge' ? 12 : 10;

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
            const isHumanTarget = this.humans.has(other.ownerId);
            const huntScore = other.mass * splitVulnerability * (isHumanTarget ? 1.25 : 1.1) - dist * 0.18;
            if (huntScore > distantHuntScore) {
              distantHuntScore = huntScore;
              distantHuntTarget = other;
            }
          }
          continue;
        }

        if (dist > awarenessRange) continue;

        // Track serious threats for safe split decisions
        if (other.mass > largest.mass * 0.68 && dist < nearestThreatDist) {
          nearestThreatDist = dist;
          nearestThreatMass = Math.max(nearestThreatMass, other.mass);
        }

        // Pro threat assessment: only flee from threats within genuine danger/split range
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
          const humanBonus = this.humans.has(other.ownerId) ? 1.25 : 1.12;
          const score =
            other.mass * (canSplitKill ? 6.2 : 3.9) * poppedBonus * humanBonus - capDist * 0.26;
          if (score > bestPreyScore) {
            bestPreyScore = score;
            bestPrey = other;
            bestAttacker = capPiece;
          }
        }
      }

      // Avoid arena corners/walls when moving or fleeing
      const wallMargin = 240;
      if (cx < wallMargin) fleeX += ((wallMargin - cx) / wallMargin) * 1.65;
      if (cx > WORLD_SIZE - wallMargin) fleeX -= ((cx - (WORLD_SIZE - wallMargin)) / wallMargin) * 1.65;
      if (cy < wallMargin) fleeY += ((wallMargin - cy) / wallMargin) * 1.65;
      if (cy > WORLD_SIZE - wallMargin) fleeY -= ((cy - (WORLD_SIZE - wallMargin)) / wallMargin) * 1.65;

      // Virus evasion + pro offensive virus-popping targeting (both bots & humans)
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

          if (
            this.mode !== 'relaxed' &&
            largest.mass >= 138 &&
            dist > largest.radius + v.radius + 16 &&
            dist < 620
          ) {
            for (const other of this.cells) {
              if (other.ownerId === ownerId) continue;
              if (other.mass < 118) continue;
              const isHumanTarget = this.humans.has(other.ownerId);
              if (!isHumanTarget && other.mass < largest.mass * 0.45) continue;

              const predRx = other.x + (other.vx + other.boostVx) * 0.26;
              const predRy = other.y + (other.vy + other.boostVy) * 0.26;
              const vToRival = Math.hypot(predRx - v.x, predRy - v.y);
              if (vToRival < other.radius + v.radius + 310) {
                const priority =
                  (isHumanTarget ? 4500 : 2800) + other.mass * 1.4 - vToRival * 2.1 - dist;
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

      // Offensive pro virus-shooting attack to pop humans & rival bots
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
              removedIds.add(prey.id);
            } else {
              const transfer = MAX_CELL_MASS - eater.mass;
              eater.mass = MAX_CELL_MASS;
              eater.radius = massToRadius(eater.mass);
              prey.mass -= transfer;
              if (prey.mass < 2) {
                removedIds.add(prey.id);
              } else {
                prey.radius = massToRadius(prey.mass);
              }
            }
          } else if (dist < pullRange && dist > 1) {
            a.x += (dx / dist) * pullSpeed;
            a.y += (dy / dist) * pullSpeed;
            b.x -= (dx / dist) * pullSpeed;
            b.y -= (dy / dist) * pullSpeed;
          }
        } else if (dist < minDist && dist > 0.001) {
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
        const launchSpeed = Math.min(820, 480 + childRadius * 2.2);

        spawned.push({
          id: this.nextId(cell.isHuman ? 'h' : 'b'),
          ownerId: cell.ownerId,
          name: cell.name,
          isPlayer: false,
          isHuman: cell.isHuman,
          skinId: cell.skinId,
          x: clamp(cell.x + Math.cos(angle) * childRadius * 0.95, childRadius, WORLD_SIZE - childRadius),
          y: clamp(cell.y + Math.sin(angle) * childRadius * 0.95, childRadius, WORLD_SIZE - childRadius),
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

    for (const e of this.ejected) {
      e.age += dt;
      e.vx *= Math.pow(0.04, dt);
      e.vy *= Math.pow(0.04, dt);
      e.x = clamp(e.x + e.vx * dt, e.radius, WORLD_SIZE - e.radius);
      e.y = clamp(e.y + e.vy * dt, e.radius, WORLD_SIZE - e.radius);

      let consumed = false;

      for (const v of this.viruses) {
        if (Math.hypot(e.x - v.x, e.y - v.y) < v.radius + e.radius * 0.5) {
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

      for (const c of this.cells) {
        if (c.ownerId === e.ownerId && e.age < 0.28) continue;
        if (Math.hypot(e.x - c.x, e.y - c.y) < c.radius) {
          c.mass += e.mass;
          c.radius = massToRadius(c.mass);
          consumed = true;
          break;
        }
      }

      if (!consumed && e.age < 45) {
        remaining.push(e);
      }
    }

    this.ejected = remaining;
  }

  private updateViruses(dt: number) {
    const newFragments: Cell[] = [];
    const poppedViruses = new Set<string>();

    for (const v of this.viruses) {
      v.vx *= Math.pow(0.06, dt);
      v.vy *= Math.pow(0.06, dt);
      v.x = clamp(v.x + v.vx * dt, v.radius + 20, WORLD_SIZE - v.radius - 20);
      v.y = clamp(v.y + v.vy * dt, v.radius + 20, WORLD_SIZE - v.radius - 20);

      for (const cell of this.cells) {
        if (cell.mass < 122) continue;
        const dist = Math.hypot(cell.x - v.x, cell.y - v.y);
        if (dist < cell.radius - v.radius * 0.2) {
          poppedViruses.add(v.id);
          const ownerCount =
            this.cells.filter((c) => c.ownerId === cell.ownerId).length +
            newFragments.filter((c) => c.ownerId === cell.ownerId).length;
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
              newFragments.push({
                id: this.nextId(cell.isHuman ? 'h' : 'b'),
                ownerId: cell.ownerId,
                name: cell.name,
                isPlayer: false,
                isHuman: cell.isHuman,
                skinId: cell.skinId,
                x: clamp(cell.x + Math.cos(angle) * (r * 0.9), r, WORLD_SIZE - r),
                y: clamp(cell.y + Math.sin(angle) * (r * 0.9), r, WORLD_SIZE - r),
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
          if (c.isHuman) {
            const human = this.humans.get(c.ownerId);
            if (human) human.foodsEaten += 1;
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
        if (eater.mass <= prey.mass * 1.22) continue;

        const dist = Math.hypot(eater.x - prey.x, eater.y - prey.y);
        if (dist < eater.radius - prey.radius * 0.32) {
          eater.mass += prey.mass;
          eater.radius = massToRadius(eater.mass);
          deadIds.add(prey.id);

          const eaterHuman = this.humans.get(eater.ownerId);
          if (eaterHuman) {
            eaterHuman.cellsEaten += 1;
          }

          const preyHuman = this.humans.get(prey.ownerId);
          if (preyHuman) {
            const remainingPreyCells = this.cells.filter(
              (c) => c.ownerId === prey.ownerId && !deadIds.has(c.id)
            );
            if (remainingPreyCells.length === 0) {
              preyHuman.killerName = eater.name;
            }
          }
        }
      }
    }

    if (deadIds.size > 0) {
      this.cells = this.cells.filter((c) => !deadIds.has(c.id));
    }
  }
}
