// Pure, server-authoritative game engine. All functions mutate the given state in place and
// return an error string (Ukrainian, user-facing) or null on success. Time is passed in
// explicitly so the same engine runs on the Node server and in the browser (offline vs bots).
import { CARD_DEFS, type CardType } from './cards.ts';

export interface Card {
  id: number;
  type: CardType;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  hand: Card[];
  alive: boolean;
  isBot: boolean;
}

export type Phase = 'turn' | 'favor' | 'defuse' | 'over';

export interface PendingAction {
  id: number;
  by: string;
  type: CardType;
  cards: Card[];
  target?: string;
  pair: boolean;
  nopes: number;
  lastNopeBy?: string;
  deadline: number;
}

/** Events drive animations/toasts on clients. `to` restricts delivery to specific players. */
export type GameEvent = { to?: string[] } & (
  | { kind: 'played'; by: string; type: CardType; count: number; target?: string }
  | { kind: 'noped'; by: string; nopes: number }
  | { kind: 'resolved'; by: string; type: CardType; cancelled: boolean }
  | { kind: 'drew'; by: string }
  | { kind: 'gotCard'; card: CardType; cardId?: number; from?: string; reason: 'draw' | 'steal' | 'favor' }
  | { kind: 'lostCard'; card: CardType; taker: string; reason: 'steal' | 'favor' }
  | { kind: 'future'; cards: CardType[] }
  | { kind: 'exploded'; by: string; saved: boolean }
  | { kind: 'eliminated'; by: string }
  | { kind: 'shuffled'; by: string }
  | { kind: 'turn'; player: string; turns: number }
  | { kind: 'winner'; player: string }
);

export interface GameOptions {
  handSize: number;
  nopeWindowMs: number;
}

export const DEFAULT_OPTIONS: GameOptions = { handSize: 7, nopeWindowMs: 4000 };

export interface GameState {
  phase: Phase;
  players: PlayerState[];
  /** deck[0] is the top of the trash can. */
  deck: Card[];
  discard: Card[];
  current: number;
  turnsLeft: number;
  pending: PendingAction | null;
  favor: { giver: string; receiver: string } | null;
  defuse: { playerId: string; card: Card } | null;
  winner: string | null;
  log: string[];
  events: GameEvent[];
  nextId: number;
  opts: GameOptions;
}

export interface NewPlayer {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
}

export function shuffleInPlace<T>(arr: T[], rnd: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(players: NewPlayer[], opts: Partial<GameOptions> = {}): GameState {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const n = players.length;
  let nextId = 1;
  const make = (type: CardType): Card => ({ id: nextId++, type });

  const deck: Card[] = [];
  for (const def of Object.values(CARD_DEFS)) {
    for (let i = 0; i < def.count; i++) deck.push(make(def.type));
  }
  shuffleInPlace(deck);

  const state: GameState = {
    phase: 'turn',
    players: players.map((p) => ({ ...p, hand: [], alive: true })),
    deck,
    discard: [],
    current: 0,
    turnsLeft: 1,
    pending: null,
    favor: null,
    defuse: null,
    winner: null,
    log: [],
    events: [],
    nextId: 0,
    opts: o,
  };

  for (const p of state.players) {
    p.hand.push(make('doormat'), ...deck.splice(0, o.handSize));
  }
  // Classic distribution: 6 defuses total, one per player, a couple of spares in the deck.
  const spareDoormats = Math.max(0, Math.min(2, 6 - n));
  for (let i = 0; i < spareDoormats; i++) deck.push(make('doormat'));
  for (let i = 0; i < n - 1; i++) deck.push(make('petard'));
  shuffleInPlace(deck);

  state.nextId = nextId;
  state.current = Math.floor(Math.random() * n);
  addLog(state, `🦝 Нічний дожір почався! У всіх по 1 Килимку та ${o.handSize} карт.`);
  addLog(state, `🧨 У колоді заховано Петард: ${n - 1} шт.`);
  addLog(state, `🐾 Першим ходить ${currentPlayer(state).name}!`);
  emit(state, { kind: 'turn', player: currentPlayer(state).id, turns: 1 });
  return state;
}

// ───────────────────────── helpers ─────────────────────────

export function currentPlayer(s: GameState): PlayerState {
  return s.players[s.current];
}

export function findPlayer(s: GameState, id: string): PlayerState | undefined {
  return s.players.find((p) => p.id === id);
}

export function alivePlayers(s: GameState): PlayerState[] {
  return s.players.filter((p) => p.alive);
}

export function petardsInDeck(s: GameState): number {
  return s.deck.filter((c) => c.type === 'petard').length;
}

function addLog(s: GameState, line: string) {
  s.log.push(line);
  if (s.log.length > 40) s.log.splice(0, s.log.length - 40);
}

function emit(s: GameState, e: GameEvent) {
  s.events.push(e);
}

/** Takes and clears accumulated events (called by the room after each change). */
export function flushEvents(s: GameState): GameEvent[] {
  const ev = s.events;
  s.events = [];
  return ev;
}

function nameOf(s: GameState, id: string | undefined): string {
  return (id && findPlayer(s, id)?.name) || '???';
}

function nextAliveIndex(s: GameState, from: number): number {
  const n = s.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (s.players[i].alive) return i;
  }
  return from;
}

/** The player who would move after the current one (used by bots and UI hints). */
export function nextPlayerId(s: GameState): string {
  return s.players[nextAliveIndex(s, s.current)].id;
}

function advance(s: GameState, turns: number) {
  s.current = nextAliveIndex(s, s.current);
  s.turnsLeft = turns;
  const p = currentPlayer(s);
  emit(s, { kind: 'turn', player: p.id, turns });
  if (turns > 1) addLog(s, `⚠️ ${p.name} має ходити ${turns} рази поспіль!`);
}

function endOneTurn(s: GameState) {
  s.turnsLeft -= 1;
  if (s.turnsLeft <= 0) advance(s, 1);
  else emit(s, { kind: 'turn', player: currentPlayer(s).id, turns: s.turnsLeft });
}

function takeCards(p: PlayerState, ids: number[]): Card[] | null {
  const cards: Card[] = [];
  for (const id of ids) {
    const idx = p.hand.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    cards.push(p.hand[idx]);
  }
  p.hand = p.hand.filter((c) => !ids.includes(c.id));
  return cards;
}

function checkWinner(s: GameState): boolean {
  const alive = alivePlayers(s);
  if (alive.length <= 1) {
    s.phase = 'over';
    s.pending = null;
    s.favor = null;
    s.defuse = null;
    s.winner = alive[0]?.id ?? null;
    if (s.winner) {
      addLog(s, `🏆 ${nameOf(s, s.winner)} — король сміттєвого бака!`);
      emit(s, { kind: 'winner', player: s.winner });
    }
    return true;
  }
  return false;
}

function eliminate(s: GameState, p: PlayerState) {
  p.alive = false;
  s.discard.push(...p.hand);
  p.hand = [];
  emit(s, { kind: 'eliminated', by: p.id });
}

/** Players who could still respond to the current pending action with a nope. */
function canAnyoneNope(s: GameState): boolean {
  const pend = s.pending;
  if (!pend) return false;
  return s.players.some(
    (p) => p.alive && p.id !== pend.lastNopeBy && (pend.nopes > 0 || p.id !== pend.by) && p.hand.some((c) => c.type === 'nope'),
  );
}

function setNopeDeadline(s: GameState, now: number) {
  if (!s.pending) return;
  // Keep action visible on table long enough for humans to see what was played.
  s.pending.deadline = now + (canAnyoneNope(s) ? s.opts.nopeWindowMs : 2200);
}

// ───────────────────────── actions ─────────────────────────

export function playCards(s: GameState, pid: string, cardIds: number[], target: string | undefined, now: number): string | null {
  if (s.phase !== 'turn') return 'Зараз не можна грати карти.';
  if (s.pending) return 'Зачекай, поки вирішиться попередня дія.';
  const p = currentPlayer(s);
  if (p.id !== pid) return 'Зараз не твій хід.';
  if (cardIds.length < 1 || cardIds.length > 2) return 'Можна зіграти 1 карту або пару.';

  const cards = cardIds.map((id) => p.hand.find((c) => c.id === id));
  if (cards.some((c) => !c)) return 'У тебе немає такої карти.';
  const type = cards[0]!.type;
  const def = CARD_DEFS[type];
  const isPair = cardIds.length === 2;

  if (isPair) {
    if (cards[1]!.type !== type || !def.pair) return 'Пара має складатися з двох однакових єнотів.';
  } else {
    if (def.pair) return 'Єнотів банди грають лише парою.';
    if (type === 'nope') return '«Моє! Не руш!» грають у відповідь на чужу дію.';
    if (type === 'doormat' || type === 'petard') return 'Ця карта грається автоматично.';
  }

  if (def.targeted) {
    const t = target ? findPlayer(s, target) : undefined;
    if (!t || !t.alive || t.id === pid) return 'Обери суперника.';
    if (t.hand.length === 0) return `У ${t.name} порожні лапи.`;
  }

  takeCards(p, cardIds);
  s.discard.push(...(cards as Card[]));
  s.pending = {
    id: s.nextId++,
    by: pid,
    type,
    cards: cards as Card[],
    target: def.targeted ? target : undefined,
    pair: isPair,
    nopes: 0,
    deadline: 0,
  };
  setNopeDeadline(s, now);
  emit(s, { kind: 'played', by: pid, type, count: cardIds.length, target: s.pending.target });
  const tgt = s.pending.target ? ` → ${nameOf(s, s.pending.target)}` : '';
  addLog(s, `${p.name}: ${isPair ? 'пара ' : ''}«${def.title}»${tgt}`);
  return null;
}

export function playNope(s: GameState, pid: string, now: number): string | null {
  const pend = s.pending;
  if (!pend) return 'Нічого скасовувати.';
  if (now > pend.deadline) return 'Запізно!';
  const p = findPlayer(s, pid);
  if (!p || !p.alive) return 'Ти поза грою.';
  if (pend.lastNopeBy === pid) return 'Ти вже сказав своє «Ні».';
  if (pend.nopes === 0 && pend.by === pid) return 'Не можна скасувати власну дію.';
  const nope = p.hand.find((c) => c.type === 'nope');
  if (!nope) return 'Немає карти «Моє! Не руш!».';
  takeCards(p, [nope.id]);
  s.discard.push(nope);
  pend.nopes += 1;
  pend.lastNopeBy = pid;
  setNopeDeadline(s, now);
  emit(s, { kind: 'noped', by: pid, nopes: pend.nopes });
  addLog(s, `🛑 ${p.name}: «${pend.nopes % 2 ? 'Моє! Не руш!' : 'А от і ні — руш!'}»`);
  return null;
}

/** Resolves the pending action once its nope window has expired. */
export function tick(s: GameState, now: number): boolean {
  const pend = s.pending;
  if (!pend || now < pend.deadline) return false;
  s.pending = null;
  const cancelled = pend.nopes % 2 === 1;
  emit(s, { kind: 'resolved', by: pend.by, type: pend.type, cancelled });
  if (cancelled) {
    addLog(s, `❌ «${CARD_DEFS[pend.type].title}» скасовано.`);
    return true;
  }
  resolve(s, pend);
  return true;
}

function resolve(s: GameState, pend: PendingAction) {
  const actor = findPlayer(s, pend.by)!;
  if (!actor.alive) return;
  if (pend.pair) {
    const t = findPlayer(s, pend.target!)!;
    if (!t.alive || t.hand.length === 0) return;
    const stealIdx = Math.floor(Math.random() * t.hand.length);
    const card = t.hand[stealIdx];
    t.hand = t.hand.filter((_, i) => i !== stealIdx);
    actor.hand = [...actor.hand, card];
    emit(s, { kind: 'gotCard', card: card.type, cardId: card.id, from: t.id, reason: 'steal', to: [actor.id] });
    emit(s, { kind: 'lostCard', card: card.type, taker: actor.id, reason: 'steal', to: [t.id] });
    addLog(s, `🫳 ${actor.name} поцупив карту в ${t.name}.`);
    return;
  }
  switch (pend.type) {
    case 'blame': {
      const turns = s.turnsLeft > 1 ? s.turnsLeft + 2 : 2;
      addLog(s, `👉 ${actor.name} переводить стрілки!`);
      advance(s, turns);
      break;
    }
    case 'bush':
      addLog(s, `🌿 ${actor.name} шмигнув у кущі.`);
      endOneTurn(s);
      break;
    case 'radar':
      emit(s, { kind: 'future', cards: s.deck.slice(0, 3).map((c) => c.type), to: [actor.id] });
      addLog(s, `👃 ${actor.name} винюхує верхні карти колоди…`);
      break;
    case 'shuffle':
      shuffleInPlace(s.deck);
      emit(s, { kind: 'shuffled', by: actor.id });
      addLog(s, `🌪️ ${actor.name} перетасував колоду!`);
      break;
    case 'favor': {
      const t = findPlayer(s, pend.target!)!;
      if (!t.alive || t.hand.length === 0) return;
      s.phase = 'favor';
      s.favor = { giver: t.id, receiver: actor.id };
      addLog(s, `🥺 ${t.name} має поділитися ничкою з ${actor.name}.`);
      break;
    }
    default:
      break;
  }
}

export function giveFavor(s: GameState, pid: string, cardId: number): string | null {
  if (s.phase !== 'favor' || !s.favor) return 'Зараз ніхто не просить карту.';
  if (s.favor.giver !== pid) return 'Не тебе просять.';
  const giver = findPlayer(s, pid)!;
  const receiver = findPlayer(s, s.favor.receiver)!;
  const taken = takeCards(giver, [cardId]);
  if (!taken) return 'У тебе немає такої карти.';
  receiver.hand = [...receiver.hand, taken[0]];
  emit(s, { kind: 'gotCard', card: taken[0].type, cardId: taken[0].id, from: giver.id, reason: 'favor', to: [receiver.id] });
  emit(s, { kind: 'lostCard', card: taken[0].type, taker: receiver.id, reason: 'favor', to: [giver.id] });
  addLog(s, `🎁 ${giver.name} віддав карту ${receiver.name}.`);
  s.favor = null;
  s.phase = 'turn';
  return null;
}

export function drawCard(s: GameState, pid: string): string | null {
  if (s.phase !== 'turn') return 'Зараз не можна тягнути.';
  if (s.pending) return 'Зачекай, поки вирішиться дія.';
  const p = currentPlayer(s);
  if (p.id !== pid) return 'Зараз не твій хід.';
  const card = s.deck.shift();
  if (!card) return 'Колода порожня.';
  emit(s, { kind: 'drew', by: pid });

  if (card.type !== 'petard') {
    p.hand = [...p.hand, card];
    emit(s, { kind: 'gotCard', card: card.type, cardId: card.id, reason: 'draw', to: [pid] });
    const more = s.turnsLeft > 1 ? ` (ще ходів: ${s.turnsLeft - 1})` : ' і завершив хід';
    addLog(s, `🂠 ${p.name} взяв карту з колоди${more}.`);
    endOneTurn(s);
    return null;
  }

  const mat = p.hand.find((c) => c.type === 'doormat');
  if (mat) {
    takeCards(p, [mat.id]);
    s.discard.push(mat);
    s.phase = 'defuse';
    s.defuse = { playerId: pid, card };
    emit(s, { kind: 'exploded', by: pid, saved: true });
    addLog(s, `🧨 ${p.name} витягнув Петарду… але прикинувся Килимком!`);
    return null;
  }

  emit(s, { kind: 'exploded', by: pid, saved: false });
  addLog(s, `💥 БАХ! ${p.name} вилітає з дожору!`);
  eliminate(s, p);
  s.discard.push(card);
  if (!checkWinner(s)) advance(s, 1);
  return null;
}

/** position: 0 = top of the can, deck.length = bottom. */
export function placePetard(s: GameState, pid: string, position: number): string | null {
  if (s.phase !== 'defuse' || !s.defuse) return 'Зараз нема чого ховати.';
  if (s.defuse.playerId !== pid) return 'Петарду ховає інший гравець.';
  const pos = Math.max(0, Math.min(s.deck.length, Math.floor(position)));
  s.deck.splice(pos, 0, s.defuse.card);
  s.defuse = null;
  s.phase = 'turn';
  addLog(s, `🤫 ${nameOf(s, pid)} таємно сховав Петарду назад у бак.`);
  endOneTurn(s);
  return null;
}

/** A player leaves mid-game: they are knocked out and the game continues without them. */
export function forfeit(s: GameState, pid: string): void {
  const p = findPlayer(s, pid);
  if (!p || !p.alive || s.phase === 'over') return;
  const wasCurrent = currentPlayer(s).id === pid;

  if (s.defuse?.playerId === pid) {
    s.deck.splice(Math.floor(Math.random() * (s.deck.length + 1)), 0, s.defuse.card);
    s.defuse = null;
    s.phase = 'turn';
  }
  if (s.favor && (s.favor.giver === pid || s.favor.receiver === pid)) {
    s.favor = null;
    s.phase = 'turn';
  }
  if (s.pending?.by === pid) s.pending = null;

  addLog(s, `🚪 ${p.name} покинув дожір.`);
  eliminate(s, p);
  if (checkWinner(s)) return;
  if (wasCurrent) advance(s, 1);
}
