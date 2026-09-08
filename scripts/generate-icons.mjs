import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'));

async function main() {
  await sharp(svg, { density: 384 }).resize(192, 192).png().toFile(join(publicDir, 'pwa-192.png'));
  await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(join(publicDir, 'pwa-512.png'));

  // Maskable variant: shrink the artwork into the safe zone (inner ~80%) on a solid backdrop.
  const maskableSize = 512;
  const inner = Math.round(maskableSize * 0.7);
  const artwork = await sharp(svg, { density: 384 }).resize(inner, inner).toBuffer();
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 11, g: 14, b: 26, alpha: 1 },
    },
  })
    .composite([{ input: artwork, gravity: 'center' }])
    .png()
    .toFile(join(publicDir, 'pwa-maskable-512.png'));

  console.log('Icons generated.');
}

main();
