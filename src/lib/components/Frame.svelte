<script lang="ts">
  import type { Frame as FrameData } from '$lib/data/gallery';
  import ScrollCue from './ScrollCue.svelte';
  import ArtImage from './ArtImage.svelte';

  type Props = {
    frame: FrameData;
    z: number;
    opacity: number;
    blur?: number;
    reducedMotion: boolean;
    priority?: boolean;
  };

  let {
    frame,
    z,
    opacity,
    blur = 0,
    reducedMotion,
    priority = false,
  }: Props = $props();

  const captionAlign = $derived(
    frame.type === 'image'
      ? frame.align === 'left'
        ? 'right'
        : 'left'
      : 'left',
  );
</script>

<div
  class="frame"
  class:frame_bg={frame.type === 'image' || frame.type === 'title'}
  class:flat={reducedMotion}
  style:transform={reducedMotion ? undefined : `translateZ(${z}px)`}
  style:opacity
  style:pointer-events={opacity < 0.04 ? 'none' : undefined}
>
  <div class="frame__content">
    {#if frame.type === 'title'}
      <div class="title-block">
        <h1 class="brand">{frame.brand}</h1>
        <p class="tagline">
          {frame.line}
          <span class="tagline-sub">{frame.subline}</span>
          <span class="tagline-ps">{frame.ps}</span>
        </p>
        {#if !reducedMotion}
          <ScrollCue />
        {/if}
      </div>
    {:else if frame.type === 'image'}
      <div
        class="image-layer"
        class:image-left={frame.align === 'left'}
        class:image-right={frame.align === 'right'}
        class:has-caption={Boolean(frame.caption)}
      >
        <div
          class="frame-media"
          class:landscape={frame.aspect === 'landscape'}
          style:filter={blur > 0.15 ? `blur(${blur}px)` : undefined}
        >
          <ArtImage
            src={frame.src}
            alt={frame.alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            draggable={false}
          />
        </div>

        {#if frame.caption}
          <div class="caption" class:caption-left={captionAlign === 'left'} class:caption-right={captionAlign === 'right'}>
            <h2>{frame.caption.heading}</h2>
            <p>{frame.caption.body}</p>
          </div>
        {/if}
      </div>
    {:else if frame.type === 'credit'}
      <p class="credit">{frame.text}</p>
    {/if}
  </div>
</div>

<style>
  .frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform var(--transition),
      opacity 0.75s ease;
    will-change: transform, opacity;
    transform-style: preserve-3d;
  }

  .frame.flat {
    position: relative;
    inset: auto;
    transform: none !important;
    opacity: 1 !important;
    will-change: auto;
    min-height: min(70vh, 36rem);
  }

  .frame_bg {
    background:
      radial-gradient(
        ellipse 70% 55% at 50% 45%,
        color-mix(in srgb, var(--void-soft) 80%, transparent),
        transparent 70%
      );
  }

  .frame__content {
    width: min(100%, 92rem);
    max-width: 100%;
    min-width: 0;
    height: 100%;
    padding: var(--gutter);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .flat .frame__content {
    height: auto;
    min-height: inherit;
  }

  .title-block {
    max-width: min(100%, 92vw);
    min-width: 0;
    text-align: center;
    animation: rise-in 1.1s var(--ease-out-expo) both;
  }

  .brand {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(2.4rem, calc(var(--index) * 5.4), 8.5rem);
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: var(--brand);
    max-width: min(18ch, 92vw);
    margin-inline: auto;
  }

  .tagline {
    margin-top: 1.1rem;
    max-width: min(36rem, 88vw);
    margin-inline: auto;
    font-size: clamp(0.95rem, calc(var(--index) * 0.95), 1.2rem);
    line-height: 1.45;
    color: var(--tagline);
    letter-spacing: 0.02em;
  }

  .tagline-sub {
    display: block;
    margin-top: 0.35rem;
  }

  .tagline-ps {
    display: block;
    margin-top: 0.45rem;
    font-size: 0.92em;
    color: var(--parchment-faint);
  }

  .image-layer {
    width: 100%;
    display: flex;
    align-items: center;
    gap: clamp(1.25rem, 4vw, 3rem);
  }

  .image-layer.image-left {
    justify-content: flex-start;
  }

  .image-layer.image-right {
    justify-content: flex-end;
  }

  .image-layer.image-left.has-caption {
    flex-direction: row;
  }

  .image-layer.image-right.has-caption {
    flex-direction: row-reverse;
  }

  .frame-media {
    position: relative;
    width: fit-content;
    max-width: min(42vw, calc(var(--index) * var(--side-small)));
    flex: 0 1 auto;
    transition: filter 0.75s var(--ease-out-expo);
    will-change: filter;
  }

  .frame-media.landscape {
    max-width: min(78vw, calc(var(--index) * 52));
  }

  .frame-media :global(img) {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: min(72vh, calc(var(--index) * var(--side-big)));
    border-radius: var(--frame-radius);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--parchment) 8%, transparent),
      0 24px 80px color-mix(in srgb, black 55%, transparent);
    user-select: none;
  }

  .frame-media.landscape :global(img) {
    max-height: min(70vh, calc(var(--index) * 42));
  }

  .caption {
    width: min(22rem, 36vw);
    flex: 0 1 auto;
  }

  .caption h2 {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.75rem, calc(var(--index) * 2.4), 2.75rem);
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 0.85rem;
    color: var(--brand);
  }

  .caption p {
    color: var(--tagline);
  }

  .caption-left {
    text-align: left;
  }

  .caption-right {
    text-align: right;
  }

  .credit {
    max-width: min(28rem, 86vw);
    text-align: center;
    font-size: clamp(0.95rem, 2.2vw, 1.15rem);
    letter-spacing: 0.06em;
    line-height: 1.45;
    color: var(--parchment-faint);
  }

  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(1.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 720px) {
    .image-layer,
    .image-layer.image-left.has-caption,
    .image-layer.image-right.has-caption {
      flex-direction: column;
      justify-content: center;
    }

    .frame-media {
      max-width: min(78vw, calc(var(--index) * var(--side-small)));
    }

    .frame-media.landscape {
      max-width: min(94vw, calc(var(--index) * 52));
    }

    .caption {
      width: min(22rem, 88%);
      text-align: center;
    }

    .caption-left,
    .caption-right {
      text-align: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .title-block {
      animation: none;
    }

    .frame-media {
      filter: none !important;
      transition: none;
    }
  }
</style>
