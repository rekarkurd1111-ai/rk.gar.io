import { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Coins,
  Copy,
  Dna,
  LogIn,
  LogOut,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  User as UserIcon,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  formatPlayerCodeDisplay,
  lookupCloudPlayerByCode,
  normalizePlayerCode,
} from '../game/accountService';
import { Translations } from '../game/i18n';
import { xpRequiredForLevel } from '../game/progression';
import {
  AccountModalTab,
  FriendRecord,
  GameConfig,
  Language,
  LiveServerPlayer,
  PlayerProfile,
  PublicPlayerProfile,
  SkinId,
} from '../game/types';
import { SkinPreview } from './SkinPreview';

interface AccountFriendsModalProps {
  open: boolean;
  initialTab: AccountModalTab;
  onClose: () => void;
  firebaseUser: User | null;
  authLoading: boolean;
  authError: string | null;
  playerCode: string;
  friends: FriendRecord[];
  config: GameConfig;
  profile: PlayerProfile;
  bestMass: number;
  lang: Language;
  t: Translations;
  onSignInGoogle: (emailHint?: string) => void;
  onSignOut: () => void;
  onClearAuthError: () => void;
  onAddFriend: (friend: FriendRecord) => void;
  onRemoveFriend: (friendUid: string) => void;
  onJoinFriendRoom: (roomId: string) => void;
}

interface SearchResultItem {
  uid: string;
  playerCode: string;
  displayName: string;
  skinId: SkinId;
  level: number;
  online: boolean;
  currentRoom: string;
}

export function AccountFriendsModal({
  open,
  initialTab,
  onClose,
  firebaseUser,
  authLoading,
  authError,
  playerCode,
  friends,
  config,
  profile,
  bestMass,
  t,
  onSignInGoogle,
  onSignOut,
  onClearAuthError,
  onAddFriend,
  onRemoveFriend,
  onJoinFriendRoom,
}: AccountFriendsModalProps) {
  const [tab, setTab] = useState<AccountModalTab>(initialTab);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [liveDirectory, setLiveDirectory] = useState<LiveServerPlayer[]>([]);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  const fetchLiveDirectory = useCallback(async (q?: string): Promise<LiveServerPlayer[]> => {
    try {
      const url = q
        ? `/api/players/directory?q=${encodeURIComponent(q)}`
        : '/api/players/directory';
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as { players?: LiveServerPlayer[] };
      return Array.isArray(data.players) ? data.players : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (!open || tab !== 'friends') return;
    let cancelled = false;
    const refresh = async () => {
      const list = await fetchLiveDirectory();
      if (!cancelled) {
        setLiveDirectory(list);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, tab, fetchLiveDirectory]);

  const handleCopyId = async () => {
    const formatted = formatPlayerCodeDisplay(playerCode);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleSearchFriends = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchExecuted(false);
      return;
    }

    setSearching(true);
    setSearchExecuted(true);

    const resultsMap = new Map<string, SearchResultItem>();

    // 1. Live online server players matching name or code
    const liveMatches = await fetchLiveDirectory(q);
    for (const lp of liveMatches) {
      const key = lp.uid || lp.playerCode || lp.connectionId;
      if (!key) continue;
      if (lp.playerCode && lp.playerCode === normalizePlayerCode(playerCode)) continue;
      resultsMap.set(key, {
        uid: lp.uid || `code_${lp.playerCode}`,
        playerCode: lp.playerCode,
        displayName: lp.name,
        skinId: lp.skinId,
        level: lp.level,
        online: true,
        currentRoom: lp.roomId || 'global',
      });
    }

    // 2. Cloud Firestore lookup by exact Player ID if signed in and query looks like an ID
    const cleanCode = normalizePlayerCode(q);
    if (firebaseUser && /^RK[0-9A-Z]{6}$/.test(cleanCode) && cleanCode !== normalizePlayerCode(playerCode)) {
      try {
        const cloudPlayer: PublicPlayerProfile | null = await lookupCloudPlayerByCode(cleanCode);
        if (cloudPlayer && cloudPlayer.uid !== firebaseUser.uid) {
          const existing = resultsMap.get(cloudPlayer.uid);
          resultsMap.set(cloudPlayer.uid, {
            uid: cloudPlayer.uid,
            playerCode: cloudPlayer.playerCode,
            displayName: cloudPlayer.displayName,
            skinId: cloudPlayer.skinId,
            level: cloudPlayer.level,
            online: existing ? existing.online : cloudPlayer.online,
            currentRoom: existing ? existing.currentRoom : cloudPlayer.currentRoom,
          });
        }
      } catch {
        // Ignore transient lookup error
      }
    }

    setSearchResults(Array.from(resultsMap.values()));
    setSearching(false);
  };

  if (!open) return null;

  const formattedCode = formatPlayerCodeDisplay(playerCode);
  const displayName =
    config.nickname.trim() || firebaseUser?.displayName || t.defaultPlayerName;
  const neededXp = xpRequiredForLevel(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.xp / neededXp) * 100));

  const friendCodeSet = new Set(friends.map((f) => normalizePlayerCode(f.playerCode)));
  const friendUidSet = new Set(friends.map((f) => f.friendUid));

  const isAlreadyFriend = (item: SearchResultItem) =>
    friendUidSet.has(item.uid) ||
    (item.playerCode ? friendCodeSet.has(normalizePlayerCode(item.playerCode)) : false);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-modal-enter flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/65 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/75 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              {tab === 'account' ? <UserIcon className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {tab === 'account' ? t.accountTitle : t.findFriendsTitle}
              </h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>ID:</span>
                <span dir="ltr" className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                  {formattedCode}
                </span>
              </div>
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

        {/* Tabs */}
        <div className="border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-800 sm:px-6">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setTab('account')}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'account'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>{t.accountBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('friends')}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                tab === 'friends'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {t.friendsBtn} ({friends.length})
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 sm:px-6">
          {tab === 'account' ? (
            <div className="space-y-4">
              {/* Identity Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-800/55">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full border-2 border-white bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                    <SkinPreview skinId={config.skinId} size={48} />
                  </div>
                  <div>
                    <div className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                      {displayName}
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t.levelLabel} {profile.level}
                      {firebaseUser?.email ? ` · ${firebaseUser.email}` : ''}
                    </div>
                  </div>
                </div>

                {/* Unique Player ID Card + Copy */}
                <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2 dark:border-sky-800/70 dark:bg-sky-950/50">
                  <div>
                    <div className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                      {t.playerIdLabel}
                    </div>
                    <div
                      dir="ltr"
                      className="font-mono-num text-sm font-black tracking-wider text-slate-900 dark:text-white"
                    >
                      {formattedCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="flex min-h-[38px] items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-sky-700 active:scale-95 whitespace-nowrap"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? t.copiedText : t.copyIdBtn}</span>
                  </button>
                </div>
              </div>

              {/* Google Sign-In / Cloud Sync */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/70">
                {firebaseUser ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {t.cloudSyncedLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {firebaseUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={onSignOut}
                      className="flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>{t.signOutBtn}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {t.guestAccountNote}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="email"
                        dir="ltr"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (authError) onClearAuthError();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') onSignInGoogle(emailInput);
                        }}
                        placeholder={t.emailInputPlaceholder}
                        className="h-11 min-w-[190px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-xs"
                      />
                      <button
                        type="button"
                        disabled={authLoading}
                        onClick={() => onSignInGoogle(emailInput)}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>{t.signInGoogleBtn}</span>
                      </button>
                    </div>
                    {authError && (
                      <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                        {authError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* XP Bar */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/45">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {t.levelLabel} {profile.level}
                  </span>
                  <span className="font-mono-num text-slate-500 dark:text-slate-400">
                    {profile.xp} / {neededXp} XP
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                    <span>{t.coinsLabel}</span>
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {profile.coins}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Dna className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{t.dnaLabel}</span>
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {profile.dna}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Trophy className="h-3.5 w-3.5 text-sky-500" />
                    <span>{t.bestMassLabel}</span>
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {bestMass}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {t.totalScore}
                  </div>
                  <div className="font-mono-num mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                    {profile.score}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Search Box */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSearchFriends();
                    }}
                    placeholder={t.searchFriendPlaceholder}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm"
                  />
                  <button
                    type="button"
                    disabled={searching}
                    onClick={() => void handleSearchFriends()}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-sky-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Search className="h-4 w-4" />
                    <span>{t.searchBtn}</span>
                  </button>
                </div>

                {/* Search Results */}
                {searchExecuted && (
                  <div className="mt-3 space-y-2">
                    {searchResults.length === 0 && !searching ? (
                      <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                        {t.noPlayersFound}
                      </div>
                    ) : (
                      searchResults.map((res) => {
                        const added = isAlreadyFriend(res);
                        return (
                          <div
                            key={`${res.uid}_${res.playerCode}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/70"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <SkinPreview skinId={res.skinId} size={34} />
                              <div className="min-w-0">
                                <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                                  {res.displayName}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  {res.playerCode && (
                                    <span dir="ltr" className="font-mono-num font-bold">
                                      {formatPlayerCodeDisplay(res.playerCode)}
                                    </span>
                                  )}
                                  <span>
                                    · {t.levelLabel} {res.level}
                                  </span>
                                  {res.online && (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                      · {t.onlineNowLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {added ? (
                              <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                {t.friendAddedLabel}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onAddFriend({
                                    friendUid: res.uid,
                                    playerCode: res.playerCode,
                                    displayName: res.displayName,
                                    skinId: res.skinId,
                                    level: res.level,
                                    online: res.online,
                                    currentRoom: res.currentRoom,
                                  })
                                }
                                className="flex min-h-[38px] items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>{t.addFriendBtn}</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Saved Friends List */}
              <div>
                <h3 className="mb-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {t.myFriendsTitle} ({friends.length})
                </h3>
                {friends.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {t.noPlayersFound}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((f) => {
                      const liveMatch = liveDirectory.find(
                        (lp) =>
                          (lp.uid && lp.uid === f.friendUid) ||
                          (f.playerCode &&
                            lp.playerCode === normalizePlayerCode(f.playerCode))
                      );
                      const isOnline = Boolean(liveMatch);
                      const roomId = liveMatch?.roomId || f.currentRoom || '';
                      return (
                        <div
                          key={f.friendUid}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/75 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="relative">
                              <SkinPreview skinId={liveMatch?.skinId || f.skinId} size={36} />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                  isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-extrabold text-slate-900 dark:text-white">
                                {liveMatch?.name || f.displayName}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                {f.playerCode && (
                                  <span dir="ltr" className="font-mono-num font-bold">
                                    {formatPlayerCodeDisplay(f.playerCode)}
                                  </span>
                                )}
                                <span
                                  className={
                                    isOnline
                                      ? 'font-bold text-emerald-600 dark:text-emerald-400'
                                      : ''
                                  }
                                >
                                  · {isOnline ? t.onlineNowLabel : t.offlineLabel}
                                  {isOnline && roomId ? ` (${roomId})` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isOnline && roomId && (
                              <button
                                type="button"
                                onClick={() => onJoinFriendRoom(roomId)}
                                className="flex min-h-[38px] items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700 whitespace-nowrap"
                              >
                                {t.joinRoomBtn}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onRemoveFriend(f.friendUid)}
                              title={t.removeFriendBtn}
                              aria-label={t.removeFriendBtn}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
