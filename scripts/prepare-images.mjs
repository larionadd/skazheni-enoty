// Converts the generated concept art into small WebP card images + PWA icons.
// Usage: npm run images  (SRC env var can point to a different folder with the source JPGs)
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const SRC = process.env.SRC ?? 'art';
const OUT = 'public/cards';
const ICONS = 'public/icons';
mkdirSync(OUT, { recursive: true });
mkdirSync(ICONS, { recursive: true });

const files = readdirSync(SRC);
const find = (prefix) => {
  const f = files.find((x) => x.startsWith(prefix));
  if (!f) throw new Error(`Missing source art: ${prefix}*`);
  return path.join(SRC, f);
};

const cards = {
  petard: 'card_bomb_firecracker',
  doormat: 'card_defuse_doormat',
  nope: 'card_nope_stop',
  blame: 'card_attack_blame',
  bush: 'card_skip_bush',
  radar: 'card_future_radar',
  shuffle: 'card_shuffle_whirlwind',
  favor: 'card_favor_beg',
  shawarma: 'card_pair_shawarma',
  baron: 'card_pair_baron',
};

for (const [name, prefix] of Object.entries(cards)) {
  await sharp(find(prefix)).resize(480, 480, { fit: 'cover' }).webp({ quality: 74 }).toFile(`${OUT}/${name}.webp`);
  console.log('card', name);
}

// Punk & hoodie raccoons are cropped from the table concept art (designed at 768px width).
const ui = find('rabid_raccoons_mobile_ui');
const meta = await sharp(ui).metadata();
const k = meta.width / 768;
const crops = {
  hoodie: { left: 64, top: 50, width: 146, height: 146 },
  punk: { left: 557, top: 44, width: 146, height: 146 },
};
for (const [name, c] of Object.entries(crops)) {
  const box = Object.fromEntries(Object.entries(c).map(([key, v]) => [key, Math.round(v * k)]));
  await sharp(ui).extract(box).resize(480, 480, { fit: 'cover', kernel: 'lanczos3' }).webp({ quality: 80 }).toFile(`${OUT}/${name}.webp`);
  console.log('card', name);
}

// Card back / table art and app icons.
await sharp(ui).resize(720).webp({ quality: 70 }).toFile('public/concept.webp');
for (const size of [192, 512]) {
  await sharp(find('card_pair_shawarma')).resize(size, size, { fit: 'cover' }).png().toFile(`${ICONS}/icon-${size}.png`);
}
console.log('done');
