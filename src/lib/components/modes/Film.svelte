<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { pieces, credit, brand } from '$lib/data/pieces';
  import ScrollCue from '../ScrollCue.svelte';
  import ArtImage from '../ArtImage.svelte';

  /** Neighbors on each side of the focused card. */
  const REACH = 2;
  /** Degrees between adjacent cards on the front arc. */
  const ARC = 56;
  /** Ignore further wheel input briefly after a step (trackpads spam events). */
  const WHEEL_LOCK_MS = 380;

  let focus = $state(0);
  let spin = $state(0);
  let radius = $state(420);
  let dragging = $state(false);
  let showIntro = $state(true);
  let stageEl = $state<HTMLElement | null>(null);

  // Mutable mirrors — onMount listeners must not read stale $state closures
  let spinValue = 0;
  let focusValue = 0;
  let introValue = true;
  let wheelLocked = false;
  let dragAccumX = 0;
  let dragAccumY = 0;

  let snapTimer = 0;
  let raf = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let wheelLockTimer = 0;
  let cueLabel = $state('Scroll');

  const creditIndex = pieces.length;
  const maxIndex = creditIndex;

  function clampIndex(i: number): number {
    return Math.max(0, Math.min(maxIndex, i));
  }

  function isCredit(index: number): boolean {
    return index === creditIndex;
  }

  function publishProgress() {
    const progressed = introValue ? 0 : focusValue + 1;
    document.body.dataset.filmProgress = String(progressed * 40);
    window.dispatchEvent(new Event('film-progress'));
  }

  function applySpin(next: number) {
    const max = maxIndex * ARC;
    spinValue = Math.max(0, Math.min(max, next));
    focusValue = clampIndex(Math.round(spinValue / ARC));
    spin = spinValue;
    focus = focusValue;
  }

  function dismissIntro() {
    if (!introValue) return;
    introValue = false;
    showIntro = false;
  }

  function restoreIntro() {
    introValue = true;
    showIntro = true;
  }

  /** Spin the wheel back to the first piece and restore the intro overlay. */
  export function resetToStart() {
    window.clearTimeout(snapTimer);
    window.clearTimeout(wheelLockTimer);
    wheelLocked = false;
    cancelAnimationFrame(raf);

    const start = spinValue;
    const target = 0;
    const delta = target - start;
    const duration = Math.min(900, 280 + Math.abs(delta) * 4.5);
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      applySpin(start + delta * eased);
      publishProgress();
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        applySpin(0);
        restoreIntro();
        publishProgress();
      }
    };

    raf = requestAnimationFrame(frame);
  }

  function goToIndex(index: number) {
    const next = clampIndex(index);
    dismissIntro();
    window.clearTimeout(snapTimer);
    animateTo(next * ARC);
    publishProgress();
  }

  function stepBy(dir: number) {
    goToIndex(focusValue + dir);
  }

  function scheduleSnap() {
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      animateTo(clampIndex(Math.round(spinValue / ARC)) * ARC);
    }, 80);
  }

  function animateTo(target: number) {
    cancelAnimationFrame(raf);
    const start = spinValue;
    const delta = target - start;
    if (Math.abs(delta) < 0.01) {
      applySpin(target);
      publishProgress();
      return;
    }
    const duration = 320;
    const t0 = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      applySpin(start + delta * eased);
      publishProgress();
      if (t < 1) raf = requestAnimationFrame(frame);
      else {
        applySpin(target);
        publishProgress();
      }
    };

    raf = requestAnimationFrame(frame);
  }

  function measure() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Wider orbit = more horizontal spread for the same ARC
    radius = Math.min(Math.max(w * 0.48, h * 0.45, 400), Math.min(w * 0.7, 760));
  }

  function visibleIndices(): number[] {
    const out: number[] = [];
    for (let o = -REACH; o <= REACH; o++) {
      const i = focus + o;
      if (i >= 0 && i <= maxIndex) out.push(i);
    }
    return out;
  }

  function slotStyle(index: number): {
    transform: string;
    opacity: number;
    filter: string;
    zIndex: number;
  } {
    const offset = index - spin / ARC;
    const angle = offset * ARC;
    const abs = Math.abs(offset);
    const opacity = Math.max(0, 1 - abs * 0.22);
    const brightness = Math.max(0.4, 1.05 - abs * 0.28);
    // Keep neighbors readable while the stronger ARC turns them away
    const scale = Math.max(0.68, 1.02 - abs * 0.1);

    return {
      transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px) scale(${scale})`,
      opacity,
      filter: `brightness(${brightness})`,
      zIndex: Math.round((REACH + 1 - abs) * 10),
    };
  }

  onMount(() => {
    let cleaned = false;
    let stage: HTMLElement | null = null;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (wheelLocked) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 2) return;

      wheelLocked = true;
      window.clearTimeout(wheelLockTimer);
      wheelLockTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, WHEEL_LOCK_MS);

      stepBy(delta > 0 ? 1 : -1);
    };

    const onKeydown = (event: KeyboardEvent) => {
      let dir = 0;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === 'ArrowDown') {
        dir = 1;
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp' || event.key === 'ArrowUp') {
        dir = -1;
      }
      if (dir === 0) return;
      event.preventDefault();
      stepBy(dir);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      dragAccumX = 0;
      dragAccumY = 0;
      dragLastX = event.clientX;
      dragLastY = event.clientY;
      window.clearTimeout(snapTimer);
      cancelAnimationFrame(raf);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - dragLastX;
      const dy = event.clientY - dragLastY;
      dragLastX = event.clientX;
      dragLastY = event.clientY;
      dragAccumX += dx;
      dragAccumY += dy;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      const threshold = 48;
      const useY = Math.abs(dragAccumY) > Math.abs(dragAccumX);
      const delta = useY ? dragAccumY : dragAccumX;
      // Horizontal: swipe left → next. Vertical: swipe up → next (scroll metaphor).
      if (Math.abs(delta) >= threshold) {
        stepBy(delta < 0 ? 1 : -1);
      } else {
        scheduleSnap();
      }
      dragAccumX = 0;
      dragAccumY = 0;
    };

    const onResize = () => measure();

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      window.clearTimeout(snapTimer);
      window.clearTimeout(wheelLockTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('resize', onResize);
      stage?.removeEventListener('pointerdown', onPointerDown);
      stage?.removeEventListener('pointermove', onPointerMove);
      stage?.removeEventListener('pointerup', onPointerUp);
      stage?.removeEventListener('pointercancel', onPointerUp);
      delete document.body.dataset.filmProgress;
      window.dispatchEvent(new Event('film-progress'));
    };

    void tick().then(() => {
      if (cleaned) return;
      measure();
      publishProgress();
      const touchPrimary =
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(hover: none)').matches;
      cueLabel = touchPrimary ? 'Swipe' : 'Scroll';
      stage = stageEl;
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('keydown', onKeydown);
      window.addEventListener('resize', onResize, { passive: true });
      stage?.addEventListener('pointerdown', onPointerDown);
      stage?.addEventListener('pointermove', onPointerMove);
      stage?.addEventListener('pointerup', onPointerUp);
      stage?.addEventListener('pointercancel', onPointerUp);
    });

    return cleanup;
  });
</script>

<section class="film" aria-label="@Push_Art Gallery — Film">
  <div class="stage" class:dragging bind:this={stageEl}>
    <div class="ring-glow" aria-hidden="true"></div>

    <div class="wheel" style:transform={`translateZ(${-radius}px)`}>
      {#each visibleIndices() as index (isCredit(index) ? 'credit' : pieces[index].id)}
        {@const s = slotStyle(index)}
        <article
          class="panel"
          class:credit-panel={isCredit(index)}
          style:transform={s.transform}
          style:z-index={s.zIndex}
        >
          {#if isCredit(index)}
            <p
              class="credit-slide"
              style:opacity={s.opacity}
              style:filter={s.filter}
            >
              {credit}
            </p>
          {:else}
            <div class="panel-art" style:opacity={s.opacity} style:filter={s.filter}>
              <ArtImage
                src={pieces[index].src}
                alt={pieces[index].alt}
                loading={Math.abs(index - focus) <= 1 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </div>
          {/if}
        </article>
      {/each}
    </div>

    {#if showIntro}
      <div class="intro">
        <h1 class="brand">{brand.name}</h1>
        <p class="tagline">
          {brand.line}
          <span class="tagline-sub">{brand.subline}</span>
          <span class="tagline-ps">{brand.ps}</span>
        </p>
        <ScrollCue label={cueLabel} />
      </div>
    {/if}
  </div>
</section>

<style>
  .film {
    position: fixed;
    inset: 0;
    z-index: 2;
    width: 100%;
    max-width: 100vw;
    overflow: hidden;
    touch-action: none;
  }

  .stage {
    position: relative;
    height: 100%;
    /* Leave optical room above Explore + reset */
    perspective: min(1600px, 140vh);
    perspective-origin: 50% 44%;
    transform-style: preserve-3d;
    cursor: grab;
  }

  .stage.dragging {
    cursor: grabbing;
  }

  .ring-glow {
    pointer-events: none;
    position: absolute;
    left: 50%;
    bottom: clamp(18%, 22vh, 26%);
    width: min(92vw, 54rem);
    height: clamp(10vh, 14vh, 18vh);
    transform: translateX(-50%) rotateX(74deg);
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--parchment) 14%, transparent) 0%,
      transparent 70%
    );
    opacity: 0.4;
  }

  .wheel {
    position: absolute;
    inset: 0;
    /* Bias the carousel slightly upward so chrome doesn't steal the frame */
    transform-style: preserve-3d;
    transform-origin: 50% 46%;
  }

  .panel {
    position: absolute;
    top: 46%;
    left: 50%;
    margin: 0;
    width: fit-content;
    height: fit-content;
    background: transparent;
    transform-style: preserve-3d;
    transform-origin: center center;
    will-change: transform;
  }

  .panel :global(img),
  .panel-art :global(img) {
    display: block;
    width: auto;
    height: auto;
    /* Fill most of the viewport; reserve chrome + reset (~9–11rem) */
    max-width: min(56vw, 36rem);
    max-height: min(78vh, calc(100vh - 10.5rem));
    border-radius: var(--frame-radius);
    box-shadow: 0 28px 90px color-mix(in srgb, black 55%, transparent);
    user-select: none;
    pointer-events: none;
    backface-visibility: hidden;
    background: transparent;
  }

  .intro {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: grid;
    place-content: center;
    place-items: center;
    text-align: center;
    padding: var(--gutter);
    background: color-mix(in srgb, var(--void-ink) 55%, transparent);
    backdrop-filter: blur(4px);
    pointer-events: none;
    animation: intro-in 0.7s var(--ease-out-expo) both;
  }

  .brand {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(2.1rem, calc(var(--index) * 4.2), 5rem);
    letter-spacing: -0.03em;
    line-height: 0.98;
    color: var(--brand);
    max-width: min(18ch, 92vw);
  }

  .tagline {
    margin-top: 1rem;
    max-width: min(36rem, 88vw);
    margin-inline: auto;
    font-size: clamp(0.95rem, calc(var(--index) * 0.95), 1.2rem);
    line-height: 1.45;
    color: var(--tagline);
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

  .credit-slide {
    margin: 0;
    max-width: min(28rem, 70vw);
    text-align: center;
    font-size: clamp(1rem, 2.4vw, 1.25rem);
    letter-spacing: 0.06em;
    line-height: 1.45;
    color: var(--parchment-faint);
    user-select: none;
  }

  @keyframes intro-in {
    from {
      opacity: 0;
      transform: translateY(0.6rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 720px) {
    .stage {
      perspective: min(1200px, 130vh);
      perspective-origin: 50% 42%;
    }

    .panel {
      top: 44%;
    }

    .panel :global(img),
    .panel-art :global(img) {
      max-width: min(82vw, 22rem);
      max-height: min(64vh, calc(100vh - 11.5rem));
    }
  }

  @media (max-height: 640px) {
    .panel :global(img),
    .panel-art :global(img) {
      max-height: min(70vh, calc(100vh - 9.5rem));
      max-width: min(48vw, 28rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .intro {
      animation: none;
    }
  }
</style>
