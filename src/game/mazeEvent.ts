import { MazeEventState, MazeNode, PlayerProfile } from './types';

export const MAZE_EVENT_STORAGE_KEY = 'xane_maze_event_v1';

export const MAZE_WIDTH = 920;
export const MAZE_HEIGHT = 600;

export const MAZE_NODES: MazeNode[] = [
  {
    id: 'start',
    x: 450,
    y: 310,
    cost: 0,
    type: 'start',
    labelCkb: 'تۆ',
    labelEn: 'You',
    neighbors: ['n_top_key', 'n_left_dna', 'n_right_coins', 'n_bot_coins'],
  },
  {
    id: 'n_top_key',
    x: 450,
    y: 195,
    cost: 10,
    type: 'key',
    amount: 80,
    labelCkb: '+80 کوین',
    labelEn: '+80 Coins',
    neighbors: ['start', 'n_top_left', 'n_top_right'],
  },
  {
    id: 'n_top_left',
    x: 310,
    y: 120,
    cost: 15,
    type: 'boost',
    boostId: 'coin_boost_2x',
    labelCkb: 'بووستی کوین 2x',
    labelEn: '2x Coin Boost',
    neighbors: ['n_top_key', 'n_vault_dna'],
  },
  {
    id: 'n_vault_dna',
    x: 165,
    y: 110,
    cost: 20,
    type: 'dna',
    amount: 18,
    labelCkb: '+18 DNA',
    labelEn: '+18 DNA',
    neighbors: ['n_top_left', 'n_left_boost'],
  },
  {
    id: 'n_top_right',
    x: 590,
    y: 120,
    cost: 15,
    type: 'coins',
    amount: 180,
    labelCkb: '+180 کوین',
    labelEn: '+180 Coins',
    neighbors: ['n_top_key', 'n_vault_coins', 'n_right_coins'],
  },
  {
    id: 'n_vault_coins',
    x: 745,
    y: 110,
    cost: 25,
    type: 'coins',
    amount: 500,
    labelCkb: '+500 کوین',
    labelEn: '+500 Coins',
    neighbors: ['n_top_right', 'n_titan'],
  },
  {
    id: 'n_left_dna',
    x: 305,
    y: 310,
    cost: 10,
    type: 'dna',
    amount: 4,
    labelCkb: '+4 DNA',
    labelEn: '+4 DNA',
    neighbors: ['start', 'n_left_boost', 'n_left_key'],
  },
  {
    id: 'n_left_boost',
    x: 165,
    y: 255,
    cost: 15,
    type: 'boost',
    boostId: 'start_mass_boost',
    labelCkb: 'بارستەی سەرەتا',
    labelEn: 'Mass Boost',
    neighbors: ['n_left_dna', 'n_vault_dna'],
  },
  {
    id: 'n_left_key',
    x: 180,
    y: 415,
    cost: 18,
    type: 'key',
    amount: 150,
    labelCkb: '+150 کوین',
    labelEn: '+150 Coins',
    neighbors: ['n_left_dna', 'n_bot_left_dna'],
  },
  {
    id: 'n_right_coins',
    x: 595,
    y: 310,
    cost: 15,
    type: 'coins',
    amount: 120,
    labelCkb: '+120 کوین',
    labelEn: '+120 Coins',
    neighbors: ['start', 'n_top_right', 'n_right_boost'],
  },
  {
    id: 'n_right_boost',
    x: 695,
    y: 400,
    cost: 20,
    type: 'boost',
    boostId: 'level_boost_3x',
    labelCkb: 'مێگا بووستی 3x',
    labelEn: '3x XP Boost',
    neighbors: ['n_right_coins', 'n_titan', 'n_bot_right_coins'],
  },
  {
    id: 'n_titan',
    x: 790,
    y: 245,
    cost: 35,
    type: 'skin',
    skinId: 'nexus_titan',
    labelCkb: 'تایتانی نێکسەس',
    labelEn: 'Nexus Titan',
    neighbors: ['n_vault_coins', 'n_right_boost'],
  },
  {
    id: 'n_bot_coins',
    x: 450,
    y: 430,
    cost: 10,
    type: 'coins',
    amount: 90,
    labelCkb: '+90 کوین',
    labelEn: '+90 Coins',
    neighbors: ['start', 'n_bot_left_dna', 'n_bot_right_coins'],
  },
  {
    id: 'n_bot_left_dna',
    x: 295,
    y: 505,
    cost: 18,
    type: 'dna',
    amount: 12,
    labelCkb: '+12 DNA',
    labelEn: '+12 DNA',
    neighbors: ['n_bot_coins', 'n_left_key'],
  },
  {
    id: 'n_bot_right_coins',
    x: 625,
    y: 505,
    cost: 22,
    type: 'coins',
    amount: 320,
    labelCkb: '+320 کوین',
    labelEn: '+320 Coins',
    neighbors: ['n_bot_coins', 'n_right_boost'],
  },
];

export const MAZE_NODE_MAP: Record<string, MazeNode> = MAZE_NODES.reduce(
  (acc, node) => {
    acc[node.id] = node;
    return acc;
  },
  {} as Record<string, MazeNode>
);

function getCurrentEventKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function createInitialMazeEvent(): MazeEventState {
  return {
    eventKey: getCurrentEventKey(),
    tokens: 25,
    unlockedNodes: ['start'],
    currentNodeId: 'start',
    lastDailyClaimDate: '',
  };
}

export function loadMazeEvent(): MazeEventState {
  const key = getCurrentEventKey();
  try {
    const raw = localStorage.getItem(MAZE_EVENT_STORAGE_KEY);
    if (!raw) return createInitialMazeEvent();
    const parsed = JSON.parse(raw) as Partial<MazeEventState>;
    if (parsed.eventKey && parsed.eventKey !== key) {
      return createInitialMazeEvent();
    }
    return {
      eventKey: key,
      tokens: typeof parsed.tokens === 'number' ? Math.max(0, parsed.tokens) : 25,
      unlockedNodes:
        Array.isArray(parsed.unlockedNodes) && parsed.unlockedNodes.includes('start')
          ? parsed.unlockedNodes
          : ['start'],
      currentNodeId:
        typeof parsed.currentNodeId === 'string' && MAZE_NODE_MAP[parsed.currentNodeId]
          ? parsed.currentNodeId
          : 'start',
      lastDailyClaimDate:
        typeof parsed.lastDailyClaimDate === 'string' ? parsed.lastDailyClaimDate : '',
    };
  } catch {
    return createInitialMazeEvent();
  }
}

export function saveMazeEvent(state: MazeEventState): void {
  try {
    localStorage.setItem(MAZE_EVENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function getReachableMazeNodeIds(state: MazeEventState): Set<string> {
  const unlocked = new Set(state.unlockedNodes);
  const reachable = new Set<string>();
  for (const id of state.unlockedNodes) {
    const node = MAZE_NODE_MAP[id];
    if (!node) continue;
    for (const neighborId of node.neighbors) {
      if (!unlocked.has(neighborId)) {
        reachable.add(neighborId);
      }
    }
  }
  return reachable;
}

export function countAffordableMazeMoves(state: MazeEventState): number {
  const reachable = getReachableMazeNodeIds(state);
  let count = 0;
  for (const id of reachable) {
    const node = MAZE_NODE_MAP[id];
    if (node && state.tokens >= node.cost) {
      count += 1;
    }
  }
  if (state.lastDailyClaimDate !== getTodayKey()) {
    count += 1;
  }
  return count;
}

export function unlockMazeNode(
  profile: PlayerProfile,
  eventState: MazeEventState,
  nodeId: string
): { nextProfile: PlayerProfile; nextEvent: MazeEventState; unlocked: boolean } {
  const node = MAZE_NODE_MAP[nodeId];
  if (!node) return { nextProfile: profile, nextEvent: eventState, unlocked: false };

  if (eventState.unlockedNodes.includes(nodeId)) {
    // Allow moving marker to already unlocked node for free
    return {
      nextProfile: profile,
      nextEvent: { ...eventState, currentNodeId: nodeId },
      unlocked: false,
    };
  }

  const reachable = getReachableMazeNodeIds(eventState);
  if (!reachable.has(nodeId) || eventState.tokens < node.cost) {
    return { nextProfile: profile, nextEvent: eventState, unlocked: false };
  }

  const nextProfile: PlayerProfile = {
    ...profile,
    unlockedSkins: [...profile.unlockedSkins],
    boosts: { ...profile.boosts },
  };

  if ((node.type === 'coins' || node.type === 'key') && node.amount) {
    nextProfile.coins += node.amount;
  } else if (node.type === 'dna' && node.amount) {
    nextProfile.dna += node.amount;
  } else if (node.type === 'boost' && node.boostId) {
    if (node.boostId === 'coin_boost_2x') nextProfile.boosts.coinBoost2x += 2;
    else if (node.boostId === 'level_boost_3x') nextProfile.boosts.levelBoost3x += 2;
    else if (node.boostId === 'start_mass_boost') nextProfile.boosts.startMassBoost += 2;
  } else if (node.type === 'skin' && node.skinId) {
    if (!nextProfile.unlockedSkins.includes(node.skinId)) {
      nextProfile.unlockedSkins.push(node.skinId);
    }
  }

  const nextEvent: MazeEventState = {
    ...eventState,
    tokens: eventState.tokens - node.cost,
    unlockedNodes: [...eventState.unlockedNodes, nodeId],
    currentNodeId: nodeId,
  };

  return { nextProfile, nextEvent, unlocked: true };
}

export function claimDailyEventTokens(eventState: MazeEventState): {
  nextEvent: MazeEventState;
  claimed: boolean;
} {
  const today = getTodayKey();
  if (eventState.lastDailyClaimDate === today) {
    return { nextEvent: eventState, claimed: false };
  }
  return {
    nextEvent: {
      ...eventState,
      tokens: eventState.tokens + 15,
      lastDailyClaimDate: today,
    },
    claimed: true,
  };
}

export function recordMatchIntoMazeEvent(
  eventState: MazeEventState,
  peakMass: number,
  cellsEaten: number
): { nextEvent: MazeEventState; tokensEarned: number } {
  const tokensEarned = Math.max(8, 8 + cellsEaten * 3 + Math.floor(peakMass / 45));
  return {
    nextEvent: {
      ...eventState,
      tokens: eventState.tokens + tokensEarned,
    },
    tokensEarned,
  };
}
