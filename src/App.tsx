import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { AccountFriendsModal } from './components/AccountFriendsModal';
import { ControlCustomizer } from './components/ControlCustomizer';
import { GameHUD } from './components/GameHUD';
import { GamePassModal } from './components/GamePassModal';
import { MazeEventModal } from './components/MazeEventModal';
import { MenuOverlay } from './components/MenuOverlay';
import { OwnerMenuModal } from './components/OwnerMenuModal';
import { ShopModal } from './components/ShopModal';
import { WorldTopModal } from './components/WorldTopModal';
import { auth, createGoogleProvider, isValidEmailFormat, isVerifiedOwnerUser } from './firebase';
import {
  addCloudFriend,
  adminCreateCloudGrant,
  adminFetchAllCloudPlayers,
  claimPendingCloudGrants,
  clearLocalWeeklyPending,
  ensureCloudAccount,
  extractAccountErrorReason,
  fetchCloudFriends,
  fetchWeeklyTopEntries,
  getOrCreateLocalPlayerCode,
  loadLocalFriends,
  loadLocalWeeklyPending,
  normalizePlayerCode,
  recordLocalWeeklyMatch,
  removeCloudFriend,
  saveLocalFriends,
  syncCloudProfile,
  upsertWeeklyTopScore,
} from './game/accountService';
import { loadControlLayout, saveControlLayout } from './game/controlLayout';
import { AgarEngine } from './game/engine';
import {
  claimAllAvailablePassRewards,
  claimChallengeReward,
  claimSinglePassReward,
  countClaimablePassItems,
  loadGamePass,
  recordMatchIntoGamePass,
  saveGamePass,
} from './game/gamePass';
import { TRANSLATIONS } from './game/i18n';
import {
  claimDailyEventTokens,
  countAffordableMazeMoves,
  loadMazeEvent,
  recordMatchIntoMazeEvent,
  saveMazeEvent,
  unlockMazeNode,
} from './game/mazeEvent';
import {
  applyXpGain,
  BOOST_ITEMS,
  calculateAndApplyMatchRewards,
  loadProfile,
  saveProfile,
} from './game/progression';
import { getSkinLevel, SKINS, SKIN_MAP } from './game/skins';
import { soundFX } from './game/sound';
import {
  AccountModalTab,
  BannedPlayerRecord,
  BoostId,
  ControlLayout,
  FriendRecord,
  GameConfig,
  GameMode,
  GamePassState,
  GamePhase,
  HudSnapshot,
  Language,
  LiveServerPlayer,
  MatchRewardSummary,
  MazeEventState,
  NetStatePayload,
  OwnerAnnouncement,
  OwnerPowers,
  PassTrack,
  PlayerProfile,
  PublicPlayerProfile,
  RoomSummary,
  ShopTab,
  SkinId,
  SkinLevel,
  TargetFps,
  WeeklyTopEntry,
} from './game/types';

const STORAGE_BEST_KEY = 'xane_best_mass';
const STORAGE_CONFIG_KEY = 'xane_config';

const DEFAULT_CONFIG: GameConfig = {
  nickname: '',
  skinId: 'kurdish_sun',
  playType: 'online',
  roomId: 'global',
  mode: 'classic',
  theme: 'light',
  showMassOnCells: true,
  targetFps: 60,
  showFpsCounter: true,
};

interface TouchJoystick {
  pointerId: number;
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

function loadInitialConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameConfig>;
      const validFps: TargetFps =
        parsed.targetFps === 30 || parsed.targetFps === 60 || parsed.targetFps === 120
          ? parsed.targetFps
          : 60;
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        targetFps: validFps,
        showFpsCounter: parsed.showFpsCounter ?? true,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_CONFIG;
}

function loadBestMass(): number {
  try {
    const raw = localStorage.getItem(STORAGE_BEST_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('ckb');
  const [config, setConfig] = useState<GameConfig>(loadInitialConfig);
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [passState, setPassState] = useState<GamePassState>(loadGamePass);
  const [mazeEvent, setMazeEvent] = useState<MazeEventState>(loadMazeEvent);
  const [controlLayout, setControlLayout] = useState<ControlLayout>(loadControlLayout);
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [shopOpen, setShopOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState<ShopTab>('skins');
  const [gamePassOpen, setGamePassOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(1.0);
  const [touchStick, setTouchStick] = useState<TouchJoystick | null>(null);
  const [joystickPadDelta, setJoystickPadDelta] = useState<{ dx: number; dy: number } | null>(null);
  const [bestMass, setBestMass] = useState<number>(loadBestMass);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [lastSummary, setLastSummary] = useState<HudSnapshot | null>(null);
  const [lastRewards, setLastRewards] = useState<MatchRewardSummary | null>(null);
  const [lastTokensEarned, setLastTokensEarned] = useState(0);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);
  const [accountSyncStatus, setAccountSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [accountSyncError, setAccountSyncError] = useState<string | null>(null);
  const [playerCode, setPlayerCode] = useState<string>(getOrCreateLocalPlayerCode);
  const [friends, setFriends] = useState<FriendRecord[]>(loadLocalFriends);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<AccountModalTab>('account');
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [ownerPowers, setOwnerPowers] = useState<OwnerPowers>({
    godMode: false,
    virusShield: false,
    speedMultiplier: 1,
    foodMagnet: false,
    autoFastMerge: false,
  });
  const [livePlayers, setLivePlayers] = useState<LiveServerPlayer[]>([]);
  const [cloudPlayers, setCloudPlayers] = useState<PublicPlayerProfile[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<BannedPlayerRecord[]>([]);
  const [announcement, setAnnouncement] = useState<OwnerAnnouncement | null>(null);
  const [loadingAdminPlayers, setLoadingAdminPlayers] = useState(false);
  const [kickedNotice, setKickedNotice] = useState<string | null>(null);
  const [grantNotice, setGrantNotice] = useState<string | null>(null);
  const [sessionBestRank, setSessionBestRank] = useState(0);
  const [worldTopOpen, setWorldTopOpen] = useState(false);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyTopEntry[]>([]);
  const [loadingWeeklyTop, setLoadingWeeklyTop] = useState(false);
  const [currentFps, setCurrentFps] = useState<number>(config.targetFps);
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    mass: 0,
    peakMass: 0,
    score: 0,
    rank: 0,
    totalPlayers: 0,
    cellsEaten: 0,
    cellCount: 0,
    elapsedSeconds: 0,
    leaderboard: [],
    minimapDots: [],
    worldSize: 4200,
    canSplit: false,
    canEject: false,
    killerName: null,
  }));

  const isOwner = isVerifiedOwnerUser(firebaseUser);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AgarEngine | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConnectedAtRef = useRef<number>(0);
  const wsLastActivityRef = useRef<number>(0);
  const connectionIdRef = useRef<string>('');
  const pendingJoinRef = useRef<{ effectiveConfig: GameConfig; useStartMassBoost: boolean } | null>(null);
  const pendingStartMassBoostRef = useRef<boolean>(false);
  const joinTimeoutRef = useRef<number | null>(null);
  const cloudSyncedUidRef = useRef<string | null>(null);
  const phaseRef = useRef<GamePhase>(phase);
  const customizerOpenRef = useRef<boolean>(customizerOpen);
  const ownerMenuOpenRef = useRef<boolean>(ownerMenuOpen);
  const profileRef = useRef<PlayerProfile>(profile);
  const configRef = useRef<GameConfig>(config);
  const langRef = useRef<Language>(lang);
  const firebaseUserRef = useRef<User | null>(firebaseUser);
  const playerCodeRef = useRef<string>(playerCode);
  const passStateRef = useRef<GamePassState>(passState);
  const mazeEventRef = useRef<MazeEventState>(mazeEvent);
  const bestMassRef = useRef<number>(bestMass);
  const ownerPowersRef = useRef<OwnerPowers>(ownerPowers);
  const sessionBestRankRef = useRef<number>(0);
  const targetFpsRef = useRef<TargetFps>(config.targetFps);
  const wHeldRef = useRef(false);
  const fastEjectHeldRef = useRef(false);
  const netEjectModeRef = useRef<'off' | 'normal' | 'fast'>('off');
  const stickRef = useRef<TouchJoystick | null>(null);
  const padPointerIdRef = useRef<number | null>(null);
  const padCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasPointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDistRef = useRef<number | null>(null);

  phaseRef.current = phase;
  customizerOpenRef.current = customizerOpen;
  ownerMenuOpenRef.current = ownerMenuOpen;
  profileRef.current = profile;
  configRef.current = config;
  langRef.current = lang;
  firebaseUserRef.current = firebaseUser;
  playerCodeRef.current = playerCode;
  passStateRef.current = passState;
  mazeEventRef.current = mazeEvent;
  bestMassRef.current = bestMass;
  ownerPowersRef.current = ownerPowers;
  targetFpsRef.current = config.targetFps;

  const t = TRANSLATIONS[lang];

  const syncOnlineEjectHold = useCallback(() => {
    const nextMode: 'off' | 'normal' | 'fast' =
      phaseRef.current === 'PLAYING' && !customizerOpenRef.current
        ? fastEjectHeldRef.current
          ? 'fast'
          : wHeldRef.current
          ? 'normal'
          : 'off'
        : 'off';
    if (nextMode === netEjectModeRef.current) return;
    netEjectModeRef.current = nextMode;
    if (engineRef.current?.isNetworkMode) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'eject_hold', mode: nextMode }));
        } catch {
          // Ignore send errors
        }
      }
    }
  }, []);

  const updateHudSnapshot = useCallback((snap: HudSnapshot) => {
    if (snap.rank > 0 && (sessionBestRankRef.current === 0 || snap.rank < sessionBestRankRef.current)) {
      sessionBestRankRef.current = snap.rank;
      setSessionBestRank(snap.rank);
    }
    setHud(snap);
  }, []);

  const resetActiveTouches = useCallback(() => {
    wHeldRef.current = false;
    fastEjectHeldRef.current = false;
    syncOnlineEjectHold();
    stickRef.current = null;
    padPointerIdRef.current = null;
    canvasPointersRef.current.clear();
    pinchDistRef.current = null;
    setTouchStick(null);
    setJoystickPadDelta(null);
  }, [syncOnlineEjectHold]);

  const refreshWeeklyTop = useCallback(async () => {
    setLoadingWeeklyTop(true);
    try {
      const list = await fetchWeeklyTopEntries();
      setWeeklyEntries(list);
    } catch (err) {
      console.error('Weekly top fetch warning:', err);
    } finally {
      setLoadingWeeklyTop(false);
    }
  }, []);

  useEffect(() => {
    void refreshWeeklyTop();
  }, [refreshWeeklyTop]);

  // Sync HTML dir/lang and dark class
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ckb' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }
    engineRef.current?.setConfig(config);
  }, [config]);

  useEffect(() => {
    engineRef.current?.setUserZoom(zoomMultiplier);
  }, [zoomMultiplier]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveControlLayout(controlLayout);
  }, [controlLayout]);

  useEffect(() => {
    saveGamePass(passState);
  }, [passState]);

  useEffect(() => {
    saveMazeEvent(mazeEvent);
  }, [mazeEvent]);

  useEffect(() => {
    saveLocalFriends(friends);
  }, [friends]);

  const syncCloudAccountForUser = useCallback(
    async (user: User) => {
      setAccountSyncStatus('syncing');
      setAccountSyncError(null);

      try {
        const localNick = configRef.current.nickname.trim();
        const res = await ensureCloudAccount(user, {
          displayName:
            localNick ||
            user.displayName ||
            TRANSLATIONS[langRef.current].defaultPlayerName,
          hasLocalNickname: Boolean(localNick),
          skinId: configRef.current.skinId,
          profile: profileRef.current,
          bestMass: bestMassRef.current,
          currentRoom:
            configRef.current.playType === 'online' ? configRef.current.roomId : 'solo',
          online: true,
        });

        // Guard against stale async completion after sign-out or account switch
        if (firebaseUserRef.current?.uid !== user.uid) return;

        setPlayerCode(res.publicProfile.playerCode);
        playerCodeRef.current = res.publicProfile.playerCode;

        if (!localNick && res.publicProfile.displayName) {
          setConfig((prev) => ({
            ...prev,
            nickname: prev.nickname.trim() ? prev.nickname : res.publicProfile.displayName,
            skinId:
              prev.skinId === 'kurdish_sun' && res.publicProfile.skinId !== 'kurdish_sun'
                ? res.publicProfile.skinId
                : prev.skinId,
          }));
        } else if (
          configRef.current.skinId === 'kurdish_sun' &&
          res.publicProfile.skinId !== 'kurdish_sun'
        ) {
          setConfig((prev) => ({ ...prev, skinId: res.publicProfile.skinId }));
        }

        if (res.publicProfile.bestMass > bestMassRef.current) {
          setBestMass(res.publicProfile.bestMass);
          try {
            localStorage.setItem(STORAGE_BEST_KEY, String(res.publicProfile.bestMass));
          } catch {
            // Ignore storage errors
          }
        }

        const pendingGrants = await claimPendingCloudGrants(user.uid);
        if (pendingGrants.coins > 0 || pendingGrants.dna > 0) {
          setGrantNotice(TRANSLATIONS[langRef.current].receivedGrantNotice);
          soundFX.playEatCell();
        }

        setProfile((prev) => {
          const nextLevels: Partial<Record<SkinId, SkinLevel>> = { ...prev.skinLevels };
          for (const [k, v] of Object.entries(res.mergedSkinLevels || {})) {
            if (v === 2 || v === 3) {
              const cur = nextLevels[k as SkinId] || 1;
              if (v > cur) nextLevels[k as SkinId] = v;
            }
          }
          return {
            ...prev,
            coins: Math.max(prev.coins, res.publicProfile.coins) + pendingGrants.coins,
            dna: Math.max(prev.dna, res.publicProfile.dna) + pendingGrants.dna,
            level: Math.max(prev.level, res.publicProfile.level),
            score: Math.max(prev.score, res.publicProfile.score),
            xp: Math.max(prev.xp, res.mergedXp),
            unlockedSkins: Array.from(
              new Set([...prev.unlockedSkins, ...res.mergedUnlockedSkins])
            ),
            skinLevels: nextLevels,
          };
        });

        const cloudFriends = await fetchCloudFriends(user.uid);
        if (cloudFriends.length > 0) {
          setFriends((prev) => {
            const merged = new Map<string, FriendRecord>();
            for (const f of prev) merged.set(f.friendUid, f);
            for (const cf of cloudFriends) merged.set(cf.friendUid, cf);
            return Array.from(merged.values());
          });
        }

        const pendingWeekly = loadLocalWeeklyPending();
        if (pendingWeekly.matchesCount > 0) {
          try {
            await upsertWeeklyTopScore(user, res.publicProfile.playerCode, {
              displayName:
                configRef.current.nickname.trim() ||
                res.publicProfile.displayName ||
                user.displayName ||
                TRANSLATIONS[langRef.current].defaultPlayerName,
              skinId: configRef.current.skinId || res.publicProfile.skinId,
              level: Math.max(profileRef.current.level, res.publicProfile.level),
              matchPeakMass: pendingWeekly.bestMass,
              matchScore: pendingWeekly.weeklyScore,
              matchCellsEaten: pendingWeekly.cellsEaten,
              matchCountDelta: pendingWeekly.matchesCount,
            });
            clearLocalWeeklyPending();
            void refreshWeeklyTop();
          } catch (weeklyErr) {
            console.error('Weekly pending sync warning:', weeklyErr);
          }
        }

        cloudSyncedUidRef.current = user.uid;
        setAccountSyncStatus('synced');
      } catch (err) {
        console.error('Account sync error:', err);
        setAccountSyncStatus('error');
        setAccountSyncError(extractAccountErrorReason(err));
      }
    },
    [refreshWeeklyTop]
  );

  // Firebase Authentication & Redirect Result & Cloud Account / Friends / Pending Grants Sync
  useEffect(() => {
    void getRedirectResult(auth).catch((err: unknown) => {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code && code !== 'auth/no-auth-event' && code !== 'auth/cancelled-popup-request') {
        setAuthError(`${TRANSLATIONS[langRef.current].authErrorGeneric} (${code})`);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      firebaseUserRef.current = user;
      if (!user) {
        cloudSyncedUidRef.current = null;
        setAccountSyncStatus('idle');
        setAccountSyncError(null);
        setOwnerMenuOpen(false);
        return;
      }

      setAuthError(null);
      setShowRedirectFallback(false);
      void syncCloudAccountForUser(user);
    });

    return () => unsubscribe();
  }, [syncCloudAccountForUser]);

  // Debounced cloud profile sync while signed in AND initial cloud sync completed
  useEffect(() => {
    if (!firebaseUser) return;
    if (accountSyncStatus !== 'synced' || cloudSyncedUidRef.current !== firebaseUser.uid) {
      return;
    }
    const timer = window.setTimeout(() => {
      void syncCloudProfile(firebaseUser, playerCode, {
        displayName:
          config.nickname.trim() ||
          firebaseUser.displayName ||
          TRANSLATIONS[lang].defaultPlayerName,
        skinId: config.skinId,
        profile,
        bestMass,
        currentRoom: config.playType === 'online' ? config.roomId : 'solo',
        online: true,
      }).catch((err) => {
        console.error('Cloud profile sync warning:', err);
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [
    firebaseUser,
    accountSyncStatus,
    playerCode,
    config.nickname,
    config.skinId,
    config.playType,
    config.roomId,
    profile,
    bestMass,
    lang,
  ]);

  const fetchRoomsNow = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms', { cache: 'no-store' });
      if (!res.ok) return false;
      const data = (await res.json()) as { rooms?: RoomSummary[] };
      if (Array.isArray(data.rooms)) {
        setRooms(data.rooms);
        return true;
      }
    } catch {
      // Ignore transient fetch errors
    }
    return false;
  }, []);

  // Poll available online rooms while on Menu
  useEffect(() => {
    if (phase !== 'MENU') return;
    let cancelled = false;

    const poll = async () => {
      const ok = await fetchRoomsNow();
      if (!cancelled && !ok && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        setServerStatus('offline');
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase, fetchRoomsNow]);

  const leaveOnlineMatch = useCallback(() => {
    pendingJoinRef.current = null;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'leave' }));
      } catch {
        // Ignore send errors
      }
    }
  }, []);

  const sendPresenceUpdate = useCallback((ws: WebSocket | null) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(
        JSON.stringify({
          type: 'presence',
          uid: firebaseUserRef.current?.uid || '',
          playerCode: playerCodeRef.current,
          name:
            configRef.current.nickname.trim() ||
            firebaseUserRef.current?.displayName ||
            TRANSLATIONS[langRef.current].defaultPlayerName,
          skinId: configRef.current.skinId,
          skinLevel: getSkinLevel(profileRef.current.skinLevels, configRef.current.skinId),
          level: profileRef.current.level,
        })
      );
    } catch {
      // Ignore send errors
    }
  }, []);

  const handlePlayerDeath = useCallback(
    (snapshot: HudSnapshot) => {
      resetActiveTouches();
      setCustomizerOpen(false);
      setLastSummary(snapshot);
      if (snapshot.peakMass > bestMassRef.current) {
        setBestMass(snapshot.peakMass);
        setIsNewRecord(true);
        try {
          localStorage.setItem(STORAGE_BEST_KEY, String(snapshot.peakMass));
        } catch {
          // Ignore storage errors
        }
      } else {
        setIsNewRecord(false);
      }

      const { nextProfile, rewards } = calculateAndApplyMatchRewards(
        profileRef.current,
        snapshot.peakMass,
        snapshot.cellsEaten,
        snapshot.elapsedSeconds
      );
      setProfile(nextProfile);
      setLastRewards(rewards);

      const { nextPass } = recordMatchIntoGamePass(passStateRef.current, {
        foodsEaten: snapshot.foodsEaten ?? 0,
        peakMass: snapshot.peakMass,
        cellsEaten: snapshot.cellsEaten,
        elapsedSeconds: snapshot.elapsedSeconds,
        splitsUsed: snapshot.splitsUsed ?? 0,
      });
      setPassState(nextPass);

      const { nextEvent, tokensEarned } = recordMatchIntoMazeEvent(
        mazeEventRef.current,
        snapshot.peakMass,
        snapshot.cellsEaten
      );
      setMazeEvent(nextEvent);
      setLastTokensEarned(tokensEarned);

      if (
        firebaseUserRef.current &&
        cloudSyncedUidRef.current === firebaseUserRef.current.uid &&
        /^RK[0-9A-Z]{6}$/.test(playerCodeRef.current)
      ) {
        void upsertWeeklyTopScore(firebaseUserRef.current, playerCodeRef.current, {
          displayName:
            configRef.current.nickname.trim() ||
            firebaseUserRef.current.displayName ||
            TRANSLATIONS[langRef.current].defaultPlayerName,
          skinId: configRef.current.skinId,
          level: nextProfile.level,
          matchPeakMass: snapshot.peakMass,
          matchScore: rewards.scoreGained,
          matchCellsEaten: snapshot.cellsEaten,
          matchCountDelta: 1,
        })
          .then(() => refreshWeeklyTop())
          .catch((err) => {
            console.error('Weekly score upload warning:', err);
            recordLocalWeeklyMatch(snapshot.peakMass, rewards.scoreGained, snapshot.cellsEaten);
          });
      } else {
        recordLocalWeeklyMatch(snapshot.peakMass, rewards.scoreGained, snapshot.cellsEaten);
      }

      setPhase('GAME_OVER');
    },
    [resetActiveTouches, refreshWeeklyTop]
  );

  // Initialize Engine & 60fps Loop
  useEffect(() => {
    const engine = new AgarEngine(handlePlayerDeath);
    engine.setConfig(config);
    engine.setUserZoom(zoomMultiplier);
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setViewport(w, h);
    };

    handleResize();
    engine.setPointerScreen(window.innerWidth / 2, window.innerHeight / 2);
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = performance.now();
    let lastRenderTime = lastTime;
    let fpsWindowStart = lastTime;
    let fpsFrames = 0;
    let lastHudSync = 0;
    let lastEjectTime = 0;
    let lastFastEjectTime = 0;
    let lastFastSoundTime = 0;
    let lastNetInputTime = 0;

    const loop = (now: number) => {
      const targetFps = targetFpsRef.current;
      const frameInterval = 1000 / targetFps;
      const sinceLastRender = now - lastRenderTime;

      if (sinceLastRender < frameInterval * 0.94) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      lastRenderTime = now - Math.min(sinceLastRender % frameInterval, frameInterval * 0.45);
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      fpsFrames += 1;
      const fpsElapsed = now - fpsWindowStart;
      if (fpsElapsed >= 500) {
        const measured = Math.min(targetFps, Math.round((fpsFrames * 1000) / fpsElapsed));
        setCurrentFps(Math.max(1, measured));
        fpsFrames = 0;
        fpsWindowStart = now;
      }

      const isSoloPaused =
        (phaseRef.current === 'PAUSED' ||
          customizerOpenRef.current ||
          ownerMenuOpenRef.current) &&
        !engine.isNetworkMode;

      if (!isSoloPaused) {
        if (phaseRef.current === 'PLAYING' && !customizerOpenRef.current) {
          if (engine.isNetworkMode) {
            if ((fastEjectHeldRef.current || wHeldRef.current) && now - lastFastSoundTime >= 85) {
              if (engine.getHudSnapshot().canEject) {
                soundFX.playEject();
                lastFastSoundTime = now;
              }
            }
          } else {
            if (fastEjectHeldRef.current && now - lastFastEjectTime >= 18) {
              const canSound = now - lastFastSoundTime >= 75;
              engine.ejectPlayerMass(2, canSound);
              if (canSound) lastFastSoundTime = now;
              lastFastEjectTime = now;
            } else if (wHeldRef.current && now - lastEjectTime >= 52) {
              const canSound = now - lastFastSoundTime >= 80;
              engine.ejectPlayerMass(1, canSound);
              if (canSound) lastFastSoundTime = now;
              lastEjectTime = now;
            }
          }
        }

        if (engine.isNetworkMode && phaseRef.current === 'PLAYING' && now - lastNetInputTime > 40) {
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            const ptr = engine.getPointerWorld();
            ws.send(
              JSON.stringify({
                type: 'input',
                targetX: ptr.x,
                targetY: ptr.y,
                stop: engine.isPointerCentered(),
              })
            );
            lastNetInputTime = now;
          }
        }

        engine.update(dt);
      }

      engine.render(ctx);

      if (!engine.isNetworkMode && phaseRef.current === 'PLAYING' && now - lastHudSync > 110) {
        lastHudSync = now;
        updateHudSnapshot(engine.getHudSnapshot());
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePlayerDeath]);

  const clearJoinTimeout = useCallback(() => {
    if (joinTimeoutRef.current !== null) {
      window.clearTimeout(joinTimeoutRef.current);
      joinTimeoutRef.current = null;
    }
  }, []);

  // Persistent Presence + Gameplay WebSocket Connection
  const connectPresenceSocket = useCallback(
    (forceReconnect = false) => {
      if (forceReconnect && wsRef.current) {
        const prev = wsRef.current;
        wsRef.current = null;
        try {
          prev.close();
        } catch {
          // Ignore close error
        }
      }

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      setServerStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;
      wsConnectedAtRef.current = Date.now();
      wsLastActivityRef.current = Date.now();

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        wsLastActivityRef.current = Date.now();
        setServerStatus('connected');
        sendPresenceUpdate(ws);

        const pending = pendingJoinRef.current;
        if (pending) {
          pendingJoinRef.current = null;
          engineRef.current?.setNetworkMode(true);
          ws.send(
            JSON.stringify({
              type: 'join',
              roomId: pending.effectiveConfig.roomId.trim() || 'global',
              name: pending.effectiveConfig.nickname,
              skinId: pending.effectiveConfig.skinId,
              skinLevel: getSkinLevel(profileRef.current.skinLevels, pending.effectiveConfig.skinId),
              mode: pending.effectiveConfig.mode,
              startMassBonus: pending.useStartMassBoost ? 20 : 0,
              uid: firebaseUserRef.current?.uid || '',
              playerCode: playerCodeRef.current,
              level: profileRef.current.level,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) return;
        wsLastActivityRef.current = Date.now();

        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }

        if (msg.type === 'pong') {
          setServerStatus('connected');
          return;
        }

        if (msg.type === 'welcome') {
          setServerStatus('connected');
          connectionIdRef.current = typeof msg.connectionId === 'string' ? msg.connectionId : '';
          if (msg.announcement && typeof msg.announcement === 'object') {
            const ann = msg.announcement as OwnerAnnouncement;
            if (typeof ann.text === 'string' && ann.text.trim()) {
              setAnnouncement(ann);
            }
          }
          sendPresenceUpdate(ws);
        } else if (msg.type === 'announcement') {
          if (msg.announcement && typeof msg.announcement === 'object') {
            const ann = msg.announcement as OwnerAnnouncement;
            setAnnouncement(typeof ann.text === 'string' && ann.text.trim() ? ann : null);
          } else {
            setAnnouncement(null);
          }
        } else if (msg.type === 'room_mode') {
          if (
            msg.mode === 'classic' ||
            msg.mode === 'blitz' ||
            msg.mode === 'relaxed' ||
            msg.mode === 'merge'
          ) {
            const nextMode = msg.mode;
            setConfig((prev) => ({ ...prev, mode: nextMode }));
          }
        } else if (msg.type === 'joined') {
          clearJoinTimeout();
          if (pendingStartMassBoostRef.current) {
            pendingStartMassBoostRef.current = false;
            setProfile((prev) => ({
              ...prev,
              boosts: {
                ...prev.boosts,
                startMassBoost: Math.max(0, prev.boosts.startMassBoost - 1),
              },
            }));
          }

          if (
            msg.mode === 'classic' ||
            msg.mode === 'blitz' ||
            msg.mode === 'relaxed' ||
            msg.mode === 'merge'
          ) {
            const roomMode = msg.mode;
            const joinedRoomId = typeof msg.roomId === 'string' ? msg.roomId : configRef.current.roomId;
            setConfig((prev) => ({
              ...prev,
              roomId: joinedRoomId,
              mode: roomMode,
            }));
          }

          setServerStatus('connected');
          setConnecting(false);
          setConnectionError(null);
          setIsNewRecord(false);
          setLastSummary(null);
          setLastRewards(null);
          setLastTokensEarned(0);
          sessionBestRankRef.current = 0;
          setSessionBestRank(0);
          resetActiveTouches();
          engineRef.current?.setPointerScreen(window.innerWidth / 2, window.innerHeight / 2);
          setPhase('PLAYING');

          // Auto-apply active owner powers upon entering an online match
          const user = firebaseUserRef.current;
          const p = ownerPowersRef.current;
          if (
            user &&
            isVerifiedOwnerUser(user) &&
            (p.godMode || p.virusShield || p.foodMagnet || p.autoFastMerge || p.speedMultiplier !== 1)
          ) {
            void user.getIdToken().then((token) =>
              fetch('/api/admin/powers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  connectionId: connectionIdRef.current,
                  powers: p,
                }),
              })
            ).catch(() => {});
          }
        } else if (msg.type === 'state') {
          const engine = engineRef.current;
          if (engine && engine.isNetworkMode) {
            const snap = engine.applyNetworkState(msg as unknown as NetStatePayload);
            updateHudSnapshot(snap);
          }
        } else if (msg.type === 'died') {
          soundFX.playGameOver();
          const peakMass = Number(msg.peakMass) || 0;
          const cellsEaten = Number(msg.cellsEaten) || 0;
          const foodsEaten = Number(msg.foodsEaten) || 0;
          const splitsUsed = Number(msg.splitsUsed) || 0;
          const elapsedSeconds = Number(msg.elapsedSeconds) || 0;
          const engine = engineRef.current;
          const summary: HudSnapshot = {
            ...(engine ? engine.getHudSnapshot() : hud),
            peakMass,
            cellsEaten,
            foodsEaten,
            splitsUsed,
            elapsedSeconds,
            score: Math.round(peakMass * 2 + cellsEaten * 85 + elapsedSeconds * 1.5),
            killerName: typeof msg.killerName === 'string' ? msg.killerName : null,
          };
          engine?.setNetworkMode(false);
          handlePlayerDeath(summary);
        } else if (msg.type === 'kicked') {
          clearJoinTimeout();
          pendingStartMassBoostRef.current = false;
          resetActiveTouches();
          pendingJoinRef.current = null;
          engineRef.current?.setNetworkMode(false);
          setConnecting(false);
          setCustomizerOpen(false);
          setKickedNotice(TRANSLATIONS[langRef.current].kickedNotice);
          setPhase('MENU');
        } else if (msg.type === 'banned') {
          clearJoinTimeout();
          pendingStartMassBoostRef.current = false;
          resetActiveTouches();
          pendingJoinRef.current = null;
          engineRef.current?.setNetworkMode(false);
          setConnecting(false);
          setCustomizerOpen(false);
          setKickedNotice(TRANSLATIONS[langRef.current].bannedNotice);
          setPhase('MENU');
        } else if (msg.type === 'currency_grant') {
          const coins = Math.max(0, Math.round(Number(msg.coins) || 0));
          const dna = Math.max(0, Math.round(Number(msg.dna) || 0));
          if (coins > 0 || dna > 0) {
            setProfile((prev) => ({
              ...prev,
              coins: prev.coins + coins,
              dna: prev.dna + dna,
            }));
            setGrantNotice(TRANSLATIONS[langRef.current].receivedGrantNotice);
            soundFX.playEatCell();
          }
        }
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) return;
        setServerStatus('offline');
        if (pendingJoinRef.current) {
          clearJoinTimeout();
          pendingJoinRef.current = null;
          pendingStartMassBoostRef.current = false;
          engineRef.current?.setNetworkMode(false);
          setConnecting(false);
          setConnectionError(TRANSLATIONS[langRef.current].connectionLostText);
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
          connectionIdRef.current = '';
          clearJoinTimeout();
          pendingStartMassBoostRef.current = false;
          setConnecting(false);
          setServerStatus('offline');
          if (
            engineRef.current?.isNetworkMode &&
            (phaseRef.current === 'PLAYING' || phaseRef.current === 'PAUSED')
          ) {
            engineRef.current.setNetworkMode(false);
            setConnectionError(TRANSLATIONS[langRef.current].connectionLostText);
            setPhase('MENU');
          }
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearJoinTimeout, handlePlayerDeath, resetActiveTouches, sendPresenceUpdate]
  );

  useEffect(() => {
    connectPresenceSocket();
    const reconnectTimer = window.setInterval(() => {
      const ws = wsRef.current;
      const now = Date.now();
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        connectPresenceSocket();
        return;
      }
      if (ws.readyState === WebSocket.CONNECTING && now - wsConnectedAtRef.current > 6500) {
        connectPresenceSocket(true);
        return;
      }
      if (ws.readyState === WebSocket.OPEN) {
        if (now - wsLastActivityRef.current > 45_000) {
          connectPresenceSocket(true);
          return;
        }
        if (now - wsLastActivityRef.current >= 16_000) {
          try {
            ws.send(JSON.stringify({ type: 'ping', ts: now }));
          } catch {
            connectPresenceSocket(true);
          }
        }
      }
    }, 3000);

    return () => {
      clearJoinTimeout();
      window.clearInterval(reconnectTimer);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close error
        }
      }
    };
  }, [clearJoinTimeout, connectPresenceSocket]);

  const handleReconnectServer = useCallback(() => {
    setConnectionError(null);
    connectPresenceSocket(true);
    void fetchRoomsNow();
  }, [connectPresenceSocket, fetchRoomsNow]);

  // Keep server presence metadata synced whenever identity/skin/level changes
  useEffect(() => {
    sendPresenceUpdate(wsRef.current);
  }, [firebaseUser, playerCode, config.nickname, config.skinId, profile.level, sendPresenceUpdate]);

  const triggerSplit = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isNetworkMode) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'split' }));
      }
    } else {
      engine.splitPlayer();
    }
  }, []);

  const triggerEject = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isNetworkMode) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'eject', count: 1 }));
        soundFX.playEject();
      }
    } else {
      engine.ejectPlayerMass(1, true);
    }
  }, []);

  const triggerFastEject = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.isNetworkMode) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'eject', count: 2 }));
        soundFX.playEject();
      }
    } else {
      engine.ejectPlayerMass(2, true);
    }
  }, []);

  // Mouse pointer & keyboard handlers
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) <= 24) {
        engineRef.current?.setPointerScreen(cx, cy);
      } else {
        engineRef.current?.setPointerScreen(e.clientX, e.clientY);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (phaseRef.current !== 'PLAYING' || customizerOpenRef.current) return;
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoomMultiplier((prev) => Math.max(0.55, Math.min(1.65, +(prev + delta).toFixed(2))));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (customizerOpenRef.current) {
        if (e.code === 'Escape') {
          e.preventDefault();
          setCustomizerOpen(false);
        }
        return;
      }

      if (phaseRef.current === 'PLAYING') {
        if (e.code === 'Space') {
          e.preventDefault();
          if (!e.repeat) {
            triggerSplit();
          }
        } else if (e.code === 'KeyW') {
          e.preventDefault();
          if (!e.repeat) {
            triggerEject();
          }
          wHeldRef.current = true;
          syncOnlineEjectHold();
        } else if (e.code === 'KeyE') {
          e.preventDefault();
          if (!e.repeat) {
            triggerFastEject();
          }
          fastEjectHeldRef.current = true;
          syncOnlineEjectHold();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          resetActiveTouches();
          setPhase('PAUSED');
        }
      } else if (phaseRef.current === 'PAUSED') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setPhase('PLAYING');
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW') {
        wHeldRef.current = false;
        syncOnlineEjectHold();
      } else if (e.code === 'KeyE') {
        fastEjectHeldRef.current = false;
        syncOnlineEjectHold();
      }
    };

    const onBlur = () => {
      resetActiveTouches();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [triggerSplit, triggerEject, triggerFastEject, resetActiveTouches, syncOnlineEjectHold]);

  const handleChangeZoom = useCallback((next: number) => {
    const clamped = Math.max(0.55, Math.min(1.65, next));
    setZoomMultiplier(clamped);
  }, []);

  // Dedicated Movable Joystick Pad Handlers (isolated pointerId for true multi-touch)
  const updatePadSteering = useCallback((clientX: number, clientY: number) => {
    const center = padCenterRef.current;
    const dx = clientX - center.x;
    const dy = clientY - center.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 40;

    const clampedDx = dist > maxRadius ? (dx / dist) * maxRadius : dx;
    const clampedDy = dist > maxRadius ? (dy / dist) * maxRadius : dy;
    setJoystickPadDelta({ dx: clampedDx, dy: clampedDy });

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    if (dist > 10) {
      engineRef.current?.setPointerScreen(cx + (dx / dist) * 260, cy + (dy / dist) * 260);
    } else {
      engineRef.current?.setPointerScreen(cx, cy);
    }
  }, []);

  const handleJoystickPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (phaseRef.current !== 'PLAYING' || customizerOpenRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      if (padPointerIdRef.current !== null) return;
      padPointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture error
      }

      const rect = e.currentTarget.getBoundingClientRect();
      padCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      updatePadSteering(e.clientX, e.clientY);
    },
    [updatePadSteering]
  );

  const handleJoystickPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (padPointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      updatePadSteering(e.clientX, e.clientY);
    },
    [updatePadSteering]
  );

  const handleJoystickPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (padPointerIdRef.current !== e.pointerId) return;
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release error
    }
    padPointerIdRef.current = null;
    setJoystickPadDelta(null);
  }, []);

  // Open-Canvas Pointer Handlers (Floating Touch Joystick + Pinch-to-Zoom without blocking HUD buttons)
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'touch') return;
    if (phaseRef.current !== 'PLAYING' || customizerOpenRef.current) return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture error
    }

    canvasPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (canvasPointersRef.current.size === 2) {
      const pts = Array.from(canvasPointersRef.current.values());
      pinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      return;
    }

    if (
      canvasPointersRef.current.size === 1 &&
      padPointerIdRef.current === null &&
      !stickRef.current
    ) {
      const stick: TouchJoystick = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        curX: e.clientX,
        curY: e.clientY,
      };
      stickRef.current = stick;
      setTouchStick(stick);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) <= 38) {
        engineRef.current?.setPointerScreen(cx, cy);
      } else {
        engineRef.current?.setPointerScreen(e.clientX, e.clientY);
      }
    }
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'touch') return;
    if (phaseRef.current !== 'PLAYING' || customizerOpenRef.current) return;
    if (!canvasPointersRef.current.has(e.pointerId)) return;

    canvasPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (canvasPointersRef.current.size === 2 && pinchDistRef.current !== null) {
      const pts = Array.from(canvasPointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const diff = (dist - pinchDistRef.current) * 0.004;
      if (Math.abs(diff) > 0.015) {
        pinchDistRef.current = dist;
        setZoomMultiplier((prev) => Math.max(0.55, Math.min(1.65, +(prev + diff).toFixed(2))));
      }
      return;
    }

    const active = stickRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;
    const dist = Math.hypot(dx, dy);

    const maxRadius = 46;
    const clampedX = dist > maxRadius ? active.startX + (dx / dist) * maxRadius : e.clientX;
    const clampedY = dist > maxRadius ? active.startY + (dy / dist) * maxRadius : e.clientY;

    const updated: TouchJoystick = {
      ...active,
      curX: clampedX,
      curY: clampedY,
    };
    stickRef.current = updated;
    setTouchStick(updated);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const nearScreenCenter = Math.hypot(e.clientX - cx, e.clientY - cy) <= 34;

    if (nearScreenCenter || dist <= 10) {
      engineRef.current?.setPointerScreen(cx, cy);
    } else {
      engineRef.current?.setPointerScreen(cx + (dx / dist) * 240, cy + (dy / dist) * 240);
    }
  }, []);

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'touch') return;

    canvasPointersRef.current.delete(e.pointerId);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release error
    }

    if (canvasPointersRef.current.size < 2) {
      pinchDistRef.current = null;
    }

    const active = stickRef.current;
    if (active && active.pointerId === e.pointerId) {
      stickRef.current = null;
      setTouchStick(null);
    }
  }, []);

  const handleChangeConfig = useCallback((partial: Partial<GameConfig>) => {
    setConnectionError(null);
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleBuySkin = useCallback((skinId: SkinId) => {
    const skin = SKIN_MAP[skinId];
    if (!skin) return;
    setProfile((prev) => {
      if (prev.unlockedSkins.includes(skinId)) return prev;
      if (skin.currency === 'dna') {
        if (prev.dna < skin.price) return prev;
        return {
          ...prev,
          dna: prev.dna - skin.price,
          unlockedSkins: [...prev.unlockedSkins, skinId],
        };
      }
      if (prev.coins < skin.price) return prev;
      return {
        ...prev,
        coins: prev.coins - skin.price,
        unlockedSkins: [...prev.unlockedSkins, skinId],
      };
    });
    setConfig((prev) => ({ ...prev, skinId }));
    soundFX.playEatCell();
  }, []);

  const handleUpgradeSkin = useCallback((skinId: SkinId) => {
    const skin = SKIN_MAP[skinId];
    if (!skin?.isVip) return;
    setProfile((prev) => {
      if (!prev.unlockedSkins.includes(skinId)) return prev;
      const currentLevel = getSkinLevel(prev.skinLevels, skinId);
      if (currentLevel >= 3) return prev;
      const nextLevel: SkinLevel = currentLevel === 1 ? 2 : 3;
      const price =
        nextLevel === 2
          ? skin.upgradeLv2Price ?? 400
          : skin.upgradeLv3Price ?? 40;
      const currency =
        nextLevel === 2
          ? skin.upgradeLv2Currency ?? 'coins'
          : skin.upgradeLv3Currency ?? 'dna';
      if (currency === 'dna') {
        if (prev.dna < price) return prev;
        return {
          ...prev,
          dna: prev.dna - price,
          skinLevels: { ...prev.skinLevels, [skinId]: nextLevel },
        };
      }
      if (prev.coins < price) return prev;
      return {
        ...prev,
        coins: prev.coins - price,
        skinLevels: { ...prev.skinLevels, [skinId]: nextLevel },
      };
    });
    setConfig((prev) => ({ ...prev, skinId }));
    soundFX.playEatCell();
  }, []);

  const handleEquipSkin = useCallback((skinId: SkinId) => {
    setConfig((prev) => ({ ...prev, skinId }));
  }, []);

  const handleBuyBoost = useCallback((boostId: BoostId) => {
    const item = BOOST_ITEMS.find((b) => b.id === boostId);
    if (!item) return;

    setProfile((prev) => {
      const canAfford =
        item.currency === 'dna' ? prev.dna >= item.price : prev.coins >= item.price;
      if (!canAfford) return prev;

      const deducted: PlayerProfile = {
        ...prev,
        coins: item.currency === 'coins' ? prev.coins - item.price : prev.coins,
        dna: item.currency === 'dna' ? prev.dna - item.price : prev.dna,
        boosts: { ...prev.boosts },
      };

      if (boostId === 'xp_pack_500' && item.xpAmount) {
        const { nextProfile } = applyXpGain(deducted, item.xpAmount);
        return nextProfile;
      }

      if (boostId === 'level_boost_2x') {
        deducted.boosts.levelBoost2x += item.charges;
      } else if (boostId === 'level_boost_3x') {
        deducted.boosts.levelBoost3x += item.charges;
      } else if (boostId === 'coin_boost_2x') {
        deducted.boosts.coinBoost2x += item.charges;
      } else if (boostId === 'start_mass_boost') {
        deducted.boosts.startMassBoost += item.charges;
      }
      return deducted;
    });

    soundFX.playEatCell();
  }, []);

  const startOnlineGame = useCallback(
    (effectiveConfig: GameConfig, useStartMassBoost: boolean) => {
      const engine = engineRef.current;
      if (!engine) return;

      clearJoinTimeout();
      setConnecting(true);
      setConnectionError(null);
      setKickedNotice(null);
      pendingStartMassBoostRef.current = useStartMassBoost;

      joinTimeoutRef.current = window.setTimeout(() => {
        pendingJoinRef.current = null;
        pendingStartMassBoostRef.current = false;
        engineRef.current?.setNetworkMode(false);
        setConnecting(false);
        setConnectionError(TRANSLATIONS[langRef.current].connectionTimeoutText);
        connectPresenceSocket(true);
      }, 8000);

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        pendingJoinRef.current = null;
        engine.setNetworkMode(true);
        ws.send(
          JSON.stringify({
            type: 'join',
            roomId: effectiveConfig.roomId.trim() || 'global',
            name: effectiveConfig.nickname,
            skinId: effectiveConfig.skinId,
            skinLevel: getSkinLevel(profileRef.current.skinLevels, effectiveConfig.skinId),
            mode: effectiveConfig.mode,
            startMassBonus: useStartMassBoost ? 20 : 0,
            uid: firebaseUserRef.current?.uid || '',
            playerCode: playerCodeRef.current,
            level: profileRef.current.level,
          })
        );
      } else {
        pendingJoinRef.current = { effectiveConfig, useStartMassBoost };
        connectPresenceSocket(!ws || ws.readyState !== WebSocket.CONNECTING);
      }
    },
    [clearJoinTimeout, connectPresenceSocket]
  );

  const handleCancelOnlineConnect = useCallback(() => {
    clearJoinTimeout();
    pendingJoinRef.current = null;
    pendingStartMassBoostRef.current = false;
    engineRef.current?.setNetworkMode(false);
    setConnecting(false);
  }, [clearJoinTimeout]);

  const handleStartGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const effectiveName = config.nickname.trim() || t.defaultPlayerName;
    const safeSkin = profile.unlockedSkins.includes(config.skinId)
      ? config.skinId
      : profile.unlockedSkins[0] || 'kurdish_sun';
    const effectiveConfig: GameConfig = {
      ...config,
      nickname: effectiveName,
      skinId: safeSkin,
    };

    const hasStartBoost = profileRef.current.boosts.startMassBoost > 0;

    if (effectiveConfig.playType === 'online') {
      startOnlineGame(effectiveConfig, hasStartBoost);
      return;
    }

    const bonusMass = hasStartBoost ? 20 : 0;
    if (hasStartBoost) {
      setProfile((prev) => ({
        ...prev,
        boosts: {
          ...prev.boosts,
          startMassBoost: Math.max(0, prev.boosts.startMassBoost - 1),
        },
      }));
    }

    leaveOnlineMatch();
    engine.setNetworkMode(false);
    engine.setOwnerPowers(isVerifiedOwnerUser(firebaseUserRef.current) ? ownerPowersRef.current : {
      godMode: false,
      virusShield: false,
      speedMultiplier: 1,
      foodMagnet: false,
      autoFastMerge: false,
    });
    engine.spawnPlayer(
      effectiveConfig,
      bonusMass,
      getSkinLevel(profileRef.current.skinLevels, effectiveConfig.skinId)
    );
    sessionBestRankRef.current = 0;
    setSessionBestRank(0);
    updateHudSnapshot(engine.getHudSnapshot());
    setIsNewRecord(false);
    setLastSummary(null);
    setLastRewards(null);
    setLastTokensEarned(0);
    setConnectionError(null);
    setKickedNotice(null);
    resetActiveTouches();
    engine.setPointerScreen(window.innerWidth / 2, window.innerHeight / 2);
    setPhase('PLAYING');
  }, [
    config,
    profile.unlockedSkins,
    t.defaultPlayerName,
    startOnlineGame,
    leaveOnlineMatch,
    resetActiveTouches,
    updateHudSnapshot,
  ]);

  const handleResume = useCallback(() => {
    setPhase('PLAYING');
  }, []);

  const handleBackToMenu = useCallback(() => {
    clearJoinTimeout();
    pendingStartMassBoostRef.current = false;
    resetActiveTouches();
    leaveOnlineMatch();
    engineRef.current?.setNetworkMode(false);
    sessionBestRankRef.current = 0;
    setSessionBestRank(0);
    setConnecting(false);
    setPhase('MENU');
  }, [clearJoinTimeout, leaveOnlineMatch, resetActiveTouches]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundFX.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'ckb' ? 'en' : 'ckb'));
  }, []);

  const handleCycleFps = useCallback(() => {
    setConfig((prev) => {
      const nextFps: TargetFps = prev.targetFps === 30 ? 60 : prev.targetFps === 60 ? 120 : 30;
      return { ...prev, targetFps: nextFps };
    });
  }, []);

  const handleOpenCustomizer = useCallback(() => {
    resetActiveTouches();
    setCustomizerOpen(true);
  }, [resetActiveTouches]);

  const handleActivatePlusFree = useCallback(() => {
    setPassState((prev) => ({
      ...prev,
      hasPlus: true,
    }));
    soundFX.playEatCell();
  }, []);

  const handleClaimPassReward = useCallback((tier: number, track: PassTrack) => {
    const res = claimSinglePassReward(profileRef.current, passStateRef.current, tier, track);
    if (res.claimed) {
      profileRef.current = res.nextProfile;
      passStateRef.current = res.nextPass;
      setProfile(res.nextProfile);
      setPassState(res.nextPass);
      soundFX.playEatCell();
    }
  }, []);

  const handleClaimAllPassRewards = useCallback(() => {
    const res = claimAllAvailablePassRewards(profileRef.current, passStateRef.current);
    if (res.claimedCount > 0) {
      profileRef.current = res.nextProfile;
      passStateRef.current = res.nextPass;
      setProfile(res.nextProfile);
      setPassState(res.nextPass);
      soundFX.playEatCell();
    }
  }, []);

  const handleClaimChallenge = useCallback((challengeId: string) => {
    setPassState((prev) => {
      const next = claimChallengeReward(prev, challengeId);
      if (next !== prev) {
        soundFX.playEatCell();
      }
      return next;
    });
  }, []);

  const handleSelectMazeNode = useCallback((nodeId: string) => {
    const res = unlockMazeNode(profileRef.current, mazeEventRef.current, nodeId);
    if (res.nextEvent !== mazeEventRef.current || res.nextProfile !== profileRef.current) {
      profileRef.current = res.nextProfile;
      mazeEventRef.current = res.nextEvent;
      setProfile(res.nextProfile);
      setMazeEvent(res.nextEvent);
      if (res.unlocked) {
        soundFX.playEatCell();
      }
    }
  }, []);

  const handleClaimDailyTokens = useCallback(() => {
    const res = claimDailyEventTokens(mazeEventRef.current);
    if (res.claimed) {
      mazeEventRef.current = res.nextEvent;
      setMazeEvent(res.nextEvent);
      soundFX.playEatCell();
    }
  }, []);

  const handleOpenShop = useCallback((tab: ShopTab = 'skins') => {
    setShopInitialTab(tab);
    setShopOpen(true);
  }, []);

  const handleOpenAccount = useCallback((tab: AccountModalTab = 'account') => {
    setAccountTab(tab);
    setAccountOpen(true);
  }, []);

  const handleSignInGoogle = useCallback(async (emailHint?: string) => {
    const trimmedEmail = emailHint?.trim() || '';
    if (trimmedEmail && !isValidEmailFormat(trimmedEmail)) {
      setAuthError(TRANSLATIONS[langRef.current].authErrorInvalidEmailHint);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setShowRedirectFallback(false);
    try {
      const provider = createGoogleProvider(trimmedEmail);
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const tr = TRANSLATIONS[langRef.current];
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        setAuthError(tr.authErrorPopupBlocked);
        setShowRedirectFallback(true);
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(tr.authErrorPopupClosed);
        setShowRedirectFallback(true);
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(`${tr.authErrorUnauthorizedDomain} (${window.location.hostname})`);
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(tr.authErrorOperationNotAllowed);
      } else if (code === 'auth/network-request-failed') {
        setAuthError(tr.authErrorNetwork);
      } else {
        setAuthError(`${tr.authErrorGeneric}${code ? ` (${code})` : ''}`);
      }
      console.error('Google Sign-In failed:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleSignInGoogleRedirect = useCallback(async (emailHint?: string) => {
    const trimmedEmail = emailHint?.trim() || '';
    if (trimmedEmail && !isValidEmailFormat(trimmedEmail)) {
      setAuthError(TRANSLATIONS[langRef.current].authErrorInvalidEmailHint);
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const provider = createGoogleProvider(trimmedEmail);
      await signInWithRedirect(auth, provider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      setAuthError(`${TRANSLATIONS[langRef.current].authErrorGeneric}${code ? ` (${code})` : ''}`);
      setAuthLoading(false);
    }
  }, []);

  const handleSignOutGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    setShowRedirectFallback(false);
    try {
      await signOut(auth);
      cloudSyncedUidRef.current = null;
      setAccountSyncStatus('idle');
      setAccountSyncError(null);
      setOwnerMenuOpen(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAddFriend = useCallback((friend: FriendRecord) => {
    setFriends((prev) => {
      if (prev.some((f) => f.friendUid === friend.friendUid)) return prev;
      return [...prev, friend];
    });
    const isRealCloudFriend =
      Boolean(friend.friendUid) &&
      !friend.friendUid.startsWith('code_') &&
      /^RK[0-9A-Z]{6}$/.test(normalizePlayerCode(friend.playerCode));

    if (firebaseUserRef.current && isRealCloudFriend) {
      void addCloudFriend(firebaseUserRef.current.uid, friend).catch((err) =>
        console.error('Add cloud friend failed:', err)
      );
    }
    soundFX.playEatCell();
  }, []);

  const handleRemoveFriend = useCallback((friendUid: string) => {
    setFriends((prev) => prev.filter((f) => f.friendUid !== friendUid));
    if (firebaseUserRef.current && friendUid && !friendUid.startsWith('code_')) {
      void removeCloudFriend(firebaseUserRef.current.uid, friendUid).catch((err) =>
        console.error('Remove cloud friend failed:', err)
      );
    }
  }, []);

  const handleJoinFriendRoom = useCallback(
    (roomId: string) => {
      const targetRoom = roomId.trim() || 'global';
      const nextConfig: GameConfig = {
        ...configRef.current,
        playType: 'online',
        roomId: targetRoom,
        nickname:
          configRef.current.nickname.trim() ||
          firebaseUserRef.current?.displayName ||
          TRANSLATIONS[langRef.current].defaultPlayerName,
      };
      setConfig((prev) => ({ ...prev, playType: 'online', roomId: targetRoom }));
      setAccountOpen(false);
      const hasStartBoost = profileRef.current.boosts.startMassBoost > 0;
      startOnlineGame(nextConfig, hasStartBoost);
    },
    [startOnlineGame]
  );

  // Exclusive Owner Admin Actions
  const handleRefreshAdminPlayers = useCallback(async () => {
    const user = firebaseUserRef.current;
    if (!isVerifiedOwnerUser(user) || !user) return;
    setLoadingAdminPlayers(true);
    try {
      const token = await user.getIdToken();
      const [liveRes, cloudList] = await Promise.all([
        fetch('/api/admin/players', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) =>
            r.ok ? r.json() : { players: [], banned: [], announcement: null }
          )
          .catch(() => ({ players: [], banned: [], announcement: null })),
        adminFetchAllCloudPlayers().catch(() => []),
      ]);
      if (Array.isArray(liveRes.players)) {
        setLivePlayers(liveRes.players);
      }
      if (Array.isArray(liveRes.banned)) {
        setBannedPlayers(liveRes.banned);
      }
      if ('announcement' in liveRes) {
        setAnnouncement((liveRes.announcement as OwnerAnnouncement | null) ?? null);
      }
      setCloudPlayers(cloudList);
    } finally {
      setLoadingAdminPlayers(false);
    }
  }, []);

  const handleOpenOwnerMenu = useCallback(() => {
    if (!isVerifiedOwnerUser(firebaseUserRef.current)) return;
    resetActiveTouches();
    setOwnerMenuOpen(true);
    void handleRefreshAdminPlayers();
  }, [resetActiveTouches, handleRefreshAdminPlayers]);

  const handleAdminAddSelfCurrency = useCallback((coins: number, dna: number) => {
    if (!isVerifiedOwnerUser(firebaseUserRef.current)) return;
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + Math.max(0, Math.round(coins)),
      dna: prev.dna + Math.max(0, Math.round(dna)),
    }));
    soundFX.playEatCell();
  }, []);

  const handleAdminAddSelfXp = useCallback((xpAmount: number) => {
    if (!isVerifiedOwnerUser(firebaseUserRef.current)) return;
    const safeXp = Math.max(1, Math.round(xpAmount));
    setProfile((prev) => applyXpGain(prev, safeXp).nextProfile);
    soundFX.playEatCell();
  }, []);

  const handleAdminUnlockAllSkins = useCallback(() => {
    if (!isVerifiedOwnerUser(firebaseUserRef.current)) return;
    const allSkinIds = SKINS.map((s) => s.id);
    const maxVipLevels: Partial<Record<SkinId, SkinLevel>> = {};
    for (const s of SKINS) {
      if (s.isVip) maxVipLevels[s.id] = 3;
    }
    setProfile((prev) => ({
      ...prev,
      unlockedSkins: Array.from(new Set([...prev.unlockedSkins, ...allSkinIds])),
      skinLevels: { ...prev.skinLevels, ...maxVipLevels },
    }));
    soundFX.playEatCell();
  }, []);

  const handleAdminRefillBoosts = useCallback(() => {
    if (!isVerifiedOwnerUser(firebaseUserRef.current)) return;
    setProfile((prev) => ({
      ...prev,
      boosts: {
        levelBoost2x: prev.boosts.levelBoost2x + 10,
        levelBoost3x: prev.boosts.levelBoost3x + 10,
        coinBoost2x: prev.boosts.coinBoost2x + 10,
        startMassBoost: prev.boosts.startMassBoost + 10,
      },
    }));
    soundFX.playEatCell();
  }, []);

  const handleAdminChangePowers = useCallback(async (next: OwnerPowers) => {
    const user = firebaseUserRef.current;
    if (!isVerifiedOwnerUser(user) || !user) return;
    setOwnerPowers(next);
    ownerPowersRef.current = next;
    engineRef.current?.setOwnerPowers(next);

    if (engineRef.current?.isNetworkMode) {
      try {
        const token = await user.getIdToken();
        await fetch('/api/admin/powers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connectionId: connectionIdRef.current,
            powers: next,
          }),
        });
      } catch {
        // Ignore transient network errors
      }
    }
  }, []);

  const handleAdminInstantMerge = useCallback(async (): Promise<boolean> => {
    const user = firebaseUserRef.current;
    if (!isVerifiedOwnerUser(user) || !user) return false;
    const engine = engineRef.current;
    if (!engine) return false;
    if (!engine.isNetworkMode) {
      const ok = engine.instantMergePlayer();
      if (ok) soundFX.playEatCell();
      return ok;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/powers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId: connectionIdRef.current,
          instantMerge: true,
        }),
      });
      if (res.ok) soundFX.playEatCell();
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const handleAdminBoostMass = useCallback(async (amount: number): Promise<boolean> => {
    const user = firebaseUserRef.current;
    if (!isVerifiedOwnerUser(user) || !user) return false;
    const engine = engineRef.current;
    if (!engine) return false;
    if (phaseRef.current !== 'PLAYING' && phaseRef.current !== 'PAUSED') return false;

    if (!engine.isNetworkMode) {
      engine.addPlayerMass(amount);
      setHud(engine.getHudSnapshot());
      soundFX.playEatCell();
      return true;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/boost-mass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionId: connectionIdRef.current,
          amount,
        }),
      });
      if (res.ok) {
        soundFX.playEatCell();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const handleAdminArenaAction = useCallback(
    async (
      action:
        | 'golden_rain'
        | 'spawn_bots'
        | 'reset_bots'
        | 'set_mode'
        | 'broadcast'
        | 'clear_broadcast',
      payload?: { mode?: GameMode; text?: string }
    ): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      const engine = engineRef.current;

      if (
        action !== 'broadcast' &&
        action !== 'clear_broadcast' &&
        engine &&
        !engine.isNetworkMode
      ) {
        if (action === 'golden_rain') {
          engine.spawnGoldenFoodRain(40);
          soundFX.playEatCell();
          return true;
        }
        if (action === 'spawn_bots') {
          engine.spawnExtraBots(5);
          return true;
        }
        if (action === 'reset_bots') {
          engine.resetArenaBots();
          return true;
        }
        if (action === 'set_mode' && payload?.mode) {
          const m = payload.mode;
          setConfig((prev) => ({ ...prev, mode: m }));
          return true;
        }
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/arena', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            connectionId: connectionIdRef.current,
            mode: payload?.mode,
            text: payload?.text,
          }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as {
          announcement?: OwnerAnnouncement | null;
          mode?: GameMode;
        };
        if (action === 'broadcast' || action === 'clear_broadcast') {
          setAnnouncement(data.announcement ?? null);
        }
        if (action === 'set_mode' && data.mode) {
          setConfig((prev) => ({ ...prev, mode: data.mode! }));
        }
        soundFX.playEatCell();
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const handleAdminKickPlayer = useCallback(
    async (target: { connectionId?: string; playerCode?: string }): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/kick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(target),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  const handleAdminModeratePlayer = useCallback(
    async (
      action: 'ban' | 'unban' | 'halve_mass' | 'pull_to_me',
      target: { connectionId?: string; uid?: string; playerCode?: string; name?: string }
    ): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/moderate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            ...target,
            ownerConnectionId: connectionIdRef.current,
          }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { banned?: BannedPlayerRecord[] };
        if (Array.isArray(data.banned)) {
          setBannedPlayers(data.banned);
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const handleAdminGrantPlayer = useCallback(
    async (target: {
      connectionId?: string;
      uid?: string;
      playerCode?: string;
      coins: number;
      dna: number;
    }): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/grant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(target),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { deliveredLive?: number };
        if (
          (!data.deliveredLive || data.deliveredLive === 0) &&
          target.uid &&
          !target.uid.startsWith('code_')
        ) {
          await adminCreateCloudGrant(
            user.uid,
            target.uid,
            target.playerCode || '',
            target.coins,
            target.dna
          );
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const handleAdminGrantLiveMass = useCallback(
    async (connectionId: string, amount: number): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/grant-mass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ connectionId, amount }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  const handleAdminGrantAllOnline = useCallback(
    async (coins: number, dna: number): Promise<boolean> => {
      const user = firebaseUserRef.current;
      if (!isVerifiedOwnerUser(user) || !user) return false;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/grant-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coins, dna }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  const passClaimableCount = countClaimablePassItems(passState);
  const eventBadgeCount = countAffordableMazeMoves(mazeEvent);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className="block h-full w-full touch-none cursor-crosshair select-none"
      />

      {/* Floating Touch Joystick Visual (when steering via open canvas) */}
      {phase === 'PLAYING' && !customizerOpen && touchStick && (
        <div className="pointer-events-none fixed inset-0 z-10" aria-hidden="true">
          <div
            style={{
              left: touchStick.startX,
              top: touchStick.startY,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute h-24 w-24 rounded-full border border-sky-500/45 bg-white/20 backdrop-blur-[2px] dark:bg-slate-900/25"
          />
          <div
            style={{
              left: touchStick.curX,
              top: touchStick.curY,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute h-10 w-10 rounded-full bg-sky-500/55 shadow-md ring-2 ring-white/70 dark:ring-slate-900/70"
          />
        </div>
      )}

      {phase === 'PLAYING' && !customizerOpen && (
        <GameHUD
          hud={hud}
          bestRank={sessionBestRank}
          t={t}
          playType={config.playType}
          muted={muted}
          zoomMultiplier={zoomMultiplier}
          currentFps={currentFps}
          targetFps={config.targetFps}
          showFpsCounter={config.showFpsCounter}
          onCycleFps={handleCycleFps}
          controlLayout={controlLayout}
          joystickPadDelta={joystickPadDelta}
          onJoystickPointerDown={handleJoystickPointerDown}
          onJoystickPointerMove={handleJoystickPointerMove}
          onJoystickPointerUp={handleJoystickPointerUp}
          onChangeZoom={handleChangeZoom}
          onToggleMute={handleToggleMute}
          onPause={() => {
            resetActiveTouches();
            setPhase('PAUSED');
          }}
          onOpenCustomizer={handleOpenCustomizer}
          isOwner={isOwner}
          onOpenOwnerMenu={handleOpenOwnerMenu}
          announcement={announcement}
          onDismissAnnouncement={() => setAnnouncement(null)}
          onSplit={triggerSplit}
          onEjectStart={() => {
            triggerEject();
            wHeldRef.current = true;
            syncOnlineEjectHold();
          }}
          onEjectEnd={() => {
            wHeldRef.current = false;
            syncOnlineEjectHold();
          }}
          onFastEjectStart={() => {
            triggerFastEject();
            fastEjectHeldRef.current = true;
            syncOnlineEjectHold();
          }}
          onFastEjectEnd={() => {
            fastEjectHeldRef.current = false;
            syncOnlineEjectHold();
          }}
        />
      )}

      {!customizerOpen && (
        <MenuOverlay
          phase={phase}
          config={config}
          profile={profile}
          lang={lang}
          t={t}
          bestMass={bestMass}
          isNewRecord={isNewRecord}
          lastSummary={lastSummary}
          lastRewards={lastRewards}
          lastTokensEarned={lastTokensEarned}
          rooms={rooms}
          serverStatus={serverStatus}
          connecting={connecting}
          connectionError={connectionError}
          onReconnectServer={handleReconnectServer}
          onCancelConnect={handleCancelOnlineConnect}
          passClaimableCount={passClaimableCount}
          eventBadgeCount={eventBadgeCount}
          playerCode={playerCode}
          isOwner={isOwner}
          firebaseUser={firebaseUser}
          authLoading={authLoading}
          authError={authError}
          showRedirectFallback={showRedirectFallback}
          accountSyncStatus={accountSyncStatus}
          accountSyncError={accountSyncError}
          onSignInGoogle={(emailHint) => void handleSignInGoogle(emailHint)}
          onSignInGoogleRedirect={(emailHint) => void handleSignInGoogleRedirect(emailHint)}
          onSignOut={() => void handleSignOutGoogle()}
          onClearAuthError={() => {
            setAuthError(null);
            setShowRedirectFallback(false);
          }}
          onRetryAccountSync={() => {
            if (firebaseUser) void syncCloudAccountForUser(firebaseUser);
          }}
          kickedNotice={kickedNotice}
          onDismissKickedNotice={() => setKickedNotice(null)}
          grantNotice={grantNotice}
          onDismissGrantNotice={() => setGrantNotice(null)}
          announcement={announcement}
          onDismissAnnouncement={() => setAnnouncement(null)}
          onChangeConfig={handleChangeConfig}
          onToggleLanguage={handleToggleLanguage}
          onOpenShop={handleOpenShop}
          onOpenGamePass={() => setGamePassOpen(true)}
          onOpenEvent={() => setEventOpen(true)}
          onOpenCustomizer={handleOpenCustomizer}
          onOpenAccount={handleOpenAccount}
          onOpenWorldTop={() => {
            setWorldTopOpen(true);
            void refreshWeeklyTop();
          }}
          onOpenOwnerMenu={handleOpenOwnerMenu}
          onStartGame={handleStartGame}
          onResumeGame={handleResume}
          onBackToMenu={handleBackToMenu}
        />
      )}

      <ControlCustomizer
        open={customizerOpen}
        layout={controlLayout}
        t={t}
        onChangeLayout={setControlLayout}
        onClose={() => setCustomizerOpen(false)}
      />

      <ShopModal
        open={shopOpen}
        initialTab={shopInitialTab}
        onClose={() => setShopOpen(false)}
        profile={profile}
        equippedSkin={config.skinId}
        lang={lang}
        t={t}
        onBuySkin={handleBuySkin}
        onUpgradeSkin={handleUpgradeSkin}
        onEquipSkin={handleEquipSkin}
        onBuyBoost={handleBuyBoost}
        onOpenGamePass={() => setGamePassOpen(true)}
        onOpenEvent={() => setEventOpen(true)}
      />

      <GamePassModal
        open={gamePassOpen}
        onClose={() => setGamePassOpen(false)}
        passState={passState}
        lang={lang}
        t={t}
        onActivatePlusFree={handleActivatePlusFree}
        onClaimReward={handleClaimPassReward}
        onClaimAll={handleClaimAllPassRewards}
        onClaimChallenge={handleClaimChallenge}
      />

      <MazeEventModal
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        eventState={mazeEvent}
        equippedSkin={config.skinId}
        lang={lang}
        t={t}
        onSelectNode={handleSelectMazeNode}
        onClaimDailyTokens={handleClaimDailyTokens}
      />

      <AccountFriendsModal
        open={accountOpen}
        initialTab={accountTab}
        onClose={() => setAccountOpen(false)}
        firebaseUser={firebaseUser}
        authLoading={authLoading}
        authError={authError}
        showRedirectFallback={showRedirectFallback}
        accountSyncStatus={accountSyncStatus}
        accountSyncError={accountSyncError}
        playerCode={playerCode}
        friends={friends}
        config={config}
        profile={profile}
        bestMass={bestMass}
        lang={lang}
        t={t}
        onSignInGoogle={(emailHint) => void handleSignInGoogle(emailHint)}
        onSignInGoogleRedirect={(emailHint) => void handleSignInGoogleRedirect(emailHint)}
        onSignOut={() => void handleSignOutGoogle()}
        onClearAuthError={() => {
          setAuthError(null);
          setShowRedirectFallback(false);
        }}
        onRetryAccountSync={() => {
          if (firebaseUser) void syncCloudAccountForUser(firebaseUser);
        }}
        onAddFriend={handleAddFriend}
        onRemoveFriend={handleRemoveFriend}
        onJoinFriendRoom={handleJoinFriendRoom}
      />

      {isOwner && (
        <OwnerMenuModal
          open={ownerMenuOpen}
          onClose={() => setOwnerMenuOpen(false)}
          livePlayers={livePlayers}
          cloudPlayers={cloudPlayers}
          bannedPlayers={bannedPlayers}
          activeAnnouncement={announcement}
          ownerPowers={ownerPowers}
          currentMode={config.mode}
          loadingPlayers={loadingAdminPlayers}
          inMatch={phase === 'PLAYING' || phase === 'PAUSED'}
          isOnlineMatch={Boolean(engineRef.current?.isNetworkMode)}
          t={t}
          onRefreshPlayers={() => void handleRefreshAdminPlayers()}
          onAddSelfCurrency={handleAdminAddSelfCurrency}
          onAddSelfXp={handleAdminAddSelfXp}
          onUnlockAllSkins={handleAdminUnlockAllSkins}
          onRefillAllBoosts={handleAdminRefillBoosts}
          onChangeOwnerPowers={handleAdminChangePowers}
          onInstantMerge={handleAdminInstantMerge}
          onBoostMyMass={handleAdminBoostMass}
          onArenaAction={handleAdminArenaAction}
          onKickPlayer={handleAdminKickPlayer}
          onModeratePlayer={handleAdminModeratePlayer}
          onGrantPlayerCurrency={handleAdminGrantPlayer}
          onGrantLiveMass={handleAdminGrantLiveMass}
          onGrantAllOnline={handleAdminGrantAllOnline}
        />
      )}

      <WorldTopModal
        open={worldTopOpen}
        onClose={() => setWorldTopOpen(false)}
        entries={weeklyEntries}
        loading={loadingWeeklyTop}
        firebaseUser={firebaseUser}
        authLoading={authLoading}
        authError={authError}
        showRedirectFallback={showRedirectFallback}
        t={t}
        onRefresh={() => void refreshWeeklyTop()}
        onSignInGoogle={() => void handleSignInGoogle()}
        onSignInGoogleRedirect={() => void handleSignInGoogleRedirect()}
        onClearAuthError={() => {
          setAuthError(null);
          setShowRedirectFallback(false);
        }}
      />
    </main>
  );
}
