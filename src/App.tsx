import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { AccountFriendsModal } from './components/AccountFriendsModal';
import { ControlCustomizer } from './components/ControlCustomizer';
import { GameHUD } from './components/GameHUD';
import { GamePassModal } from './components/GamePassModal';
import { MazeEventModal } from './components/MazeEventModal';
import { MenuOverlay } from './components/MenuOverlay';
import { OwnerMenuModal } from './components/OwnerMenuModal';
import { ShopModal } from './components/ShopModal';
import { WorldTopModal } from './components/WorldTopModal';
import { auth, isVerifiedOwnerUser } from './firebase';
import {
  addCloudFriend,
  adminCreateCloudGrant,
  adminFetchAllCloudPlayers,
  claimPendingCloudGrants,
  clearLocalWeeklyPending,
  ensureCloudAccount,
  fetchCloudFriends,
  fetchWeeklyTopEntries,
  getOrCreateLocalPlayerCode,
  loadLocalFriends,
  loadLocalWeeklyPending,
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
import { SKIN_MAP } from './game/skins';
import { soundFX } from './game/sound';
import {
  AccountModalTab,
  BoostId,
  ControlLayout,
  FriendRecord,
  GameConfig,
  GamePassState,
  GamePhase,
  HudSnapshot,
  Language,
  LiveServerPlayer,
  MatchRewardSummary,
  MazeEventState,
  NetStatePayload,
  PassTrack,
  PlayerProfile,
  PublicPlayerProfile,
  RoomSummary,
  ShopTab,
  SkinId,
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
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [playerCode, setPlayerCode] = useState<string>(getOrCreateLocalPlayerCode);
  const [friends, setFriends] = useState<FriendRecord[]>(loadLocalFriends);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<AccountModalTab>('account');
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [livePlayers, setLivePlayers] = useState<LiveServerPlayer[]>([]);
  const [cloudPlayers, setCloudPlayers] = useState<PublicPlayerProfile[]>([]);
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
  const connectionIdRef = useRef<string>('');
  const pendingJoinRef = useRef<{ effectiveConfig: GameConfig; startMassBonus: number } | null>(null);
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
  const sessionBestRankRef = useRef<number>(0);
  const targetFpsRef = useRef<TargetFps>(config.targetFps);
  const wHeldRef = useRef(false);
  const fastEjectHeldRef = useRef(false);
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
  targetFpsRef.current = config.targetFps;

  const t = TRANSLATIONS[lang];

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
    stickRef.current = null;
    padPointerIdRef.current = null;
    canvasPointersRef.current.clear();
    pinchDistRef.current = null;
    setTouchStick(null);
    setJoystickPadDelta(null);
  }, []);

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

  // Firebase Authentication & Cloud Account / Friends / Pending Grants Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setOwnerMenuOpen(false);
        return;
      }

      try {
        const res = await ensureCloudAccount(user, {
          displayName:
            configRef.current.nickname.trim() ||
            user.displayName ||
            TRANSLATIONS[langRef.current].defaultPlayerName,
          skinId: configRef.current.skinId,
          profile: profileRef.current,
          bestMass: bestMassRef.current,
          currentRoom:
            configRef.current.playType === 'online' ? configRef.current.roomId : 'solo',
          online: true,
        });

        setPlayerCode(res.publicProfile.playerCode);

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

        setProfile((prev) => ({
          ...prev,
          coins: Math.max(prev.coins, res.publicProfile.coins) + pendingGrants.coins,
          dna: Math.max(prev.dna, res.publicProfile.dna) + pendingGrants.dna,
          level: Math.max(prev.level, res.publicProfile.level),
          score: Math.max(prev.score, res.publicProfile.score),
          xp: Math.max(prev.xp, res.mergedXp),
          unlockedSkins: Array.from(
            new Set([...prev.unlockedSkins, ...res.mergedUnlockedSkins])
          ),
        }));

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
      } catch (err) {
        console.error('Account sync error:', err);
      }
    });

    return () => unsubscribe();
  }, [refreshWeeklyTop]);

  // Debounced cloud profile sync while signed in
  useEffect(() => {
    if (!firebaseUser) return;
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
      }).catch((err) => console.error('Cloud profile sync warning:', err));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [firebaseUser, playerCode, config.nickname, config.skinId, config.playType, config.roomId, profile, bestMass, lang]);

  // Poll available online rooms while on Menu
  useEffect(() => {
    if (phase !== 'MENU') return;
    let cancelled = false;

    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) return;
        const data = (await res.json()) as { rooms?: RoomSummary[] };
        if (!cancelled && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        }
      } catch {
        // Ignore transient fetch errors
      }
    };

    fetchRooms();
    const timer = window.setInterval(fetchRooms, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [phase]);

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

      if (firebaseUserRef.current) {
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
          .catch((err) => console.error('Weekly score upload warning:', err));
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
          if (fastEjectHeldRef.current && now - lastFastEjectTime >= (engine.isNetworkMode ? 26 : 16)) {
            const canSound = now - lastFastSoundTime >= 65;
            if (engine.isNetworkMode) {
              const ws = wsRef.current;
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'eject', count: 2 }));
                if (canSound) {
                  soundFX.playEject();
                  lastFastSoundTime = now;
                }
              }
            } else {
              engine.ejectPlayerMass(2, canSound);
              if (canSound) lastFastSoundTime = now;
            }
            lastFastEjectTime = now;
          } else if (wHeldRef.current && now - lastEjectTime > 125) {
            if (engine.isNetworkMode) {
              const ws = wsRef.current;
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'eject', count: 1 }));
                soundFX.playEject();
              }
            } else {
              engine.ejectPlayerMass(1, true);
            }
            lastEjectTime = now;
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

  // Persistent Presence + Gameplay WebSocket Connection
  const connectPresenceSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
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
            mode: pending.effectiveConfig.mode,
            startMassBonus: pending.startMassBonus,
            uid: firebaseUserRef.current?.uid || '',
            playerCode: playerCodeRef.current,
            level: profileRef.current.level,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (msg.type === 'welcome') {
        connectionIdRef.current = typeof msg.connectionId === 'string' ? msg.connectionId : '';
        sendPresenceUpdate(ws);
      } else if (msg.type === 'joined') {
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
        handlePlayerDeath(summary);
      } else if (msg.type === 'kicked') {
        resetActiveTouches();
        pendingJoinRef.current = null;
        engineRef.current?.setNetworkMode(false);
        setConnecting(false);
        setCustomizerOpen(false);
        setKickedNotice(TRANSLATIONS[langRef.current].kickedNotice);
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
      if (pendingJoinRef.current) {
        setConnecting(false);
        setConnectionError(TRANSLATIONS[langRef.current].connectionLostText);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
        connectionIdRef.current = '';
        setConnecting(false);
        if (engineRef.current?.isNetworkMode && (phaseRef.current === 'PLAYING' || phaseRef.current === 'PAUSED')) {
          engineRef.current.setNetworkMode(false);
          setConnectionError(TRANSLATIONS[langRef.current].connectionLostText);
          setPhase('MENU');
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePlayerDeath, resetActiveTouches, sendPresenceUpdate]);

  useEffect(() => {
    connectPresenceSocket();
    const reconnectTimer = window.setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connectPresenceSocket();
      }
    }, 3000);

    return () => {
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
  }, [connectPresenceSocket]);

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
        } else if (e.code === 'KeyE') {
          e.preventDefault();
          if (!e.repeat) {
            triggerFastEject();
          }
          fastEjectHeldRef.current = true;
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
      } else if (e.code === 'KeyE') {
        fastEjectHeldRef.current = false;
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
  }, [triggerSplit, triggerEject, triggerFastEject, resetActiveTouches]);

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

  const consumeStartMassBonus = useCallback((): number => {
    if (profileRef.current.boosts.startMassBoost <= 0) return 0;
    setProfile((prev) => ({
      ...prev,
      boosts: {
        ...prev.boosts,
        startMassBoost: Math.max(0, prev.boosts.startMassBoost - 1),
      },
    }));
    return 20;
  }, []);

  const startOnlineGame = useCallback(
    (effectiveConfig: GameConfig, startMassBonus: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      setConnecting(true);
      setConnectionError(null);
      setKickedNotice(null);

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
            mode: effectiveConfig.mode,
            startMassBonus,
            uid: firebaseUserRef.current?.uid || '',
            playerCode: playerCodeRef.current,
            level: profileRef.current.level,
          })
        );
      } else {
        pendingJoinRef.current = { effectiveConfig, startMassBonus };
        connectPresenceSocket();
      }
    },
    [connectPresenceSocket]
  );

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

    const bonusMass = consumeStartMassBonus();

    if (effectiveConfig.playType === 'online') {
      startOnlineGame(effectiveConfig, bonusMass);
      return;
    }

    leaveOnlineMatch();
    engine.setNetworkMode(false);
    engine.spawnPlayer(effectiveConfig, bonusMass);
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
    consumeStartMassBonus,
    startOnlineGame,
    leaveOnlineMatch,
    resetActiveTouches,
    updateHudSnapshot,
  ]);

  const handleResume = useCallback(() => {
    setPhase('PLAYING');
  }, []);

  const handleBackToMenu = useCallback(() => {
    resetActiveTouches();
    leaveOnlineMatch();
    engineRef.current?.setNetworkMode(false);
    sessionBestRankRef.current = 0;
    setSessionBestRank(0);
    setConnecting(false);
    setPhase('MENU');
  }, [leaveOnlineMatch, resetActiveTouches]);

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
    setAuthLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const trimmedEmail = emailHint?.trim();
      if (trimmedEmail) {
        provider.setCustomParameters({
          prompt: 'select_account',
          login_hint: trimmedEmail,
        });
      } else {
        provider.setCustomParameters({ prompt: 'select_account' });
      }
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-blocked') {
        setAuthError(TRANSLATIONS[langRef.current].authErrorPopupBlocked);
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setAuthError(TRANSLATIONS[langRef.current].authErrorGeneric);
      }
      console.error('Google Sign-In failed:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleSignOutGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setOwnerMenuOpen(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAddFriend = useCallback(
    (friend: FriendRecord) => {
      setFriends((prev) => {
        if (prev.some((f) => f.friendUid === friend.friendUid)) return prev;
        return [...prev, friend];
      });
      if (firebaseUserRef.current) {
        void addCloudFriend(firebaseUserRef.current.uid, friend).catch((err) =>
          console.error('Add cloud friend failed:', err)
        );
      }
      soundFX.playEatCell();
    },
    []
  );

  const handleRemoveFriend = useCallback((friendUid: string) => {
    setFriends((prev) => prev.filter((f) => f.friendUid !== friendUid));
    if (firebaseUserRef.current) {
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
      const bonusMass = consumeStartMassBonus();
      startOnlineGame(nextConfig, bonusMass);
    },
    [consumeStartMassBonus, startOnlineGame]
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
          .then((r) => (r.ok ? r.json() : { players: [] }))
          .catch(() => ({ players: [] })),
        adminFetchAllCloudPlayers().catch(() => []),
      ]);
      if (Array.isArray(liveRes.players)) {
        setLivePlayers(liveRes.players);
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
          onSplit={triggerSplit}
          onEjectStart={() => {
            triggerEject();
            wHeldRef.current = true;
          }}
          onEjectEnd={() => {
            wHeldRef.current = false;
          }}
          onFastEjectStart={() => {
            triggerFastEject();
            fastEjectHeldRef.current = true;
          }}
          onFastEjectEnd={() => {
            fastEjectHeldRef.current = false;
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
          connecting={connecting}
          connectionError={connectionError}
          passClaimableCount={passClaimableCount}
          eventBadgeCount={eventBadgeCount}
          playerCode={playerCode}
          isOwner={isOwner}
          firebaseUser={firebaseUser}
          authLoading={authLoading}
          authError={authError}
          onSignInGoogle={(emailHint) => void handleSignInGoogle(emailHint)}
          onSignOut={() => void handleSignOutGoogle()}
          onClearAuthError={() => setAuthError(null)}
          kickedNotice={kickedNotice}
          onDismissKickedNotice={() => setKickedNotice(null)}
          grantNotice={grantNotice}
          onDismissGrantNotice={() => setGrantNotice(null)}
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
        playerCode={playerCode}
        friends={friends}
        config={config}
        profile={profile}
        bestMass={bestMass}
        lang={lang}
        t={t}
        onSignInGoogle={(emailHint) => void handleSignInGoogle(emailHint)}
        onSignOut={() => void handleSignOutGoogle()}
        onClearAuthError={() => setAuthError(null)}
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
          loadingPlayers={loadingAdminPlayers}
          inMatch={phase === 'PLAYING' || phase === 'PAUSED'}
          t={t}
          onRefreshPlayers={() => void handleRefreshAdminPlayers()}
          onAddSelfCurrency={handleAdminAddSelfCurrency}
          onBoostMyMass={handleAdminBoostMass}
          onKickPlayer={handleAdminKickPlayer}
          onGrantPlayerCurrency={handleAdminGrantPlayer}
        />
      )}

      <WorldTopModal
        open={worldTopOpen}
        onClose={() => setWorldTopOpen(false)}
        entries={weeklyEntries}
        loading={loadingWeeklyTop}
        firebaseUser={firebaseUser}
        authLoading={authLoading}
        t={t}
        onRefresh={() => void refreshWeeklyTop()}
        onSignInGoogle={() => void handleSignInGoogle()}
      />
    </main>
  );
}
