<script lang="ts">
  import { onMount } from 'svelte';
  import { pieces, credit } from '$lib/data/pieces';
  import BrandIntro from '../BrandIntro.svelte';
  import ArtImage from '../ArtImage.svelte';

  type ItemStyle = {
    opacity: number;
    transform: string;
    filter: string;
  };

  let listEl = $state<HTMLElement | null>(null);
  let styles = $state<ItemStyle[]>(
    pieces.map(() => ({
      opacity: 1,
      transform: 'translate3d(0, 0, 0) scale(1)',
      filter: 'brightness(1)',
    })),
  );

  /** Smooth scroll back to the brand hero. */
  export function resetToStart() {
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

  onMount(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const root = listEl;
      if (!root) return;

      const items = root.querySelectorAll<HTMLElement>('.item');
      const mid = window.innerHeight / 2;
      const next: ItemStyle[] = [];

      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = (center - mid) / window.innerHeight;
        const abs = Math.min(1.35, Math.abs(dist));
        const opacity = Math.max(0.16, 1 - abs * 1.05);
        const y = dist * -64;
        const scale = 1.05 - Math.min(0.2, abs * 0.26);
        const brightness = 1.04 - abs * 0.35;

        next.push({
          opacity,
          transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
          filter: `brightness(${brightness})`,
        });
      });

      styles = next;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    // Native document scroll — same input path as Tunnel (no wheel hijack / lerp).
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  });
</script>

  <section class="drift" aria-label="@Push_Art Gallery — Drift">
  <header class="hero">
    <BrandIntro />
  </header>

  <ul class="list" bind:this={listEl}>
    {#each pieces as piece, i (piece.id)}
      {@const s = styles[i]}
      <li
        class="item"
        class:left={piece.align === 'left'}
        class:right={piece.align === 'right'}
        style:opacity={s?.opacity ?? 1}
        style:transform={s?.transform ?? 'none'}
        style:filter={s?.filter ?? 'none'}
      >
        <figure class="media" class:landscape={piece.aspect === 'landscape'}>
          <ArtImage
            src={piece.src}
            alt={piece.alt}
            loading={i < 2 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        </figure>
      </li>
    {/each}
  </ul>

  <p class="credit">{credit}</p>
</section>

<style>
  .drift {
    position: relative;
    z-index: 2;
    max-width: 58rem;
    margin: 0 auto;
    padding: 0 var(--gutter) var(--chrome-clearance);
  }

  .hero {
    min-height: var(--vh-full);
    display: grid;
    place-items: center;
  }

  .list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: clamp(4.5rem, 16vh, 9rem);
    padding: 12vh 0;
  }

  .item {
    display: flex;
    will-change: transform, opacity, filter;
    transition:
      transform var(--transition),
      opacity 0.75s ease,
      filter 0.75s ease;
  }

  .item.left {
    justify-content: flex-start;
  }

  .item.right {
    justify-content: flex-end;
  }

  .media {
    width: fit-content;
    max-width: min(100%, calc(var(--index) * var(--side-small)));
  }

  .media.landscape {
    max-width: min(100%, calc(var(--index) * 52));
  }

  .media :global(img) {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: min(72vh, 72dvh, calc(var(--index) * var(--side-big)));
    border-radius: var(--frame-radius);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--parchment) 8%, transparent),
      0 28px 90px color-mix(in srgb, black 55%, transparent);
  }

  .media.landscape :global(img) {
    max-height: min(70vh, 70dvh, calc(var(--index) * 42));
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

  @media (max-width: 720px) {
    .item.left,
    .item.right {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .item {
      transition: none;
      filter: none !important;
      transform: none !important;
      opacity: 1 !important;
    }
  }
</style>
