<script lang="ts">
  import { PLACEHOLDER_ART, isPlaceholderArt } from '$lib/data/resolveArt';

  type Props = {
    src: string;
    alt: string;
    loading?: 'eager' | 'lazy';
    decoding?: 'sync' | 'async' | 'auto';
    draggable?: boolean;
    class?: string;
  };

  let {
    src,
    alt,
    loading = 'lazy',
    decoding = 'async',
    draggable = false,
    class: className = '',
  }: Props = $props();

  /** Records the `src` value that failed so we fall back once per URL. */
  let failedSrc = $state<string | null>(null);

  const displaySrc = $derived(
    isPlaceholderArt(src) || failedSrc === src ? PLACEHOLDER_ART : src,
  );
  const usingPlaceholder = $derived(isPlaceholderArt(displaySrc));
  const displayAlt = $derived(usingPlaceholder ? `${alt} (placeholder)` : alt);

  $effect(() => {
    // When parent passes a new src, clear stale failure from a previous URL.
    if (failedSrc != null && failedSrc !== src) {
      failedSrc = null;
    }
  });

  function onError() {
    if (isPlaceholderArt(src) || failedSrc === src) return;
    failedSrc = src;
  }
</script>

<img
  class="art-image {className}"
  class:placeholder={usingPlaceholder}
  src={displaySrc}
  alt={displayAlt}
  {loading}
  {decoding}
  {draggable}
  onerror={onError}
/>

<style>
  .art-image {
    display: block;
    max-width: 100%;
  }

  .art-image.placeholder {
    background: #0a0908;
    object-fit: cover;
  }
</style>
