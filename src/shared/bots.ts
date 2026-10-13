// Simple heuristic raccoon bots. Also used to auto-play for humans who lost connection.
import { CARD_DEFS, PAIR_TYPES, type CardType } from './cards.ts';
import { currentPlayer, findPlayer, nextPlayerId, petardsInDeck, type GameState } from './engine.ts';
import type { ClientAction } from './protocol.ts';

export interface BotMemory {
  /** Known top cards of the deck (from Нюх-Радар), index 0 = top. */
  knownTop: CardType[];
  /** pending.id:nopes combos already considered, so we decide on each nope only once. */
  considered: Set<string>;
}

export const newBotMemory = (): BotMemory => ({ knownTop: [], considered: new Set() });

const GIVE_ORDER: CardType[] = ['shawarma', 'baron', 'punk', 'hoodie', 'shuffle', 'radar', 'favor', 'bush', 'blame', 'nope', 'doormat'];

function richestOpponent(s: GameState, me: string): string | undefined {
  return s.players
    .filter((p) => p.alive && p.id !== me && p.hand.length > 0)
    .sort((a, b) => b.hand.length - a.hand.length)[0]?.id;
}

/** Returns the action a bot would take now, or null if it has nothing to do. */
export function botDecide(s: GameState, pid: string, mem: BotMemory, now: number, autopilot = false): ClientAction | null {
  const me = findPlayer(s, pid);
  if (!me || !me.alive || s.phase === 'over') return null;
  const has = (t: CardType) => me.hand.find((c) => c.type === t);

  // 1) React to a pending action with a nope (autopilot never spends nopes on behalf of a human).
  if (s.pending && !autopilot) {
    const p = s.pending;
    const key = `${p.id}:${p.nopes}`;
    if (mem.considered.has(key) || !has('nope') || p.lastNopeBy === pid || now > p.deadline - 300) return null;
    if (p.nopes === 0 && p.by === pid) return null;
    mem.considered.add(key);
    let want = 0.06;
    const hurtsMe = p.target === pid || (p.type === 'blame' && nextPlayerId(s) === pid);
    if (p.nopes % 2 === 0 && hurtsMe) want = 0.75;
    if (p.nopes % 2 === 1 && p.by === pid) want = 0.55;
    return Math.random() < want ? { t: 'nope' } : null;
  }
  if (s.pending) return null;

  // 2) Someone asked us for a favor.
  if (s.phase === 'favor' && s.favor?.giver === pid) {
    const card = [...me.hand].sort((a, b) => GIVE_ORDER.indexOf(a.type) - GIVE_ORDER.indexOf(b.type))[0];
    return card ? { t: 'favor', cardId: card.id } : null;
  }

  // 3) Hide the petard back into the can.
  if (s.phase === 'defuse' && s.defuse?.playerId === pid) {
    const depth = Math.min(s.deck.length, 4);
    return { t: 'place', position: Math.floor(Math.random() * (depth + 1)) };
  }

  // 4) Our own turn.
  if (s.phase !== 'turn' || currentPlayer(s).id !== pid) return null;
  if (autopilot) return { t: 'draw' };

  const deck = s.deck.length || 1;
  const danger = petardsInDeck(s) / deck;
  const topIsPetard = mem.knownTop[0] === 'petard';
  const topIsSafe = mem.knownTop.length > 0 && mem.knownTop[0] !== 'petard';
  const escape = has('blame') ?? has('bush');

  if (topIsPetard) {
    if (escape) return { t: 'play', cardIds: [escape.id] };
    const sh = has('shuffle');
    if (sh) return { t: 'play', cardIds: [sh.id] };
  }

  if (!topIsSafe) {
    const radar = has('radar');
    if (radar && danger > 0.12 && mem.knownTop.length === 0 && Math.random() < 0.7) return { t: 'play', cardIds: [radar.id] };
    if (escape && danger > 0.3 && Math.random() < 0.6) return { t: 'play', cardIds: [escape.id] };
  }

  // Steal with a pair.
  for (const type of PAIR_TYPES) {
    const pair = me.hand.filter((c) => c.type === type);
    const target = richestOpponent(s, pid);
    if (pair.length >= 2 && target && Math.random() < 0.6) {
      return { t: 'play', cardIds: [pair[0].id, pair[1].id], target };
    }
  }

  const favor = has('favor');
  const favorTarget = richestOpponent(s, pid);
  if (favor && favorTarget && Math.random() < 0.35) return { t: 'play', cardIds: [favor.id], target: favorTarget };

  return { t: 'draw' };
}

/** Keeps bot knowledge about the deck consistent after events. */
export function botObserve(mem: BotMemory, kind: string, payload?: { cards?: CardType[] }) {
  switch (kind) {
    case 'future':
      mem.knownTop = payload?.cards ?? [];
      break;
    case 'drew':
      mem.knownTop = mem.knownTop.slice(1);
      break;
    case 'shuffled':
    case 'placed':
      mem.knownTop = [];
      break;
  }
}

export function botName(i: number): string {
  const names = ['Бот Шкряб', 'Бот Пузо', 'Бот Хвостяра', 'Бот Нюхач', 'Бот Смітюк'];
  return names[i % names.length];
}

export { CARD_DEFS };
