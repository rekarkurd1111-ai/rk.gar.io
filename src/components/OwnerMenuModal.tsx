import { useState } from 'react';
import {
  Ban,
  Coins,
  Dna,
  Gift,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  UserX,
  X,
} from 'lucide-react';
import { formatPlayerCodeDisplay, normalizePlayerCode } from '../game/accountService';
import { Translations } from '../game/i18n';
import { LiveServerPlayer, PublicPlayerProfile } from '../game/types';
import { SkinPreview } from './SkinPreview';

type OwnerTab = 'self' | 'kick' | 'give';

interface OwnerMenuModalProps {
  open: boolean;
  onClose: () => void;
  livePlayers: LiveServerPlayer[];
  cloudPlayers: PublicPlayerProfile[];
  loadingPlayers: boolean;
  inMatch: boolean;
  t: Translations;
  onRefreshPlayers: () => void;
  onAddSelfCurrency: (coins: number, dna: number) => void;
  onBoostMyMass: (amount: number) => Promise<boolean>;
  onKickPlayer: (target: { connectionId?: string; playerCode?: string }) => Promise<boolean>;
  onGrantPlayerCurrency: (target: {
    connectionId?: string;
    uid?: string;
    playerCode?: string;
    coins: number;
    dna: number;
  }) => Promise<boolean>;
}

export function OwnerMenuModal({
  open,
  onClose,
  livePlayers,
  cloudPlayers,
  loadingPlayers,
  inMatch,
  t,
  onRefreshPlayers,
  onAddSelfCurrency,
  onBoostMyMass,
  onKickPlayer,
  onGrantPlayerCurrency,
}: OwnerMenuModalProps) {
  const [tab, setTab] = useState<OwnerTab>('self');
  const [customCoins, setCustomCoins] = useState('5000');
  const [customDna, setCustomDna] = useState('250');
  const [customMass, setCustomMass] = useState('1000');

  const [manualKickCode, setManualKickCode] = useState('');
  const [giveTargetCode, setGiveTargetCode] = useState('');
  const [giveTargetUid, setGiveTargetUid] = useState('');
  const [giveTargetConnId, setGiveTargetConnId] = useState('');
  const [giveCoins, setGiveCoins] = useState('1000');
  const [giveDna, setGiveDna] = useState('100');

  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const flashStatus = (msg: string) => {
    setStatusFeedback(msg);
    window.setTimeout(() => {
      setStatusFeedback((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleSelfMassBoost = async (amount: number) => {
    if (amount <= 0 || busy) return;
    setBusy(true);
    const ok = await onBoostMyMass(amount);
    setBusy(false);
    if (ok) {
      flashStatus(t.massBoostSuccessText);
    }
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
    if (ok) {
      flashStatus(t.grantSentText);
    }
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

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-800 sm:px-6">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setTab('self')}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'self'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{t.ownerTabSelf}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('kick');
                onRefreshPlayers();
              }}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'kick'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserX className="h-4 w-4 text-rose-500" />
              <span>{t.ownerTabKick}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('give');
                onRefreshPlayers();
              }}
              className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'give'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Gift className="h-4 w-4 text-emerald-500" />
              <span>{t.ownerTabGive}</span>
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
                  <div className="flex flex-1 items-center gap-1.5 min-w-[160px]">
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
                  <div className="flex flex-1 items-center gap-1.5 min-w-[160px]">
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
                  <div className="flex flex-1 items-center gap-1.5 min-w-[160px]">
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
            </div>
          )}

          {tab === 'kick' && (
            <div className="space-y-4">
              {/* Manual Kick by Player ID */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualKickCode}
                  onChange={(e) => setManualKickCode(e.target.value)}
                  placeholder={t.targetPlayerIdPlaceholder}
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-base font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-xs"
                />
                <button
                  type="button"
                  disabled={!manualKickCode.trim() || busy}
                  onClick={() => void handleKick({ playerCode: manualKickCode })}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
                >
                  <Ban className="h-4 w-4" />
                  <span>{t.kickBtn}</span>
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
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/60"
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
                          <span>
                            {lp.roomId ? `Room: ${lp.roomId}` : 'Menu'}
                          </span>
                          {lp.mass > 0 && (
                            <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                              {t.mass}: {lp.mass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void handleKick({
                          connectionId: lp.connectionId,
                          playerCode: lp.playerCode || undefined,
                        })
                      }
                      className="flex min-h-[38px] items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>{t.kickBtn}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'give' && (
            <div className="space-y-4">
              {/* Target & Currency Form */}
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
                    className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-start transition-colors hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <SkinPreview skinId={lp.skinId} size={30} />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {lp.name}
                        </div>
                        <div dir="ltr" className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                          {lp.playerCode ? formatPlayerCodeDisplay(lp.playerCode) : 'Guest'}
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
