import { useEffect, useRef } from 'react';
import {
  Check,
  Clock,
  Coins,
  Compass,
  Crosshair,
  Dna,
  Gift,
  KeyRound,
  Lock,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { getSeasonRemaining } from '../game/gamePass';
import { Translations } from '../game/i18n';
import {
  getReachableMazeNodeIds,
  getTodayKey,
  MAZE_HEIGHT,
  MAZE_NODE_MAP,
  MAZE_NODES,
  MAZE_WIDTH,
} from '../game/mazeEvent';
import { Language, MazeEventState, MazeNode, SkinId } from '../game/types';
import { SkinPreview } from './SkinPreview';

interface MazeEventModalProps {
  open: boolean;
  onClose: () => void;
  eventState: MazeEventState;
  equippedSkin: SkinId;
  lang: Language;
  t: Translations;
  onSelectNode: (nodeId: string) => void;
  onClaimDailyTokens: () => void;
}

function NodeGlyph({ node, equippedSkin }: { node: MazeNode; equippedSkin: SkinId }) {
  if (node.type === 'start') {
    return <SkinPreview skinId={equippedSkin} size={36} />;
  }
  if (node.type === 'skin' && node.skinId) {
    return <SkinPreview skinId={node.skinId} size={42} />;
  }
  if (node.type === 'coins') {
    return <Coins className="h-5 w-5 text-amber-500" />;
  }
  if (node.type === 'dna') {
    return <Dna className="h-5 w-5 text-emerald-500" />;
  }
  if (node.type === 'key') {
    return <KeyRound className="h-5 w-5 text-sky-500" />;
  }
  return <Zap className="h-5 w-5 text-violet-500" />;
}

export function MazeEventModal({
  open,
  onClose,
  eventState,
  equippedSkin,
  lang,
  t,
  onSelectNode,
  onClaimDailyTokens,
}: MazeEventModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const centerOnCurrentNode = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const current = MAZE_NODE_MAP[eventState.currentNodeId] || MAZE_NODE_MAP.start;
    container.scrollTo({
      left: Math.max(0, current.x - container.clientWidth / 2),
      top: Math.max(0, current.y - container.clientHeight / 2),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const current = MAZE_NODE_MAP[eventState.currentNodeId] || MAZE_NODE_MAP.start;
      container.scrollLeft = Math.max(0, current.x - container.clientWidth / 2);
      container.scrollTop = Math.max(0, current.y - container.clientHeight / 2);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, eventState.currentNodeId]);

  if (!open) return null;

  const unlockedSet = new Set(eventState.unlockedNodes);
  const reachableSet = getReachableMazeNodeIds(eventState);
  const remaining = getSeasonRemaining();
  const canClaimDaily = eventState.lastDailyClaimDate !== getTodayKey();

  // Deduplicate undirected edges
  const edges: { from: MazeNode; to: MazeNode }[] = [];
  const seenEdges = new Set<string>();
  for (const node of MAZE_NODES) {
    for (const neighborId of node.neighbors) {
      const key = node.id < neighborId ? `${node.id}__${neighborId}` : `${neighborId}__${node.id}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      const target = MAZE_NODE_MAP[neighborId];
      if (target) {
        edges.push({ from: node, to: target });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/60 p-1.5 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-modal-enter flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 px-4 py-3 dark:border-slate-800 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white sm:text-xl">
                {t.eventTitle}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
                {t.eventSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Token Counter */}
            <div className="flex h-10 items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-500/15 px-3 text-xs font-extrabold text-sky-800 dark:text-sky-200">
              <Sparkles className="h-4 w-4 text-sky-500" />
              <span className="font-mono-num text-sm">{eventState.tokens}</span>
              <span>{t.tokensLabel}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeBtn}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar: Countdown, Daily Free Tokens, Center Map */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>{t.eventEndsIn}</span>
            <strong className="font-mono-num text-slate-900 dark:text-white">
              {remaining.days}
              {t.daysShort} {remaining.hours}
              {t.hoursShort}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canClaimDaily}
              onClick={onClaimDailyTokens}
              className={`flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                canClaimDaily
                  ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-95'
                  : 'bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {canClaimDaily ? <Gift className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              <span>{canClaimDaily ? t.dailyTokensBtn : t.dailyTokensClaimed}</span>
            </button>

            <button
              type="button"
              onClick={centerOnCurrentNode}
              className="flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              <Crosshair className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden sm:inline">{t.centerMapBtn}</span>
            </button>
          </div>
        </div>

        {/* Interactive Bio-Cellular Maze Map (Scrollable / Pannable on Mobile) */}
        <div
          ref={scrollContainerRef}
          dir="ltr"
          className="relative flex-1 overflow-auto overscroll-contain touch-pan-x touch-pan-y bg-gradient-to-br from-sky-50 via-cyan-50/70 to-indigo-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/60"
        >
          <div
            style={{ width: MAZE_WIDTH, height: MAZE_HEIGHT }}
            className="relative mx-auto select-none"
          >
            {/* Subtle Cellular Grid Backdrop */}
            <div
              className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(14,165,233,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,233,0.16) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />

            {/* Soft Ambient Bio-Glow Blobs */}
            <div
              className="pointer-events-none absolute left-[12%] top-[16%] h-48 w-48 rounded-full bg-emerald-400/15 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-[8%] top-[24%] h-56 w-56 rounded-full bg-amber-400/18 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-[12%] left-[38%] h-48 w-48 rounded-full bg-sky-400/15 blur-2xl"
              aria-hidden="true"
            />

            {/* SVG Connected Graph Paths */}
            <svg
              width={MAZE_WIDTH}
              height={MAZE_HEIGHT}
              className="pointer-events-none absolute inset-0"
            >
              {edges.map(({ from, to }) => {
                const bothUnlocked = unlockedSet.has(from.id) && unlockedSet.has(to.id);
                const oneUnlocked = unlockedSet.has(from.id) || unlockedSet.has(to.id);
                return (
                  <g key={`${from.id}-${to.id}`}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={
                        bothUnlocked
                          ? '#0EA5E9'
                          : oneUnlocked
                          ? 'rgba(56, 189, 248, 0.55)'
                          : 'rgba(148, 163, 184, 0.45)'
                      }
                      strokeWidth={bothUnlocked ? 6 : 4}
                      strokeDasharray={bothUnlocked ? undefined : '8 6'}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Maze Nodes */}
            {MAZE_NODES.map((node) => {
              const isUnlocked = unlockedSet.has(node.id);
              const isReachable = reachableSet.has(node.id);
              const isCurrent = eventState.currentNodeId === node.id;
              const canAfford = isReachable && eventState.tokens >= node.cost;
              const isGrandSkin = node.type === 'skin';

              return (
                <div
                  key={node.id}
                  style={{
                    left: node.x,
                    top: node.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute flex flex-col items-center"
                >
                  {/* Cost / "You" badge above node */}
                  {isCurrent && (
                    <span className="mb-1 rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
                      {t.youLabel}
                    </span>
                  )}

                  {!isUnlocked && isReachable && (
                    <span
                      className={`font-mono-num mb-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-sm ${
                        canAfford
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700/85 text-slate-200'
                      }`}
                    >
                      {t.useTokensPrefix} {node.cost}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectNode(node.id)}
                    disabled={!isUnlocked && !canAfford}
                    className={`relative flex items-center justify-center rounded-full border-2 shadow-lg transition-all ${
                      isGrandSkin ? 'h-16 w-16' : 'h-13 w-13'
                    } ${
                      isCurrent
                        ? 'border-sky-400 bg-white ring-4 ring-sky-400/40 dark:bg-slate-900'
                        : isUnlocked
                        ? 'border-emerald-400 bg-white/95 hover:scale-105 dark:bg-slate-800'
                        : canAfford
                        ? 'animate-pulse border-amber-400 bg-white hover:scale-110 dark:bg-slate-800'
                        : 'border-slate-300/80 bg-slate-100/85 opacity-75 dark:border-slate-700 dark:bg-slate-900/85'
                    }`}
                  >
                    <NodeGlyph node={node} equippedSkin={equippedSkin} />

                    {/* Current Avatar Overlay when player moved to another unlocked node */}
                    {isCurrent && node.id !== 'start' && (
                      <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-sky-500 shadow dark:border-slate-900">
                        <SkinPreview skinId={equippedSkin} size={20} />
                      </div>
                    )}

                    {/* Unlocked Checkmark or Locked Padlock */}
                    {!isCurrent && isUnlocked && node.id !== 'start' && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    {!isUnlocked && !isReachable && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white shadow">
                        <Lock className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>

                  {/* Node Reward Label */}
                  <span
                    className={`mt-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-xs ${
                      isGrandSkin
                        ? 'bg-amber-500/90 text-slate-950'
                        : isUnlocked
                        ? 'bg-white/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-100'
                        : 'bg-white/75 text-slate-700 dark:bg-slate-900/80 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ckb' ? node.labelCkb : node.labelEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
