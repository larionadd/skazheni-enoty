export type CardType = 'monster' | 'curse' | 'class' | 'equipment' | 'consumable' | 'modifier';
export type EquipmentSlot = 'headgear' | 'armor' | 'footwear' | 'one_hand' | 'two_hands';

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  flavor?: string;
  artUrl?: string;
}

export interface MonsterCard extends BaseCard {
  type: 'monster';
  level: number;
  treasures: number;
  levelsAwarded: number;
  badStuff: string;
  bonusAgainst?: { targetClass: string; bonus: number };
}

export interface CurseCard extends BaseCard {
  type: 'curse';
  effect: string;
}

export interface ClassCard extends BaseCard {
  type: 'class';
  classType: string;
  bonuses: string[];
}

export interface EquipmentCard extends BaseCard {
  type: 'equipment';
  slot: EquipmentSlot;
  bonus: number;
  runBonus?: number;
  isBig?: boolean;
  valueGold: number;
}

export interface ConsumableCard extends BaseCard {
  type: 'consumable';
  bonus?: number;
  effect?: string;
  valueGold: number;
  usableInAnyCombat?: boolean;
}

export interface ModifierCard extends BaseCard {
  type: 'modifier';
  monsterBonus: number;
  extraTreasures?: number;
}

export type Card = MonsterCard | CurseCard | ClassCard | EquipmentCard | ConsumableCard | ModifierCard;

export interface PlayerGear {
  headgear: EquipmentCard | null;
  armor: EquipmentCard | null;
  footwear: EquipmentCard | null;
  hands: EquipmentCard[]; // max 2 hands (or 1 two_hands)
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  level: number;
  gear: PlayerGear;
  playerClass: ClassCard | null;
  hand: Card[];
}

export type GamePhase =
  | 'LOBBY'
  | 'KICK_DOOR'
  | 'COMBAT'
  | 'ASK_HELP'
  | 'RUN_AWAY'
  | 'LOOT_ROOM'
  | 'CHARITY'
  | 'GAME_OVER';

export interface GameCombatState {
  monster: MonsterCard;
  monsterPower: number;
  modifiers: ModifierCard[];
  helperId: string | null;
  helperTreasuresAgreed: number;
  combatLog: string[];
}

export interface GameState {
  phase: GamePhase;
  turnIndex: number;
  players: Player[];
  doorsDeck: Card[];
  doorsDiscard: Card[];
  treasuresDeck: Card[];
  treasuresDiscard: Card[];
  combat: GameCombatState | null;
  lastDiceRoll: number | null;
  winner: Player | null;
  message: string;
}
