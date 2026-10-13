// Wire protocol shared by the Socket.IO server, the offline in-browser host and the client UI.
import type { CardType } from './cards.ts';
import type { Card, GameEvent, Phase } from './engine.ts';

export type ClientAction =
  | { t: 'play'; cardIds: number[]; target?: string }
  | { t: 'nope' }
  | { t: 'draw' }
  | { t: 'favor'; cardId: number }
  | { t: 'place'; position: number }
  | { t: 'addBot' }
  | { t: 'kick'; playerId: string }
  | { t: 'start' }
  | { t: 'restart' }
  | { t: 'leave' };

export interface MemberView {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  connected: boolean;
  /** In-game info (absent in the lobby). */
  alive?: boolean;
  cardCount?: number;
}

export interface GameView {
  phase: Phase;
  hand: Card[];
  current: string;
  turnsLeft: number;
  nextPlayer: string;
  deckCount: number;
  petardsInDeck: number;
  discardTop: CardType[];
  pending: null | {
    id: number;
    by: string;
    type: CardType;
    pair: boolean;
    target?: string;
    nopes: number;
    lastNopeBy?: string;
    /** Milliseconds left in the nope window at the moment the view was produced. */
    msLeft: number;
    windowMs: number;
  };
  favor: null | { giver: string; receiver: string };
  defuse: null | { playerId: string };
  winner: string | null;
  log: string[];
}

export interface RoomView {
  code: string;
  me: string;
  hostId: string;
  members: MemberView[];
  game: GameView | null;
  offline: boolean;
}

export type { GameEvent };

export interface Session {
  code: string;
  playerId: string;
  token: string;
}
