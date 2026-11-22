import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { ServerArena, WORLD_SIZE } from './src/game/serverEngine.ts';
import type { GameMode, LiveServerPlayer, RoomSummary, SkinId } from './src/game/types.ts';

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
  playerId: string;
  uid: string;
  playerCode: string;
  name: string;
  skinId: SkinId;
  level: number;
  roomId: string | null;
}

const connectedClients = new Map<string, ConnectedClient>();
const verifiedTokenCache = new Map<string, { uid: string; email: string; expiresAt: number }>();

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
    ws.send(JSON.stringify(payload));
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
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
    res.json({ players: getLivePlayersSnapshot() });
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

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    clientSeq += 1;
    const playerId = `player_${clientSeq}_${Math.random().toString(36).slice(2, 6)}`;
    const client: ConnectedClient = {
      ws,
      playerId,
      uid: '',
      playerCode: '',
      name: 'یاریزان',
      skinId: 'kurdish_sun',
      level: 1,
      roomId: null,
    };
    connectedClients.set(playerId, client);

    sendJson(ws, { type: 'welcome', connectionId: playerId });

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = msg.type;

      if (type === 'presence') {
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

        const room = getOrCreateRoom(roomId, mode);
        client.roomId = room.id;
        room.clients.set(playerId, client);
        room.arena.addHuman(playerId, name, skinId, startMassBonus);

        sendJson(ws, {
          type: 'joined',
          playerId,
          roomId: room.id,
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
        const stop = Boolean(msg.stop);
        room.arena.setHumanInput(playerId, tx, ty, stop);
      } else if (type === 'split') {
        if (!client.roomId) return;
        rooms.get(client.roomId)?.arena.splitHuman(playerId);
      } else if (type === 'eject') {
        if (!client.roomId) return;
        const burst = typeof msg.count === 'number' ? Math.max(1, Math.min(3, Math.round(msg.count))) : 1;
        rooms.get(client.roomId)?.arena.ejectHuman(playerId, burst);
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
