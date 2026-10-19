// High-DPI 2D Canvas Renderer for Pumpkin Alchemy (20 Weighted Ingredients + 2 Spirit Tiers + Big Stirring Spoon)

const WEIGHT_PROFILES = {
  light: {
    id: "light",
    label: "🪶 Легкий",
    shortLabel: "🪶",
    gravityScale: 0.36,
    drag: 0.978,
    density: 0.32,
    flutter: 24,
    dropVy: 0.75,
    badgeColor: "#99f6ff"
  },
  medium: {
    id: "medium",
    label: "⚖️ Середній",
    shortLabel: "⚖️",
    gravityScale: 0.84,
    drag: 0.992,
    density: 1.0,
    flutter: 0,
    dropVy: 1.55,
    badgeColor: "#ffe596"
  },
  heavy: {
    id: "heavy",
    label: "🍎 Важкий",
    shortLabel: "🍎",
    gravityScale: 1.32,
    drag: 0.997,
    density: 2.9,
    flutter: 0,
    dropVy: 2.65,
    badgeColor: "#ffad66"
  },
  very_heavy: {
    id: "very_heavy",
    label: "🪨 Надважкий",
    shortLabel: "🪨",
    gravityScale: 1.68,
    drag: 0.9985,
    density: 6.2,
    flutter: 0,
    dropVy: 3.45,
    badgeColor: "#ff7a9e"
  }
};

const SPIRIT_TIERS = {
  1: {
    spiritTier: 1,
    name: "Дух-Світлячок",
    spriteKey: "spirit_orb",
    emoji: "👻",
    baseRadius: 25,
    weightClass: "light",
    score: 90
  },
  2: {
    spiritTier: 2,
    name: "Архідух Ліхтаря",
    spriteKey: "royal_spirit",
    emoji: "👑👻",
    baseRadius: 33,
    weightClass: "light",
    score: 260
  }
};

const INGREDIENT_TIERS = [
  {
    id: 0,
    name: "Крисячий Хвіст",
    spriteKey: "spooky_rat_tail",
    emoji: "🪱",
    baseRadius: 18,
    weightClass: "light",
    score: 12,
    primary: "#ff94b8",
    glow: "rgba(255, 148, 184, 0.42)"
  },
  {
    id: 1,
    name: "Кісточка Скелета",
    spriteKey: "spooky_bone",
    emoji: "🦴",
    baseRadius: 20,
    weightClass: "heavy",
    score: 18,
    primary: "#f5efe6",
    glow: "rgba(214, 178, 255, 0.42)"
  },
  {
    id: 2,
    name: "Сонний Жолудь",
    spriteKey: "tier0",
    emoji: "🌰",
    baseRadius: 22,
    weightClass: "medium",
    score: 26,
    primary: "#c98149",
    glow: "rgba(255, 189, 115, 0.4)"
  },
  {
    id: 3,
    name: "Око Зомбі",
    spriteKey: "spooky_zombie_eye",
    emoji: "👁️",
    baseRadius: 24,
    weightClass: "medium",
    score: 36,
    primary: "#9ef038",
    glow: "rgba(158, 240, 56, 0.5)"
  },
  {
    id: 4,
    name: "Лісовий Мухомор",
    spriteKey: "spooky_fly_agaric",
    emoji: "🍄",
    baseRadius: 27,
    weightClass: "medium",
    score: 48,
    primary: "#ff3d3d",
    glow: "rgba(255, 82, 82, 0.48)"
  },
  {
    id: 5,
    name: "Неоновий Грибочок",
    spriteKey: "tier1",
    emoji: "🔮",
    baseRadius: 30,
    weightClass: "light",
    score: 64,
    primary: "#52f2e2",
    glow: "rgba(82, 242, 226, 0.55)"
  },
  {
    id: 6,
    name: "Крило Кажана",
    spriteKey: "spooky_bat_wing",
    emoji: "🦇",
    baseRadius: 33,
    weightClass: "light",
    score: 82,
    primary: "#8f45ff",
    glow: "rgba(72, 240, 216, 0.52)"
  },
  {
    id: 7,
    name: "Павучок у Павутинці",
    spriteKey: "spooky_spider",
    emoji: "🕷️",
    baseRadius: 36,
    weightClass: "light",
    score: 105,
    primary: "#ff8c29",
    glow: "rgba(140, 255, 180, 0.48)"
  },
  {
    id: 8,
    name: "Ікло Вампіра",
    spriteKey: "spooky_fang",
    emoji: "🦷",
    baseRadius: 39,
    weightClass: "medium",
    score: 130,
    primary: "#fff0c9",
    glow: "rgba(255, 240, 200, 0.5)"
  },
  {
    id: 9,
    name: "Карамельне Яблучко",
    spriteKey: "tier2",
    emoji: "🍎",
    baseRadius: 42,
    weightClass: "heavy",
    score: 160,
    primary: "#e82c42",
    glow: "rgba(255, 198, 92, 0.55)"
  },
  {
    id: 10,
    name: "Корінь Мандрагори",
    spriteKey: "spooky_mandrake",
    emoji: "🌱",
    baseRadius: 45,
    weightClass: "medium",
    score: 195,
    primary: "#74e344",
    glow: "rgba(116, 227, 68, 0.5)"
  },
  {
    id: 11,
    name: "Гарбузик-Малюк",
    spriteKey: "tier3",
    emoji: "🎃",
    baseRadius: 48,
    weightClass: "medium",
    score: 235,
    primary: "#ff841f",
    glow: "rgba(255, 152, 56, 0.52)"
  },
  {
    id: 12,
    name: "Череп зі Свічкою",
    spriteKey: "spooky_candle_skull",
    emoji: "💀",
    baseRadius: 51,
    weightClass: "very_heavy",
    score: 285,
    primary: "#ffcf70",
    glow: "rgba(255, 190, 80, 0.6)"
  },
  {
    id: 13,
    name: "Ліхтар Джека",
    spriteKey: "tier4",
    emoji: "🔥",
    baseRadius: 54,
    weightClass: "heavy",
    score: 345,
    primary: "#ff7018",
    glow: "rgba(255, 224, 92, 0.68)"
  },
  {
    id: 14,
    name: "Смарагдова Отрута",
    spriteKey: "spooky_poison_vial",
    emoji: "🧪",
    baseRadius: 57,
    weightClass: "heavy",
    score: 420,
    primary: "#35ff69",
    glow: "rgba(53, 255, 105, 0.62)"
  },
  {
    id: 15,
    name: "Примарний Ліхтар",
    spriteKey: "tier5",
    emoji: "👻",
    baseRadius: 61,
    weightClass: "light",
    score: 510,
    primary: "#2cd9c7",
    glow: "rgba(92, 255, 238, 0.72)"
  },
  {
    id: 16,
    name: "Серце Дракона",
    spriteKey: "spooky_dragon_heart",
    emoji: "💜",
    baseRadius: 65,
    weightClass: "heavy",
    score: 620,
    primary: "#ff38b8",
    glow: "rgba(255, 72, 196, 0.72)"
  },
  {
    id: 17,
    name: "Відьомський Гарбуз",
    spriteKey: "tier6",
    emoji: "🧙‍♀️",
    baseRadius: 69,
    weightClass: "heavy",
    score: 760,
    primary: "#9b42ff",
    glow: "rgba(202, 118, 255, 0.76)"
  },
  {
    id: 18,
    name: "Філософський Камінь",
    spriteKey: "spooky_rune_stone",
    emoji: "💎",
    baseRadius: 74,
    weightClass: "very_heavy",
    score: 960,
    primary: "#c95cff",
    glow: "rgba(255, 185, 80, 0.85)"
  },
  {
    id: 19,
    name: "Король Гарбузів",
    spriteKey: "tier7",
    emoji: "👑",
    baseRadius: 80,
    weightClass: "very_heavy",
    score: 1400,
    primary: "#ffaa1c",
    glow: "rgba(255, 215, 75, 0.95)"
  }
];

window.WEIGHT_PROFILES = WEIGHT_PROFILES;
window.SPIRIT_TIERS = SPIRIT_TIERS;
window.INGREDIENT_TIERS = INGREDIENT_TIERS;

class CauldronRenderer {
  constructor(canvas, onSpritesReady) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sprites = {};
    this.loadAllSprites(onSpritesReady);
  }

  loadAllSprites(onReady) {
    const map = window.SPRITE_DATA_URLS || {};
    const keys = Object.keys(map);
    let remaining = keys.length;

    if (remaining === 0 && onReady) {
      onReady();
      return;
    }

    keys.forEach((key) => {
      const img = new Image();
      img.onload = () => {
        remaining--;
        if (remaining <= 0 && onReady) {
          onReady();
        }
      };
      img.src = map[key];
      this.sprites[key] = img;
    });
  }

  getSprite(key) {
    const img = this.sprites[key];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }

  // Draw the generated Halloween Night & Sunny Daytime workshop background + animated sunbeams + spirit garland
  drawGreenhouseBackground(ctx, w, h, time, rescuedSpirits = 0, dayBlend = 0) {
    const clampedDay = Math.max(0, Math.min(1, dayBlend));
    const nightSprite = this.getSprite("halloween_bg");
    const daySprite = this.getSprite("halloween_bg_day");
    const refSprite = nightSprite || daySprite;

    if (refSprite) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const imgAspect = refSprite.naturalWidth / refSprite.naturalHeight;
      const canvasAspect = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasAspect > imgAspect) {
        drawW = w;
        drawH = w / imgAspect;
        offsetY = (h - drawH) * 0.35;
      } else {
        drawH = h;
        drawW = h * imgAspect;
        offsetX = (w - drawW) * 0.5;
      }

      if (nightSprite && clampedDay < 1) {
        ctx.globalAlpha = 1;
        ctx.drawImage(nightSprite, offsetX, offsetY, drawW, drawH);
      }

      if (daySprite && clampedDay > 0) {
        ctx.globalAlpha = clampedDay;
        ctx.drawImage(daySprite, offsetX, offsetY, drawW, drawH);
      }

      ctx.globalAlpha = 1;

      // Animated golden morning sunbeams & floating sunlit motes when daytime is active or transitioning
      if (clampedDay > 0.01) {
        const winX = w * 0.5;
        const winY = offsetY + drawH * 0.25;

        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // 3 swaying golden light shafts streaming from the Gothic window
        for (let b = -1; b <= 1; b++) {
          const sway = Math.sin(time * 0.9 + b * 1.4) * (w * 0.04);
          const topSpread = w * 0.09;
          const botSpread = w * 0.26;
          const targetX = winX + b * (w * 0.16) + sway;

          const beamGrad = ctx.createLinearGradient(winX, winY, targetX, h * 0.92);
          beamGrad.addColorStop(0, `rgba(255, 244, 185, ${0.28 * clampedDay})`);
          beamGrad.addColorStop(0.55, `rgba(255, 210, 115, ${0.14 * clampedDay})`);
          beamGrad.addColorStop(1, "rgba(255, 190, 90, 0)");

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(winX - topSpread + b * 14, winY);
          ctx.lineTo(winX + topSpread + b * 14, winY);
          ctx.lineTo(targetX + botSpread, h * 0.95);
          ctx.lineTo(targetX - botSpread, h * 0.95);
          ctx.closePath();
          ctx.fill();
        }

        // Sunrise / Sunset golden horizon bloom during the transition itself
        const transBloom = Math.sin(clampedDay * Math.PI);
        if (transBloom > 0.02) {
          const sunFlare = ctx.createRadialGradient(winX, winY, 8, winX, winY, h * 0.65);
          sunFlare.addColorStop(0, `rgba(255, 245, 190, ${0.55 * transBloom})`);
          sunFlare.addColorStop(0.45, `rgba(255, 176, 76, ${0.28 * transBloom})`);
          sunFlare.addColorStop(1, "rgba(255, 140, 40, 0)");
          ctx.fillStyle = sunFlare;
          ctx.fillRect(0, 0, w, h);
        }

        // Floating golden dust motes in the sunlight
        for (let m = 0; m < 14; m++) {
          const mx =
            w * (0.2 + ((m * 37) % 60) * 0.01) +
            Math.sin(time * 0.8 + m * 1.7) * 16;
          const my =
            h * (0.16 + (((m * 53 + time * 12) % 70) * 0.01));
          const mr = 1.6 + (m % 3) * 0.9;
          const mAlpha =
            clampedDay * (0.35 + 0.35 * Math.sin(time * 2.4 + m * 1.9));
          ctx.fillStyle = `rgba(255, 242, 175, ${mAlpha})`;
          ctx.beginPath();
          ctx.arc(mx, my, mr, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Vignette (deep magical purple at night, warm cozy amber-gold in daytime)
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.55, w * 0.18, w * 0.5, h * 0.55, h * 0.72);
      const nightV0 = 0.18 * (1 - clampedDay);
      const nightV1 = 0.38 * (1 - clampedDay * 0.65);
      vig.addColorStop(0, `rgba(18, 8, 34, ${nightV0.toFixed(3)})`);
      vig.addColorStop(1, `rgba(24, 12, 18, ${nightV1.toFixed(3)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, clampedDay > 0.5 ? "#5998d6" : "#1d1136");
      bgGrad.addColorStop(1, clampedDay > 0.5 ? "#4a3321" : "#221226");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Hanging Festival Spirit Garland across the top
    ctx.save();
    ctx.globalAlpha = 1 - clampedDay * 0.45;
    const bulbCount = 8;
    for (let i = 1; i <= bulbCount; i++) {
      const t = i / (bulbCount + 1);
      const bx = w * t;
      const by = h * 0.04 + Math.sin(t * Math.PI * 1.6) * (h * 0.035);
      const isSpiritLit = i <= rescuedSpirits;
      const pulse = 0.85 + 0.15 * Math.sin(time * 3.5 + i);

      const radius = (isSpiritLit ? 19 : 10) * pulse;
      const glow = ctx.createRadialGradient(bx, by, 1, bx, by, radius);
      if (isSpiritLit) {
        glow.addColorStop(0, "rgba(210, 255, 250, 0.98)");
        glow.addColorStop(0.45, "rgba(72, 240, 216, 0.65)");
        glow.addColorStop(1, "rgba(72, 240, 216, 0)");
      } else {
        glow.addColorStop(0, "rgba(255, 228, 155, 0.7)");
        glow.addColorStop(1, "rgba(255, 140, 24, 0)");
      }
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw the back of the cauldron
  drawCauldronBack(ctx, geom, time, stirActive, dangerRatio) {
    const { cx, cy, R, neckTopY, neckHalfW, rimOpenHalfW } = geom;

    ctx.save();

    // Warm magical aura beneath cauldron
    const underGlow = ctx.createRadialGradient(cx, cy + R * 0.82, R * 0.1, cx, cy + R * 0.85, R * 0.95);
    underGlow.addColorStop(0, "rgba(255, 178, 68, 0.55)");
    underGlow.addColorStop(0.55, "rgba(176, 68, 255, 0.25)");
    underGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = underGlow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.92, R * 0.88, R * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute curved bronze cauldron feet
    ctx.fillStyle = "#7c4724";
    ctx.strokeStyle = "#331809";
    ctx.lineWidth = 3;
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      const fx = cx + dir * R * 0.58;
      const fy = cy + R * 0.82;
      ctx.moveTo(fx - dir * 18, fy - 10);
      ctx.quadraticCurveTo(fx + dir * 18, fy + 26, fx + dir * 4, fy + 32);
      ctx.quadraticCurveTo(fx - dir * 14, fy + 32, fx - dir * 22, fy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Decorative side handles
    [-1, 1].forEach((dir) => {
      const hx = cx + dir * (neckHalfW + 8);
      const hy = neckTopY + 26;
      ctx.strokeStyle = "#361909";
      ctx.lineWidth = 11;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        hx + dir * 10,
        hy + 8,
        16,
        dir > 0 ? -Math.PI * 0.7 : -Math.PI * 0.3,
        dir > 0 ? Math.PI * 0.85 : Math.PI * 0.15,
        dir < 0
      );
      ctx.stroke();

      ctx.strokeStyle = "#b56c37";
      ctx.lineWidth = 6;
      ctx.stroke();
    });

    this.traceCauldronBodyPath(ctx, geom);

    const glassGrad = ctx.createRadialGradient(cx, cy - R * 0.15, R * 0.12, cx, cy, R * 1.04);
    if (stirActive) {
      glassGrad.addColorStop(0, "rgba(172, 82, 255, 0.54)");
      glassGrad.addColorStop(0.65, "rgba(62, 224, 210, 0.48)");
      glassGrad.addColorStop(1, "rgba(255, 220, 130, 0.78)");
    } else {
      glassGrad.addColorStop(0, "rgba(24, 18, 48, 0.68)");
      glassGrad.addColorStop(0.68, "rgba(38, 128, 142, 0.46)");
      glassGrad.addColorStop(0.92, "rgba(86, 225, 208, 0.55)");
      glassGrad.addColorStop(1, "rgba(255, 226, 156, 0.75)");
    }
    ctx.fillStyle = glassGrad;
    ctx.fill();

    ctx.save();
    ctx.clip();

    const bubbleCount = stirActive ? 18 : 8;
    for (let i = 0; i < bubbleCount; i++) {
      const speed = stirActive ? 1.8 : 0.55;
      const prog = (time * speed + i * 0.37) % 1;
      const angleSpread = ((i * 53) % 100) / 100 - 0.5;
      const bx = cx + angleSpread * R * 1.35 * Math.sin(prog * Math.PI);
      const by = cy + R * 0.88 - prog * (R * 1.65);
      const br = 2.5 + (i % 4) * 1.6;

      ctx.fillStyle = stirActive
        ? `rgba(242, 165, 255, ${(1 - prog) * 0.65})`
        : `rgba(145, 255, 238, ${(1 - prog) * 0.35})`;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    const limitY = geom.dangerY;
    const dangerAlpha = Math.max(0.22, Math.min(0.9, 0.25 + dangerRatio * 0.75));
    ctx.strokeStyle =
      dangerRatio > 0.3
        ? `rgba(255, 92, 118, ${dangerAlpha})`
        : `rgba(255, 214, 130, ${dangerAlpha})`;
    ctx.lineWidth = dangerRatio > 0.3 ? 2.5 : 1.5;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.85, limitY);
    ctx.lineTo(cx + R * 0.85, limitY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    const rimGrad = ctx.createLinearGradient(cx - rimOpenHalfW, neckTopY, cx + rimOpenHalfW, neckTopY);
    rimGrad.addColorStop(0, "#6e3b1b");
    rimGrad.addColorStop(0.5, "#b86b35");
    rimGrad.addColorStop(1, "#6e3b1b");

    ctx.fillStyle = rimGrad;
    ctx.strokeStyle = "#361808";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, neckTopY, rimOpenHalfW + 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1c132b";
    ctx.beginPath();
    ctx.ellipse(cx, neckTopY + 1, rimOpenHalfW - 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  traceCauldronBodyPath(ctx, geom) {
    const { cx, cy, R, neckAngle } = geom;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -neckAngle, Math.PI + neckAngle, false);
    ctx.closePath();
  }

  // Draw the glossy front glass reflections & front lip of the cauldron
  drawCauldronFront(ctx, geom) {
    const { cx, cy, R, neckTopY, rimOpenHalfW } = geom;
    ctx.save();

    this.traceCauldronBodyPath(ctx, geom);
    ctx.strokeStyle = "rgba(185, 255, 240, 0.65)";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(64, 30, 14, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.87, Math.PI * 0.66, Math.PI * 1.12, false);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 210, 135, 0.24)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.88, -Math.PI * 0.12, Math.PI * 0.28, false);
    ctx.stroke();

    const frontRimGrad = ctx.createLinearGradient(0, neckTopY - 6, 0, neckTopY + 18);
    frontRimGrad.addColorStop(0, "#d48548");
    frontRimGrad.addColorStop(0.55, "#9c5525");
    frontRimGrad.addColorStop(1, "#4d240b");

    ctx.strokeStyle = "#361808";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(cx, neckTopY, rimOpenHalfW + 8, 13, 0, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.stroke();

    ctx.strokeStyle = frontRimGrad;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(cx, neckTopY, rimOpenHalfW + 8, 13, 0, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Murchik the Black Cat Witch Assistant using generated sprite + held item + weight badge
  drawCatAssistant(ctx, geom, catX, pendingTier, pendingSpiritTier, canDrop, time) {
    const { neckTopY, cy, R } = geom;
    const catY = neckTopY - 36 * geom.scale;
    const tier = INGREDIENT_TIERS[pendingTier];

    ctx.save();

    if (canDrop) {
      ctx.save();
      ctx.strokeStyle = pendingSpiritTier
        ? "rgba(115, 255, 240, 0.75)"
        : "rgba(255, 232, 162, 0.62)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.moveTo(catX, neckTopY - 4);
      ctx.lineTo(catX, cy + R * 0.55);
      ctx.stroke();
      ctx.restore();
    }

    const catSprite = this.getSprite("cat_murchik");
    const catSize = 72 * geom.scale;
    const bobY = Math.sin(time * 3.2) * 2.2;

    if (catSprite) {
      ctx.save();
      ctx.translate(catX, catY + bobY);
      ctx.rotate(Math.sin(time * 2.2) * 0.03);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(catSprite, -catSize * 0.5, -catSize * 0.5, catSize, catSize);
      ctx.restore();
    }

    if (canDrop) {
      const holdY = neckTopY - 2;
      if (pendingSpiritTier) {
        const spInfo = SPIRIT_TIERS[pendingSpiritTier] || SPIRIT_TIERS[1];
        this.drawIngredient(
          ctx,
          {
            isSpiritOrb: true,
            spiritTier: pendingSpiritTier,
            tier: 0,
            x: catX,
            y: holdY,
            r: spInfo.baseRadius * geom.scale,
            angle: 0,
            scaleX: 1,
            scaleY: 1
          },
          time
        );
      } else if (tier) {
        this.drawIngredient(
          ctx,
          {
            tier: pendingTier,
            isSpiritOrb: false,
            x: catX,
            y: holdY,
            r: tier.baseRadius * geom.scale,
            angle: Math.sin(time * 2.5) * 0.05,
            scaleX: 1,
            scaleY: 1
          },
          time
        );
      }
    }

    ctx.restore();
  }

  // Draw any of the 20 Halloween Ingredient Tiers OR Spirit Tier 1 / Spirit Tier 2 in its NATURAL silhouette
  drawIngredient(ctx, item, time = 0) {
    const r = item.r;

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle || 0);
    ctx.scale(item.scaleX || 1, item.scaleY || 1);

    const tierInfo = INGREDIENT_TIERS[item.tier] || INGREDIENT_TIERS[0];
    let spriteKey = tierInfo.spriteKey;

    if (item.isSpiritOrb) {
      spriteKey = item.spiritTier === 2 ? "royal_spirit" : "spirit_orb";
    }

    // Soft ambient glow behind the natural shape of the item
    if (item.isNeededByGuest) {
      const pulse = 1.18 + 0.12 * Math.sin(time * 6);
      const reqGlow = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * pulse * 1.32);
      reqGlow.addColorStop(0, "rgba(255, 232, 95, 0.9)");
      reqGlow.addColorStop(0.6, "rgba(72, 240, 216, 0.45)");
      reqGlow.addColorStop(1, "rgba(255, 200, 40, 0)");
      ctx.fillStyle = reqGlow;
      ctx.beginPath();
      ctx.arc(0, 0, r * pulse * 1.32, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.isSpiritOrb) {
      const aura = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 1.38);
      if (item.spiritTier === 2) {
        aura.addColorStop(0, "rgba(255, 235, 120, 0.88)");
        aura.addColorStop(0.55, "rgba(218, 92, 255, 0.55)");
        aura.addColorStop(1, "rgba(72, 240, 216, 0)");
      } else {
        aura.addColorStop(0, "rgba(120, 255, 245, 0.72)");
        aura.addColorStop(1, "rgba(175, 95, 255, 0)");
      }
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const aura = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.18);
      aura.addColorStop(0, tierInfo.glow);
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
      ctx.fill();
    }

    const sprite = this.getSprite(spriteKey);
    if (sprite) {
      const drawSize = r * 2.22;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);
    } else {
      ctx.fillStyle = tierInfo.primary;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Draw upright "★ У ЗІЛЛЯ" tag above needed ingredient
    if (item.isNeededByGuest) {
      ctx.save();
      const bob = Math.sin(time * 5) * 3;
      ctx.translate(item.x, item.y - r - 9 + bob);
      ctx.fillStyle = "rgba(38, 16, 66, 0.92)";
      ctx.strokeStyle = "#ffd954";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-29, -8, 58, 15, 7);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffec8b";
      ctx.font = '900 9px "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ У ЗІЛЛЯ", 0, 0);
      ctx.restore();
    }
  }

  // Draw the Big Wooden Witch's Stirring Spoon (Велика Мішалка) when stirring mode is active
  drawStirringSpoon(ctx, geom, stirState, time) {
    if (!stirState || !stirState.modeActive) return;

    const { cx, cy, R, neckTopY, scale } = geom;

    ctx.save();

    // 1. Draw glowing swirl trail left by the spoon inside the cauldron
    if (stirState.trail && stirState.trail.length > 1) {
      for (let i = 1; i < stirState.trail.length; i++) {
        const p0 = stirState.trail[i - 1];
        const p1 = stirState.trail[i];
        const alpha = (i / stirState.trail.length) * 0.7;
        ctx.strokeStyle = `rgba(110, 255, 236, ${alpha})`;
        ctx.lineWidth = (8 + (i / stirState.trail.length) * 18) * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }

    // 2. If not dragging yet, draw an animated swipe guide arc inside the cauldron
    if (!stirState.isDragging) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 230, 128, 0.78)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy + R * 0.1, R * 0.55, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
      ctx.setLineDash([]);

      // Prompt pill at top of cauldron
      ctx.fillStyle = "rgba(34, 14, 58, 0.92)";
      ctx.strokeStyle = "#ffd86b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 122, neckTopY - 46, 244, 28, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff1b8";
      ctx.font = '900 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥄 Проведи мішалкою всередині казана!", cx, neckTopY - 32);
      ctx.restore();
    }

    // 3. Draw the Big Carved Witch's Wooden Paddle / Spoon at (spoonX, spoonY)
    const sx = stirState.isDragging
      ? stirState.x
      : cx + Math.sin(time * 2.6) * (R * 0.42);
    const sy = stirState.isDragging
      ? stirState.y
      : cy + Math.cos(time * 2.6) * (R * 0.18);

    // Tilt angle anchored toward a pivot high above the cauldron
    const pivotX = cx + (sx - cx) * 0.25;
    const pivotY = neckTopY - 150 * scale;
    const angle = Math.atan2(sy - pivotY, sx - pivotX) - Math.PI * 0.5;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    // Magical ripple aura around the submerged spoon bowl
    const bowlGlow = ctx.createRadialGradient(0, 0, 6 * scale, 0, 0, 44 * scale);
    bowlGlow.addColorStop(0, "rgba(130, 255, 240, 0.75)");
    bowlGlow.addColorStop(0.6, "rgba(195, 92, 255, 0.35)");
    bowlGlow.addColorStop(1, "rgba(195, 92, 255, 0)");
    ctx.fillStyle = bowlGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 44 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Long wooden handle extending upward
    const handleLen = 210 * scale;
    const handleW = 13 * scale;
    const woodGrad = ctx.createLinearGradient(-handleW, 0, handleW, 0);
    woodGrad.addColorStop(0, "#592c12");
    woodGrad.addColorStop(0.45, "#b86b35");
    woodGrad.addColorStop(1, "#3d1c08");

    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = "#291003";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(-handleW * 0.5, -handleLen, handleW, handleLen, 6 * scale);
    ctx.fill();
    ctx.stroke();

    // Decorative gold band on the handle
    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(-handleW * 0.55, -48 * scale, handleW * 1.1, 7 * scale);

    // Wide carved wooden stirring paddle/bowl at (0, 0)
    const bowlRx = 26 * scale;
    const bowlRy = 34 * scale;
    ctx.fillStyle = woodGrad;
    ctx.strokeStyle = "#291003";
    ctx.lineWidth = 3.2 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, bowlRx, bowlRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner hollow of the wooden spoon with glowing potion swirl
    const innerGrad = ctx.createRadialGradient(-4 * scale, 0, 2 * scale, 0, 4 * scale, bowlRx * 0.8);
    innerGrad.addColorStop(0, "#7dffef");
    innerGrad.addColorStop(0.55, "#9c3dff");
    innerGrad.addColorStop(1, "#4a200c");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(0, 5 * scale, bowlRx * 0.68, bowlRy * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  drawStar4(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBatHelper(ctx, batAnim, time) {
    if (!batAnim) return;
    const { x, y } = batAnim;
    const flapScaleY = 1 + Math.sin(time * 26) * 0.14;
    const flapScaleX = 1 - Math.sin(time * 26) * 0.08;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flapScaleX, flapScaleY);

    const batSprite = this.getSprite("cute_bat");
    if (batSprite) {
      const size = 68;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(batSprite, -size * 0.5, -size * 0.5, size, size);
    }
    ctx.restore();
  }

  drawGuestAvatar(ctx, kind) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const sprite = this.getSprite(`guest_${kind}`);
    if (sprite) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const pad = 2;
      ctx.drawImage(sprite, pad, pad, w - pad * 2, h - pad * 2);
      ctx.restore();
    }
  }
}

window.CauldronRenderer = CauldronRenderer;
