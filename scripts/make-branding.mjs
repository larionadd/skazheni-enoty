import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const files = readdirSync('art');
const find = (prefix) => path.join('art', files.find((x) => x.startsWith(prefix)));

// 1. Create a rich atmospheric neon night-alley background (bg-alley.webp)
// We combine the city alley atmosphere from card_defuse_doormat & card_favor_beg with a dark vignette overlay
// so UI panels pop with depth while the background looks like a real comic night alley.
const alleySrc = find('card_defuse_doormat');
const alleyMeta = await sharp(alleySrc).metadata();
const darkVignette = Buffer.from(`<svg width="720" height="1280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b0418" stop-opacity="0.35"/>
      <stop offset="45%" stop-color="#14082c" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#070210" stop-opacity="0.92"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="22%" r="70%">
      <stop offset="0%" stop-color="#2ec4b6" stop-opacity="0.12"/>
      <stop offset="55%" stop-color="#ff2d95" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#05010c" stop-opacity="0.82"/>
    </radialGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#v)"/>
  <rect width="720" height="1280" fill="url(#r)"/>
</svg>`);

await sharp(alleySrc)
  .extract({
    left: 0,
    top: 0,
    width: alleyMeta.width,
    height: Math.round(alleyMeta.height * 0.52),
  })
  .resize(720, 1280, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 0.85, saturation: 1.3 })
  .composite([{ input: darkVignette, blend: 'over' }])
  .webp({ quality: 82 })
  .toFile('public/bg-alley.webp');

await sharp('public/bg-alley.webp').toFile('bg-alley.webp');

// 2. Create a graphical game Logo emblem (public/logo.webp) — 680x310 with clean transparent background
const centerRaccoon = await sharp(find('card_bomb_firecracker'))
  .resize(190, 190, { fit: 'cover' })
  .composite([
    {
      input: Buffer.from(`<svg width="190" height="190"><circle cx="95" cy="95" r="90" fill="#fff"/></svg>`),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const leftRaccoon = await sharp(find('card_pair_shawarma'))
  .resize(130, 130, { fit: 'cover' })
  .composite([
    {
      input: Buffer.from(`<svg width="130" height="130"><circle cx="65" cy="65" r="61" fill="#fff"/></svg>`),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const rightRaccoon = await sharp(find('card_pair_baron'))
  .resize(130, 130, { fit: 'cover' })
  .composite([
    {
      input: Buffer.from(`<svg width="130" height="130"><circle cx="65" cy="65" r="61" fill="#fff"/></svg>`),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const logoSvg = Buffer.from(`<svg width="680" height="310" viewBox="0 0 680 310" xmlns="http://www.w3.org/2000/svg"></svg>`);

const logoForegroundSvg = Buffer.from(`<svg width="680" height="310" viewBox="0 0 680 310" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff6c2"/>
      <stop offset="50%" stop-color="#ffae2b"/>
      <stop offset="100%" stop-color="#ff5100"/>
    </linearGradient>
    <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#28114d"/>
      <stop offset="100%" stop-color="#120626"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2ec4b6"/>
      <stop offset="50%" stop-color="#ff9f1c"/>
      <stop offset="100%" stop-color="#ff2d95"/>
    </linearGradient>
    <filter id="drop" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- Rings around the 3 medallions -->
  <circle cx="195" cy="115" r="61" fill="none" stroke="#2ec4b6" stroke-width="5" filter="url(#drop)"/>
  <circle cx="485" cy="115" r="61" fill="none" stroke="#ff2d95" stroke-width="5" filter="url(#drop)"/>
  <circle cx="340" cy="100" r="90" fill="none" stroke="#ff9f1c" stroke-width="7" filter="url(#drop)"/>

  <!-- Ribbon banner plate -->
  <g filter="url(#drop)">
    <rect x="44" y="172" width="592" height="92" rx="24" fill="url(#plate)" stroke="url(#rim)" stroke-width="5"/>
    <rect x="54" y="180" width="572" height="76" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"/>
  </g>

  <!-- Main Title -->
  <g filter="url(#drop)">
    <text x="340" y="232" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="52" letter-spacing="3" text-anchor="middle" fill="#090214" stroke="#090214" stroke-width="10" stroke-linejoin="round">СКАЖЕНІ ЄНОТИ</text>
    <text x="340" y="232" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="52" letter-spacing="3" text-anchor="middle" fill="url(#gold)">СКАЖЕНІ ЄНОТИ</text>
  </g>

  <!-- Subtitle pill -->
  <g filter="url(#drop)">
    <rect x="200" y="250" width="280" height="38" rx="19" fill="#ff2d95" stroke="#fff3b0" stroke-width="2.5"/>
    <text x="340" y="275" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="21" letter-spacing="4" text-anchor="middle" fill="#ffffff">НІЧНИЙ ДОЖОР</text>
  </g>
</svg>`);

await sharp(logoSvg)
  .composite([
    { input: leftRaccoon, left: 130, top: 50 },
    { input: rightRaccoon, left: 420, top: 50 },
    { input: centerRaccoon, left: 245, top: 5 },
    { input: logoForegroundSvg, left: 0, top: 0 },
  ])
  .webp({ quality: 88 })
  .toFile('public/logo.webp');

await sharp('public/logo.webp').toFile('logo.webp');
console.log('Generated bg-alley.webp and logo.webp!');
