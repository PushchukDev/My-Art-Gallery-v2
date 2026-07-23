/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}
