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
    text-align: center;
    animation: rise-in 1.1s var(--ease-out-expo) both;
  }

  .title-block.compact {
    padding: clamp(2rem, 8vh, 4rem) var(--gutter) 1.5rem;
  }

  .brand {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(2.4rem, calc(var(--index) * 4.6), 5.75rem);
    letter-spacing: -0.03em;
    line-height: 0.98;
    color: var(--brand);
    max-width: min(18ch, 92vw);
    margin-inline: auto;
  }

  .compact .brand {
    font-size: clamp(2rem, calc(var(--index) * 3.8), 4.25rem);
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
