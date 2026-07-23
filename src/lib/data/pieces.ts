import { resolveArt, imagesAvailable } from './resolveArt';

export type Piece = {
  id: string;
  title: string;
  src: string;
  alt: string;
  align: 'left' | 'right';
  aspect: 'portrait' | 'landscape';
};

export const brand = {
  name: '@Push_Art Gallery',
  line: "Don't rush — take your time and explore my artworks.",
  subline: 'This gallery will be expanded over time.',
  ps: '(P.S. turn on the sound, I spent tons of time sampling it! :D)',
} as const;

export const credit = 'All artwork here made by @Push_Art';

export { imagesAvailable };

/** Shared art list — all explore presets render from this. */
export const pieces: Piece[] = [
  {
    id: 'eastern-dragon',
    title: 'Eastern Dragon',
    src: resolveArt('eastern-dragon.webp'),
    alt: 'Eastern Dragon — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'the-eye',
    title: 'The Eye',
    src: resolveArt('the-eye.webp'),
    alt: 'The Eye — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'ultramarine',
    title: 'Ultramarine',
    src: resolveArt('ultramarine.webp'),
    alt: 'Ultramarine — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'sin-eater',
    title: 'Sin Eater',
    src: resolveArt('sin-eater.webp'),
    alt: 'Sin Eater — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'nemesis-and-mr-x',
    title: 'Nemesis & Mr. X',
    src: resolveArt('nemesis-and-mr-x.webp'),
    alt: 'Nemesis and Mr. X — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'demoness',
    title: 'Demoness',
    src: resolveArt('demoness-main.webp'),
    alt: 'Demoness — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'fish-lord',
    title: 'Fish Lord',
    src: resolveArt('fish-lord.webp'),
    alt: 'Fish Lord — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'smough-and-ornstein',
    title: 'Smough and Ornstein',
    src: resolveArt('smough-and-ornstein.webp'),
    alt: 'Smough and Ornstein — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'pale-demon',
    title: 'Pale Demon',
    src: resolveArt('pale-demon.webp'),
    alt: 'Pale Demon — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'dark-knight',
    title: 'Dark Knight',
    src: resolveArt('dark-knight-main.webp'),
    alt: 'Dark Knight — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'alien-horn',
    title: 'Alien Horn',
    src: resolveArt('alien-horn.webp'),
    alt: 'Alien Horn — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'cerberus',
    title: 'Cerberus',
    src: resolveArt('cerberus.webp'),
    alt: 'Cerberus — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'stalker',
    title: 'Stalker',
    src: resolveArt('stalker.webp'),
    alt: 'Stalker — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'skarbrand',
    title: 'Skarbrand',
    src: resolveArt('skarbrand.webp'),
    alt: 'Skarbrand — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'knight-1',
    title: 'Knight I',
    src: resolveArt('knight-1.webp'),
    alt: 'Knight — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'monk',
    title: 'Monk',
    src: resolveArt('monk.webp'),
    alt: 'Monk — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'leshiy',
    title: 'Leshiy',
    src: resolveArt('leshiy.webp'),
    alt: 'Leshiy — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'undead',
    title: 'Undead',
    src: resolveArt('undead.webp'),
    alt: 'Undead — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
  {
    id: 'minsk-and-boo',
    title: 'Minsk & Boo',
    src: resolveArt('minsk-and-boo.webp'),
    alt: 'Minsk and Boo — original drawing by @Push_Art',
    align: 'left',
    aspect: 'portrait',
  },
  {
    id: 'knight-2',
    title: 'Knight II',
    src: resolveArt('knight-2.webp'),
    alt: 'Knight — original drawing by @Push_Art',
    align: 'right',
    aspect: 'portrait',
  },
];
