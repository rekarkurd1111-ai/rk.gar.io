import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  decodeUnlockedSkinsWithLevels,
  encodeUnlockedSkinsWithLevels,
  SKIN_MAP,
} from './skins';
import {
  FriendRecord,
  PlayerProfile,
  PublicPlayerProfile,
  SkinId,
  SkinLevel,
  WeeklyTopEntry,
} from './types';

const STORAGE_PLAYER_CODE_KEY = 'rk_player_code_v1';
const STORAGE_LOCAL_FRIENDS_KEY = 'rk_local_friends_v1';

function generatePlayerCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `RK${suffix}`;
}

export function normalizePlayerCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatPlayerCodeDisplay(code: string): string {
  const clean = normalizePlayerCode(code);
  if (clean.length === 8 && clean.startsWith('RK')) {
    return `RK-${clean.slice(2)}`;
  }
  return clean;
}

export function getOrCreateLocalPlayerCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_PLAYER_CODE_KEY);
    if (existing && /^RK[0-9A-Z]{6}$/.test(existing)) {
      return existing;
    }
    const created = generatePlayerCode();
    localStorage.setItem(STORAGE_PLAYER_CODE_KEY, created);
    return created;
  } catch {
    return generatePlayerCode();
  }
}

export function saveLocalPlayerCode(code: string): void {
  const clean = normalizePlayerCode(code);
  if (!/^RK[0-9A-Z]{6}$/.test(clean)) return;
  try {
    localStorage.setItem(STORAGE_PLAYER_CODE_KEY, clean);
  } catch {
    // Ignore storage errors
  }
}

export function loadLocalFriends(): FriendRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_FRIENDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FriendRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalFriends(friends: FriendRecord[]): void {
  try {
    localStorage.setItem(STORAGE_LOCAL_FRIENDS_KEY, JSON.stringify(friends));
  } catch {
    // Ignore storage errors
  }
}

function safeSkinId(raw: unknown): SkinId {
  if (typeof raw === 'string' && raw in SKIN_MAP) {
    return raw as SkinId;
  }
  return 'kurdish_sun';
}

function clampString(raw: string, fallback: string, maxLen: number): string {
  const trimmed = raw.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : fallback;
}

function getUserEmailSafe(user: User): string {
  const raw =
    user.email ||
    user.providerData?.find((p) => typeof p.email === 'string' && p.email.includes('@'))?.email ||
    '';
  return raw.trim().slice(0, 160);
}

export function extractAccountErrorReason(err: unknown): string {
  const rawMsg = err instanceof Error ? err.message : String(err);
  try {
    const parsed = JSON.parse(rawMsg) as { error?: string };
    if (parsed && typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Plain error string
  }
  return rawMsg;
}

export async function ensureCloudAccount(
  user: User,
  localState: {
    displayName: string;
    hasLocalNickname?: boolean;
    skinId: SkinId;
    profile: PlayerProfile;
    bestMass: number;
    currentRoom: string;
    online: boolean;
  }
): Promise<{
  publicProfile: PublicPlayerProfile;
  mergedXp: number;
  mergedUnlockedSkins: SkinId[];
  mergedSkinLevels: Partial<Record<SkinId, SkinLevel>>;
}> {
  const playerPath = `players/${user.uid}`;
  const privatePath = `usersPrivate/${user.uid}`;
  const verifiedEmail = getUserEmailSafe(user);
  const safeName = clampString(
    localState.displayName || user.displayName || 'Player',
    'Player',
    24
  );

  let existingPlayerData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(doc(db, 'players', user.uid));
    if (snap.exists()) {
      existingPlayerData = snap.data() as Record<string, unknown>;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, playerPath);
  }

  let existingPrivateData: Record<string, unknown> | null = null;
  try {
    const privSnap = await getDoc(doc(db, 'usersPrivate', user.uid));
    if (privSnap.exists()) {
      existingPrivateData = privSnap.data() as Record<string, unknown>;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, privatePath);
  }

  if (existingPlayerData) {
    const cloudCode =
      typeof existingPlayerData.playerCode === 'string'
        ? existingPlayerData.playerCode
        : getOrCreateLocalPlayerCode();
    saveLocalPlayerCode(cloudCode);

    const cloudCoins = Math.max(
      localState.profile.coins,
      Number(existingPlayerData.coins) || 0
    );
    const cloudDna = Math.max(
      localState.profile.dna,
      Number(existingPlayerData.dna) || 0
    );
    const cloudLevel = Math.max(
      localState.profile.level,
      Number(existingPlayerData.level) || 1
    );
    const cloudScore = Math.max(
      localState.profile.score,
      Number(existingPlayerData.score) || 0
    );
    const cloudBest = Math.max(
      localState.bestMass,
      Number(existingPlayerData.bestMass) || 0
    );
    const decodedCloud = decodeUnlockedSkinsWithLevels(existingPrivateData?.unlockedSkins);
    const cloudSkins = Array.from(
      new Set([...localState.profile.unlockedSkins, ...decodedCloud.unlockedSkins])
    ).filter((id): id is SkinId => id in SKIN_MAP);
    if (cloudSkins.length === 0) {
      cloudSkins.push('kurdish_sun');
    }

    const mergedSkinLevels: Partial<Record<SkinId, SkinLevel>> = { ...decodedCloud.skinLevels };
    if (localState.profile.skinLevels) {
      for (const [k, v] of Object.entries(localState.profile.skinLevels)) {
        if (v === 2 || v === 3) {
          const prev = mergedSkinLevels[k as SkinId] || 1;
          if (v > prev) mergedSkinLevels[k as SkinId] = v;
        }
      }
    }
    const encodedCloudSkins = encodeUnlockedSkinsWithLevels(cloudSkins, mergedSkinLevels);
    const cloudXp = Math.max(
      localState.profile.xp,
      Number(existingPrivateData?.xp) || 0
    );

    const existingCloudName =
      typeof existingPlayerData.displayName === 'string' && existingPlayerData.displayName.trim()
        ? clampString(existingPlayerData.displayName, safeName, 24)
        : safeName;
    const mergedDisplayName = localState.hasLocalNickname ? safeName : existingCloudName;
    const existingCloudSkin = safeSkinId(existingPlayerData.skinId);
    const mergedSkinId =
      localState.skinId === 'kurdish_sun' && existingCloudSkin !== 'kurdish_sun'
        ? existingCloudSkin
        : localState.skinId;

    const publicProfile: PublicPlayerProfile = {
      uid: user.uid,
      playerCode: cloudCode,
      displayName: mergedDisplayName,
      skinId: mergedSkinId,
      level: cloudLevel,
      score: cloudScore,
      bestMass: cloudBest,
      coins: cloudCoins,
      dna: cloudDna,
      online: localState.online,
      currentRoom: localState.currentRoom.slice(0, 24),
    };

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'players', user.uid), {
        displayName: publicProfile.displayName,
        skinId: publicProfile.skinId,
        level: publicProfile.level,
        score: publicProfile.score,
        bestMass: publicProfile.bestMass,
        coins: publicProfile.coins,
        dna: publicProfile.dna,
        online: publicProfile.online,
        currentRoom: publicProfile.currentRoom,
        updatedAt: serverTimestamp(),
      });
      batch.set(
        doc(db, 'playerCodes', cloudCode),
        {
          uid: user.uid,
          playerCode: cloudCode,
          displayName: publicProfile.displayName,
          skinId: publicProfile.skinId,
          level: publicProfile.level,
          bestMass: publicProfile.bestMass,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (verifiedEmail) {
        batch.set(
          doc(db, 'usersPrivate', user.uid),
          {
            uid: user.uid,
            email: verifiedEmail,
            xp: cloudXp,
            unlockedSkins: encodedCloudSkins,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, playerPath);
    }

    return {
      publicProfile,
      mergedXp: cloudXp,
      mergedUnlockedSkins: cloudSkins,
      mergedSkinLevels,
    };
  }

  // First-time cloud account creation — pick an unused playerCode
  let chosenCode = getOrCreateLocalPlayerCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const codeSnap = await getDoc(doc(db, 'playerCodes', chosenCode));
      if (!codeSnap.exists()) break;
      chosenCode = generatePlayerCode();
    } catch {
      break;
    }
  }
  saveLocalPlayerCode(chosenCode);

  const publicProfile: PublicPlayerProfile = {
    uid: user.uid,
    playerCode: chosenCode,
    displayName: safeName,
    skinId: localState.skinId,
    level: Math.max(1, localState.profile.level),
    score: Math.max(0, localState.profile.score),
    bestMass: Math.max(0, localState.bestMass),
    coins: Math.max(0, localState.profile.coins),
    dna: Math.max(0, localState.profile.dna),
    online: localState.online,
    currentRoom: localState.currentRoom.slice(0, 24),
  };

  const initialSkins: SkinId[] =
    localState.profile.unlockedSkins.length > 0
      ? localState.profile.unlockedSkins
      : ['kurdish_sun'];
  const initialSkinLevels: Partial<Record<SkinId, SkinLevel>> =
    localState.profile.skinLevels || {};
  const encodedInitialSkins = encodeUnlockedSkinsWithLevels(initialSkins, initialSkinLevels);

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'players', user.uid), {
      ...publicProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'playerCodes', chosenCode), {
      uid: user.uid,
      playerCode: chosenCode,
      displayName: publicProfile.displayName,
      skinId: publicProfile.skinId,
      level: publicProfile.level,
      bestMass: publicProfile.bestMass,
      updatedAt: serverTimestamp(),
    });
    if (verifiedEmail) {
      batch.set(doc(db, 'usersPrivate', user.uid), {
        uid: user.uid,
        email: verifiedEmail,
        xp: Math.max(0, localState.profile.xp),
        unlockedSkins: encodedInitialSkins,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, playerPath);
  }

  return {
    publicProfile,
    mergedXp: localState.profile.xp,
    mergedUnlockedSkins: initialSkins,
    mergedSkinLevels: initialSkinLevels,
  };
}

export async function syncCloudProfile(
  user: User,
  playerCode: string,
  state: {
    displayName: string;
    skinId: SkinId;
    profile: PlayerProfile;
    bestMass: number;
    currentRoom: string;
    online: boolean;
  }
): Promise<void> {
  if (!/^RK[0-9A-Z]{6}$/.test(playerCode)) return;
  const safeName = clampString(state.displayName || user.displayName || 'Player', 'Player', 24);
  const verifiedEmail = getUserEmailSafe(user);
  const safeSkins = encodeUnlockedSkinsWithLevels(
    state.profile.unlockedSkins.length > 0 ? state.profile.unlockedSkins : ['kurdish_sun'],
    state.profile.skinLevels
  );
  const playerPath = `players/${user.uid}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'players', user.uid), {
      displayName: safeName,
      skinId: state.skinId,
      level: Math.max(1, state.profile.level),
      score: Math.max(0, state.profile.score),
      bestMass: Math.max(0, state.bestMass),
      coins: Math.max(0, state.profile.coins),
      dna: Math.max(0, state.profile.dna),
      online: state.online,
      currentRoom: state.currentRoom.slice(0, 24),
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'playerCodes', playerCode),
      {
        uid: user.uid,
        playerCode,
        displayName: safeName,
        skinId: state.skinId,
        level: Math.max(1, state.profile.level),
        bestMass: Math.max(0, state.bestMass),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (verifiedEmail) {
      batch.set(
        doc(db, 'usersPrivate', user.uid),
        {
          uid: user.uid,
          email: verifiedEmail,
          xp: Math.max(0, state.profile.xp),
          unlockedSkins: safeSkins,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    if (code === 'not-found') {
      await ensureCloudAccount(user, {
        ...state,
        hasLocalNickname: true,
      });
      return;
    }
    handleFirestoreError(err, OperationType.UPDATE, playerPath);
  }
}

export async function lookupCloudPlayerByCode(
  rawCode: string
): Promise<PublicPlayerProfile | null> {
  const code = normalizePlayerCode(rawCode);
  if (!/^RK[0-9A-Z]{6}$/.test(code)) return null;

  const lookupPath = `playerCodes/${code}`;
  try {
    const codeSnap = await getDoc(doc(db, 'playerCodes', code));
    if (!codeSnap.exists()) return null;
    const codeData = codeSnap.data() as Record<string, unknown>;
    const targetUid = typeof codeData.uid === 'string' ? codeData.uid : '';
    if (!targetUid) return null;

    const playerSnap = await getDoc(doc(db, 'players', targetUid));
    if (!playerSnap.exists()) {
      return {
        uid: targetUid,
        playerCode: code,
        displayName: String(codeData.displayName || 'Player'),
        skinId: safeSkinId(codeData.skinId),
        level: Number(codeData.level) || 1,
        score: 0,
        bestMass: Number(codeData.bestMass) || 0,
        coins: 0,
        dna: 0,
        online: false,
        currentRoom: '',
      };
    }
    const p = playerSnap.data() as Record<string, unknown>;
    return {
      uid: targetUid,
      playerCode: String(p.playerCode || code),
      displayName: String(p.displayName || 'Player'),
      skinId: safeSkinId(p.skinId),
      level: Number(p.level) || 1,
      score: Number(p.score) || 0,
      bestMass: Number(p.bestMass) || 0,
      coins: Number(p.coins) || 0,
      dna: Number(p.dna) || 0,
      online: Boolean(p.online),
      currentRoom: String(p.currentRoom || ''),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, lookupPath);
  }
}

export async function fetchCloudFriends(uid: string): Promise<FriendRecord[]> {
  const path = `friendships/${uid}/list`;
  try {
    const snap = await getDocs(
      query(collection(db, 'friendships', uid, 'list'), where('ownerUid', '==', uid))
    );
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        friendUid: String(data.friendUid || d.id),
        playerCode: String(data.playerCode || ''),
        displayName: String(data.displayName || 'Player'),
        skinId: safeSkinId(data.skinId),
        level: Number(data.level) || 1,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addCloudFriend(uid: string, friend: FriendRecord): Promise<void> {
  if (
    !friend.friendUid ||
    uid === friend.friendUid ||
    friend.friendUid.startsWith('code_') ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(friend.friendUid)
  ) {
    return;
  }
  const cleanCode = normalizePlayerCode(friend.playerCode);
  if (!/^RK[0-9A-Z]{6}$/.test(cleanCode)) return;

  const path = `friendships/${uid}/list/${friend.friendUid}`;
  try {
    await setDoc(doc(db, 'friendships', uid, 'list', friend.friendUid), {
      ownerUid: uid,
      friendUid: friend.friendUid,
      playerCode: cleanCode,
      displayName: clampString(friend.displayName, 'Player', 24),
      skinId: safeSkinId(friend.skinId),
      level: Math.max(1, friend.level),
      addedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function removeCloudFriend(uid: string, friendUid: string): Promise<void> {
  if (
    !friendUid ||
    friendUid.startsWith('code_') ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(friendUid)
  ) {
    return;
  }
  const path = `friendships/${uid}/list/${friendUid}`;
  try {
    await deleteDoc(doc(db, 'friendships', uid, 'list', friendUid));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function claimPendingCloudGrants(
  uid: string
): Promise<{ coins: number; dna: number }> {
  const path = 'currencyGrants';
  let totalCoins = 0;
  let totalDna = 0;
  try {
    const q = query(
      collection(db, 'currencyGrants'),
      where('targetUid', '==', uid),
      where('claimed', '==', false)
    );
    const snap = await getDocs(q);
    for (const grantDoc of snap.docs) {
      const data = grantDoc.data() as Record<string, unknown>;
      const c = Number(data.coins) || 0;
      const d = Number(data.dna) || 0;
      await updateDoc(doc(db, 'currencyGrants', grantDoc.id), {
        claimed: true,
        claimedAt: serverTimestamp(),
      });
      totalCoins += c;
      totalDna += d;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
  return { coins: totalCoins, dna: totalDna };
}

export async function adminFetchAllCloudPlayers(): Promise<PublicPlayerProfile[]> {
  const path = 'players';
  try {
    const snap = await getDocs(collection(db, 'players'));
    return snap.docs.map((d) => {
      const p = d.data() as Record<string, unknown>;
      return {
        uid: String(p.uid || d.id),
        playerCode: String(p.playerCode || ''),
        displayName: String(p.displayName || 'Player'),
        skinId: safeSkinId(p.skinId),
        level: Number(p.level) || 1,
        score: Number(p.score) || 0,
        bestMass: Number(p.bestMass) || 0,
        coins: Number(p.coins) || 0,
        dna: Number(p.dna) || 0,
        online: Boolean(p.online),
        currentRoom: String(p.currentRoom || ''),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adminCreateCloudGrant(
  adminUid: string,
  targetUid: string,
  targetCode: string,
  coins: number,
  dna: number
): Promise<void> {
  const grantId = `grant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `currencyGrants/${grantId}`;
  try {
    await setDoc(doc(db, 'currencyGrants', grantId), {
      targetUid,
      targetCode: normalizePlayerCode(targetCode),
      coins: Math.max(0, Math.round(coins)),
      dna: Math.max(0, Math.round(dna)),
      claimed: false,
      grantedByUid: adminUid,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

const STORAGE_LOCAL_WEEKLY_KEY = 'rk_local_weekly_top_v1';

export interface LocalWeeklyPending {
  weekKey: string;
  bestMass: number;
  weeklyScore: number;
  cellsEaten: number;
  matchesCount: number;
}

export function getCurrentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekResetCountdown(date = new Date()): { days: number; hours: number } {
  const dayNum = date.getUTCDay() || 7; // Mon=1..Sun=7
  const daysToMonday = 8 - dayNum;
  const nextMondayUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + daysToMonday,
    0,
    0,
    0,
    0
  );
  const diffMs = Math.max(0, nextMondayUtc - date.getTime());
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  return { days, hours };
}

export function loadLocalWeeklyPending(): LocalWeeklyPending {
  const weekKey = getCurrentWeekKey();
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_WEEKLY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalWeeklyPending>;
      if (parsed.weekKey === weekKey) {
        return {
          weekKey,
          bestMass: Math.max(0, Math.round(Number(parsed.bestMass) || 0)),
          weeklyScore: Math.max(0, Math.round(Number(parsed.weeklyScore) || 0)),
          cellsEaten: Math.max(0, Math.round(Number(parsed.cellsEaten) || 0)),
          matchesCount: Math.max(0, Math.round(Number(parsed.matchesCount) || 0)),
        };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return { weekKey, bestMass: 0, weeklyScore: 0, cellsEaten: 0, matchesCount: 0 };
}

export function recordLocalWeeklyMatch(
  peakMass: number,
  matchScore: number,
  cellsEaten: number
): LocalWeeklyPending {
  const prev = loadLocalWeeklyPending();
  const next: LocalWeeklyPending = {
    weekKey: prev.weekKey,
    bestMass: Math.max(prev.bestMass, Math.round(Math.max(0, peakMass))),
    weeklyScore: prev.weeklyScore + Math.round(Math.max(0, matchScore)),
    cellsEaten: prev.cellsEaten + Math.round(Math.max(0, cellsEaten)),
    matchesCount: prev.matchesCount + 1,
  };
  try {
    localStorage.setItem(STORAGE_LOCAL_WEEKLY_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function clearLocalWeeklyPending(): void {
  try {
    localStorage.removeItem(STORAGE_LOCAL_WEEKLY_KEY);
  } catch {
    // Ignore storage errors
  }
}

export async function upsertWeeklyTopScore(
  user: User,
  playerCode: string,
  params: {
    displayName: string;
    skinId: SkinId;
    level: number;
    matchPeakMass: number;
    matchScore: number;
    matchCellsEaten: number;
    matchCountDelta?: number;
  }
): Promise<void> {
  const cleanCode = normalizePlayerCode(playerCode);
  if (!/^RK[0-9A-Z]{6}$/.test(cleanCode)) return;

  const weekKey = getCurrentWeekKey();
  if (!/^20[0-9]{2}-W[0-9]{2}$/.test(weekKey)) return;

  const entryId = `${weekKey}_${user.uid}`;
  const path = `weeklyTop/${entryId}`;
  const docRef = doc(db, 'weeklyTop', entryId);

  const safeName = clampString(params.displayName || user.displayName || 'Player', 'Player', 24);
  const validSkin = safeSkinId(params.skinId);
  const safeLevel = Math.max(1, Math.min(9999, Math.round(params.level || 1)));
  const addPeak = Math.max(0, Math.min(10_000_000, Math.round(params.matchPeakMass || 0)));
  const addScore = Math.max(0, Math.min(1_000_000_000, Math.round(params.matchScore || 0)));
  const addCells = Math.max(0, Math.min(1_000_000, Math.round(params.matchCellsEaten || 0)));
  const addMatches = Math.max(1, Math.min(1000, Math.round(params.matchCountDelta ?? 1)));

  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  if (snap.exists()) {
    const existing = snap.data() as Record<string, unknown>;
    const prevMass = Math.max(0, Number(existing.bestMass) || 0);
    const prevScore = Math.max(0, Number(existing.weeklyScore) || 0);
    const prevCells = Math.max(0, Number(existing.cellsEaten) || 0);
    const prevMatches = Math.max(1, Number(existing.matchesCount) || 1);

    try {
      await updateDoc(docRef, {
        displayName: safeName,
        skinId: validSkin,
        level: safeLevel,
        bestMass: Math.min(10_000_000, Math.max(prevMass, addPeak)),
        weeklyScore: Math.min(1_000_000_000, prevScore + addScore),
        cellsEaten: Math.min(1_000_000, prevCells + addCells),
        matchesCount: Math.min(1_000_000, prevMatches + addMatches),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(docRef, {
        uid: user.uid,
        playerCode: cleanCode,
        displayName: safeName,
        skinId: validSkin,
        level: safeLevel,
        weekKey,
        bestMass: addPeak,
        weeklyScore: addScore,
        cellsEaten: addCells,
        matchesCount: addMatches,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }
}

export async function fetchWeeklyTopEntries(
  weekKey = getCurrentWeekKey()
): Promise<WeeklyTopEntry[]> {
  const path = 'weeklyTop';
  try {
    const q = query(
      collection(db, 'weeklyTop'),
      where('isPublic', '==', true),
      where('weekKey', '==', weekKey),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        uid: String(data.uid || d.id),
        playerCode: String(data.playerCode || ''),
        displayName: String(data.displayName || 'Player'),
        skinId: safeSkinId(data.skinId),
        level: Math.max(1, Number(data.level) || 1),
        weekKey: String(data.weekKey || weekKey),
        bestMass: Math.max(0, Number(data.bestMass) || 0),
        weeklyScore: Math.max(0, Number(data.weeklyScore) || 0),
        cellsEaten: Math.max(0, Number(data.cellsEaten) || 0),
        matchesCount: Math.max(1, Number(data.matchesCount) || 1),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
