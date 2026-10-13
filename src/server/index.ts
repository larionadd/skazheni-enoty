// Game server: Express serves the built PWA, Socket.IO carries the realtime game.
import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import type { ClientAction, GameEvent, RoomView, Session } from '../shared/protocol.ts';
import { Room } from '../shared/room.ts';

interface ServerToClient {
  view(v: RoomView): void;
  events(e: GameEvent[]): void;
  kicked(): void;
}
type Ack = (res: { ok: true; session?: Session } | { ok: false; error: string }) => void;
interface ClientToServer {
  create(p: { name: string; avatar: string }, ack: Ack): void;
  join(p: { code: string; name: string; avatar: string }, ack: Ack): void;
  resume(p: Session, ack: Ack): void;
  act(a: ClientAction, ack: Ack): void;
}
interface SocketData {
  code?: string;
  playerId?: string;
}

const PORT = Number(process.env.PORT ?? 3001);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist');

const app = express();
const http = createServer(app);
const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(http, {
  cors: { origin: true },
  // Generous timeouts: phones on trains drop in and out of coverage.
  pingInterval: 10_000,
  pingTimeout: 20_000,
});

const rooms = new Map<string, Room>();
/** playerId → socket id, so we can push per-player views. */
const sockets = new Map<string, string>();

function newCode(): string {
  let code: string;
  do code = String(Math.floor(1000 + Math.random() * 9000));
  while (rooms.has(code));
  return code;
}

function broadcast(room: Room) {
  for (const m of room.members) {
    const sid = sockets.get(m.id);
    if (sid) io.to(sid).emit('view', room.viewFor(m.id));
  }
}

function makeRoom(): Room {
  const code = newCode();
  const room = new Room(code, {
    onChange: broadcast,
    onEvents: (id, events) => {
      const sid = sockets.get(id);
      if (sid) io.to(sid).emit('events', events);
    },
  });
  rooms.set(code, room);
  return room;
}

function attach(socket: { id: string; data: SocketData }, room: Room, playerId: string) {
  socket.data.code = room.code;
  socket.data.playerId = playerId;
  sockets.set(playerId, socket.id);
}

io.on('connection', (socket) => {
  socket.on('create', ({ name, avatar }, ack) => {
    const room = makeRoom();
    const m = room.join(String(name ?? ''), String(avatar ?? ''));
    if (typeof m === 'string') return ack({ ok: false, error: m });
    attach(socket, room, m.id);
    ack({ ok: true, session: { code: room.code, playerId: m.id, token: m.token } });
    broadcast(room);
  });

  socket.on('join', ({ code, name, avatar }, ack) => {
    const room = rooms.get(String(code ?? '').trim());
    if (!room) return ack({ ok: false, error: 'Кімнату з таким кодом не знайдено.' });
    const m = room.join(String(name ?? ''), String(avatar ?? ''));
    if (typeof m === 'string') return ack({ ok: false, error: m });
    attach(socket, room, m.id);
    ack({ ok: true, session: { code: room.code, playerId: m.id, token: m.token } });
    broadcast(room);
  });

  socket.on('resume', ({ code, playerId, token }, ack) => {
    const room = rooms.get(String(code));
    const m = room?.resume(String(playerId), String(token));
    if (!room || !m) return ack({ ok: false, error: 'Сесію не знайдено.' });
    attach(socket, room, m.id);
    room.setConnected(m.id, true);
    ack({ ok: true });
    broadcast(room);
  });

  socket.on('act', (a, ack) => {
    const { code, playerId } = socket.data;
    const room = code ? rooms.get(code) : undefined;
    if (!room || !playerId) return ack?.({ ok: false, error: 'Ти не в кімнаті.' });
    const err = room.action(playerId, a);
    if (err) return ack?.({ ok: false, error: err });
    ack?.({ ok: true });
    if (a.t === 'leave' || a.t === 'kick') {
      const gone = a.t === 'leave' ? playerId : a.playerId;
      const sid = sockets.get(gone);
      if (sid) {
        if (gone !== playerId) io.to(sid).emit('kicked');
        sockets.delete(gone);
      }
      if (gone === playerId) socket.data = {};
      if (room.humans().length === 0) rooms.delete(room.code);
    }
  });

  socket.on('disconnect', () => {
    const { code, playerId } = socket.data;
    if (!code || !playerId || sockets.get(playerId) !== socket.id) return;
    sockets.delete(playerId);
    rooms.get(code)?.setConnected(playerId, false);
  });
});

// Drive nope timers, bots and autopilot; clean up abandoned rooms.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    room.tick(now);
    const anyoneHere = room.humans().some((m) => m.connected);
    if (!anyoneHere && now - room.lastActivity > 30 * 60_000) rooms.delete(code);
  }
}, 200);

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

if (existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: false }));
  app.get(/^(?!\/socket\.io).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

http.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i!.address);
  console.log(`🦝 Сервер «Скажені Єноти» слухає порт ${PORT}`);
  for (const ip of ips) console.log(`   у локальній мережі: http://${ip}:${PORT}`);
});
