export type ExplorePreset = 'tunnel' | 'drift' | 'film' | 'gallery';

export type PresetOption = {
  id: ExplorePreset;
  label: string;
};

export const PRESET_OPTIONS: PresetOption[] = [
  { id: 'tunnel', label: 'Tunnel' },
  { id: 'drift', label: 'Drift' },
  { id: 'film', label: 'Film' },
  { id: 'gallery', label: 'Gallery' },
];

export const STORAGE_KEY = 'latent-explore-preset';

const VALID = new Set<ExplorePreset>(PRESET_OPTIONS.map((p) => p.id));

export function isExplorePreset(value: string): value is ExplorePreset {
  return VALID.has(value as ExplorePreset);
}

export function loadPreset(): ExplorePreset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'stack') return 'drift';
    if (raw && isExplorePreset(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return 'tunnel';
}

export function savePreset(preset: ExplorePreset): void {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    /* ignore */
  }
}
