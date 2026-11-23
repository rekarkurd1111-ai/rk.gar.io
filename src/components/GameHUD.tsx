import { useRef, useState } from 'react';
import {
  Pause,
  Volume2,
  VolumeX,
  Scissors,
  Flame,
  LogOut,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  Megaphone,
  X,
} from 'lucide-react';
import { Translations } from '../game/i18n';
import { ControlLayout, HudSnapshot, OwnerAnnouncement, PlayType, TargetFps } from '../game/types';
import { SkinPreview } from './SkinPreview';

interface GameHUDProps {
  hud: HudSnapshot;
  bestRank: number;
  t: Translations;
  playType: PlayType;
  muted: boolean;
  zoomMultiplier: number;
  currentFps: number;
  targetFps: TargetFps;
  showFpsCounter: boolean;
  onCycleFps: () => void;
  controlLayout: ControlLayout;
  joystickPadDelta: { dx: number; dy: number } | null;
  onJoystickPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onJoystickPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onJoystickPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onChangeZoom: (next: number) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenCustomizer: () => void;
  isOwner?: boolean;
  onOpenOwnerMenu?: () => void;
  announcement?: OwnerAnnouncement | null;
  onDismissAnnouncement?: () => void;
  onSplit: () => void;
  onEjectStart: () => void;
  onEjectEnd: () => void;
  onFastEjectStart: () => void;
  onFastEjectEnd: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameHUD({
  hud,
  bestRank,
  t,
  playType,
  muted,
  zoomMultiplier,
  currentFps,
  targetFps,
  showFpsCounter,
  onCycleFps,
  controlLayout,
  joystickPadDelta,
  onJoystickPointerDown,
  onJoystickPointerMove,
  onJoystickPointerUp,
  onChangeZoom,
  onToggleMute,
  onPause,
  onOpenCustomizer,
  isOwner = false,
  onOpenOwnerMenu,
  announcement = null,
  onDismissAnnouncement,
  onSplit,
  onEjectStart,
  onEjectEnd,
  onFastEjectStart,
  onFastEjectEnd,
}: GameHUDProps) {
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const ejectPointerIdRef = useRef<number | null>(null);
  const fastEjectPointerIdRef = useRef<number | null>(null);

  const glassSurface =
    'border border-white/70 bg-white/62 shadow-[0_10px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/64 dark:shadow-[0_10px_32px_rgba(0,0,0,0.36)]';

  const zoomPercent = Math.round(zoomMultiplier * 100);
  const zoomPresets = [0.65, 0.85, 1.0, 1.25, 1.5];

  const openPopoverAbove = controlLayout.zoom.yPct > 0.45;
  const alignPopoverRight = controlLayout.zoom.xPct > 0.5;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Live Owner Announcement Banner */}
      {announcement && (
        <div className="pointer-events-auto fixed top-3 left-1/2 z-30 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl border border-amber-400/80 bg-amber-500/95 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-xl backdrop-blur-md">
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {t.ownerAnnouncementPrefix} {announcement.text}
          </span>
          {onDismissAnnouncement && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onDismissAnnouncement();
              }}
              aria-label={t.closeBtn}
              className="rounded-lg p-0.5 hover:bg-amber-600/30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Row: Compact Frosted Glass Stats + Top 5 Glass Leaderboard */}
      <div className="flex items-start justify-between gap-2 p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] sm:gap-4 sm:p-5 [@media(max-height:520px)]:gap-2 [@media(max-height:520px)]:p-2">
        {/* Player Stats & Quick Top Actions */}
        <div className="pointer-events-auto flex flex-col gap-1.5 [@media(max-height:520px)]:gap-1">
          <div
            className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 sm:gap-3 sm:px-3.5 sm:py-2 [@media(max-height:520px)]:gap-2 [@media(max-height:520px)]:px-2.5 [@media(max-height:520px)]:py-1 ${glassSurface}`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-[11px] [@media(max-height:520px)]:text-[9px]">
                {t.mass}
              </span>
              <span className="font-mono-num text-base font-bold leading-tight text-slate-900 dark:text-white sm:text-xl [@media(max-height:520px)]:text-sm">
                {hud.mass}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-300/60 dark:bg-slate-600/50 sm:h-7 [@media(max-height:520px)]:h-5" aria-hidden="true" />

            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-[11px]">
                {t.score}
              </span>
              <span className="font-mono-num text-sm font-bold leading-tight text-sky-700 dark:text-sky-300 sm:text-base">
                {hud.score}
              </span>
            </div>

            <div className="hidden h-7 w-px bg-slate-300/60 dark:bg-slate-600/50 sm:block" aria-hidden="true" />

            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 [@media(max-height:520px)]:text-[9px]">
                  {t.rank}
                </span>
                <span className="font-mono-num text-base font-bold leading-tight text-slate-900 dark:text-slate-100 [@media(max-height:520px)]:text-xs">
                  {hud.rank > 0 ? `#${hud.rank}` : '—'}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 [@media(max-height:520px)]:text-[10px]">
                    /{hud.totalPlayers}
                  </span>
                </span>
              </div>

              <div className="flex flex-col rounded-xl bg-amber-500/15 px-2 py-0.5 ring-1 ring-amber-500/25 dark:bg-amber-400/15 dark:ring-amber-400/25 [@media(max-height:520px)]:px-1.5">
                <span className="text-[10px] font-semibold leading-tight text-amber-700 dark:text-amber-300 [@media(max-height:520px)]:text-[9px]">
                  {t.bestRank}
                </span>
                <span className="font-mono-num text-xs font-bold leading-tight text-amber-800 dark:text-amber-200 [@media(max-height:520px)]:text-[11px]">
                  {bestRank > 0 ? `#${bestRank}` : '—'}
                </span>
              </div>
            </div>

            <div
              className="hidden h-7 w-px bg-slate-300/60 dark:bg-slate-600/50 md:block"
              aria-hidden="true"
            />

            <div className="hidden flex-col md:flex">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t.eaten}
              </span>
              <span className="font-mono-num text-base font-bold leading-tight text-slate-900 dark:text-slate-100">
                {hud.cellsEaten}
              </span>
            </div>

            <div
              className="hidden h-7 w-px bg-slate-300/60 dark:bg-slate-600/50 lg:block"
              aria-hidden="true"
            />

            <div className="hidden flex-col lg:flex">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t.timeAlive}
              </span>
              <span className="font-mono-num text-base font-bold leading-tight text-slate-900 dark:text-slate-100">
                {formatTime(hud.elapsedSeconds)}
              </span>
            </div>

            {playType === 'online' && hud.onlinePlayers !== undefined && (
              <>
                <div
                  className="hidden h-7 w-px bg-slate-300/60 dark:bg-slate-600/50 xl:block"
                  aria-hidden="true"
                />
                <div className="hidden flex-col xl:flex">
                  <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                    {t.onlineBadge}
                  </span>
                  <span className="font-mono-num text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {hud.onlinePlayers} {t.onlineCountSuffix}
                  </span>
                </div>
              </>
            )}

            {showFpsCounter && (
              <>
                <div
                  className="hidden h-7 w-px bg-slate-300/60 dark:bg-slate-600/50 sm:block [@media(max-height:520px)]:h-5"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCycleFps();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCycleFps();
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  title={`${t.fpsLabel}: ${targetFps}`}
                  aria-label={`${t.fpsLabel}: ${targetFps}`}
                  className="hidden touch-none select-none flex-col items-start rounded-xl px-1.5 py-0.5 text-start transition-colors hover:bg-white/55 focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-slate-800/60 sm:flex"
                >
                  <span className="text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400 [@media(max-height:520px)]:text-[9px]">
                    {t.fpsShort} ({targetFps})
                  </span>
                  <span
                    className={`font-mono-num text-xs font-bold leading-tight sm:text-sm [@media(max-height:520px)]:text-[11px] ${
                      targetFps === 120
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : targetFps === 60
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {currentFps}
                  </span>
                </button>
              </>
            )}

            <div className="h-6 w-px bg-slate-300/60 dark:bg-slate-600/50 sm:h-7" aria-hidden="true" />

            <div className="flex items-center gap-0.5 sm:gap-1">
              {isOwner && onOpenOwnerMenu && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenOwnerMenu();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenOwnerMenu();
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  title={t.ownerMenuTitle}
                  aria-label={t.ownerMenuTitle}
                  className="flex h-10 w-10 touch-none select-none items-center justify-center rounded-xl bg-amber-400/25 text-amber-700 transition-colors hover:bg-amber-400/45 focus-visible:outline-2 focus-visible:outline-amber-500 dark:text-amber-300 [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8"
                >
                  <ShieldCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenCustomizer();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenCustomizer();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                title={t.customizeControlsBtn}
                aria-label={t.customizeControlsBtn}
                className="flex h-10 w-10 touch-none select-none items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-white/50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-sky-500 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-white [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleMute();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleMute();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                title={muted ? t.unmuteBtn : t.muteBtn}
                aria-label={muted ? t.unmuteBtn : t.muteBtn}
                className="flex h-10 w-10 touch-none select-none items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-white/50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-sky-500 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-white [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPause();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPause();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                title={playType === 'online' ? t.leaveBtn : t.pauseBtn}
                aria-label={playType === 'online' ? t.leaveBtn : t.pauseBtn}
                className="flex h-10 w-10 touch-none select-none items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-white/50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-sky-500 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-white [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8"
              >
                {playType === 'online' ? (
                  <LogOut className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Compact Mobile Rank + Best Rank + FPS strip */}
          <div
            className={`flex items-center gap-2 self-start rounded-xl px-2.5 py-1 sm:hidden ${glassSurface}`}
          >
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
              {t.rank}
            </span>
            <span className="font-mono-num text-xs font-bold text-slate-900 dark:text-slate-100">
              {hud.rank > 0 ? `#${hud.rank}` : '—'}
              <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                /{hud.totalPlayers}
              </span>
            </span>
            <span className="h-3.5 w-px bg-slate-300/60 dark:bg-slate-600/50" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
              {t.bestRank}
            </span>
            <span className="font-mono-num text-xs font-bold text-amber-800 dark:text-amber-200">
              {bestRank > 0 ? `#${bestRank}` : '—'}
            </span>
            {showFpsCounter && (
              <>
                <span className="h-3.5 w-px bg-slate-300/60 dark:bg-slate-600/50" aria-hidden="true" />
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCycleFps();
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="font-mono-num touch-none select-none text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                >
                  {currentFps} {t.fpsShort}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top 5 Frosted-Glass Leaderboard */}
        <aside className={`w-36 rounded-2xl px-2.5 py-2 sm:w-60 sm:px-3.5 sm:py-2.5 [@media(max-height:520px)]:w-44 [@media(max-height:520px)]:px-2.5 [@media(max-height:520px)]:py-1.5 ${glassSurface}`}>
          <div className="mb-1 flex items-center justify-between gap-1.5 sm:mb-1.5 [@media(max-height:520px)]:mb-0.5">
            <h2 className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100 sm:text-xs [@media(max-height:520px)]:text-[10px]">
              {t.leaderboard}
            </h2>
            {playType === 'online' && hud.roomId && (
              <span className="hidden truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:inline [@media(max-height:520px)]:text-[10px]">
                {hud.roomId}
              </span>
            )}
          </div>
          <ol className="space-y-0.5 text-[11px] sm:space-y-1 sm:text-xs [@media(max-height:520px)]:space-y-0 [@media(max-height:520px)]:text-[10px]">
            {hud.leaderboard.slice(0, 5).map((entry) => (
              <li
                key={entry.ownerId}
                className={`flex items-center justify-between gap-1.5 rounded-lg px-1 py-0.5 transition-colors sm:px-1.5 ${
                  entry.isPlayer
                    ? 'bg-sky-500/20 font-bold text-sky-900 dark:bg-sky-400/20 dark:text-sky-200'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                  <span className="font-mono-num w-3.5 shrink-0 text-[10px] text-slate-500 dark:text-slate-400 sm:w-4 sm:text-[11px]">
                    {entry.rank}.
                  </span>
                  <SkinPreview skinId={entry.skinId} size={16} skinLevel={entry.skinLevel ?? 1} />
                  <span className="truncate">{entry.name}</span>
                  {entry.isPlayer && (
                    <span className="shrink-0 text-[10px] font-bold text-sky-700 dark:text-sky-300 sm:text-[11px]">
                      ({t.youLabel})
                    </span>
                  )}
                </div>
                <span className="font-mono-num shrink-0 text-[10px] font-semibold text-slate-600 dark:text-slate-300 sm:text-[11px]">
                  {entry.mass}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* Physical Coordinate Layer for Movable Multi-Touch Controls */}
      <div dir="ltr" className="pointer-events-none fixed inset-0">
        {/* Movable On-Screen Movement Joystick Pad */}
        {controlLayout.showJoystick && (
          <div
            onPointerDown={onJoystickPointerDown}
            onPointerMove={onJoystickPointerMove}
            onPointerUp={onJoystickPointerUp}
            onPointerCancel={onJoystickPointerUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              left: `${controlLayout.joystick.xPct * 100}%`,
              top: `${controlLayout.joystick.yPct * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            aria-label={t.joystickLabel}
            className={`pointer-events-auto absolute flex h-24 w-24 touch-none select-none items-center justify-center rounded-full border transition-colors sm:h-28 sm:w-28 [@media(max-height:520px)]:h-20 [@media(max-height:520px)]:w-20 ${
              joystickPadDelta
                ? 'border-sky-500/70 bg-sky-500/15 shadow-lg dark:border-sky-400/70 dark:bg-sky-400/15'
                : 'border-white/60 bg-white/30 shadow-md backdrop-blur-md dark:border-slate-600/60 dark:bg-slate-900/35'
            }`}
          >
            <div
              style={{
                transform: joystickPadDelta
                  ? `translate(${joystickPadDelta.dx}px, ${joystickPadDelta.dy}px)`
                  : 'translate(0px, 0px)',
              }}
              className={`h-10 w-10 rounded-full shadow-md ring-2 ring-white/80 transition-colors dark:ring-slate-900/80 [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8 ${
                joystickPadDelta ? 'bg-sky-500/85' : 'bg-sky-500/55'
              }`}
            />
          </div>
        )}

        {/* Movable Split Button (instant multi-touch via pointerdown) */}
        <button
          type="button"
          disabled={!hud.canSplit}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (hud.canSplit) onSplit();
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && hud.canSplit) {
              e.preventDefault();
              onSplit();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${controlLayout.split.xPct * 100}%`,
            top: `${controlLayout.split.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[52px] touch-none select-none items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 transition-transform hover:bg-white/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-100 dark:hover:bg-slate-800/60 whitespace-nowrap sm:min-h-[48px] sm:text-sm [@media(max-height:520px)]:min-h-[40px] [@media(max-height:520px)]:px-3 [@media(max-height:520px)]:py-1.5 [@media(max-height:520px)]:text-xs ${glassSurface}`}
        >
          <Scissors className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span>{t.splitBtn}</span>
          <span className="hidden font-mono-num text-[11px] text-slate-500 dark:text-slate-400 sm:inline">
            Space
          </span>
        </button>

        {/* Movable Eject Button (holdable multi-touch with pointer capture) */}
        <button
          type="button"
          disabled={!hud.canEject}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hud.canEject) return;
            ejectPointerIdRef.current = e.pointerId;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore capture failure
            }
            onEjectStart();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            if (ejectPointerIdRef.current === e.pointerId) {
              ejectPointerIdRef.current = null;
              try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              } catch {
                // Ignore release failure
              }
              onEjectEnd();
            }
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            if (ejectPointerIdRef.current === e.pointerId) {
              ejectPointerIdRef.current = null;
              onEjectEnd();
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && hud.canEject) {
              e.preventDefault();
              onEjectStart();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onEjectEnd();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${controlLayout.eject.xPct * 100}%`,
            top: `${controlLayout.eject.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-auto absolute flex min-h-[52px] touch-none select-none items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 transition-transform hover:bg-white/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 dark:text-slate-100 dark:hover:bg-slate-800/60 whitespace-nowrap sm:min-h-[48px] sm:text-sm [@media(max-height:520px)]:min-h-[40px] [@media(max-height:520px)]:px-3 [@media(max-height:520px)]:py-1.5 [@media(max-height:520px)]:text-xs ${glassSurface}`}
        >
          <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>{t.ejectBtn}</span>
          <span className="hidden font-mono-num text-[11px] text-slate-500 dark:text-slate-400 sm:inline">
            W
          </span>
        </button>

        {/* Movable Ultra-Fast Turbo Eject Button */}
        <button
          type="button"
          disabled={!hud.canEject}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!hud.canEject) return;
            fastEjectPointerIdRef.current = e.pointerId;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Ignore capture failure
            }
            onFastEjectStart();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            if (fastEjectPointerIdRef.current === e.pointerId) {
              fastEjectPointerIdRef.current = null;
              try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              } catch {
                // Ignore release failure
              }
              onFastEjectEnd();
            }
          }}
          onPointerCancel={(e) => {
            e.stopPropagation();
            if (fastEjectPointerIdRef.current === e.pointerId) {
              fastEjectPointerIdRef.current = null;
              onFastEjectEnd();
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && hud.canEject) {
              e.preventDefault();
              onFastEjectStart();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onFastEjectEnd();
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            left: `${controlLayout.fastEject.xPct * 100}%`,
            top: `${controlLayout.fastEject.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          title={t.fastEjectBtn}
          aria-label={t.fastEjectBtn}
          className={`pointer-events-auto absolute flex min-h-[52px] touch-none select-none items-center gap-1.5 rounded-2xl border border-amber-400/80 bg-gradient-to-b from-amber-400/90 to-orange-500/90 px-3.5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 backdrop-blur-md transition-transform hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap sm:min-h-[48px] sm:text-sm [@media(max-height:520px)]:min-h-[40px] [@media(max-height:520px)]:px-3 [@media(max-height:520px)]:py-1.5 [@media(max-height:520px)]:text-xs`}
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>{t.fastEjectBtn}</span>
          <span className="hidden font-mono-num text-[11px] font-bold text-slate-900/80 sm:inline">
            E
          </span>
        </button>

        {/* Movable Zoom Mini-Menu Trigger & Popover */}
        <div
          style={{
            left: `${controlLayout.zoom.xPct * 100}%`,
            top: `${controlLayout.zoom.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-auto absolute"
        >
          {zoomMenuOpen && (
            <div
              className={`absolute ${
                openPopoverAbove ? 'bottom-full mb-2' : 'top-full mt-2'
              } ${
                alignPopoverRight ? 'right-0' : 'left-0'
              } z-20 flex w-56 touch-none select-none flex-col gap-2 rounded-2xl p-3 shadow-lg ${glassSurface} bg-white/80 dark:bg-slate-900/80`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                <span>{t.zoomLabel}</span>
                <span className="font-mono-num text-sky-600 dark:text-sky-400">{zoomPercent}%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChangeZoom(Math.max(0.55, +(zoomMultiplier - 0.15).toFixed(2)));
                  }}
                  aria-label={t.zoomOutLabel}
                  className="flex min-h-[44px] min-w-[44px] touch-none select-none items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 transition-colors hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min={55}
                  max={165}
                  step={5}
                  value={zoomPercent}
                  onPointerDown={(e) => e.stopPropagation()}
                  onChange={(e) => onChangeZoom(Number(e.target.value) / 100)}
                  aria-label={t.zoomLabel}
                  className="h-2 flex-1 cursor-pointer accent-sky-600"
                />

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChangeZoom(Math.min(1.65, +(zoomMultiplier + 0.15).toFixed(2)));
                  }}
                  aria-label={t.zoomInLabel}
                  className="flex min-h-[44px] min-w-[44px] touch-none select-none items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-800 transition-colors hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-1">
                {zoomPresets.map((preset) => {
                  const active = Math.abs(zoomMultiplier - preset) < 0.04;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChangeZoom(preset);
                      }}
                      className={`font-mono-num min-h-[36px] flex-1 touch-none select-none rounded-lg text-[11px] font-bold transition-colors ${
                        active
                          ? 'bg-sky-600 text-white'
                          : 'bg-white/65 text-slate-700 hover:bg-white dark:bg-slate-800/65 dark:text-slate-200'
                      }`}
                    >
                      {Math.round(preset * 100)}%
                    </button>
                  );
                })}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChangeZoom(1.0);
                  }}
                  title={t.zoomResetLabel}
                  aria-label={t.zoomResetLabel}
                  className="flex min-h-[36px] min-w-[36px] touch-none select-none items-center justify-center rounded-lg bg-white/65 text-slate-700 hover:bg-white dark:bg-slate-800/65 dark:text-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setZoomMenuOpen((prev) => !prev);
            }}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={t.zoomLabel}
            aria-expanded={zoomMenuOpen}
            className={`flex min-h-[48px] touch-none select-none items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 transition-transform hover:bg-white/60 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800/60 whitespace-nowrap [@media(max-height:520px)]:min-h-[40px] [@media(max-height:520px)]:px-2.5 [@media(max-height:520px)]:py-1.5 ${
              zoomMenuOpen ? 'ring-2 ring-sky-500' : ''
            } ${glassSurface}`}
          >
            <ZoomIn className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="font-mono-num">{zoomPercent}%</span>
          </button>
        </div>

        {/* Movable Frosted-Glass Minimap */}
        <div
          style={{
            left: `${controlLayout.minimap.xPct * 100}%`,
            top: `${controlLayout.minimap.yPct * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className={`pointer-events-none absolute h-20 w-20 overflow-hidden rounded-2xl sm:h-28 sm:w-28 [@media(max-height:520px)]:h-16 [@media(max-height:520px)]:w-16 ${glassSurface}`}
          aria-label={t.minimapLabel}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-400/30 dark:bg-slate-500/30" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400/30 dark:bg-slate-500/30" />

          {hud.minimapDots.map((dot, idx) => {
            const leftPct = (dot.x / hud.worldSize) * 100;
            const topPct = (dot.y / hud.worldSize) * 100;
            return (
              <span
                key={idx}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute rounded-full ${
                  dot.isPlayer
                    ? 'h-2.5 w-2.5 bg-sky-500 ring-2 ring-white/80 dark:ring-slate-900/80'
                    : dot.isLeader
                    ? 'h-2 w-2 bg-amber-500'
                    : 'h-1.5 w-1.5 bg-emerald-500/80'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
