import { useEffect, useState } from 'react';
import { X, Coins, Dna, Zap, Check, Sparkles, TrendingUp, ShoppingBag } from 'lucide-react';
import { Translations } from '../game/i18n';
import { BOOST_ITEMS, xpRequiredForLevel } from '../game/progression';
import { SKINS } from '../game/skins';
import { BoostId, Language, PlayerProfile, ShopTab, SkinId } from '../game/types';
import { SkinPreview } from './SkinPreview';

interface ShopModalProps {
  open: boolean;
  initialTab?: ShopTab;
  onClose: () => void;
  profile: PlayerProfile;
  equippedSkin: SkinId;
  lang: Language;
  t: Translations;
  onBuySkin: (skinId: SkinId) => void;
  onEquipSkin: (skinId: SkinId) => void;
  onBuyBoost: (boostId: BoostId) => void;
  onOpenGamePass: () => void;
  onOpenEvent: () => void;
}

export function ShopModal({
  open,
  initialTab = 'skins',
  onClose,
  profile,
  equippedSkin,
  lang,
  t,
  onBuySkin,
  onEquipSkin,
  onBuyBoost,
  onOpenGamePass,
  onOpenEvent,
}: ShopModalProps) {
  const [tab, setTab] = useState<ShopTab>(initialTab);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const neededXp = xpRequiredForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / neededXp) * 100));

  const getActiveCharges = (id: BoostId): number => {
    switch (id) {
      case 'level_boost_2x':
        return profile.boosts.levelBoost2x;
      case 'level_boost_3x':
        return profile.boosts.levelBoost3x;
      case 'coin_boost_2x':
        return profile.boosts.coinBoost2x;
      case 'start_mass_boost':
        return profile.boosts.startMassBoost;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-modal-enter flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-white/94 shadow-2xl backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/94">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                {t.shopTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.shopSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Currency & Level Progress Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6 sm:py-3">
          <div className="flex items-center gap-4 text-sm sm:gap-5">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <Coins className="h-4 w-4" />
              <span className="font-mono-num">{profile.coins}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.coinsLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <Dna className="h-4 w-4" />
              <span className="font-mono-num">{profile.dna}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.dnaLabel}
              </span>
            </div>

            <div className="hidden items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 sm:flex">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              <span className="font-mono-num">{profile.score}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.totalScore}
              </span>
            </div>
          </div>

          {/* Level & XP Bar */}
          <div className="flex min-w-[160px] flex-1 flex-col gap-1 sm:max-w-[230px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {t.levelLabel} {profile.level}
              </span>
              <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
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

        {/* Shop Category Tabs */}
        <div className="px-4 pt-3.5 sm:px-6 sm:pt-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTab('skins')}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'skins'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t.tabSkins}
            </button>
            <button
              type="button"
              onClick={() => setTab('boosts')}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'boosts'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t.tabBoosts}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {tab === 'skins' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SKINS.map((skin) => {
                const owned = profile.unlockedSkins.includes(skin.id);
                const equipped = equippedSkin === skin.id;
                const canAfford =
                  skin.currency === 'dna'
                    ? profile.dna >= skin.price
                    : profile.coins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col items-center justify-between rounded-xl border p-3.5 transition-colors ${
                      equipped
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30'
                        : 'border-slate-200/90 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60'
                    }`}
                  >
                    <SkinPreview skinId={skin.id} size={54} />
                    <div className="mt-2.5 text-center">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {lang === 'ckb' ? skin.nameCkb : skin.nameEn}
                      </div>
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        {skin.id === 'nexus_titan' ? (
                          <span className="font-semibold text-sky-600 dark:text-sky-400">
                            {t.eventBtn}
                          </span>
                        ) : skin.seasonExclusive ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {t.seasonExclusiveTag}
                          </span>
                        ) : skin.price === 0 ? (
                          <span>{t.freeLabel}</span>
                        ) : skin.currency === 'dna' ? (
                          <>
                            <Dna className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                              {skin.price} DNA
                            </span>
                          </>
                        ) : (
                          <>
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-mono-num font-semibold text-amber-600 dark:text-amber-400">
                              {skin.price}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 w-full">
                      {equipped ? (
                        <div className="flex min-h-[38px] w-full items-center justify-center gap-1 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                          <Check className="h-3.5 w-3.5" />
                          <span>{t.equippedLabel}</span>
                        </div>
                      ) : owned ? (
                        <button
                          type="button"
                          onClick={() => onEquipSkin(skin.id)}
                          className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                          {t.equipBtn}
                        </button>
                      ) : skin.id === 'nexus_titan' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEvent();
                          }}
                          className="min-h-[38px] w-full rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-extrabold text-white transition-colors hover:bg-sky-600"
                        >
                          {t.eventBtn}
                        </button>
                      ) : skin.seasonExclusive ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenGamePass();
                          }}
                          className="min-h-[38px] w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition-colors hover:bg-amber-400"
                        >
                          {t.gamePassBtn}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuySkin(skin.id)}
                          className="min-h-[38px] w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                        >
                          {t.buyBtn}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {BOOST_ITEMS.map((item) => {
                const canAfford =
                  item.currency === 'dna'
                    ? profile.dna >= item.price
                    : profile.coins >= item.price;
                const activeCharges = getActiveCharges(item.id);
                const isInstant = item.charges === 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          item.currency === 'dna'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isInstant ? <Sparkles className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {lang === 'ckb' ? item.nameCkb : item.nameEn}
                          </h3>
                          {activeCharges > 0 && (
                            <span className="font-mono-num text-xs font-semibold text-sky-600 dark:text-sky-400">
                              · {activeCharges} {t.activeMatchesLeft}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {lang === 'ckb' ? item.descCkb : item.descEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="flex items-center gap-1 text-sm font-bold">
                        {item.currency === 'dna' ? (
                          <>
                            <Dna className="h-4 w-4 text-emerald-500" />
                            <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                              {item.price}
                            </span>
                          </>
                        ) : (
                          <>
                            <Coins className="h-4 w-4 text-amber-500" />
                            <span className="font-mono-num text-amber-600 dark:text-amber-400">
                              {item.price}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyBoost(item.id)}
                        className="min-h-[40px] rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 whitespace-nowrap"
                      >
                        {t.buyBtn}
                      </button>
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
