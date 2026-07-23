<script lang="ts">
  type Props = {
    visible: boolean;
  };

  let { visible }: Props = $props();
</script>

{#if visible}
  <div class="loader" role="status" aria-live="polite">
    <p>Loading</p>
  </div>
{/if}

<style>
  .loader {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: var(--void);
  }

  .loader p {
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-size: 0.8rem;
    color: var(--parchment-muted);
    animation: breath 1.4s ease-in-out infinite;
  }

  @keyframes breath {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loader p {
      animation: none;
      opacity: 0.8;
    }
  }
</style>
