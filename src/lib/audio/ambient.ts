export type AmbientLevels = {
  bass: number;
  mid: number;
  /** Upper-mid / presence — strings, brass bite. */
  presence: number;
  treble: number;
  energy: number;
  /** Slow-release hall loudness for crescendos. */
  swell: number;
  /** Fast-decay positive energy spikes (accents / hits). */
  attack: number;
  /** Sharp kick/snare transients — independent of swell. */
  drum: number;
  playing: boolean;
};

const idleLevels = (): AmbientLevels => ({
  bass: 0,
  mid: 0,
  presence: 0,
  treble: 0,
  energy: 0,
  swell: 0,
  attack: 0,
  drum: 0,
  playing: false,
});

let audioEl: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaElementAudioSourceNode | null = null;
let freqData: Uint8Array | null = null;
let raf = 0;
let levels: AmbientLevels = idleLevels();
let prevEnergy = 0;
let prevKick = 0;
let prevSnap = 0;
let drumCooldownUntil = 0;

const DRUM_COOLDOWN_MS = 150;

const listeners = new Set<(next: AmbientLevels) => void>();

function emit() {
  for (const listener of listeners) listener(levels);
}

function averageRange(data: Uint8Array, from: number, to: number): number {
  let sum = 0;
  const end = Math.min(to, data.length);
  const start = Math.max(0, from);
  if (end <= start) return 0;
  for (let i = start; i < end; i++) sum += data[i]!;
  return sum / ((end - start) * 255);
}

/** Fast attack / slow release envelope. */
function envelope(current: number, target: number, rise: number, fall: number): number {
  const amount = target > current ? rise : fall;
  return current + (target - current) * amount;
}

function updateLevels() {
  const playing = Boolean(audioEl && !audioEl.paused && !audioEl.ended);

  if (!playing || !analyser || !freqData) {
    levels = {
      bass: envelope(levels.bass, 0, 0.08, 0.08),
      mid: envelope(levels.mid, 0, 0.08, 0.08),
      presence: envelope(levels.presence, 0, 0.08, 0.08),
      treble: envelope(levels.treble, 0, 0.08, 0.08),
      energy: envelope(levels.energy, 0, 0.08, 0.08),
      swell: envelope(levels.swell, 0, 0.06, 0.06),
      attack: envelope(levels.attack, 0, 0.12, 0.12),
      drum: envelope(levels.drum, 0, 0.15, 0.15),
      playing: false,
    };
    prevEnergy = 0;
    prevKick = 0;
    prevSnap = 0;
    emit();
    if (levels.swell < 0.005 && levels.energy < 0.005 && levels.drum < 0.005 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    return;
  }

  analyser.getByteFrequencyData(freqData);
  const bins = freqData.length;

  // Orchestra-weighted bands (fftSize 512 → ~256 bins)
  const bassRaw = averageRange(freqData, 1, Math.max(2, Math.floor(bins * 0.04)));
  const midRaw = averageRange(
    freqData,
    Math.floor(bins * 0.04),
    Math.floor(bins * 0.14),
  );
  const presenceRaw = averageRange(
    freqData,
    Math.floor(bins * 0.14),
    Math.floor(bins * 0.35),
  );
  const trebleRaw = averageRange(
    freqData,
    Math.floor(bins * 0.35),
    Math.floor(bins * 0.7),
  );

  // Mid + presence carry the hall; bass/treble accent
  const energyRaw =
    bassRaw * 0.18 + midRaw * 0.32 + presenceRaw * 0.35 + trebleRaw * 0.15;

  const bass = envelope(levels.bass, bassRaw, 0.45, 0.1);
  const mid = envelope(levels.mid, midRaw, 0.42, 0.09);
  const presence = envelope(levels.presence, presenceRaw, 0.4, 0.09);
  const treble = envelope(levels.treble, trebleRaw, 0.38, 0.1);
  const energy = envelope(levels.energy, energyRaw, 0.45, 0.08);

  // Swell blooms on crescendos, holds, then releases slowly
  const swell = envelope(levels.swell, energyRaw, 0.35, 0.045);

  // Attack = rising edge of energy
  const delta = Math.max(0, energyRaw - prevEnergy);
  prevEnergy = energyRaw;
  const attackTarget = Math.min(1, delta * 14);
  const attack = envelope(levels.attack, attackTarget, 0.55, 0.14);

  // Drum: kick (low) + snare/transient (high) deltas — independent of swell
  const kickRaw = averageRange(freqData, 1, Math.max(2, Math.floor(bins * 0.05)));
  const snapRaw = averageRange(
    freqData,
    Math.floor(bins * 0.45),
    Math.floor(bins * 0.85),
  );
  const kickDelta = Math.max(0, kickRaw - prevKick);
  const snapDelta = Math.max(0, snapRaw - prevSnap);
  prevKick = kickRaw;
  prevSnap = snapRaw;

  const now = performance.now();
  let drumTarget = 0;
  if (now >= drumCooldownUntil) {
    const hit = Math.min(1, kickDelta * 10 + snapDelta * 9);
    if (hit > 0.12) {
      drumTarget = hit;
      drumCooldownUntil = now + DRUM_COOLDOWN_MS;
    }
  }
  const drum = envelope(levels.drum, drumTarget, 0.7, 0.2);

  levels = {
    bass,
    mid,
    presence,
    treble,
    energy,
    swell,
    attack,
    drum,
    playing: true,
  };
  emit();
}

function tick() {
  raf = requestAnimationFrame(tick);
  updateLevels();
}

function startLoop() {
  if (raf) return;
  raf = requestAnimationFrame(tick);
}

/** Bind the page `<audio>` element once (MediaElementSource can only be created once). */
export function attachAmbientElement(el: HTMLAudioElement): void {
  audioEl = el;
  el.volume = 0.18;
  el.loop = true;
}

export function getAmbientLevels(): AmbientLevels {
  return levels;
}

export function subscribeAmbient(listener: (next: AmbientLevels) => void): () => void {
  listeners.add(listener);
  listener(levels);
  return () => {
    listeners.delete(listener);
  };
}

async function ensureGraph(): Promise<void> {
  if (!audioEl) return;

  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.55;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    source = ctx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(ctx.destination);
  }

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/** Start ambient playback from a user gesture; resumes AudioContext + analysis loop. */
export async function playAmbient(): Promise<void> {
  if (!audioEl) throw new Error('Ambient audio element not attached');
  await ensureGraph();
  await audioEl.play();
  startLoop();
  levels = { ...levels, playing: true };
  emit();
}

export function pauseAmbient(): void {
  audioEl?.pause();
  levels = { ...levels, playing: false };
  emit();
  startLoop(); // decay vignette/dust smoothly toward zero
}

export function isAmbientPlaying(): boolean {
  return Boolean(audioEl && !audioEl.paused);
}
