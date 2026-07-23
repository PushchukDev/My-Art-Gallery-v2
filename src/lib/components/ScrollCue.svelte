<script lang="ts">
  type Props = {
    label?: string;
  };

  let { label = 'Scroll' }: Props = $props();
</script>

<div class="scroll-cue" aria-hidden="true">
  <span class="text">{label}</span>
  <span class="arrow">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M12 4v14M6 12l6 6 6-6"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</div>

<style>
  .scroll-cue {
    margin-top: 2.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    color: var(--cue);
    animation: cue-engage 1.8s ease-in-out infinite;
  }

  .text {
    font-size: 0.75rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  .arrow {
    display: grid;
    place-items: center;
    line-height: 0;
  }

  @keyframes cue-engage {
    0%,
    100% {
      opacity: 0.72;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(10px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-cue {
      animation: none;
      opacity: 0.9;
    }
  }
</style>
