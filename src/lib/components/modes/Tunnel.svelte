<script lang="ts">
  import { onMount } from 'svelte';
  import { frames, Z_SPACING } from '$lib/data/gallery';
  import Frame from '../Frame.svelte';

  let scrollTop = $state(0);
  const near = Math.abs(Z_SPACING);

  /** Called from App reset control — animate tunnel camera back to title. */
  let resetHandler: (() => void) | null = null;

  export function resetToStart() {
    resetHandler?.();
  }

  /** Ideal camera depth per frame type (sharp, centered in the tunnel). */
  function targetZFor(type: (typeof frames)[number]['type']): number {
    if (type === 'title') return 0;
    // Credits sit nearer the lens than art stops.
    if (type === 'credit') return -14;
    return -48;
  }

  /** ScrollY that places frame `index` at its ideal Z. */
  function scrollForIndex(index: number): number {
    const targetZ = targetZFor(frames[index].type);
    // z = (index + 1) * Z_SPACING + (top + near/5) * 5
    return (targetZ - (index + 1) * Z_SPACING) / 5 - near / 5;
  }

  const snapScrolls = frames.map((_, index) => Math.max(0, scrollForIndex(index)));

  // Spacer height must be lastSnap + viewport so maxScroll can actually reach credits.
  const lastSnap = snapScrolls.at(-1) ?? 0;

  function zAt(index: number, top: number): number {
    return index * Z_SPACING + Z_SPACING + (top + near / 5) * 5;
  }

  function opacityAt(z: number): number {
    // Kill frames once they pass the lens — past this they scale insanely large.
    if (z >= near / 2.4) return 0;
    if (z <= -near * 2.6) return 0;

    if (z < -near * 1.2) {
      return Math.max(0, 1 - (-z - near * 1.2) / (near * 1.4));
    }

    // Start fading as soon as a piece crosses the focus plane toward the camera.
    if (z > 8) {
      return Math.max(0, 1 - (z - 8) / (near / 2.4 - 8));
    }

    return 1;
  }

  function blurAt(z: number): number {
    if (z >= -40) return 0;
    const t = Math.min(1, (-z - 40) / (near * 1.85));
    return t * 16;
  }

  function nearestSnapIndex(top: number): number {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < snapScrolls.length; i++) {
      const d = Math.abs(snapScrolls[i] - top);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  onMount(() => {
    let animRaf = 0;
    let locked = false;
    let wheelLock = 0;
    let currentSnap = 0;
    /** Ignore scroll-end corrections while a programmatic snap is in flight / settling. */
    let suppressSnapUntil = 0;

    /** Phones: discrete swipe steps (same feel as desktop wheel), not free-scroll + snap. */
    const touchNav =
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    let touchStartY = 0;
    let touchStartX = 0;
    let touchStartT = 0;
    /** Ignore swipes that begin on Explore chrome / reset. */
    let touchFromChrome = false;

    const isChromeTarget = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      return Boolean(el?.closest('[role="toolbar"], .reset'));
    };

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    let scrollEndTimer = 0;

    const clearScrollEnd = () => {
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = 0;
    };

    /** Authoritative camera depth — avoid trusting DOM scrollTop mid-gesture
     *  (overflow:hidden + mobile browsers can report stale values). */
    let cameraY = document.documentElement.scrollTop;

    const setCamera = (y: number) => {
      cameraY = y;
      window.scrollTo(0, y);
      scrollTop = y;
    };

    const animateTo = (target: number) => {
      const clamped = Math.min(maxScroll(), Math.max(0, target));
      locked = true;
      clearScrollEnd();
      cancelAnimationFrame(animRaf);

      const start = cameraY;
      const dist = clamped - start;
      if (Math.abs(dist) < 0.5) {
        setCamera(clamped);
        locked = false;
        suppressSnapUntil = performance.now() + 220;
        return;
      }

      // Keep step moves snappy so frames don't linger near the lens (huge scale).
      const duration = Math.min(620, 280 + Math.abs(dist) * 0.4);
      const t0 = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        setCamera(start + dist * e);

        if (t < 1) {
          animRaf = requestAnimationFrame(step);
        } else {
          setCamera(clamped);
          locked = false;
          wheelLock = performance.now() + 280;
          suppressSnapUntil = performance.now() + 280;
        }
      };

      animRaf = requestAnimationFrame(step);
    };

    const goToSnap = (snapIndex: number) => {
      currentSnap = Math.min(snapScrolls.length - 1, Math.max(0, snapIndex));
      animateTo(snapScrolls[currentSnap]!);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (locked || performance.now() < wheelLock) return;

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      if (Math.abs(delta) < 2) return;

      // Advance from the last settled snap — do not re-derive from mid-scroll
      // position (that caused down-then-up fights with scroll-end correction).
      goToSnap(currentSnap + (delta > 0 ? 1 : -1));
    };

    const onKeydown = (event: KeyboardEvent) => {
      let dir = 0;
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ')
        dir = 1;
      if (event.key === 'ArrowUp' || event.key === 'PageUp') dir = -1;
      if (dir === 0) return;

      event.preventDefault();
      if (locked || performance.now() < wheelLock) return;
      goToSnap(currentSnap + dir);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!touchNav || event.touches.length !== 1) return;
      touchFromChrome = isChromeTarget(event.target);
      if (touchFromChrome) return;
      touchStartY = event.touches[0]!.clientY;
      touchStartX = event.touches[0]!.clientX;
      touchStartT = performance.now();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchNav || touchFromChrome || isChromeTarget(event.target)) return;
      // Block native page scroll — tunnel advances only via swipe-to-snap.
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!touchNav || touchFromChrome || locked || performance.now() < wheelLock) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const dy = touch.clientY - touchStartY;
      const dx = touch.clientX - touchStartX;
      const dt = performance.now() - touchStartT;

      // Require a clear vertical flick (ignore taps / mostly-horizontal drags).
      if (Math.abs(dy) < 48 || Math.abs(dy) < Math.abs(dx) * 1.15) return;
      if (dt > 900) return;

      goToSnap(currentSnap + (dy < 0 ? 1 : -1));
    };

    const onScroll = () => {
      // Touch path is fully driven by cameraY; ignore native scroll noise.
      if (touchNav || locked) return;

      const top = document.documentElement.scrollTop;
      cameraY = top;
      scrollTop = top;

      if (performance.now() < suppressSnapUntil) {
        clearScrollEnd();
        return;
      }

      clearScrollEnd();
      scrollEndTimer = window.setTimeout(() => {
        if (locked || performance.now() < suppressSnapUntil) return;
        const nearest = nearestSnapIndex(cameraY);
        currentSnap = nearest;
        const target = snapScrolls[nearest]!;
        if (Math.abs(cameraY - target) > 2) {
          animateTo(target);
        }
      }, 120);
    };

    if (touchNav) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (touchNav) {
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    }

    currentSnap = 0;
    setCamera(snapScrolls[0] ?? 0);
    suppressSnapUntil = performance.now() + 220;

    resetHandler = () => {
      currentSnap = 0;
      animateTo(snapScrolls[0] ?? 0);
    };

    return () => {
      resetHandler = null;
      cancelAnimationFrame(animRaf);
      clearScrollEnd();
      if (touchNav) {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  });
</script>

<div
  class="scroll-spacer"
  style:--last-snap="{lastSnap}px"
  aria-hidden="true"
></div>

<div class="stage">
  <section class="gallery" aria-label="@Push_Art Gallery — Tunnel">
    {#each frames as frame, i (i)}
      {@const z = zAt(i, scrollTop)}
      {@const opacity = opacityAt(z)}
      {@const blur = frame.type === 'image' ? blurAt(z) : 0}
      <Frame
        {frame}
        {z}
        {opacity}
        {blur}
        reducedMotion={false}
        priority={i < 3}
      />
    {/each}
  </section>
</div>

<style>
  .scroll-spacer {
    /* last snap + visible viewport so credits are actually reachable */
    height: calc(var(--last-snap) + var(--vh-full));
    pointer-events: none;
  }

  .stage {
    position: fixed;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    perspective: var(--perspective);
    overflow: hidden;
  }

  .gallery {
    height: 100%;
    transform-style: preserve-3d;
  }
</style>
