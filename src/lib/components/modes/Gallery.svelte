<script lang="ts">
  import { onMount } from 'svelte';
  import { pieces, credit } from '$lib/data/pieces';
  import BrandIntro from '../BrandIntro.svelte';
  import ArtImage from '../ArtImage.svelte';

  type Props = {
    onzoomchange?: (open: boolean) => void;
  };

  let { onzoomchange }: Props = $props();

  let activeId = $state<string | null>(null);

  const activePiece = $derived(
    activeId ? (pieces.find((piece) => piece.id === activeId) ?? null) : null,
  );

  $effect(() => {
    const open = activeId != null;
    onzoomchange?.(open);
    return () => onzoomchange?.(false);
  });

  function closeZoom() {
    activeId = null;
  }

  /** Close zoom and ease back to the gallery hero. */
  export function resetToStart() {
    closeZoom();
    const start = window.scrollY || document.documentElement.scrollTop;
    if (start < 2) {
      window.scrollTo(0, 0);
      return;
    }

    const duration = Math.min(900, 320 + start * 0.35);
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, start * (1 - e));
      if (t < 1) raf = requestAnimationFrame(frame);
      else window.scrollTo(0, 0);
    };

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function onCellClick(id: string) {
    activeId = activeId === id ? null : id;
  }

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoom();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
</script>

<section class="gallery-mode" aria-label="@Push_Art Gallery — Gallery">
  <header class="hero">
    <BrandIntro />
  </header>

  <ul class="grid">
    {#each pieces as piece, i (piece.id)}
      <li class="cell">
        <button
          type="button"
          class="thumb"
          class:active={activeId === piece.id}
          aria-label="View {piece.title}"
          aria-expanded={activeId === piece.id}
          onclick={() => onCellClick(piece.id)}
        >
          <ArtImage
            src={piece.src}
            alt={piece.alt}
            loading={i < 6 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        </button>
      </li>
    {/each}
  </ul>

  <p class="credit">{credit}</p>
</section>

{#if activePiece}
  <div
    class="zoom"
    role="dialog"
    aria-modal="true"
    aria-label={activePiece.title}
    tabindex="-1"
  >
    <button
      type="button"
      class="zoom-scrim"
      aria-label="Close full-size view"
      onclick={closeZoom}
    ></button>
    <button type="button" class="zoom-frame" aria-label="Close {activePiece.title}" onclick={closeZoom}>
      <ArtImage
        class="zoom-image"
        src={activePiece.src}
        alt={activePiece.alt}
        draggable={false}
      />
    </button>
  </div>
{/if}

<style>
  .gallery-mode {
    position: relative;
    z-index: 2;
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 var(--gutter) 8rem;
  }

  .hero {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding-block: 4rem;
  }

  .grid {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .cell {
    min-width: 0;
  }

  .thumb {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: var(--frame-radius);
    cursor: zoom-in;
    transition:
      filter 0.25s var(--ease-out-expo),
      transform 0.25s var(--ease-out-expo);
  }

  .thumb :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .thumb:hover,
  .thumb.active {
    filter: brightness(1.08);
    transform: scale(1.02);
  }

  .credit {
    margin-top: 3rem;
    max-width: min(28rem, 86vw);
    margin-inline: auto;
    text-align: center;
    font-size: clamp(0.95rem, 2.2vw, 1.15rem);
    letter-spacing: 0.06em;
    line-height: 1.45;
    color: var(--parchment-faint);
  }

  .zoom {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: clamp(1rem, 3vw, 2rem);
    pointer-events: auto;
    cursor: zoom-out;
    animation: zoom-in 0.28s var(--ease-out-expo) both;
  }

  .zoom-scrim {
    position: absolute;
    inset: 0;
    border-radius: 0;
    background: color-mix(in srgb, var(--void-ink) 78%, transparent);
    backdrop-filter: blur(6px);
    cursor: zoom-out;
  }

  .zoom-frame {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    max-width: min(94vw, 100%);
    max-height: min(82vh, 100%);
    cursor: zoom-out;
  }

  .zoom-frame :global(.zoom-image) {
    width: auto;
    height: auto;
    max-width: min(94vw, 100%);
    max-height: min(82vh, 100%);
    border-radius: var(--frame-radius);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--parchment) 10%, transparent),
      0 28px 90px color-mix(in srgb, black 60%, transparent);
  }

  @keyframes zoom-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .thumb,
    .zoom {
      animation: none;
      transition: none;
    }

    .thumb:hover,
    .thumb.active {
      transform: none;
    }
  }
</style>
