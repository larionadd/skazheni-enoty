// Serverless multiplayer transport over public MQTT-over-WSS relay (EMQX).
// Engineered for mobile browsers (iOS Safari / Chrome / Telegram WebView) where backgrounding
// a tab while sharing a room code or switching tabs can pause/drop WebSockets.
// Uses MQTT Retained messages on per-player view topics + instant visibility-wake sync +
// host state persistence so the second player always receives game start & turn updates.
import type { ClientAction, Session } from '../shared/protocol.ts';
import { Room } from '../shared/room.ts';
import { saveSession, type Listener, type Transport } from './net.ts';

// All players must use the same broker cluster so pub/sub topics are shared across all devices.
const BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const HOST_SNAP_KEY = 'enoty.hostSnap';

const enc = new TextEncoder();
const dec = new TextDecoder();

function encodeLength(len: number): number[] {
  const out: number[] = [];
  do {
    let byte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) byte |= 0x80;
    out.push(byte);
  } while (len > 0);
  return out;
}

function encodeStr(s: string): Uint8Array {
  const b = enc.encode(s);
  const out = new Uint8Array(2 + b.length);
  out[0] = (b.length >> 8) & 0xff;
  out[1] = b.length & 0xff;
  out.set(b, 2);
  return out;
}

function buildPacket(type: number, body: Uint8Array): Uint8Array {
  const lenBytes = encodeLength(body.length);
  const pkt = new Uint8Array(1 + lenBytes.length + body.length);
  pkt[0] = type;
  pkt.set(lenBytes, 1);
  pkt.set(body, 1 + lenBytes.length);
  return pkt;
}

class MqttBus {
  private ws: WebSocket | null = null;
  private subs = new Map<string, (msg: any) => void>();
  private queue: Uint8Array[] = [];
  private ready = false;
  private closed = false;
  private pingTimer = 0;
  private reconnectTimer = 0;
  private pktId = 1;
  private bc: BroadcastChannel | null = null;

  private onState: (online: boolean) => void;

  constructor(onState: (online: boolean) => void) {
    this.onState = onState;
    try {
      // Zero-latency local bridge when testing in 2 tabs of the same browser
      this.bc = new BroadcastChannel('skazheni-enoty-mqtt-v1');
      this.bc.onmessage = (ev) => {
        const { topic, data } = ev.data || {};
        if (topic && data) this.subs.get(topic)?.(data);
      };
    } catch {
      /* BroadcastChannel optional */
    }
    this.connect();

    // Immediately wake & reconnect when user switches back to this mobile tab/app
    const onWake = () => {
      if (this.closed) return;
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
        clearTimeout(this.reconnectTimer);
        this.connect();
      } else if (this.ready && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(new Uint8Array([0xc0, 0x00]));
        } catch {
          this.ws.close();
        }
        this.onState(true);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') onWake();
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', onWake);
      window.addEventListener('focus', onWake);
      window.addEventListener('online', onWake);
    }
  }

  private connect() {
    if (this.closed) return;
    clearTimeout(this.reconnectTimer);
    try {
      const ws = new WebSocket(BROKER_URL, 'mqtt');
      ws.binaryType = 'arraybuffer';
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        const cid = 'en_' + Math.random().toString(36).slice(2, 10) + '_' + (Date.now() % 10000);
        const cidBytes = encodeStr(cid);
        // MQTT 3.1.1 CONNECT packet, CleanSession=1, KeepAlive=30s
        const head = new Uint8Array([0, 4, 77, 81, 84, 84, 4, 2, 0, 30]);
        const body = new Uint8Array(head.length + cidBytes.length);
        body.set(head, 0);
        body.set(cidBytes, head.length);
        ws.send(buildPacket(0x10, body));
      };

      ws.onmessage = (ev) => {
        if (this.ws !== ws) return;
        const buf = new Uint8Array(ev.data as ArrayBuffer);
        let offset = 0;
        while (offset < buf.length) {
          const type = buf[offset];
          let mult = 1;
          let len = 0;
          let i = offset + 1;
          while (i < buf.length) {
            const b = buf[i++];
            len += (b & 0x7f) * mult;
            mult *= 128;
            if ((b & 0x80) === 0) break;
          }
          const end = i + len;
          if (end > buf.length) break;
          const payload = buf.subarray(i, end);
          offset = end;

          if (type === 0x20 && payload[1] === 0) {
            this.ready = true;
            for (const topic of this.subs.keys()) this.sendSub(topic);
            while (this.queue.length) ws.send(this.queue.shift()!);
            this.onState(true);
          } else if ((type & 0xf0) === 0x30) {
            const tLen = (payload[0] << 8) | payload[1];
            let msgStart = 2 + tLen;
            const qos = (type >> 1) & 0x03;
            if (qos > 0) msgStart += 2;
            const topic = dec.decode(payload.subarray(2, 2 + tLen));
            const text = dec.decode(payload.subarray(msgStart));
            try {
              const data = JSON.parse(text);
              this.subs.get(topic)?.(data);
            } catch {
              /* ignore malformed */
            }
          }
        }
      };

      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ready = false;
        this.onState(false);
        if (!this.closed) {
          this.reconnectTimer = window.setTimeout(() => this.connect(), 600);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };

      clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => {
        if (this.ready && this.ws?.readyState === WebSocket.OPEN) {
          try {
            this.ws.send(new Uint8Array([0xc0, 0x00]));
          } catch {
            this.ws.close();
          }
        }
      }, 12_000);
    } catch {
      this.reconnectTimer = window.setTimeout(() => this.connect(), 800);
    }
  }

  private sendSub(topic: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const id = (this.pktId++ & 0x7fff) || 1;
    const t = encodeStr(topic);
    const body = new Uint8Array(2 + t.length + 1);
    body[0] = (id >> 8) & 0xff;
    body[1] = id & 0xff;
    body.set(t, 2);
    body[body.length - 1] = 0;
    this.ws.send(buildPacket(0x82, body));
  }

  subscribe(topic: string, cb: (msg: any) => void) {
    this.subs.set(topic, cb);
    if (this.ready) this.sendSub(topic);
  }

  unsubscribe(topic: string) {
    this.subs.delete(topic);
  }

  publish(topic: string, data: unknown, retain = false) {
    try {
      this.bc?.postMessage({ topic, data });
    } catch {}
    const t = encodeStr(topic);
    const p = enc.encode(JSON.stringify(data));
    const body = new Uint8Array(t.length + p.length);
    body.set(t, 0);
    body.set(p, t.length);
    // 0x31 = PUBLISH with RETAIN flag so reconnecting mobile tabs immediately receive their latest view
    const pkt = buildPacket(retain ? 0x31 : 0x30, body);
    if (this.ready && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(pkt);
        return;
      } catch {
        /* fall through to queue */
      }
    }
    if (this.queue.length > 60) this.queue.shift();
    this.queue.push(pkt);
  }

  close() {
    this.closed = true;
    clearInterval(this.pingTimer);
    clearTimeout(this.reconnectTimer);
    try {
      this.bc?.close();
    } catch {}
    this.ws?.close();
  }
}

export class CloudTransport implements Transport {
  private bus: MqttBus;
  private hostRoom: Room | null = null;
  private hostTimer = 0;
  private syncTimer = 0;
  private clientTimer = 0;
  private session: (Session & { isHost?: boolean }) | null = null;
  private inboxTopic = '';
  private pendingReqs = new Map<string, (res: any) => void>();
  private lastSeen = new Map<string, number>();

  private l: Listener;

  constructor(l: Listener) {
    this.l = l;
    l.onStatus('connecting');
    this.bus = new MqttBus((online) => {
      if (online) {
        l.onStatus('online');
        if (this.hostRoom && this.session?.isHost) {
          // Host just reconnected after mobile tab switch -> re-broadcast views to everyone immediately!
          this.broadcastViews(this.hostRoom);
        } else if (this.session && !this.session.isHost) {
          this.bus.publish(this.reqTopic(this.session.code), {
            from: this.session.playerId,
            kind: 'ping',
          });
        }
      } else {
        l.onStatus('reconnecting');
      }
    });
  }

  private reqTopic(code: string) {
    return `skazheni-enoty-v1/${code}/req`;
  }
  private clientTopic(code: string, pid: string) {
    return `skazheni-enoty-v1/${code}/c/${pid}`;
  }

  private saveHostSnapshot(r: Room | null) {
    try {
      if (!r) sessionStorage.removeItem(HOST_SNAP_KEY);
      else {
        sessionStorage.setItem(
          HOST_SNAP_KEY,
          JSON.stringify({
            code: r.code,
            hostId: r.hostId,
            members: r.members,
            game: r.game,
            ts: Date.now(),
          }),
        );
      }
    } catch {
      /* ignore */
    }
  }

  private startHostLoops(room: Room) {
    const roomCode = room.code;
    this.bus.subscribe(this.reqTopic(roomCode), (msg) => this.onHostRequest(msg));
    clearInterval(this.hostTimer);
    this.hostTimer = window.setInterval(() => {
      if (!this.hostRoom) return;
      const now = Date.now();
      this.hostRoom.tick(now);
      for (const mem of this.hostRoom.members) {
        if (mem.isBot || mem.id === this.session?.playerId) continue;
        const seen = this.lastSeen.get(mem.id) ?? now;
        if (mem.connected && now - seen > 25_000) {
          this.hostRoom.setConnected(mem.id, false);
        }
      }
    }, 200);

    // Periodic heartbeat broadcast every 2s so any client that switched tabs catches up automatically
    clearInterval(this.syncTimer);
    this.syncTimer = window.setInterval(() => {
      if (this.hostRoom) this.broadcastViews(this.hostRoom);
    }, 2000);
  }

  private createRoomInstance(roomCode: string): Room {
    return new Room(roomCode, {
      onChange: (r) => {
        this.saveHostSnapshot(r);
        this.broadcastViews(r);
      },
      onEvents: (pid, events) => {
        if (pid === this.session?.playerId) {
          this.l.onEvents(events);
        } else {
          this.bus.publish(this.clientTopic(roomCode, pid), { k: 'events', events });
        }
      },
    });
  }

  async enter(mode: 'create' | 'join', name: string, avatar: string, code?: string): Promise<string | null> {
    if (mode === 'create') {
      const roomCode = String(Math.floor(1000 + Math.random() * 9000));
      const room = this.createRoomInstance(roomCode);
      const m = room.join(name, avatar);
      if (typeof m === 'string') return m;
      this.hostRoom = room;
      this.session = { code: roomCode, playerId: m.id, token: m.token, isHost: true };
      saveSession(this.session);
      this.saveHostSnapshot(room);
      this.startHostLoops(room);
      this.broadcastViews(room);
      return null;
    }

    // Join an existing room hosted by another phone/browser
    const cleanCode = String(code ?? '').trim();
    const tempId = 'tmp_' + Math.random().toString(36).slice(2, 9);
    const tempTopic = this.clientTopic(cleanCode, tempId);
    this.bus.subscribe(tempTopic, (msg) => {
      if (msg.k === 'ack' && msg.reqId) this.pendingReqs.get(msg.reqId)?.(msg.res);
    });

    const res = await this.sendReq(cleanCode, tempId, 'join', { name, avatar }, 8000);
    this.bus.unsubscribe(tempTopic);
    if (!res.ok) return res.error || 'Кімнату з таким кодом не знайдено.';

    const sess: Session = res.session!;
    this.session = sess;
    saveSession(sess);
    this.listenAsClient(sess.code, sess.playerId);
    if (res.view) this.l.onView(res.view);
    return null;
  }

  private listenAsClient(code: string, pid: string) {
    if (this.inboxTopic) this.bus.unsubscribe(this.inboxTopic);
    this.inboxTopic = this.clientTopic(code, pid);
    this.bus.subscribe(this.inboxTopic, (msg) => {
      if (msg.k === 'view') this.l.onView(msg.view);
      else if (msg.k === 'events') this.l.onEvents(msg.events);
      else if (msg.k === 'kicked') {
        saveSession(null);
        this.session = null;
        this.l.onKicked();
      } else if (msg.k === 'ack' && msg.reqId) {
        this.pendingReqs.get(msg.reqId)?.(msg.res);
      }
    });
    clearInterval(this.clientTimer);
    this.clientTimer = window.setInterval(() => {
      if (this.session && !this.session.isHost) {
        this.bus.publish(this.reqTopic(this.session.code), {
          from: this.session.playerId,
          kind: 'ping',
        });
      }
    }, 2500);
  }

  async resume(s: Session & { isHost?: boolean }): Promise<boolean> {
    if (s.isHost) {
      try {
        const snap = JSON.parse(sessionStorage.getItem(HOST_SNAP_KEY) ?? 'null');
        if (snap && snap.code === s.code && Date.now() - (snap.ts ?? 0) < 3600_000) {
          const room = this.createRoomInstance(snap.code);
          room.hostId = snap.hostId;
          room.members = snap.members;
          room.game = snap.game;
          this.hostRoom = room;
          this.session = s;
          for (const m of room.members) this.lastSeen.set(m.id, Date.now());
          this.startHostLoops(room);
          this.broadcastViews(room);
          return true;
        }
      } catch {
        /* ignore */
      }
      saveSession(null);
      return false;
    }
    this.session = s;
    this.listenAsClient(s.code, s.playerId);
    const res = await this.sendReq(s.code, s.playerId, 'resume', s, 6000);
    if (!res.ok) {
      this.session = null;
      saveSession(null);
      return false;
    }
    if (res.view) this.l.onView(res.view);
    return true;
  }

  async act(a: ClientAction): Promise<string | null> {
    if (!this.session) return 'Ти не в кімнаті.';
    if (this.hostRoom && this.session.isHost) {
      const err = this.hostRoom.action(this.session.playerId, a);
      if (!err && (a.t === 'leave' || a.t === 'kick')) {
        const gone = a.t === 'leave' ? this.session.playerId : a.playerId;
        if (gone !== this.session.playerId) {
          this.bus.publish(this.clientTopic(this.hostRoom.code, gone), { k: 'kicked' });
        } else {
          clearInterval(this.hostTimer);
          clearInterval(this.syncTimer);
          this.saveHostSnapshot(null);
          this.hostRoom = null;
          this.session = null;
          saveSession(null);
        }
      }
      return err;
    }

    const res = await this.sendReq(this.session.code, this.session.playerId, 'act', a, 7000);
    if (a.t === 'leave' && res.ok) {
      clearInterval(this.clientTimer);
      this.session = null;
      saveSession(null);
    }
    return res.ok ? null : res.error;
  }

  private sendReq(code: string, from: string, kind: string, payload: unknown, timeoutMs: number): Promise<any> {
    const reqId = Math.random().toString(36).slice(2, 10);
    return new Promise((resolve) => {
      let retryTimer = 0;
      const t = window.setTimeout(() => {
        clearInterval(retryTimer);
        this.pendingReqs.delete(reqId);
        resolve({ ok: false, error: 'Кімнату не знайдено або немає зв’язку.' });
      }, timeoutMs);
      this.pendingReqs.set(reqId, (res) => {
        clearTimeout(t);
        clearInterval(retryTimer);
        this.pendingReqs.delete(reqId);
        resolve(res);
      });
      const send = () => this.bus.publish(this.reqTopic(code), { reqId, from, kind, payload });
      send();
      // Retry request every 1.4s in case host phone tab was just waking up
      retryTimer = window.setInterval(send, 1400);
    });
  }

  private onHostRequest(msg: { reqId?: string; from?: string; kind?: string; payload?: any }) {
    const r = this.hostRoom;
    if (!r || !msg.from) return;
    this.lastSeen.set(msg.from, Date.now());

    if (msg.kind === 'ping') {
      const m = r.members.find((x) => x.id === msg.from);
      if (m && !m.connected) r.setConnected(msg.from, true);
      // Always push fresh view back to pinging client so they never miss game start or state change
      if (m) {
        this.bus.publish(this.clientTopic(r.code, m.id), { k: 'view', view: r.viewFor(m.id) }, true);
      }
      return;
    }

    const reply = (toId: string, res: any) => {
      this.bus.publish(this.clientTopic(r.code, toId), { k: 'ack', reqId: msg.reqId, res });
    };

    if (msg.kind === 'join') {
      // Idempotent join if retry packet arrives after member already joined
      const existing = r.members.find((x) => !x.isBot && x.id !== r.hostId && x.name === String(msg.payload?.name ?? '').trim());
      if (existing && msg.reqId) {
        this.lastSeen.set(existing.id, Date.now());
        reply(msg.from, {
          ok: true,
          session: { code: r.code, playerId: existing.id, token: existing.token },
          view: r.viewFor(existing.id),
        });
        this.broadcastViews(r);
        return;
      }
      const m = r.join(String(msg.payload?.name ?? ''), String(msg.payload?.avatar ?? ''));
      if (typeof m === 'string') return reply(msg.from, { ok: false, error: m });
      this.lastSeen.set(m.id, Date.now());
      reply(msg.from, {
        ok: true,
        session: { code: r.code, playerId: m.id, token: m.token },
        view: r.viewFor(m.id),
      });
      this.saveHostSnapshot(r);
      this.broadcastViews(r);
      return;
    }

    if (msg.kind === 'resume') {
      const m = r.resume(String(msg.payload?.playerId ?? ''), String(msg.payload?.token ?? ''));
      if (!m) return reply(msg.from, { ok: false, error: 'Сесію не знайдено.' });
      r.setConnected(m.id, true);
      reply(msg.from, { ok: true, view: r.viewFor(m.id) });
      this.broadcastViews(r);
      return;
    }

    if (msg.kind === 'act') {
      const err = r.action(msg.from, msg.payload as ClientAction);
      if (err) return reply(msg.from, { ok: false, error: err });
      reply(msg.from, { ok: true });
      if (msg.payload?.t === 'kick') {
        this.bus.publish(this.clientTopic(r.code, msg.payload.playerId), { k: 'kicked' });
      }
    }
  }

  private broadcastViews(r: Room) {
    for (const m of r.members) {
      if (m.isBot) continue;
      const view = r.viewFor(m.id);
      if (m.id === this.session?.playerId) {
        this.l.onView(view);
      } else {
        // Publish with retain=true so if the player's tab was in the background, broker delivers immediately on wake
        this.bus.publish(this.clientTopic(r.code, m.id), { k: 'view', view }, true);
      }
    }
  }

  close() {
    clearInterval(this.hostTimer);
    clearInterval(this.syncTimer);
    clearInterval(this.clientTimer);
    this.bus.close();
  }
}
