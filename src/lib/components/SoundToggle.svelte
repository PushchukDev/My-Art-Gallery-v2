<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { ExplorePreset } from '$lib/data/presets';
  import {
    attachAmbientElement,
    isAmbientPlaying,
    pauseAmbient,
    playAmbient,
  } from '$lib/audio/ambient';

  type Props = {
    /** Sit in the chrome bar next to presets instead of floating alone. */
    embedded?: boolean;
    /** Pause ambient while another scene (e.g. process video) owns audio. */
    forcePaused?: boolean;
    /** Hide tip while another chrome tip (e.g. explore presets) is visible. */
    suppressTip?: boolean;
    /** Re-show the tip when the explore preset changes. */
    explorePreset?: ExplorePreset | null;
    /** Notify parent when the sound tip is shown/hidden (for chrome layout). */
    ontipchange?: (visible: boolean) => void;
  };

  let {
    embedded = false,
    forcePaused = false,
    suppressTip = false,
    explorePreset = null,
    ontipchange,
  }: Props = $props();

  let audio = $state<HTMLAudioElement | null>(null);
  let playing = $state(false);
  let userPaused = $state(true);
  let resumeAfterForce = $state(false);
  let tipVisible = $state(true);
  let tipFlip = $state(false);
  let tipEl = $state<HTMLButtonElement | null>(null);
  let wrapEl = $state<HTMLDivElement | null>(null);
  let trackedPreset = $state<ExplorePreset | null>(null);
  let attached = false;
  let audioAvailable = $state(true);

  const audioSrc = `${import.meta.env.BASE_URL}media/push_art_gallery_2.mp3`;
  const showTip = $derived(tipVisible && !forcePaused && !suppressTip && audioAvailable);

  $effect(() => {
    ontipchange?.(showTip);
    return () => ontipchange?.(false);
  });

  function dismissTip() {
    tipVisible = false;
  }

  function placeTip() {
    const tip = tipEl;
    const wrap = wrapEl;
    if (!tip || !wrap || !showTip) return;

    tipFlip = false;

    requestAnimationFrame(() => {
      if (!tipEl || !wrapEl) return;
      const tipRect = tipEl.getBoundingClientRect();
      const edgePad = 12;
      tipFlip = tipRect.right > window.innerWidth - edgePad;
    });
  }

  function syncAttached() {
    if (!audio || attached || !audioAvailable) return;
    attachAmbientElement(audio);
    attached = true;
  }

  onMount(() => {
    tipVisible = true;

    void fetch(audioSrc, { method: 'HEAD' })
      .then((res) => {
        audioAvailable = res.ok;
        if (audioAvailable) syncAttached();
      })
      .catch(() => {
        audioAvailable = false;
      });

    const onFocus = () => {
      if (!audioAvailable || userPaused || document.body.dataset.explore === 'process') return;
      void playAmbient()
        .then(() => {
          playing = true;
        })
        .catch(() => {});
    };
    const onBlur = () => {
      pauseAmbient();
      playing = false;
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      pauseAmbient();
    };
  });

  $effect(() => {
    if (audio) syncAttached();
  });

  $effect(() => {
    const preset = explorePreset;
    if (preset == null) return;

    if (trackedPreset === null) {
      trackedPreset = preset;
      return;
    }

    if (preset !== trackedPreset) {
      trackedPreset = preset;
      tipVisible = true;
    }
  });

  $effect(() => {
    if (!showTip) {
      tipFlip = false;
      return;
    }

    void tick().then(placeTip);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissTip();
    };
    const onResize = () => placeTip();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  });

  $effect(() => {
    if (!audio) return;

    if (forcePaused) {
      if (isAmbientPlaying()) {
        resumeAfterForce = !userPaused;
        pauseAmbient();
        playing = false;
      }
      return;
    }

    if (resumeAfterForce && !userPaused) {
      resumeAfterForce = false;
      void playAmbient()
        .then(() => {
          playing = true;
        })
        .catch(() => {
          playing = false;
          userPaused = true;
        });
    }
  });

  async function toggle() {
    if (!audio || forcePaused || !audioAvailable) return;

    dismissTip();
    syncAttached();

    if (!isAmbientPlaying()) {
      try {
        await playAmbient();
        playing = true;
        userPaused = false;
      } catch {
        playing = false;
        userPaused = true;
        audioAvailable = false;
      }
    } else {
      pauseAmbient();
      playing = false;
      userPaused = true;
    }
  }
</script>

<div class="sound-wrap" class:embedded bind:this={wrapEl}>
  {#if showTip}
    <button
      type="button"
      class="tip"
      class:flip={tipFlip}
      bind:this={tipEl}
      aria-live="polite"
      onclick={dismissTip}
    >
      Press this, if you want to Enhance your experience!
      <span class="tip-arrow" aria-hidden="true"></span>
    </button>
  {/if}

  <button
    type="button"
    class="sound"
    class:embedded
    class:playing
    class:pulse={!playing && !forcePaused && audioAvailable}
    aria-pressed={playing}
    aria-label={
      !audioAvailable
        ? 'Ambient audio unavailable'
        : playing
          ? 'Mute ambient audio'
          : 'Play ambient audio'
    }
    title={!audioAvailable ? 'Audio file missing — see README for local setup' : undefined}
    disabled={forcePaused || !audioAvailable}
    onclick={toggle}
  >
    <span class="icon" aria-hidden="true">
      {#if playing}
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M4 10v4h3l4 3V7l-4 3H4z" fill="currentColor" stroke="none" />
          <path d="M15 9.5a4 4 0 0 1 0 5" />
          <path d="M17.5 7a7 7 0 0 1 0 10" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M4 10v4h3l4 3V7l-4 3H4z" fill="currentColor" stroke="none" />
          <path d="M16 9l5 6M21 9l-5 6" />
        </svg>
      {/if}
    </span>
  </button>
</div>

<audio
  bind:this={audio}
  src={audioSrc}
  loop
  preload="none"
  onerror={() => {
    audioAvailable = false;
  }}
></audio>

<style>
  .sound-wrap {
    position: relative;
    display: grid;
    place-items: center;
  }

  .sound-wrap.embedded {
    flex: 0 0 auto;
    align-self: center;
  }

  .sound-wrap:not(.embedded) {
    position: fixed;
    z-index: 40;
    right: clamp(1rem, 3vw, 1.75rem);
    bottom: clamp(1rem, 3vw, 1.75rem);
  }

  .tip {
    position: absolute;
    bottom: calc(100% + 0.85rem);
    left: 0;
    right: auto;
    z-index: 2;
    width: max-content;
    max-width: min(16.5rem, 72vw);
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

  .tip.flip {
    left: auto;
    right: 0;
  }

  .tip:hover {
    border-color: color-mix(in srgb, var(--parchment) 32%, transparent);
  }

  .tip-arrow {
    position: absolute;
    top: 100%;
    left: 1rem;
    right: auto;
    width: 0.7rem;
    height: 0.7rem;
    margin-top: -0.36rem;
    background: color-mix(in srgb, var(--void) 72%, transparent);
    border-right: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    transform: rotate(45deg);
  }

  .tip.flip .tip-arrow {
    left: auto;
    right: 1rem;
  }

  .sound {
    width: 3rem;
    height: 3rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    color: var(--parchment);
    background: color-mix(in srgb, var(--void) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--parchment) 18%, transparent);
    backdrop-filter: blur(8px);
    transition:
      border-color 0.3s ease,
      background 0.3s ease,
      transform 0.3s var(--ease-out-expo);
  }

  .sound.embedded {
    width: 2.65rem;
    height: 2.65rem;
    background: color-mix(in srgb, var(--parchment) 6%, transparent);
  }

  .sound:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--parchment) 40%, transparent);
    transform: scale(1.04);
  }

  .sound:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sound.pulse {
    animation: mute-pulse 2.8s ease-in-out infinite;
  }

  .icon {
    display: grid;
    place-items: center;
  }

  @keyframes tip-in {
    from {
      opacity: 0;
      transform: translateY(0.4rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes mute-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--warm-edge) 0%, transparent);
    }
    50% {
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--warm-edge) 18%, transparent);
    }
  }

  @media (max-width: 720px) {
    .sound-wrap.embedded .tip {
      /* Sit above the reset control that floats over the chrome */
      bottom: calc(100% + 3.4rem);
      max-width: min(14rem, 70vw);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sound.pulse {
      animation: none;
    }

    .tip {
      animation: none;
    }
  }
</style>
