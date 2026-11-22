export type GamePhase = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type PlayType = 'solo' | 'online';

export type GameMode = 'classic' | 'blitz' | 'relaxed' | 'merge';

export type ArenaTheme = 'light' | 'dark';

export type Language = 'ckb' | 'en';

export type SkinId =
  | 'ocean'
  | 'kurdish_sun'
  | 'crimson'
  | 'emerald'
  | 'amber_hive'
  | 'nebula'
  | 'obsidian'
  | 'rose_petal'
  | 'atomic'
  | 'mint_wave'
  | 'solar_flare'
  | 'royal_crown'
  | 'cyber_pulse'
  | 'golden_phoenix'
  | 'neon_lotus'
  | 'galaxy_dragon'
  | 'nexus_titan';

export type CurrencyType = 'coins' | 'dna';

export interface SkinDefinition {
  id: SkinId;
  nameCkb: string;
  nameEn: string;
  primary: string;
  secondary: string;
  stroke: string;
  textColor: string;
  price: number;
  currency: CurrencyType;
  seasonExclusive?: boolean;
}

export type BoostId = 'level_boost_2x' | 'level_boost_3x' | 'coin_boost_2x' | 'start_mass_boost' | 'xp_pack_500';

export interface BoostItemDefinition {
  id: BoostId;
  nameCkb: string;
  nameEn: string;
  descCkb: string;
  descEn: string;
  price: number;
  currency: CurrencyType;
  charges: number; // 0 = instant
  xpAmount?: number;
}

export interface ActiveBoosts {
  levelBoost2x: number;
  levelBoost3x: number;
  coinBoost2x: number;
  startMassBoost: number;
}

export interface PlayerProfile {
  coins: number;
  dna: number;
  score: number;
  xp: number;
  level: number;
  unlockedSkins: SkinId[];
  boosts: ActiveBoosts;
}

export interface MatchRewardSummary {
  scoreGained: number;
  coinsEarned: number;
  dnaEarned: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  boostMultiplier: number;
}

export interface Cell {
  id: string;
  ownerId: string;
  name: string;
  isPlayer: boolean;
  isHuman?: boolean;
  skinId: SkinId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  boostVx: number;
  boostVy: number;
  mass: number;
  radius: number;
  mergeTimer: number;
  wobblePhase: number;
  eatPulse: number;
  aiTargetX?: number;
  aiTargetY?: number;
  aiCooldown?: number;
  colorOverride?: string;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  mass: number;
  radius: number;
  color: string;
  isGolden: boolean;
  pulseOffset: number;
}

export interface EjectedMass {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  stroke: string;
  age: number;
}

export interface Virus {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  feedCount: number;
  lastFeedAngle: number;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface LeaderboardEntry {
  ownerId: string;
  name: string;
  mass: number;
  isPlayer: boolean;
  skinId: SkinId;
  rank: number;
}

export interface MinimapDot {
  x: number;
  y: number;
  radius: number;
  isPlayer: boolean;
  isLeader: boolean;
  isVirus?: boolean;
}

export interface HudSnapshot {
  mass: number;
  peakMass: number;
  score: number;
  rank: number;
  totalPlayers: number;
  cellsEaten: number;
  cellCount: number;
  elapsedSeconds: number;
  leaderboard: LeaderboardEntry[];
  minimapDots: MinimapDot[];
  worldSize: number;
  canSplit: boolean;
  canEject: boolean;
  killerName: string | null;
  onlinePlayers?: number;
  roomId?: string;
  foodsEaten?: number;
  splitsUsed?: number;
}

export type TargetFps = 30 | 60 | 120;

export interface GameConfig {
  nickname: string;
  skinId: SkinId;
  playType: PlayType;
  roomId: string;
  mode: GameMode;
  theme: ArenaTheme;
  showMassOnCells: boolean;
  targetFps: TargetFps;
  showFpsCounter: boolean;
}

export interface ControlPoint {
  xPct: number;
  yPct: number;
}

export interface ControlLayout {
  showJoystick: boolean;
  joystick: ControlPoint;
  split: ControlPoint;
  eject: ControlPoint;
  fastEject: ControlPoint;
  zoom: ControlPoint;
  minimap: ControlPoint;
}

export interface RoomSummary {
  id: string;
  mode: GameMode;
  onlinePlayers: number;
}

export interface NetCell {
  id: string;
  ownerId: string;
  name: string;
  skinId: SkinId;
  x: number;
  y: number;
  mass: number;
  radius: number;
  isHuman: boolean;
}

export interface NetFood {
  id: string;
  x: number;
  y: number;
  r: number;
  c: string;
  g: boolean;
}

export interface NetEjected {
  id: string;
  x: number;
  y: number;
  r: number;
  c: string;
  s: string;
}

export interface NetVirus {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface NetStatePayload {
  type: 'state';
  playerId: string;
  roomId: string;
  onlinePlayers: number;
  cells: NetCell[];
  foods: NetFood[];
  ejected: NetEjected[];
  viruses: NetVirus[];
  leaderboard: LeaderboardEntry[];
  minimapDots: MinimapDot[];
  rank: number;
  totalPlayers: number;
  mass: number;
  peakMass: number;
  cellsEaten: number;
  elapsedSeconds: number;
  canSplit: boolean;
  canEject: boolean;
}

export type PassTrack = 'free' | 'plus';
export type PassRewardType = 'coins' | 'dna' | 'xp' | 'skin' | 'boost';

export interface PassReward {
  tier: number;
  track: PassTrack;
  type: PassRewardType;
  amount?: number;
  skinId?: SkinId;
  boostId?: BoostId;
  labelCkb: string;
  labelEn: string;
}

export type ChallengeMetric =
  | 'foods'
  | 'maxPeakMass'
  | 'cellsEaten'
  | 'matches'
  | 'timeAlive'
  | 'splits';

export interface PassChallenge {
  id: string;
  titleCkb: string;
  titleEn: string;
  descCkb: string;
  descEn: string;
  metric: ChallengeMetric;
  stages: number[];
  passXpPerStage: number[];
  repeatableStep?: number;
  repeatableXp?: number;
}

export interface GamePassStats {
  foods: number;
  maxPeakMass: number;
  cellsEaten: number;
  matches: number;
  timeAlive: number;
  splits: number;
}

export interface GamePassState {
  seasonKey: string;
  passXp: number;
  hasPlus: boolean;
  claimedFree: number[];
  claimedPlus: number[];
  stats: GamePassStats;
  claimedChallengeStage: Record<string, number>;
}

export type MazeNodeRewardType = 'start' | 'coins' | 'dna' | 'boost' | 'key' | 'skin';

export interface MazeNode {
  id: string;
  x: number; // logical 0..900
  y: number; // logical 0..600
  cost: number;
  type: MazeNodeRewardType;
  amount?: number;
  boostId?: BoostId;
  skinId?: SkinId;
  labelCkb: string;
  labelEn: string;
  neighbors: string[];
}

export interface MazeEventState {
  eventKey: string;
  tokens: number;
  unlockedNodes: string[];
  currentNodeId: string;
  lastDailyClaimDate: string;
}

export type ShopTab = 'skins' | 'boosts';

export type AccountModalTab = 'account' | 'friends';

export interface PublicPlayerProfile {
  uid: string;
  playerCode: string;
  displayName: string;
  skinId: SkinId;
  level: number;
  score: number;
  bestMass: number;
  coins: number;
  dna: number;
  online: boolean;
  currentRoom: string;
}

export interface FriendRecord {
  friendUid: string;
  playerCode: string;
  displayName: string;
  skinId: SkinId;
  level: number;
  online?: boolean;
  currentRoom?: string;
}

export interface LiveServerPlayer {
  connectionId: string;
  uid: string;
  playerCode: string;
  name: string;
  skinId: SkinId;
  roomId: string;
  mass: number;
  level: number;
  inMatch: boolean;
}

export interface WeeklyTopEntry {
  uid: string;
  playerCode: string;
  displayName: string;
  skinId: SkinId;
  level: number;
  weekKey: string;
  bestMass: number;
  weeklyScore: number;
  cellsEaten: number;
  matchesCount: number;
  updatedAtMs?: number;
}



