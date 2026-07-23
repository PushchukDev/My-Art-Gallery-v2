<script lang="ts">
  import { imagesAvailable } from '$lib/data/pieces';

  let dismissed = $state(false);

  const visible = $derived(!imagesAvailable && !dismissed);
</script>

{#if visible}
  <div class="notice" role="status">
    <p>
      Gallery images aren’t in this clone. Placeholders are showing — copy WebPs into
      <code>src/assets/images/</code> (and MP3s into <code>static/media/</code>) from the private
      assets repo. See the README.
    </p>
    <button type="button" class="dismiss" onclick={() => (dismissed = true)}>Dismiss</button>
  </div>
{/if}

<style>
  .notice {
    position: fixed;
    z-index: 60;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: min(36rem, calc(100vw - 1.5rem));
    padding: 0.7rem 0.85rem;
    border-radius: 0.75rem;
    font-family: var(--font-body);
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--parchment);
    background: color-mix(in srgb, var(--void) 78%, transparent);
    border: 1px solid color-mix(in srgb, var(--warm-edge) 35%, transparent);
    backdrop-filter: blur(10px);
    box-shadow: 0 12px 32px color-mix(in srgb, #000 40%, transparent);
  }

  .notice p {
    margin: 0;
    flex: 1;
  }

  .notice code {
    font-size: 0.9em;
    color: var(--warm-edge);
  }

  .dismiss {
    flex: 0 0 auto;
    padding: 0.2rem 0.45rem;
    border-radius: 0.4rem;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    color: var(--parchment-muted);
    border: 1px solid color-mix(in srgb, var(--parchment) 16%, transparent);
  }

  .dismiss:hover {
    color: var(--parchment);
    border-color: color-mix(in srgb, var(--parchment) 32%, transparent);
  }
</style>
