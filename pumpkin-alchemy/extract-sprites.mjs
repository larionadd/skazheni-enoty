import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BRAIN_DIR = "C:/Users/vanil/.gemini/antigravity/brain/e1cc90b4-2a01-4ee0-9926-20689777736d";
const OUT_DIR = "e:/gravaty/pumpkin-alchemy/assets/sprites";
mkdirSync(OUT_DIR, { recursive: true });

const SHEETS = [
  {
    file: "sprites_tiers_1_to_4_1792438160149.jpg",
    quadrants: ["tier0", "tier1", "tier2", "tier3"]
  },
  {
    file: "sprites_tiers_5_to_8_1792438169333.jpg",
    quadrants: ["tier4", "tier5", "tier6", "tier7"]
  },
  {
    file: "sprites_tier9_and_specials_1792438179144.jpg",
    quadrants: ["tier8", "spirit_orb", "cat_murchik", "cute_bat"]
  },
  {
    file: "sprites_spooky_1_to_4_1792439713979.jpg",
    quadrants: ["spooky_rat_tail", "spooky_bone", "spooky_zombie_eye", "spooky_fly_agaric"]
  },
  {
    file: "sprites_spooky_5_to_8_1792439723936.jpg",
    quadrants: ["spooky_bat_wing", "spooky_spider", "spooky_fang", "spooky_mandrake"]
  },
  {
    file: "sprites_spooky_9_to_11_1792439732889.jpg",
    quadrants: ["spooky_candle_skull", "spooky_dragon_heart", "spooky_rune_stone", "spooky_poison_vial"]
  },
  {
    file: "sprites_guests_1_to_4_1792438206381.jpg",
    quadrants: ["guest_ghost", "guest_wolf", "guest_witch", "guest_skeleton"]
  },
  {
    file: "sprites_guests_5_to_8_1792438217160.jpg",
    quadrants: ["guest_owl", "guest_vampire", "guest_knight", "guest_king"]
  }
];

function isBackgroundCandidate(r, g, b) {
  const minC = Math.min(r, g, b);
  const maxC = Math.max(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const sat = maxC - minC;
  if (minC >= 225) return true;
  if (lum >= 230 && sat <= 42) return true;
  return false;
}

// Clear enclosed pure-white background holes (e.g. inside spiderweb triangles or tail loops)
function clearEnclosedWhiteHoles(data, w, h, name) {
  if (name !== "spooky_spider" && name !== "spooky_zombie_eye" && name !== "spooky_rat_tail") {
    return;
  }
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    if (visited[i] || data[i * 4 + 3] === 0) continue;
    const p = i * 4;
    if (!isBackgroundCandidate(data[p], data[p + 1], data[p + 2])) continue;

    let head = 0;
    let tail = 0;
    visited[i] = 1;
    queue[tail++] = i;

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = (curr / w) | 0;
      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < w - 1 ? curr + 1 : -1,
        cy > 0 ? curr - w : -1,
        cy < h - 1 ? curr + w : -1
      ];
      for (const n of neighbors) {
        if (n !== -1 && !visited[n] && data[n * 4 + 3] > 0) {
          const np = n * 4;
          if (isBackgroundCandidate(data[np], data[np + 1], data[np + 2])) {
            visited[n] = 1;
            queue[tail++] = n;
          }
        }
      }
    }

    // If this enclosed white region is larger than an eye highlight (> 90 px), clear it as a background hole
    if (tail > 90) {
      for (let k = 0; k < tail; k++) {
        data[queue[k] * 4 + 3] = 0;
      }
    }
  }
}

// Remove floating disconnected sparkles/dots (e.g., purple stars around spooky_bone)
function removeDisconnectedFloatingBits(data, w, h) {
  const labels = new Int32Array(w * h);
  const compSizes = [0];
  let currentLabel = 0;
  const queue = new Int32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    if (labels[i] !== 0 || data[i * 4 + 3] <= 35) continue;
    currentLabel++;
    let head = 0;
    let tail = 0;
    labels[i] = currentLabel;
    queue[tail++] = i;
    let size = 0;

    while (head < tail) {
      const curr = queue[head++];
      size++;
      const cx = curr % w;
      const cy = (curr / w) | 0;

      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < w - 1 ? curr + 1 : -1,
        cy > 0 ? curr - w : -1,
        cy < h - 1 ? curr + w : -1
      ];
      for (const n of neighbors) {
        if (n !== -1 && labels[n] === 0 && data[n * 4 + 3] > 35) {
          labels[n] = currentLabel;
          queue[tail++] = n;
        }
      }
    }
    compSizes[currentLabel] = size;
  }

  const maxCompSize = Math.max(0, ...compSizes);
  if (maxCompSize === 0) return;

  const minKeepSize = maxCompSize * 0.12;
  for (let i = 0; i < w * h; i++) {
    const lbl = labels[i];
    if (lbl > 0 && compSizes[lbl] < minKeepSize) {
      data[i * 4 + 3] = 0;
    }
  }
}

// Build a multi-circle compound collider fitted tightly to the opaque pixels of the 256x256 sprite
async function buildCompoundColliders(webpBuf, name = "") {
  const { data } = await sharp(webpBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const GRID = 64;
  const STEP = 256 / GRID; // 4px per cell
  // In renderer.js: drawSize = r * 2.22 => half-width of 256px image is 1.11 * r
  const CELL_TO_R = (STEP / 128) * 1.11;

  const inside = new Uint8Array(GRID * GRID);
  const insideCells = [];

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let solidCount = 0;
      for (let py = 0; py < STEP; py++) {
        for (let px = 0; px < STEP; px++) {
          const ix = gx * STEP + px;
          const iy = gy * STEP + py;
          const p = (iy * 256 + ix) * 4;
          const a = data[p + 3];
          if (a < 110) continue;

          // For spooky_spider: ignore the pale silver outer web threads so the physical hitbox matches the spider body & legs!
          if (name === "spooky_spider") {
            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const sat = maxC - minC;
            const lum = (r + g + b) / 3;
            // Silver web threads have low saturation and medium-high luminance
            if (sat < 48 && lum > 95) continue;
            // Also ignore outer web tips far from center
            const distFromCenter = Math.hypot(ix - 128, iy - 134);
            if (distFromCenter > 88) continue;
          }

          solidCount++;
        }
      }
      if (solidCount >= 7) {
        inside[gy * GRID + gx] = 1;
        insideCells.push([gx, gy]);
      }
    }
  }

  if (insideCells.length === 0) {
    return [{ ox: 0, oy: 0, r: 0.85 }];
  }

  // Compute exact Euclidean distance from each inside cell to the nearest outside cell
  const distToEdge = new Float32Array(GRID * GRID);
  for (const [gx, gy] of insideCells) {
    let minD2 = Infinity;
    for (let oy = -1; oy <= GRID; oy++) {
      for (let ox = -1; ox <= GRID; ox++) {
        const isOut =
          ox < 0 || ox >= GRID || oy < 0 || oy >= GRID || inside[oy * GRID + ox] === 0;
        if (isOut) {
          const d2 = (gx - ox) * (gx - ox) + (gy - oy) * (gy - oy);
          if (d2 < minD2) minD2 = d2;
        }
      }
    }
    // Keep circle strictly inside the visual silhouette (subtract 0.45 cell)
    distToEdge[gy * GRID + gx] = Math.max(0.75, Math.sqrt(minD2) - 0.45);
  }

  const covered = new Uint8Array(GRID * GRID);
  const colliders = [];
  const MAX_CIRCLES = 16;

  for (let k = 0; k < MAX_CIRCLES; k++) {
    let bestCell = null;
    let bestScore = 0;

    for (const [gx, gy] of insideCells) {
      const rad = distToEdge[gy * GRID + gx];
      const radSq = (rad + 0.15) * (rad + 0.15);
      let score = 0;

      for (const [tx, ty] of insideCells) {
        if (covered[ty * GRID + tx]) continue;
        const d2 = (gx - tx) * (gx - tx) + (gy - ty) * (gy - ty);
        if (d2 <= radSq) {
          const isBoundary = distToEdge[ty * GRID + tx] <= 2.2;
          score += isBoundary ? 1.8 : 1.0;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCell = [gx, gy, rad];
      }
    }

    if (!bestCell || bestScore < 1.8) break;

    const [bx, by, brad] = bestCell;
    // Mark only cells truly inside brad as covered so there are no gaps between circles
    const coverRadSq = (brad + 0.1) * (brad + 0.1);
    for (const [tx, ty] of insideCells) {
      const d2 = (bx - tx) * (bx - tx) + (by - ty) * (by - ty);
      if (d2 <= coverRadSq) {
        covered[ty * GRID + tx] = 1;
      }
    }

    const ox = Number((((bx + 0.5 - GRID * 0.5) / (GRID * 0.5)) * 1.11).toFixed(3));
    const oy = Number((((by + 0.5 - GRID * 0.5) / (GRID * 0.5)) * 1.11).toFixed(3));
    const rNorm = Number(Math.max(0.075, brad * CELL_TO_R).toFixed(3));
    colliders.push({ ox, oy, r: rNorm });

    let totalCovered = 0;
    for (const [tx, ty] of insideCells) {
      if (covered[ty * GRID + tx]) totalCovered++;
    }
    if (totalCovered / insideCells.length >= 0.97) break;
  }

  return colliders.length > 0 ? colliders : [{ ox: 0, oy: 0, r: 0.85 }];
}

async function processQuadrant(sheetPath, qIndex, name) {
  const meta = await sharp(sheetPath).metadata();
  const halfW = Math.floor(meta.width / 2);
  const halfH = Math.floor(meta.height / 2);

  const col = qIndex % 2;
  const row = Math.floor(qIndex / 2);

  const { data, info } = await sharp(sheetPath)
    .extract({
      left: col * halfW,
      top: row * halfH,
      width: halfW,
      height: halfH
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const pushIfBg = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const p = idx * 4;
    if (isBackgroundCandidate(data[p], data[p + 1], data[p + 2])) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIfBg(0, y);
    pushIfBg(w - 1, y);
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = (curr / w) | 0;

    pushIfBg(cx - 1, cy);
    pushIfBg(cx + 1, cy);
    pushIfBg(cx, cy - 1);
    pushIfBg(cx, cy + 1);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const p = idx * 4;
      if (visited[idx]) {
        data[p + 3] = 0;
      } else {
        let bgNeighbors = 0;
        if (x > 0 && visited[idx - 1]) bgNeighbors++;
        if (x < w - 1 && visited[idx + 1]) bgNeighbors++;
        if (y > 0 && visited[idx - w]) bgNeighbors++;
        if (y < h - 1 && visited[idx + w]) bgNeighbors++;

        if (bgNeighbors > 0) {
          const lum = (data[p] + data[p + 1] + data[p + 2]) / 3;
          if (lum > 200) {
            data[p + 3] = Math.round(data[p + 3] * 0.35);
          } else if (lum > 150) {
            data[p + 3] = Math.round(data[p + 3] * 0.78);
          }
        }
      }
    }
  }

  // Clear enclosed pure-white background holes (e.g. inside spiderweb cells)
  clearEnclosedWhiteHoles(data, w, h, name);

  // Special cleanup for spooky_spider: remove the oversized silver spiderweb threads so the spider itself is the sprite and hitbox!
  if (name === "spooky_spider") {
    const cx0 = w * 0.5;
    const cy0 = h * 0.52;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (data[p + 3] === 0) continue;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC - minC;
        const lum = (r + g + b) / 3;
        const dist = Math.hypot(x - cx0, y - cy0);

        // Silver/slate web threads have low color saturation and cool blue-grey tint (b >= r), whereas the spider is warm orange/brown/green
        const isCoolGreyWeb =
          (sat < 46 && lum > 88) ||
          (dist > w * 0.15 && b >= r && g <= b + 8 && sat < 46);

        if (dist > w * 0.305 || isCoolGreyWeb) {
          data[p + 3] = 0;
        }
      }
    }
  }

  // Strip disconnected floating sparkles/stars (such as the purple stars around spooky_bone or leftover web tips)
  removeDisconnectedFloatingBits(data, w, h);

  let minX = w,
    minY = h,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Special cleanup for spooky_fang: remove the hanging blood droplet below the fang tip and clean red blood tint
  if (name === "spooky_fang") {
    const startSearchY = Math.floor(minY + (maxY - minY) * 0.62);
    const endSearchY = Math.floor(minY + (maxY - minY) * 0.78);
    let pinchY = Math.floor(minY + (maxY - minY) * 0.71);
    let minRowCount = Infinity;

    for (let y = startSearchY; y <= endSearchY; y++) {
      let count = 0;
      for (let x = minX; x <= maxX; x++) {
        if (data[(y * w + x) * 4 + 3] > 90) count++;
      }
      if (count > 0 && count < minRowCount) {
        minRowCount = count;
        pinchY = y;
      }
    }

    for (let y = pinchY - 2; y < h; y++) {
      for (let x = 0; x < w; x++) {
        data[(y * w + x) * 4 + 3] = 0;
      }
    }

    for (let y = minY; y < pinchY - 2; y++) {
      for (let x = minX; x <= maxX; x++) {
        const p = (y * w + x) * 4;
        if (data[p + 3] <= 20) continue;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const redness = r - Math.max(g, b);
        if (redness > 22) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < 95) {
            data[p] = 53;
            data[p + 1] = 29;
            data[p + 2] = 26;
          } else {
            const t = Math.min(1, redness / 110);
            const targetR = Math.min(252, lum + 38);
            const targetG = Math.min(240, lum + 24);
            const targetB = Math.min(210, lum - 2);
            data[p] = Math.round(r * (1 - t) + targetR * t);
            data[p + 1] = Math.round(g * (1 - t) + targetG * t);
            data[p + 2] = Math.round(b * (1 - t) + targetB * t);
          }
        }
      }
    }

    minX = w;
    minY = h;
    maxX = 0;
    maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  const croppedBuf = await sharp(data, {
    raw: { width: w, height: h, channels: 4 }
  })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize(244, 244, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 6,
      bottom: 6,
      left: 6,
      right: 6,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90, alphaQuality: 95 })
    .toBuffer();

  const outPath = path.join(OUT_DIR, `${name}.webp`);
  writeFileSync(outPath, croppedBuf);
  const colliders = await buildCompoundColliders(croppedBuf, name);
  console.log(`Saved ${name}.webp (${cropW}x${cropH} -> ${colliders.length} hitbox circles)`);
  return {
    dataUrl: `data:image/webp;base64,${croppedBuf.toString("base64")}`,
    aspect: Number((cropW / cropH).toFixed(2)),
    colliders
  };
}

// Create a pixel-aligned sunny autumn daytime version of the workshop background
async function buildDaytimeBackground(bgPath) {
  const W = 640;
  const H = 1138;
  const { data } = await sharp(bgPath)
    .resize(W, H, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Helper: check if (x, y) is inside the Gothic window glass arch (generous curve so no purple corners remain)
  const inWindowArch = (x, y) => {
    if (y < 120 || y > 504 || x < 194 || x > 446) return false;
    if (y >= 265) return x >= 196 && x <= 444;
    const t = Math.max(0, (y - 116) / (265 - 116));
    const halfSpan = 128 * Math.pow(t, 0.45);
    return Math.abs(x - 320) <= halfSpan;
  };

  // Detect small dark components (flying bats) inside the window so we can replace them with morning sky
  // Keep x in [296..344] excluded so the central Gothic stone mullion and its top Y-fork remain 100% intact!
  const darkMask = new Uint8Array(W * H);
  for (let y = 185; y <= 485; y++) {
    for (let x = 198; x <= 442; x++) {
      if (!inWindowArch(x, y)) continue;
      if (Math.abs(x - 320) <= 22 && y < 275) continue;
      if (Math.abs(x - 320) <= 9) continue;
      const p = (y * W + x) * 4;
      const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      if (lum < 72) {
        darkMask[y * W + x] = 1;
      }
    }
  }

  const batMask = new Uint8Array(W * H);
  const visited = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (!darkMask[i] || visited[i]) continue;
    let head = 0;
    let tail = 0;
    visited[i] = 1;
    queue[tail++] = i;
    let touchesBorder = false;

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % W;
      const cy = (curr / W) | 0;
      if (cx <= 204 || cx >= 436 || cy >= 480 || cy <= 190) touchesBorder = true;

      const neighbors = [curr - 1, curr + 1, curr - W, curr + W];
      for (const n of neighbors) {
        if (n >= 0 && n < W * H && darkMask[n] && !visited[n]) {
          visited[n] = 1;
          queue[tail++] = n;
        }
      }
    }

    // Bats are small isolated dark shapes (< 650 px) that don't attach to the outer window frame
    if (!touchesBorder && tail < 650) {
      for (let k = 0; k < tail; k++) {
        const idx = queue[k];
        batMask[idx] = 1;
        if (idx - 1 >= 0) batMask[idx - 1] = 1;
        if (idx + 1 < W * H) batMask[idx + 1] = 1;
        if (idx - W >= 0) batMask[idx - W] = 1;
        if (idx + W < W * H) batMask[idx + W] = 1;
      }
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const p = idx * 4;
      let r = data[p];
      let g = data[p + 1];
      let b = data[p + 2];

      const inWin = inWindowArch(x, y);

      if (inWin) {
        const isPurpleSky = b > g + 8 && b > 48;
        const distMoon = Math.hypot(x - 320, y - 290);
        const isMoon = distMoon < 92 && r > 155 && g > 110 && r > b + 20 && Math.abs(x - 320) > 6;
        const isBat = batMask[idx] === 1;

        if (isPurpleSky || isMoon || isBat) {
          // Paint radiant sunny morning sky + warm golden sun!
          const skyT = Math.max(0, Math.min(1, (y - 124) / (504 - 124)));
          let skyR = Math.round(74 * (1 - skyT) + 255 * skyT);
          let skyG = Math.round(192 * (1 - skyT) + 225 * skyT);
          let skyB = Math.round(252 * (1 - skyT) + 145 * skyT);

          // Morning sun centered at (320, 282)
          const sunDist = Math.hypot(x - 320, y - 282);
          const sunCore = Math.max(0, 1 - sunDist / 62);
          const sunHalo = Math.max(0, 1 - sunDist / 145);

          skyR = Math.min(255, Math.round(skyR + sunHalo * 88 + sunCore * 92));
          skyG = Math.min(255, Math.round(skyG + sunHalo * 58 + sunCore * 86));
          skyB = Math.min(255, Math.round(skyB + sunHalo * 15 + Math.pow(sunCore, 2) * 95));

          // Soft sunlit cloud wisps
          const cloudWave =
            Math.sin(x * 0.045 + y * 0.02) * Math.cos(y * 0.055 - x * 0.015);
          if (cloudWave > 0.35 && y > 195 && y < 430) {
            const cBoost = (cloudWave - 0.35) * 38;
            skyR = Math.min(255, Math.round(skyR + cBoost * 1.1));
            skyG = Math.min(255, Math.round(skyG + cBoost * 0.95));
            skyB = Math.min(255, Math.round(skyB + cBoost * 0.7));
          }

          data[p] = skyR;
          data[p + 1] = skyG;
          data[p + 2] = skyB;
          continue;
        } else {
          // Tree branches, autumn leaves & Gothic stone mullion inside the window: warm them with bright morning sun
          r = Math.min(255, Math.round(r * 1.32 + 28));
          g = Math.min(255, Math.round(g * 1.28 + 22));
          b = Math.min(255, Math.round(b * 1.02 + 12));
          data[p] = r;
          data[p + 1] = g;
          data[p + 2] = b;
          continue;
        }
      }

      // Outside the window: transform dark night cottage interior into warm sunlit daytime workshop!
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Lift dark shadows strongly so the central stone alcove and wooden walls are brightly lit by daylight
      const liftedLum = Math.pow(lum, 0.62);
      const liftRatio = lum > 0.01 ? liftedLum / lum : 2.4;

      // Suppress excess night-blue so stone walls become warm golden sandstone instead of purple
      const clampedB = Math.min(b, (r + g) * 0.52);
      let dayR = r * liftRatio * 1.26 + 38;
      let dayG = g * liftRatio * 1.22 + 28;
      let dayB = clampedB * liftRatio * 0.85 + 14;

      // Extra warm sandstone daylight lift inside the central stone alcove (where the Shop opens!)
      const alcoveDx = (x - 320) / 185;
      const alcoveDy = (y - 690) / 250;
      const alcoveFactor = Math.max(0, 1 - (alcoveDx * alcoveDx + alcoveDy * alcoveDy));
      if (alcoveFactor > 0) {
        dayR += alcoveFactor * 64;
        dayG += alcoveFactor * 48;
        dayB += alcoveFactor * 22;
      }

      // Volumetric golden sunbeams streaming down from the Gothic window (320, 260)
      if (y > 240) {
        const dxSun = x - 320;
        const dySun = y - 220;
        const angle = Math.atan2(dxSun, dySun);
        const distSun = Math.hypot(dxSun, dySun);
        const coneMask = Math.max(0, 1 - Math.abs(angle) / 0.52);
        const rayPattern =
          0.55 +
          0.45 * Math.cos(angle * 18) * Math.cos(angle * 7 + 0.4);
        const distanceFade = Math.max(0, 1 - distSun / 880);
        const beamIntensity = coneMask * rayPattern * distanceFade;

        dayR += beamIntensity * 72;
        dayG += beamIntensity * 56;
        dayB += beamIntensity * 24;
      }

      data[p] = Math.max(0, Math.min(255, Math.round(dayR)));
      data[p + 1] = Math.max(0, Math.min(255, Math.round(dayG)));
      data[p + 2] = Math.max(0, Math.min(255, Math.round(dayB)));
    }
  }

  return sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 84 })
    .toBuffer();
}

const dataUrlMap = {};
const aspectMap = {};
const colliderMap = {};

for (const sheet of SHEETS) {
  const fullPath = path.join(BRAIN_DIR, sheet.file);
  for (let i = 0; i < 4; i++) {
    const name = sheet.quadrants[i];
    const res = await processQuadrant(fullPath, i, name);
    dataUrlMap[name] = res.dataUrl;
    aspectMap[name] = res.aspect;
    colliderMap[name] = res.colliders;
  }
}

// Process the generated Halloween Night background illustration
const bgPath = path.join(BRAIN_DIR, "halloween_cauldron_bg_1792439704850.jpg");
const bgBuf = await sharp(bgPath)
  .resize(640, 1138, { fit: "cover" })
  .webp({ quality: 82 })
  .toBuffer();

writeFileSync(path.join(OUT_DIR, "halloween_bg.webp"), bgBuf);
dataUrlMap["halloween_bg"] = `data:image/webp;base64,${bgBuf.toString("base64")}`;
console.log("Saved halloween_bg.webp!");

// Process the Sunny Daytime version of the exact same background illustration
const bgDayBuf = await buildDaytimeBackground(bgPath);
writeFileSync(path.join(OUT_DIR, "halloween_bg_day.webp"), bgDayBuf);
dataUrlMap["halloween_bg_day"] = `data:image/webp;base64,${bgDayBuf.toString("base64")}`;
console.log("Saved halloween_bg_day.webp!");

// Create the Evolved Spirit sprite ("royal_spirit" - Архідух Ліхтаря)
const royalOverlaySvg = Buffer.from(`
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="aura" cx="50%" cy="54%" r="48%">
      <stop offset="0%" stop-color="#fff3b0" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="#d45bff" stop-opacity="0.38"/>
      <stop offset="85%" stop-color="#48f0d8" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#48f0d8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff49c"/>
      <stop offset="55%" stop-color="#ffbe2e"/>
      <stop offset="100%" stop-color="#d46b08"/>
    </linearGradient>
  </defs>
  <circle cx="128" cy="136" r="112" fill="url(#aura)"/>
  <circle cx="128" cy="136" r="98" fill="none" stroke="#ffe57f" stroke-width="4" stroke-dasharray="10 8" opacity="0.85"/>
  <path d="M42 74 L47 88 L61 93 L47 98 L42 112 L37 98 L23 93 L37 88 Z" fill="#7dffef"/>
  <path d="M214 70 L218 82 L230 86 L218 90 L214 102 L210 90 L198 86 L210 82 Z" fill="#ffe47a"/>
  <path d="M52 194 L55 203 L64 206 L55 209 L52 218 L49 209 L40 206 L49 203 Z" fill="#ff94f2"/>
  <path d="M206 188 L209 197 L218 200 L209 203 L206 212 L203 203 L194 200 L203 197 Z" fill="#7dffef"/>
  <path d="M82 66 L94 26 L114 48 L128 18 L142 48 L162 26 L174 66 Z" fill="url(#crownGrad)" stroke="#4a1c00" stroke-width="5" stroke-linejoin="round"/>
  <rect x="82" y="62" width="92" height="12" rx="5" fill="#ff9f1c" stroke="#4a1c00" stroke-width="4"/>
  <circle cx="128" cy="48" r="6.5" fill="#48f0d8" stroke="#220938" stroke-width="2.5"/>
  <circle cx="103" cy="52" r="5" fill="#ff477e" stroke="#220938" stroke-width="2"/>
  <circle cx="153" cy="52" r="5" fill="#ff477e" stroke="#220938" stroke-width="2"/>
</svg>
`);

const tintedOrbBuf = await sharp(path.join(OUT_DIR, "spirit_orb.webp"))
  .resize(212, 212, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .modulate({ brightness: 1.08, saturation: 1.35, hue: 55 })
  .toBuffer();

const royalSpiritBuf = await sharp({
  create: {
    width: 256,
    height: 256,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  }
})
  .composite([
    { input: tintedOrbBuf, left: 22, top: 34 },
    { input: royalOverlaySvg, left: 0, top: 0 }
  ])
  .webp({ quality: 92, alphaQuality: 96 })
  .toBuffer();

writeFileSync(path.join(OUT_DIR, "royal_spirit.webp"), royalSpiritBuf);
dataUrlMap["royal_spirit"] = `data:image/webp;base64,${royalSpiritBuf.toString("base64")}`;
aspectMap["royal_spirit"] = 1;
colliderMap["royal_spirit"] = await buildCompoundColliders(royalSpiritBuf, "royal_spirit");
console.log("Saved royal_spirit.webp!");

/**
 * Generates atmospheric hand-painted Halloween UI panels (top signboard, guest card, bottom shelf)
 * and illustrated skill medallions (Stirring Ladle, Bat Helper, Witch's Grimoire) by compositing
 * real hand-painted wood, parchment, and sprite textures with ornate SVG lighting/ironwork layers.
 */
async function buildUiPanelsAndSkills() {
  const cauldronBgPath = path.join(BRAIN_DIR, "halloween_cauldron_bg_1792439704850.jpg");

  // 1. TOP PANEL: ui_top_panel.webp (950x396)
  // Extract pure hand-painted wooden table & shelf texture from halloween_cauldron_bg (zero text!)
  const woodBaseTop = await sharp(cauldronBgPath)
    .extract({ left: 24, top: 1155, width: 720, height: 215 })
    .resize(950, 396, { fit: "cover" })
    .modulate({ brightness: 0.76, saturation: 1.22 })
    .toBuffer();

  const woodGrainOverlay = await sharp(cauldronBgPath)
    .extract({ left: 40, top: 1190, width: 688, height: 180 })
    .resize(950, 396, { fit: "cover" })
    .flop()
    .modulate({ brightness: 0.68, saturation: 1.15 })
    .ensureAlpha(0.35)
    .png()
    .toBuffer();

  const miniPumpkinLeft = await sharp(path.join(OUT_DIR, "tier3.webp"))
    .resize(52, 52, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const miniPumpkinRight = await sharp(path.join(OUT_DIR, "tier6.webp"))
    .resize(50, 50, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const topPanelSvg = Buffer.from(`
  <svg width="950" height="396" viewBox="0 0 950 396" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="woodShade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4e2612" stop-opacity="0.54"/>
        <stop offset="22%" stop-color="#2c1309" stop-opacity="0.66"/>
        <stop offset="82%" stop-color="#1f0c05" stop-opacity="0.76"/>
        <stop offset="100%" stop-color="#120603" stop-opacity="0.88"/>
      </linearGradient>
      <radialGradient id="candleTopGlow" cx="50%" cy="10%" r="65%">
        <stop offset="0%" stop-color="#ff9e2c" stop-opacity="0.36"/>
        <stop offset="55%" stop-color="#9e36ff" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="ironGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#563c70"/>
        <stop offset="50%" stop-color="#2b1b3d"/>
        <stop offset="100%" stop-color="#160c22"/>
      </linearGradient>
      <linearGradient id="goldTrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffe28a"/>
        <stop offset="50%" stop-color="#e08b26"/>
        <stop offset="100%" stop-color="#7c3f08"/>
      </linearGradient>
    </defs>

    <!-- Warm dark wood glaze & horizontal plank grooves -->
    <rect x="0" y="0" width="950" height="396" rx="34" fill="url(#woodShade)"/>
    <rect x="0" y="0" width="950" height="396" rx="34" fill="url(#candleTopGlow)"/>

    <!-- Hand-carved wood grain lines & knots -->
    <g stroke="#140703" fill="none" opacity="0.72">
      <path d="M 18 96 Q 475 102 932 95" stroke-width="3.5"/>
      <path d="M 14 245 Q 475 240 936 246" stroke-width="3"/>
      <path d="M 80 48 Q 220 38 370 52" stroke-width="1.8" opacity="0.5"/>
      <path d="M 580 54 Q 730 42 870 50" stroke-width="1.8" opacity="0.5"/>
      <ellipse cx="260" cy="170" rx="34" ry="11" stroke-width="2" opacity="0.4"/>
      <ellipse cx="710" cy="315" rx="42" ry="12" stroke-width="2" opacity="0.4"/>
    </g>
    <path d="M 18 99 Q 475 105 932 98" stroke="#ffbe73" stroke-width="1.3" fill="none" opacity="0.25"/>

    <!-- Subtle silvery cobwebs in top corners -->
    <g stroke="#f3dcff" stroke-width="1.6" fill="none" opacity="0.28">
      <path d="M 8 8 L 115 8 M 8 8 L 96 58 M 8 8 L 68 95 M 8 8 L 24 110"/>
      <path d="M 42 8 Q 38 30 30 38 Q 22 44 8 46"/>
      <path d="M 74 8 Q 66 44 50 58 Q 34 72 8 76"/>
      <path d="M 104 8 Q 90 56 66 78 Q 42 96 8 102"/>

      <path d="M 942 8 L 835 8 M 942 8 L 854 58 M 942 8 L 882 95 M 942 8 L 926 110"/>
      <path d="M 908 8 Q 912 30 920 38 Q 928 44 942 46"/>
      <path d="M 876 8 Q 884 44 900 58 Q 916 72 942 76"/>
      <path d="M 846 8 Q 860 56 884 78 Q 908 96 942 102"/>
    </g>

    <!-- Autumn leaves tucked into corners -->
    <g opacity="0.88">
      <path d="M 28 378 C 42 356, 72 358, 84 376 C 66 388, 42 388, 28 378 Z" fill="#d94e1f" stroke="#2a0d04" stroke-width="2.5"/>
      <path d="M 62 384 C 78 366, 106 368, 118 384 C 98 392, 76 392, 62 384 Z" fill="#f59f1a" stroke="#2a0d04" stroke-width="2.2"/>
      <path d="M 922 378 C 908 356, 878 358, 866 376 C 884 388, 908 388, 922 378 Z" fill="#e86f1c" stroke="#2a0d04" stroke-width="2.5"/>
    </g>

    <!-- Outer Beveled Wood & Gold Frame -->
    <rect x="5" y="5" width="940" height="386" rx="30" fill="none" stroke="url(#goldTrim)" stroke-width="5.5" opacity="0.9"/>
    <rect x="11" y="11" width="928" height="374" rx="25" fill="none" stroke="#1b0904" stroke-width="3.5" opacity="0.9"/>

    <!-- Wrought-Iron Corner Brackets with Brass Rivets -->
    <g fill="url(#ironGrad)" stroke="#14081e" stroke-width="3">
      <path d="M 4 42 L 4 24 Q 4 4 24 4 L 78 4 L 78 22 L 32 22 Q 22 22 22 32 L 22 68 L 4 68 Z"/>
      <path d="M 946 42 L 946 24 Q 946 4 926 4 L 872 4 L 872 22 L 918 22 Q 928 22 928 32 L 928 68 L 946 68 Z"/>
      <path d="M 4 354 L 4 372 Q 4 392 24 392 L 78 392 L 78 374 L 32 374 Q 22 374 22 364 L 22 328 L 4 328 Z"/>
      <path d="M 946 354 L 946 372 Q 946 392 926 392 L 872 392 L 872 374 L 918 374 Q 928 374 928 364 L 928 328 L 946 328 Z"/>
    </g>

    <!-- Glowing Brass Rivets on Iron Brackets -->
    <g fill="#ffcf6e" stroke="#3b1706" stroke-width="2">
      <circle cx="14" cy="15" r="4.5"/><circle cx="58" cy="13" r="4"/><circle cx="13" cy="52" r="4"/>
      <circle cx="936" cy="15" r="4.5"/><circle cx="892" cy="13" r="4"/><circle cx="937" cy="52" r="4"/>
      <circle cx="14" cy="381" r="4.5"/><circle cx="58" cy="383" r="4"/><circle cx="13" cy="344" r="4"/>
      <circle cx="936" cy="381" r="4.5"/><circle cx="892" cy="383" r="4"/><circle cx="937" cy="344" r="4"/>
    </g>

    <!-- Glowing Arcane Symbols etched into top center molding -->
    <g fill="#ffae42" opacity="0.45" font-family="serif" font-size="18" font-weight="bold">
      <text x="455" y="26">✦ ☽ ✦</text>
    </g>
  </svg>
  `);

  const uiTopPanelBuf = await sharp(woodBaseTop)
    .composite([
      { input: woodGrainOverlay, left: 0, top: 0 },
      { input: topPanelSvg, left: 0, top: 0 },
      { input: miniPumpkinLeft, left: 8, top: 46 },
      { input: miniPumpkinRight, left: 890, top: 46 }
    ])
    .webp({ quality: 88 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "ui_top_panel.webp"), uiTopPanelBuf);
  dataUrlMap["ui_top_panel"] = `data:image/webp;base64,${uiTopPanelBuf.toString("base64")}`;
  console.log("Saved ui_top_panel.webp!");

  // 2. GUEST ORDER CARD PANEL: ui_guest_card.webp (900x252)
  // Uses the hand-painted purple-lit stone & wood alcove texture from halloween_cauldron_bg (zero text!)
  const velvetBase = await sharp(cauldronBgPath)
    .extract({ left: 140, top: 540, width: 488, height: 210 })
    .resize(900, 252, { fit: "cover" })
    .blur(2.2)
    .modulate({ brightness: 0.72, saturation: 1.35 })
    .toBuffer();

  const guestCardSvg = Buffer.from(`
  <svg width="900" height="252" viewBox="0 0 900 252" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="velvetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#220d3e" stop-opacity="0.78"/>
        <stop offset="50%" stop-color="#371659" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#1a0930" stop-opacity="0.84"/>
      </linearGradient>
      <radialGradient id="orderGlow" cx="18%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#ffae38" stop-opacity="0.24"/>
        <stop offset="55%" stop-color="#b548ff" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#140726" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="filigreeGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe89c"/>
        <stop offset="50%" stop-color="#dfa03b"/>
        <stop offset="100%" stop-color="#8f5112"/>
      </linearGradient>
    </defs>

    <rect x="0" y="0" width="900" height="252" rx="26" fill="url(#velvetGrad)"/>
    <rect x="0" y="0" width="900" height="252" rx="26" fill="url(#orderGlow)"/>

    <!-- Subtle arcane constellation lines in the velvet background -->
    <g stroke="#e5b8ff" stroke-width="1" opacity="0.14" fill="none">
      <circle cx="780" cy="64" r="38"/>
      <circle cx="780" cy="64" r="24" stroke-dasharray="4 4"/>
      <path d="M 742 64 L 818 64 M 780 26 L 780 102"/>
    </g>

    <!-- Recessed bottom recipe tray area -->
    <rect x="14" y="138" width="872" height="100" rx="18" fill="#120623" fill-opacity="0.62" stroke="#ffcf78" stroke-opacity="0.32" stroke-width="2"/>

    <!-- Ornate Golden Filigree Frame & Corner Flourishes -->
    <rect x="4" y="4" width="892" height="244" rx="23" fill="none" stroke="url(#filigreeGold)" stroke-width="4.5" opacity="0.94"/>
    <rect x="10" y="10" width="880" height="232" rx="18" fill="none" stroke="#f7be63" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.48"/>

    <!-- Corner Filigree Diamonds -->
    <g fill="#ffd97d" opacity="0.88">
      <path d="M 18 18 L 38 14 L 26 26 L 14 38 Z"/>
      <path d="M 882 18 L 862 14 L 874 26 L 886 38 Z"/>
      <path d="M 18 234 L 38 238 L 26 226 L 14 214 Z"/>
      <path d="M 882 234 L 862 238 L 874 226 L 886 214 Z"/>
    </g>

    <!-- Subtle Arcane Sparkles -->
    <g fill="#7dffef" opacity="0.48">
      <circle cx="440" cy="18" r="2.5"/>
      <circle cx="460" cy="18" r="2"/>
      <circle cx="450" cy="18" r="3.5" fill="#ffe484"/>
    </g>
  </svg>
  `);

  const uiGuestCardBuf = await sharp(velvetBase)
    .composite([{ input: guestCardSvg, left: 0, top: 0 }])
    .webp({ quality: 88 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "ui_guest_card.webp"), uiGuestCardBuf);
  dataUrlMap["ui_guest_card"] = `data:image/webp;base64,${uiGuestCardBuf.toString("base64")}`;
  console.log("Saved ui_guest_card.webp!");

  // 3. BOTTOM SHELF PANEL: ui_bottom_panel.webp (950x196)
  // Uses the hand-painted alchemy workbench from halloween_cauldron_bg (zero text!)
  const woodBaseBottom = await sharp(cauldronBgPath)
    .extract({ left: 16, top: 1165, width: 736, height: 195 })
    .resize(950, 196, { fit: "cover" })
    .modulate({ brightness: 0.8, saturation: 1.24 })
    .toBuffer();

  const runeStoneMini = await sharp(path.join(OUT_DIR, "spooky_rune_stone.webp"))
    .resize(44, 44, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bottomPanelSvg = Buffer.from(`
  <svg width="950" height="196" viewBox="0 0 950 196" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shelfShade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5c2c14" stop-opacity="0.48"/>
        <stop offset="22%" stop-color="#33160a" stop-opacity="0.65"/>
        <stop offset="100%" stop-color="#140703" stop-opacity="0.86"/>
      </linearGradient>
      <radialGradient id="socketGlow1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#48f0d8" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#48f0d8" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="socketGlow2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffaa2b" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#ffaa2b" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="socketGlow3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#d46bff" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#d46bff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="shelfGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffe596"/>
        <stop offset="50%" stop-color="#e3922b"/>
        <stop offset="100%" stop-color="#783b07"/>
      </linearGradient>
      <linearGradient id="shelfIron" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#593e75"/>
        <stop offset="55%" stop-color="#2b1b3d"/>
        <stop offset="100%" stop-color="#140a20"/>
      </linearGradient>
    </defs>

    <!-- Wood glaze -->
    <rect x="0" y="0" width="950" height="196" rx="34" fill="url(#shelfShade)"/>

    <!-- Top wooden ledge highlight & plank grooves -->
    <path d="M 22 24 L 928 24" stroke="#ffcf86" stroke-width="2.2" opacity="0.44"/>
    <path d="M 18 28 L 932 28" stroke="#140602" stroke-width="3.5" opacity="0.78"/>
    <path d="M 18 142 L 932 142" stroke="#140602" stroke-width="3" opacity="0.65"/>

    <!-- 3 Recessed Alchemy Pedestal Sockets at 172, 475, 778 -->
    <circle cx="172" cy="88" r="70" fill="url(#socketGlow1)"/>
    <circle cx="172" cy="88" r="52" fill="#180906" fill-opacity="0.62" stroke="#e59a3c" stroke-width="2.5" stroke-dasharray="8 5" opacity="0.85"/>

    <circle cx="475" cy="88" r="70" fill="url(#socketGlow2)"/>
    <circle cx="475" cy="88" r="52" fill="#180906" fill-opacity="0.62" stroke="#e59a3c" stroke-width="2.5" stroke-dasharray="8 5" opacity="0.85"/>

    <circle cx="778" cy="88" r="70" fill="url(#socketGlow3)"/>
    <circle cx="778" cy="88" r="52" fill="#180906" fill-opacity="0.62" stroke="#e59a3c" stroke-width="2.5" stroke-dasharray="8 5" opacity="0.85"/>

    <!-- Ornate dividers between the 3 tool slots -->
    <g stroke="#e89e3c" stroke-width="2" opacity="0.48" fill="none">
      <path d="M 324 34 L 324 162"/>
      <path d="M 626 34 L 626 162"/>
    </g>

    <!-- Autumn leaves resting on the shelf ledge -->
    <g opacity="0.9">
      <path d="M 42 172 C 58 152, 88 154, 102 172 C 82 184, 58 184, 42 172 Z" fill="#e65c19" stroke="#260b03" stroke-width="2.5"/>
      <path d="M 848 172 C 862 154, 892 152, 908 172 C 892 184, 868 184, 848 172 Z" fill="#f5a31a" stroke="#260b03" stroke-width="2.5"/>
    </g>

    <!-- Outer Gold & Dark Oak Frame -->
    <rect x="5" y="5" width="940" height="186" rx="30" fill="none" stroke="url(#shelfGold)" stroke-width="5.5" opacity="0.9"/>
    <rect x="11" y="11" width="928" height="174" rx="25" fill="none" stroke="#1b0803" stroke-width="3.5" opacity="0.92"/>

    <!-- Wrought-Iron Corner Brackets -->
    <g fill="url(#shelfIron)" stroke="#12071c" stroke-width="3">
      <path d="M 4 44 L 4 24 Q 4 4 24 4 L 76 4 L 76 22 L 30 22 Q 22 22 22 30 L 22 64 L 4 64 Z"/>
      <path d="M 946 44 L 946 24 Q 946 4 926 4 L 874 4 L 874 22 L 920 22 Q 928 22 928 30 L 928 64 L 946 64 Z"/>
      <path d="M 4 152 L 4 172 Q 4 192 24 192 L 76 192 L 76 174 L 30 174 Q 22 174 22 166 L 22 132 L 4 132 Z"/>
      <path d="M 946 152 L 946 172 Q 946 192 926 192 L 874 192 L 874 174 L 920 174 Q 928 174 928 166 L 928 132 L 946 132 Z"/>
    </g>

    <!-- Brass Rivets -->
    <g fill="#ffd275" stroke="#3b1706" stroke-width="2">
      <circle cx="14" cy="14" r="4.5"/><circle cx="56" cy="13" r="4"/><circle cx="13" cy="48" r="4"/>
      <circle cx="936" cy="14" r="4.5"/><circle cx="894" cy="13" r="4"/><circle cx="937" cy="48" r="4"/>
      <circle cx="14" cy="182" r="4.5"/><circle cx="56" cy="183" r="4"/><circle cx="13" cy="148" r="4"/>
      <circle cx="936" cy="182" r="4.5"/><circle cx="894" cy="183" r="4"/><circle cx="937" cy="148" r="4"/>
    </g>
  </svg>
  `);

  const uiBottomPanelBuf = await sharp(woodBaseBottom)
    .composite([
      { input: bottomPanelSvg, left: 0, top: 0 },
      { input: runeStoneMini, left: 302, top: 76 },
      { input: runeStoneMini, left: 604, top: 76 }
    ])
    .webp({ quality: 88 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "ui_bottom_panel.webp"), uiBottomPanelBuf);
  dataUrlMap["ui_bottom_panel"] = `data:image/webp;base64,${uiBottomPanelBuf.toString("base64")}`;
  console.log("Saved ui_bottom_panel.webp!");

  // 4. SKILL ICON 1: skill_stir.webp (256x256 - Велика Мішалка)
  const ladlePommelPumpkin = await sharp(path.join(OUT_DIR, "tier3.webp"))
    .resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const skillStirSvg = Buffer.from(`
  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="stirVortex" cx="46%" cy="56%" r="50%">
        <stop offset="0%" stop-color="#c2fff5" stop-opacity="0.92"/>
        <stop offset="40%" stop-color="#28e0c8" stop-opacity="0.78"/>
        <stop offset="78%" stop-color="#6b24b8" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#1d0938" stop-opacity="0.96"/>
      </radialGradient>
      <linearGradient id="medallionGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff0a6"/>
        <stop offset="45%" stop-color="#f59e24"/>
        <stop offset="100%" stop-color="#7a3706"/>
      </linearGradient>
      <linearGradient id="woodLadle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e3964a"/>
        <stop offset="50%" stop-color="#a8561e"/>
        <stop offset="100%" stop-color="#592609"/>
      </linearGradient>
      <linearGradient id="spoonBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#cd7732"/>
        <stop offset="100%" stop-color="#4e1e06"/>
      </linearGradient>
    </defs>

    <!-- Outer Medallion Shadow & Ornate Gold Ring -->
    <circle cx="128" cy="128" r="120" fill="#160729" stroke="#240a04" stroke-width="6"/>
    <circle cx="128" cy="128" r="108" fill="url(#stirVortex)"/>

    <!-- Swirling Cauldron Whirlpool Waves -->
    <g fill="none" stroke-linecap="round">
      <path d="M 56 154 C 72 198, 178 202, 196 148 C 208 110, 162 84, 124 94" stroke="#8afff0" stroke-width="10" opacity="0.75"/>
      <path d="M 74 158 C 92 184, 162 184, 174 146 C 182 122, 148 108, 122 116" stroke="#ffffff" stroke-width="5.5" opacity="0.82"/>
      <path d="M 48 124 C 58 84, 118 66, 168 82" stroke="#d46bff" stroke-width="7" opacity="0.58"/>
    </g>

    <!-- Carved Wooden Witch's Stirring Ladle (Велика Мішалка) -->
    <g>
      <!-- Ladle Bowl submerged in the glowing teal vortex -->
      <ellipse cx="104" cy="158" rx="46" ry="30" transform="rotate(-22 104 158)" fill="url(#spoonBowl)" stroke="#240b03" stroke-width="7"/>
      <!-- Glowing turquoise potion inside the ladle bowl -->
      <ellipse cx="104" cy="156" rx="34" ry="19" transform="rotate(-22 104 156)" fill="#56ffe8" stroke="#188a7d" stroke-width="3"/>
      <path d="M 84 156 Q 104 144 126 150" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.9"/>

      <!-- Thick Carved Wooden Handle rising diagonally to top-right -->
      <path d="M 118 140 L 188 42 C 196 32, 214 44, 204 56 L 136 152 Z" fill="url(#woodLadle)" stroke="#240b03" stroke-width="7" stroke-linejoin="round"/>
      <!-- Wood grain highlight on handle -->
      <path d="M 127 136 L 190 48" stroke="#ffd296" stroke-width="3.5" stroke-linecap="round" opacity="0.75"/>
    </g>

    <!-- Magical Teal Vortex Wave overlapping front of ladle -->
    <path d="M 62 168 Q 108 196 164 166" fill="none" stroke="#6bffec" stroke-width="9" stroke-linecap="round" opacity="0.9"/>
    <path d="M 74 172 Q 110 192 152 170" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.92"/>

    <!-- Rising Potion Bubbles & Sparkles -->
    <circle cx="64" cy="112" r="10" fill="#8afff0" stroke="#1b4f4a" stroke-width="3"/>
    <circle cx="61" cy="109" r="3.5" fill="#ffffff"/>
    <circle cx="176" cy="176" r="8" fill="#ff94f2" stroke="#4a154b" stroke-width="2.5"/>
    <circle cx="136" cy="78" r="6.5" fill="#ffe875" stroke="#573806" stroke-width="2"/>
    <path d="M 56 64 L 61 76 L 73 81 L 61 86 L 56 98 L 51 86 L 39 81 L 51 76 Z" fill="#fff394"/>
    <path d="M 192 118 L 196 128 L 206 132 L 196 136 L 192 146 L 188 136 L 178 132 L 188 128 Z" fill="#7dffef"/>

    <!-- Ornate Beveled Medallion Rim -->
    <circle cx="128" cy="128" r="114" fill="none" stroke="url(#medallionGold)" stroke-width="11"/>
    <circle cx="128" cy="128" r="107" fill="none" stroke="#2b0e04" stroke-width="3.5"/>
    <!-- Specular glass orb highlight -->
    <path d="M 48 72 A 96 96 0 0 1 168 38" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.48"/>
  </svg>
  `);

  const skillStirBuf = await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([
      { input: skillStirSvg, left: 0, top: 0 },
      { input: ladlePommelPumpkin, left: 164, top: 10 }
    ])
    .webp({ quality: 92, alphaQuality: 96 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "skill_stir.webp"), skillStirBuf);
  dataUrlMap["skill_stir"] = `data:image/webp;base64,${skillStirBuf.toString("base64")}`;
  console.log("Saved skill_stir.webp!");

  // 5. SKILL ICON 2: skill_bat.webp (256x256 - Кажанчик-Помічник)
  // Full harvest moon medallion + cute_bat sprite + magical sparkles & captured bubble
  const batSprite = await sharp(path.join(OUT_DIR, "cute_bat.webp"))
    .resize(196, 196, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const skillBatBgSvg = Buffer.from(`
  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="nightSkyOrb" cx="50%" cy="45%" r="52%">
        <stop offset="0%" stop-color="#5d2394"/>
        <stop offset="65%" stop-color="#2b0f4c"/>
        <stop offset="100%" stop-color="#140626"/>
      </radialGradient>
      <radialGradient id="harvestMoon" cx="48%" cy="44%" r="42%">
        <stop offset="0%" stop-color="#fff8c4"/>
        <stop offset="55%" stop-color="#ffbe3b"/>
        <stop offset="90%" stop-color="#e86f12"/>
        <stop offset="100%" stop-color="#e86f12" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="batGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff2a8"/>
        <stop offset="50%" stop-color="#f59b23"/>
        <stop offset="100%" stop-color="#7c3806"/>
      </linearGradient>
    </defs>

    <!-- Medallion Base -->
    <circle cx="128" cy="128" r="120" fill="#160729" stroke="#240a04" stroke-width="6"/>
    <circle cx="128" cy="128" r="110" fill="url(#nightSkyOrb)"/>

    <!-- Giant Glowing Harvest Moon behind the Bat -->
    <circle cx="128" cy="118" r="94" fill="url(#harvestMoon)"/>
    <circle cx="128" cy="118" r="74" fill="#ffe885" opacity="0.88"/>
    <!-- Subtle Moon Craters -->
    <circle cx="96" cy="92" r="12" fill="#f2a83b" opacity="0.45"/>
    <circle cx="156" cy="108" r="16" fill="#f2a83b" opacity="0.38"/>
    <circle cx="118" cy="146" r="10" fill="#f2a83b" opacity="0.4"/>

    <!-- Ornate Gold Rim -->
    <circle cx="128" cy="128" r="114" fill="none" stroke="url(#batGoldRim)" stroke-width="11"/>
    <circle cx="128" cy="128" r="107" fill="none" stroke="#2b0e04" stroke-width="3.5"/>
  </svg>
  `);

  const skillBatFgSvg = Buffer.from(`
  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <!-- Magical Claws Aura & Captured Potion Bubbles at Bottom -->
    <circle cx="98" cy="196" r="15" fill="#7dffef" fill-opacity="0.75" stroke="#ffffff" stroke-width="3"/>
    <circle cx="158" cy="194" r="13" fill="#ff94f2" fill-opacity="0.75" stroke="#ffffff" stroke-width="2.5"/>
    <path d="M 52 62 L 57 74 L 69 79 L 57 84 L 52 96 L 47 84 L 35 79 L 47 74 Z" fill="#fff49c"/>
    <path d="M 204 68 L 208 78 L 218 82 L 208 86 L 204 96 L 200 86 L 190 82 L 200 78 Z" fill="#7dffef"/>
    <!-- Top Glass Highlight -->
    <path d="M 48 72 A 96 96 0 0 1 168 38" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.48"/>
  </svg>
  `);

  const skillBatBuf = await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([
      { input: skillBatBgSvg, left: 0, top: 0 },
      { input: batSprite, left: 30, top: 28 },
      { input: skillBatFgSvg, left: 0, top: 0 }
    ])
    .webp({ quality: 92, alphaQuality: 96 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "skill_bat.webp"), skillBatBuf);
  dataUrlMap["skill_bat"] = `data:image/webp;base64,${skillBatBuf.toString("base64")}`;
  console.log("Saved skill_bat.webp!");

  // 6. SKILL ICON 3: skill_grimoire.webp (256x256 - Гримуар Відьми)
  // Illustrated Ancient Witch's Spellbook with golden pumpkin clasp, glowing pages & rising spirit essence
  const miniBookPumpkin = await sharp(path.join(OUT_DIR, "tier3.webp"))
    .resize(56, 56, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const skillGrimoireSvg = Buffer.from(`
  <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grimoireBg" cx="50%" cy="46%" r="52%">
        <stop offset="0%" stop-color="#8b2fc9"/>
        <stop offset="60%" stop-color="#3c1163"/>
        <stop offset="100%" stop-color="#170629"/>
      </radialGradient>
      <linearGradient id="leatherCover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c93b2b"/>
        <stop offset="55%" stop-color="#851c14"/>
        <stop offset="100%" stop-color="#470b07"/>
      </linearGradient>
      <linearGradient id="LeatherSpine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3d0905"/>
        <stop offset="50%" stop-color="#701610"/>
        <stop offset="100%" stop-color="#2e0604"/>
      </linearGradient>
      <linearGradient id="pagesGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff9d6"/>
        <stop offset="65%" stop-color="#ffd980"/>
        <stop offset="100%" stop-color="#d4902a"/>
      </linearGradient>
      <linearGradient id="bookGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff2a6"/>
        <stop offset="50%" stop-color="#f29b24"/>
        <stop offset="100%" stop-color="#7d3a07"/>
      </linearGradient>
    </defs>

    <!-- Medallion Base -->
    <circle cx="128" cy="128" r="120" fill="#160729" stroke="#240a04" stroke-width="6"/>
    <circle cx="128" cy="128" r="110" fill="url(#grimoireBg)"/>

    <!-- Magical Aura Ring behind the Grimoire -->
    <circle cx="128" cy="128" r="86" fill="none" stroke="#ffcf6e" stroke-width="3" stroke-dasharray="9 6" opacity="0.7"/>
    <circle cx="128" cy="124" r="76" fill="#ffae38" opacity="0.22"/>

    <!-- Tilted Isometric Ancient Witch's Grimoire (Spellbook) -->
    <g transform="translate(128 134) rotate(-8) translate(-128 -134)">
      <!-- Back Cover -->
      <path d="M 68 62 L 178 48 C 190 46, 198 54, 198 66 L 198 188 C 198 198, 190 206, 178 208 L 68 216 Z" fill="#3d0906" stroke="#1e0502" stroke-width="7" stroke-linejoin="round"/>

      <!-- Thick Golden-Cream Parchment Page Block -->
      <path d="M 72 68 L 184 54 C 192 64, 192 178, 184 196 L 72 210 Z" fill="url(#pagesGlow)" stroke="#240a04" stroke-width="6" stroke-linejoin="round"/>
      <!-- Page lines -->
      <path d="M 82 198 L 180 185 M 82 190 L 182 177 M 82 182 L 182 169" stroke="#9e5e16" stroke-width="2.5" opacity="0.75"/>

      <!-- Bookmark Ribbon hanging from bottom -->
      <path d="M 118 202 L 114 234 L 126 225 L 138 236 L 136 200 Z" fill="#48f0d8" stroke="#180726" stroke-width="5" stroke-linejoin="round"/>

      <!-- Front Dragon-Leather Cover -->
      <path d="M 60 56 L 170 42 C 180 40, 188 48, 188 58 L 188 180 C 188 190, 180 198, 170 200 L 60 212 Z" fill="url(#leatherCover)" stroke="#240a04" stroke-width="7" stroke-linejoin="round"/>

      <!-- Ribbed Book Spine (Left Side) -->
      <path d="M 52 64 C 52 56, 60 54, 68 56 L 68 212 C 60 214, 52 210, 52 200 Z" fill="url(#LeatherSpine)" stroke="#240a04" stroke-width="6" stroke-linejoin="round"/>
      <!-- Gold Spine Ribs -->
      <path d="M 50 86 Q 60 82 70 86 M 50 118 Q 60 114 70 118 M 50 150 Q 60 146 70 150 M 50 182 Q 60 178 70 182" stroke="url(#bookGold)" stroke-width="5" stroke-linecap="round" fill="none"/>

      <!-- Gold Corner Mounts on Cover -->
      <path d="M 152 44 L 186 40 L 186 74 Z" fill="url(#bookGold)" stroke="#240a04" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 152 202 L 186 198 L 186 164 Z" fill="url(#bookGold)" stroke="#240a04" stroke-width="4" stroke-linejoin="round"/>

      <!-- Ornate Gold Clasp Locking the Book on the Right Edge -->
      <rect x="172" y="106" width="26" height="32" rx="7" fill="url(#bookGold)" stroke="#240a04" stroke-width="5"/>
      <circle cx="184" cy="122" r="6" fill="#48f0d8" stroke="#180826" stroke-width="2.5"/>

      <!-- Golden Arcane Circle on Cover Center (for the Pumpkin Emblem) -->
      <circle cx="124" cy="126" r="42" fill="#2c0c4e" stroke="url(#bookGold)" stroke-width="5.5"/>
      <circle cx="124" cy="126" r="33" fill="none" stroke="#7dffef" stroke-width="2" stroke-dasharray="5 4"/>
    </g>

    <!-- Magical Sparkles around the Grimoire -->
    <path d="M 48 76 L 53 88 L 65 93 L 53 98 L 48 110 L 43 98 L 31 93 L 43 88 Z" fill="#7dffef"/>
    <path d="M 206 64 L 211 76 L 223 81 L 211 86 L 206 98 L 201 86 L 189 81 L 201 76 Z" fill="#fff394"/>
    <circle cx="198" cy="168" r="6" fill="#ff94f2"/>

    <!-- Ornate Medallion Rim & Specular Highlight -->
    <circle cx="128" cy="128" r="114" fill="none" stroke="url(#bookGold)" stroke-width="11"/>
    <circle cx="128" cy="128" r="107" fill="none" stroke="#2b0e04" stroke-width="3.5"/>
    <path d="M 48 72 A 96 96 0 0 1 168 38" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.48"/>
  </svg>
  `);

  const skillGrimoireBuf = await sharp({
    create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([
      { input: skillGrimoireSvg, left: 0, top: 0 },
      { input: miniBookPumpkin, left: 96, top: 96 }
    ])
    .webp({ quality: 92, alphaQuality: 96 })
    .toBuffer();

  writeFileSync(path.join(OUT_DIR, "skill_grimoire.webp"), skillGrimoireBuf);
  dataUrlMap["skill_grimoire"] = `data:image/webp;base64,${skillGrimoireBuf.toString("base64")}`;
  console.log("Saved skill_grimoire.webp!");
}

await buildUiPanelsAndSkills();

const jsContent = `// Auto-generated embedded high-DPI transparent WebP sprites, compound hitboxes, UI panels & Night/Day backgrounds
window.SPRITE_DATA_URLS = ${JSON.stringify(dataUrlMap, null, 2)};
window.SPRITE_ASPECTS = ${JSON.stringify(aspectMap, null, 2)};
window.SPRITE_COLLIDERS = ${JSON.stringify(colliderMap, null, 2)};
`;

writeFileSync("e:/gravaty/pumpkin-alchemy/sprites-data.js", jsContent, "utf8");
console.log("Generated sprites-data.js with all assets, UI panels, skill icons, and exact compound colliders!");


