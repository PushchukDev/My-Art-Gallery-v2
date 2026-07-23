import placeholderArt from '../../assets/placeholders/missing-art.svg';

/** Eager catalog of committed/local WebPs (empty when assets are not present). */
const catalog = import.meta.glob('../../assets/images/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/** True when at least one gallery WebP was found at build time. */
export const imagesAvailable = Object.keys(catalog).length > 0;

export const PLACEHOLDER_ART = placeholderArt;

/** Resolve a file under `src/assets/images/`, or the shared placeholder. */
export function resolveArt(filename: string): string {
  const key = `../../assets/images/${filename}`;
  return catalog[key] ?? placeholderArt;
}

export function isPlaceholderArt(src: string): boolean {
  return src === placeholderArt;
}
