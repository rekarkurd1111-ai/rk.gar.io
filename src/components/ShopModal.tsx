import { useEffect, useState } from 'react';
import { X, Coins, Dna, Zap, Check, Sparkles, TrendingUp, ShoppingBag, Crown, ArrowUpCircle } from 'lucide-react';
import { Translations } from '../game/i18n';
import { BOOST_ITEMS, xpRequiredForLevel } from '../game/progression';
import { getSkinLevel, SKINS } from '../game/skins';
import { BoostId, Language, PlayerProfile, ShopTab, SkinId, SkinLevel } from '../game/types';
import { SkinPreview } from './SkinPreview';

type SkinFilterTab = 'all' | 'vip' | 'owned';

interface ShopModalProps {
  open: boolean;
  initialTab?: ShopTab;
  onClose: () => void;
  profile: PlayerProfile;
  equippedSkin: SkinId;
  lang: Language;
  t: Translations;
  onBuySkin: (skinId: SkinId) => void;
  onUpgradeSkin: (skinId: SkinId) => void;
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
  onUpgradeSkin,
  onEquipSkin,
  onBuyBoost,
  onOpenGamePass,
  onOpenEvent,
}: ShopModalProps) {
  const [tab, setTab] = useState<ShopTab>(initialTab);
  const [skinFilter, setSkinFilter] = useState<SkinFilterTab>('all');
  const [previewLevels, setPreviewLevels] = useState<Partial<Record<SkinId, SkinLevel>>>({});

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setPreviewLevels({});
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

  const filteredSkins = SKINS.filter((skin) => {
    if (skinFilter === 'vip') return Boolean(skin.isVip);
    if (skinFilter === 'owned') return profile.unlockedSkins.includes(skin.id);
    return true;
  });

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

          {tab === 'skins' && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/80">
                {(['all', 'vip', 'owned'] as SkinFilterTab[]).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setSkinFilter(filterKey)}
                    className={`min-h-[34px] rounded-lg px-2 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                      skinFilter === filterKey
                        ? filterKey === 'vip'
                          ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-sm'
                          : 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {filterKey === 'all'
                      ? t.skinCatAll
                      : filterKey === 'vip'
                      ? t.skinCatVip
                      : t.skinCatOwned}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          {tab === 'skins' ? (
            <div className="space-y-3">
              {(skinFilter === 'vip' || skinFilter === 'all') && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-50/90 via-fuchsia-50/70 to-sky-50/90 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-amber-500/35 dark:from-amber-950/35 dark:via-fuchsia-950/30 dark:to-sky-950/35 dark:text-amber-100">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{t.vipLv3PerkHint}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredSkins.map((skin) => {
                  const owned = profile.unlockedSkins.includes(skin.id);
                  const equipped = equippedSkin === skin.id;
                  const currentLevel = owned ? getSkinLevel(profile.skinLevels, skin.id) : 1;
                  const shownLevel: SkinLevel = skin.isVip
                    ? previewLevels[skin.id] ?? (owned ? currentLevel : 3)
                    : 1;

                  const canAffordBuy =
                    skin.currency === 'dna'
                      ? profile.dna >= skin.price
                      : profile.coins >= skin.price;

                  const nextLevel = currentLevel < 3 ? ((currentLevel + 1) as SkinLevel) : null;
                  const upgradePrice =
                    nextLevel === 2
                      ? skin.upgradeLv2Price ?? 400
                      : nextLevel === 3
                      ? skin.upgradeLv3Price ?? 40
                      : 0;
                  const upgradeCurrency =
                    nextLevel === 2
                      ? skin.upgradeLv2Currency ?? 'coins'
                      : skin.upgradeLv3Currency ?? 'dna';
                  const canAffordUpgrade =
                    upgradeCurrency === 'dna'
                      ? profile.dna >= upgradePrice
                      : profile.coins >= upgradePrice;

                  return (
                    <div
                      key={skin.id}
                      className={`relative flex flex-col items-center justify-between rounded-xl border p-3.5 transition-colors ${
                        equipped
                          ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30'
                          : skin.isVip
                          ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/50 via-white/80 to-fuchsia-50/40 dark:border-amber-500/40 dark:from-amber-950/20 dark:via-slate-900/75 dark:to-fuchsia-950/20'
                          : 'border-slate-200/90 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60'
                      }`}
                    >
                      {skin.isVip && (
                        <div className="mb-1.5 flex w-full items-center justify-between gap-1 text-[10px] font-extrabold">
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-amber-500 to-fuchsia-600 px-1.5 py-0.5 text-white shadow-xs">
                            <Crown className="h-2.5 w-2.5" />
                            <span>{t.vipBadge}</span>
                          </span>
                          <span className="font-mono-num text-slate-600 dark:text-slate-300">
                            {owned ? `${t.skinLevelLabel} ${currentLevel}/3` : `${t.skinLevelLabel} 1-3`}
                          </span>
                        </div>
                      )}

                      <SkinPreview skinId={skin.id} size={skin.isVip ? 62 : 54} skinLevel={shownLevel} />

                      {skin.isVip && (
                        <div className="mt-1.5 flex items-center gap-1">
                          {([1, 2, 3] as SkinLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() =>
                                setPreviewLevels((prev) => ({
                                  ...prev,
                                  [skin.id]: lvl,
                                }))
                              }
                              className={`rounded-md px-1.5 py-0.5 font-mono-num text-[10px] font-bold transition-colors ${
                                shownLevel === lvl
                                  ? lvl === 3
                                    ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white'
                                    : 'bg-sky-600 text-white'
                                  : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300/80 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              Lv.{lvl}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-center">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang === 'ckb' ? skin.nameCkb : skin.nameEn}
                        </div>
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {owned && skin.isVip ? (
                            currentLevel === 3 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                <Sparkles className="h-3 w-3" />
                                <span>{t.maxLevelLabel}</span>
                              </span>
                            ) : (
                              <span className="font-mono-num font-semibold text-amber-600 dark:text-amber-400">
                                Lv.{nextLevel}: {upgradePrice} {upgradeCurrency === 'dna' ? 'DNA' : t.coinsLabel}
                              </span>
                            )
                          ) : skin.id === 'nexus_titan' ? (
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

                      <div className="mt-2.5 w-full space-y-1.5">
                        {equipped ? (
                          <div className="flex min-h-[36px] w-full items-center justify-center gap-1 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                            <Check className="h-3.5 w-3.5" />
                            <span>{t.equippedLabel}</span>
                          </div>
                        ) : owned ? (
                          <button
                            type="button"
                            onClick={() => onEquipSkin(skin.id)}
                            className="min-h-[36px] w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
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
                            className="min-h-[36px] w-full rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-extrabold text-white transition-colors hover:bg-sky-600"
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
                            className="min-h-[36px] w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 transition-colors hover:bg-amber-400"
                          >
                            {t.gamePassBtn}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAffordBuy}
                            onClick={() => onBuySkin(skin.id)}
                            className="min-h-[36px] w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                          >
                            {t.buyBtn}
                          </button>
                        )}

                        {owned && skin.isVip && nextLevel && (
                          <button
                            type="button"
                            disabled={!canAffordUpgrade}
                            onClick={() => {
                              onUpgradeSkin(skin.id);
                              setPreviewLevels((prev) => ({
                                ...prev,
                                [skin.id]: nextLevel,
                              }));
                            }}
                            className="flex min-h-[34px] w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500 dark:disabled:from-slate-800 dark:disabled:to-slate-800 dark:disabled:text-slate-500"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {nextLevel === 2 ? t.upgradeToLv2Btn : t.upgradeToLv3Btn}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
