import { useState } from 'react';
import {
  Ban,
  Bot,
  Coins,
  Crown,
  Dna,
  Flame,
  Gift,
  Magnet,
  Megaphone,
  Merge,
  Palette,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { formatPlayerCodeDisplay, normalizePlayerCode } from '../game/accountService';
import { Translations } from '../game/i18n';
import {
  BannedPlayerRecord,
  GameMode,
  LiveServerPlayer,
  OwnerAnnouncement,
  OwnerPowers,
  PublicPlayerProfile,
} from '../game/types';
import { SkinPreview } from './SkinPreview';

type OwnerTab = 'self' | 'arena' | 'kick' | 'give';

interface OwnerMenuModalProps {
  open: boolean;
  onClose: () => void;
  livePlayers: LiveServerPlayer[];
  cloudPlayers: PublicPlayerProfile[];
  bannedPlayers: BannedPlayerRecord[];
  activeAnnouncement: OwnerAnnouncement | null;
  ownerPowers: OwnerPowers;
  currentMode: GameMode;
  loadingPlayers: boolean;
  inMatch: boolean;
  isOnlineMatch: boolean;
  t: Translations;
  onRefreshPlayers: () => void;
  onAddSelfCurrency: (coins: number, dna: number) => void;
  onAddSelfXp: (xp: number) => void;
  onUnlockAllSkins: () => void;
  onRefillAllBoosts: () => void;
  onChangeOwnerPowers: (next: OwnerPowers) => Promise<void>;
  onInstantMerge: () => Promise<boolean>;
  onBoostMyMass: (amount: number) => Promise<boolean>;
  onArenaAction: (
    action: 'golden_rain' | 'spawn_bots' | 'reset_bots' | 'set_mode' | 'broadcast' | 'clear_broadcast',
    payload?: { mode?: GameMode; text?: string }
  ) => Promise<boolean>;
  onKickPlayer: (target: { connectionId?: string; playerCode?: string }) => Promise<boolean>;
  onModeratePlayer: (
    action: 'ban' | 'unban' | 'halve_mass' | 'pull_to_me',
    target: { connectionId?: string; uid?: string; playerCode?: string; name?: string }
  ) => Promise<boolean>;
  onGrantPlayerCurrency: (target: {
    connectionId?: string;
    uid?: string;
    playerCode?: string;
    coins: number;
    dna: number;
  }) => Promise<boolean>;
  onGrantLiveMass: (connectionId: string, amount: number) => Promise<boolean>;
  onGrantAllOnline: (coins: number, dna: number) => Promise<boolean>;
}

export function OwnerMenuModal({
  open,
  onClose,
  livePlayers,
  cloudPlayers,
  bannedPlayers,
  activeAnnouncement,
  ownerPowers,
  currentMode,
  loadingPlayers,
  inMatch,
  isOnlineMatch,
  t,
  onRefreshPlayers,
  onAddSelfCurrency,
  onAddSelfXp,
  onUnlockAllSkins,
  onRefillAllBoosts,
  onChangeOwnerPowers,
  onInstantMerge,
  onBoostMyMass,
  onArenaAction,
  onKickPlayer,
  onModeratePlayer,
  onGrantPlayerCurrency,
  onGrantLiveMass,
  onGrantAllOnline,
}: OwnerMenuModalProps) {
  const [tab, setTab] = useState<OwnerTab>('self');
  const [customCoins, setCustomCoins] = useState('5000');
  const [customDna, setCustomDna] = useState('250');
  const [customXp, setCustomXp] = useState('2500');
  const [customMass, setCustomMass] = useState('1000');

  const [announcementText, setAnnouncementText] = useState('');

  const [manualKickCode, setManualKickCode] = useState('');
  const [giveTargetCode, setGiveTargetCode] = useState('');
  const [giveTargetUid, setGiveTargetUid] = useState('');
  const [giveTargetConnId, setGiveTargetConnId] = useState('');
  const [giveCoins, setGiveCoins] = useState('1000');
  const [giveDna, setGiveDna] = useState('100');
  const [giveMassAmount, setGiveMassAmount] = useState('1000');
  const [giftAllCoins, setGiftAllCoins] = useState('500');
  const [giftAllDna, setGiftAllDna] = useState('50');

  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const flashStatus = (msg: string) => {
    setStatusFeedback(msg);
    window.setTimeout(() => {
      setStatusFeedback((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const togglePower = async (key: 'godMode' | 'virusShield' | 'foodMagnet' | 'autoFastMerge') => {
    const next: OwnerPowers = { ...ownerPowers, [key]: !ownerPowers[key] };
    await onChangeOwnerPowers(next);
  };

  const setSpeedPower = async (speed: 1 | 1.5 | 2.2) => {
    await onChangeOwnerPowers({ ...ownerPowers, speedMultiplier: speed });
  };

  const handleInstantMergeClick = async () => {
    if (!inMatch || busy) return;
    setBusy(true);
    const ok = await onInstantMerge();
    setBusy(false);
    if (ok) flashStatus(t.instantMergeBtn);
  };

  const handleSelfMassBoost = async (amount: number) => {
    if (amount <= 0 || busy) return;
    setBusy(true);
    const ok = await onBoostMyMass(amount);
    setBusy(false);
    if (ok) flashStatus(t.massBoostSuccessText);
  };

  const handleKick = async (target: { connectionId?: string; playerCode?: string }) => {
    if (busy) return;
    setBusy(true);
    const ok = await onKickPlayer(target);
    setBusy(false);
    if (ok) {
      flashStatus(t.kickedSuccessText);
      onRefreshPlayers();
    }
  };

  const handleModerate = async (
    action: 'ban' | 'unban' | 'halve_mass' | 'pull_to_me',
    target: { connectionId?: string; uid?: string; playerCode?: string; name?: string },
    successMsg: string
  ) => {
    if (busy) return;
    setBusy(true);
    const ok = await onModeratePlayer(action, target);
    setBusy(false);
    if (ok) {
      flashStatus(successMsg);
      onRefreshPlayers();
    }
  };

  const handleArenaTrigger = async (
    action: 'golden_rain' | 'spawn_bots' | 'reset_bots' | 'set_mode' | 'broadcast' | 'clear_broadcast',
    successMsg: string,
    payload?: { mode?: GameMode; text?: string }
  ) => {
    if (busy) return;
    setBusy(true);
    const ok = await onArenaAction(action, payload);
    setBusy(false);
    if (ok) {
      flashStatus(successMsg);
      if (action === 'broadcast') setAnnouncementText('');
      onRefreshPlayers();
    }
  };

  const handleGive = async () => {
    if (busy) return;
    const coins = Math.max(0, Math.round(Number(giveCoins) || 0));
    const dna = Math.max(0, Math.round(Number(giveDna) || 0));
    if (coins === 0 && dna === 0) return;

    const cleanCode = normalizePlayerCode(giveTargetCode);
    if (!cleanCode && !giveTargetUid && !giveTargetConnId) return;

    setBusy(true);
    const ok = await onGrantPlayerCurrency({
      connectionId: giveTargetConnId || undefined,
      uid: giveTargetUid || undefined,
      playerCode: cleanCode || undefined,
      coins,
      dna,
    });
    setBusy(false);
    if (ok) flashStatus(t.grantSentText);
  };

  const handleGiveMass = async () => {
    if (busy || !giveTargetConnId) return;
    const amt = Math.max(10, Math.round(Number(giveMassAmount) || 0));
    setBusy(true);
    const ok = await onGrantLiveMass(giveTargetConnId, amt);
    setBusy(false);
    if (ok) {
      flashStatus(t.massSentText);
      onRefreshPlayers();
    }
  };

  const handleGiftAllOnlineClick = async () => {
    if (busy) return;
    const coins = Math.max(0, Math.round(Number(giftAllCoins) || 0));
    const dna = Math.max(0, Math.round(Number(giftAllDna) || 0));
    if (coins === 0 && dna === 0) return;
    setBusy(true);
    const ok = await onGrantAllOnline(coins, dna);
    setBusy(false);
    if (ok) flashStatus(t.giftAllSentText);
  };

  const selectRecipient = (opts: {
    playerCode: string;
    uid: string;
    connectionId?: string;
  }) => {
    setGiveTargetCode(formatPlayerCodeDisplay(opts.playerCode));
    setGiveTargetUid(opts.uid);
    setGiveTargetConnId(opts.connectionId || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-400/50 bg-white/96 shadow-2xl backdrop-blur-xl dark:border-amber-500/40 dark:bg-slate-900/96">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-transparent px-4 py-3.5 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 shadow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
                {t.ownerMenuTitle}
              </h2>
              <p dir="ltr" className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                rekarkurd1111@gmail.com
              </p>
            </div>
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

        {/* Navigation Tabs (4 Tabs) */}
        <div className="border-b border-slate-200/70 px-3 py-2.5 dark:border-slate-800 sm:px-6">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setTab('self')}
              className={`flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap sm:text-xs ${
                tab === 'self'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500 sm:h-4 sm:w-4" />
              <span className="truncate">{t.ownerTabSelf}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('arena');
                onRefreshPlayers();
              }}
              className={`flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap sm:text-xs ${
                tab === 'arena'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Crown className="h-3.5 w-3.5 shrink-0 text-purple-500 sm:h-4 sm:w-4" />
              <span className="truncate">{t.ownerTabArena}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('kick');
                onRefreshPlayers();
              }}
              className={`flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap sm:text-xs ${
                tab === 'kick'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserX className="h-3.5 w-3.5 shrink-0 text-rose-500 sm:h-4 sm:w-4" />
              <span className="truncate">{t.ownerTabKick}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('give');
                onRefreshPlayers();
              }}
              className={`flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap sm:text-xs ${
                tab === 'give'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Gift className="h-3.5 w-3.5 shrink-0 text-emerald-500 sm:h-4 sm:w-4" />
              <span className="truncate">{t.ownerTabGive}</span>
            </button>
          </div>
        </div>

        {statusFeedback && (
          <div className="mx-4 mt-3 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-3 py-2 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300 sm:mx-6">
            {statusFeedback}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 sm:px-6">
          {tab === 'self' && (
            <div className="space-y-4">
              {/* Owner Live Powers */}
              <div className="rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50/85 to-orange-50/70 p-4 dark:border-amber-700/60 dark:from-amber-950/30 dark:to-orange-950/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <span>{t.ownerPowersLabel}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!inMatch || busy}
                    onClick={() => void handleInstantMergeClick()}
                    className="flex min-h-[34px] items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-extrabold text-white transition-colors hover:bg-indigo-700 disabled:opacity-45 whitespace-nowrap"
                  >
                    <Merge className="h-3.5 w-3.5" />
                    <span>{t.instantMergeBtn}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void togglePower('godMode')}
                    className={`flex min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      ownerPowers.godMode
                        ? 'border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-200'
                        : 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <span>{t.godModeLabel}</span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${ownerPowers.godMode ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void togglePower('virusShield')}
                    className={`flex min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      ownerPowers.virusShield
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>{t.virusShieldLabel}</span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${ownerPowers.virusShield ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void togglePower('foodMagnet')}
                    className={`flex min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      ownerPowers.foodMagnet
                        ? 'border-sky-500 bg-sky-500/20 text-sky-900 dark:text-sky-200'
                        : 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Magnet className="h-4 w-4 text-sky-500" />
                      <span>{t.foodMagnetLabel}</span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${ownerPowers.foodMagnet ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void togglePower('autoFastMerge')}
                    className={`flex min-h-[42px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      ownerPowers.autoFastMerge
                        ? 'border-purple-500 bg-purple-500/20 text-purple-900 dark:text-purple-200'
                        : 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Merge className="h-4 w-4 text-purple-500" />
                      <span>{t.autoFastMergeLabel}</span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full ${ownerPowers.autoFastMerge ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </button>
                </div>

                {/* Speed Selector */}
                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>{t.speedBoostLabel}</span>
                  </span>
                  <div className="flex gap-1.5">
                    {([1, 1.5, 2.2] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => void setSpeedPower(spd)}
                        className={`font-mono-num min-h-[34px] rounded-lg px-3 py-1 text-xs font-black transition-colors ${
                          ownerPowers.speedMultiplier === spd
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Boost Live Mass */}
              <div className="rounded-2xl border border-sky-300/70 bg-sky-50/75 p-4 dark:border-sky-800/60 dark:bg-sky-950/35">
                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Scale className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  <span>{t.boostMyMassLabel}</span>
                </div>
                {!inMatch && (
                  <p className="mb-2.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {t.enterMatchHint}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={!inMatch || busy}
                      onClick={() => void handleSelfMassBoost(amt)}
                      className="font-mono-num min-h-[40px] rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-black text-white transition-transform hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={100000}
                      value={customMass}
                      onChange={(e) => setCustomMass(e.target.value)}
                      placeholder={t.customAmountPlaceholder}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                    />
                    <button
                      type="button"
                      disabled={!inMatch || busy}
                      onClick={() => void handleSelfMassBoost(Math.max(10, Number(customMass) || 0))}
                      className="min-h-[40px] rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
                    >
                      +{t.mass}
                    </button>
                  </div>
                </div>
              </div>

              {/* Self Coins */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-white">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span>{t.addSelfCoinsLabel}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        onAddSelfCurrency(amt, 0);
                        flashStatus(t.grantSentText);
                      }}
                      className="font-mono-num min-h-[40px] rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 transition-transform hover:brightness-105 active:scale-95"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={customCoins}
                      onChange={(e) => setCustomCoins(e.target.value)}
                      placeholder={t.customAmountPlaceholder}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(0, Math.round(Number(customCoins) || 0));
                        if (v > 0) {
                          onAddSelfCurrency(v, 0);
                          flashStatus(t.grantSentText);
                        }
                      }}
                      className="min-h-[40px] rounded-xl bg-slate-900 px-3 text-xs font-bold text-white dark:bg-amber-400 dark:text-slate-950 whitespace-nowrap"
                    >
                      +{t.coinsLabel}
                    </button>
                  </div>
                </div>
              </div>

              {/* Self DNA */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-white">
                  <Dna className="h-4 w-4 text-emerald-500" />
                  <span>{t.addSelfDnaLabel}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[100, 500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        onAddSelfCurrency(0, amt);
                        flashStatus(t.grantSentText);
                      }}
                      className="font-mono-num min-h-[40px] rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-white transition-transform hover:brightness-105 active:scale-95"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                  <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={customDna}
                      onChange={(e) => setCustomDna(e.target.value)}
                      placeholder={t.customAmountPlaceholder}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(0, Math.round(Number(customDna) || 0));
                        if (v > 0) {
                          onAddSelfCurrency(0, v);
                          flashStatus(t.grantSentText);
                        }
                      }}
                      className="min-h-[40px] rounded-xl bg-slate-900 px-3 text-xs font-bold text-white dark:bg-emerald-500 dark:text-white whitespace-nowrap"
                    >
                      +{t.dnaLabel}
                    </button>
                  </div>
                </div>
              </div>

              {/* Self XP & Unlock All Skins / Refill Boosts */}
              <div className="rounded-2xl border border-purple-300/70 bg-purple-50/70 p-4 dark:border-purple-800/60 dark:bg-purple-950/30">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <span>{t.addSelfXpLabel}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[500, 2500, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        onAddSelfXp(amt);
                        flashStatus(t.xpAddedText);
                      }}
                      className="font-mono-num min-h-[40px] rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-black text-white transition-transform hover:bg-purple-700 active:scale-95"
                    >
                      +{amt.toLocaleString()} XP
                    </button>
                  ))}
                  <div className="flex min-w-[160px] flex-1 items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={customXp}
                      onChange={(e) => setCustomXp(e.target.value)}
                      placeholder={t.customAmountPlaceholder}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = Math.max(0, Math.round(Number(customXp) || 0));
                        if (v > 0) {
                          onAddSelfXp(v);
                          flashStatus(t.xpAddedText);
                        }
                      }}
                      className="min-h-[40px] rounded-xl bg-slate-900 px-3 text-xs font-bold text-white dark:bg-purple-500 whitespace-nowrap"
                    >
                      +XP
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUnlockAllSkins();
                      flashStatus(t.allSkinsUnlockedText);
                    }}
                    className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition-transform hover:brightness-105 active:scale-95"
                  >
                    <Palette className="h-4 w-4" />
                    <span>{t.unlockAllSkinsBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefillAllBoosts();
                      flashStatus(t.boostsRefilledText);
                    }}
                    className="flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-xs font-black text-white shadow-sm transition-transform hover:brightness-105 active:scale-95"
                  >
                    <Zap className="h-4 w-4" />
                    <span>{t.refillBoostsBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'arena' && (
            <div className="space-y-4">
              {/* Broadcast Owner Announcement */}
              <div className="rounded-2xl border border-amber-300/80 bg-amber-50/75 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>{t.ownerAnnouncementLabel}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={140}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder={t.announcementPlaceholder}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-base font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                  />
                  <button
                    type="button"
                    disabled={!announcementText.trim() || busy}
                    onClick={() =>
                      void handleArenaTrigger('broadcast', t.announcementSentText, {
                        text: announcementText.trim(),
                      })
                    }
                    className="min-h-[44px] rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap"
                  >
                    {t.sendAnnouncementBtn}
                  </button>
                </div>
                {activeAnnouncement && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-400/60 bg-white/80 px-3 py-2 text-xs font-bold text-slate-800 dark:bg-slate-900/70 dark:text-slate-100">
                    <span className="truncate">{activeAnnouncement.text}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handleArenaTrigger('clear_broadcast', t.clearAnnouncementBtn)
                      }
                      className="flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1 text-[11px] font-extrabold text-rose-600 hover:bg-rose-500/25 dark:text-rose-400 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.clearAnnouncementBtn}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Golden Rain & Bots */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                {!inMatch && (
                  <p className="mb-2.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {t.enterMatchHint}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={!inMatch || busy}
                    onClick={() => void handleArenaTrigger('golden_rain', t.goldenRainDoneText)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 transition-transform hover:brightness-105 active:scale-95 disabled:opacity-45"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t.goldenRainBtn}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!inMatch || busy}
                    onClick={() => void handleArenaTrigger('spawn_bots', t.botsSpawnedText)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white transition-transform hover:bg-sky-700 active:scale-95 disabled:opacity-45"
                  >
                    <Bot className="h-4 w-4" />
                    <span>{t.spawnProBotsBtn}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!inMatch || busy}
                    onClick={() => void handleArenaTrigger('reset_bots', t.botsResetText)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-white transition-transform hover:bg-slate-900 active:scale-95 disabled:opacity-45 dark:bg-slate-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>{t.resetBotsBtn}</span>
                  </button>
                </div>
              </div>

              {/* Live Mode Switch */}
              <div className="rounded-2xl border border-indigo-300/70 bg-indigo-50/70 p-4 dark:border-indigo-800/60 dark:bg-indigo-950/30">
                <div className="mb-2.5 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Zap className="h-4 w-4 text-indigo-500" />
                  <span>{t.liveModeSwitchLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['classic', 'blitz', 'relaxed', 'merge'] as GameMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={busy || (isOnlineMatch && !inMatch)}
                      onClick={() =>
                        void handleArenaTrigger('set_mode', t.modeSwitchedText, { mode })
                      }
                      className={`min-h-[40px] rounded-xl border px-3 py-2 text-xs font-extrabold transition-colors ${
                        currentMode === mode
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {t.modes[mode].title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'kick' && (
            <div className="space-y-4">
              {/* Manual Kick / Ban by Player ID */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={manualKickCode}
                  onChange={(e) => setManualKickCode(e.target.value)}
                  placeholder={t.targetPlayerIdPlaceholder}
                  className="h-11 min-w-[180px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-base font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-xs"
                />
                <button
                  type="button"
                  disabled={!manualKickCode.trim() || busy}
                  onClick={() => void handleKick({ playerCode: manualKickCode })}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-extrabold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
                >
                  <UserX className="h-4 w-4" />
                  <span>{t.kickBtn}</span>
                </button>
                <button
                  type="button"
                  disabled={!manualKickCode.trim() || busy}
                  onClick={() =>
                    void handleModerate(
                      'ban',
                      { playerCode: manualKickCode },
                      t.bannedSuccessText
                    )
                  }
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-rose-900 whitespace-nowrap"
                >
                  <Ban className="h-4 w-4" />
                  <span>{t.banBtn}</span>
                </button>
              </div>

              {/* Live Connected Players */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {t.livePlayersLabel} ({livePlayers.length})
                </h3>
                <button
                  type="button"
                  disabled={loadingPlayers}
                  onClick={onRefreshPlayers}
                  className="flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingPlayers ? 'animate-spin' : ''}`} />
                  <span>{t.refreshBtn}</span>
                </button>
              </div>

              <div className="space-y-2">
                {livePlayers.map((lp) => (
                  <div
                    key={lp.connectionId}
                    className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <SkinPreview skinId={lp.skinId} size={34} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                          {lp.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          {lp.playerCode && (
                            <span dir="ltr" className="font-mono-num font-bold">
                              {formatPlayerCodeDisplay(lp.playerCode)}
                            </span>
                          )}
                          <span>{lp.roomId ? `Room: ${lp.roomId}` : 'Menu'}</span>
                          {lp.mass > 0 && (
                            <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                              {t.mass}: {lp.mass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {lp.inMatch && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void handleModerate(
                                'pull_to_me',
                                { connectionId: lp.connectionId },
                                t.pulledToMeText
                              )
                            }
                            className="flex min-h-[34px] items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-extrabold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>{t.pullToMeBtn}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void handleModerate(
                                'halve_mass',
                                { connectionId: lp.connectionId },
                                t.massHalvedText
                              )
                            }
                            className="flex min-h-[34px] items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Scale className="h-3.5 w-3.5" />
                            <span>{t.halveMassBtn}</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handleKick({
                            connectionId: lp.connectionId,
                            playerCode: lp.playerCode || undefined,
                          })
                        }
                        className="flex min-h-[34px] items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>{t.kickBtn}</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void handleModerate(
                            'ban',
                            {
                              connectionId: lp.connectionId,
                              uid: lp.uid || undefined,
                              playerCode: lp.playerCode || undefined,
                              name: lp.name,
                            },
                            t.bannedSuccessText
                          )
                        }
                        className="flex min-h-[34px] items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-rose-950 whitespace-nowrap"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>{t.banBtn}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banned Players */}
              {bannedPlayers.length > 0 && (
                <div className="pt-2">
                  <h3 className="mb-2 text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    {t.bannedPlayersLabel} ({bannedPlayers.length})
                  </h3>
                  <div className="space-y-1.5">
                    {bannedPlayers.map((bp, idx) => (
                      <div
                        key={`${bp.playerCode}_${bp.uid}_${idx}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-rose-300/60 bg-rose-50/70 px-3 py-2 dark:border-rose-800/50 dark:bg-rose-950/25"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                            {bp.name}
                          </div>
                          {bp.playerCode && (
                            <div dir="ltr" className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              {formatPlayerCodeDisplay(bp.playerCode)}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void handleModerate(
                              'unban',
                              { playerCode: bp.playerCode, uid: bp.uid },
                              t.unbannedSuccessText
                            )
                          }
                          className="flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-700"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{t.unbanBtn}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'give' && (
            <div className="space-y-4">
              {/* Give All Online Drop */}
              <div className="rounded-2xl border border-amber-300/70 bg-amber-50/75 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span>{t.giftAllOnlineTitle}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={giftAllCoins}
                    onChange={(e) => setGiftAllCoins(e.target.value)}
                    placeholder={t.coinsLabel}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={giftAllDna}
                    onChange={(e) => setGiftAllDna(e.target.value)}
                    placeholder={t.dnaLabel}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleGiftAllOnlineClick()}
                  className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  <Gift className="h-4 w-4" />
                  <span>{t.giftAllOnlineBtn}</span>
                </button>
              </div>

              {/* Target & Currency / Mass Form */}
              <div className="rounded-2xl border border-emerald-300/70 bg-emerald-50/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={giveTargetCode}
                    onChange={(e) => {
                      setGiveTargetCode(e.target.value);
                      setGiveTargetUid('');
                      setGiveTargetConnId('');
                    }}
                    placeholder={t.targetPlayerIdPlaceholder}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {t.coinsLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={giveCoins}
                        onChange={(e) => setGiveCoins(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {t.dnaLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={giveDna}
                        onChange={(e) => setGiveDna(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy || (!giveTargetCode.trim() && !giveTargetUid && !giveTargetConnId)}
                    onClick={() => void handleGive()}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Gift className="h-4 w-4" />
                    <span>{t.giveCurrencyBtn}</span>
                  </button>

                  {giveTargetConnId && (
                    <div className="flex items-center gap-2 border-t border-emerald-300/50 pt-2.5 dark:border-emerald-800/50">
                      <input
                        type="number"
                        min={10}
                        max={50000}
                        value={giveMassAmount}
                        onChange={(e) => setGiveMassAmount(e.target.value)}
                        placeholder={t.giftLiveMassLabel}
                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:text-xs"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleGiveMass()}
                        className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 text-xs font-black text-white hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        <Scale className="h-3.5 w-3.5" />
                        <span>{t.sendMassBtn}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Pick: Live Players + Cloud Players */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {t.livePlayersLabel} ({livePlayers.length})
                </h3>
                <button
                  type="button"
                  disabled={loadingPlayers}
                  onClick={onRefreshPlayers}
                  className="flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingPlayers ? 'animate-spin' : ''}`} />
                  <span>{t.refreshBtn}</span>
                </button>
              </div>

              <div className="space-y-2">
                {livePlayers.map((lp) => (
                  <button
                    key={lp.connectionId}
                    type="button"
                    onClick={() =>
                      selectRecipient({
                        playerCode: lp.playerCode,
                        uid: lp.uid,
                        connectionId: lp.connectionId,
                      })
                    }
                    className={`flex w-full items-center justify-between gap-2.5 rounded-xl border p-2.5 text-start transition-colors ${
                      giveTargetConnId === lp.connectionId
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'border-slate-200 bg-white hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <SkinPreview skinId={lp.skinId} size={30} />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {lp.name}
                        </div>
                        <div dir="ltr" className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                          {lp.playerCode ? formatPlayerCodeDisplay(lp.playerCode) : 'Guest'}
                          {lp.mass > 0 ? ` · ${lp.mass} M` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                      {t.onlineNowLabel}
                    </span>
                  </button>
                ))}
              </div>

              {cloudPlayers.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    {t.cloudPlayersLabel} ({cloudPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {cloudPlayers.map((cp) => (
                      <button
                        key={cp.uid}
                        type="button"
                        onClick={() =>
                          selectRecipient({
                            playerCode: cp.playerCode,
                            uid: cp.uid,
                          })
                        }
                        className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-start transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <SkinPreview skinId={cp.skinId} size={30} />
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {cp.displayName}
                            </div>
                            <div dir="ltr" className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                              {formatPlayerCodeDisplay(cp.playerCode)}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono-num text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {cp.coins} C · {cp.dna} DNA
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
