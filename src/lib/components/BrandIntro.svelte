<script lang="ts">
  import { brand } from '$lib/data/pieces';
  import ScrollCue from './ScrollCue.svelte';

  type Props = {
    showScrollCue?: boolean;
    compact?: boolean;
    cueLabel?: string;
  };

  let { showScrollCue = true, compact = false, cueLabel = 'Scroll' }: Props = $props();
</script>

<div class="title-block" class:compact>
  <h1 class="brand">{brand.name}</h1>
  <p class="tagline">
    {brand.line}
    <span class="tagline-sub">{brand.subline}</span>
    <span class="tagline-ps">{brand.ps}</span>
  </p>
  {#if showScrollCue}
    <ScrollCue label={cueLabel} />
  {/if}
</div>

<style>
  .title-block {
    width: 100%;
    max-width: min(36rem, 92vw);
    min-width: 0;
    margin-inline: auto;
    padding-inline: 0.25rem;
    text-align: center;
    animation: rise-in 1.1s var(--ease-out-expo) both;
  }

  .title-block.compact {
    padding: clamp(2rem, 8vh, 4rem) var(--gutter) 1.5rem;
  }

  .brand {
    font-family: var(--font-display);
    font-weight: 700;
    /* Width-driven so tall phones don't oversize past the viewport */
    font-size: var(--brand-size);
    letter-spacing: -0.03em;
    line-height: 0.98;
    color: var(--brand);
    max-width: 100%;
    margin-inline: auto;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .compact .brand {
    font-size: var(--brand-size-compact);
  }

  .tagline {
    margin-top: 1.1rem;
    max-width: min(36rem, 88vw);
    margin-inline: auto;
    font-size: var(--tagline-size);
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

  @media (prefers-reduced-motion: reduce) {
    .title-block {
      animation: none;
    }
  }
</style>
