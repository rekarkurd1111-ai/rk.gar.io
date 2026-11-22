import { applyXpGain } from './progression';
import {
  BoostId,
  GamePassState,
  PassChallenge,
  PassReward,
  PassTrack,
  PlayerProfile,
  SkinId,
} from './types';

export const GAME_PASS_STORAGE_KEY = 'xane_game_pass_v1';
export const PASS_XP_PER_TIER = 100;
export const MAX_PASS_TIER = 50;

export function getCurrentSeasonKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getSeasonRemaining(): { days: number; hours: number } {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  const diffMs = Math.max(0, endOfMonth.getTime() - now.getTime());
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}

export function getPassTier(passXp: number): number {
  return Math.min(MAX_PASS_TIER, Math.floor(Math.max(0, passXp) / PASS_XP_PER_TIER) + 1);
}

export function getPassTierProgress(passXp: number): {
  tier: number;
  currentInTier: number;
  neededForNext: number;
  percent: number;
} {
  const tier = getPassTier(passXp);
  if (tier >= MAX_PASS_TIER) {
    return {
      tier: MAX_PASS_TIER,
      currentInTier: PASS_XP_PER_TIER,
      neededForNext: PASS_XP_PER_TIER,
      percent: 100,
    };
  }
  const currentInTier = Math.max(0, passXp) % PASS_XP_PER_TIER;
  return {
    tier,
    currentInTier,
    neededForNext: PASS_XP_PER_TIER,
    percent: Math.round((currentInTier / PASS_XP_PER_TIER) * 100),
  };
}

// 50 Modest Free Rewards (دیاری سادە و ئاسایی)
export const FREE_REWARDS: PassReward[] = Array.from({ length: MAX_PASS_TIER }, (_, idx) => {
  const tier = idx + 1;
  if (tier % 10 === 0) {
    const dnaAmt = tier === 50 ? 5 : 2 + Math.floor(tier / 20);
    return {
      tier,
      track: 'free',
      type: 'dna',
      amount: dnaAmt,
      labelCkb: `+${dnaAmt} DNA`,
      labelEn: `+${dnaAmt} DNA`,
    };
  }
  if (tier % 5 === 0) {
    const xpAmt = 60 + tier * 2;
    return {
      tier,
      track: 'free',
      type: 'xp',
      amount: xpAmt,
      labelCkb: `+${xpAmt} XP`,
      labelEn: `+${xpAmt} XP`,
    };
  }
  if (tier % 2 === 1) {
    const coinsAmt = 15 + Math.floor(tier / 2);
    return {
      tier,
      track: 'free',
      type: 'coins',
      amount: coinsAmt,
      labelCkb: `+${coinsAmt} کوین`,
      labelEn: `+${coinsAmt} Coins`,
    };
  }
  const xpAmt = 35 + tier;
  return {
    tier,
    track: 'free',
    type: 'xp',
    amount: xpAmt,
    labelCkb: `+${xpAmt} XP`,
    labelEn: `+${xpAmt} XP`,
  };
});

// 50 Premium Plus Rewards (دیاری نایاب: سکین، کوینی زۆر، DNA، بووست) — Season 1 is FREE!
const PLUS_SKIN_TIERS: Record<number, { skinId: SkinId; nameCkb: string; nameEn: string }> = {
  8: { skinId: 'cyber_pulse', nameCkb: 'سکین: سایبەر پەڵس', nameEn: 'Skin: Cyber Pulse' },
  16: { skinId: 'solar_flare', nameCkb: 'سکین: گڕی خۆر', nameEn: 'Skin: Solar Flare' },
  25: { skinId: 'golden_phoenix', nameCkb: 'سکین: سیمرخی زێڕین', nameEn: 'Skin: Golden Phoenix' },
  38: { skinId: 'neon_lotus', nameCkb: 'سکین: نیۆن لۆتەس', nameEn: 'Skin: Neon Lotus' },
  44: { skinId: 'royal_crown', nameCkb: 'سکین: تاجی شاهانە', nameEn: 'Skin: Royal Crown' },
  50: { skinId: 'galaxy_dragon', nameCkb: 'سکین: ئەژدیهای گەردوون', nameEn: 'Skin: Galaxy Dragon' },
};

const PLUS_BOOST_TIERS: Record<number, { boostId: BoostId; nameCkb: string; nameEn: string }> = {
  4: { boostId: 'coin_boost_2x', nameCkb: 'بووستی کوین 2x', nameEn: 'Coin Boost 2x' },
  12: { boostId: 'level_boost_2x', nameCkb: 'بووستی لیڤڵ 2x', nameEn: 'Level Boost 2x' },
  19: { boostId: 'start_mass_boost', nameCkb: 'بووستی بارستەی سەرەتا', nameEn: 'Starter Mass Boost' },
  28: { boostId: 'level_boost_3x', nameCkb: 'مێگا بووستی 3x', nameEn: 'Mega Boost 3x' },
  33: { boostId: 'coin_boost_2x', nameCkb: 'بووستی کوین 2x', nameEn: 'Coin Boost 2x' },
  41: { boostId: 'level_boost_3x', nameCkb: 'مێگا بووستی 3x', nameEn: 'Mega Boost 3x' },
  47: { boostId: 'start_mass_boost', nameCkb: 'بووستی بارستەی سەرەتا', nameEn: 'Starter Mass Boost' },
};

export const PLUS_REWARDS: PassReward[] = Array.from({ length: MAX_PASS_TIER }, (_, idx) => {
  const tier = idx + 1;

  if (PLUS_SKIN_TIERS[tier]) {
    const s = PLUS_SKIN_TIERS[tier];
    return {
      tier,
      track: 'plus',
      type: 'skin',
      skinId: s.skinId,
      labelCkb: s.nameCkb,
      labelEn: s.nameEn,
    };
  }

  if (PLUS_BOOST_TIERS[tier]) {
    const b = PLUS_BOOST_TIERS[tier];
    return {
      tier,
      track: 'plus',
      type: 'boost',
      boostId: b.boostId,
      labelCkb: b.nameCkb,
      labelEn: b.nameEn,
    };
  }

  if (tier % 5 === 0) {
    const dnaAmt = 12 + Math.floor(tier * 0.7);
    return {
      tier,
      track: 'plus',
      type: 'dna',
      amount: dnaAmt,
      labelCkb: `+${dnaAmt} DNA`,
      labelEn: `+${dnaAmt} DNA`,
    };
  }

  if (tier % 7 === 0) {
    const xpAmt = 350 + tier * 10;
    return {
      tier,
      track: 'plus',
      type: 'xp',
      amount: xpAmt,
      labelCkb: `+${xpAmt} XP`,
      labelEn: `+${xpAmt} XP`,
    };
  }

  const coinsAmt = tier === 1 ? 150 : 90 + tier * 9;
  return {
    tier,
    track: 'plus',
    type: 'coins',
    amount: coinsAmt,
    labelCkb: `+${coinsAmt} کوین`,
    labelEn: `+${coinsAmt} Coins`,
  };
});

export const PASS_CHALLENGES: PassChallenge[] = [
  {
    id: 'ch_foods',
    titleCkb: 'ڕاوچی خۆراک',
    titleEn: 'Pellet Collector',
    descCkb: 'خواردنی گەردیلە بچووکەکان لە ناو ئارێنادا',
    descEn: 'Eat food pellets inside the arena',
    metric: 'foods',
    stages: [35, 100, 240, 480, 850],
    passXpPerStage: [150, 220, 300, 380, 480],
    repeatableStep: 180,
    repeatableXp: 180,
  },
  {
    id: 'ch_mass',
    titleCkb: 'خانەی زەبەلاح',
    titleEn: 'Giant Cell',
    descCkb: 'گەیشتن بە بەرزترین بارستە لە یەک یاریدا',
    descEn: 'Reach peak mass in a single match',
    metric: 'maxPeakMass',
    stages: [75, 150, 280, 460, 750],
    passXpPerStage: [160, 220, 300, 400, 520],
  },
  {
    id: 'ch_eaten',
    titleCkb: 'شەڕکەری ئارێنا',
    titleEn: 'Arena Hunter',
    descCkb: 'خواردنی خانەی بۆت یان یاریزانەکانی تر',
    descEn: 'Absorb enemy cells or bots',
    metric: 'cellsEaten',
    stages: [2, 6, 14, 28, 50],
    passXpPerStage: [160, 240, 320, 420, 520],
    repeatableStep: 8,
    repeatableXp: 200,
  },
  {
    id: 'ch_matches',
    titleCkb: 'یاریزانی بەردەوام',
    titleEn: 'Arena Veteran',
    descCkb: 'تەواوکردنی یاری لە ئۆنڵاین یان تاکە یاری',
    descEn: 'Complete matches in Solo or Online mode',
    metric: 'matches',
    stages: [1, 3, 7, 14, 24],
    passXpPerStage: [120, 180, 260, 350, 460],
    repeatableStep: 2,
    repeatableXp: 160,
  },
  {
    id: 'ch_time',
    titleCkb: 'خۆڕاگری درێژخایەن',
    titleEn: 'True Survivor',
    descCkb: 'مانەوە بە زیندوویی لە ناو ئارێنادا (بە چرکە)',
    descEn: 'Survive inside the arena (seconds)',
    metric: 'timeAlive',
    stages: [45, 140, 320, 640, 1100],
    passXpPerStage: [130, 190, 270, 360, 480],
  },
  {
    id: 'ch_splits',
    titleCkb: 'شارەزای دابەشبوون',
    titleEn: 'Split Tactician',
    descCkb: 'بەکارهێنانی دابەشبوون (Split) لە کاتی یاریدا',
    descEn: 'Use Split during matches',
    metric: 'splits',
    stages: [3, 10, 24, 48, 85],
    passXpPerStage: [120, 180, 250, 330, 420],
  },
];

export function createInitialGamePass(): GamePassState {
  return {
    seasonKey: getCurrentSeasonKey(),
    passXp: 0,
    hasPlus: false,
    claimedFree: [],
    claimedPlus: [],
    stats: {
      foods: 0,
      maxPeakMass: 0,
      cellsEaten: 0,
      matches: 0,
      timeAlive: 0,
      splits: 0,
    },
    claimedChallengeStage: {},
  };
}

export function loadGamePass(): GamePassState {
  const currentKey = getCurrentSeasonKey();
  try {
    const raw = localStorage.getItem(GAME_PASS_STORAGE_KEY);
    if (!raw) return createInitialGamePass();
    const parsed = JSON.parse(raw) as Partial<GamePassState>;
    // Reset monthly if new calendar month starts
    if (parsed.seasonKey && parsed.seasonKey !== currentKey) {
      return createInitialGamePass();
    }
    return {
      seasonKey: currentKey,
      passXp: typeof parsed.passXp === 'number' ? Math.max(0, parsed.passXp) : 0,
      hasPlus: Boolean(parsed.hasPlus),
      claimedFree: Array.isArray(parsed.claimedFree) ? parsed.claimedFree : [],
      claimedPlus: Array.isArray(parsed.claimedPlus) ? parsed.claimedPlus : [],
      stats: {
        foods: parsed.stats?.foods ?? 0,
        maxPeakMass: parsed.stats?.maxPeakMass ?? 0,
        cellsEaten: parsed.stats?.cellsEaten ?? 0,
        matches: parsed.stats?.matches ?? 0,
        timeAlive: parsed.stats?.timeAlive ?? 0,
        splits: parsed.stats?.splits ?? 0,
      },
      claimedChallengeStage:
        parsed.claimedChallengeStage && typeof parsed.claimedChallengeStage === 'object'
          ? parsed.claimedChallengeStage
          : {},
    };
  } catch {
    return createInitialGamePass();
  }
}

export function saveGamePass(state: GamePassState): void {
  try {
    localStorage.setItem(GAME_PASS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function recordMatchIntoGamePass(
  prev: GamePassState,
  match: {
    foodsEaten: number;
    peakMass: number;
    cellsEaten: number;
    elapsedSeconds: number;
    splitsUsed: number;
  }
): { nextPass: GamePassState; passXpEarned: number } {
  const passXpEarned = Math.max(
    45,
    Math.round(45 + match.peakMass * 0.25 + match.cellsEaten * 15 + match.foodsEaten * 0.4)
  );
  const nextPass: GamePassState = {
    ...prev,
    passXp: prev.passXp + passXpEarned,
    stats: {
      foods: prev.stats.foods + Math.max(0, match.foodsEaten),
      maxPeakMass: Math.max(prev.stats.maxPeakMass, Math.round(match.peakMass)),
      cellsEaten: prev.stats.cellsEaten + Math.max(0, match.cellsEaten),
      matches: prev.stats.matches + 1,
      timeAlive: prev.stats.timeAlive + Math.max(0, Math.round(match.elapsedSeconds)),
      splits: prev.stats.splits + Math.max(0, match.splitsUsed),
    },
  };
  return { nextPass, passXpEarned };
}

export function getChallengeStatus(challenge: PassChallenge, state: GamePassState): {
  currentValue: number;
  targetValue: number;
  rewardXp: number;
  canClaim: boolean;
  isCompletedAll: boolean;
  stageLabel: string;
} {
  const claimedCount = state.claimedChallengeStage[challenge.id] ?? 0;
  const currentValue = state.stats[challenge.metric] ?? 0;

  if (claimedCount < challenge.stages.length) {
    const targetValue = challenge.stages[claimedCount];
    const rewardXp = challenge.passXpPerStage[claimedCount];
    return {
      currentValue,
      targetValue,
      rewardXp,
      canClaim: currentValue >= targetValue,
      isCompletedAll: false,
      stageLabel: `${claimedCount + 1}/${challenge.stages.length}`,
    };
  }

  if (challenge.repeatableStep && challenge.repeatableXp) {
    const lastBase = challenge.stages[challenge.stages.length - 1];
    const extraCycles = claimedCount - challenge.stages.length;
    const targetValue = lastBase + (extraCycles + 1) * challenge.repeatableStep;
    return {
      currentValue,
      targetValue,
      rewardXp: challenge.repeatableXp,
      canClaim: currentValue >= targetValue,
      isCompletedAll: false,
      stageLabel: '∞',
    };
  }

  const finalTarget = challenge.stages[challenge.stages.length - 1];
  return {
    currentValue,
    targetValue: finalTarget,
    rewardXp: 0,
    canClaim: false,
    isCompletedAll: true,
    stageLabel: `${challenge.stages.length}/${challenge.stages.length}`,
  };
}

export function claimChallengeReward(
  state: GamePassState,
  challengeId: string
): GamePassState {
  const challenge = PASS_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) return state;
  const status = getChallengeStatus(challenge, state);
  if (!status.canClaim || status.rewardXp <= 0) return state;

  const prevStage = state.claimedChallengeStage[challengeId] ?? 0;
  return {
    ...state,
    passXp: state.passXp + status.rewardXp,
    claimedChallengeStage: {
      ...state.claimedChallengeStage,
      [challengeId]: prevStage + 1,
    },
  };
}

function applyRewardToProfile(profile: PlayerProfile, reward: PassReward): PlayerProfile {
  let next: PlayerProfile = {
    ...profile,
    boosts: { ...profile.boosts },
    unlockedSkins: [...profile.unlockedSkins],
  };

  if (reward.type === 'coins' && reward.amount) {
    next.coins += reward.amount;
  } else if (reward.type === 'dna' && reward.amount) {
    next.dna += reward.amount;
  } else if (reward.type === 'xp' && reward.amount) {
    const res = applyXpGain(next, reward.amount);
    next = res.nextProfile;
  } else if (reward.type === 'skin' && reward.skinId) {
    if (!next.unlockedSkins.includes(reward.skinId)) {
      next.unlockedSkins.push(reward.skinId);
    } else {
      // Duplicate skin grants generous DNA bonus
      next.dna += 45;
    }
  } else if (reward.type === 'boost' && reward.boostId) {
    if (reward.boostId === 'level_boost_2x') next.boosts.levelBoost2x += 3;
    else if (reward.boostId === 'level_boost_3x') next.boosts.levelBoost3x += 3;
    else if (reward.boostId === 'coin_boost_2x') next.boosts.coinBoost2x += 3;
    else if (reward.boostId === 'start_mass_boost') next.boosts.startMassBoost += 3;
  }

  return next;
}

export function claimSinglePassReward(
  profile: PlayerProfile,
  passState: GamePassState,
  tier: number,
  track: PassTrack
): { nextProfile: PlayerProfile; nextPass: GamePassState; claimed: boolean } {
  const currentTier = getPassTier(passState.passXp);
  if (tier > currentTier || tier < 1 || tier > MAX_PASS_TIER) {
    return { nextProfile: profile, nextPass: passState, claimed: false };
  }
  if (track === 'plus' && !passState.hasPlus) {
    return { nextProfile: profile, nextPass: passState, claimed: false };
  }

  const claimedArr = track === 'free' ? passState.claimedFree : passState.claimedPlus;
  if (claimedArr.includes(tier)) {
    return { nextProfile: profile, nextPass: passState, claimed: false };
  }

  const rewardList = track === 'free' ? FREE_REWARDS : PLUS_REWARDS;
  const reward = rewardList.find((r) => r.tier === tier);
  if (!reward) {
    return { nextProfile: profile, nextPass: passState, claimed: false };
  }

  const nextProfile = applyRewardToProfile(profile, reward);
  const nextPass: GamePassState = {
    ...passState,
    claimedFree: track === 'free' ? [...passState.claimedFree, tier] : passState.claimedFree,
    claimedPlus: track === 'plus' ? [...passState.claimedPlus, tier] : passState.claimedPlus,
  };

  return { nextProfile, nextPass, claimed: true };
}

export function claimAllAvailablePassRewards(
  profile: PlayerProfile,
  passState: GamePassState
): { nextProfile: PlayerProfile; nextPass: GamePassState; claimedCount: number } {
  const unlockedTier = getPassTier(passState.passXp);
  let nextProfile = profile;
  let nextPass = passState;
  let claimedCount = 0;

  for (let tier = 1; tier <= unlockedTier; tier++) {
    const freeRes = claimSinglePassReward(nextProfile, nextPass, tier, 'free');
    if (freeRes.claimed) {
      nextProfile = freeRes.nextProfile;
      nextPass = freeRes.nextPass;
      claimedCount += 1;
    }
    if (nextPass.hasPlus) {
      const plusRes = claimSinglePassReward(nextProfile, nextPass, tier, 'plus');
      if (plusRes.claimed) {
        nextProfile = plusRes.nextProfile;
        nextPass = plusRes.nextPass;
        claimedCount += 1;
      }
    }
  }

  return { nextProfile, nextPass, claimedCount };
}

export function countClaimablePassItems(passState: GamePassState): number {
  const unlockedTier = getPassTier(passState.passXp);
  let count = 0;
  for (let tier = 1; tier <= unlockedTier; tier++) {
    if (!passState.claimedFree.includes(tier)) count += 1;
    if (passState.hasPlus && !passState.claimedPlus.includes(tier)) count += 1;
  }
  for (const ch of PASS_CHALLENGES) {
    if (getChallengeStatus(ch, passState).canClaim) count += 1;
  }
  return count;
}
