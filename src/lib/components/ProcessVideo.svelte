<script lang="ts">
  /** YouTube drawing-process film — request highest available quality. */
  const VIDEO_ID = 'XPsc64fUfiU';

  const embedSrc = $derived(
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1&hd=1&vq=hd1080&version=3',
  );
</script>

<section class="process" aria-label="Drawing process video">
  <div class="stage">
    <iframe
      class="player"
      title="Drawing process — @Push_Art"
      src={embedSrc}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>
</section>

<style>
  .process {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: center;
    background:
      radial-gradient(ellipse 80% 60% at 50% 40%, color-mix(in srgb, var(--warm-edge) 12%, transparent), transparent 70%),
      var(--void);
  }

  .stage {
    width: min(96vw, calc(96vh * 16 / 9));
    aspect-ratio: 16 / 9;
    max-height: 86vh;
    border-radius: 0.65rem;
    overflow: hidden;
    box-shadow: 0 1.5rem 4rem color-mix(in srgb, #000 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--parchment) 14%, transparent);
  }

  .player {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #000;
  }
</style>
