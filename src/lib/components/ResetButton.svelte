<script lang="ts">
  type Props = {
    faded?: boolean;
    onclick: () => void;
  };

  let { faded = false, onclick }: Props = $props();
</script>

<button
  type="button"
  class="reset"
  class:faded
  aria-label="Reset to start"
  title="Reset"
  aria-hidden={faded}
  disabled={faded}
  {onclick}
>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path
      d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
    <path
      d="M4 4.5v5h5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</button>

<style>
  .reset {
    position: fixed;
    z-index: 45;
    /* Sit just above the Explore chrome bar (clear of its height) */
    bottom: clamp(7.6rem, 13.5vh, 9rem);
    left: 50%;
    top: auto;
    transform: translateX(-50%);
    width: 2.65rem;
    height: 2.65rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    color: var(--parchment);
    background: color-mix(in srgb, var(--void) 62%, transparent);
    border: 1px solid color-mix(in srgb, var(--parchment) 16%, transparent);
    backdrop-filter: blur(10px);
    transition:
      opacity 0.35s var(--ease-out-expo),
      border-color 0.2s ease,
      background 0.2s ease,
      transform 0.25s var(--ease-out-expo);
  }

  .reset:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--parchment) 40%, transparent);
    background: color-mix(in srgb, var(--parchment) 10%, transparent);
    transform: translateX(-50%) scale(1.04);
  }

  .reset.faded {
    opacity: 0;
    pointer-events: none;
  }

  .reset:active:not(:disabled) {
    transform: translateX(-50%) scale(0.96) rotate(-25deg);
  }

  @media (max-width: 620px) {
    .reset {
      bottom: clamp(8.2rem, 16vh, 9.5rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reset {
      transition: border-color 0.2s ease, background 0.2s ease;
    }

    .reset:active:not(:disabled) {
      transform: translateX(-50%);
    }
  }
</style>
