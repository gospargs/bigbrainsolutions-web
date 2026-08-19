import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DARK_BG = '#0B0D10';

async function main() {
  // --- 1. Crop logo-full.png to its real content bounding box ---
  // Known exact geometry from the Canva source (2000x2000 canvas):
  //   icon: left=405, top=780, width=565, height=470
  //   wordmark: left=1034, top=894.86, width=632, height=304.28
  // The existing src/assets/logo-full.png is the full untouched 2000x2000 canvas
  // (already alpha-keyed/transparent) -- crop it to the actual combined content box.
  const iconBox = { left: 405, top: 780, width: 565, height: 470 };
  const wordmarkBox = { left: 1034, top: 894.86, width: 632, height: 304.28 };

  const left = iconBox.left;
  const top = Math.min(iconBox.top, wordmarkBox.top);
  const right = Math.max(iconBox.left + iconBox.width, wordmarkBox.left + wordmarkBox.width);
  const bottom = Math.max(iconBox.top + iconBox.height, wordmarkBox.top + wordmarkBox.height);
  const contentWidth = right - left;
  const contentHeight = bottom - top;

  const margin = Math.round(Math.max(contentWidth, contentHeight) * 0.06);
  const cropLeft = Math.max(0, Math.round(left - margin));
  const cropTop = Math.max(0, Math.round(top - margin));
  const cropWidth = Math.round(contentWidth + margin * 2);
  const cropHeight = Math.round(contentHeight + margin * 2);

  console.log('logo-full content crop box:', { cropLeft, cropTop, cropWidth, cropHeight, aspectRatio: (cropWidth / cropHeight).toFixed(2) });

  const fullSrc = path.join(ROOT, 'src/assets/logo-full.png');
  const croppedFull = await sharp(fullSrc)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();
  fs.writeFileSync(fullSrc, croppedFull);

  const meta = await sharp(croppedFull).metadata();
  console.log('logo-full.png is now:', meta.width, 'x', meta.height, '(aspect', (meta.width / meta.height).toFixed(2), ')');

  // --- 2. Regenerate favicon.ico / icon-192 / icon-512 with an OPAQUE dark background baked in ---
  // (apple-touch-icon.png already has this correctly -- verified via raw pixel sampling, left alone)
  const iconMasterSrc = path.join(ROOT, 'src/assets/logo-icon.png');

  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((s) =>
      sharp(iconMasterSrc)
        .resize(s, s, { fit: 'contain', background: DARK_BG })
        .flatten({ background: DARK_BG })
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), icoBuffer);

  await sharp(iconMasterSrc)
    .resize(192, 192, { fit: 'contain', background: DARK_BG })
    .flatten({ background: DARK_BG })
    .png()
    .toFile(path.join(ROOT, 'public/icons/icon-192.png'));

  await sharp(iconMasterSrc)
    .resize(512, 512, { fit: 'contain', background: DARK_BG })
    .flatten({ background: DARK_BG })
    .png()
    .toFile(path.join(ROOT, 'public/icons/icon-512.png'));

  console.log('favicon.ico, icon-192.png, icon-512.png regenerated with opaque dark background.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
