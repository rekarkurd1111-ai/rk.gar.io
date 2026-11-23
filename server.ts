import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { ServerArena, WORLD_SIZE } from './src/game/serverEngine.ts';
import type {
  BannedPlayerRecord,
  GameMode,
  LiveServerPlayer,
  OwnerAnnouncement,
  OwnerPowers,
  RoomSummary,
  SkinId,
  SkinLevel,
} from './src/game/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const OWNER_EMAIL = 'rekarkurd1111@gmail.com';

let FIREBASE_API_KEY = '';
try {
  const cfgRaw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
  const cfg = JSON.parse(cfgRaw) as { apiKey?: string };
  FIREBASE_API_KEY = cfg.apiKey || '';
} catch {
  // Ignore missing config at startup
}

interface ConnectedClient {
  ws: WebSocket;
  isAlive: boolean;
  playerId: string;
  uid: string;
  playerCode: string;
  name: string;
  skinId: SkinId;
  skinLevel: SkinLevel;
  level: number;
  roomId: string | null;
}

const connectedClients = new Map<string, ConnectedClient>();
const verifiedTokenCache = new Map<string, { uid: string; email: string; expiresAt: number }>();
const bannedPlayers = new Map<string, BannedPlayerRecord>();
let currentAnnouncement: OwnerAnnouncement | null = null;

function isClientBanned(uid: string, playerCode: string): boolean {
  if (uid && bannedPlayers.has(`uid:${uid}`)) return true;
  if (playerCode && bannedPlayers.has(`code:${playerCode}`)) return true;
  return false;
}

function findOwnerClient(adminUid: string, preferredConnId?: string): ConnectedClient | undefined {
  if (preferredConnId) {
    const c = connectedClients.get(preferredConnId);
    if (c && c.uid === adminUid && c.roomId) return c;
  }
  for (const c of connectedClients.values()) {
    if (c.uid === adminUid && c.roomId) return c;
  }
  return undefined;
}

async function verifyOwnerToken(authHeader: string | undefined): Promise<{ uid: string; email: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ') || !FIREBASE_API_KEY) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  const cached = verifiedTokenCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) {
    return { uid: cached.uid, email: cached.email };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: { localId?: string; email?: string; emailVerified?: boolean }[];
    };
    const user = data.users?.[0];
    if (!user || !user.localId || !user.email || !user.emailVerified) return null;
    if (user.email.toLowerCase() !== OWNER_EMAIL) return null;

    const verified = { uid: user.localId, email: user.email };
    verifiedTokenCache.set(idToken, { ...verified, expiresAt: Date.now() + 45_000 });
    return verified;
  } catch {
    return null;
  }
}

function getLivePlayersSnapshot(): LiveServerPlayer[] {
  const list: LiveServerPlayer[] = [];
  for (const c of connectedClients.values()) {
    if (c.ws.readyState !== WebSocket.OPEN) continue;
    const room = c.roomId ? rooms.get(c.roomId) : undefined;
    const mass = room ? room.arena.getHumanMass(c.playerId) : 0;
    list.push({
      connectionId: c.playerId,
      uid: c.uid,
      playerCode: c.playerCode,
      name: c.name || 'یاریزان',
      skinId: c.skinId,
      roomId: c.roomId || '',
      mass,
      level: c.level,
      inMatch: Boolean(c.roomId && mass > 0),
    });
  }
  return list;
}

interface RoomInstance {
  id: string;
  arena: ServerArena;
  clients: Map<string, ConnectedClient>;
  isDefault: boolean;
}

const DEFAULT_ROOMS: { id: string; mode: GameMode }[] = [
  { id: 'global', mode: 'classic' },
  { id: 'kurdistan', mode: 'classic' },
  { id: 'blitz', mode: 'blitz' },
  { id: 'merge', mode: 'merge' },
  { id: 'relaxed', mode: 'relaxed' },
];

const rooms = new Map<string, RoomInstance>();
for (const def of DEFAULT_ROOMS) {
  rooms.set(def.id, {
    id: def.id,
    arena: new ServerArena(def.id, def.mode),
    clients: new Map(),
    isDefault: true,
  });
}

let clientSeq = 1;

function getOrCreateRoom(roomIdRaw: string, mode: GameMode): RoomInstance {
  const cleanId =
    roomIdRaw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff_-]/g, '')
      .slice(0, 20) || 'global';

  const existing = rooms.get(cleanId);
  if (existing) return existing;

  const created: RoomInstance = {
    id: cleanId,
    arena: new ServerArena(cleanId, mode),
    clients: new Map(),
    isDefault: false,
  };
  rooms.set(cleanId, created);
  return created;
}

function getRoomSummaries(): RoomSummary[] {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    mode: r.arena.mode,
    onlinePlayers: r.clients.size,
  }));
}

function leaveCurrentRoom(client: ConnectedClient) {
  if (!client.roomId) return;
  const room = rooms.get(client.roomId);
  if (room) {
    room.clients.delete(client.playerId);
    room.arena.removeHuman(client.playerId);
    if (!room.isDefault && room.clients.size === 0) {
      rooms.delete(room.id);
    }
  }
  client.roomId = null;
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(payload));
    } catch {
      // Ignore send error on closing socket
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      rooms: rooms.size,
      connectedClients: connectedClients.size,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get('/api/rooms', (_req, res) => {
    res.json({ rooms: getRoomSummaries() });
  });

  app.get('/api/players/directory', (req, res) => {
    const qRaw = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const qNorm = qRaw.replace(/[^a-z0-9]/g, '');
    const all = getLivePlayersSnapshot();
    const filtered = qRaw
      ? all.filter((p) => {
          const codeMatch = p.playerCode.toLowerCase().includes(qNorm);
          const nameMatch = p.name.toLowerCase().includes(qRaw);
          return codeMatch || nameMatch;
        })
      : all;
    res.json({ players: filtered.slice(0, 40) });
  });

  // Owner-Only Admin Endpoints (Strictly Verified via Firebase ID Token for rekarkurd1111@gmail.com)
  app.get('/api/admin/players', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }
    res.json({
      players: getLivePlayersSnapshot(),
      banned: Array.from(bannedPlayers.values()),
      announcement: currentAnnouncement,
    });
  });

  app.post('/api/admin/kick', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const targetCode =
      typeof req.body?.playerCode === 'string'
        ? req.body.playerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        : '';

    let kickedCount = 0;
    for (const client of connectedClients.values()) {
      const matchId = connectionId && client.playerId === connectionId;
      const matchCode = targetCode && client.playerCode === targetCode;
      if (matchId || matchCode) {
        leaveCurrentRoom(client);
        sendJson(client.ws, { type: 'kicked', reason: 'owner_kick' });
        kickedCount += 1;
      }
    }

    res.json({ kicked: kickedCount > 0, kickedCount });
  });

  app.post('/api/admin/grant', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const targetCode =
      typeof req.body?.playerCode === 'string'
        ? req.body.playerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        : '';
    const targetUid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : '';
    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const coins = Math.max(0, Math.min(10_000_000, Math.round(Number(req.body?.coins) || 0)));
    const dna = Math.max(0, Math.min(10_000_000, Math.round(Number(req.body?.dna) || 0)));

    if (coins === 0 && dna === 0) {
      res.status(400).json({ error: 'INVALID_AMOUNT' });
      return;
    }

    let deliveredLive = 0;
    for (const client of connectedClients.values()) {
      const matchConn = connectionId && client.playerId === connectionId;
      const matchCode = targetCode && client.playerCode === targetCode;
      const matchUid = targetUid && client.uid === targetUid;
      if (matchConn || matchCode || matchUid) {
        sendJson(client.ws, {
          type: 'currency_grant',
          coins,
          dna,
          fromOwner: true,
        });
        deliveredLive += 1;
      }
    }

    res.json({ deliveredLive });
  });

  app.post('/api/admin/boost-mass', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const amount = Math.max(10, Math.min(100_000, Math.round(Number(req.body?.amount) || 0)));

    let targetClient: ConnectedClient | undefined;
    if (connectionId) {
      const c = connectedClients.get(connectionId);
      if (c && c.uid === admin.uid && c.roomId) {
        targetClient = c;
      }
    }
    if (!targetClient) {
      for (const c of connectedClients.values()) {
        if (c.uid === admin.uid && c.roomId) {
          targetClient = c;
          break;
        }
      }
    }

    if (!targetClient || !targetClient.roomId) {
      res.status(404).json({ error: 'OWNER_NOT_IN_ONLINE_MATCH' });
      return;
    }

    const room = rooms.get(targetClient.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    const newMass = room.arena.addHumanMass(targetClient.playerId, amount);
    if (newMass <= 0) {
      res.status(400).json({ error: 'PLAYER_NOT_ALIVE' });
      return;
    }

    res.json({ boosted: true, newMass });
  });

  app.post('/api/admin/powers', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const instantMerge = Boolean(req.body?.instantMerge);
    const rawPowers = req.body?.powers as Partial<OwnerPowers> | undefined;

    const ownerClient = findOwnerClient(admin.uid, connectionId);
    if (!ownerClient || !ownerClient.roomId) {
      res.status(404).json({ error: 'OWNER_NOT_IN_ONLINE_MATCH' });
      return;
    }
    const room = rooms.get(ownerClient.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    if (instantMerge) {
      room.arena.instantMergeHuman(ownerClient.playerId);
    }

    if (rawPowers && typeof rawPowers === 'object') {
      const speedVal = rawPowers.speedMultiplier;
      const safePowers: OwnerPowers = {
        godMode: Boolean(rawPowers.godMode),
        virusShield: Boolean(rawPowers.virusShield),
        speedMultiplier: speedVal === 1.5 || speedVal === 2.2 ? speedVal : 1,
        foodMagnet: Boolean(rawPowers.foodMagnet),
        autoFastMerge: Boolean(rawPowers.autoFastMerge),
      };
      room.arena.setHumanOwnerPowers(ownerClient.playerId, safePowers);
    }

    res.json({ ok: true });
  });

  app.post('/api/admin/arena', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const action = typeof req.body?.action === 'string' ? req.body.action : '';
    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';

    if (action === 'broadcast') {
      const rawText = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 140) : '';
      if (!rawText) {
        res.status(400).json({ error: 'EMPTY_ANNOUNCEMENT' });
        return;
      }
      currentAnnouncement = {
        id: `ann_${Date.now()}`,
        text: rawText,
        createdAt: Date.now(),
      };
      for (const client of connectedClients.values()) {
        sendJson(client.ws, { type: 'announcement', announcement: currentAnnouncement });
      }
      res.json({ ok: true, announcement: currentAnnouncement });
      return;
    }

    if (action === 'clear_broadcast') {
      currentAnnouncement = null;
      for (const client of connectedClients.values()) {
        sendJson(client.ws, { type: 'announcement', announcement: null });
      }
      res.json({ ok: true, announcement: null });
      return;
    }

    const ownerClient = findOwnerClient(admin.uid, connectionId);
    if (!ownerClient || !ownerClient.roomId) {
      res.status(404).json({ error: 'OWNER_NOT_IN_ONLINE_MATCH' });
      return;
    }
    const room = rooms.get(ownerClient.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    if (action === 'golden_rain') {
      room.arena.spawnGoldenFoodRain(40, ownerClient.playerId);
      res.json({ ok: true });
      return;
    }
    if (action === 'spawn_bots') {
      room.arena.spawnExtraBots(5);
      res.json({ ok: true });
      return;
    }
    if (action === 'reset_bots') {
      room.arena.resetBots();
      res.json({ ok: true });
      return;
    }
    if (action === 'set_mode') {
      const nextMode: GameMode =
        req.body?.mode === 'blitz' ||
        req.body?.mode === 'relaxed' ||
        req.body?.mode === 'merge'
          ? req.body.mode
          : 'classic';
      room.arena.setMode(nextMode);
      for (const c of room.clients.values()) {
        sendJson(c.ws, { type: 'room_mode', roomId: room.id, mode: nextMode });
      }
      res.json({ ok: true, mode: nextMode });
      return;
    }

    res.status(400).json({ error: 'UNKNOWN_ACTION' });
  });

  app.post('/api/admin/moderate', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const action = typeof req.body?.action === 'string' ? req.body.action : '';
    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const targetUid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : '';
    const targetCode =
      typeof req.body?.playerCode === 'string'
        ? req.body.playerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
        : '';
    const targetName = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 24) : 'Player';

    if (action === 'ban') {
      if (targetUid && targetUid === admin.uid) {
        res.status(400).json({ error: 'CANNOT_BAN_SELF' });
        return;
      }
      if (!targetCode && !targetUid && !connectionId) {
        res.status(400).json({ error: 'MISSING_TARGET' });
        return;
      }

      let resolvedCode = targetCode;
      let resolvedUid = targetUid;
      let resolvedName = targetName;

      if (connectionId) {
        const live = connectedClients.get(connectionId);
        if (live) {
          if (live.uid === admin.uid) {
            res.status(400).json({ error: 'CANNOT_BAN_SELF' });
            return;
          }
          resolvedCode = resolvedCode || live.playerCode;
          resolvedUid = resolvedUid || live.uid;
          resolvedName = live.name || resolvedName;
        }
      }

      const key = resolvedCode ? `code:${resolvedCode}` : `uid:${resolvedUid}`;
      bannedPlayers.set(key, {
        playerCode: resolvedCode,
        uid: resolvedUid,
        name: resolvedName,
      });

      for (const client of connectedClients.values()) {
        if (client.uid === admin.uid) continue;
        const matchConn = connectionId && client.playerId === connectionId;
        const matchCode = resolvedCode && client.playerCode === resolvedCode;
        const matchUid = resolvedUid && client.uid === resolvedUid;
        if (matchConn || matchCode || matchUid) {
          leaveCurrentRoom(client);
          sendJson(client.ws, { type: 'banned', reason: 'owner_ban' });
        }
      }
      res.json({ ok: true, banned: Array.from(bannedPlayers.values()) });
      return;
    }

    if (action === 'unban') {
      if (targetCode) bannedPlayers.delete(`code:${targetCode}`);
      if (targetUid) bannedPlayers.delete(`uid:${targetUid}`);
      res.json({ ok: true, banned: Array.from(bannedPlayers.values()) });
      return;
    }

    const targetClient = connectionId ? connectedClients.get(connectionId) : undefined;
    if (!targetClient || !targetClient.roomId) {
      res.status(404).json({ error: 'TARGET_NOT_IN_MATCH' });
      return;
    }
    const targetRoom = rooms.get(targetClient.roomId);
    if (!targetRoom) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }

    if (action === 'halve_mass') {
      const newMass = targetRoom.arena.halveHumanMass(targetClient.playerId);
      res.json({ ok: newMass > 0, newMass });
      return;
    }

    if (action === 'pull_to_me') {
      const ownerConnId =
        typeof req.body?.ownerConnectionId === 'string' ? req.body.ownerConnectionId.trim() : '';
      const ownerClient = findOwnerClient(admin.uid, ownerConnId);
      if (!ownerClient || ownerClient.roomId !== targetClient.roomId) {
        res.status(400).json({ error: 'NOT_IN_SAME_ROOM' });
        return;
      }
      const ok = targetRoom.arena.pullHumanToOwner(targetClient.playerId, ownerClient.playerId);
      res.json({ ok });
      return;
    }

    res.status(400).json({ error: 'UNKNOWN_ACTION' });
  });

  app.post('/api/admin/grant-mass', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }
    const connectionId =
      typeof req.body?.connectionId === 'string' ? req.body.connectionId.trim() : '';
    const amount = Math.max(10, Math.min(50_000, Math.round(Number(req.body?.amount) || 0)));
    const targetClient = connectionId ? connectedClients.get(connectionId) : undefined;
    if (!targetClient || !targetClient.roomId) {
      res.status(404).json({ error: 'TARGET_NOT_IN_MATCH' });
      return;
    }
    const room = rooms.get(targetClient.roomId);
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }
    const newMass = room.arena.addHumanMass(targetClient.playerId, amount);
    if (newMass <= 0) {
      res.status(400).json({ error: 'PLAYER_NOT_ALIVE' });
      return;
    }
    res.json({ ok: true, newMass });
  });

  app.post('/api/admin/grant-all', async (req, res) => {
    const admin = await verifyOwnerToken(req.headers.authorization);
    if (!admin) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }
    const coins = Math.max(0, Math.min(10_000_000, Math.round(Number(req.body?.coins) || 0)));
    const dna = Math.max(0, Math.min(10_000_000, Math.round(Number(req.body?.dna) || 0)));
    if (coins === 0 && dna === 0) {
      res.status(400).json({ error: 'INVALID_AMOUNT' });
      return;
    }
    let delivered = 0;
    for (const client of connectedClients.values()) {
      if (client.ws.readyState !== WebSocket.OPEN) continue;
      sendJson(client.ws, {
        type: 'currency_grant',
        coins,
        dna,
        fromOwner: true,
      });
      delivered += 1;
    }
    res.json({ ok: true, delivered });
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    clientSeq += 1;
    const playerId = `player_${clientSeq}_${Math.random().toString(36).slice(2, 6)}`;
    const client: ConnectedClient = {
      ws,
      isAlive: true,
      playerId,
      uid: '',
      playerCode: '',
      name: 'یاریزان',
      skinId: 'kurdish_sun',
      skinLevel: 1,
      level: 1,
      roomId: null,
    };
    connectedClients.set(playerId, client);

    ws.on('pong', () => {
      client.isAlive = true;
    });

    sendJson(ws, {
      type: 'welcome',
      connectionId: playerId,
      announcement: currentAnnouncement,
    });

    ws.on('message', (raw) => {
      client.isAlive = true;
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = msg.type;

      if (type === 'ping') {
        sendJson(ws, {
          type: 'pong',
          ts: typeof msg.ts === 'number' ? msg.ts : Date.now(),
        });
      } else if (type === 'presence') {
        if (typeof msg.uid === 'string') client.uid = msg.uid.slice(0, 128);
        if (typeof msg.playerCode === 'string') {
          client.playerCode = msg.playerCode
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8);
        }
        if (typeof msg.name === 'string' && msg.name.trim()) {
          client.name = msg.name.trim().slice(0, 24);
        }
        if (typeof msg.skinId === 'string') {
          client.skinId = msg.skinId as SkinId;
        }
        if (msg.skinLevel === 3 || msg.skinLevel === 2 || msg.skinLevel === 1) {
          client.skinLevel = msg.skinLevel;
        }
        if (typeof msg.level === 'number' && msg.level >= 1) {
          client.level = Math.floor(msg.level);
        }
      } else if (type === 'join') {
        leaveCurrentRoom(client);
        const roomId = typeof msg.roomId === 'string' ? msg.roomId : 'global';
        const mode: GameMode =
          msg.mode === 'blitz' || msg.mode === 'relaxed' || msg.mode === 'merge'
            ? msg.mode
            : 'classic';
        const name = typeof msg.name === 'string' ? msg.name : 'یاریزان';
        const skinId = (typeof msg.skinId === 'string' ? msg.skinId : 'kurdish_sun') as SkinId;
        const skinLevel: SkinLevel = msg.skinLevel === 3 ? 3 : msg.skinLevel === 2 ? 2 : 1;
        const startMassBonus = typeof msg.startMassBonus === 'number' ? msg.startMassBonus : 0;

        if (typeof msg.uid === 'string') client.uid = msg.uid.slice(0, 128);
        if (typeof msg.playerCode === 'string') {
          client.playerCode = msg.playerCode
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8);
        }
        if (typeof msg.level === 'number' && msg.level >= 1) {
          client.level = Math.floor(msg.level);
        }
        client.name = name.trim().slice(0, 24) || 'یاریزان';
        client.skinId = skinId;
        client.skinLevel = skinLevel;

        if (isClientBanned(client.uid, client.playerCode)) {
          sendJson(ws, { type: 'banned', reason: 'owner_ban' });
          return;
        }

        const room = getOrCreateRoom(roomId, mode);
        client.roomId = room.id;
        room.clients.set(playerId, client);
        room.arena.addHuman(playerId, name, skinId, startMassBonus, skinLevel);

        sendJson(ws, {
          type: 'joined',
          playerId,
          roomId: room.id,
          mode: room.arena.mode,
          worldSize: WORLD_SIZE,
        });

        const initialState = room.arena.getStateForPlayer(playerId);
        if (initialState) {
          sendJson(ws, initialState);
        }
      } else if (type === 'input') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;
        const tx = Number(msg.targetX);
        const ty = Number(msg.targetY);
        if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;
        const stop = Boolean(msg.stop);
        room.arena.setHumanInput(playerId, tx, ty, stop);
      } else if (type === 'split') {
        if (!client.roomId) return;
        rooms.get(client.roomId)?.arena.splitHuman(playerId);
      } else if (type === 'eject') {
        if (!client.roomId) return;
        const burst = typeof msg.count === 'number' ? Math.max(1, Math.min(3, Math.round(msg.count))) : 1;
        rooms.get(client.roomId)?.arena.ejectHuman(playerId, burst);
      } else if (type === 'eject_hold') {
        if (!client.roomId) return;
        const mode = msg.mode === 'fast' || msg.mode === 'normal' ? msg.mode : 'off';
        rooms.get(client.roomId)?.arena.setHumanEjectMode(playerId, mode);
      } else if (type === 'leave') {
        leaveCurrentRoom(client);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(client);
      connectedClients.delete(playerId);
    });

    ws.on('error', () => {
      leaveCurrentRoom(client);
      connectedClients.delete(playerId);
    });
  });

  // 20s WebSocket heartbeat to keep Cloud Run / proxy connections alive and reap dead sockets
  setInterval(() => {
    for (const [id, client] of connectedClients.entries()) {
      if (!client.isAlive || client.ws.readyState !== WebSocket.OPEN) {
        leaveCurrentRoom(client);
        connectedClients.delete(id);
        try {
          client.ws.terminate();
        } catch {
          // Ignore terminate error
        }
        continue;
      }
      client.isAlive = false;
      try {
        client.ws.ping();
      } catch {
        // Ignore ping error
      }
    }
  }, 20_000);

  // 25 Hz authoritative simulation tick for active rooms
  const TICK_MS = 40;
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    for (const room of rooms.values()) {
      if (room.clients.size === 0) continue;

      const deaths = room.arena.step(dt);
      for (const death of deaths) {
        const client = room.clients.get(death.playerId);
        if (client) {
          sendJson(client.ws, {
            type: 'died',
            peakMass: death.peakMass,
            cellsEaten: death.cellsEaten,
            foodsEaten: death.foodsEaten,
            splitsUsed: death.splitsUsed,
            elapsedSeconds: death.elapsedSeconds,
            killerName: death.killerName,
          });
          leaveCurrentRoom(client);
        }
      }

      for (const client of room.clients.values()) {
        const state = room.arena.getStateForPlayer(client.playerId);
        if (state) {
          sendJson(client.ws, state);
        }
      }
    }
  }, TICK_MS);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Rk.gar.io server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
