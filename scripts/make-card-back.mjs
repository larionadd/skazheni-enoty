import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const files = readdirSync('art');
const uiFile = path.join('art', files.find((x) => x.startsWith('rabid_raccoons_mobile_ui')));
const meta = await sharp(uiFile).metadata();
const k = meta.width / 768;

// Extract the glowing neon trash can with sparking firecracker from the center-left of the concept art
// (around x: 118..368, y: 405..670 in 768x1365 space, avoiding text at top and bottom)
const emblemCrop = {
  left: Math.round(145 * k),
  top: Math.round(555 * k),
  width: Math.round(210 * k),
  height: Math.round(210 * k),
};

const centerArt = await sharp(uiFile)
  .extract(emblemCrop)
  .resize(280, 280, { fit: 'cover' })
  .toBuffer();

// Create a rich comic-style 360x504 card back frame with neon gradients, halftone dots, corner badges, and radial burst
const svgFrame = Buffer.from(`<svg width="360" height="504" viewBox="0 0 360 504" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2b1055"/>
      <stop offset="50%" stop-color="#15072b"/>
      <stop offset="100%" stop-color="#090314"/>
    </linearGradient>
    <linearGradient id="neonBorder" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff9f1c"/>
      <stop offset="50%" stop-color="#ff2d95"/>
      <stop offset="100%" stop-color="#2ec4b6"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff2d95" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#a06bff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="diag" width="24" height="24" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="12" height="24" fill="#ffffff" fill-opacity="0.03"/>
    </pattern>
  </defs>

  <!-- Outer card body -->
  <rect x="4" y="4" width="352" height="496" rx="26" fill="url(#bg)" stroke="url(#neonBorder)" stroke-width="8"/>
  <rect x="16" y="16" width="328" height="472" rx="18" fill="url(#diag)" stroke="#ff9f1c" stroke-width="2.5" stroke-dasharray="10 6" stroke-opacity="0.7"/>
  <rect x="24" y="24" width="312" height="456" rx="14" fill="none" stroke="#2ec4b6" stroke-width="1.5" stroke-opacity="0.45"/>

  <!-- Comic sunburst rays -->
  <circle cx="180" cy="252" r="170" fill="url(#glow)"/>
  <g stroke="#ff9f1c" stroke-opacity="0.22" stroke-width="3">
    <line x1="180" y1="50" x2="180" y2="454"/>
    <line x1="40" y1="252" x2="320" y2="252"/>
    <line x1="60" y1="110" x2="300" y2="394"/>
    <line x1="300" y1="110" x2="60" y2="394"/>
  </g>

  <!-- Corner ornaments -->
  <g fill="#1a0b33" stroke="#ff9f1c" stroke-width="2.5">
    <circle cx="48" cy="48" r="18"/>
    <circle cx="312" cy="48" r="18"/>
    <circle cx="48" cy="456" r="18"/>
    <circle cx="312" cy="456" r="18"/>
  </g>
  <g fill="#ff9f1c" font-family="Segoe UI Emoji, sans-serif" font-size="18" text-anchor="middle" dominant-baseline="central">
    <text x="48" y="49">🦝</text>
    <text x="312" y="49">🧨</text>
    <text x="48" y="457">🧨</text>
    <text x="312" y="457">🦝</text>
  </g>

  <!-- Top & bottom banners -->
  <rect x="78" y="34" width="204" height="28" rx="14" fill="#140726" stroke="#ff2d95" stroke-width="2"/>
  <text x="180" y="53" fill="#ff9f1c" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="15" letter-spacing="2" text-anchor="middle">СКАЖЕНІ ЄНОТИ</text>

  <rect x="78" y="442" width="204" height="28" rx="14" fill="#140726" stroke="#2ec4b6" stroke-width="2"/>
  <text x="180" y="461" fill="#2ec4b6" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="14" letter-spacing="2" text-anchor="middle">НІЧНИЙ ДОЖОР</text>
</svg>`);

// Mask the center illustration into a glowing circular medallion
const circleMask = Buffer.from(
  `<svg width="240" height="240"><circle cx="120" cy="120" r="116" fill="#fff"/></svg>`
);
const roundedCenter = await sharp(centerArt)
  .resize(240, 240, { fit: 'cover' })
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const ringOverlay = Buffer.from(
  `<svg width="256" height="256">
    <circle cx="128" cy="128" r="120" fill="none" stroke="#0d051a" stroke-width="10"/>
    <circle cx="128" cy="128" r="120" fill="none" stroke="#ff9f1c" stroke-width="5"/>
    <circle cx="128" cy="128" r="113" fill="none" stroke="#2ec4b6" stroke-width="2"/>
  </svg>`
);

await sharp(svgFrame)
  .composite([
    { input: roundedCenter, left: 60, top: 132 },
    { input: ringOverlay, left: 52, top: 124 },
  ])
  .webp({ quality: 86 })
  .toFile('public/cards/back.webp');

await sharp('public/cards/back.webp').toFile('cards/back.webp');
console.log('Generated card back!');
