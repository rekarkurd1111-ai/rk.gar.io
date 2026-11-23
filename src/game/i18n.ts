import { Language } from './types';

export interface Translations {
  brand: string;
  subtitle: string;
  nicknameLabel: string;
  nicknamePlaceholder: string;
  defaultPlayerName: string;
  playTypeLabel: string;
  playSolo: string;
  playOnline: string;
  roomLabel: string;
  roomPlaceholder: string;
  globalRoomName: string;
  kurdistanRoomName: string;
  blitzRoomName: string;
  mergeRoomName: string;
  onlineCountSuffix: string;
  connectingText: string;
  connectionLostText: string;
  chooseSkin: string;
  gameMode: string;
  modes: {
    classic: { title: string; desc: string };
    blitz: { title: string; desc: string };
    relaxed: { title: string; desc: string };
    merge: { title: string; desc: string };
  };
  arenaTheme: string;
  themeLight: string;
  themeDark: string;
  showMassLabel: string;
  startGame: string;
  joinOnlineGame: string;
  controlsTitle: string;
  controlMove: string;
  controlMoveKey: string;
  controlSplit: string;
  controlSplitKey: string;
  controlEject: string;
  controlEjectKey: string;
  controlPause: string;
  controlPauseKey: string;
  leaderboard: string;
  mass: string;
  peakMass: string;
  score: string;
  totalScore: string;
  rank: string;
  bestRank: string;
  eaten: string;
  timeAlive: string;
  bestScore: string;
  cellsCount: string;
  splitBtn: string;
  ejectBtn: string;
  fastEjectBtn: string;
  pauseBtn: string;
  leaveBtn: string;
  muteBtn: string;
  unmuteBtn: string;
  pausedTitle: string;
  resumeGame: string;
  restartGame: string;
  backToMenu: string;
  gameOverTitle: string;
  eatenBy: string;
  survivedText: string;
  playAgain: string;
  newRecord: string;
  youLabel: string;
  minimapLabel: string;
  onlineBadge: string;
  shopBtn: string;
  shopTitle: string;
  shopSubtitle: string;
  tabSkins: string;
  tabBoosts: string;
  coinsLabel: string;
  dnaLabel: string;
  levelLabel: string;
  buyBtn: string;
  equipBtn: string;
  equippedLabel: string;
  freeLabel: string;
  activeMatchesLeft: string;
  leveledUpLabel: string;
  rewardsEarnedTitle: string;
  closeBtn: string;
  notEnoughLabel: string;
  boostActiveTag: string;
  zoomLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  zoomResetLabel: string;
  customizeControlsBtn: string;
  customizeTitle: string;
  customizeHint: string;
  showJoystickLabel: string;
  flipLayoutBtn: string;
  resetLayoutBtn: string;
  saveLayoutBtn: string;
  joystickLabel: string;
  gamePassBtn: string;
  gamePassTitle: string;
  gamePassSubtitle: string;
  seasonTimeLeft: string;
  daysShort: string;
  hoursShort: string;
  passTierLabel: string;
  tabPassRewards: string;
  tabPassChallenges: string;
  passFreeTrack: string;
  passPlusTrack: string;
  plusSeasonOneFree: string;
  activatePlusFreeBtn: string;
  plusActiveLabel: string;
  claimBtn: string;
  claimedLabel: string;
  claimAllBtn: string;
  lockedLabel: string;
  challengeStage: string;
  completedLabel: string;
  seasonExclusiveTag: string;
  moreBtn: string;
  lobbySetupTitle: string;
  skinsBtn: string;
  eventBtn: string;
  eventTitle: string;
  eventSubtitle: string;
  tokensLabel: string;
  useTokensPrefix: string;
  dailyTokensBtn: string;
  dailyTokensClaimed: string;
  centerMapBtn: string;
  eventEndsIn: string;
  earnedTokensLabel: string;
  boostsShortLabel: string;
  roomsBtn: string;
  accountBtn: string;
  friendsBtn: string;
  accountTitle: string;
  playerIdLabel: string;
  copyIdBtn: string;
  copiedText: string;
  signInGoogleBtn: string;
  signOutBtn: string;
  cloudSyncedLabel: string;
  guestAccountNote: string;
  searchFriendPlaceholder: string;
  searchBtn: string;
  noPlayersFound: string;
  addFriendBtn: string;
  friendAddedLabel: string;
  removeFriendBtn: string;
  joinRoomBtn: string;
  onlineNowLabel: string;
  offlineLabel: string;
  myFriendsTitle: string;
  findFriendsTitle: string;
  kickedNotice: string;
  receivedGrantNotice: string;
  currentRoomLabel: string;
  bestMassLabel: string;
  ownerMenuBtn: string;
  ownerMenuTitle: string;
  ownerTabSelf: string;
  ownerTabKick: string;
  ownerTabGive: string;
  addSelfCoinsLabel: string;
  addSelfDnaLabel: string;
  boostMyMassLabel: string;
  enterMatchHint: string;
  kickBtn: string;
  kickedSuccessText: string;
  giveCurrencyBtn: string;
  targetPlayerIdPlaceholder: string;
  grantSentText: string;
  livePlayersLabel: string;
  cloudPlayersLabel: string;
  refreshBtn: string;
  customAmountPlaceholder: string;
  massBoostSuccessText: string;
  settingsBtn: string;
  settingsAccountTitle: string;
  emailInputPlaceholder: string;
  signedInAsLabel: string;
  authErrorPopupBlocked: string;
  authErrorGeneric: string;
  worldTopBtn: string;
  worldTopTitle: string;
  worldTopSubtitle: string;
  weeklyChampionLabel: string;
  sortByMass: string;
  sortByScore: string;
  weeklyResetIn: string;
  matchesPlayedLabel: string;
  noWeeklyEntries: string;
  weeklySignInHint: string;
  weeklyScoreLabel: string;
  languageLabel: string;
  appearanceLabel: string;
  fpsLabel: string;
  fpsShort: string;
  fps30Desc: string;
  fps60Desc: string;
  fps120Desc: string;
  showFpsLabel: string;
  relaxedRoomName: string;
  serverStatusLabel: string;
  serverOnline: string;
  serverConnecting: string;
  serverOffline: string;
  reconnectServerBtn: string;
  connectionTimeoutText: string;
  cancelBtn: string;
  authErrorPopupClosed: string;
  authErrorUnauthorizedDomain: string;
  authErrorNetwork: string;
  authErrorOperationNotAllowed: string;
  authErrorInvalidEmailHint: string;
  tryRedirectSignInBtn: string;
  accountSyncingText: string;
  accountSyncErrorText: string;
  retrySyncBtn: string;
  emailHintOptionalNote: string;
  ownerTabArena: string;
  ownerPowersLabel: string;
  godModeLabel: string;
  virusShieldLabel: string;
  foodMagnetLabel: string;
  autoFastMergeLabel: string;
  instantMergeBtn: string;
  speedBoostLabel: string;
  addSelfXpLabel: string;
  unlockAllSkinsBtn: string;
  allSkinsUnlockedText: string;
  refillBoostsBtn: string;
  boostsRefilledText: string;
  xpAddedText: string;
  ownerAnnouncementLabel: string;
  announcementPlaceholder: string;
  sendAnnouncementBtn: string;
  clearAnnouncementBtn: string;
  announcementSentText: string;
  goldenRainBtn: string;
  goldenRainDoneText: string;
  spawnProBotsBtn: string;
  botsSpawnedText: string;
  resetBotsBtn: string;
  botsResetText: string;
  liveModeSwitchLabel: string;
  modeSwitchedText: string;
  banBtn: string;
  unbanBtn: string;
  bannedPlayersLabel: string;
  bannedSuccessText: string;
  unbannedSuccessText: string;
  bannedNotice: string;
  halveMassBtn: string;
  massHalvedText: string;
  pullToMeBtn: string;
  pulledToMeText: string;
  giftAllOnlineTitle: string;
  giftAllOnlineBtn: string;
  giftAllSentText: string;
  giftLiveMassLabel: string;
  sendMassBtn: string;
  massSentText: string;
  ownerAnnouncementPrefix: string;
  skinCatAll: string;
  skinCatVip: string;
  skinCatOwned: string;
  vipBadge: string;
  skinLevelLabel: string;
  upgradeToLv2Btn: string;
  upgradeToLv3Btn: string;
  maxLevelLabel: string;
  vipLv3PerkHint: string;
  previewLvLabel: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ckb: {
    brand: 'Rk.gar.io',
    subtitle: 'ئارێنای خانە زیندووەکان · گەورە ببە و خانە بچووکەکان بخۆ',
    nicknameLabel: 'ناوی خانەکەت',
    nicknamePlaceholder: 'ناوێک بنووسە...',
    defaultPlayerName: 'یاریزان',
    playTypeLabel: 'جۆری یاریکردن',
    playSolo: 'تاکە یاری (بۆت)',
    playOnline: 'ئۆنڵاین (فرە یاریزان)',
    roomLabel: 'ژووری ئۆنڵاین',
    roomPlaceholder: 'ناوی ژوور بنووسە (بۆ نموونە: kurd1)...',
    globalRoomName: 'گشتی',
    kurdistanRoomName: 'کوردستان',
    blitzRoomName: 'خێرا',
    mergeRoomName: 'پێکەوەنووسان',
    onlineCountSuffix: 'یاریزان',
    connectingText: 'بەستنەوە بە سێرڤەرەوە...',
    connectionLostText: 'پەیوەندی لەگەڵ سێرڤەر پچڕا',
    chooseSkin: 'شێوەی خانە هەڵبژێرە',
    gameMode: 'شێوازی یاری',
    modes: {
      classic: { title: 'کلاسیک', desc: 'هاوسەنگ و ئاسایی' },
      blitz: { title: 'خێرا', desc: 'خێرایی و بارستەی خێراتر' },
      relaxed: { title: 'ئارام', desc: 'بۆتی هێواشتر و بێ فشار' },
      merge: { title: 'پێکەوەنووسان', desc: 'پارچەکان خێرا بەیەکەوە دەنووسێنەوە' },
    },
    arenaTheme: 'ڕووناکی ئارێنا',
    themeLight: 'ڕووناک',
    themeDark: 'تاریک',
    showMassLabel: 'پیشاندانی بارستە لەسەر خانەکان',
    startGame: 'دەستپێکردنی یاری',
    joinOnlineGame: 'چوونە ناو ئارێنای ئۆنڵاین',
    controlsTitle: 'کۆنترۆڵەکان',
    controlMove: 'جوڵەکردن',
    controlMoveKey: 'ماوس / دەست',
    controlSplit: 'دابەشبوون',
    controlSplitKey: 'Space',
    controlEject: 'هاویشتنی بارستە',
    controlEjectKey: 'W',
    controlPause: 'وەستاندن',
    controlPauseKey: 'Esc',
    leaderboard: 'پێشەنگەکان (Top 5)',
    mass: 'بارستە',
    peakMass: 'زۆرترین بارستە',
    score: 'خاڵ',
    totalScore: 'کۆی خاڵ',
    rank: 'پلە',
    bestRank: 'باشترین پلە',
    eaten: 'خواردراو',
    timeAlive: 'کات',
    bestScore: 'باشترین تۆمار',
    cellsCount: 'خانەکان',
    splitBtn: 'دابەشبوون',
    ejectBtn: 'هاویشتن',
    fastEjectBtn: 'خێرا',
    pauseBtn: 'وەستان',
    leaveBtn: 'چوونەدەرەوە',
    muteBtn: 'بێدەنگکردن',
    unmuteBtn: 'دەنگکردنەوە',
    pausedTitle: 'یاری وەستێنراوە',
    resumeGame: 'بەردەوامبوون',
    restartGame: 'سەرلەنوێ دەستپێکردن',
    backToMenu: 'گەڕانەوە بۆ پێڕست',
    gameOverTitle: 'یاری تەواوبوو',
    eatenBy: 'خورای لەلایەن',
    survivedText: 'لە ئارێناکەدا خۆڕاگریت کرد',
    playAgain: 'دووبارە یاریکردن',
    newRecord: 'تۆمارێکی نوێ!',
    youLabel: 'تۆ',
    minimapLabel: 'نەخشەی ئارێنا',
    onlineBadge: 'ئۆنڵاین',
    shopBtn: 'شۆپ',
    shopTitle: 'شۆپ و بەرزکردنەوەی لیڤڵ',
    shopSubtitle: 'بە کوین و DNA سکین و بووستی لیڤڵ بکڕە',
    tabSkins: 'سکینەکان',
    tabBoosts: 'بووستی لیڤڵ و خێرایی',
    coinsLabel: 'کوین',
    dnaLabel: 'DNA',
    levelLabel: 'لیڤڵ',
    buyBtn: 'کڕین',
    equipBtn: 'هەڵبژاردن',
    equippedLabel: 'چالاکە',
    freeLabel: 'خۆڕایی',
    activeMatchesLeft: 'یاری ماوە',
    leveledUpLabel: 'لیڤڵت بەرزبووەوە!',
    rewardsEarnedTitle: 'دەستکەوتەکانی ئەم یارییە',
    closeBtn: 'داخستن',
    notEnoughLabel: 'کوین/DNA بەس نییە',
    boostActiveTag: 'بووست چالاکە',
    zoomLabel: 'زۆۆم',
    zoomInLabel: 'گەورەکردن',
    zoomOutLabel: 'بچووککردنەوە',
    zoomResetLabel: 'ئاسایی',
    customizeControlsBtn: 'شوێنی کۆنتڕۆڵەکان',
    customizeTitle: 'ڕێکخستنی شوێنی کۆنتڕۆڵەکان',
    customizeHint: 'هەر کۆنتڕۆڵێک ڕابکێشە بۆ شوێنی دڵخوازت لەسەر شاشەکە',
    showJoystickLabel: 'جۆیستیکی سەر شاشە',
    flipLayoutBtn: 'پێچەوانە',
    resetLayoutBtn: 'ڕێکخستنەوە',
    saveLayoutBtn: 'پاشەکەوتکردن',
    joystickLabel: 'جوڵە',
    gamePassBtn: 'گەیم پاس',
    gamePassTitle: 'گەیم پاسی مانگانە · سیزن ١',
    gamePassSubtitle: 'چاڵنجەکان تەواو بکە و ٥٠ دیاری بکەرەوە',
    seasonTimeLeft: 'کاتی ماوەی سیزن:',
    daysShort: 'ڕۆژ',
    hoursShort: 'کاتژمێر',
    passTierLabel: 'ئاست',
    tabPassRewards: 'دیاریەکان (٥٠ ئاست)',
    tabPassChallenges: 'چاڵنجەکان',
    passFreeTrack: 'Game Pass Free (سادە)',
    passPlusTrack: 'Game Pass Plus (نایاب)',
    plusSeasonOneFree: 'دیاری سیزنی ١: Game Pass Plus بۆ ئەم سیزنە بە خۆڕاییە!',
    activatePlusFreeBtn: 'چالاککردنی خۆڕایی (Plus)',
    plusActiveLabel: 'Plus چالاکە',
    claimBtn: 'وەرگرتن',
    claimedLabel: 'وەرگیرا',
    claimAllBtn: 'وەرگرتنی هەموو',
    lockedLabel: 'داخراوە',
    challengeStage: 'قۆناغ',
    completedLabel: 'تەواوبوو',
    seasonExclusiveTag: 'سیزن ١ · گەیم پاس',
    moreBtn: 'زیاتر',
    lobbySetupTitle: 'ڕێکخستنی یاری و ژوورەکان',
    skinsBtn: 'سکینەکان',
    eventBtn: 'ئیڤێنت',
    eventTitle: 'گەشتی تۆڕی نێکسەس · ئیڤێنت',
    eventSubtitle: 'تۆکنەکان کۆبکەرەوە و ڕێگاکانی نەخشەکە بکەرەوە بۆ وەرگرتنی خەڵاتی نایاب!',
    tokensLabel: 'تۆکن',
    useTokensPrefix: 'تێچوو:',
    dailyTokensBtn: 'دیاری ڕۆژانە (+١٥ تۆکن)',
    dailyTokensClaimed: 'دیاری ئەمڕۆ وەرگیرا',
    centerMapBtn: 'ناوەندکردن',
    eventEndsIn: 'کاتی ماوە:',
    earnedTokensLabel: 'تۆکن',
    boostsShortLabel: 'بووستەکان',
    roomsBtn: 'ژوورەکان',
    accountBtn: 'ئەکاونت',
    friendsBtn: 'هاوڕێیان',
    accountTitle: 'زانیاری ئەکاونت و ناسنامە',
    playerIdLabel: 'ئایدی تایبەت (Player ID)',
    copyIdBtn: 'کۆپیکردن',
    copiedText: 'کۆپی کرا!',
    signInGoogleBtn: 'چوونەژوورەوە بە گووگڵ',
    signOutBtn: 'چوونەدەرەوە لە ئەکاونت',
    cloudSyncedLabel: 'بە هەژماری گووگڵ پاشەکەوت کراوە',
    guestAccountNote: 'بۆ هێشتنەوەی ئامار و هاوڕێکانت بە گووگڵ بچۆ ژوورەوە',
    searchFriendPlaceholder: 'ئایدی (RK-...) یان ناوی هاوڕێ بنووسە...',
    searchBtn: 'گەڕان',
    noPlayersFound: 'هیچ یاریزانێک نەدۆزرایەوە',
    addFriendBtn: 'زیادکردن',
    friendAddedLabel: 'هاوڕێیە',
    removeFriendBtn: 'سڕینەوە',
    joinRoomBtn: 'بڕۆ ژوورەکەی',
    onlineNowLabel: 'ئۆنڵاین',
    offlineLabel: 'ئۆفڵاین',
    myFriendsTitle: 'لیستی هاوڕێکانم',
    findFriendsTitle: 'دۆزینەوەی هاوڕێ',
    kickedNotice: 'لە یارییەکە دەرکرایت لەلایەن خاوەنی یارییەوە.',
    receivedGrantNotice: 'دیاری کوین/DNA لەلایەن خاوەنی یارییەوە بۆت نێردرا!',
    currentRoomLabel: 'ژووری ئێستا',
    bestMassLabel: 'زۆرترین بارستە',
    ownerMenuBtn: 'خاوەن',
    ownerMenuTitle: 'مینوی تایبەتی خاوەنی یاری',
    ownerTabSelf: 'بۆ خۆم',
    ownerTabKick: 'دەرکردن',
    ownerTabGive: 'زیادکردنی پارە',
    addSelfCoinsLabel: 'زیادکردنی کوین بۆ خۆم',
    addSelfDnaLabel: 'زیادکردنی DNA بۆ خۆم',
    boostMyMassLabel: 'زیادکردنی بارستەی خۆم لە یاریدا',
    enterMatchHint: 'بۆ زیادکردنی بارستە سەرەتا بچۆ ناو یارییەکەوە (تاکە یاری یان ئۆنڵاین)',
    kickBtn: 'دەرکردن',
    kickedSuccessText: 'یاریزانەکە دەرکرا!',
    giveCurrencyBtn: 'ناردنی پارە',
    targetPlayerIdPlaceholder: 'ئایدی یاریزان (RK-...) بنووسە یان هەڵبژێرە',
    grantSentText: 'کوین و DNA بە سەرکەوتوویی نێردران!',
    livePlayersLabel: 'یاریزانە ئۆنڵاینەکان',
    cloudPlayersLabel: 'ئەکاونتە تۆمارکراوەکان',
    refreshBtn: 'نوێکردنەوە',
    customAmountPlaceholder: 'بڕ...',
    massBoostSuccessText: 'بارستەکەت زیاد کرا!',
    settingsBtn: 'سێتینگ',
    settingsAccountTitle: 'هەژمار و چوونەژوورەوە بە ئیمەیڵ',
    emailInputPlaceholder: 'ئیمەیڵەکەت بنووسە (بۆ نموونە: name@gmail.com)...',
    signedInAsLabel: 'چوونەژوورەوە بەم هەژمارە:',
    authErrorPopupBlocked: 'پەنجەرەی چوونەژوورەوە لەلایەن براوزەرەوە بلۆک کرا، تکایە ڕێگە بە Popup بدە و دووبارە هەوڵبدە.',
    authErrorGeneric: 'چوونەژوورەوە سەرکەوتوو نەبوو، تکایە دووبارە هەوڵبدە.',
    worldTopBtn: 'World Top',
    worldTopTitle: 'World Top · باشترینەکانی هەفتە',
    worldTopSubtitle: 'پێشەنگی جیهانی و باشترین یاریزانی هەفتە',
    weeklyChampionLabel: 'باشترین یاریزانی ئەم هەفتەیە',
    sortByMass: 'بە پێی بارستە',
    sortByScore: 'بە پێی خاڵ',
    weeklyResetIn: 'هەفتەی نوێ:',
    matchesPlayedLabel: 'یاری',
    noWeeklyEntries: 'هێشتا هیچ یاریزانێک بۆ ئەم هەفتەیە تۆمار نەکراوە — ببە بە یەکەم پێشەنگ!',
    weeklySignInHint: 'بە گووگڵ بچۆ ژوورەوە بۆ ئەوەی ناوت بچێتە لیستی جیهانی هەفتانە',
    weeklyScoreLabel: 'خاڵی هەفتە',
    languageLabel: 'زمان',
    appearanceLabel: 'ڕووکار و دیمەن',
    fpsLabel: 'خێرایی وێنە (FPS)',
    fpsShort: 'FPS',
    fps30Desc: 'پاشەکەوتی باتری',
    fps60Desc: 'ئاسایی و نەرم',
    fps120Desc: 'زۆر نەرم و خێرا',
    showFpsLabel: 'پیشاندانی FPS لە یاریدا',
    relaxedRoomName: 'ئارام',
    serverStatusLabel: 'دۆخی سێرڤەر',
    serverOnline: 'ئامادەیە',
    serverConnecting: 'پەیوەندی دەکرێت...',
    serverOffline: 'پچڕاوە',
    reconnectServerBtn: 'پەیوەندیکردنەوە',
    connectionTimeoutText: 'سێرڤەر وەڵامی نەدایەوە، تکایە دووبارە هەوڵبدە.',
    cancelBtn: 'پاشگەزبوونەوە',
    authErrorPopupClosed: 'پەنجەرەی گووگڵ داخرا پێش تەواوبوونی چوونەژوورەوە. تکایە دووبارە هەوڵبدە.',
    authErrorUnauthorizedDomain: 'ئەم ناونیشانە لە Firebase Auth ڕێگەی پێنەدراوە.',
    authErrorNetwork: 'کێشەی هێڵی ئینتەرنێت هەیە لە کاتی چوونەژوورەوە.',
    authErrorOperationNotAllowed: 'چوونەژوورەوە بە گووگڵ لە پرۆژەی Firebase چالاک نەکراوە.',
    authErrorInvalidEmailHint: 'تکایە ئیمەیڵێکی دروست بنووسە (بۆ نموونە: name@gmail.com) یان بە بەتاڵی بهێڵەوە.',
    tryRedirectSignInBtn: 'چوونەژوورەوە بە ڕێگای تر (Redirect)',
    accountSyncingText: 'پاشەکەوتکردنی زانیاری ئەکاونت...',
    accountSyncErrorText: 'هەژمارەکەت کرایەوە بەڵام پاشەکەوتی کلود کێشەی هەبوو:',
    retrySyncBtn: 'دووبارە پاشەکەوتکردن',
    emailHintOptionalNote: 'ئیمەیڵ دڵخوازانەیە (تەنها بۆ هەڵبژاردنی خێرای جیمێڵ لە گووگڵ)',
    ownerTabArena: 'ئارێنا',
    ownerPowersLabel: 'هێزە تایبەتەکانی خاوەن (لە ناو یاریدا)',
    godModeLabel: 'نەمری (کەس ناتوانێت بتخوات)',
    virusShieldLabel: 'قەڵغانی ڤایرۆس (ناتەقیت)',
    foodMagnetLabel: 'موقناتیسی خواردن',
    autoFastMergeLabel: 'یەکگرتنەوەی خێرای خۆکار',
    instantMergeBtn: 'ئێستا بیلکێنەوە',
    speedBoostLabel: 'خێرایی جوڵە',
    addSelfXpLabel: 'زیادکردنی XP و لیڤڵ بۆ خۆم',
    unlockAllSkinsBtn: 'کردنەوەی هەموو سکینەکان',
    allSkinsUnlockedText: 'هەموو سکینەکان کرانەوە!',
    refillBoostsBtn: '+١٠ هەموو بووستەکان',
    boostsRefilledText: 'هەموو بووستەکان زیاد کران!',
    xpAddedText: 'XP و لیڤڵ زیاد کران!',
    ownerAnnouncementLabel: 'ڕاگەیاندنی گشتی بۆ هەموو یاریزانەکان',
    announcementPlaceholder: 'پەیامی خاوەن بنووسە...',
    sendAnnouncementBtn: 'ناردنی ڕاگەیاندن',
    clearAnnouncementBtn: 'سڕینەوە',
    announcementSentText: 'ڕاگەیاندنەکە بۆ هەمووان نێردرا!',
    goldenRainBtn: 'بارانی خواردنی گۆڵد (+٤٠)',
    goldenRainDoneText: 'بارانی خواردنی گۆڵد باری!',
    spawnProBotsBtn: '+٥ بۆتی پرۆ زیاد بکە',
    botsSpawnedText: '٥ بۆتی نوێ زیاد کران!',
    resetBotsBtn: 'سڕینەوە و ڕێکخستنەوەی بۆتەکان',
    botsResetText: 'بۆتەکان نوێ کرانەوە!',
    liveModeSwitchLabel: 'گۆڕینی مۆدی ئارێنا بە ڕاستەوخۆ',
    modeSwitchedText: 'مۆدی ئارێنا گۆڕا!',
    banBtn: 'باند',
    unbanBtn: 'لابردنی باند',
    bannedPlayersLabel: 'یاریزانە باندکراوەکان',
    bannedSuccessText: 'یاریزانەکە باند کرا!',
    unbannedSuccessText: 'باندەکە لابرا!',
    bannedNotice: 'هەژمارەکەت لەلایەن خاوەنی یارییەوە باند کراوە.',
    halveMassBtn: 'نیوەی بارستە',
    massHalvedText: 'بارستەی یاریزان نیوە کرا!',
    pullToMeBtn: 'بانگکردنە لام',
    pulledToMeText: 'یاریزان هێنرایە لات!',
    giftAllOnlineTitle: 'دیاری گشتی بۆ هەموو یاریزانە ئۆنڵاینەکان',
    giftAllOnlineBtn: 'ناردن بۆ هەمووان',
    giftAllSentText: 'دیاری بۆ هەموو یاریزانە ئۆنڵاینەکان نێردرا!',
    giftLiveMassLabel: 'ناردنی بارستە بۆ یاریزانی ئۆنڵاین',
    sendMassBtn: 'ناردنی بارستە',
    massSentText: 'بارستە بۆ یاریزان نێردرا!',
    ownerAnnouncementPrefix: 'پەیامی خاوەن:',
    skinCatAll: 'هەموو',
    skinCatVip: 'VIP (٣ لیڤڵ)',
    skinCatOwned: 'کڕدراوەکان',
    vipBadge: 'VIP',
    skinLevelLabel: 'لیڤڵ',
    upgradeToLv2Btn: 'بەرزکردنەوە بۆ Lv.2',
    upgradeToLv3Btn: 'بەرزکردنەوە بۆ Lv.3',
    maxLevelLabel: 'ماکس · Lv.3',
    vipLv3PerkHint: 'لە لیڤڵ ٣ دەدرەوشێتەوە و ڕەنگەکەی دەگۆڕێت!',
    previewLvLabel: 'بینینی لیڤڵ:',
  },
  en: {
    brand: 'Rk.gar.io',
    subtitle: 'Cellular arena · Grow your mass, split smart, rule the petri dish',
    nicknameLabel: 'Cell Name',
    nicknamePlaceholder: 'Enter nickname...',
    defaultPlayerName: 'Player',
    playTypeLabel: 'Play Mode',
    playSolo: 'Solo (Bots)',
    playOnline: 'Online (Multiplayer)',
    roomLabel: 'Online Room',
    roomPlaceholder: 'Enter room name (e.g. kurd1)...',
    globalRoomName: 'Global',
    kurdistanRoomName: 'Kurdistan',
    blitzRoomName: 'Blitz',
    mergeRoomName: 'Quick Merge',
    onlineCountSuffix: 'online',
    connectingText: 'Connecting to arena server...',
    connectionLostText: 'Lost connection to server',
    chooseSkin: 'Select Cell Skin',
    gameMode: 'Game Mode',
    modes: {
      classic: { title: 'Classic', desc: 'Balanced arena pace' },
      blitz: { title: 'Blitz', desc: 'Faster speed & richer mass' },
      relaxed: { title: 'Relaxed', desc: 'Gentle bots, chill growth' },
      merge: { title: 'Quick Merge', desc: 'Split pieces fuse back fast' },
    },
    arenaTheme: 'Arena Surface',
    themeLight: 'Light',
    themeDark: 'Dark',
    showMassLabel: 'Show mass on cells',
    startGame: 'Start Game',
    joinOnlineGame: 'Join Online Arena',
    controlsTitle: 'Controls',
    controlMove: 'Move',
    controlMoveKey: 'Mouse / Touch',
    controlSplit: 'Split',
    controlSplitKey: 'Space',
    controlEject: 'Eject Mass',
    controlEjectKey: 'W',
    controlPause: 'Pause',
    controlPauseKey: 'Esc',
    leaderboard: 'Top 5 Leaderboard',
    mass: 'Mass',
    peakMass: 'Peak Mass',
    score: 'Score',
    totalScore: 'Total Score',
    rank: 'Rank',
    bestRank: 'Best Rank',
    eaten: 'Eaten',
    timeAlive: 'Time',
    bestScore: 'Best Record',
    cellsCount: 'Cells',
    splitBtn: 'Split',
    ejectBtn: 'Eject',
    fastEjectBtn: 'Turbo',
    pauseBtn: 'Pause',
    leaveBtn: 'Leave',
    muteBtn: 'Mute',
    unmuteBtn: 'Unmute',
    pausedTitle: 'Game Paused',
    resumeGame: 'Resume',
    restartGame: 'Restart',
    backToMenu: 'Main Menu',
    gameOverTitle: 'Game Over',
    eatenBy: 'Absorbed by',
    survivedText: 'You survived in the arena',
    playAgain: 'Play Again',
    newRecord: 'New Record!',
    youLabel: 'You',
    minimapLabel: 'Arena minimap',
    onlineBadge: 'Online',
    shopBtn: 'Shop',
    shopTitle: 'Cell Shop & Level Boosts',
    shopSubtitle: 'Unlock skins and level boosts with Coins & DNA',
    tabSkins: 'Skins',
    tabBoosts: 'Level Boosts',
    coinsLabel: 'Coins',
    dnaLabel: 'DNA',
    levelLabel: 'Level',
    buyBtn: 'Buy',
    equipBtn: 'Equip',
    equippedLabel: 'Equipped',
    freeLabel: 'Free',
    activeMatchesLeft: 'matches left',
    leveledUpLabel: 'Level Up!',
    rewardsEarnedTitle: 'Match Rewards',
    closeBtn: 'Close',
    notEnoughLabel: 'Insufficient balance',
    boostActiveTag: 'Boost active',
    zoomLabel: 'Zoom',
    zoomInLabel: 'Zoom In',
    zoomOutLabel: 'Zoom Out',
    zoomResetLabel: 'Reset',
    customizeControlsBtn: 'Control Layout',
    customizeTitle: 'Customize Control Positions',
    customizeHint: 'Drag any control to move it to your preferred spot',
    showJoystickLabel: 'On-Screen Joystick',
    flipLayoutBtn: 'Flip L/R',
    resetLayoutBtn: 'Reset',
    saveLayoutBtn: 'Save',
    joystickLabel: 'Move',
    gamePassBtn: 'Game Pass',
    gamePassTitle: 'Monthly Game Pass · Season 1',
    gamePassSubtitle: 'Complete challenges & unlock 50 rewards',
    seasonTimeLeft: 'Season ends in:',
    daysShort: 'd',
    hoursShort: 'h',
    passTierLabel: 'Tier',
    tabPassRewards: 'Rewards (50 Tiers)',
    tabPassChallenges: 'Challenges',
    passFreeTrack: 'Game Pass Free',
    passPlusTrack: 'Game Pass Plus',
    plusSeasonOneFree: 'Season 1 Special: Game Pass Plus is FREE!',
    activatePlusFreeBtn: 'Activate Plus Free',
    plusActiveLabel: 'Plus Active',
    claimBtn: 'Claim',
    claimedLabel: 'Claimed',
    claimAllBtn: 'Claim All',
    lockedLabel: 'Locked',
    challengeStage: 'Stage',
    completedLabel: 'Completed',
    seasonExclusiveTag: 'Season 1 Pass',
    moreBtn: 'More',
    lobbySetupTitle: 'Arena Setup & Rooms',
    skinsBtn: 'Skins',
    eventBtn: 'Event',
    eventTitle: 'Nexus Expedition · Event',
    eventSubtitle: 'Collect tokens in matches to unlock maze paths and claim epic rewards!',
    tokensLabel: 'Tokens',
    useTokensPrefix: 'Use',
    dailyTokensBtn: 'Daily Gift (+15 Tokens)',
    dailyTokensClaimed: 'Claimed Today',
    centerMapBtn: 'Center',
    eventEndsIn: 'Ends in:',
    earnedTokensLabel: 'Tokens',
    boostsShortLabel: 'Boosts',
    roomsBtn: 'Rooms',
    accountBtn: 'Account',
    friendsBtn: 'Friends',
    accountTitle: 'Account Info & Player ID',
    playerIdLabel: 'Unique Player ID',
    copyIdBtn: 'Copy ID',
    copiedText: 'Copied!',
    signInGoogleBtn: 'Sign in with Google',
    signOutBtn: 'Sign Out',
    cloudSyncedLabel: 'Synced with Google Account',
    guestAccountNote: 'Sign in with Google to save progress & find offline friends',
    searchFriendPlaceholder: 'Enter Player ID (RK-...) or nickname...',
    searchBtn: 'Search',
    noPlayersFound: 'No matching players found',
    addFriendBtn: 'Add Friend',
    friendAddedLabel: 'Friend',
    removeFriendBtn: 'Remove',
    joinRoomBtn: 'Join Room',
    onlineNowLabel: 'Online',
    offlineLabel: 'Offline',
    myFriendsTitle: 'My Friends',
    findFriendsTitle: 'Find Friends',
    kickedNotice: 'You were removed from the arena by the game owner.',
    receivedGrantNotice: 'You received Coins/DNA from the game owner!',
    currentRoomLabel: 'Current Room',
    bestMassLabel: 'Best Mass',
    ownerMenuBtn: 'Owner',
    ownerMenuTitle: 'Owner Exclusive Menu',
    ownerTabSelf: 'For Me',
    ownerTabKick: 'Kick Player',
    ownerTabGive: 'Give Currency',
    addSelfCoinsLabel: 'Add Coins to Myself',
    addSelfDnaLabel: 'Add DNA to Myself',
    boostMyMassLabel: 'Boost My Live Mass',
    enterMatchHint: 'Enter a Solo or Online match first to boost your live mass',
    kickBtn: 'Kick',
    kickedSuccessText: 'Player kicked from the game!',
    giveCurrencyBtn: 'Send Currency',
    targetPlayerIdPlaceholder: 'Enter Player ID (RK-...) or pick below',
    grantSentText: 'Coins & DNA delivered!',
    livePlayersLabel: 'Live Connected Players',
    cloudPlayersLabel: 'Cloud Registered Accounts',
    refreshBtn: 'Refresh',
    customAmountPlaceholder: 'Amount...',
    massBoostSuccessText: 'Your mass has been boosted!',
    settingsBtn: 'Settings',
    settingsAccountTitle: 'Account & Email Sign-In',
    emailInputPlaceholder: 'Enter your email (e.g. name@gmail.com)...',
    signedInAsLabel: 'Signed in as:',
    authErrorPopupBlocked: 'Sign-in popup was blocked by your browser. Please allow popups and try again.',
    authErrorGeneric: 'Sign-in failed. Please try again.',
    worldTopBtn: 'World Top',
    worldTopTitle: 'Weekly World Top',
    worldTopSubtitle: 'Best Player of the Week & Global Rankings',
    weeklyChampionLabel: 'Best Player of the Week',
    sortByMass: 'By Best Mass',
    sortByScore: 'By Weekly Score',
    weeklyResetIn: 'Week resets in:',
    matchesPlayedLabel: 'matches',
    noWeeklyEntries: 'No scores recorded yet this week — claim #1 first!',
    weeklySignInHint: 'Sign in with Google to appear on the Weekly World Top',
    weeklyScoreLabel: 'Weekly Score',
    languageLabel: 'Language',
    appearanceLabel: 'Theme & Display',
    fpsLabel: 'Frame Rate (FPS)',
    fpsShort: 'FPS',
    fps30Desc: 'Battery Saver',
    fps60Desc: 'Standard Smooth',
    fps120Desc: 'Ultra Smooth',
    showFpsLabel: 'Show live FPS counter',
    relaxedRoomName: 'Relaxed',
    serverStatusLabel: 'Server Status',
    serverOnline: 'Online',
    serverConnecting: 'Connecting...',
    serverOffline: 'Offline',
    reconnectServerBtn: 'Reconnect',
    connectionTimeoutText: 'Server did not respond in time. Please try again.',
    cancelBtn: 'Cancel',
    authErrorPopupClosed: 'Google sign-in window closed before finishing. Please try again.',
    authErrorUnauthorizedDomain: 'This domain is not authorized in Firebase Auth.',
    authErrorNetwork: 'Network error during sign-in. Check your internet connection.',
    authErrorOperationNotAllowed: 'Google sign-in is not enabled in this Firebase project.',
    authErrorInvalidEmailHint: 'Enter a valid email (e.g. name@gmail.com) or leave blank.',
    tryRedirectSignInBtn: 'Try Redirect Sign-In',
    accountSyncingText: 'Syncing cloud account...',
    accountSyncErrorText: 'Signed in, but cloud account sync encountered an error:',
    retrySyncBtn: 'Retry Sync',
    emailHintOptionalNote: 'Email is optional (pre-selects your Gmail in Google Sign-In)',
    ownerTabArena: 'Arena',
    ownerPowersLabel: 'Owner Live Powers (In-Match)',
    godModeLabel: 'Immortal Shield (Cannot be eaten)',
    virusShieldLabel: 'Virus Immunity (No pop)',
    foodMagnetLabel: 'Food Magnet',
    autoFastMergeLabel: 'Auto Fast Merge',
    instantMergeBtn: 'Merge Now',
    speedBoostLabel: 'Move Speed',
    addSelfXpLabel: 'Add XP & Level Up',
    unlockAllSkinsBtn: 'Unlock All Skins',
    allSkinsUnlockedText: 'All skins unlocked!',
    refillBoostsBtn: '+10 All Boosts',
    boostsRefilledText: 'All boosts refilled!',
    xpAddedText: 'XP & Level added!',
    ownerAnnouncementLabel: 'Broadcast Announcement to All Players',
    announcementPlaceholder: 'Write owner announcement...',
    sendAnnouncementBtn: 'Broadcast',
    clearAnnouncementBtn: 'Clear',
    announcementSentText: 'Announcement broadcasted!',
    goldenRainBtn: 'Golden Food Rain (+40)',
    goldenRainDoneText: 'Golden food rained down!',
    spawnProBotsBtn: 'Spawn +5 Pro Bots',
    botsSpawnedText: '5 new bots spawned!',
    resetBotsBtn: 'Reset Arena Bots',
    botsResetText: 'Arena bots reset!',
    liveModeSwitchLabel: 'Switch Arena Mode Live',
    modeSwitchedText: 'Arena mode updated!',
    banBtn: 'Ban',
    unbanBtn: 'Unban',
    bannedPlayersLabel: 'Banned Players',
    bannedSuccessText: 'Player banned!',
    unbannedSuccessText: 'Player unbanned!',
    bannedNotice: 'Your account has been banned by the game owner.',
    halveMassBtn: 'Halve Mass',
    massHalvedText: 'Player mass halved!',
    pullToMeBtn: 'Pull to Me',
    pulledToMeText: 'Player teleported to you!',
    giftAllOnlineTitle: 'Drop Gift to All Online Players',
    giftAllOnlineBtn: 'Send to All Online',
    giftAllSentText: 'Gift delivered to all online players!',
    giftLiveMassLabel: 'Send Live Mass to Online Player',
    sendMassBtn: 'Send Mass',
    massSentText: 'Mass sent to player!',
    ownerAnnouncementPrefix: 'Owner Notice:',
    skinCatAll: 'All',
    skinCatVip: 'VIP (3-Level)',
    skinCatOwned: 'Owned',
    vipBadge: 'VIP',
    skinLevelLabel: 'Level',
    upgradeToLv2Btn: 'Upgrade Lv.2',
    upgradeToLv3Btn: 'Upgrade Lv.3',
    maxLevelLabel: 'MAX · Lv.3',
    vipLv3PerkHint: 'Level 3 glows with radiant aura & color-shifting!',
    previewLvLabel: 'Preview:',
  },
};
