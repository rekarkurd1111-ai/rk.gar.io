import { decodeUnlockedSkinsWithLevels } from './skins';
import { BoostItemDefinition, MatchRewardSummary, PlayerProfile, SkinId, SkinLevel } from './types';

export const PROFILE_STORAGE_KEY = 'xane_profile_v1';

export const DEFAULT_PROFILE: PlayerProfile = {
  coins: 250,
  dna: 25,
  score: 0,
  xp: 0,
  level: 1,
  unlockedSkins: ['kurdish_sun', 'ocean', 'emerald'],
  skinLevels: {},
  boosts: {
    levelBoost2x: 0,
    levelBoost3x: 0,
    coinBoost2x: 0,
    startMassBoost: 0,
  },
};

export const BOOST_ITEMS: BoostItemDefinition[] = [
  {
    id: 'level_boost_2x',
    nameCkb: 'بووستی لیڤڵ 2x',
    nameEn: 'Level Boost 2x',
    descCkb: 'خاڵ و XP بۆ ٣ یاری داهاتوو دوو هێندە دەکات',
    descEn: '2x Score & Level XP for your next 3 matches',
    price: 180,
    currency: 'coins',
    charges: 3,
  },
  {
    id: 'level_boost_3x',
    nameCkb: 'مێگا بووستی لیڤڵ 3x',
    nameEn: 'Mega Level Boost 3x',
    descCkb: 'خاڵ و XP بۆ ٣ یاری داهاتوو سێ هێندە دەکات',
    descEn: '3x Score & Level XP for your next 3 matches',
    price: 20,
    currency: 'dna',
    charges: 3,
  },
  {
    id: 'xp_pack_500',
    nameCkb: 'پاکێجی +500 XP',
    nameEn: 'Instant +500 XP Pack',
    descCkb: '٥٠٠ خاڵی لیڤڵ یەکسەر زیاد دەکات بۆ بەرزکردنەوەی لیڤڵت',
    descEn: 'Instantly grants 500 Level XP to level up faster',
    price: 220,
    currency: 'coins',
    charges: 0,
    xpAmount: 500,
  },
  {
    id: 'coin_boost_2x',
    nameCkb: 'بووستی کوین 2x',
    nameEn: 'Coin Boost 2x',
    descCkb: 'کۆکردنەوەی کوین بۆ ٣ یاری داهاتوو دوو هێندە دەکات',
    descEn: '2x Coins earned for your next 3 matches',
    price: 150,
    currency: 'coins',
    charges: 3,
  },
  {
    id: 'start_mass_boost',
    nameCkb: 'بووستی بارستەی سەرەتا',
    nameEn: 'Starter Mass Boost',
    descCkb: 'بە +20 بارستەی زیاتر دەستپێدەکەیت بۆ ٣ یاری',
    descEn: 'Spawn with +20 bonus starting mass for 3 matches',
    price: 16,
    currency: 'dna',
    charges: 3,
  },
];

export function xpRequiredForLevel(level: number): number {
  return 220 + (level - 1) * 140;
}

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const decoded = decodeUnlockedSkinsWithLevels(
      Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : DEFAULT_PROFILE.unlockedSkins
    );
    const mergedSkinLevels: Partial<Record<SkinId, SkinLevel>> = { ...decoded.skinLevels };
    if (parsed.skinLevels && typeof parsed.skinLevels === 'object') {
      for (const [k, v] of Object.entries(parsed.skinLevels)) {
        if (v === 2 || v === 3) {
          const prev = mergedSkinLevels[k as SkinId] || 1;
          if (v > prev) mergedSkinLevels[k as SkinId] = v;
        }
      }
    }
    return {
      coins: typeof parsed.coins === 'number' ? parsed.coins : DEFAULT_PROFILE.coins,
      dna: typeof parsed.dna === 'number' ? parsed.dna : DEFAULT_PROFILE.dna,
      score: typeof parsed.score === 'number' ? parsed.score : 0,
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      level: typeof parsed.level === 'number' && parsed.level >= 1 ? parsed.level : 1,
      unlockedSkins: decoded.unlockedSkins,
      skinLevels: mergedSkinLevels,
      boosts: {
        levelBoost2x: parsed.boosts?.levelBoost2x ?? 0,
        levelBoost3x: parsed.boosts?.levelBoost3x ?? 0,
        coinBoost2x: parsed.boosts?.coinBoost2x ?? 0,
        startMassBoost: parsed.boosts?.startMassBoost ?? 0,
      },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function applyXpGain(
  profile: PlayerProfile,
  xpToAdd: number
): { nextProfile: PlayerProfile; leveledUp: boolean; bonusCoins: number; bonusDna: number } {
  let xp = profile.xp + xpToAdd;
  let level = profile.level;
  let leveledUp = false;
  let bonusCoins = 0;
  let bonusDna = 0;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    leveledUp = true;
    bonusCoins += 80;
    bonusDna += 6;
  }

  return {
    nextProfile: {
      ...profile,
      xp,
      level,
      coins: profile.coins + bonusCoins,
      dna: profile.dna + bonusDna,
    },
    leveledUp,
    bonusCoins,
    bonusDna,
  };
}

export function calculateAndApplyMatchRewards(
  profile: PlayerProfile,
  peakMass: number,
  cellsEaten: number,
  elapsedSeconds: number
): { nextProfile: PlayerProfile; rewards: MatchRewardSummary } {
  const baseScore = Math.max(
    15,
    Math.round(peakMass * 2 + cellsEaten * 85 + elapsedSeconds * 1.5)
  );
  const baseCoins = Math.max(
    12,
    Math.round(peakMass * 0.5 + cellsEaten * 20 + elapsedSeconds * 0.35)
  );
  const baseDna = Math.max(2, Math.round(cellsEaten * 3 + peakMass / 45));

  let boostMultiplier = 1;
  const nextBoosts = { ...profile.boosts };

  if (nextBoosts.levelBoost3x > 0) {
    boostMultiplier = 3;
    nextBoosts.levelBoost3x -= 1;
  } else if (nextBoosts.levelBoost2x > 0) {
    boostMultiplier = 2;
    nextBoosts.levelBoost2x -= 1;
  }

  let coinMultiplier = 1;
  if (nextBoosts.coinBoost2x > 0) {
    coinMultiplier = 2;
    nextBoosts.coinBoost2x -= 1;
  }

  const scoreGained = baseScore * boostMultiplier;
  const xpGained = Math.round(baseScore * 0.65) * boostMultiplier;
  const coinsEarned = baseCoins * coinMultiplier;
  const dnaEarned = baseDna;

  const updatedBase: PlayerProfile = {
    ...profile,
    coins: profile.coins + coinsEarned,
    dna: profile.dna + dnaEarned,
    score: profile.score + scoreGained,
    boosts: nextBoosts,
  };

  const { nextProfile, leveledUp } = applyXpGain(updatedBase, xpGained);

  return {
    nextProfile,
    rewards: {
      scoreGained,
      coinsEarned,
      dnaEarned,
      xpGained,
      leveledUp,
      newLevel: nextProfile.level,
      boostMultiplier,
    },
  };
}
