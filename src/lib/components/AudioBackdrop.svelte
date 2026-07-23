<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAmbientLevels,
    subscribeAmbient,
  } from '$lib/audio/ambient';

  type Dust = {
    x: number;
    y: number;
    r: number;
    vx: number;
    vy: number;
    a: number;
    /** Ember burst motes fade back toward normal opacity. */
    ember: number;
  };

  type DrumHit = {
    strength: number;
    age: number;
    life: number;
  };

  const ATTACK_THRESHOLD = 0.22;
  const DRUM_THRESHOLD = 0.35;
  const BURST_COUNT = 10;
  const DRUM_BURST_COUNT = 18;

  let canvasEl: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canvasEl) return;

    const surface: HTMLCanvasElement = canvasEl;
    const maybeCtx = surface.getContext('2d');
    if (!maybeCtx) return;
    const ctx2d: CanvasRenderingContext2D = maybeCtx;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let latest = getAmbientLevels();
    let t = 0;
    let prevAttack = 0;
    let prevDrum = 0;
    let drumHit: DrumHit | null = null;

    const dustCount = reduced ? 0 : 80;
    const dust: Dust[] = Array.from({ length: dustCount }, () => spawnDust(true));

    function spawnDust(randomY = false): Dust {
      return {
        x: Math.random() * Math.max(w, 1),
        y: randomY ? Math.random() * Math.max(h, 1) : h + Math.random() * 40,
        r: 0.55 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.28,
        vy: -0.12 - Math.random() * 0.38,
        a: 0.07 + Math.random() * 0.2,
        ember: 0,
      };
    }

    function burstEmbers(strength: number, maxCount = BURST_COUNT) {
      const n = Math.min(maxCount, Math.floor(4 + strength * 12));
      for (let i = 0; i < n; i++) {
        const mote = dust[Math.floor(Math.random() * dust.length)];
        if (!mote) continue;
        mote.x = w * (0.15 + Math.random() * 0.7);
        mote.y = h * (0.55 + Math.random() * 0.4);
        mote.vx = (Math.random() - 0.5) * (0.6 + strength);
        mote.vy = -0.35 - Math.random() * (0.55 + strength * 0.8);
        mote.r = 0.8 + Math.random() * 2.2;
        mote.a = 0.18 + Math.random() * 0.28;
        mote.ember = 0.7 + strength * 0.5;
      }
    }

    function burstDrumEmbers(strength: number) {
      const n = Math.min(DRUM_BURST_COUNT, Math.floor(8 + strength * 16));
      for (let i = 0; i < n; i++) {
        const mote = dust[Math.floor(Math.random() * dust.length)];
        if (!mote) continue;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.9 + strength * 1.6 + Math.random() * 0.8;
        mote.x = w * (0.35 + Math.random() * 0.3);
        mote.y = h * (0.4 + Math.random() * 0.35);
        mote.vx = Math.cos(angle) * speed;
        mote.vy = Math.sin(angle) * speed * 0.75 - 0.2;
        mote.r = 1 + Math.random() * 2.6;
        mote.a = 0.22 + Math.random() * 0.35;
        mote.ember = 1 + strength * 0.6;
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      surface.width = Math.floor(w * dpr);
      surface.height = Math.floor(h * dpr);
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw();
    }

    function draw() {
      const { bass, mid, presence, treble, energy, swell, attack, drum, playing } = latest;
      ctx2d.clearRect(0, 0, w, h);

      if (reduced) {
        const radius = Math.hypot(w, h) * 0.42;
        const gradient = ctx2d.createRadialGradient(
          w * 0.5,
          h * 0.42,
          0,
          w * 0.5,
          h * 0.42,
          radius,
        );
        gradient.addColorStop(0, 'rgba(196, 164, 132, 0.025)');
        gradient.addColorStop(0.45, 'rgba(243, 235, 224, 0.01)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx2d.fillStyle = gradient;
        ctx2d.fillRect(0, 0, w, h);
        return;
      }

      t += 0.016;

      // Drum threshold crossing → one-shot hit FX
      if (drum >= DRUM_THRESHOLD && prevDrum < DRUM_THRESHOLD) {
        drumHit = { strength: drum, age: 0, life: 0.3 };
        burstDrumEmbers(drum);
      }
      prevDrum = drum;

      if (drumHit) {
        drumHit.age += 0.016;
        if (drumHit.age >= drumHit.life) drumHit = null;
      }

      const hitT = drumHit ? 1 - drumHit.age / drumHit.life : 0;
      const hitStr = drumHit ? drumHit.strength * hitT : 0;

      // Tiny center drift — alive between hits, not a bounce
      const cx =
        w * (0.5 + Math.sin(t * 0.35) * 0.012 * (0.35 + swell) + Math.sin(t * 0.11) * 0.006);
      const cy =
        h * (0.42 + Math.cos(t * 0.28) * 0.01 * (0.35 + swell) + Math.cos(t * 0.09) * 0.005);

      if (playing) {
        // Outer hall wash — expands with swell
        const outerR = Math.hypot(w, h) * (0.55 + swell * 0.28);
        const outerA = Math.min(0.1, swell * 0.14);
        const outer = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, outerR);
        outer.addColorStop(0, `rgba(243, 235, 224, ${outerA * 0.35})`);
        outer.addColorStop(0.55, `rgba(196, 164, 132, ${outerA})`);
        outer.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx2d.fillStyle = outer;
        ctx2d.fillRect(0, 0, w, h);

        // Inner breath — bass + swell, plus short drum punch
        const punchA = hitStr * 0.07;
        const punchR = hitStr * 0.06;
        const breath = Math.min(
          0.2,
          0.035 + bass * 0.12 + swell * 0.14 + energy * 0.04 + punchA,
        );
        const innerR = Math.hypot(w, h) * (0.38 + bass * 0.08 + swell * 0.1 + punchR);
        const inner = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        inner.addColorStop(0, `rgba(196, 164, 132, ${breath})`);
        inner.addColorStop(0.45, `rgba(243, 235, 224, ${breath * 0.38})`);
        inner.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx2d.fillStyle = inner;
        ctx2d.fillRect(0, 0, w, h);
      } else if (swell > 0.004 || energy > 0.004) {
        const breath = Math.min(0.12, swell * 0.22);
        const radius = Math.hypot(w, h) * (0.4 + swell * 0.08);
        const gradient = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(196, 164, 132, ${breath})`);
        gradient.addColorStop(0.45, `rgba(243, 235, 224, ${breath * 0.35})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx2d.fillStyle = gradient;
        ctx2d.fillRect(0, 0, w, h);
      }

      // Expanding pulse ring on drum hit
      if (drumHit && hitT > 0) {
        const progress = drumHit.age / drumHit.life;
        const ringR = Math.hypot(w, h) * (0.08 + progress * 0.42) * (0.85 + drumHit.strength * 0.25);
        const ringA = hitStr * 0.22;
        ctx2d.beginPath();
        ctx2d.strokeStyle = `rgba(196, 164, 132, ${ringA})`;
        ctx2d.lineWidth = 1.5 + drumHit.strength * 2.5;
        ctx2d.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx2d.stroke();

        ctx2d.beginPath();
        ctx2d.strokeStyle = `rgba(243, 235, 224, ${ringA * 0.55})`;
        ctx2d.lineWidth = 1;
        ctx2d.arc(cx, cy, ringR * 0.92, 0, Math.PI * 2);
        ctx2d.stroke();
      }

      // Attack crossing → ember burst (existing path)
      if (attack >= ATTACK_THRESHOLD && prevAttack < ATTACK_THRESHOLD) {
        burstEmbers(attack);
      }
      prevAttack = attack;

      const visibleFloor = playing ? 0.004 + swell * 0.02 : 0.008;
      if (swell > visibleFloor || energy > visibleFloor || attack > 0.05 || hitStr > 0.02) {
        const speed = 0.3 + mid * 1.1 + presence * 1.6 + treble * 0.5;
        const shimmer = treble * 0.55;
        const boost =
          Math.max(0.12, swell * 1.4 + energy * 0.6) * (0.45 + swell * 0.9) + hitStr * 0.8;

        for (const mote of dust) {
          mote.x += mote.vx * speed + Math.sin(t * 2.1 + mote.y * 0.02) * shimmer;
          mote.y += mote.vy * speed;
          if (mote.ember > 0) {
            mote.ember *= 0.965;
            if (mote.ember < 0.04) mote.ember = 0;
          }

          if (mote.y < -20 || mote.x < -20 || mote.x > w + 20) {
            Object.assign(mote, spawnDust(false));
            mote.y = h + 10;
          }

          const alpha = mote.a * boost * (1 + mote.ember * 1.8);
          if (alpha < 0.01) continue;

          ctx2d.beginPath();
          ctx2d.fillStyle = `rgba(243, 235, 224, ${Math.min(0.85, alpha)})`;
          ctx2d.arc(mote.x, mote.y, mote.r * (1 + mote.ember * 0.35), 0, Math.PI * 2);
          ctx2d.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    const unsub = reduced
      ? () => {}
      : subscribeAmbient((next) => {
          latest = next;
        });

    resize();
    if (!reduced) draw();
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas class="audio-backdrop" bind:this={canvasEl} aria-hidden="true"></canvas>

<style>
  .audio-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    max-width: none;
  }
</style>
