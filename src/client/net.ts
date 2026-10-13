// Two interchangeable transports: online (Socket.IO) and offline (game engine runs in the browser vs bots).
import { io, type Socket } from 'socket.io-client';
import type { ClientAction, GameEvent, RoomView, Session } from '../shared/protocol.ts';
import { Room } from '../shared/room.ts';

export type NetStatus = 'connecting' | 'online' | 'reconnecting' | 'offline-mode';

export interface Listener {
  onView(v: RoomView): void;
  onEvents(e: GameEvent[]): void;
  onStatus(s: NetStatus): void;
  onKicked(): void;
}

export interface Transport {
  act(a: ClientAction): Promise<string | null>;
  close(): void;
}

type Ack = { ok: true; session?: Session } | { ok: false; error: string };

const SESSION_KEY = 'enoty.session';

export function loadSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}
export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// ───────────────────────── online ─────────────────────────

export class OnlineTransport implements Transport {
  private socket: Socket;
  private session: Session | null = null;

  constructor(l: Listener) {
    const isFileOrStatic =
      location.protocol === 'file:' || (location.port !== '' && location.port !== '3001' && location.port !== '5173');
    const url = isFileOrStatic ? 'http://localhost:3001' : undefined;
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 8000,
    });
    l.onStatus('connecting');
    this.socket.on('connect', () => {
      // Every (re)connect re-attaches us to our seat in the room.
      if (this.session) {
        this.socket.emit('resume', this.session, (res: Ack) => {
          if (res.ok) l.onStatus('online');
          else {
            saveSession(null);
            this.session = null;
            l.onKicked();
          }
        });
      } else l.onStatus('online');
    });
    this.socket.on('disconnect', () => l.onStatus('reconnecting'));
    this.socket.io.on('reconnect_attempt', () => l.onStatus('reconnecting'));
    this.socket.on('view', (v: RoomView) => l.onView(v));
    this.socket.on('events', (e: GameEvent[]) => l.onEvents(e));
    this.socket.on('kicked', () => {
      saveSession(null);
      this.session = null;
      l.onKicked();
    });
  }

  private request(ev: string, payload: unknown): Promise<Ack> {
    return new Promise((resolve) => {
      this.socket.timeout(10_000).emit(ev, payload, (err: Error | null, res: Ack) => {
        resolve(err ? { ok: false, error: 'Немає зв’язку із сервером. Спробуй ще раз.' } : res);
      });
    });
  }

  async enter(mode: 'create' | 'join', name: string, avatar: string, code?: string): Promise<string | null> {
    const res = await this.request(mode, { name, avatar, code });
    if (!res.ok) return res.error;
    this.session = res.session!;
    saveSession(this.session);
    return null;
  }

  async resume(s: Session): Promise<boolean> {
    this.session = s;
    if (!this.socket.connected) return true; // will resume on connect
    const res = await this.request('resume', s);
    if (!res.ok) {
      this.session = null;
      saveSession(null);
    }
    return res.ok;
  }

  async act(a: ClientAction): Promise<string | null> {
    const res = await this.request('act', a);
    if (a.t === 'leave' && res.ok) {
      this.session = null;
      saveSession(null);
    }
    return res.ok ? null : res.error;
  }

  close() {
    this.socket.close();
  }
}

// ───────────────────────── offline ─────────────────────────

export class OfflineTransport implements Transport {
  private room: Room;
  private me: string;
  private timer: number;

  constructor(l: Listener, name: string, avatar: string, bots: number) {
    this.room = new Room(
      'ОФЛАЙН',
      {
        onChange: (r) => l.onView(r.viewFor(this.me)),
        onEvents: (_id, e) => l.onEvents(e),
      },
      true,
    );
    const m = this.room.join(name, avatar);
    if (typeof m === 'string') throw new Error(m);
    this.me = m.id;
    for (let i = 0; i < bots; i++) this.room.action(this.me, { t: 'addBot' });
    l.onStatus('offline-mode');
    l.onView(this.room.viewFor(this.me));
    this.timer = window.setInterval(() => this.room.tick(), 150);
  }

  async act(a: ClientAction): Promise<string | null> {
    return this.room.action(this.me, a);
  }

  close() {
    clearInterval(this.timer);
  }
}
