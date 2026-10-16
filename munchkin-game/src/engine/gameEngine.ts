import { GameState, Player, EquipmentCard, MonsterCard, ConsumableCard } from '../types.ts';
import { INITIAL_DOORS, INITIAL_TREASURES } from './cardsData.ts';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculatePlayerPower(player: Player): number {
  let power = player.level;
  if (player.gear.headgear) power += player.gear.headgear.bonus;
  if (player.gear.armor) power += player.gear.armor.bonus;
  if (player.gear.footwear) power += player.gear.footwear.bonus;
  for (const item of player.gear.hands) {
    power += item.bonus;
  }
  return power;
}

export function getPlayerRunBonus(player: Player): number {
  let bonus = 0;
  if (player.gear.footwear?.runBonus) {
    bonus += player.gear.footwear.runBonus;
  }
  if (player.playerClass?.classType === 'Студент') {
    bonus += 1;
  }
  return bonus;
}

export class MunchkinEngine {
  public state: GameState;
  private onStateChange: ((state: GameState) => void) | null = null;

  constructor(humanName: string = 'Ти (Здобувач Довідки)') {
    const doors = shuffle([...INITIAL_DOORS, ...INITIAL_DOORS]); // Double deck for replayability
    const treasures = shuffle([...INITIAL_TREASURES, ...INITIAL_TREASURES]);

    const players: Player[] = [
      {
        id: 'p1',
        name: humanName,
        avatar: '🤠',
        isBot: false,
        level: 1,
        gear: { headgear: null, armor: null, footwear: null, hands: [] },
        playerClass: null,
        hand: []
      },
      {
        id: 'p2',
        name: 'Кум Василь (Торгаш)',
        avatar: '🦝',
        isBot: true,
        level: 1,
        gear: { headgear: null, armor: null, footwear: null, hands: [] },
        playerClass: null,
        hand: []
      },
      {
        id: 'p3',
        name: 'Студентка Оля',
        avatar: '🦊',
        isBot: true,
        level: 1,
        gear: { headgear: null, armor: null, footwear: null, hands: [] },
        playerClass: null,
        hand: []
      }
    ];

    // Deal 2 doors and 2 treasures each
    for (const p of players) {
      p.hand.push(doors.pop()!);
      p.hand.push(doors.pop()!);
      p.hand.push(treasures.pop()!);
      p.hand.push(treasures.pop()!);
    }

    this.state = {
      phase: 'KICK_DOOR',
      turnIndex: 0,
      players,
      doorsDeck: doors,
      doorsDiscard: [],
      treasuresDeck: treasures,
      treasuresDiscard: [],
      combat: null,
      lastDiceRoll: null,
      winner: null,
      message: 'Ласкаво просимо до Підземелля Бюрократії! Твій хід: вибий двері кабінету!'
    };
  }

  public subscribe(listener: (state: GameState) => void) {
    this.onStateChange = listener;
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public getCurrentPlayer(): Player {
    return this.state.players[this.state.turnIndex];
  }

  public equipItem(playerId: string, cardId: string): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.hand[cardIndex];
    if (card.type === 'class') {
      player.playerClass = card;
      player.hand.splice(cardIndex, 1);
      this.state.message = `${player.name} обирає фах: ${card.name}!`;
      this.notify();
      return true;
    }

    if (card.type !== 'equipment') return false;

    const eq = card as EquipmentCard;
    if (eq.slot === 'headgear') {
      if (player.gear.headgear) player.hand.push(player.gear.headgear);
      player.gear.headgear = eq;
    } else if (eq.slot === 'armor') {
      if (player.gear.armor) player.hand.push(player.gear.armor);
      player.gear.armor = eq;
    } else if (eq.slot === 'footwear') {
      if (player.gear.footwear) player.hand.push(player.gear.footwear);
      player.gear.footwear = eq;
    } else if (eq.slot === 'two_hands') {
      // Unequip all current hands
      for (const h of player.gear.hands) player.hand.push(h);
      player.gear.hands = [eq];
    } else if (eq.slot === 'one_hand') {
      const currentHandSlots = player.gear.hands.reduce((sum, item) => sum + (item.slot === 'two_hands' ? 2 : 1), 0);
      if (currentHandSlots >= 2) {
        const removed = player.gear.hands.pop()!;
        player.hand.push(removed);
      }
      player.gear.hands.push(eq);
    }

    player.hand.splice(cardIndex, 1);
    this.state.message = `${player.name} екіпірує: ${eq.name} (+${eq.bonus} сили)!`;
    this.notify();
    return true;
  }

  public kickDoor() {
    if (this.state.phase !== 'KICK_DOOR') return;

    if (this.state.doorsDeck.length === 0) {
      this.state.doorsDeck = shuffle([...this.state.doorsDiscard]);
      this.state.doorsDiscard = [];
    }

    const card = this.state.doorsDeck.pop();
    if (!card) return;

    const player = this.getCurrentPlayer();

    if (card.type === 'monster') {
      const monster = card as MonsterCard;
      let power = monster.level;
      if (monster.bonusAgainst && player.playerClass?.classType === monster.bonusAgainst.targetClass) {
        power += monster.bonusAgainst.bonus;
      }

      this.state.combat = {
        monster,
        monsterPower: power,
        modifiers: [],
        helperId: null,
        helperTreasuresAgreed: 0,
        combatLog: [`🚪 Двері відчинено! Назустріч вистрибує: ${monster.name} (Рівень ${monster.level})!`]
      };
      this.state.phase = 'COMBAT';
      this.state.message = `Бій! ${player.name} (Сила ${calculatePlayerPower(player)}) проти ${monster.name} (Сила ${power})!`;
    } else if (card.type === 'curse') {
      this.state.doorsDiscard.push(card);
      this.state.message = `😱 ${card.name}! ${card.effect}`;
      if (card.id === 'curse_lost_record' && player.level > 1) {
        player.level--;
      }
      this.state.phase = 'LOOT_ROOM';
    } else {
      player.hand.push(card);
      this.state.message = `У кабінеті нікого! Ти знаходиш: ${card.name} і забираєш у руку.`;
      this.state.phase = 'LOOT_ROOM';
    }

    this.notify();
  }

  public playConsumable(playerId: string, cardId: string, targetSide: 'player' | 'monster'): boolean {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player || !this.state.combat) return false;

    const idx = player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return false;

    const card = player.hand[idx];
    if (card.type === 'consumable') {
      const cons = card as ConsumableCard;
      player.hand.splice(idx, 1);
      this.state.treasuresDiscard.push(cons);

      if (cons.bonus) {
        if (targetSide === 'player') {
          this.state.combat.combatLog.push(`🧪 ${player.name} застосовує ${cons.name}: +${cons.bonus} до сторони гравця!`);
        } else {
          this.state.combat.monsterPower += cons.bonus;
          this.state.combat.combatLog.push(`😈 Підстава! ${player.name} підгодовує монстра (${cons.name}): +${cons.bonus} монстру!`);
        }
      }

      if (cons.id === 'loot_candy_box' && this.state.combat.monster.level <= 5) {
        this.state.combat.combatLog.push(`🍬 Монстр зрадів цукеркам «Вечірній Київ» і пішов пити чай!`);
        this.resolveCombatWin(false);
        return true;
      }

      this.notify();
      return true;
    }
    return false;
  }

  public getPlayerSidePower(): number {
    if (!this.state.combat) return 0;
    const player = this.getCurrentPlayer();
    let power = calculatePlayerPower(player);
    if (this.state.combat.helperId) {
      const helper = this.state.players.find((p) => p.id === this.state.combat?.helperId);
      if (helper) {
        power += calculatePlayerPower(helper);
      }
    }
    return power;
  }

  public resolveCombatWin(gainLevel: boolean = true) {
    if (!this.state.combat) return;
    const player = this.getCurrentPlayer();
    const monster = this.state.combat.monster;

    if (gainLevel) {
      player.level += monster.levelsAwarded;
      if (player.level >= 10) {
        this.state.winner = player;
        this.state.phase = 'GAME_OVER';
        this.state.message = `🎉 ПЕРЕМОГА! ${player.name} досягає 10-го РІВНЯ і стає ГОЛОВНИМ НАЧАЛЬНИКОМ ЖЕКУ!`;
        this.notify();
        return;
      }
    }

    // Distribute treasures
    let numTreasures = monster.treasures + (this.state.combat.modifiers.reduce((s, m) => s + (m.extraTreasures || 0), 0));
    const helperId = this.state.combat.helperId;
    const helperTreasures = helperId ? Math.min(this.state.combat.helperTreasuresAgreed, numTreasures) : 0;
    const playerTreasures = numTreasures - helperTreasures;

    for (let i = 0; i < playerTreasures; i++) {
      if (this.state.treasuresDeck.length === 0) {
        this.state.treasuresDeck = shuffle([...this.state.treasuresDiscard]);
        this.state.treasuresDiscard = [];
      }
      const t = this.state.treasuresDeck.pop();
      if (t) player.hand.push(t);
    }

    if (helperId && helperTreasures > 0) {
      const helper = this.state.players.find((p) => p.id === helperId);
      if (helper) {
        for (let i = 0; i < helperTreasures; i++) {
          if (this.state.treasuresDeck.length === 0) {
            this.state.treasuresDeck = shuffle([...this.state.treasuresDiscard]);
            this.state.treasuresDiscard = [];
          }
          const t = this.state.treasuresDeck.pop();
          if (t) helper.hand.push(t);
        }
      }
    }

    this.state.doorsDiscard.push(monster);
    this.state.combat = null;
    this.state.phase = 'CHARITY';
    this.state.message = `⚔️ ПЕРЕМОГА! ${player.name} здолав ${monster.name}! Отримано скарби (+${playerTreasures})!`;
    this.notify();
  }

  public askBotHelp(helperId: string, treasuresOffered: number = 1): boolean {
    if (!this.state.combat) return false;
    const helper = this.state.players.find((p) => p.id === helperId);
    if (!helper) return false;

    // AI bot accepts if offered at least 1 treasure and helper has power > 0
    this.state.combat.helperId = helperId;
    this.state.combat.helperTreasuresAgreed = treasuresOffered;
    this.state.combat.combatLog.push(`🤝 ${helper.name} вступає в бій на твоєму боці за ${treasuresOffered} скарб(ів)!`);
    this.state.message = `${helper.name} допомагає! Спільна сила: ${this.getPlayerSidePower()} проти ${this.state.combat.monsterPower}!`;
    this.notify();
    return true;
  }

  public runAway(): boolean {
    if (!this.state.combat) return false;
    const player = this.getCurrentPlayer();
    const roll = Math.floor(Math.random() * 6) + 1;
    const runBonus = getPlayerRunBonus(player);
    const totalRoll = roll + runBonus;
    this.state.lastDiceRoll = roll;

    if (totalRoll >= 5) {
      this.state.combat.combatLog.push(`🎲 Кидок кубика: ${roll} (+${runBonus} бонус) = ${totalRoll}. ВДАЛОСЯ ВТЕКТИ! 🏃💨`);
      this.state.doorsDiscard.push(this.state.combat.monster);
      this.state.combat = null;
      this.state.phase = 'CHARITY';
      this.state.message = `Ти успішно втік від монстра на м'яких шльопанцях!`;
      this.notify();
      return true;
    } else {
      this.state.combat.combatLog.push(`🎲 Кидок кубика: ${roll} (+${runBonus}) = ${totalRoll}. Втекти не вдалося!`);
      const badStuff = this.state.combat.monster.badStuff;
      if (player.level > 1) {
        player.level--;
      }
      this.state.combat.combatLog.push(`💀 НЕПОТРЕБСТВО: ${badStuff}`);
      this.state.doorsDiscard.push(this.state.combat.monster);
      this.state.combat = null;
      this.state.phase = 'CHARITY';
      this.state.message = `Тебе спіймали! ${badStuff}`;
      this.notify();
      return false;
    }
  }

  public lootRoom() {
    if (this.state.phase !== 'LOOT_ROOM') return;
    const player = this.getCurrentPlayer();
    if (this.state.doorsDeck.length === 0) {
      this.state.doorsDeck = shuffle([...this.state.doorsDiscard]);
      this.state.doorsDiscard = [];
    }
    const card = this.state.doorsDeck.pop();
    if (card) {
      player.hand.push(card);
      this.state.message = `Ти нишпориш по кабінету й знаходиш карту: ${card.name}!`;
    }
    this.state.phase = 'CHARITY';
    this.notify();
  }

  public endTurn() {
    this.state.combat = null;
    this.state.lastDiceRoll = null;
    this.state.turnIndex = (this.state.turnIndex + 1) % this.state.players.length;
    this.state.phase = 'KICK_DOOR';

    const current = this.getCurrentPlayer();
    this.state.message = `Зараз ходить: ${current.name}!`;
    this.notify();

    // If bot turn, run AI
    if (current.isBot && !this.state.winner) {
      setTimeout(() => this.runBotTurn(), 1200);
    }
  }

  private runBotTurn() {
    const bot = this.getCurrentPlayer();
    if (!bot.isBot || this.state.phase !== 'KICK_DOOR') return;

    // 1. Try to equip items from hand
    for (const card of [...bot.hand]) {
      if (card.type === 'equipment' || card.type === 'class') {
        this.equipItem(bot.id, card.id);
      }
    }

    // 2. Kick door
    this.kickDoor();

    setTimeout(() => {
      if (this.state.phase === 'COMBAT' && this.state.combat) {
        const botPower = calculatePlayerPower(bot);
        if (botPower >= this.state.combat.monsterPower) {
          this.resolveCombatWin(true);
        } else {
          this.runAway();
        }
      } else if (this.state.phase === 'LOOT_ROOM') {
        this.lootRoom();
      }

      setTimeout(() => {
        this.endTurn();
      }, 1000);
    }, 1500);
  }
}
