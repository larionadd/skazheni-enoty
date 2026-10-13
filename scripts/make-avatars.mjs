// Generates 5 high-contrast, centered raccoon character avatar portraits (256x256 WebP)
// into public/avatars/ and avatars/ from the 512x512 comic card illustrations.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/avatars', { recursive: true });
mkdirSync('avatars', { recursive: true });

const specs = [
  {
    out: 'raccoon-1.webp',
    src: 'public/cards/shawarma.webp',
    crop: { left: 225, top: 48, width: 195, height: 195 },
  },
  {
    out: 'raccoon-2.webp',
    src: 'public/cards/baron.webp',
    crop: { left: 168, top: 45, width: 195, height: 195 },
  },
  {
    out: 'raccoon-3.webp',
    src: 'public/cards/punk.webp',
    crop: { left: 58, top: 6, width: 410, height: 410 },
  },
  {
    out: 'raccoon-4.webp',
    src: 'public/cards/hoodie.webp',
    crop: { left: 52, top: 18, width: 410, height: 410 },
  },
  {
    out: 'raccoon-5.webp',
    src: 'public/cards/radar.webp',
    crop: { left: 215, top: 68, width: 200, height: 200 },
  },
];

for (const s of specs) {
  const buf = await sharp(s.src)
    .extract(s.crop)
    .resize(256, 256)
    .modulate({ saturation: 1.15 })
    .webp({ quality: 92 })
    .toBuffer();

  await sharp(buf).toFile(`public/avatars/${s.out}`);
  await sharp(buf).toFile(`avatars/${s.out}`);
}

console.log('Generated 5 raccoon avatars!');
