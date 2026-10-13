// Card catalogue for "Скажені Єноти: Нічний Дожор".
// Mechanics mirror the classic "draw until someone blows up" ruleset; all names/art are original.

export type CardType =
  | 'petard' // bomb: draw it without a defuse → you're out
  | 'doormat' // defuse
  | 'nope'
  | 'blame' // attack: end turn, next player takes 2 turns
  | 'bush' // skip
  | 'radar' // see the top 3 cards
  | 'shuffle'
  | 'favor' // target gives you a card of their choice
  | 'shawarma' // pair cards ↓ (no effect alone, two of a kind steal a random card)
  | 'baron'
  | 'punk'
  | 'hoodie';

export interface CardDef {
  type: CardType;
  title: string;
  short: string; // one-line rule shown on the card
  rule: string; // full rule for the info sheet
  color: string; // accent color for the frame
  image: string;
  count: number; // copies in the base deck (petard/doormat computed at setup)
  pair?: boolean;
  /** Needs a target player when played. */
  targeted?: boolean;
}

export const CARD_DEFS: Record<CardType, CardDef> = {
  petard: {
    type: 'petard',
    title: 'Петарда в Баку!',
    short: 'Вибух! Без Килимка — ти вилітаєш.',
    rule: 'Якщо витягнув цю карту і не маєш «Прикинутися Килимком» — ти вибуваєш із дожору.',
    color: '#ff3b3b',
    image: 'cards/petard.webp',
    count: 0,
  },
  doormat: {
    type: 'doormat',
    title: 'Прикинутися Килимком',
    short: 'Рятує від Петарди. Сховай її назад у бак.',
    rule: 'Граєш автоматично, коли витягнув Петарду. Потім таємно кладеш Петарду в бак на будь-яку глибину.',
    color: '#39d353',
    image: 'cards/doormat.webp',
    count: 0,
  },
  nope: {
    type: 'nope',
    title: 'Моє! Не руш!',
    short: 'Скасовує будь-яку дію. Можна в чужий хід.',
    rule: 'Скасовує дію іншого гравця (крім Петарди й Килимка). Можна скасувати інше «Моє! Не руш!».',
    color: '#ff2d95',
    image: 'cards/nope.webp',
    count: 5,
  },
  blame: {
    type: 'blame',
    title: 'Це все він!',
    short: 'Закінчи хід без риття. Наступний риється 2 рази.',
    rule: 'Завершуєш хід, не тягнучи карту. Наступний гравець ходить 2 рази поспіль. Якщо тебе атакували — передаєш свої ходи + 2.',
    color: '#ff9f1c',
    image: 'cards/blame.webp',
    count: 4,
  },
  bush: {
    type: 'bush',
    title: 'Шмиг у кущі',
    short: 'Закінчи хід, не риючись у баку.',
    rule: 'Завершує один хід без взяття карти. Якщо тебе атакували — знімає лише один із ходів.',
    color: '#2ec4b6',
    image: 'cards/bush.webp',
    count: 4,
  },
  radar: {
    type: 'radar',
    title: 'Нюх-Радар',
    short: 'Таємно подивись 3 верхні карти бака.',
    rule: 'Подивись три верхні карти бака і поверни їх у тому ж порядку.',
    color: '#3dff8a',
    image: 'cards/radar.webp',
    count: 5,
  },
  shuffle: {
    type: 'shuffle',
    title: 'Перевернути бак',
    short: 'Перемішай весь бак.',
    rule: 'Ретельно перемішай усі карти бака.',
    color: '#a06bff',
    image: 'cards/shuffle.webp',
    count: 4,
  },
  favor: {
    type: 'favor',
    title: 'Ділися ничкою!',
    short: 'Суперник віддає тобі карту на свій вибір.',
    rule: 'Обери суперника — він має віддати тобі одну карту зі своєї руки (на свій вибір).',
    color: '#4d9bff',
    image: 'cards/favor.webp',
    count: 4,
    targeted: true,
  },
  shawarma: {
    type: 'shawarma',
    title: 'Єнот-Шаурміст',
    short: 'Пара однакових — вкради випадкову карту.',
    rule: 'Сам по собі нічого не робить. Зіграй пару однакових єнотів, щоб витягнути випадкову карту в суперника.',
    color: '#ffc531',
    image: 'cards/shawarma.webp',
    count: 5,
    pair: true,
    targeted: true,
  },
  baron: {
    type: 'baron',
    title: 'Пузатий Барон',
    short: 'Пара однакових — вкради випадкову карту.',
    rule: 'Сам по собі нічого не робить. Зіграй пару однакових єнотів, щоб витягнути випадкову карту в суперника.',
    color: '#e0a526',
    image: 'cards/baron.webp',
    count: 5,
    pair: true,
    targeted: true,
  },
  punk: {
    type: 'punk',
    title: 'Панк-Єнот',
    short: 'Пара однакових — вкради випадкову карту.',
    rule: 'Сам по собі нічого не робить. Зіграй пару однакових єнотів, щоб витягнути випадкову карту в суперника.',
    color: '#ff5fd2',
    image: 'cards/punk.webp',
    count: 5,
    pair: true,
    targeted: true,
  },
  hoodie: {
    type: 'hoodie',
    title: 'Єнот у Худі',
    short: 'Пара однакових — вкради випадкову карту.',
    rule: 'Сам по собі нічого не робить. Зіграй пару однакових єнотів, щоб витягнути випадкову карту в суперника.',
    color: '#7dd3fc',
    image: 'cards/hoodie.webp',
    count: 5,
    pair: true,
    targeted: true,
  },
};

export const ACTION_TYPES: CardType[] = ['blame', 'bush', 'radar', 'shuffle', 'favor'];
export const PAIR_TYPES: CardType[] = ['shawarma', 'baron', 'punk', 'hoodie'];

export const AVATARS = [
  'avatars/raccoon-1.webp',
  'avatars/raccoon-2.webp',
  'avatars/raccoon-3.webp',
  'avatars/raccoon-4.webp',
  'avatars/raccoon-5.webp',
];
export const AVATAR_LABELS: Record<string, string> = {
  'avatars/raccoon-1.webp': 'Ласун',
  'avatars/raccoon-2.webp': 'Барон',
  'avatars/raccoon-3.webp': 'Панк',
  'avatars/raccoon-4.webp': 'Тінь',
  'avatars/raccoon-5.webp': 'Діджей',
};
export const PLAYER_COLORS = ['#38bdf8', '#ff9f1c', '#c084fc', '#2dd4bf', '#fb7185'];
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;
