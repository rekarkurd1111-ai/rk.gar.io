import { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Play,
  RotateCcw,
  Sun,
  Moon,
  Trophy,
  Globe,
  Users,
  User,
  ShoppingBag,
  Coins,
  Dna,
  Zap,
  Award,
  SlidersHorizontal,
  Crown,
  Compass,
  Plus,
  Sparkles,
  Layers,
  X,
  ShieldCheck,
  UserPlus,
  Settings,
  LogIn,
  LogOut,
  Mail,
  Gauge,
} from 'lucide-react';
import { formatPlayerCodeDisplay } from '../game/accountService';
import { Translations } from '../game/i18n';
import { xpRequiredForLevel } from '../game/progression';
import { SKINS } from '../game/skins';
import {
  AccountModalTab,
  ArenaTheme,
  GameConfig,
  GameMode,
  GamePhase,
  HudSnapshot,
  Language,
  MatchRewardSummary,
  PlayerProfile,
  PlayType,
  RoomSummary,
  ShopTab,
  TargetFps,
} from '../game/types';
import { SkinPreview } from './SkinPreview';

interface MenuOverlayProps {
  phase: GamePhase;
  config: GameConfig;
  profile: PlayerProfile;
  lang: Language;
  t: Translations;
  bestMass: number;
  isNewRecord: boolean;
  lastSummary: HudSnapshot | null;
  lastRewards: MatchRewardSummary | null;
  lastTokensEarned?: number;
  rooms: RoomSummary[];
  connecting: boolean;
  connectionError: string | null;
  passClaimableCount: number;
  eventBadgeCount: number;
  playerCode: string;
  isOwner: boolean;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  authError: string | null;
  onSignInGoogle: (emailHint?: string) => void;
  onSignOut: () => void;
  onClearAuthError: () => void;
  kickedNotice: string | null;
  onDismissKickedNotice: () => void;
  grantNotice: string | null;
  onDismissGrantNotice: () => void;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
  onToggleLanguage: () => void;
  onOpenShop: (tab?: ShopTab) => void;
  onOpenGamePass: () => void;
  onOpenEvent: () => void;
  onOpenCustomizer: () => void;
  onOpenAccount: (tab?: AccountModalTab) => void;
  onOpenWorldTop: () => void;
  onOpenOwnerMenu: () => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onBackToMenu: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MenuOverlay({
  phase,
  config,
  profile,
  lang,
  t,
  bestMass,
  isNewRecord,
  lastSummary,
  lastRewards,
  lastTokensEarned = 0,
  rooms,
  connecting,
  connectionError,
  passClaimableCount,
  eventBadgeCount,
  playerCode,
  isOwner,
  firebaseUser,
  authLoading,
  authError,
  onSignInGoogle,
  onSignOut,
  onClearAuthError,
  kickedNotice,
  onDismissKickedNotice,
  grantNotice,
  onDismissGrantNotice,
  onChangeConfig,
  onToggleLanguage,
  onOpenShop,
  onOpenGamePass,
  onOpenEvent,
  onOpenCustomizer,
  onOpenAccount,
  onOpenWorldTop,
  onOpenOwnerMenu,
  onStartGame,
  onResumeGame,
  onBackToMenu,
}: MenuOverlayProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsEmailInput, setSettingsEmailInput] = useState('');

  if (phase === 'PLAYING') return null;

  const neededXp = xpRequiredForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / neededXp) * 100));

  if (phase === 'PAUSED') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4">
        <div className="animate-modal-enter max-h-[92dvh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border border-white/65 bg-white/92 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/92 sm:p-6 [@media(max-height:520px)]:p-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white [@media(max-height:520px)]:text-xl">
            {t.pausedTitle}
          </h2>

          <div className="mt-5 flex flex-col gap-2.5 [@media(max-height:520px)]:mt-3 [@media(max-height:520px)]:gap-2">
            <button
              type="button"
              onClick={onResumeGame}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition-all duration-150 hover:bg-sky-700 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-sky-500 whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{t.resumeGame}</span>
            </button>
            <button
              type="button"
              onClick={onStartGame}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.restartGame}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>{t.customizeControlsBtn}</span>
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white whitespace-nowrap"
            >
              {t.backToMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'GAME_OVER' && lastSummary) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/48 p-3 backdrop-blur-sm sm:p-4">
        <div className="animate-modal-enter max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain touch-pan-y rounded-3xl border border-white/65 bg-white/92 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/92 sm:p-6 [@media(max-height:520px)]:max-w-lg [@media(max-height:520px)]:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.gameOverTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {lastSummary.killerName
                  ? `${t.eatenBy} ${lastSummary.killerName}`
                  : t.survivedText}
              </p>
            </div>
            {isNewRecord && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Trophy className="h-4 w-4" />
                <span>{t.newRecord}</span>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.peakMass}</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {lastSummary.peakMass}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.eaten}</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {lastSummary.cellsEaten}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.timeAlive}</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {formatDuration(lastSummary.elapsedSeconds)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/70">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t.bestScore}</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-sky-600 dark:text-sky-400">
                {bestMass}
              </div>
            </div>
          </div>

          {/* Match Rewards: Score, Coins, DNA, Event Tokens, and Level Progress */}
          {lastRewards && (
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>{t.rewardsEarnedTitle}</span>
                {lastRewards.leveledUp && (
                  <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                    <Award className="h-3.5 w-3.5" />
                    {t.leveledUpLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3.5 text-xs">
                <div className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                  <span className="font-mono-num">+{lastRewards.scoreGained}</span>
                  <span>{t.score}</span>
                  {lastRewards.boostMultiplier > 1 && (
                    <span className="font-mono-num">({lastRewards.boostMultiplier}x)</span>
                  )}
                </div>
                <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="font-mono-num">+{lastRewards.coinsEarned}</span>
                  <span>{t.coinsLabel}</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <Dna className="h-3.5 w-3.5" />
                  <span className="font-mono-num">+{lastRewards.dnaEarned}</span>
                  <span>{t.dnaLabel}</span>
                </div>
                {lastTokensEarned > 0 && (
                  <div className="flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="font-mono-num">+{lastTokensEarned}</span>
                    <span>{t.earnedTokensLabel}</span>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {t.levelLabel} {profile.level}
                  </span>
                  <span className="font-mono-num text-slate-500 dark:text-slate-400">
                    {profile.xp}/{neededXp} XP
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={onStartGame}
              className="col-span-2 flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500 whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.playAgain}</span>
            </button>
            <button
              type="button"
              onClick={onOpenGamePass}
              className="relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-amber-400/70 bg-amber-500/15 px-3 py-2.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-500/25 dark:text-amber-300 whitespace-nowrap"
            >
              <Crown className="h-4 w-4" />
              <span>{t.gamePassBtn}</span>
              {passClaimableCount > 0 && (
                <span className="font-mono-num flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                  {passClaimableCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenEvent}
              className="relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-sky-400/70 bg-sky-500/15 px-3 py-2.5 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-500/25 dark:text-sky-300 whitespace-nowrap"
            >
              <Compass className="h-4 w-4" />
              <span>{t.eventBtn}</span>
              {eventBadgeCount > 0 && (
                <span className="font-mono-num flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {eventBadgeCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onOpenShop('skins')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
              <span>{t.shopBtn}</span>
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              {t.backToMenu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MENU PHASE — Airy Corner-Anchored Floating Lobby
  const modes: GameMode[] = ['classic', 'blitz', 'relaxed', 'merge'];
  const themes: { id: ArenaTheme; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: t.themeLight, icon: Sun },
    { id: 'dark', label: t.themeDark, icon: Moon },
  ];
  const playTypes: { id: PlayType; label: string; icon: typeof User }[] = [
    { id: 'online', label: t.playOnline, icon: Users },
    { id: 'solo', label: t.playSolo, icon: User },
  ];

  const presetRoomLabels: Record<string, string> = {
    global: t.globalRoomName,
    kurdistan: t.kurdistanRoomName,
    blitz: t.blitzRoomName,
    merge: t.mergeRoomName,
  };

  const fpsOptions: { value: TargetFps; desc: string; accent: string }[] = [
    { value: 30, desc: t.fps30Desc, accent: 'text-amber-600 dark:text-amber-400' },
    { value: 60, desc: t.fps60Desc, accent: 'text-sky-600 dark:text-sky-400' },
    { value: 120, desc: t.fps120Desc, accent: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const activeSkin = SKINS.find((s) => s.id === config.skinId);
  const currentRoomLabel =
    config.playType === 'online'
      ? presetRoomLabels[config.roomId] || config.roomId || t.globalRoomName
      : t.playSolo;
  const activeXpBoost =
    profile.boosts.levelBoost3x > 0
      ? `3x (${profile.boosts.levelBoost3x})`
      : profile.boosts.levelBoost2x > 0
      ? `2x (${profile.boosts.levelBoost2x})`
      : null;

  const dockSurface =
    'border border-white/70 bg-white/78 shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/65 dark:bg-slate-900/78 dark:shadow-[0_10px_32px_rgba(0,0,0,0.42)]';

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:p-5 [@media(max-height:520px)]:py-2">
        {/* TOP BAR: Coherent Frosted Navigation Dock (Left) + Unified Wallet Dock (Right) */}
        <div className="flex items-start justify-between gap-2">
          {/* Top-Left Cluster */}
          <div className="pointer-events-auto flex flex-col items-start gap-2">
            <div className={`flex flex-wrap items-center gap-1 rounded-2xl p-1 sm:gap-1.5 sm:p-1.5 [@media(max-height:520px)]:rounded-xl [@media(max-height:520px)]:p-1 ${dockSurface}`}>
              {/* Game Pass */}
              <button
                type="button"
                onClick={onOpenGamePass}
                className="relative flex h-11 min-w-[46px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-800 transition-colors hover:bg-amber-500/12 active:scale-[0.97] dark:text-slate-100 sm:h-12 sm:min-w-[54px] sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[40px]"
                title={t.gamePassBtn}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/18 text-amber-600 dark:text-amber-400 [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                  <Crown className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-bold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                  {t.gamePassBtn}
                </span>
                {passClaimableCount > 0 && (
                  <span className="font-mono-num absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow">
                    {passClaimableCount}
                  </span>
                )}
              </button>

              {/* Nexus Maze Event */}
              <button
                type="button"
                onClick={onOpenEvent}
                className="relative flex h-11 min-w-[46px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-800 transition-colors hover:bg-sky-500/12 active:scale-[0.97] dark:text-slate-100 sm:h-12 sm:min-w-[54px] sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[40px]"
                title={t.eventBtn}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/18 text-sky-600 dark:text-sky-400 [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                  <Compass className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-bold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                  {t.eventBtn}
                </span>
                {eventBadgeCount > 0 && (
                  <span className="font-mono-num absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow">
                    {eventBadgeCount}
                  </span>
                )}
              </button>

              {/* Weekly World Top */}
              <button
                type="button"
                onClick={onOpenWorldTop}
                className="flex h-11 min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-800 transition-colors hover:bg-amber-500/12 active:scale-[0.97] dark:text-slate-100 sm:h-12 sm:min-w-[58px] sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[42px]"
                title={t.worldTopTitle}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-xs [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                  <Trophy className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-extrabold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                  {t.worldTopBtn}
                </span>
              </button>

              {/* Friends */}
              <button
                type="button"
                onClick={() => onOpenAccount('friends')}
                className="flex h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-800 transition-colors hover:bg-indigo-500/12 active:scale-[0.97] dark:text-slate-100 sm:h-12 sm:min-w-[52px] sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[40px]"
                title={t.friendsBtn}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/18 text-indigo-600 dark:text-indigo-400 [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                  <UserPlus className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-bold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                  {t.friendsBtn}
                </span>
              </button>

              {/* Exclusive Owner Menu Tile (visible ONLY to verified owner) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={onOpenOwnerMenu}
                  className="flex h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-800 transition-colors hover:bg-amber-500/15 active:scale-[0.97] dark:text-slate-100 sm:h-12 sm:min-w-[52px] sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[40px]"
                  title={t.ownerMenuTitle}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[10px] font-extrabold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                    {t.ownerMenuBtn}
                  </span>
                </button>
              )}

              <div className="mx-0.5 hidden h-7 w-px bg-slate-300/60 dark:bg-slate-700/70 sm:block [@media(max-height:520px)]:hidden" />

              {/* Language Toggle */}
              <button
                type="button"
                onClick={onToggleLanguage}
                className="flex h-11 min-w-[42px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-slate-700 transition-colors hover:bg-slate-200/60 active:scale-[0.97] dark:text-slate-200 dark:hover:bg-slate-800/70 sm:h-12 sm:px-2.5 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:min-w-[38px]"
                title={lang === 'ckb' ? 'English' : 'کوردی'}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200/70 text-sky-600 dark:bg-slate-800 dark:text-sky-400 [@media(max-height:520px)]:h-5 [@media(max-height:520px)]:w-5">
                  <Globe className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-bold leading-none whitespace-nowrap [@media(max-height:520px)]:text-[9px]">
                  {lang === 'ckb' ? 'EN' : 'کوردی'}
                </span>
              </button>
            </div>

            {/* Active Boosts Strip (compact side shortcuts, opens Shop Boosts) */}
            <div className="hidden items-center gap-1.5 sm:flex [@media(max-height:520px)]:hidden">
              <button
                type="button"
                onClick={() => onOpenShop('boosts')}
                className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold text-slate-800 transition-colors hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800 ${dockSurface}`}
                title={t.tabBoosts}
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-mono-num">{activeXpBoost || 'XP'}</span>
                <Plus className="h-3 w-3 text-emerald-500 stroke-[2.75]" />
              </button>
              <button
                type="button"
                onClick={() => onOpenShop('boosts')}
                className={`flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold text-slate-800 transition-colors hover:bg-white dark:text-slate-100 dark:hover:bg-slate-800 ${dockSurface}`}
                title={t.tabBoosts}
              >
                <Coins className="h-3.5 w-3.5 text-sky-500" />
                <span className="font-mono-num">
                  {profile.boosts.coinBoost2x > 0
                    ? `2x (${profile.boosts.coinBoost2x})`
                    : profile.boosts.startMassBoost > 0
                    ? `+M (${profile.boosts.startMassBoost})`
                    : t.boostsShortLabel}
                </span>
                <Plus className="h-3 w-3 text-emerald-500 stroke-[2.75]" />
              </button>
            </div>
          </div>

          {/* Top-Right Cluster: Unified Frosted Wallet Dock */}
          <div className={`pointer-events-auto flex shrink-0 items-center rounded-2xl p-1 [@media(max-height:520px)]:rounded-xl ${dockSurface}`}>
            <button
              type="button"
              onClick={() => onOpenShop('skins')}
              className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 transition-colors hover:bg-emerald-500/10 active:scale-[0.98] sm:h-10 sm:px-3 [@media(max-height:520px)]:h-8"
              title={t.dnaLabel}
            >
              <Dna className="h-4 w-4 text-emerald-500" />
              <span className="font-mono-num text-xs font-extrabold text-slate-900 dark:text-white sm:text-sm">
                {profile.dna}
              </span>
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-emerald-500/18 text-emerald-700 dark:text-emerald-300">
                <Plus className="h-3 w-3 stroke-[2.75]" />
              </span>
            </button>

            <div className="h-5 w-px bg-slate-300/65 dark:bg-slate-700/75" aria-hidden="true" />

            <button
              type="button"
              onClick={() => onOpenShop('skins')}
              className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 transition-colors hover:bg-amber-500/10 active:scale-[0.98] sm:h-10 sm:px-3 [@media(max-height:520px)]:h-8"
              title={t.coinsLabel}
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-mono-num text-xs font-extrabold text-slate-900 dark:text-white sm:text-sm">
                {profile.coins}
              </span>
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-amber-500/18 text-amber-700 dark:text-amber-300">
                <Plus className="h-3 w-3 stroke-[2.75]" />
              </span>
            </button>
          </div>
        </div>

        {/* CENTER FOCAL CARD: Elevated Studio Lobby Anchor */}
        <div className="pointer-events-auto mx-auto w-full max-w-[360px] rounded-3xl border border-white/75 bg-white/74 p-4 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-700/65 dark:bg-slate-900/74 dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.62)] sm:max-w-[400px] sm:p-5 [@media(max-height:520px)]:max-w-[440px] [@media(max-height:520px)]:rounded-2xl [@media(max-height:520px)]:p-3">
          <div className="flex flex-col items-center text-center">
            <h1
              dir="ltr"
              className="font-display text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl [@media(max-height:520px)]:text-2xl"
            >
              {t.brand}
            </h1>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 [@media(max-height:520px)]:mt-0.5 [@media(max-height:520px)]:text-[10px]">
              <span>{config.playType === 'online' ? `${t.onlineBadge} · ${currentRoomLabel}` : t.playSolo}</span>
              <span aria-hidden="true">·</span>
              <span>{t.modes[config.mode].title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-sky-700 dark:text-sky-300">
                {config.targetFps} {t.fpsShort}
              </span>
            </p>
          </div>

          {/* Skin Selector + Nickname Input */}
          <div className="mt-3.5 flex w-full items-center gap-2.5 sm:mt-4 [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:gap-2">
            <button
              type="button"
              onClick={() => onOpenShop('skins')}
              title={lang === 'ckb' ? activeSkin?.nameCkb : activeSkin?.nameEn}
              className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white shadow-md ring-2 ring-sky-500/25 transition-transform hover:scale-105 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:ring-sky-400/25 sm:h-14 sm:w-14 [@media(max-height:520px)]:h-11 [@media(max-height:520px)]:w-11"
            >
              <SkinPreview skinId={config.skinId} size={42} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow dark:border-slate-900 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4">
                <Plus className="h-3 w-3 stroke-[3]" />
              </span>
            </button>

            <input
              id="nickname-input"
              type="text"
              maxLength={16}
              value={config.nickname}
              onChange={(e) => onChangeConfig({ nickname: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onStartGame();
              }}
              placeholder={t.nicknamePlaceholder}
              aria-label={t.nicknameLabel}
              className="h-12 flex-1 rounded-2xl border border-slate-200/90 bg-white/95 px-4 text-base font-bold text-slate-900 shadow-xs placeholder:font-medium placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-white dark:focus:border-sky-400 sm:h-13 sm:text-sm [@media(max-height:520px)]:h-10 [@media(max-height:520px)]:rounded-xl"
            />
          </div>

          {connectionError && (
            <div className="mt-2.5 w-full rounded-xl border border-rose-300/80 bg-rose-50/95 px-3 py-1.5 text-center text-xs font-semibold text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/90 dark:text-rose-200">
              {connectionError}
            </div>
          )}

          {kickedNotice && (
            <div className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-rose-400 bg-rose-50/95 px-3 py-2 text-xs font-bold text-rose-800 dark:border-rose-700 dark:bg-rose-950/95 dark:text-rose-200">
              <span>{kickedNotice}</span>
              <button
                type="button"
                onClick={onDismissKickedNotice}
                aria-label={t.closeBtn}
                className="rounded-lg p-1 hover:bg-rose-200/60 dark:hover:bg-rose-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {grantNotice && (
            <div className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-400 bg-emerald-50/95 px-3 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/95 dark:text-emerald-200">
              <span>{grantNotice}</span>
              <button
                type="button"
                onClick={onDismissGrantNotice}
                aria-label={t.closeBtn}
                className="rounded-lg p-1 hover:bg-emerald-200/60 dark:hover:bg-emerald-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Primary Play CTA + Secondary Settings & Modes */}
          <div className="mt-3 flex w-full items-stretch gap-2.5 sm:mt-3.5 [@media(max-height:520px)]:mt-2">
            <button
              type="button"
              disabled={connecting}
              onClick={onStartGame}
              className="flex min-h-[54px] flex-[1.45] items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-orange-500 to-rose-600 px-4 py-2.5 text-white shadow-lg shadow-orange-500/25 transition-all duration-150 hover:brightness-105 active:scale-[0.98] disabled:opacity-60 sm:min-h-[56px] [@media(max-height:520px)]:min-h-[42px] [@media(max-height:520px)]:rounded-xl"
            >
              <Play className="h-5 w-5 fill-current [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
              <span className="text-sm font-black tracking-tight whitespace-nowrap sm:text-base [@media(max-height:520px)]:text-xs">
                {connecting
                  ? t.connectingText
                  : config.playType === 'online'
                  ? t.joinOnlineGame
                  : t.startGame}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex min-h-[54px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-slate-800 shadow-xs transition-colors hover:bg-white active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 sm:min-h-[56px] [@media(max-height:520px)]:min-h-[42px] [@media(max-height:520px)]:rounded-xl"
            >
              <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-extrabold whitespace-nowrap sm:text-sm [@media(max-height:520px)]:text-xs">
                {t.moreBtn}
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM BAR: Left = Frosted Utility Dock | Right = Shop & Player Profile Card */}
        <div className="flex items-end justify-between gap-2">
          {/* Bottom-Left Cluster */}
          <div className={`pointer-events-auto flex items-center gap-1 rounded-2xl p-1 [@media(max-height:520px)]:rounded-xl ${dockSurface}`}>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label={t.settingsBtn}
              title={t.settingsBtn}
              className="flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-extrabold text-slate-800 transition-colors hover:bg-slate-200/60 active:scale-[0.97] dark:text-slate-100 dark:hover:bg-slate-800/80 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:px-2"
            >
              <Settings className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
              <span className="hidden sm:inline">{t.settingsBtn}</span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomizer}
              aria-label={t.customizeControlsBtn}
              title={t.customizeControlsBtn}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sky-600 transition-colors hover:bg-sky-500/12 active:scale-[0.97] dark:text-sky-400 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:w-9"
            >
              <SlidersHorizontal className="h-4.5 w-4.5 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
            </button>

            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label={t.roomsBtn}
              title={t.roomsBtn}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-indigo-600 transition-colors hover:bg-indigo-500/12 active:scale-[0.97] dark:text-indigo-400 [@media(max-height:520px)]:h-9 [@media(max-height:520px)]:w-9"
            >
              <Users className="h-4.5 w-4.5 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
            </button>
          </div>

          {/* Bottom-Right Cluster: Shop + Sleek Profile Card */}
          <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenShop('skins')}
              className="flex h-12 items-center gap-1.5 rounded-2xl border border-emerald-400/50 bg-gradient-to-b from-emerald-500 to-teal-600 px-3 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all duration-150 hover:brightness-105 active:scale-[0.97] sm:px-4 sm:text-sm whitespace-nowrap [@media(max-height:520px)]:h-10 [@media(max-height:520px)]:rounded-xl [@media(max-height:520px)]:px-3"
            >
              <ShoppingBag className="h-4.5 w-4.5 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
              <span>{t.shopBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAccount('account')}
              className={`flex h-12 items-center gap-2 rounded-2xl px-2.5 text-start transition-transform hover:scale-[1.02] active:scale-[0.98] sm:px-3 [@media(max-height:520px)]:h-10 [@media(max-height:520px)]:rounded-xl ${dockSurface}`}
              title={t.accountTitle}
            >
              <div className="flex min-w-[92px] flex-col gap-0.5 sm:min-w-[116px]">
                <div className="flex items-center justify-between gap-1.5 text-[11px]">
                  <span className="font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                    {t.levelLabel} {profile.level}
                  </span>
                  {bestMass > 0 && (
                    <span className="font-mono-num flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400">
                      <Trophy className="h-3 w-3" />
                      {bestMass}
                    </span>
                  )}
                </div>
                <div
                  dir="ltr"
                  className="font-mono-num text-[10px] font-bold text-sky-600 dark:text-sky-400"
                >
                  {formatPlayerCodeDisplay(playerCode)}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <SkinPreview skinId={config.skinId} size={30} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* BEAUTIFIED SETTINGS, FPS, MODES & ROOMS MODAL */}
      {moreOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="animate-modal-enter flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-slate-50/96 shadow-2xl backdrop-blur-xl dark:border-slate-700/75 dark:bg-slate-900/96 [@media(max-height:520px)]:max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/90 sm:px-6 [@media(max-height:520px)]:py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8">
                  <Settings className="h-5 w-5 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    {t.settingsBtn} · {t.lobbySetupTitle}
                  </h2>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 [@media(max-height:520px)]:hidden">
                    {t.modes[config.mode].title} · {currentRoomLabel} · {config.targetFps} {t.fpsShort}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={t.closeBtn}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 sm:px-6 [@media(max-height:520px)]:space-y-3 [@media(max-height:520px)]:py-3">
              {/* Account & Email Sign-In Card */}
              <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-indigo-50/70 p-3.5 shadow-xs dark:border-sky-800/60 dark:from-sky-950/45 dark:to-indigo-950/35">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                    <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>{t.settingsAccountTitle}</span>
                  </div>
                  <span
                    dir="ltr"
                    className="font-mono-num rounded-lg bg-white/80 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-slate-900/70 dark:text-sky-300"
                  >
                    {formatPlayerCodeDisplay(playerCode)}
                  </span>
                </div>

                {firebaseUser ? (
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {t.signedInAsLabel}
                      </div>
                      <div
                        dir="ltr"
                        className="truncate text-xs font-extrabold text-slate-900 dark:text-white"
                      >
                        {firebaseUser.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          onOpenAccount('account');
                        }}
                        className="flex min-h-[38px] items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap"
                      >
                        {t.accountBtn}
                      </button>
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={onSignOut}
                        className="flex min-h-[38px] items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800/70 dark:bg-slate-900 dark:text-rose-400 whitespace-nowrap"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{t.signOutBtn}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {t.guestAccountNote}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="email"
                        dir="ltr"
                        value={settingsEmailInput}
                        onChange={(e) => {
                          setSettingsEmailInput(e.target.value);
                          if (authError) onClearAuthError();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSignInGoogle(settingsEmailInput);
                        }}
                        placeholder={t.emailInputPlaceholder}
                        className="h-10 min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                      />
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={() => onSignInGoogle(settingsEmailInput)}
                        className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>{t.signInGoogleBtn}</span>
                      </button>
                    </div>
                    {authError && (
                      <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                        {authError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Play Type & Online Rooms Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-800/45">
                <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <span>{t.playTypeLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/70">
                  {playTypes.map((pt) => {
                    const Icon = pt.icon;
                    const active = config.playType === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => onChangeConfig({ playType: pt.id })}
                        className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        <span>{pt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Online Room Selector */}
                {config.playType === 'online' && (
                  <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{t.roomLabel}</span>
                      <span className="font-mono-num rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        {rooms.reduce((sum, r) => sum + r.onlinePlayers, 0)} {t.onlineCountSuffix}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(rooms.length > 0
                        ? rooms
                        : [
                            { id: 'global', mode: 'classic' as GameMode, onlinePlayers: 0 },
                            { id: 'kurdistan', mode: 'classic' as GameMode, onlinePlayers: 0 },
                            { id: 'blitz', mode: 'blitz' as GameMode, onlinePlayers: 0 },
                            { id: 'merge', mode: 'merge' as GameMode, onlinePlayers: 0 },
                          ]
                      ).map((room) => {
                        const selected = config.roomId === room.id;
                        const displayName = presetRoomLabels[room.id] || room.id;
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => onChangeConfig({ roomId: room.id, mode: room.mode })}
                            className={`flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                              selected
                                ? 'border-sky-500 bg-sky-500/15 text-sky-800 shadow-xs dark:border-sky-400 dark:text-sky-200'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300'
                            }`}
                          >
                            <span>{displayName}</span>
                            <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              · {room.onlinePlayers}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      maxLength={20}
                      value={config.roomId}
                      onChange={(e) => onChangeConfig({ roomId: e.target.value })}
                      placeholder={t.roomPlaceholder}
                      className="mt-2.5 h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50 px-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-white sm:text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Game Mode 2x2 Cards */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-800/45">
                <div className="mb-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  {t.gameMode}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((m) => {
                    const active = config.mode === m;
                    const accentClass =
                      m === 'blitz'
                        ? 'text-amber-600 dark:text-amber-400'
                        : m === 'merge'
                        ? 'text-violet-600 dark:text-violet-400'
                        : m === 'relaxed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-sky-600 dark:text-sky-400';
                    const activeCardClass =
                      m === 'merge'
                        ? 'border-violet-500 bg-violet-50/90 ring-2 ring-violet-500/20 dark:border-violet-400 dark:bg-violet-950/40'
                        : m === 'blitz'
                        ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/40'
                        : m === 'relaxed'
                        ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/40'
                        : 'border-sky-500 bg-sky-50/90 ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-950/40';
                    const ModeIcon =
                      m === 'blitz'
                        ? Zap
                        : m === 'merge'
                        ? Sparkles
                        : m === 'relaxed'
                        ? Compass
                        : Layers;

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onChangeConfig({ mode: m })}
                        className={`flex min-h-[58px] flex-col items-start justify-center rounded-xl border p-2.5 text-start transition-all ${
                          active
                            ? activeCardClass
                            : 'border-slate-200/80 bg-slate-50/70 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {t.modes[m].title}
                          </span>
                          <ModeIcon className={`h-3.5 w-3.5 shrink-0 ${accentClass}`} />
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {t.modes[m].desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appearance, FPS (30/60/120), Language & Controls Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-800/45">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {t.appearanceLabel}
                  </span>
                  <button
                    type="button"
                    onClick={onToggleLanguage}
                    className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Globe className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>
                      {t.languageLabel}: {lang === 'ckb' ? 'کوردی' : 'English'}
                    </span>
                  </button>
                </div>

                {/* Arena Theme */}
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900/70">
                  {themes.map((th) => {
                    const Icon = th.icon;
                    const active = config.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => onChangeConfig({ theme: th.id })}
                        className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{th.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Frame Rate (30 / 60 / 120 FPS) Selector */}
                <div className="mt-3.5 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      <span>{t.fpsLabel}</span>
                    </span>
                    <span className="font-mono-num text-[11px] font-bold text-sky-600 dark:text-sky-400">
                      {config.targetFps} {t.fpsShort}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {fpsOptions.map((opt) => {
                      const active = config.targetFps === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onChangeConfig({ targetFps: opt.value })}
                          className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center transition-all ${
                            active
                              ? 'border-sky-500 bg-sky-500/12 ring-2 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-500/15'
                              : 'border-slate-200/80 bg-slate-50/75 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <span className={`font-mono-num text-sm font-black leading-tight ${opt.accent}`}>
                            {opt.value} {t.fpsShort}
                          </span>
                          <span className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Show Mass Switch, Show Live FPS Switch & Control Customizer */}
                <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200/70 pt-3 dark:border-slate-700/60">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.showMassOnCells}
                      onClick={() => onChangeConfig({ showMassOnCells: !config.showMassOnCells })}
                      className="flex min-h-[40px] items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span
                        dir="ltr"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                          config.showMassOnCells ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            config.showMassOnCells ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span>{t.showMassLabel}</span>
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.showFpsCounter}
                      onClick={() => onChangeConfig({ showFpsCounter: !config.showFpsCounter })}
                      className="flex min-h-[40px] items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span
                        dir="ltr"
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                          config.showFpsCounter ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            config.showFpsCounter ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>
                      <span>{t.showFpsLabel}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenCustomizer();
                    }}
                    className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{t.customizeControlsBtn}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 border-t border-slate-200/70 bg-white/75 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onStartGame();
                }}
                disabled={connecting}
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-rose-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 whitespace-nowrap"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>
                  {connecting
                    ? t.connectingText
                    : config.playType === 'online'
                    ? t.joinOnlineGame
                    : t.startGame}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-[46px] items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
