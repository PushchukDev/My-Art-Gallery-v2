import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Convert PNGs in src/assets/images → kebab-case WebP (max edge 2560).
 * Embeds @Push_Art + contact email in EXIF on every encode.
 * Deletes source PNGs after a successful encode when REMOVE_PNG=1 (default).
 * Override with MAX_EDGE=1600 npm run optimize:images
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imgDir = path.join(root, 'src', 'assets', 'images');
const removePng = process.env.REMOVE_PNG !== '0';
const maxEdge = Number(process.env.MAX_EDGE) || 2560;

export const ARTIST = '@Push_Art';
export const ARTIST_EMAIL = 'push_art228@gmail.com';
export const COPYRIGHT = `© ${ARTIST} — ${ARTIST_EMAIL}. All rights reserved.`;

/** Attach authorship EXIF used by optimize + stamp scripts. */
export function withArtistMetadata(pipeline) {
  return pipeline.withMetadata({
    exif: {
      IFD0: {
        Copyright: COPYRIGHT,
        Artist: `${ARTIST} <${ARTIST_EMAIL}>`,
        ImageDescription: `Original artwork by ${ARTIST} (${ARTIST_EMAIL})`,
      },
    },
  });
}

function slugify(name) {
  return name
    .replace(/\.png$/i, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const pngs = fs
    .readdirSync(imgDir)
    .filter((f) => f.toLowerCase().endsWith('.png'));

  if (pngs.length === 0) {
    console.error(`No PNGs found in ${imgDir}`);
    process.exit(1);
  }

  for (const file of pngs) {
    const input = path.join(imgDir, file);
    const slug = slugify(file);
    const output = path.join(imgDir, `${slug}.webp`);

    const meta = await sharp(input).metadata();
    const needsResize =
      (meta.width ?? 0) > maxEdge || (meta.height ?? 0) > maxEdge;

    let pipeline = sharp(input).rotate();
    if (needsResize) {
      pipeline = pipeline.resize({
        width: maxEdge,
        height: maxEdge,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    await withArtistMetadata(pipeline)
      .webp({ quality: 85, effort: 6 })
      .toFile(output);

    const before = fs.statSync(input).size;
    const after = fs.statSync(output).size;
    console.log(
      `${file} → ${slug}.webp  ${(before / 1e6).toFixed(2)}MB → ${(after / 1e3).toFixed(0)}KB`,
    );

    if (removePng) fs.unlinkSync(input);
  }

  console.log('Done.');
}
