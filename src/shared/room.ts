// A game room: lobby, members, bots, reconnect/autopilot and the running game.
// Transport-agnostic: the Socket.IO server and the offline browser host both wrap this class.
import { AVATARS, MAX_PLAYERS, MIN_PLAYERS } from './cards.ts';
import { botDecide, botName, botObserve, newBotMemory, type BotMemory } from './bots.ts';
import {
  createGame,
  currentPlayer,
  drawCard,
  findPlayer,
  flushEvents,
  forfeit,
  giveFavor,
  nextPlayerId,
  petardsInDeck,
  placePetard,
  playCards,
  playNope,
  tick,
  type GameEvent,
  type GameState,
} from './engine.ts';
import type { ClientAction, RoomView } from './protocol.ts';

export interface Member {
  id: string;
  token: string;
  name: string;
  avatar: string;
  isBot: boolean;
  connected: boolean;
  disconnectedAt: number;
}

export interface RoomCallbacks {
  /** Called whenever views must be re-sent to everybody. */
  onChange(room: Room): void;
  /** Called with events for a specific member (already privacy-filtered). */
  onEvents(memberId: string, events: GameEvent[]): void;
}

const AUTOPILOT_AFTER_MS = 20_000;
const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export class Room {
  members: Member[] = [];
  hostId = '';
  game: GameState | null = null;
  lastActivity = Date.now();
  private botMem = new Map<string, BotMemory>();
  private botReadyAt = new Map<string, number>();
  private botCount = 0;

  code: string;
  private cb: RoomCallbacks;
  offline: boolean;

  constructor(code: string, cb: RoomCallbacks, offline = false) {
    this.code = code;
    this.cb = cb;
    this.offline = offline;
  }

  // ───────────── membership ─────────────

  join(name: string, avatar: string): Member | string {
    if (this.game && this.game.phase !== 'over') return 'Гра вже йде. Зачекай наступного раунду.';
    if (this.members.length >= MAX_PLAYERS) return 'Кімната заповнена (макс. 5 єнотів).';
    const m: Member = {
      id: randomId(),
      token: randomId() + randomId(),
      name: (name.trim() || 'Єнот').slice(0, 16),
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
      isBot: false,
      connected: true,
      disconnectedAt: 0,
    };
    this.members.push(m);
    if (!this.hostId) this.hostId = m.id;
    this.touch();
    return m;
  }

  resume(playerId: string, token: string): Member | null {
    const m = this.members.find((x) => x.id === playerId && x.token === token);
    if (!m) return null;
    m.connected = true;
    this.touch();
    return m;
  }

  setConnected(playerId: string, connected: boolean) {
    const m = this.members.find((x) => x.id === playerId);
    if (!m) return;
    m.connected = connected;
    m.disconnectedAt = connected ? 0 : Date.now();
    this.changed();
  }

  humans(): Member[] {
    return this.members.filter((m) => !m.isBot);
  }

  private removeMember(id: string) {
    const m = this.members.find((x) => x.id === id);
    if (!m) return;
    if (this.game && findPlayer(this.game, id)) forfeit(this.game, id);
    this.members = this.members.filter((x) => x.id !== id);
    if (this.hostId === id) this.hostId = this.humans()[0]?.id ?? '';
  }

  // ───────────── actions ─────────────

  action(pid: string, a: ClientAction, now = Date.now()): string | null {
    const m = this.members.find((x) => x.id === pid);
    if (!m) return 'Тебе немає в кімнаті.';
    this.touch();
    const err = this.apply(m, a, now);
    if (!err) this.changed();
    return err;
  }

  private apply(m: Member, a: ClientAction, now: number): string | null {
    const isHost = m.id === this.hostId;
    const inGame = !!this.game && this.game.phase !== 'over';
    switch (a.t) {
      case 'addBot': {
        if (!isHost) return 'Тільки господар кімнати може додавати ботів.';
        if (inGame) return 'Гра вже йде.';
        if (this.members.length >= MAX_PLAYERS) return 'Кімната заповнена.';
        const id = 'bot-' + randomId();
        this.members.push({
          id,
          token: '',
          name: botName(this.botCount++),
          avatar: AVATARS[(this.members.length + 3) % AVATARS.length],
          isBot: true,
          connected: true,
          disconnectedAt: 0,
        });
        return null;
      }
      case 'kick':
        if (!isHost && a.playerId !== m.id) return 'Тільки господар може виганяти.';
        this.removeMember(a.playerId);
        return null;
      case 'leave':
        this.removeMember(m.id);
        return null;
      case 'start':
      case 'restart': {
        if (!isHost) return 'Почати гру може лише господар.';
        if (inGame) return 'Гра вже йде.';
        if (this.members.length < MIN_PLAYERS) return 'Потрібно щонайменше 2 єноти (додай бота!).';
        this.game = createGame(this.members.map((x) => ({ id: x.id, name: x.name, avatar: x.avatar, isBot: x.isBot })));
        this.botMem.clear();
        this.botReadyAt.clear();
        for (const x of this.members) this.botMem.set(x.id, newBotMemory());
        this.dispatchEvents();
        return null;
      }
    }

    const g = this.game;
    if (!g) return 'Гра ще не почалась.';
    let err: string | null;
    switch (a.t) {
      case 'play':
        err = playCards(g, m.id, a.cardIds, a.target, now);
        break;
      case 'nope':
        err = playNope(g, m.id, now);
        break;
      case 'draw':
        err = drawCard(g, m.id);
        break;
      case 'favor':
        err = giveFavor(g, m.id, a.cardId);
        break;
      case 'place':
        err = placePetard(g, m.id, a.position);
        if (!err) for (const mem of this.botMem.values()) botObserve(mem, 'placed');
        break;
      default:
        err = 'Невідома дія.';
    }
    if (!err) this.dispatchEvents();
    return err;
  }

  /** Periodic driver: resolves nope windows and lets bots / autopilot act. */
  tick(now = Date.now()) {
    const g = this.game;
    if (!g || g.phase === 'over') return;
    if (tick(g, now)) {
      this.dispatchEvents();
      this.changed();
    }

    for (const m of this.members) {
      const autopilot = !m.isBot && !m.connected && now - m.disconnectedAt > AUTOPILOT_AFTER_MS;
      if (!m.isBot && !autopilot) continue;
      const mem = this.botMem.get(m.id) ?? newBotMemory();
      this.botMem.set(m.id, mem);

      // Bots "think" for a moment before acting so humans can follow the action.
      if (!this.needsAction(m.id)) {
        this.botReadyAt.delete(m.id);
        continue;
      }
      const ready = this.botReadyAt.get(m.id);
      if (ready === undefined) {
        const quick = !!g.pending;
        this.botReadyAt.set(m.id, now + (quick ? 400 + Math.random() * 1200 : 900 + Math.random() * 900));
        continue;
      }
      if (now < ready) continue;
      this.botReadyAt.delete(m.id);
      const decision = botDecide(g, m.id, mem, now, autopilot);
      if (decision && this.action(m.id, decision, now) && decision.t === 'play') this.action(m.id, { t: 'draw' }, now);
    }
  }

  private needsAction(id: string): boolean {
    const g = this.game!;
    const p = findPlayer(g, id);
    if (!p?.alive) return false;
    if (g.pending) {
      const mem = this.botMem.get(id);
      return (
        p.hand.some((c) => c.type === 'nope') &&
        g.pending.lastNopeBy !== id &&
        !(g.pending.nopes === 0 && g.pending.by === id) &&
        !mem?.considered.has(`${g.pending.id}:${g.pending.nopes}`)
      );
    }
    if (g.phase === 'favor') return g.favor?.giver === id;
    if (g.phase === 'defuse') return g.defuse?.playerId === id;
    return g.phase === 'turn' && currentPlayer(g).id === id;
  }

  private dispatchEvents() {
    const g = this.game;
    if (!g) return;
    const events = flushEvents(g);
    if (!events.length) return;
    for (const e of events) {
      // Keep bot deck knowledge in sync.
      if (e.kind === 'future' && e.to) for (const id of e.to) botObserve(this.botMem.get(id) ?? newBotMemory(), 'future', e);
      if (e.kind === 'drew' || e.kind === 'shuffled') for (const mem of this.botMem.values()) botObserve(mem, e.kind);
    }
    for (const m of this.members) {
      if (m.isBot) continue;
      const mine = events.filter((e) => !e.to || e.to.includes(m.id));
      if (mine.length) this.cb.onEvents(m.id, mine);
    }
  }

  private changed() {
    this.cb.onChange(this);
  }

  private touch() {
    this.lastActivity = Date.now();
  }

  // ───────────── views ─────────────

  viewFor(pid: string, now = Date.now()): RoomView {
    const g = this.game;
    return {
      code: this.code,
      me: pid,
      hostId: this.hostId,
      offline: this.offline,
      members: this.members.map((m) => {
        const p = g ? findPlayer(g, m.id) : undefined;
        return {
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          isBot: m.isBot,
          connected: m.connected,
          alive: p?.alive,
          cardCount: p?.hand.length,
        };
      }),
      game: g
        ? {
            phase: g.phase,
            hand: findPlayer(g, pid)?.hand ?? [],
            current: currentPlayer(g).id,
            turnsLeft: g.turnsLeft,
            nextPlayer: nextPlayerId(g),
            deckCount: g.deck.length,
            petardsInDeck: petardsInDeck(g),
            discardTop: g.discard.slice(-4).map((c) => c.type),
            pending: g.pending && {
              id: g.pending.id,
              by: g.pending.by,
              type: g.pending.type,
              pair: g.pending.pair,
              target: g.pending.target,
              nopes: g.pending.nopes,
              lastNopeBy: g.pending.lastNopeBy,
              msLeft: Math.max(0, g.pending.deadline - now),
              windowMs: g.opts.nopeWindowMs,
            },
            favor: g.favor,
            defuse: g.defuse && { playerId: g.defuse.playerId },
            winner: g.winner,
            log: g.log.slice(-12),
          }
        : null,
    };
  }
}
