import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW_FULL = 'C:\\Users\\Gordan\\AppData\\Local\\Temp\\logo-full-raw.png';
const RAW_ICON = 'C:\\Users\\Gordan\\AppData\\Local\\Temp\\logo-icon-raw.png';

const DARK_BG = '#0B0D10';
const BG_KEY = [24, 38, 45];
const T1 = 8; // fully transparent below this color-distance
const T2 = 45; // fully opaque above this color-distance

// The Canva exports came back with a baked-in opaque dark-navy fill (verified via pixel
// sampling: alpha=255 uniformly, RGB ~24,38,45), not true alpha transparency as the brief
// assumed. Flagged to the owner; this color-key removes it. Background is a very uniform
// flat fill (confirmed via multi-point sampling) so a distance-threshold key with edge
// despill produces clean results with no visible fringing -- verified visually against
// both light and dark composites before committing to this approach.
async function chromaKey(inputPath) {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dist = Math.sqrt((r - BG_KEY[0]) ** 2 + (g - BG_KEY[1]) ** 2 + (b - BG_KEY[2]) ** 2);
    let alpha;
    if (dist <= T1) alpha = 0;
    else if (dist >= T2) alpha = 255;
    else alpha = Math.round(((dist - T1) / (T2 - T1)) * 255);

    let outR = r, outG = g, outB = b;
    if (alpha > 0 && alpha < 255) {
      const a = alpha / 255;
      outR = Math.max(0, Math.min(255, Math.round((r - BG_KEY[0] * (1 - a)) / a)));
      outG = Math.max(0, Math.min(255, Math.round((g - BG_KEY[1] * (1 - a)) / a)));
      outB = Math.max(0, Math.min(255, Math.round((b - BG_KEY[2] * (1 - a)) / a)));
    }

    const o = p * 4;
    out[o] = outR;
    out[o + 1] = outG;
    out[o + 2] = outB;
    out[o + 3] = alpha;
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function main() {
  fs.mkdirSync(path.join(ROOT, 'src/assets'), { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'public/icons'), { recursive: true });

  console.log('Keying full lockup...');
  const fullKeyed = await chromaKey(RAW_FULL);
  fs.writeFileSync(path.join(ROOT, 'src/assets/logo-full.png'), fullKeyed);

  console.log('Keying icon-only...');
  const iconKeyed = await chromaKey(RAW_ICON);

  // Crop to bounding box (405,780,565,470) + ~10% of longest dim margin, pad to square
  const boxLeft = 405, boxTop = 780, boxW = 565, boxH = 470;
  const margin = Math.round(Math.max(boxW, boxH) * 0.10);
  let cropLeft = boxLeft - margin;
  let cropTop = boxTop - margin;
  let cropW = boxW + margin * 2;
  let cropH = boxH + margin * 2;

  const side = Math.max(cropW, cropH);
  if (cropW < side) { const diff = side - cropW; cropLeft -= Math.round(diff / 2); cropW = side; }
  if (cropH < side) { const diff = side - cropH; cropTop -= Math.round(diff / 2); cropH = side; }

  const canvas = 2000;
  cropLeft = Math.max(0, Math.min(cropLeft, canvas - cropW));
  cropTop = Math.max(0, Math.min(cropTop, canvas - cropH));

  console.log('Icon crop box:', { cropLeft, cropTop, cropW, cropH, side });

  const masterIconBuffer = await sharp(iconKeyed)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(ROOT, 'src/assets/logo-icon.png'), masterIconBuffer);

  // Derived icon assets
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(masterIconBuffer).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer())
  );
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), icoBuffer);

  await sharp(masterIconBuffer)
    .resize(180, 180, { fit: 'contain', background: DARK_BG })
    .flatten({ background: DARK_BG })
    .png()
    .toFile(path.join(ROOT, 'public/apple-touch-icon.png'));

  await sharp(masterIconBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ROOT, 'public/icons/icon-192.png'));

  await sharp(masterIconBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ROOT, 'public/icons/icon-512.png'));

  console.log('Done. Master icon size:', cropW, 'x', cropH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
