<script lang="ts">
  import { onMount } from 'svelte';
  import { PRESET_OPTIONS, type ExplorePreset } from '$lib/data/presets';
  import SoundToggle from './SoundToggle.svelte';

  type Props = {
    value: ExplorePreset;
    disabledIds?: ExplorePreset[];
    processActive?: boolean;
    forceMute?: boolean;
    /** Fade out explore chrome (e.g. gallery full-size zoom). */
    faded?: boolean;
    onchange: (preset: ExplorePreset) => void;
    onprocesstoggle: () => void;
    /** Notify parent when explore/sound tips are visible (hide reset overlap). */
    ontipchange?: (visible: boolean) => void;
  };

  let {
    value,
    disabledIds = [],
    processActive = false,
    forceMute = false,
    faded = false,
    onchange,
    onprocesstoggle,
    ontipchange,
  }: Props = $props();

  let tipVisible = $state(true);
  let soundTipVisible = $state(false);

  const showTip = $derived(tipVisible && !faded);
  const anyTipVisible = $derived(showTip || soundTipVisible);

  $effect(() => {
    ontipchange?.(anyTipVisible);
    return () => ontipchange?.(false);
  });

  function dismissTip() {
    tipVisible = false;
  }

  function select(id: ExplorePreset) {
    if (disabledIds.includes(id)) return;
    if (!processActive && id === value) return;
    tipVisible = false;
    onchange(id);
  }

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissTip();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
</script>

<div
  class="chrome"
  class:faded
  role="toolbar"
  aria-label="Explore controls"
  aria-hidden={faded}
>
  {#if showTip}
    <button
      type="button"
      class="tip"
      aria-live="polite"
      onclick={dismissTip}
    >
      Choose 1 of 4 presets for exploring the gallery
      <span class="tip-arrow" aria-hidden="true"></span>
    </button>
  {/if}

  <span class="eyebrow">Explore</span>
  <div class="row">
    {#each PRESET_OPTIONS as option (option.id)}
      {@const disabled = disabledIds.includes(option.id)}
      <button
        type="button"
        class="preset"
        class:active={!processActive && option.id === value}
        aria-pressed={!processActive && option.id === value}
        aria-label="{option.label} explore mode"
        disabled={disabled}
        title={disabled ? 'Unavailable with reduced motion' : option.label}
        onclick={() => select(option.id)}
      >
        <span class="glyph" aria-hidden="true" data-preset={option.id}>
          {#if option.id === 'tunnel'}
            <svg viewBox="0 0 32 24" fill="none">
              <path d="M4 20 L12 6 H20 L28 20" stroke="currentColor" stroke-width="1.4" />
              <path d="M9 20 L13 11 H19 L23 20" stroke="currentColor" stroke-width="1.4" />
              <rect x="13.5" y="12" width="5" height="5" stroke="currentColor" stroke-width="1.3" />
            </svg>
          {:else if option.id === 'drift'}
            <svg viewBox="0 0 32 24" fill="none">
              <rect x="7" y="4" width="14" height="3.2" rx="1" fill="currentColor" opacity="0.35" />
              <rect x="9" y="10" width="16" height="3.2" rx="1" fill="currentColor" opacity="0.7" />
              <rect x="6" y="16.5" width="12" height="3.2" rx="1" fill="currentColor" />
            </svg>
          {:else if option.id === 'film'}
            <svg viewBox="0 0 32 24" fill="none">
              <rect x="3" y="7" width="6" height="10" rx="1" stroke="currentColor" stroke-width="1.3" />
              <rect x="12" y="5" width="8" height="14" rx="1" stroke="currentColor" stroke-width="1.4" />
              <rect x="23" y="7" width="6" height="10" rx="1" stroke="currentColor" stroke-width="1.3" />
            </svg>
          {:else if option.id === 'gallery'}
            <svg viewBox="0 0 32 24" fill="none">
              <rect x="4.5" y="3.5" width="23" height="17" rx="1.5" stroke="currentColor" stroke-width="1.4" />
              <path d="M16 3.5v17M4.5 12h23" stroke="currentColor" stroke-width="1.35" />
            </svg>
          {/if}
        </span>
        <span class="name">{option.label}</span>
      </button>
    {/each}

    <span class="divider" aria-hidden="true"></span>

    <button
      type="button"
      class="preset process"
      class:active={processActive}
      aria-pressed={processActive}
      aria-label={processActive ? 'Return to gallery' : 'Watch drawing process'}
      title={processActive ? 'Back to gallery' : 'Drawing Process'}
      onclick={onprocesstoggle}
    >
      <span class="glyph" aria-hidden="true">
        <svg viewBox="0 0 32 24" fill="none">
          <path
            d="M20.5 4.5l5 5-12.2 12.2H8.3v-5.1L20.5 4.5z"
            stroke="currentColor"
            stroke-width="1.35"
            stroke-linejoin="round"
          />
          <path d="M18.2 6.8l5 5" stroke="currentColor" stroke-width="1.35" />
          <path d="M8.3 17.6l4.1 4.1" stroke="currentColor" stroke-width="1.2" opacity="0.55" />
        </svg>
      </span>
      <span class="name stacked">Drawing<br />Process</span>
    </button>

    <span class="divider" aria-hidden="true"></span>
    <SoundToggle
      embedded
      forcePaused={forceMute}
      suppressTip={showTip}
      explorePreset={value}
      ontipchange={(visible) => (soundTipVisible = visible)}
    />
  </div>
</div>

<style>
  .chrome {
    position: fixed;
    z-index: 40;
    left: 50%;
    bottom: max(0.85rem, var(--safe-bottom));
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.55rem 0.55rem;
    border-radius: 1.15rem;
    color: var(--parchment);
    background: color-mix(in srgb, var(--void) 62%, transparent);
    border: 1px solid color-mix(in srgb, var(--parchment) 16%, transparent);
    backdrop-filter: blur(10px);
    overflow: visible;
    opacity: 1;
    transition: opacity 0.35s var(--ease-out-expo);
    box-sizing: border-box;
    width: max-content;
    max-width: calc(100vw - 1rem - var(--safe-left) - var(--safe-right));
  }

  .chrome.faded {
    opacity: 0;
    pointer-events: none;
  }

  .tip {
    position: absolute;
    right: calc(100% + 0.85rem);
    left: auto;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: max-content;
    max-width: min(14.5rem, 42vw);
    padding: 0.65rem 0.8rem;
    border-radius: 0.75rem;
    text-align: left;
    font-family: var(--font-body);
    font-size: 0.78rem;
    line-height: 1.35;
    letter-spacing: 0.01em;
    color: var(--parchment);
    background: color-mix(in srgb, var(--void) 72%, transparent);
    border: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 28px color-mix(in srgb, #000 35%, transparent);
    animation: tip-in 0.55s var(--ease-out-expo) both;
    cursor: pointer;
  }

  .tip:hover {
    border-color: color-mix(in srgb, var(--parchment) 32%, transparent);
  }

  .tip-arrow {
    position: absolute;
    top: 50%;
    left: 100%;
    width: 0.7rem;
    height: 0.7rem;
    margin-left: -0.36rem;
    margin-top: -0.35rem;
    background: color-mix(in srgb, var(--void) 72%, transparent);
    border-right: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    border-top: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    transform: rotate(45deg);
  }

  @keyframes tip-in {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(-0.4rem);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chrome {
      transition: none;
    }

    .tip {
      animation: none;
    }
  }

  .eyebrow {
    font-size: 0.62rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--cue);
  }

  .row {
    display: flex;
    align-items: stretch;
    gap: 0.35rem;
    overflow: visible;
  }

  .divider {
    width: 1px;
    margin: 0.2rem 0.25rem;
    background: color-mix(in srgb, var(--parchment) 22%, transparent);
    align-self: stretch;
  }

  .preset {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.28rem;
    min-width: 4.4rem;
    padding: 0.45rem 0.55rem 0.4rem;
    border-radius: 0.8rem;
    color: var(--parchment-muted);
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s var(--ease-out-expo);
  }

  .preset:hover:not(:disabled) {
    color: var(--parchment);
    background: color-mix(in srgb, var(--parchment) 7%, transparent);
  }

  .preset.active {
    color: var(--parchment);
    background: color-mix(in srgb, var(--parchment) 12%, transparent);
  }

  .preset:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .glyph {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 1.75rem;
  }

  .glyph svg {
    width: 100%;
    height: 100%;
  }

  .name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
  }

  .name.stacked {
    max-width: 4.2rem;
    line-height: 1.15;
    text-align: center;
  }

  .preset.process {
    min-width: 4.4rem;
    max-width: 4.6rem;
  }

  @media (max-width: 720px) {
    .tip {
      right: auto;
      left: 50%;
      top: auto;
      /* Clear the floating reset control above the chrome bar */
      bottom: calc(100% + 3.4rem);
      transform: translateX(-50%);
      max-width: min(16.5rem, 78vw);
      animation-name: tip-in-up;
    }

    .tip-arrow {
      top: 100%;
      left: 50%;
      margin-left: -0.35rem;
      margin-top: -0.36rem;
      border-top: none;
      border-right: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
      border-bottom: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    }

    @keyframes tip-in-up {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(0.4rem);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  }

  @media (max-width: 620px) {
    .chrome {
      padding: 0.4rem 0.35rem 0.45rem;
      bottom: max(0.65rem, var(--safe-bottom));
    }

    .row {
      gap: 0.18rem;
    }

    .divider {
      margin: 0.2rem 0.12rem;
    }

    .preset {
      min-width: 3.1rem;
      padding: 0.4rem 0.22rem 0.35rem;
    }

    .name {
      font-size: 0.62rem;
    }

    .name.stacked {
      max-width: 3.2rem;
    }

    .preset.process {
      min-width: 3.1rem;
      max-width: 3.4rem;
    }
  }
</style>
