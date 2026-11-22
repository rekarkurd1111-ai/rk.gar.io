import { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Clock,
  Crown,
  Flame,
  LogIn,
  Medal,
  RefreshCw,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import {
  formatPlayerCodeDisplay,
  getCurrentWeekKey,
  getWeekResetCountdown,
} from '../game/accountService';
import { Translations } from '../game/i18n';
import { WeeklyTopEntry } from '../game/types';
import { SkinPreview } from './SkinPreview';

interface WorldTopModalProps {
  open: boolean;
  onClose: () => void;
  entries: WeeklyTopEntry[];
  loading: boolean;
  firebaseUser: User | null;
  authLoading: boolean;
  t: Translations;
  onRefresh: () => void;
  onSignInGoogle: () => void;
}

type SortMode = 'mass' | 'score';

export function WorldTopModal({
  open,
  onClose,
  entries,
  loading,
  firebaseUser,
  authLoading,
  t,
  onRefresh,
  onSignInGoogle,
}: WorldTopModalProps) {
  const [sortMode, setSortMode] = useState<SortMode>('mass');

  const weekKey = getCurrentWeekKey();
  const countdown = getWeekResetCountdown();

  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        if (sortMode === 'score') {
          return b.weeklyScore - a.weeklyScore || b.bestMass - a.bestMass;
        }
        return b.bestMass - a.bestMass || b.weeklyScore - a.weeklyScore;
      })
      .slice(0, 50);
  }, [entries, sortMode]);

  if (!open) return null;

  const champion = sortedEntries[0] || null;
  const myIndex = firebaseUser
    ? sortedEntries.findIndex((e) => e.uid === firebaseUser.uid)
    : -1;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-modal-enter flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/75 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-800 sm:px-6 sm:py-3.5 [@media(max-height:520px)]:py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 [@media(max-height:520px)]:h-8 [@media(max-height:520px)]:w-8">
              <Trophy className="h-5 w-5 [@media(max-height:520px)]:h-4 [@media(max-height:520px)]:w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display truncate text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
                {t.worldTopTitle}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span
                  dir="ltr"
                  className="font-mono-num rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {weekKey}
                </span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  <span>
                    {t.weeklyResetIn} {countdown.days}
                    {t.daysShort} {countdown.hours}
                    {t.hoursShort}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              title={t.refreshBtn}
              aria-label={t.refreshBtn}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeBtn}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="border-b border-slate-200/70 px-4 py-2 dark:border-slate-800 sm:px-6 [@media(max-height:520px)]:py-1.5">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setSortMode('mass')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                sortMode === 'mass'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>{t.sortByMass}</span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('score')}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                sortMode === 'score'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-sky-500" />
              <span>{t.sortByScore}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3.5 sm:px-6">
          {/* Guest Sign-In Reminder */}
          {!firebaseUser && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-sky-200/80 bg-sky-50/85 p-3 dark:border-sky-800/60 dark:bg-sky-950/40">
              <p className="min-w-[180px] flex-1 text-xs font-semibold text-sky-900 dark:text-sky-100">
                {t.weeklySignInHint}
              </p>
              <button
                type="button"
                disabled={authLoading}
                onClick={onSignInGoogle}
                className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{t.signInGoogleBtn}</span>
              </button>
            </div>
          )}

          {/* Weekly #1 Best Player Spotlight Card */}
          {champion ? (
            <div className="relative overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-orange-50/70 to-yellow-100/80 p-3.5 shadow-md dark:border-amber-500/40 dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/40 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                  <Crown className="h-4 w-4 fill-amber-500 text-amber-600 dark:text-amber-300" />
                  <span>{t.weeklyChampionLabel}</span>
                </div>
                <span className="font-mono-num rounded-lg bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-900 dark:text-amber-200">
                  #1
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-white shadow-md dark:bg-slate-900">
                    <SkinPreview skinId={champion.skinId} size={46} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-black text-slate-900 dark:text-white">
                      {champion.displayName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {champion.playerCode && (
                        <span
                          dir="ltr"
                          className="font-mono-num font-bold text-amber-800 dark:text-amber-300"
                        >
                          {formatPlayerCodeDisplay(champion.playerCode)}
                        </span>
                      )}
                      <span>
                        · {t.levelLabel} {champion.level}
                      </span>
                      <span>
                        · {champion.matchesCount} {t.matchesPlayedLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-white/80 px-3 py-2 dark:border-amber-700/40 dark:bg-slate-900/75">
                  <div className="text-center">
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {t.bestMassLabel}
                    </div>
                    <div className="font-mono-num text-sm font-black text-amber-700 dark:text-amber-300">
                      {champion.bestMass}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-amber-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {t.weeklyScoreLabel}
                    </div>
                    <div className="font-mono-num text-sm font-black text-sky-700 dark:text-sky-300">
                      {champion.weeklyScore}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t.noWeeklyEntries}
              </div>
            )
          )}

          {/* My Rank Summary Bar */}
          {myIndex >= 0 && (
            <div className="flex items-center justify-between rounded-xl border border-sky-300/70 bg-sky-50/80 px-3 py-2 text-xs font-bold text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-200">
              <span>
                {t.rank} ({t.youLabel}):{' '}
                <span className="font-mono-num font-black">#{myIndex + 1}</span>
              </span>
              <span className="font-mono-num">
                {sortMode === 'score'
                  ? `${sortedEntries[myIndex].weeklyScore} ${t.score}`
                  : `${sortedEntries[myIndex].bestMass} ${t.mass}`}
              </span>
            </div>
          )}

          {/* Ranked Weekly List */}
          {sortedEntries.length > 0 && (
            <div className="space-y-1.5">
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const isMe = firebaseUser?.uid === entry.uid;
                return (
                  <div
                    key={`${entry.weekKey}_${entry.uid}`}
                    className={`flex items-center justify-between gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
                      isMe
                        ? 'border-sky-400 bg-sky-50/90 dark:border-sky-600 dark:bg-sky-950/50'
                        : 'border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`font-mono-num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                          rank === 1
                            ? 'bg-amber-400/25 text-amber-700 dark:text-amber-300'
                            : rank === 2
                            ? 'bg-slate-300/40 text-slate-700 dark:bg-slate-600/40 dark:text-slate-200'
                            : rank === 3
                            ? 'bg-orange-400/25 text-orange-700 dark:text-orange-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : rank}
                      </div>

                      <SkinPreview skinId={entry.skinId} size={32} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            {entry.displayName}
                          </span>
                          {isMe && (
                            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                              {t.youLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {entry.playerCode && (
                            <span dir="ltr" className="font-mono-num font-bold">
                              {formatPlayerCodeDisplay(entry.playerCode)}
                            </span>
                          )}
                          <span>
                            · {t.levelLabel} {entry.level}
                          </span>
                          <span className="hidden items-center gap-0.5 sm:inline-flex">
                            · <Swords className="h-2.5 w-2.5" /> {entry.cellsEaten}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-end">
                      <div>
                        <div className="text-[10px] font-medium text-slate-400">
                          {sortMode === 'score' ? t.weeklyScoreLabel : t.bestMassLabel}
                        </div>
                        <div className="font-mono-num text-xs font-black text-slate-900 dark:text-white">
                          {sortMode === 'score' ? entry.weeklyScore : entry.bestMass}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-[10px] font-medium text-slate-400">
                          {sortMode === 'score' ? t.bestMassLabel : t.weeklyScoreLabel}
                        </div>
                        <div className="font-mono-num text-xs font-bold text-slate-500 dark:text-slate-300">
                          {sortMode === 'score' ? entry.bestMass : entry.weeklyScore}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
