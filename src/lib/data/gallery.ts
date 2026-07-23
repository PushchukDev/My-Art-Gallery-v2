import { brand, credit, pieces } from './pieces';

export type TitleFrame = {
  type: 'title';
  brand: string;
  line: string;
  subline: string;
  ps: string;
};

export type ImageCaption = {
  heading: string;
  body: string;
};

export type ImageFrame = {
  type: 'image';
  src: string;
  alt: string;
  align: 'left' | 'right';
  aspect: 'portrait' | 'landscape';
  /** Optional note shown on the same depth layer as the image. */
  caption?: ImageCaption;
};

export type CreditFrame = {
  type: 'credit';
  text: string;
};

export type Frame = TitleFrame | ImageFrame | CreditFrame;

function imageFrame(
  id: string,
  caption?: ImageCaption,
): ImageFrame {
  const piece = pieces.find((p) => p.id === id);
  if (!piece) {
    throw new Error(`Unknown piece id: ${id}`);
  }
  return {
    type: 'image',
    src: piece.src,
    alt: piece.alt,
    align: piece.align,
    aspect: piece.aspect,
    caption,
  };
}

/** Captions keyed by piece index — rendered beside that image, not as a separate stop. */
const captionsByIndex: Record<number, ImageCaption> = {
  3: {
    heading: 'Ink first',
    body: 'Every piece begins on the page — line, weight, and patience before color ever arrives.',
  },
  9: {
    heading: 'Characters that linger',
    body: 'Creatures, knights, and strangers from games and myths, redrawn until they feel like my own.',
  },
  15: {
    heading: 'Keep drawing',
    body: 'This corridor is a living sketchbook. More pages will join the walk.',
  },
};

/** Tunnel walk — one depth layer per image (caption shares that layer). */
export const frames: Frame[] = [
  {
    type: 'title',
    brand: brand.name,
    line: brand.line,
    subline: brand.subline,
    ps: brand.ps,
  },
  ...pieces.map((piece, index) => imageFrame(piece.id, captionsByIndex[index])),
  {
    type: 'credit',
    text: credit,
  },
];

/** Tighter spacing so opening pieces sit closer behind the title. */
export const Z_SPACING = -560;
