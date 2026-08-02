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

  // Spacer height must be lastSnap + 100vh so maxScroll can actually reach credits.
  const lastSnap = snapScrolls.at(-1) ?? 0;

  function zAt(index: number, top: number): number {
    return index * Z_SPACING + Z_SPACING + (top + near / 5) * 5;
  }

  function opacityAt(z: number): number {
    if (z >= near / 1.8) return 0;
    if (z <= -near * 2.6) return 0;

    if (z < -near * 1.2) {
      return Math.max(0, 1 - (-z - near * 1.2) / (near * 1.4));
    }

    if (z > near / 3.2) {
      return Math.max(0, 1 - (z - near / 3.2) / (near / 1.8 - near / 3.2));
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
    /** Finger is down — never snap-correct during an active touch. */
    let touchActive = false;
    /** True after touch until momentum settles (avoids fighting inertial scroll). */
    let touchGesture = false;
    const supportsScrollEnd = 'onscrollend' in window;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const syncScrollState = () => {
      scrollTop = document.documentElement.scrollTop;
    };

    let scrollEndTimer = 0;

    const clearScrollEnd = () => {
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = 0;
    };

    const settleToNearest = () => {
      if (locked || touchActive || performance.now() < suppressSnapUntil) return;
      const nearest = nearestSnapIndex(document.documentElement.scrollTop);
      currentSnap = nearest;
      const target = snapScrolls[nearest]!;
      if (Math.abs(document.documentElement.scrollTop - target) > 2) {
        animateTo(target);
      }
      touchGesture = false;
    };

    const scheduleSettle = (delayMs: number) => {
      clearScrollEnd();
      scrollEndTimer = window.setTimeout(settleToNearest, delayMs);
    };

    const animateTo = (target: number) => {
      const clamped = Math.min(maxScroll(), Math.max(0, target));
      locked = true;
      clearScrollEnd();
      cancelAnimationFrame(animRaf);

      const start = document.documentElement.scrollTop;
      const dist = clamped - start;
      if (Math.abs(dist) < 0.5) {
        window.scrollTo(0, clamped);
        syncScrollState();
        locked = false;
        suppressSnapUntil = performance.now() + 220;
        return;
      }

      const duration = Math.min(850, 380 + Math.abs(dist) * 0.55);
      const t0 = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        window.scrollTo(0, start + dist * e);
        syncScrollState();

        if (t < 1) {
          animRaf = requestAnimationFrame(step);
        } else {
          window.scrollTo(0, clamped);
          syncScrollState();
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
      // Touch/trackpad gestures that synthesize wheel still scroll natively when
      // we don't preventDefault — only hijack real discrete wheel / ctrl-free
      // desktop scrolling. Touch paths use native scroll + settle.
      if (touchGesture || touchActive) return;

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

    const onTouchStart = () => {
      touchActive = true;
      touchGesture = true;
      clearScrollEnd();
    };

    const onTouchEnd = () => {
      touchActive = false;
      // Wait for inertial scroll to finish before snapping.
      if (supportsScrollEnd) {
        // scrollend will settle; keep a long fallback if scrollend never fires.
        scheduleSettle(600);
      } else {
        scheduleSettle(280);
      }
    };

    const onScroll = () => {
      syncScrollState();
      if (locked || touchActive || performance.now() < suppressSnapUntil) {
        clearScrollEnd();
        return;
      }

      // During/after touch, prefer scrollend (or a long idle) so we don't yank
      // against momentum. Desktop wheel path uses goToSnap and rarely lands here.
      if (touchGesture) {
        if (!supportsScrollEnd) scheduleSettle(280);
        return;
      }

      scheduleSettle(120);
    };

    const onScrollEnd = () => {
      if (!touchGesture && !touchActive) return;
      clearScrollEnd();
      settleToNearest();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    currentSnap = 0;
    window.scrollTo(0, snapScrolls[0] ?? 0);
    syncScrollState();
    suppressSnapUntil = performance.now() + 220;

    resetHandler = () => {
      currentSnap = 0;
      animateTo(snapScrolls[0] ?? 0);
    };

    return () => {
      resetHandler = null;
      cancelAnimationFrame(animRaf);
      clearScrollEnd();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('touchstart', onTouchStart);
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
    /* last snap + viewport so credits are actually reachable */
    height: calc(var(--last-snap) + 100vh);
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
