import { useState } from 'react';
import {
  Award,
  Check,
  Clock,
  Coins,
  Crown,
  Dna,
  Gift,
  Lock,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  countClaimablePassItems,
  FREE_REWARDS,
  getChallengeStatus,
  getPassTierProgress,
  getSeasonRemaining,
  MAX_PASS_TIER,
  PASS_CHALLENGES,
  PLUS_REWARDS,
} from '../game/gamePass';
import { Translations } from '../game/i18n';
import { GamePassState, Language, PassReward, PassTrack } from '../game/types';
import { SkinPreview } from './SkinPreview';

interface GamePassModalProps {
  open: boolean;
  onClose: () => void;
  passState: GamePassState;
  lang: Language;
  t: Translations;
  onActivatePlusFree: () => void;
  onClaimReward: (tier: number, track: PassTrack) => void;
  onClaimAll: () => void;
  onClaimChallenge: (challengeId: string) => void;
}

function RewardIcon({ reward }: { reward: PassReward }) {
  if (reward.type === 'skin' && reward.skinId) {
    return <SkinPreview skinId={reward.skinId} size={34} />;
  }
  if (reward.type === 'coins') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Coins className="h-4 w-4" />
      </div>
    );
  }
  if (reward.type === 'dna') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Dna className="h-4 w-4" />
      </div>
    );
  }
  if (reward.type === 'boost') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
        <Zap className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

export function GamePassModal({
  open,
  onClose,
  passState,
  lang,
  t,
  onActivatePlusFree,
  onClaimReward,
  onClaimAll,
  onClaimChallenge,
}: GamePassModalProps) {
  const [tab, setTab] = useState<'rewards' | 'challenges'>('rewards');

  if (!open) return null;

  const progress = getPassTierProgress(passState.passXp);
  const remaining = getSeasonRemaining();
  const claimableTotal = countClaimablePassItems(passState);
  const claimableChallenges = PASS_CHALLENGES.filter(
    (c) => getChallengeStatus(c, passState).canClaim
  ).length;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-modal-enter flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                {t.gamePassTitle}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{t.gamePassSubtitle}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t.seasonTimeLeft}</span>
                  <strong className="font-mono-num">
                    {remaining.days}
                    {t.daysShort} {remaining.hours}
                    {t.hoursShort}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pass Tier Progress + Season 1 Free Plus Activation Banner */}
        <div className="border-b border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/45 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[180px] flex-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {t.passTierLabel}{' '}
                  <span className="font-mono-num text-sky-600 dark:text-sky-400">
                    {progress.tier}/{MAX_PASS_TIER}
                  </span>
                </span>
                <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                  {progress.currentInTier}/{progress.neededForNext} XP
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {claimableTotal > 0 && tab === 'rewards' && (
                <button
                  type="button"
                  onClick={onClaimAll}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 whitespace-nowrap"
                >
                  <Gift className="h-4 w-4" />
                  <span>{t.claimAllBtn}</span>
                </button>
              )}

              {passState.hasPlus && (
                <div className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                  <Crown className="h-4 w-4" />
                  <span>{t.plusActiveLabel}</span>
                </div>
              )}
            </div>
          </div>

          {!passState.hasPlus && (
            <div className="mt-2.5 flex flex-col justify-between gap-2 rounded-xl border border-amber-400/60 bg-amber-500/12 px-3.5 py-2.5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Crown className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{t.plusSeasonOneFree}</span>
              </div>
              <button
                type="button"
                onClick={onActivatePlusFree}
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-sm transition-colors hover:bg-amber-400 active:scale-95 whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.activatePlusFreeBtn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 sm:px-6">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTab('rewards')}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'rewards'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Award className="h-4 w-4 text-amber-500" />
              <span>{t.tabPassRewards}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('challenges')}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'challenges'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Target className="h-4 w-4 text-sky-500" />
              <span>{t.tabPassChallenges}</span>
              {claimableChallenges > 0 && (
                <span className="font-mono-num flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                  {claimableChallenges}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {tab === 'rewards' ? (
            <div className="space-y-2.5">
              {/* Track Column Headers */}
              <div className="grid grid-cols-11 gap-2 px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">{t.passFreeTrack}</div>
                <div className="col-span-5 flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Crown className="h-3.5 w-3.5" />
                  <span>{t.passPlusTrack}</span>
                </div>
              </div>

              {FREE_REWARDS.map((freeReward, idx) => {
                const tier = freeReward.tier;
                const plusReward = PLUS_REWARDS[idx];
                const unlocked = tier <= progress.tier;

                const freeClaimed = passState.claimedFree.includes(tier);
                const plusClaimed = passState.claimedPlus.includes(tier);
                const canClaimFree = unlocked && !freeClaimed;
                const canClaimPlus = unlocked && passState.hasPlus && !plusClaimed;

                return (
                  <div
                    key={tier}
                    className={`grid grid-cols-11 items-stretch gap-2 rounded-xl border p-2 transition-colors ${
                      unlocked
                        ? 'border-sky-200/80 bg-white/85 dark:border-sky-900/50 dark:bg-slate-900/85'
                        : 'border-slate-200/70 bg-slate-50/70 opacity-75 dark:border-slate-800 dark:bg-slate-950/40'
                    }`}
                  >
                    {/* Tier Badge */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span
                        className={`font-mono-num flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${
                          unlocked
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {tier}
                      </span>
                    </div>

                    {/* Free Track Card */}
                    <div className="col-span-5 flex flex-col justify-between gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2">
                        <RewardIcon reward={freeReward} />
                        <span className="line-clamp-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 sm:text-xs">
                          {lang === 'ckb' ? freeReward.labelCkb : freeReward.labelEn}
                        </span>
                      </div>

                      {freeClaimed ? (
                        <div className="flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.claimedLabel}</span>
                        </div>
                      ) : canClaimFree ? (
                        <button
                          type="button"
                          onClick={() => onClaimReward(tier, 'free')}
                          className="min-h-[34px] w-full rounded-lg bg-sky-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-sky-700 active:scale-95"
                        >
                          {t.claimBtn}
                        </button>
                      ) : (
                        <div className="flex min-h-[32px] items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                          <Lock className="h-3 w-3" />
                          <span>{t.lockedLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Plus Track Card */}
                    <div
                      className={`col-span-5 flex flex-col justify-between gap-2 rounded-lg border p-2 ${
                        plusReward.type === 'skin'
                          ? 'border-amber-400/70 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/25'
                          : 'border-amber-300/60 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/15'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RewardIcon reward={plusReward} />
                        <span className="line-clamp-2 text-[11px] font-bold text-slate-900 dark:text-amber-100 sm:text-xs">
                          {lang === 'ckb' ? plusReward.labelCkb : plusReward.labelEn}
                        </span>
                      </div>

                      {plusClaimed ? (
                        <div className="flex min-h-[32px] items-center justify-center gap-1 rounded-lg bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.claimedLabel}</span>
                        </div>
                      ) : canClaimPlus ? (
                        <button
                          type="button"
                          onClick={() => onClaimReward(tier, 'plus')}
                          className="min-h-[34px] w-full rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-extrabold text-slate-950 transition-colors hover:bg-amber-400 active:scale-95"
                        >
                          {t.claimBtn}
                        </button>
                      ) : (
                        <div className="flex min-h-[32px] items-center justify-center gap-1 text-[11px] font-medium text-amber-700/70 dark:text-amber-300/60">
                          <Lock className="h-3 w-3" />
                          <span>{t.lockedLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {PASS_CHALLENGES.map((ch) => {
                const st = getChallengeStatus(ch, passState);
                const pct = Math.min(100, Math.round((st.currentValue / st.targetValue) * 100));

                return (
                  <div
                    key={ch.id}
                    className="rounded-xl border border-slate-200/90 bg-white/85 p-3.5 dark:border-slate-800 dark:bg-slate-900/75"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang === 'ckb' ? ch.titleCkb : ch.titleEn}
                          </h3>
                          <span className="font-mono-num rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {t.challengeStage} {st.stageLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {lang === 'ckb' ? ch.descCkb : ch.descEn}
                        </p>
                      </div>

                      {!st.isCompletedAll && (
                        <span className="font-mono-num text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          +{st.rewardXp} Pass XP
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <span className="font-mono-num">
                            {Math.min(st.currentValue, st.targetValue)} / {st.targetValue}
                          </span>
                          <span className="font-mono-num">{pct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              st.canClaim ? 'bg-emerald-500' : 'bg-sky-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {st.isCompletedAll ? (
                        <div className="flex min-h-[40px] items-center gap-1 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.completedLabel}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!st.canClaim}
                          onClick={() => onClaimChallenge(ch.id)}
                          className="min-h-[42px] rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 whitespace-nowrap"
                        >
                          {t.claimBtn}
                        </button>
                      )}
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
