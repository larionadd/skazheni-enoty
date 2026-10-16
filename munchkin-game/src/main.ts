import './styles.css';
import confetti from 'canvas-confetti';
import { MunchkinEngine, calculatePlayerPower } from './engine/gameEngine.ts';
import { Card, EquipmentCard, MonsterCard } from './types.ts';

const app = document.getElementById('app')!;
const engine = new MunchkinEngine('Ти (Здобувач Довідки)');

function renderCard(card: Card, onClick?: () => void): HTMLElement {
  const el = document.createElement('div');
  const isDoor = card.type === 'monster' || card.type === 'curse' || card.type === 'class' || card.type === 'modifier';
  el.className = `card-item ${isDoor ? 'card-door' : 'card-treasure'}`;

  let badgeText = '';
  let badgeClass = '';
  let powerOrSlot = '';

  if (card.type === 'monster') {
    const m = card as MonsterCard;
    badgeText = `Монстр (Рівень ${m.level})`;
    badgeClass = 'badge-monster';
  } else if (card.type === 'equipment') {
    const eq = card as EquipmentCard;
    badgeText = `+${eq.bonus} ${eq.slot.toUpperCase()}`;
    badgeClass = 'badge-loot';
    powerOrSlot = `Ціна: ${eq.valueGold}💰`;
  } else if (card.type === 'consumable') {
    badgeText = card.bonus ? `Підгон +${card.bonus}` : 'Зілля';
    badgeClass = 'badge-loot';
  } else if (card.type === 'curse') {
    badgeText = 'Прокльон!';
    badgeClass = 'badge-curse';
  } else if (card.type === 'class') {
    badgeText = 'Фах (Клас)';
    badgeClass = 'badge-class';
  }

  const artHTML = card.artUrl ? `<img src="${card.artUrl}" class="card-art-img" alt="${card.name}" />` : '';

  el.innerHTML = `
    <div class="card-title">${card.name}</div>
    <div class="card-badge ${badgeClass}">${badgeText}</div>
    ${artHTML}
    <div class="card-desc">${card.flavor || powerOrSlot || ''}</div>
  `;

  if (onClick) {
    el.addEventListener('click', onClick);
  }

  return el;
}

function renderUI() {
  const s = engine.state;
  const human = s.players[0];
  const isHumanTurn = s.turnIndex === 0;
  const humanPower = calculatePlayerPower(human);

  let arenaContent = '';

  if (s.phase === 'KICK_DOOR') {
    if (isHumanTurn) {
      arenaContent = `
        <div class="status-banner">Твій хід! Час зазирнути в черговий кабінет.</div>
        <button id="btn-kick-door" class="kick-door-btn">🚪 ВИБИТИ ДВЕРІ КАБІНЕТУ!</button>
      `;
    } else {
      arenaContent = `
        <div class="status-banner">Зараз черга ${s.players[s.turnIndex].name}... Бот думає і ходить!</div>
        <div style="font-size: 2.5rem; animation: pulse 1s infinite;">⏳</div>
      `;
    }
  } else if (s.phase === 'COMBAT' && s.combat) {
    const playerSidePower = engine.getPlayerSidePower();
    const monsterPower = s.combat.monsterPower;
    const canWin = playerSidePower >= monsterPower;
    const monsterArtHTML = s.combat.monster.artUrl
      ? `<img src="${s.combat.monster.artUrl}" class="combat-monster-art" alt="${s.combat.monster.name}" />`
      : '';

    arenaContent = `
      <div class="combat-view">
        ${monsterArtHTML}
        <div class="combat-versus">
          <div class="combatant-box">
            <span style="font-size: 0.8rem; font-weight: bold;">ТВОЯ СТОРОНА</span>
            <div class="combatant-power player-power">${playerSidePower}</div>
          </div>
          <div class="vs-badge">VS</div>
          <div class="combatant-box">
            <span style="font-size: 0.8rem; font-weight: bold;">МОНСТР</span>
            <div class="combatant-power monster-power">${monsterPower}</div>
          </div>
        </div>

        <div style="font-weight: bold; color: ${canWin ? '#34d399' : '#f87171'}; font-size: 0.9rem;">
          ${canWin ? '💪 Твоя сила більша! Ти перемагаєш!' : '⚠️ Монстр сильніший! Клич кума або змивайся!'}
        </div>

        <div class="combat-actions">
          ${isHumanTurn ? `
            <button id="btn-fight" class="btn-action btn-fight" ${!canWin ? 'style="opacity: 0.7;"' : ''}>⚔️ Вбити Монстра!</button>
            ${!s.combat.helperId ? '<button id="btn-help" class="btn-action btn-help">🤝 Покликати Кума</button>' : ''}
            <button id="btn-run" class="btn-action btn-run">🏃💨 Змиватися (Кубик d6)</button>
          ` : '<span style="color: #94a3b8;">Триває бій бота...</span>'}
        </div>

        <div class="combat-log">
          ${s.combat.combatLog.map((l) => `<div>${l}</div>`).join('')}
        </div>
      </div>
    `;
  } else if (s.phase === 'LOOT_ROOM') {
    arenaContent = `
      <div class="status-banner">У кабінеті чисто або монстр подоланий!</div>
      ${isHumanTurn ? `
        <button id="btn-loot-room" class="btn-action btn-loot" style="font-size: 1.2rem; padding: 14px 20px;">
          📦 Понишпорити в кабінеті (Взяти карту)
        </button>
      ` : '<div>Бот нишпорить по шухлядах...</div>'}
    `;
  } else if (s.phase === 'CHARITY') {
    arenaContent = `
      <div class="status-banner">Фаза завершення ходу! Перевір свої карти та передай чергу.</div>
      ${isHumanTurn ? `
        <button id="btn-end-turn" class="btn-action btn-end" style="font-size: 1.2rem; padding: 12px 24px;">
          ⏭️ Завершити Хід
        </button>
      ` : ''}
    `;
  } else if (s.phase === 'GAME_OVER' && s.winner) {
    arenaContent = `
      <div style="font-size: 3rem;">👑</div>
      <div style="font-family: var(--font-comic); font-size: 2rem; color: #facc15;">
        ${s.winner.name} ПЕРЕМІГ!
      </div>
      <div style="font-size: 0.9rem; color: #cbd5e1; margin-top: 6px;">
        10-й Рівень здобуто! Ласкаво просимо в крісло Головного Начальника!
      </div>
      <button onclick="location.reload()" class="btn-action btn-fight" style="margin-top: 14px;">
        🔄 Грати Знову
      </button>
    `;
  }

  // Opponents list HTML
  const opponentsHTML = s.players
    .slice(1)
    .map((p, idx) => {
      const isTurn = s.turnIndex === idx + 1;
      const power = calculatePlayerPower(p);
      return `
        <div class="opponent-card ${isTurn ? 'active-turn' : ''}">
          <div class="opp-avatar">${p.avatar}</div>
          <div class="opp-info">
            <span class="opp-name">${p.name}</span>
            <span class="opp-stats">Рівень ${p.level} • Сила ${power} • Карт: ${p.hand.length}</span>
          </div>
        </div>
      `;
    })
    .join('');

  // Player Gear Slots
  const gear = human.gear;
  const gearHTML = `
    <div class="gear-slot ${gear.headgear ? 'filled' : ''}">
      🎩 ${gear.headgear ? `${gear.headgear.name} (+${gear.headgear.bonus})` : 'Шолом: порожньо'}
    </div>
    <div class="gear-slot ${gear.armor ? 'filled' : ''}">
      🥋 ${gear.armor ? `${gear.armor.name} (+${gear.armor.bonus})` : 'Броня: порожньо'}
    </div>
    <div class="gear-slot ${gear.footwear ? 'filled' : ''}">
      👟 ${gear.footwear ? `${gear.footwear.name} (+${gear.footwear.bonus})` : 'Взуття: порожньо'}
    </div>
    <div class="gear-slot ${gear.hands.length > 0 ? 'filled' : ''}">
      ⚔️ ${gear.hands.length > 0 ? gear.hands.map((h) => `${h.name} (+${h.bonus})`).join(', ') : 'Руки: порожньо'}
    </div>
  `;

  app.innerHTML = `
    <div class="game-container">
      <div class="game-header">
        <div class="title-badge">🗂️ ХАПУГИ</div>
        <div class="turn-pill">Хід: ${s.players[s.turnIndex].name}</div>
      </div>

      <div class="opponents-bar">
        ${opponentsHTML}
      </div>

      <div class="arena">
        ${arenaContent}
      </div>

      <div class="player-dashboard">
        <div class="player-stats-row">
          <div>
            <span style="font-weight: bold; font-size: 0.9rem;">${human.name}</span>
            <span style="font-size: 0.75rem; color: #a78bfa; margin-left: 6px;">
              ${human.playerClass ? `[${human.playerClass.name}]` : '[Без класу]'}
            </span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <div class="level-badge">Рівень ${human.level}</div>
            <div class="power-badge">Бойова Сила: ${humanPower}</div>
          </div>
        </div>

        <div class="gear-slots-row">
          ${gearHTML}
        </div>
      </div>

      <div class="hand-container">
        <div class="hand-label">Твоя рука (${human.hand.length} карт) • Натисни, щоб одягти або зіграти:</div>
        <div id="hand-scroll" class="cards-scroll"></div>
      </div>
    </div>
  `;

  // Attach Hand cards
  const handScroll = document.getElementById('hand-scroll');
  if (handScroll) {
    human.hand.forEach((card) => {
      const cardEl = renderCard(card, () => {
        if (card.type === 'equipment' || card.type === 'class') {
          engine.equipItem(human.id, card.id);
        } else if (card.type === 'consumable' && s.phase === 'COMBAT') {
          engine.playConsumable(human.id, card.id, 'player');
        }
      });
      handScroll.appendChild(cardEl);
    });
  }

  // Attach Arena Button Listeners
  const btnKick = document.getElementById('btn-kick-door');
  if (btnKick) {
    btnKick.addEventListener('click', () => engine.kickDoor());
  }

  const btnFight = document.getElementById('btn-fight');
  if (btnFight) {
    btnFight.addEventListener('click', () => {
      if (engine.getPlayerSidePower() >= (s.combat?.monsterPower || 0)) {
        engine.resolveCombatWin(true);
        if (engine.state.winner) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    });
  }

  const btnHelp = document.getElementById('btn-help');
  if (btnHelp) {
    btnHelp.addEventListener('click', () => {
      engine.askBotHelp('p2', 1); // Ask Kum Vasyl for 1 treasure
    });
  }

  const btnRun = document.getElementById('btn-run');
  if (btnRun) {
    btnRun.addEventListener('click', () => engine.runAway());
  }

  const btnLoot = document.getElementById('btn-loot-room');
  if (btnLoot) {
    btnLoot.addEventListener('click', () => engine.lootRoom());
  }

  const btnEnd = document.getElementById('btn-end-turn');
  if (btnEnd) {
    btnEnd.addEventListener('click', () => engine.endTurn());
  }
}

engine.subscribe(() => {
  renderUI();
});

renderUI();
