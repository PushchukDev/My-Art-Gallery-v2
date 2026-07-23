import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  ARTIST,
  ARTIST_EMAIL,
  withArtistMetadata,
} from './optimize-images.mjs';

/**
 * Re-encode existing WebPs in src/assets/images with @Push_Art authorship EXIF.
 * Does not resize; uses high WebP quality to limit generation loss.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, '..', 'src', 'assets', 'images');

const webps = fs
  .readdirSync(imgDir)
  .filter((f) => f.toLowerCase().endsWith('.webp'));

if (webps.length === 0) {
  console.error(`No WebPs found in ${imgDir}`);
  process.exit(1);
}

for (const file of webps) {
  const input = path.join(imgDir, file);
  const tmp = path.join(imgDir, `.${file}.tmp.webp`);

  try {
    await withArtistMetadata(sharp(input))
      .webp({ quality: 90, effort: 6 })
      .toFile(tmp);

    fs.renameSync(tmp, input);
  } catch (err) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw err;
  }

  const meta = await sharp(input).metadata();
  console.log(
    `stamped ${file}  ${meta.width}x${meta.height}  artist=${ARTIST}  ${ARTIST_EMAIL}`,
  );
}

console.log(`Done. Stamped ${webps.length} images.`);
