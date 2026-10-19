// Pumpkin Alchemy — 20 Weighted Ingredients with Exact Compound Hitboxes, 2 Spirit Tiers, Big Stirring Spoon & Inter-Level Shop

(() => {
  const STORAGE_KEY_HISCORE = "pumpkin_alchemy_hiscore_v3";
  const LEVEL_DURATION_SECONDS = 120; // 2 minutes per level
  const MAX_COINS_PER_ORDER = 15; // Strict cap: max 15 coins per completed order

  // Shop prices (Shop is open ONLY between levels; prices are balanced against 10-15 coin order rewards)
  const SHOP_COSTS = {
    stir: 25,
    bat: 30,
    time: 35,
    needed: 45,
    greedBase: 60
  };

  const STORY_GUEST_ARCHETYPES = [
    {
      id: "ghost",
      name: "Джаспер, Привид-листоноша",
      dialogue: "«У лісі такий густий туман! Звариш мені зілля для нічної пошти?»",
      thankYou: "«Дякую! Тепер я свічуся, мов справжній маяк!»"
    },
    {
      id: "wolf",
      name: "Шеф Руді, Пекар-вовкулака",
      dialogue: "«Мої святкові пироги охололи! Додаси вогняних спецій у казан?»",
      thankYou: "«У-у-у! Який аромат! Піч знову палає!»"
    },
    {
      id: "witch",
      name: "Луна, Учениця Відьми",
      dialogue: "«Сьогодні іспит із польотів на мітлі! Мені потрібна особлива алхімія.»",
      thankYou: "«Ура! Мітла аж іскриться від магії!»"
    },
    {
      id: "skeleton",
      name: "Маестро Бонні, Скелет-музикант",
      dialogue: "«Кістки клацають, а скрипка мовчить! Звари еліксир натхнення!»",
      thankYou: "«Оце мелодія! Ноги самі просяться в танок!»"
    },
    {
      id: "owl",
      name: "Пані Моргана, Сова-звіздарка",
      dialogue: "«Хмари закрили сузір'я! Нам потрібне світло рідкісних інгредієнтів.»",
      thankYou: "«Угу-у! Зірки знову сяють над вежею!»"
    },
    {
      id: "vampire",
      name: "Граф Влад, Нічний Бариста",
      dialogue: "«Я випадково проспав сто років... Звари щось ду-у-уже бадьоре!»",
      thankYou: "«Чудово! Жодного сну до самого світанку!»"
    },
    {
      id: "knight",
      name: "Сер Джек, Гарбузовий Лицар",
      dialogue: "«Брама Геловінського Ярмарку чекає! Зарядимо мій ліхтар!»",
      thankYou: "«Честь і хвала Алхіміку! Шлях вільний!»"
    },
    {
      id: "king",
      name: "Король Опівночі, Дух Осені",
      dialogue: "«Час пробив північ! Поєднай старші дари для Головного Свята!»",
      thankYou: "«СВЯТО СЯЄ! Ось твоє відьомське золото!»"
    }
  ];

  const canvas = document.getElementById("gameCanvas");
  const nextCanvas = document.getElementById("nextCanvas");
  const nextCtx = nextCanvas.getContext("2d");
  const nextWeightBadgeEl = document.getElementById("nextWeightBadge");
  const guestAvatarCanvas = document.getElementById("guestAvatarCanvas");
  const guestAvatarCtx = guestAvatarCanvas.getContext("2d");

  // Header & Top Bar Elements
  const levelBadgeEl = document.getElementById("levelBadge");
  const timerPillEl = document.getElementById("timerPill");
  const timerValueEl = document.getElementById("timerValue");
  const timerBarFillEl = document.getElementById("timerBarFill");
  const guestProgressPillEl = document.getElementById("guestProgressPill");
  const coinsValueEl = document.getElementById("coinsValue");

  // Guest Card Elements
  const guestCardEl = document.getElementById("guestCard");
  const guestStepBadgeEl = document.getElementById("guestStepBadge");
  const guestNameEl = document.getElementById("guestName");
  const guestRewardTagEl = document.getElementById("guestRewardTag");
  const guestDialogueEl = document.getElementById("guestDialogue");
  const recipeSlotsEl = document.getElementById("recipeSlots");
  const btnServe = document.getElementById("btnServe");

  const nextPreviewEl = document.getElementById("nextPreview");
  const comboToastEl = document.getElementById("comboToast");

  // Day/Night Transition Banner & In-Stage Daytime Shop Elements
  const dayNightBannerEl = document.getElementById("dayNightBanner");
  const dayNightBannerIconEl = document.getElementById("dayNightBannerIcon");
  const dayNightBannerTitleEl = document.getElementById("dayNightBannerTitle");
  const dayNightBannerSubEl = document.getElementById("dayNightBannerSub");

  const dayShopStageEl = document.getElementById("dayShopStage");
  const dayShopBadgeEl = document.getElementById("dayShopBadge");
  const dayShopTitleEl = document.getElementById("dayShopTitle");
  const dayShopSubtitleEl = document.getElementById("dayShopSubtitle");
  const shopCoinsValueEl = document.getElementById("shopCoinsValue");
  const btnContinueToNight = document.getElementById("btnContinueToNight");

  // Bottom Shelf Buttons
  const btnSound = document.getElementById("btnSound");
  const btnRestart = document.getElementById("btnRestart");
  const btnPotionStir = document.getElementById("btnPotionStir");
  const btnPotionBat = document.getElementById("btnPotionBat");
  const btnGrimoire = document.getElementById("btnGrimoire");

  const countStirEl = document.getElementById("countStir");
  const labelStirEl = document.getElementById("labelStir");
  const countBatEl = document.getElementById("countBat");

  // Grimoire Dialog Elements
  const grimoireDialog = document.getElementById("grimoireDialog");
  const spiritEvoBoxEl = document.getElementById("spiritEvoBox");
  const evolutionGridEl = document.getElementById("evolutionGrid");

  // Defeat / Retry Dialog Elements
  const gameOverDialog = document.getElementById("gameOverDialog");
  const gameOverTitleEl = document.getElementById("gameOverTitle");
  const summaryBadgeEl = document.getElementById("summaryBadge");
  const summaryRankEl = document.getElementById("summaryRank");
  const summaryStoryEl = document.getElementById("summaryStory");
  const finalGuestsEl = document.getElementById("finalGuests");
  const finalSpiritsEl = document.getElementById("finalSpirits");
  const finalScoreEl = document.getElementById("finalScore");

  const btnBuyStir = document.getElementById("btnBuyStir");
  const btnBuyBat = document.getElementById("btnBuyBat");
  const btnBuyTime = document.getElementById("btnBuyTime");
  const btnBuyNeeded = document.getElementById("btnBuyNeeded");
  const btnBuyGreed = document.getElementById("btnBuyGreed");

  const descBuyStirEl = document.getElementById("descBuyStir");
  const descBuyBatEl = document.getElementById("descBuyBat");
  const descBuyTimeEl = document.getElementById("descBuyTime");
  const descBuyNeededEl = document.getElementById("descBuyNeeded");
  const descBuyGreedEl = document.getElementById("descBuyGreed");

  const btnNextOrRetry = document.getElementById("btnNextOrRetry");

  // Discrete display transition probe & helpers per modern-web-guidance (animate-element-entry-exit)
  let supportsDisplayTransition;
  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
      return false;
    }
    const probe = document.createElement("div");
    probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = "none";
    supportsDisplayTransition = getComputedStyle(probe).display === "block";
    probe.remove();
    return supportsDisplayTransition;
  }

  async function hideElement(el) {
    if (!el || el.hidden) return;
    if (canTransitionDisplay()) {
      el.hidden = true;
    } else {
      el.setAttribute("data-closing", "");
    }

    const animations = el.getAnimations ? el.getAnimations() : [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000))
      ]);
    }

    if (el.hasAttribute("data-closing")) {
      el.removeAttribute("data-closing");
      el.hidden = true;
    }
  }

  function showElement(el) {
    if (!el) return;
    el.removeAttribute("data-closing");
    el.hidden = false;
  }

  let bannerTimerId = null;
  function showDayNightBanner(icon, title, subtitle, isNightfall = false, durationMs = 2600) {
    if (!dayNightBannerEl) return;
    clearTimeout(bannerTimerId);
    dayNightBannerIconEl.textContent = icon;
    dayNightBannerTitleEl.textContent = title;
    dayNightBannerSubEl.textContent = subtitle;
    dayNightBannerEl.classList.toggle("is-nightfall", Boolean(isNightfall));
    showElement(dayNightBannerEl);
    bannerTimerId = setTimeout(() => {
      hideElement(dayNightBannerEl);
    }, durationMs);
  }

  // Fallback for <dialog closedby="any"> per modern-web-guidance (light-dismiss-a-dialog)
  [grimoireDialog, gameOverDialog].forEach((dialog) => {
    if (dialog && !("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  });

  // Responsive Cauldron Geometry
  const geom = {
    w: 380,
    h: 520,
    dpr: 1,
    scale: 1,
    cx: 190,
    cy: 310,
    R: 155,
    neckAngle: 0.64,
    neckTopY: 215,
    neckHalfW: 124,
    rimOpenHalfW: 118,
    dangerY: 226
  };

  // Game State
  let items = [];
  let particles = [];
  let floatingTexts = [];
  let flyingDeliveries = [];
  let batAnim = null;

  // Day/Night Cycle State ("night" | "dawn_transition" | "day_shop" | "dusk_transition")
  let cyclePhase = "night";
  let dayBlend = 0; // 0.0 = Night Cauldron, 1.0 = Sunny Daytime Shop
  let dayShopOpenedInTransition = false;

  // Interactive Stirring Spoon State (Велика Мішалка)
  const stirState = {
    modeActive: false,
    isDragging: false,
    x: 190,
    y: 310,
    prevX: 190,
    prevY: 310,
    distanceMoved: 0,
    maxDistance: 720,
    soundCooldown: 0,
    trail: []
  };

  let score = 0;
  let hiScore = Number(localStorage.getItem(STORAGE_KEY_HISCORE) || 0);
  let coins = 10;
  let greedLevel = 0;

  // Charges & Queued Inter-Level Shop Buffs
  let potions = {
    stir: 2,
    bat: 1
  };
  let nextLevelBonusSeconds = 0;
  let nextLevelStarterNeededCount = 0;

  let currentLevel = 1;
  let levelTimeRemaining = LEVEL_DURATION_SECONDS;
  let levelTotalDuration = LEVEL_DURATION_SECONDS;
  let lastWholeSecond = LEVEL_DURATION_SECONDS;
  let levelOrdersCompleted = 0;
  let levelOrdersTarget = 2;

  let highestTierReached = 0;
  let isGameOver = false;

  let currentGuestIndex = 0;
  let activeGuestOrder = null;
  let guestTransitionLock = false;

  let rescuedSpiritsTotal = 0;
  // Banked spirits rescued via nearby ingredient merges!
  let bankedSpirits = { 1: 0, 2: 0 };
  let dropsSinceSpiritOrb = 0;

  let catX = 190;
  let targetCatX = 190;
  let currentTier = 0;
  let currentSpiritTier = 0; // 0 = regular ingredient, 1 = Дух-Світлячок, 2 = Архідух Ліхтаря
  let nextTier = 1;
  let nextSpiritTier = 0;
  let dropCooldown = 0;

  let comboCount = 0;
  let comboResetTimer = 0;
  let dangerTimer = 0;

  let nextItemId = 1;

  const renderer = new window.CauldronRenderer(canvas, () => {
    renderNextPreview();
    if (activeGuestOrder && cyclePhase === "night") {
      renderer.drawGuestAvatar(guestAvatarCtx, activeGuestOrder.template.id);
    }
  });

  function getSpriteKeyFor(tier, spiritTier = 0) {
    if (spiritTier > 0) {
      return spiritTier === 2 ? "royal_spirit" : "spirit_orb";
    }
    const tObj = window.INGREDIENT_TIERS[tier] || window.INGREDIENT_TIERS[0];
    return tObj.spriteKey;
  }

  // Get exact multi-circle compound collider fitted to the sprite's opaque pixels
  function getLocalCollidersFor(tier, spiritTier = 0) {
    const map = window.SPRITE_COLLIDERS;
    if (map) {
      const key = getSpriteKeyFor(tier, spiritTier);
      if (map[key] && map[key].length > 0) {
        return map[key];
      }
    }
    return [{ ox: 0, oy: 0, r: 0.9 }];
  }

  // Update world-space compound sub-circles for an item given its current (x, y, r, angle)
  function updateItemWorldCircles(it) {
    const localCols = getLocalCollidersFor(it.tier, it.spiritTier);
    const cosA = Math.cos(it.angle);
    const sinA = Math.sin(it.angle);
    let maxReach = 0;
    let minTopY = Infinity;

    if (!it.worldCircles || it.worldCircles.length !== localCols.length) {
      it.worldCircles = new Array(localCols.length);
      for (let k = 0; k < localCols.length; k++) {
        it.worldCircles[k] = { x: 0, y: 0, rx: 0, ry: 0, r: 0 };
      }
    }

    for (let k = 0; k < localCols.length; k++) {
      const c = localCols[k];
      const rx = (c.ox * cosA - c.oy * sinA) * it.r;
      const ry = (c.ox * sinA + c.oy * cosA) * it.r;
      const cr = c.r * it.r;
      const wc = it.worldCircles[k];
      wc.rx = rx;
      wc.ry = ry;
      wc.x = it.x + rx;
      wc.y = it.y + ry;
      wc.r = cr;

      const reach = Math.hypot(rx, ry) + cr;
      if (reach > maxReach) maxReach = reach;
      if (wc.y - cr < minTopY) minTopY = wc.y - cr;
    }

    it.boundR = maxReach || it.r;
    it.topY = minTopY < Infinity ? minTopY : it.y - it.r;
  }

  // Weight Profile Helper for any Item or Drop
  function getWeightProfileFor(tier, spiritTier = 0) {
    if (spiritTier > 0) {
      return window.WEIGHT_PROFILES.light;
    }
    const tObj = window.INGREDIENT_TIERS[tier] || window.INGREDIENT_TIERS[0];
    return window.WEIGHT_PROFILES[tObj.weightClass] || window.WEIGHT_PROFILES.medium;
  }

  // Compute Effective Physical Mass so Heavy items (like Bone or Apple) push Light items (like Bat Wing or Spider) aside!
  function getEffectiveMass(item) {
    const profile = getWeightProfileFor(item.tier, item.spiritTier);
    const normalizedArea = Math.max(480, item.r * item.r);
    return normalizedArea * Math.pow(profile.density, 1.55);
  }

  // Level Scaling Helpers so all 20 ingredients are unlocked and used across levels
  function getMinDropTierForLevel(lvl) {
    return Math.min(13, (lvl - 1) * 2);
  }

  function getOrdersTargetForLevel(lvl) {
    if (lvl === 1) return 2;
    if (lvl <= 3) return 3;
    return 4;
  }

  function getCurrentGreedUpgradeCost() {
    return Math.round(SHOP_COSTS.greedBase * Math.pow(1.4, greedLevel));
  }

  // Populate Grimoire: Spirit Evolution Box + 20 Weighted Ingredients
  function buildGrimoireCards() {
    const spriteUrls = window.SPRITE_DATA_URLS || {};

    if (spiritEvoBoxEl) {
      const s1 = window.SPIRIT_TIERS[1];
      const s2 = window.SPIRIT_TIERS[2];
      spiritEvoBoxEl.innerHTML = `
        <div class="spirit-evo-step">
          <img src="${spriteUrls[s1.spriteKey] || ""}" alt="${s1.name}" />
          <span>${s1.name}</span>
        </div>
        <span class="spirit-evo-plus">+</span>
        <div class="spirit-evo-step">
          <img src="${spriteUrls[s1.spriteKey] || ""}" alt="${s1.name}" />
          <span>${s1.name}</span>
        </div>
        <span class="spirit-evo-plus">=</span>
        <div class="spirit-evo-step">
          <img src="${spriteUrls[s2.spriteKey] || ""}" alt="${s2.name}" />
          <span style="color:#ffe47a">${s2.name} 👑</span>
        </div>
      `;
    }

    evolutionGridEl.innerHTML = "";
    window.INGREDIENT_TIERS.forEach((t, idx) => {
      const wProfile = window.WEIGHT_PROFILES[t.weightClass] || window.WEIGHT_PROFILES.medium;
      const card = document.createElement("div");
      card.className = "evo-item";

      const img = document.createElement("img");
      img.className = "evo-sprite";
      img.src = spriteUrls[t.spriteKey] || `assets/sprites/${t.spriteKey}.webp`;
      img.alt = t.name;

      const tierLbl = document.createElement("span");
      tierLbl.className = "evo-tier";
      tierLbl.textContent = `#${idx + 1} (+${t.score})`;

      const nameLbl = document.createElement("span");
      nameLbl.className = "evo-name";
      nameLbl.textContent = t.name;

      const weightLbl = document.createElement("span");
      weightLbl.className = "evo-weight";
      weightLbl.style.color = wProfile.badgeColor;
      weightLbl.textContent = wProfile.label;

      card.append(img, tierLbl, nameLbl, weightLbl);
      evolutionGridEl.appendChild(card);
    });
  }

  // Generate a Guest Order with a strict maximum of 15 coins per order
  function generateOrderForLevel(lvl, stepInLevel) {
    const baseT = getMinDropTierForLevel(lvl);
    const maxTierIndex = window.INGREDIENT_TIERS.length - 1;

    const tierA = Math.min(maxTierIndex, baseT + 2 + Math.min(3, stepInLevel + Math.floor(lvl / 2)));
    const tierB = Math.min(maxTierIndex, Math.max(baseT + 1, tierA - 1 - (stepInLevel % 2)));

    const reqs = [
      { type: "tier", tier: tierA },
      { type: "tier", tier: tierB }
    ];

    // Add Spirit requirement: Level 1 asks for regular Spirit (Tier 1), Level 2+ can ask for evolved Royal Arch-Spirit (Tier 2)!
    if (stepInLevel >= 1 || lvl >= 2) {
      if ((lvl + stepInLevel) % 2 === 0) {
        const wantRoyalSpirit = lvl >= 2 && stepInLevel >= 1;
        reqs.push({
          type: "spirit",
          spiritTier: wantRoyalSpirit ? 2 : 1
        });
      } else {
        const tierC = Math.min(maxTierIndex, baseT + 1 + (stepInLevel % 2));
        reqs.push({ type: "tier", tier: tierC });
      }
    }

    // Strict maximum of 15 coins per order ("максимум 15 за завдання треба давати")
    const rawCoins = 9 + Math.min(4, Math.floor((lvl + stepInLevel) * 0.8)) + greedLevel;
    const coinReward = Math.min(MAX_COINS_PER_ORDER, rawCoins);
    const bonusScore = 220 + lvl * 110 + stepInLevel * 60;

    return { reqs, coinReward, bonusScore };
  }

  function loadGuest(index) {
    const template = STORY_GUEST_ARCHETYPES[index % STORY_GUEST_ARCHETYPES.length];
    const generated = generateOrderForLevel(currentLevel, levelOrdersCompleted);

    activeGuestOrder = {
      template,
      coinReward: generated.coinReward,
      bonusScore: generated.bonusScore,
      slots: generated.reqs.map((r) => ({
        type: r.type,
        tier: r.tier || 0,
        spiritTier: r.spiritTier || 1,
        done: false,
        readyItem: null
      }))
    };

    renderer.drawGuestAvatar(guestAvatarCtx, template.id);
    guestStepBadgeEl.textContent = `${Math.min(levelOrdersCompleted + 1, levelOrdersTarget)}/${levelOrdersTarget}`;
    guestNameEl.textContent = template.name;
    guestRewardTagEl.textContent = `+${generated.coinReward} 🪙`;
    guestDialogueEl.textContent = template.dialogue;

    updateTopPills();
    syncGuestOrderState();
  }

  function formatTimeMMSS(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateTopPills() {
    const isDay = cyclePhase === "dawn_transition" || cyclePhase === "day_shop";
    levelBadgeEl.textContent = isDay ? `☀️ ДЕНЬ ${currentLevel}` : `🌙 НІЧ ${currentLevel}`;
    levelBadgeEl.classList.toggle("is-day", isDay);
    timerValueEl.textContent = formatTimeMMSS(levelTimeRemaining);

    if (timerBarFillEl) {
      const pct = Math.max(0, Math.min(100, (levelTimeRemaining / (levelTotalDuration || LEVEL_DURATION_SECONDS)) * 100));
      timerBarFillEl.style.width = `${pct.toFixed(1)}%`;
    }

    if (!isGameOver && cyclePhase === "night") {
      if (levelTimeRemaining <= 30) {
        timerPillEl.classList.add("is-low-time");
        timerPillEl.classList.toggle("is-critical-time", levelTimeRemaining <= 10);
      } else {
        timerPillEl.classList.remove("is-low-time", "is-critical-time");
      }
    } else {
      timerPillEl.classList.remove("is-low-time", "is-critical-time");
    }

    guestProgressPillEl.textContent = `📜 Ціль: ${levelOrdersCompleted}/${levelOrdersTarget}`;
    coinsValueEl.textContent = coins.toLocaleString("uk-UA");
    if (shopCoinsValueEl) {
      shopCoinsValueEl.textContent = `🪙 ${coins.toLocaleString("uk-UA")}`;
    }
    updateToolAndShopButtons();
  }

  function addCoins(amount, x = null, y = null, customLabel = null) {
    if (amount <= 0) return;
    coins += amount;
    updateTopPills();
    if (x != null && y != null) {
      floatingTexts.push({
        x,
        y,
        text: customLabel || `+${amount} 🪙`,
        alpha: 1,
        vy: -1.45,
        scale: 1.12
      });
    }
  }

  function spendCoins(cost) {
    if (coins < cost) return false;
    coins -= cost;
    updateTopPills();
    return true;
  }

  // Shatter/Rescue a Spirit Orb when items merge nearby!
  function rescueSpiritOrb(orb) {
    const idx = items.indexOf(orb);
    if (idx === -1) return;
    items.splice(idx, 1);

    const spTier = orb.spiritTier || 1;
    const sObj = window.SPIRIT_TIERS[spTier] || window.SPIRIT_TIERS[1];
    rescuedSpiritsTotal++;
    window.cozyAudio.playQuestComplete();
    spawnSparkles(orb.x, orb.y, spTier === 2 ? "#ffe57f" : "#7dffef", 24);
    addScore(sObj.score, orb.x, orb.y, `👻 ${sObj.name} ВРЯТОВАНИЙ! +${sObj.score}`);

    flyingDeliveries.push({
      x: orb.x,
      y: orb.y,
      startX: orb.x,
      startY: orb.y,
      targetX: geom.cx + 30,
      targetY: 18,
      tier: 0,
      isSpiritOrb: true,
      spiritTier: spTier,
      r: 22 * geom.scale,
      progress: 0
    });

    // Fulfill active guest spirit slot or bank the rescued spirit
    let consumed = false;
    if (activeGuestOrder) {
      const exactSlot = activeGuestOrder.slots.find(
        (s) => s.type === "spirit" && !s.done && s.spiritTier === spTier
      );
      const fallbackSlot =
        !exactSlot && spTier === 2
          ? activeGuestOrder.slots.find((s) => s.type === "spirit" && !s.done && s.spiritTier === 1)
          : null;
      const targetSlot = exactSlot || fallbackSlot;
      if (targetSlot) {
        targetSlot.done = true;
        targetSlot.readyItem = null;
        consumed = true;
      }
    }

    if (!consumed) {
      bankedSpirits[spTier] = (bankedSpirits[spTier] || 0) + 1;
    }

    updateTopPills();
    syncGuestOrderState();
  }

  // Match cauldron items & banked rescued spirits to the active guest's recipe slots
  function syncGuestOrderState() {
    items.forEach((it) => {
      it.isNeededByGuest = false;
    });

    if (!activeGuestOrder) return;

    const usedItems = new Set();
    let anyReadyToExtract = false;

    activeGuestOrder.slots.forEach((slot) => {
      slot.readyItem = null;
      if (slot.done) return;

      if (slot.type === "spirit") {
        // 1. Check if we already rescued a matching Spirit via nearby merges!
        if ((bankedSpirits[slot.spiritTier] || 0) > 0) {
          bankedSpirits[slot.spiritTier]--;
          slot.done = true;
          return;
        }
        if (slot.spiritTier === 1 && (bankedSpirits[2] || 0) > 0) {
          bankedSpirits[2]--;
          slot.done = true;
          return;
        }

        // 2. Otherwise check if a matching Spirit is currently in the cauldron ready to be served (or rescued by nearby merge)
        const exactMatch = items.find(
          (it) => it.isSpiritOrb && it.spiritTier === slot.spiritTier && !usedItems.has(it)
        );
        const higherMatch =
          !exactMatch && slot.spiritTier === 1
            ? items.find((it) => it.isSpiritOrb && it.spiritTier >= 2 && !usedItems.has(it))
            : null;
        const match = exactMatch || higherMatch;
        if (match) {
          usedItems.add(match);
          match.isNeededByGuest = true;
          slot.readyItem = match;
          anyReadyToExtract = true;
        }
        return;
      }

      if (slot.type === "tier") {
        const match = items.find(
          (it) => !it.isSpiritOrb && it.tier === slot.tier && !usedItems.has(it)
        );
        if (match) {
          usedItems.add(match);
          match.isNeededByGuest = true;
          slot.readyItem = match;
          anyReadyToExtract = true;
        }
      }
    });

    const spriteUrls = window.SPRITE_DATA_URLS || {};
    recipeSlotsEl.innerHTML = "";

    activeGuestOrder.slots.forEach((slot) => {
      const pill = document.createElement("span");
      pill.className = "recipe-slot";
      if (slot.done) {
        pill.classList.add("is-done");
      } else if (slot.readyItem) {
        pill.classList.add("is-ready");
        pill.title = "Натисни, щоб подати гостю!";
        pill.addEventListener("click", () => serveReadyIngredients());
      }

      const iconImg = document.createElement("img");
      iconImg.className = "slot-sprite";

      const labelSpan = document.createElement("span");

      if (slot.type === "spirit") {
        const sObj = window.SPIRIT_TIERS[slot.spiritTier] || window.SPIRIT_TIERS[1];
        iconImg.src = spriteUrls[sObj.spriteKey] || `assets/sprites/${sObj.spriteKey}.webp`;
        iconImg.alt = sObj.name;
        labelSpan.textContent = slot.done
          ? `${sObj.name} ✓`
          : slot.readyItem
          ? `${sObj.name} ★`
          : sObj.name;
      } else {
        const tObj = window.INGREDIENT_TIERS[slot.tier] || window.INGREDIENT_TIERS[0];
        iconImg.src = spriteUrls[tObj.spriteKey] || `assets/sprites/${tObj.spriteKey}.webp`;
        iconImg.alt = tObj.name;
        labelSpan.textContent = slot.done
          ? `${tObj.name} ✓`
          : slot.readyItem
          ? `${tObj.name} ★`
          : tObj.name;
      }

      pill.append(iconImg, labelSpan);
      recipeSlotsEl.appendChild(pill);
    });

    btnServe.disabled = !anyReadyToExtract || guestTransitionLock || isGameOver;
    updateToolAndShopButtons();

    if (!guestTransitionLock && activeGuestOrder.slots.every((s) => s.done)) {
      completeCurrentGuestOrder();
    }
  }

  // Extract ready ingredients / spirits from the cauldron and fly them to the guest!
  function serveReadyIngredients() {
    if (!activeGuestOrder || guestTransitionLock || isGameOver) return;

    let servedCount = 0;
    activeGuestOrder.slots.forEach((slot) => {
      if (!slot.done && slot.readyItem) {
        const it = slot.readyItem;
        const idx = items.indexOf(it);
        if (idx !== -1) {
          items.splice(idx, 1);
          slot.done = true;
          slot.readyItem = null;
          servedCount++;

          if (it.isSpiritOrb) {
            rescuedSpiritsTotal++;
            const sObj = window.SPIRIT_TIERS[it.spiritTier] || window.SPIRIT_TIERS[1];
            spawnSparkles(it.x, it.y, "#7dffef", 22);
            addScore(sObj.score, it.x, it.y, `👻 ${sObj.name} +${sObj.score}`);
          } else {
            const tObj = window.INGREDIENT_TIERS[it.tier];
            spawnSparkles(it.x, it.y, "#48f0d8", 18);
            addScore(tObj.score, it.x, it.y, `🍵 У ЗІЛЛЯ! +${tObj.score}`);
          }

          flyingDeliveries.push({
            x: it.x,
            y: it.y,
            startX: it.x,
            startY: it.y,
            targetX: geom.cx - 30,
            targetY: 16,
            tier: it.tier,
            isSpiritOrb: it.isSpiritOrb,
            spiritTier: it.spiritTier || 1,
            r: it.r * 0.85,
            progress: 0
          });
        }
      }
    });

    if (servedCount > 0) {
      window.cozyAudio.playMerge(6, 2);
      syncGuestOrderState();
    }
  }

  function completeCurrentGuestOrder() {
    if (!activeGuestOrder || guestTransitionLock) return;
    guestTransitionLock = true;

    const tpl = activeGuestOrder.template;
    const rewardCoins = Math.min(MAX_COINS_PER_ORDER, activeGuestOrder.coinReward);
    const bonusPts = activeGuestOrder.bonusScore;

    levelOrdersCompleted++;

    guestDialogueEl.textContent = tpl.thankYou;
    guestCardEl.classList.add("guest-celebrate");
    window.cozyAudio.playQuestComplete();
    window.cozyAudio.playCoin();

    addScore(bonusPts, geom.cx, geom.neckTopY - 22, `🎉 ЗАМОВЛЕННЯ +${bonusPts}`);
    addCoins(rewardCoins, geom.cx, geom.neckTopY + 4, `🪙 +${rewardCoins} МОНЕТ!`);
    spawnSparkles(geom.cx, geom.neckTopY, "#ffd54f", 26);
    updateTopPills();

    setTimeout(() => {
      guestCardEl.classList.remove("guest-celebrate");
      guestTransitionLock = false;

      if (levelOrdersCompleted >= levelOrdersTarget) {
        triggerLevelComplete();
      } else {
        currentGuestIndex++;
        loadGuest(currentGuestIndex);
      }
    }, 1150);
  }

  function pickNextDrop() {
    dropsSinceSpiritOrb++;
    const activeSpiritOrbs = items.filter((it) => it.isSpiritOrb).length;
    const neededSpiritSlot =
      activeGuestOrder && activeGuestOrder.slots.find((s) => s.type === "spirit" && !s.done);

    const minInterval = neededSpiritSlot ? (neededSpiritSlot.spiritTier === 2 ? 2 : 3) : 5;
    if (
      activeSpiritOrbs < 3 &&
      ((neededSpiritSlot && dropsSinceSpiritOrb >= minInterval) ||
        (activeSpiritOrbs === 1 && dropsSinceSpiritOrb >= 4) ||
        dropsSinceSpiritOrb >= 7)
    ) {
      dropsSinceSpiritOrb = 0;
      return { tier: getMinDropTierForLevel(currentLevel), spiritTier: 1 };
    }

    const baseTier = getMinDropTierForLevel(currentLevel);
    const weights = [0.35, 0.32, 0.21, 0.12];
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r <= acc) {
        const chosenTier = Math.min(window.INGREDIENT_TIERS.length - 2, baseTier + i);
        return { tier: chosenTier, spiritTier: 0 };
      }
    }
    return { tier: baseTier, spiritTier: 0 };
  }

  function renderNextPreview() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    renderer.drawIngredient(
      nextCtx,
      {
        tier: nextTier,
        isSpiritOrb: nextSpiritTier > 0,
        spiritTier: nextSpiritTier,
        x: 26,
        y: 26,
        r: 18,
        angle: 0,
        scaleX: 1,
        scaleY: 1
      },
      1.0
    );

    if (nextWeightBadgeEl) {
      const wProfile = getWeightProfileFor(nextTier, nextSpiritTier);
      nextWeightBadgeEl.textContent = wProfile.label;
      nextWeightBadgeEl.style.color = wProfile.badgeColor;
    }
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    geom.w = Math.max(280, rect.width);
    geom.h = Math.max(300, rect.height);
    geom.dpr = dpr;

    canvas.width = Math.round(geom.w * dpr);
    canvas.height = Math.round(geom.h * dpr);

    const maxRByW = geom.w * 0.43;
    const maxRByH = geom.h * 0.36;
    geom.R = Math.min(maxRByW, maxRByH);
    geom.scale = geom.R / 155;

    geom.cx = geom.w * 0.5;
    geom.cy = geom.h * 0.58;
    geom.neckAngle = 0.62;
    geom.neckTopY = geom.cy - geom.R * Math.sin(geom.neckAngle);
    geom.neckHalfW = geom.R * Math.cos(geom.neckAngle);
    geom.rimOpenHalfW = geom.neckHalfW * 0.94;
    geom.dangerY = geom.neckTopY + 14 * geom.scale;

    items.forEach((it) => {
      const baseR = it.isSpiritOrb
        ? (window.SPIRIT_TIERS[it.spiritTier] || window.SPIRIT_TIERS[1]).baseRadius
        : window.INGREDIENT_TIERS[it.tier].baseRadius;
      it.r = baseR * geom.scale;
      updateItemWorldCircles(it);
    });

    catX = clampCatX(catX);
    targetCatX = clampCatX(targetCatX);
  }

  function clampCatX(x) {
    const baseR = currentSpiritTier > 0
      ? (window.SPIRIT_TIERS[currentSpiritTier] || window.SPIRIT_TIERS[1]).baseRadius
      : window.INGREDIENT_TIERS[currentTier].baseRadius;
    const currentR = baseR * geom.scale;
    const minX = geom.cx - geom.rimOpenHalfW + currentR + 4;
    const maxX = geom.cx + geom.rimOpenHalfW - currentR - 4;
    return Math.max(minX, Math.min(maxX, x));
  }

  function createItem(tier, x, y, vx = 0, vy = 0, isMerged = false, spiritTier = 0) {
    const isSpiritOrb = spiritTier > 0;
    const safeTier = Math.max(0, Math.min(window.INGREDIENT_TIERS.length - 1, tier));
    const baseR = isSpiritOrb
      ? (window.SPIRIT_TIERS[spiritTier] || window.SPIRIT_TIERS[1]).baseRadius
      : window.INGREDIENT_TIERS[safeTier].baseRadius;

    const item = {
      id: nextItemId++,
      tier: safeTier,
      isSpiritOrb,
      spiritTier,
      isNeededByGuest: false,
      x,
      y,
      vx,
      vy,
      r: baseR * geom.scale,
      boundR: baseR * geom.scale,
      topY: y - baseR * geom.scale,
      worldCircles: [],
      angle: (Math.random() - 0.5) * 0.25,
      omega: 0,
      scaleX: isMerged ? 1.32 : 1,
      scaleY: isMerged ? 0.72 : 1,
      age: 0,
      aboveDangerTime: 0
    };
    updateItemWorldCircles(item);
    items.push(item);
    if (!isSpiritOrb) {
      highestTierReached = Math.max(highestTierReached, safeTier);
    }
    syncGuestOrderState();
    return item;
  }

  function dropCurrentItem() {
    if (isGameOver || cyclePhase !== "night" || dropCooldown > 0 || stirState.modeActive) return;

    const dropX = clampCatX(catX) + (Math.random() - 0.5) * 1.5;
    const dropY = geom.neckTopY - 2;
    const wProfile = getWeightProfileFor(currentTier, currentSpiritTier);

    createItem(
      currentTier,
      dropX,
      dropY,
      0,
      wProfile.dropVy * geom.scale,
      false,
      currentSpiritTier
    );

    window.cozyAudio.playDrop();
    spawnSparkles(dropX, dropY, currentSpiritTier > 0 ? "#7dffef" : "#ffd885", 6);

    currentTier = nextTier;
    currentSpiritTier = nextSpiritTier;
    const picked = pickNextDrop();
    nextTier = picked.tier;
    nextSpiritTier = picked.spiritTier;

    renderNextPreview();
    targetCatX = clampCatX(targetCatX);
    dropCooldown = 0.32;
  }

  function addScore(points, x, y, labelOverride = null) {
    score += points;
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem(STORAGE_KEY_HISCORE, String(hiScore));
    }

    if (x != null && y != null) {
      floatingTexts.push({
        x,
        y,
        text: labelOverride || `+${points}`,
        alpha: 1,
        vy: -1.3,
        scale: labelOverride ? 1.12 : 1
      });
    }
  }

  function spawnSparkles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 1.2 + Math.random() * 3.8;
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.8,
        size: 3 + Math.random() * 4.5,
        color,
        alpha: 1,
        decay: 0.022 + Math.random() * 0.018
      });
    }
  }

  function showComboToast(combo) {
    if (combo < 2) return;
    comboToastEl.textContent = `КОМБО ×${combo}! ✨`;
    comboToastEl.classList.add("is-active");
    clearTimeout(showComboToast._tid);
    showComboToast._tid = setTimeout(() => {
      comboToastEl.classList.remove("is-active");
    }, 1150);
  }

  // Execute merge between two matching ingredients OR two matching Spirits!
  function executeMergePair(a, b) {
    const idxA = items.indexOf(a);
    const idxB = items.indexOf(b);
    if (idxA === -1 || idxB === -1) return null;

    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;

    items = items.filter((item) => item !== a && item !== b);

    comboCount++;
    comboResetTimer = 1.75;
    showComboToast(comboCount);

    // Case 1: Merging Two Spirits! (Дух-Світлячок + Дух-Світлячок = Архідух Ліхтаря!)
    if (a.isSpiritOrb && b.isSpiritOrb) {
      rescuedSpiritsTotal++;
      if (a.spiritTier === 1) {
        const royal = createItem(0, mx, my, 0, -1.2, true, 2);
        const sData = window.SPIRIT_TIERS[2];
        addScore(sData.score, mx, my - 8, `👑 ${sData.name}! +${sData.score}`);
        window.cozyAudio.playQuestComplete();
        spawnSparkles(mx, my, "#ffe57f", 28);
        spawnSparkles(mx, my, "#7dffef", 18);
        syncGuestOrderState();
        return royal;
      } else {
        // Two Royal Spirits merged -> Blessing of the Arch-Spirits!
        addScore(650, mx, my - 10, "👑 БЛАГОСЛОВЕННЯ АРХІДУХІВ +650!");
        addCoins(4, mx, my + 12, "+4 🪙");
        window.cozyAudio.playQuestComplete();
        spawnSparkles(mx, my, "#ffe57f", 36);
        if (activeGuestOrder) {
          const spSlot = activeGuestOrder.slots.find((s) => s.type === "spirit" && !s.done);
          if (spSlot) spSlot.done = true;
        }
        syncGuestOrderState();
        return null;
      }
    }

    // Case 2: Merging Two Regular Ingredients -> Also rescues any nearby Spirit Orbs!
    const tier = a.tier;
    let mergedItem = null;
    let mergedRadius = 38 * geom.scale;

    if (tier < window.INGREDIENT_TIERS.length - 1) {
      const nextT = tier + 1;
      const tierData = window.INGREDIENT_TIERS[nextT];
      mergedItem = createItem(nextT, mx, my, 0, -1.4, true, 0);
      mergedRadius = mergedItem.r;

      const gained = Math.round(tierData.score * (1 + (comboCount - 1) * 0.25));
      addScore(gained, mx, my);
      window.cozyAudio.playMerge(nextT, comboCount);
      spawnSparkles(mx, my, tierData.primary, 16 + Math.min(20, nextT));

      items.forEach((other) => {
        if (other === mergedItem) return;
        const dx = other.x - mx;
        const dy = other.y - my;
        const d = Math.hypot(dx, dy) || 1;
        if (d < mergedItem.r * 2.3) {
          const push = (1 - d / (mergedItem.r * 2.3)) * 38;
          other.vx += (dx / d) * push;
          other.vy += (dy / d) * push;
        }
      });
    } else {
      addScore(3500, mx, my - 10, "👑 КОРОЛІВСЬКИЙ СИНТЕЗ +3500!");
      addCoins(5, mx, my + 12, "+5 🪙");
      window.cozyAudio.playQuestComplete();
      spawnSparkles(mx, my, "#ffe66d", 36);
    }

    // Nearby Spirits disappear / get rescued when regular items merge right next to them!
    const orbsToRescue = items.filter(
      (it) =>
        it.isSpiritOrb &&
        Math.hypot(it.x - mx, it.y - my) <= mergedRadius + it.r + 52 * geom.scale
    );
    orbsToRescue.forEach((orb) => rescueSpiritOrb(orb));

    syncGuestOrderState();
    return mergedItem;
  }

  // Tool 1: Toggle Big Stirring Spoon Mode (Велика Мішалка)
  function toggleStirMode() {
    if (isGameOver || cyclePhase !== "night") return;

    if (stirState.modeActive) {
      if (!stirState.isDragging) {
        stirState.modeActive = false;
        stirState.trail = [];
        updateToolAndShopButtons();
      }
      return;
    }

    if (potions.stir <= 0 || items.length === 0) return;

    stirState.modeActive = true;
    stirState.isDragging = false;
    stirState.distanceMoved = 0;
    stirState.trail = [];
    stirState.x = geom.cx;
    stirState.y = geom.cy;
    window.cozyAudio.playPotion("vortex");
    updateToolAndShopButtons();
  }

  function finishStirStroke() {
    if (!stirState.modeActive) return;
    stirState.modeActive = false;
    stirState.isDragging = false;
    stirState.trail = [];

    potions.stir = Math.max(0, potions.stir - 1);
    window.cozyAudio.playMerge(8, 2);
    spawnSparkles(geom.cx, geom.cy, "#7dffef", 22);
    floatingTexts.push({
      x: geom.cx,
      y: geom.cy - geom.R * 0.25,
      text: "🥄 КАЗАН ПЕРЕМІШАНО!",
      alpha: 1,
      vy: -1.4,
      scale: 1.18
    });
    updateToolAndShopButtons();
  }

  // Tool 2: Bat Helper (Кажанчик) — rescues a Spirit Orb or removes up to 2 smallest unneeded clutter items!
  function useBatPotion() {
    if (isGameOver || cyclePhase !== "night" || items.length === 0 || batAnim || potions.bat <= 0) return;

    const spiritOrb = items.find((it) => it.isSpiritOrb);
    const candidates = [...items]
      .filter((it) => !it.isNeededByGuest && !it.isSpiritOrb)
      .sort((a, b) => a.tier - b.tier || a.y - b.y);
    const target = spiritOrb || candidates[0] || items[0];
    if (!target) return;

    potions.bat--;
    updateToolAndShopButtons();
    window.cozyAudio.playPotion("bat");

    batAnim = {
      x: geom.cx - geom.R * 0.8,
      y: geom.neckTopY - 50,
      targetItem: target,
      secondaryItem: !spiritOrb && candidates.length > 1 ? candidates[1] : null,
      phase: "swoop",
      progress: 0
    };
  }

  // Daytime Shop Purchases (Open in place of the cauldron when Day breaks!)
  function buyShopStir() {
    if (coins < SHOP_COSTS.stir) return;
    if (!spendCoins(SHOP_COSTS.stir)) return;
    potions.stir++;
    window.cozyAudio.playCoin();
    updateInterLevelModalStats();
  }

  function buyShopBat() {
    if (coins < SHOP_COSTS.bat) return;
    if (!spendCoins(SHOP_COSTS.bat)) return;
    potions.bat++;
    window.cozyAudio.playCoin();
    updateInterLevelModalStats();
  }

  function buyShopTime() {
    if (coins < SHOP_COSTS.time) return;
    if (!spendCoins(SHOP_COSTS.time)) return;
    nextLevelBonusSeconds += 30;
    window.cozyAudio.playCoin();
    updateInterLevelModalStats();
  }

  function buyShopNeeded() {
    if (coins < SHOP_COSTS.needed) return;
    if (!spendCoins(SHOP_COSTS.needed)) return;
    nextLevelStarterNeededCount += 1;
    window.cozyAudio.playCoin();
    updateInterLevelModalStats();
  }

  function buyShopGreed() {
    const cost = getCurrentGreedUpgradeCost();
    if (coins < cost) return;
    if (!spendCoins(cost)) return;
    greedLevel++;
    window.cozyAudio.playLevelWin();
    updateInterLevelModalStats();
  }

  function updateInterLevelModalStats() {
    if (finalScoreEl) {
      finalScoreEl.textContent = `🪙 ${coins}`;
    }
    if (shopCoinsValueEl) {
      shopCoinsValueEl.textContent = `🪙 ${coins}`;
    }
    updateToolAndShopButtons();
  }

  function updateToolAndShopButtons() {
    countStirEl.textContent = `×${potions.stir}`;
    countBatEl.textContent = `×${potions.bat}`;

    if (stirState.modeActive) {
      btnPotionStir.classList.add("is-active-tool");
      labelStirEl.textContent = "Проведи!";
    } else {
      btnPotionStir.classList.remove("is-active-tool");
      labelStirEl.textContent = "Мішалка";
    }

    const inNightPlay = !isGameOver && cyclePhase === "night";
    btnPotionStir.disabled = !inNightPlay || (potions.stir <= 0 && !stirState.modeActive) || items.length === 0;
    btnPotionBat.disabled = !inNightPlay || potions.bat <= 0 || items.length === 0 || Boolean(batAnim);

    if (btnBuyStir) {
      btnBuyStir.textContent = `🪙 ${SHOP_COSTS.stir}`;
      btnBuyStir.disabled = coins < SHOP_COSTS.stir;
      if (descBuyStirEl) {
        descBuyStirEl.textContent = `У запасі: ×${potions.stir} (перемішує казан ложкою)`;
      }
    }
    if (btnBuyBat) {
      btnBuyBat.textContent = `🪙 ${SHOP_COSTS.bat}`;
      btnBuyBat.disabled = coins < SHOP_COSTS.bat;
      if (descBuyBatEl) {
        descBuyBatEl.textContent = `У запасі: ×${potions.bat} (забирає 2 зайві предмети)`;
      }
    }
    if (btnBuyTime) {
      btnBuyTime.textContent = `🪙 ${SHOP_COSTS.time}`;
      btnBuyTime.disabled = coins < SHOP_COSTS.time;
      if (descBuyTimeEl) {
        descBuyTimeEl.textContent =
          nextLevelBonusSeconds > 0
            ? `Куплено: +${nextLevelBonusSeconds} сек до наступної ночі!`
            : "Додає +30 секунд на наступну ніч";
      }
    }
    if (btnBuyNeeded) {
      btnBuyNeeded.textContent = `🪙 ${SHOP_COSTS.needed}`;
      btnBuyNeeded.disabled = coins < SHOP_COSTS.needed;
      if (descBuyNeededEl) {
        descBuyNeededEl.textContent =
          nextLevelStarterNeededCount > 0
            ? `Куплено предметів на старт: ${nextLevelStarterNeededCount} шт.`
            : "На початку ночі дає потрібний гостю предмет";
      }
    }
    if (btnBuyGreed) {
      const greedCost = getCurrentGreedUpgradeCost();
      btnBuyGreed.textContent = `🪙 ${greedCost}`;
      btnBuyGreed.disabled = coins < greedCost;
      if (descBuyGreedEl) {
        descBuyGreedEl.textContent =
          greedLevel > 0
            ? `Рівень ${greedLevel}: вищий курс секунд у монети та замовлень (до 15🪙)`
            : "Більше монет за замовлення (до 15🪙) і збережений час";
      }
    }
  }

  // Clamp a point inside the cauldron interior for the Stirring Spoon
  function clampPointToCauldronBowl(x, y) {
    const minY = geom.neckTopY + 18 * geom.scale;
    const clampedY = Math.max(minY, Math.min(geom.cy + geom.R * 0.78, y));
    const dx = x - geom.cx;
    const dy = clampedY - geom.cy;
    const maxR = geom.R * 0.78;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR && dist > 0) {
      return {
        x: geom.cx + (dx / dist) * maxR,
        y: geom.cy + (dy / dist) * maxR
      };
    }
    return { x, y: clampedY };
  }

  // Apply physical stirring forces from the Big Wooden Spoon to ingredients in the cauldron
  function applyStirSpoonImpulse(newX, newY) {
    const clamped = clampPointToCauldronBowl(newX, newY);
    const vxSpoon = clamped.x - stirState.x;
    const vySpoon = clamped.y - stirState.y;
    const stepDist = Math.hypot(vxSpoon, vySpoon);

    stirState.x = clamped.x;
    stirState.y = clamped.y;
    stirState.distanceMoved += stepDist;

    stirState.trail.push({ x: clamped.x, y: clamped.y });
    if (stirState.trail.length > 18) {
      stirState.trail.shift();
    }

    if (stepDist > 2 && stirState.soundCooldown <= 0) {
      window.cozyAudio.playBounce(1.4);
      spawnSparkles(clamped.x, clamped.y, "#7dffef", 2);
      stirState.soundCooldown = 0.09;
    }

    const spoonRadius = 44 * geom.scale;
    items.forEach((it) => {
      const dx = it.x - clamped.x;
      const dy = it.y - clamped.y;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = spoonRadius + it.boundR;

      if (dist < reach) {
        const factor = 1 - dist / reach;
        const wProfile = getWeightProfileFor(it.tier, it.spiritTier);
        const weightResponse = 1.15 / Math.pow(wProfile.density, 0.25);

        it.vx += vxSpoon * 12.5 * factor * weightResponse;
        it.vy += (vySpoon * 11.5 - 48 * geom.scale) * factor * weightResponse;

        const nx = dx / dist;
        const ny = dy / dist;
        it.x += nx * (reach - dist) * 0.32;
        it.y += ny * (reach - dist) * 0.32;
        it.omega += ((vxSpoon * ny - vySpoon * nx) * 0.08) / Math.max(18, it.r);
        it.scaleX = 1.16;
        it.scaleY = 0.86;
      }
    });

    if (stirState.distanceMoved >= stirState.maxDistance * geom.scale) {
      finishStirStroke();
    }
  }

  // Physics & Timer Step (Compound Multi-Circle Silhouette Colliders + 4 Weight Classes + Day/Night Transitions)
  function stepPhysics(dt) {
    // Animate Dawn (Night -> Day Shop) and Dusk (Day Shop -> Next Night) transitions smoothly
    if (cyclePhase === "dawn_transition") {
      dayBlend = Math.min(1, dayBlend + dt * 0.85);
      if (dayBlend >= 0.48 && !dayShopOpenedInTransition) {
        dayShopOpenedInTransition = true;
        showElement(dayShopStageEl);
      }
      if (dayBlend >= 1) {
        cyclePhase = "day_shop";
      }
    } else if (cyclePhase === "dusk_transition") {
      dayBlend = Math.max(0, dayBlend - dt * 0.95);
      if (dayBlend <= 0) {
        cyclePhase = "night";
        startLevel(currentLevel + 1, false);
        return;
      }
    }

    const subSteps = 6;
    const subDt = dt / subSteps;

    catX += (targetCatX - catX) * Math.min(1, dt * 16);

    if (dropCooldown > 0) {
      dropCooldown = Math.max(0, dropCooldown - dt);
    }
    if (stirState.soundCooldown > 0) {
      stirState.soundCooldown = Math.max(0, stirState.soundCooldown - dt);
    }

    // 2-Minute Night Countdown Timer (runs only during active Night brewing)
    const isModalOpen = grimoireDialog.open || gameOverDialog.open;
    if (!isGameOver && cyclePhase === "night" && !isModalOpen && !guestTransitionLock) {
      levelTimeRemaining = Math.max(0, levelTimeRemaining - dt);
      const currentWhole = Math.ceil(levelTimeRemaining);
      if (currentWhole !== lastWholeSecond) {
        lastWholeSecond = currentWhole;
        updateTopPills();
        if (currentWhole > 0 && currentWhole <= 15) {
          window.cozyAudio.playTickWarning();
        }
      }
      if (levelTimeRemaining <= 0) {
        triggerLevelFailed("time");
        return;
      }
    }

    if (comboResetTimer > 0) {
      comboResetTimer -= dt;
      if (comboResetTimer <= 0) {
        comboCount = 0;
      }
    }

    if (batAnim) {
      batAnim.progress += dt * 2.2;
      const t = Math.min(1, batAnim.progress);
      if (batAnim.phase === "swoop") {
        const tx = batAnim.targetItem ? batAnim.targetItem.x : geom.cx;
        const ty = batAnim.targetItem ? batAnim.targetItem.y : geom.cy;
        batAnim.x = (1 - t) * (geom.cx - geom.R * 0.7) + t * tx;
        batAnim.y = (1 - t) * (geom.neckTopY - 50) + t * ty;

        if (t >= 1) {
          const target = batAnim.targetItem;
          if (target && items.includes(target)) {
            if (target.isSpiritOrb) {
              rescueSpiritOrb(target);
            } else {
              items.splice(items.indexOf(target), 1);
              const pts = window.INGREDIENT_TIERS[target.tier].score * 2;
              addScore(pts, target.x, target.y, `🦇 +${pts}`);
              spawnSparkles(target.x, target.y, "#ffae38", 18);
            }
          }
          if (batAnim.secondaryItem && items.includes(batAnim.secondaryItem)) {
            const sec = batAnim.secondaryItem;
            items.splice(items.indexOf(sec), 1);
            spawnSparkles(sec.x, sec.y, "#ffae38", 14);
          }
          syncGuestOrderState();

          batAnim.phase = "flyOut";
          batAnim.progress = 0;
          batAnim.startX = batAnim.x;
          batAnim.startY = batAnim.y;
        }
      } else {
        batAnim.x = (1 - t) * batAnim.startX + t * (geom.cx + geom.R * 0.85);
        batAnim.y = (1 - t) * batAnim.startY + t * (geom.neckTopY - 70);
        if (t >= 1) {
          batAnim = null;
          updateToolAndShopButtons();
        }
      }
    }

    for (let i = flyingDeliveries.length - 1; i >= 0; i--) {
      const fd = flyingDeliveries[i];
      fd.progress += dt * 2.4;
      const t = Math.min(1, fd.progress);
      const ease = 1 - Math.pow(1 - t, 3);
      fd.x = (1 - ease) * fd.startX + ease * fd.targetX;
      fd.y = (1 - ease) * fd.startY + ease * fd.targetY - Math.sin(t * Math.PI) * 45;
      if (t >= 1) {
        flyingDeliveries.splice(i, 1);
      }
    }

    const rimPosts = [
      { x: geom.cx - geom.rimOpenHalfW, y: geom.neckTopY, r: 7 * geom.scale },
      { x: geom.cx + geom.rimOpenHalfW, y: geom.neckTopY, r: 7 * geom.scale }
    ];

    let mergePair = null;
    const baseGravity = 560 * geom.scale;

    for (let s = 0; s < subSteps; s++) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const wProfile = getWeightProfileFor(it.tier, it.spiritTier);

        // Apply weight-class specific gravity (Light items fall slowly; Heavy/Very Heavy fall fast!)
        it.vy += baseGravity * wProfile.gravityScale * subDt;

        // Light items (bat wing, spider, spirits) gently flutter/sway while falling in the air
        if (wProfile.flutter > 0 && Math.abs(it.vy) > 18 * geom.scale && it.age < 1.8) {
          it.vx += Math.sin(it.age * 7.5 + it.id * 1.7) * wProfile.flutter * geom.scale * subDt;
        }

        const stepDrag = Math.pow(wProfile.drag, 1 / subSteps);
        it.vx *= stepDrag;
        it.vy *= stepDrag;

        it.x += it.vx * subDt;
        it.y += it.vy * subDt;
        it.angle += it.omega * subDt;
        it.omega *= 0.975;

        updateItemWorldCircles(it);
      }

      // Compound Multi-Circle Collisions matching the exact sprite silhouettes
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j];

          // Fast broad-phase bounding sphere check
          const bdx = b.x - a.x;
          const bdy = b.y - a.y;
          const boundMin = a.boundR + b.boundR;
          if (bdx * bdx + bdy * bdy >= boundMin * boundMin) continue;

          // Narrow-phase check across compound sub-circles of A and B
          const circlesA = a.worldCircles;
          const circlesB = b.worldCircles;
          let maxOverlap = 0;
          let bestCA = null;
          let bestCB = null;
          let bestDist = 0;

          for (let ka = 0; ka < circlesA.length; ka++) {
            const ca = circlesA[ka];
            for (let kb = 0; kb < circlesB.length; kb++) {
              const cb = circlesB[kb];
              const dx = cb.x - ca.x;
              const dy = cb.y - ca.y;
              const minD = ca.r + cb.r;
              const dSq = dx * dx + dy * dy;
              if (dSq < minD * minD) {
                const d = Math.sqrt(dSq) || 0.001;
                const ov = minD - d;
                if (ov > maxOverlap) {
                  maxOverlap = ov;
                  bestCA = ca;
                  bestCB = cb;
                  bestDist = d;
                }
              }
            }
          }

          if (maxOverlap > 0 && bestCA && bestCB) {
            if (!mergePair) {
              const bothRegularSame = !a.isSpiritOrb && !b.isSpiritOrb && a.tier === b.tier;
              const bothSpiritSame = a.isSpiritOrb && b.isSpiritOrb && a.spiritTier === b.spiritTier;
              if (bothRegularSame || bothSpiritSame) {
                mergePair = [a, b];
              }
            }

            const nx = (bestCB.x - bestCA.x) / bestDist;
            const ny = (bestCB.y - bestCA.y) / bestDist;

            // Use 4-category weight mass so Heavy/Very Heavy items push Light/Medium items aside!
            const ma = getEffectiveMass(a);
            const mb = getEffectiveMass(b);
            const totalM = ma + mb;

            const moveA = maxOverlap * (mb / totalM);
            const moveB = maxOverlap * (ma / totalM);

            a.x -= nx * moveA;
            a.y -= ny * moveA;
            b.x += nx * moveB;
            b.y += ny * moveB;

            // Plowing / Wedge effect: when a heavier item is above a lighter item, it shoves the lighter item sideways!
            const profA = getWeightProfileFor(a.tier, a.spiritTier);
            const profB = getWeightProfileFor(b.tier, b.spiritTier);
            if (profA.density >= profB.density * 1.8 && a.y < b.y + b.r * 0.3) {
              const sideDir = bdx >= 0 ? 1 : -1;
              const shove = (profA.density / profB.density) * 9.5 * geom.scale * subDt;
              b.vx += sideDir * shove;
              b.vy -= shove * 0.25;
            } else if (profB.density >= profA.density * 1.8 && b.y < a.y + a.r * 0.3) {
              const sideDir = bdx <= 0 ? 1 : -1;
              const shove = (profB.density / profA.density) * 9.5 * geom.scale * subDt;
              a.vx += sideDir * shove;
              a.vy -= shove * 0.25;
            }

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const restitution = 0.2;
              const jImp = (-(1 + restitution) * velAlongNormal) / (1 / ma + 1 / mb);
              const impX = jImp * nx;
              const impY = jImp * ny;

              a.vx -= impX / ma;
              a.vy -= impY / ma;
              b.vx += impX / mb;
              b.vy += impY / mb;

              // Torque from off-center contact point so non-round shapes (wings, bones, fangs) rotate naturally!
              const torqueA = bestCA.rx * -impY - bestCA.ry * -impX;
              const torqueB = bestCB.rx * impY - bestCB.ry * impX;
              if (!a.isSpiritOrb) {
                a.omega += (torqueA / (ma * a.r)) * 0.45;
              }
              if (!b.isSpiritOrb) {
                b.omega += (torqueB / (mb * b.r)) * 0.45;
              }

              if (Math.abs(velAlongNormal) > 95) {
                window.cozyAudio.playBounce(Math.abs(velAlongNormal) * 0.02);
              }
            }

            updateItemWorldCircles(a);
            updateItemWorldCircles(b);
          }
        }
      }

      // Cauldron Curved Wall & Rim Constraints against each item's compound sub-circles
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const circles = it.worldCircles;
        let movedWall = false;

        for (let k = 0; k < circles.length; k++) {
          const c = circles[k];

          for (const post of rimPosts) {
            const dx = c.x - post.x;
            const dy = c.y - post.y;
            const minD = c.r + post.r;
            const dSq = dx * dx + dy * dy;
            if (dSq < minD * minD) {
              const d = Math.sqrt(dSq) || 0.001;
              const nx = dx / d;
              const ny = dy / d;
              const pen = minD - d;
              it.x += nx * pen;
              it.y += ny * pen;
              movedWall = true;
              const vn = it.vx * nx + it.vy * ny;
              if (vn < 0) {
                it.vx -= 1.25 * vn * nx;
                it.vy -= 1.25 * vn * ny;
              }
            }
          }

          if (c.y >= geom.neckTopY) {
            const dx = c.x - geom.cx;
            const dy = c.y - geom.cy;
            const dist = Math.hypot(dx, dy) || 0.001;
            const maxDist = geom.R - c.r;

            if (dist > maxDist) {
              const nx = dx / dist;
              const ny = dy / dist;
              const pen = dist - maxDist;

              it.x -= nx * pen;
              it.y -= ny * pen;
              movedWall = true;

              const vn = it.vx * nx + it.vy * ny;
              if (vn > 0) {
                const bounce = 0.2;
                it.vx -= (1 + bounce) * vn * nx;
                it.vy -= (1 + bounce) * vn * ny;

                const tx = -ny;
                const ty = nx;
                const vt = it.vx * tx + it.vy * ty;
                it.vx -= vt * 0.03 * tx;
                it.vy -= vt * 0.03 * ty;
                if (!it.isSpiritOrb) {
                  // Align elongated items smoothly against curved cauldron floor
                  const wallTorque = c.rx * -ny - c.ry * -nx;
                  it.omega += (wallTorque / (it.r * it.r)) * 0.08 + (vt / it.r) * 0.15;
                }
              }
            }
          } else {
            const leftBound = geom.cx - geom.rimOpenHalfW + c.r;
            const rightBound = geom.cx + geom.rimOpenHalfW - c.r;
            if (c.x < leftBound) {
              it.x += leftBound - c.x;
              it.vx = Math.abs(it.vx) * 0.3;
              movedWall = true;
            } else if (c.x > rightBound) {
              it.x -= c.x - rightBound;
              it.vx = -Math.abs(it.vx) * 0.3;
              movedWall = true;
            }
          }
        }

        if (movedWall) {
          updateItemWorldCircles(it);
        }
      }
    }

    // Process Merge if a matching pair collided
    if (mergePair) {
      executeMergePair(mergePair[0], mergePair[1]);
    }

    // Spring back squash-and-stretch & check overflow condition using actual highest sub-circle topY
    let maxDanger = 0;
    for (const it of items) {
      it.age += dt;
      it.scaleX += (1 - it.scaleX) * Math.min(1, dt * 14);
      it.scaleY += (1 - it.scaleY) * Math.min(1, dt * 14);

      if (it.age > 1.2 && it.topY < geom.dangerY && !stirState.isDragging) {
        it.aboveDangerTime += dt;
        maxDanger = Math.max(maxDanger, it.aboveDangerTime / 2.5);
      } else {
        it.aboveDangerTime = Math.max(0, it.aboveDangerTime - dt * 2);
      }
    }

    dangerTimer = maxDanger;
    if (dangerTimer >= 1 && !isGameOver) {
      triggerLevelFailed("overflow");
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
  }

  function drawMurchikShopAvatar() {
    const w = guestAvatarCanvas.width;
    const h = guestAvatarCanvas.height;
    guestAvatarCtx.clearRect(0, 0, w, h);
    const catSprite = renderer.getSprite("cat_murchik");
    if (catSprite) {
      guestAvatarCtx.save();
      guestAvatarCtx.imageSmoothingEnabled = true;
      guestAvatarCtx.imageSmoothingQuality = "high";
      guestAvatarCtx.drawImage(catSprite, 2, 2, w - 4, h - 4);
      guestAvatarCtx.restore();
    }
  }

  // When a level (Night) is passed: animate Sunrise, switch background to Daytime, and open the Shop in place of the Cauldron!
  function triggerLevelComplete() {
    stirState.modeActive = false;
    stirState.isDragging = false;
    stirState.trail = [];
    window.cozyAudio.playSunrise();

    // Convert saved seconds into coins!
    const savedSeconds = Math.max(0, Math.floor(levelTimeRemaining));
    const coinsPerSecRate = 0.25 + greedLevel * 0.06;
    const timeBonusCoins = Math.max(1, Math.round(savedSeconds * coinsPerSecRate));

    coins += timeBonusCoins;
    score += savedSeconds * 12;
    if (score > hiScore) {
      hiScore = score;
      localStorage.setItem(STORAGE_KEY_HISCORE, String(hiScore));
    }

    cyclePhase = "dawn_transition";
    dayShopOpenedInTransition = false;
    document.body.dataset.timeOfDay = "day";
    hideElement(nextPreviewEl);
    hideElement(timerPillEl);

    const nextMinTier = getMinDropTierForLevel(currentLevel + 1);
    const unlockedIngredient = window.INGREDIENT_TIERS[Math.min(19, nextMinTier + 3)];

    if (dayShopBadgeEl) {
      dayShopBadgeEl.textContent = unlockedIngredient ? `☀️${unlockedIngredient.emoji}` : "☀️";
    }
    if (dayShopTitleEl) {
      dayShopTitleEl.textContent = `День ${currentLevel} — Денна Крамниця`;
    }
    if (dayShopSubtitleEl) {
      dayShopSubtitleEl.textContent = `Збережено ${savedSeconds} сек → +${timeBonusCoins} 🪙 монет!`;
    }
    if (btnContinueToNight) {
      btnContinueToNight.textContent = `🌙 Продовжити — Настає Ніч ${currentLevel + 1}!`;
    }

    // Update top guest card to show Murchik running the Sunny Daytime Shop
    drawMurchikShopAvatar();
    guestStepBadgeEl.textContent = "☀️ ДЕНЬ";
    guestNameEl.textContent = "Мурчик, Господар Денної Крамниці";
    guestRewardTagEl.textContent = `+${timeBonusCoins} 🪙 за час`;
    guestDialogueEl.textContent =
      "«Світанок настав! Замість казана відкрилась наша крамниця — закуповуй припаси перед наступною ніччю!»";
    recipeSlotsEl.innerHTML = `
      <span class="recipe-slot is-done">☀️ День ${currentLevel} пройдено</span>
      <span class="recipe-slot is-ready">⏱️ ${savedSeconds}с → +${timeBonusCoins} 🪙</span>
    `;
    btnServe.disabled = true;

    showDayNightBanner(
      "☀️",
      `Настав День ${currentLevel}!`,
      `Збережено ${savedSeconds}с (+${timeBonusCoins} 🪙) — відкривається денна крамниця!`,
      false,
      2900
    );

    updateInterLevelModalStats();
    updateTopPills();
  }

  // When the player clicks "Продовжити" in the Daytime Shop: close Shop, animate Dusk/Nightfall, and bring back the Cauldron!
  function startNightTransitionToNextLevel() {
    if (cyclePhase !== "day_shop" && cyclePhase !== "dawn_transition") return;
    window.cozyAudio.init();
    window.cozyAudio.playNightfall();

    cyclePhase = "dusk_transition";
    document.body.dataset.timeOfDay = "night";
    hideElement(dayShopStageEl);
    showElement(nextPreviewEl);

    showDayNightBanner(
      "🌙",
      `Настає Ніч ${currentLevel + 1}!`,
      "Сутінки опускаються на майстерню — казан знову готовий до роботи!",
      true,
      2300
    );

    updateTopPills();
  }

  function triggerLevelFailed(reason) {
    isGameOver = true;
    stirState.modeActive = false;
    stirState.isDragging = false;
    window.cozyAudio.setDaytime(false);
    updateTopPills();
    syncGuestOrderState();

    const bestTier = window.INGREDIENT_TIERS[highestTierReached] || window.INGREDIENT_TIERS[0];
    if (reason === "time") {
      gameOverTitleEl.textContent = `⌛ Час Ночі ${currentLevel} Вийшов!`;
      summaryBadgeEl.textContent = "⏱️";
      summaryRankEl.textContent = `Виконано замовлень: ${levelOrdersCompleted} з ${levelOrdersTarget}`;
      summaryStoryEl.textContent =
        "Дві хвилини минули до світанку! Використовуй важкі інгредієнти та 🥄 Велику Мішалку, щоб швидше з'єднувати пари.";
    } else {
      gameOverTitleEl.textContent = "🌙 Казан Переповнився!";
      summaryBadgeEl.textContent = bestTier.emoji;
      summaryRankEl.textContent = "Інгредієнти перелилися через край!";
      summaryStoryEl.textContent =
        "Подавай готові інгредієнти гостям та використовуй 🥄 Мішалку і 🦇 Кажанчика, щоб звільняти місце!";
    }

    finalGuestsEl.textContent = `${levelOrdersCompleted}/${levelOrdersTarget}`;
    finalSpiritsEl.textContent = `0с → +0 🪙`;
    finalScoreEl.textContent = `🪙 ${coins}`;

    btnNextOrRetry.textContent = `🔄 Спробувати Ніч ${currentLevel} Знову`;
    gameOverDialog.showModal();
  }

  function startLevel(lvl, clearCauldron = false) {
    currentLevel = lvl;
    cyclePhase = "night";
    dayBlend = 0;
    dayShopOpenedInTransition = false;
    document.body.dataset.timeOfDay = "night";
    window.cozyAudio.setDaytime(false);

    if (dayShopStageEl && !dayShopStageEl.hidden) {
      dayShopStageEl.removeAttribute("data-closing");
      dayShopStageEl.hidden = true;
    }
    showElement(nextPreviewEl);
    showElement(timerPillEl);

    levelTimeRemaining = LEVEL_DURATION_SECONDS + nextLevelBonusSeconds;
    levelTotalDuration = levelTimeRemaining;
    nextLevelBonusSeconds = 0;
    lastWholeSecond = Math.ceil(levelTimeRemaining);

    levelOrdersCompleted = 0;
    levelOrdersTarget = getOrdersTargetForLevel(lvl);
    isGameOver = false;
    dangerTimer = 0;
    guestTransitionLock = false;
    stirState.modeActive = false;
    stirState.isDragging = false;
    stirState.trail = [];

    const minTier = getMinDropTierForLevel(lvl);

    if (clearCauldron) {
      items = [];
      particles = [];
      floatingTexts = [];
      flyingDeliveries = [];
      batAnim = null;
      bankedSpirits = { 1: 0, 2: 0 };
    } else {
      items.forEach((it) => {
        if (!it.isSpiritOrb && it.tier < minTier) {
          it.tier = minTier;
          it.r = window.INGREDIENT_TIERS[minTier].baseRadius * geom.scale;
          it.scaleX = 1.28;
          it.scaleY = 0.75;
          updateItemWorldCircles(it);
          spawnSparkles(it.x, it.y, "#ffd54f", 8);
        }
      });
    }

    currentTier = minTier;
    currentSpiritTier = 0;
    const picked = pickNextDrop();
    nextTier = picked.tier;
    nextSpiritTier = picked.spiritTier;

    renderNextPreview();
    currentGuestIndex++;
    loadGuest(currentGuestIndex);

    if (nextLevelStarterNeededCount > 0 && activeGuestOrder) {
      const openSlots = activeGuestOrder.slots.filter((s) => !s.done);
      for (let i = 0; i < nextLevelStarterNeededCount && i < openSlots.length; i++) {
        const slot = openSlots[i];
        const dropX = geom.cx + (i - 0.5) * 42;
        const dropY = geom.neckTopY + 18;
        if (slot.type === "spirit") {
          createItem(0, dropX, dropY, 0, 1.0, true, slot.spiritTier || 1);
        } else {
          createItem(slot.tier, dropX, dropY, 0, 1.2, true, 0);
        }
        spawnSparkles(dropX, dropY, "#ffd54f", 18);
      }
      nextLevelStarterNeededCount = 0;
    }

    updateTopPills();
  }

  function resetFullGame() {
    score = 0;
    coins = 10;
    greedLevel = 0;
    potions = { stir: 2, bat: 1 };
    nextLevelBonusSeconds = 0;
    nextLevelStarterNeededCount = 0;
    bankedSpirits = { 1: 0, 2: 0 };

    highestTierReached = 0;
    rescuedSpiritsTotal = 0;
    dropsSinceSpiritOrb = 0;
    comboCount = 0;
    currentGuestIndex = 0;

    startLevel(1, true);
  }

  // Main Render Loop
  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    const timeSec = now * 0.001;

    stepPhysics(dt);

    const ctx = renderer.ctx;
    ctx.save();
    ctx.scale(geom.dpr, geom.dpr);

    // 1. Generated Night/Day Workshop Background + Sunbeams + Garland lit by rescued spirits
    renderer.drawGreenhouseBackground(ctx, geom.w, geom.h, timeSec, rescuedSpiritsTotal, dayBlend);

    // 2. Cauldron & Ingredients (smoothly lowers and fades out when Daytime Shop opens in its place!)
    const cauldronAlpha = Math.max(0, 1 - dayBlend * 1.15);
    if (cauldronAlpha > 0.01) {
      const cauldronSlideY = dayBlend * dayBlend * (geom.h * 0.42);
      ctx.save();
      ctx.globalAlpha = cauldronAlpha;
      ctx.translate(0, cauldronSlideY);

      // Back of the Magical Cauldron & Ambient Bubbles
      renderer.drawCauldronBack(ctx, geom, timeSec, stirState.modeActive, dangerTimer);

      // Murchik the Cat Witch Assistant on the Rim
      renderer.drawCatAssistant(
        ctx,
        geom,
        catX,
        currentTier,
        currentSpiritTier,
        !isGameOver && cyclePhase === "night" && dropCooldown <= 0 && !stirState.modeActive,
        timeSec
      );

      // Ingredients & Spirits (Tier 1 & Tier 2) inside the Cauldron
      for (const it of items) {
        renderer.drawIngredient(ctx, it, timeSec);
      }

      // Big Wooden Witch's Stirring Spoon (Велика Мішалка) when stirring mode is active
      renderer.drawStirringSpoon(ctx, geom, stirState, timeSec);

      // Swooping Bat Helper if active
      renderer.drawBatHelper(ctx, batAnim, timeSec);

      // Glossy Front Glass Cauldron Reflections & Rim Lip
      renderer.drawCauldronFront(ctx, geom);

      ctx.restore();
    }

    // 3. Flying Deliveries
    for (const fd of flyingDeliveries) {
      renderer.drawIngredient(
        ctx,
        {
          tier: fd.tier,
          isSpiritOrb: fd.isSpiritOrb,
          spiritTier: fd.spiritTier || 1,
          x: fd.x,
          y: fd.y,
          r: fd.r,
          angle: 0,
          scaleX: 1,
          scaleY: 1
        },
        timeSec
      );
    }

    // 4. Sparkle Particles
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      renderer.drawStar4(ctx, p.x, p.y, p.size, p.color);
      ctx.restore();
    }

    // 5. Floating Score & Coin Popups
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `900 ${Math.round(14 * (ft.scale || 1))}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#260e3d";
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = "#ffe885";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(frame);
  }

  // Pointer (Mouse + Touch) Controls on Canvas
  let isPointerDown = false;

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (isGameOver || cyclePhase !== "night") return;
    window.cozyAudio.init();
    isPointerDown = true;
    canvas.setPointerCapture(e.pointerId);

    const pos = getCanvasCoords(e);

    if (stirState.modeActive) {
      stirState.isDragging = true;
      stirState.distanceMoved = 0;
      const clamped = clampPointToCauldronBowl(pos.x, pos.y);
      stirState.x = clamped.x;
      stirState.y = clamped.y;
      stirState.trail = [{ x: clamped.x, y: clamped.y }];
      return;
    }

    targetCatX = clampCatX(pos.x);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (isGameOver || cyclePhase !== "night") return;
    const pos = getCanvasCoords(e);

    if (stirState.modeActive) {
      if (stirState.isDragging) {
        applyStirSpoonImpulse(pos.x, pos.y);
      }
      return;
    }

    if (isPointerDown || e.pointerType === "mouse") {
      targetCatX = clampCatX(pos.x);
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (cyclePhase !== "night") return;

    if (stirState.modeActive) {
      if (stirState.isDragging && stirState.distanceMoved >= 16) {
        finishStirStroke();
      } else {
        stirState.isDragging = false;
      }
      return;
    }

    const pos = getCanvasCoords(e);
    targetCatX = clampCatX(pos.x);
    catX = targetCatX;
    dropCurrentItem();
  });

  canvas.addEventListener("pointercancel", () => {
    isPointerDown = false;
    stirState.isDragging = false;
  });

  // Keyboard Controls for PC
  window.addEventListener("keydown", (e) => {
    if (grimoireDialog.open || gameOverDialog.open) return;

    if (cyclePhase === "day_shop") {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        startNightTransitionToNextLevel();
      }
      return;
    }

    if (cyclePhase !== "night") return;

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" || e.key === "ф" || e.key === "Ф") {
      targetCatX = clampCatX(targetCatX - 22);
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.key === "в" || e.key === "В") {
      targetCatX = clampCatX(targetCatX + 22);
    } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      dropCurrentItem();
    } else if (e.key === "e" || e.key === "E" || e.key === "у" || e.key === "У") {
      serveReadyIngredients();
    } else if (e.key === "1") {
      toggleStirMode();
    } else if (e.key === "2") {
      useBatPotion();
    }
  });

  // UI Button Listeners
  btnServe.addEventListener("click", serveReadyIngredients);
  btnPotionStir.addEventListener("click", toggleStirMode);
  btnPotionBat.addEventListener("click", useBatPotion);

  btnBuyStir.addEventListener("click", buyShopStir);
  btnBuyBat.addEventListener("click", buyShopBat);
  btnBuyTime.addEventListener("click", buyShopTime);
  btnBuyNeeded.addEventListener("click", buyShopNeeded);
  btnBuyGreed.addEventListener("click", buyShopGreed);

  if (btnContinueToNight) {
    btnContinueToNight.addEventListener("click", startNightTransitionToNextLevel);
  }

  btnGrimoire.addEventListener("click", () => {
    window.cozyAudio.init();
    grimoireDialog.showModal();
  });

  btnSound.addEventListener("click", () => {
    const on = window.cozyAudio.toggle();
    btnSound.textContent = on ? "🔊" : "🔇";
  });

  btnRestart.addEventListener("click", () => {
    window.cozyAudio.init();
    resetFullGame();
  });

  btnNextOrRetry.addEventListener("click", () => {
    gameOverDialog.close();
    if (potions.stir < 1) potions.stir = 1;
    startLevel(currentLevel, true);
  });

  function applyEmbeddedUiAssets() {
    const urls = window.SPRITE_DATA_URLS;
    if (!urls) return;

    const rootStyle = document.documentElement.style;
    if (urls.ui_top_panel) {
      rootStyle.setProperty("--ui-top-panel", `url("${urls.ui_top_panel}")`);
    }
    if (urls.ui_guest_card) {
      rootStyle.setProperty("--ui-guest-card", `url("${urls.ui_guest_card}")`);
    }
    if (urls.ui_bottom_panel) {
      rootStyle.setProperty("--ui-bottom-panel", `url("${urls.ui_bottom_panel}")`);
    }

    const bindImg = (id, key) => {
      const el = document.getElementById(id);
      if (el && urls[key]) {
        el.src = urls[key];
      }
    };

    bindImg("imgSkillStir", "skill_stir");
    bindImg("imgSkillBat", "skill_bat");
    bindImg("imgSkillGrimoire", "skill_grimoire");
    bindImg("shopThumbStir", "skill_stir");
    bindImg("shopThumbBat", "skill_bat");
  }

  window.addEventListener("resize", resizeCanvas);

  // Initialize Game
  applyEmbeddedUiAssets();
  resizeCanvas();
  buildGrimoireCards();
  resetFullGame();
  requestAnimationFrame(frame);
})();

