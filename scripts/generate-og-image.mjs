import sharp from 'sharp';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DARK_BG = '#0B0D10';

async function main() {
  const logo = await sharp(path.join(ROOT, 'src/assets/logo-full.png'))
    .resize(1000, 300, { fit: 'inside' })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  await sharp({ create: { width: 1200, height: 630, channels: 4, background: DARK_BG } })
    .composite([
      {
        input: logo,
        left: Math.round((1200 - logoMeta.width) / 2),
        top: Math.round((630 - logoMeta.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(ROOT, 'src/assets/og/og-default.png'));

  console.log('OG image generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
