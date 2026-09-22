// ═══════════════════════════════════════════════════════════
// TYPES & LOGIQUE MÉTIER AUDIO
// AcousticBrainz en source principale, Last.fm en fallback
// ═══════════════════════════════════════════════════════════

export interface AudioMetrics {
  danceability: number;     // 0-1 : facilité à danser
  energy: number;           // 0-1 : intensité sonore
  valence: number;          // 0-1 : positivité musicale
  acousticness: number;     // 0-1 : part acoustique
  instrumentalness: number; // 0-1 : part instrumentale
  liveness: number;         // 0-1 : probabilité live
  tempo: number;            // BPM
}

export interface AudioFeaturesResponse {
  metrics: AudioMetrics;
  source: 'acousticbrainz' | 'lastfm' | 'hybrid';
  coverage: number; // fraction de métriques venant d'AcousticBrainz (0-1)
  mbid: string | null;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Variation déterministe (-0.5..0.5) pour éviter l'uniformité par genre
function seededVariation(seed: number, index: number): number {
  const x = Math.sin(seed + index * 97) * 10000;
  return x - Math.floor(x) - 0.5;
}

// ═══════════════════════════════════════════════════════════
// HEURISTIQUES PAR PILIER (fallback Last.fm)
// ═══════════════════════════════════════════════════════════
const GENRE_BASE_METRICS: Record<string, AudioMetrics> = {
  'Black Metal':       { danceability: 0.28, energy: 0.95, valence: 0.12, acousticness: 0.05, instrumentalness: 0.25, liveness: 0.15, tempo: 165 },
  'Death Metal':       { danceability: 0.25, energy: 0.97, valence: 0.18, acousticness: 0.03, instrumentalness: 0.20, liveness: 0.15, tempo: 150 },
  'Heavy Metal':       { danceability: 0.50, energy: 0.85, valence: 0.45, acousticness: 0.08, instrumentalness: 0.15, liveness: 0.20, tempo: 120 },
  'Thrash Metal':      { danceability: 0.40, energy: 0.96, valence: 0.35, acousticness: 0.03, instrumentalness: 0.15, liveness: 0.18, tempo: 175 },
  'Power Metal':       { danceability: 0.45, energy: 0.90, valence: 0.60, acousticness: 0.06, instrumentalness: 0.20, liveness: 0.15, tempo: 160 },
  'Doom Metal':        { danceability: 0.20, energy: 0.60, valence: 0.15, acousticness: 0.10, instrumentalness: 0.35, liveness: 0.12, tempo: 70 },
  'Progressive Metal': { danceability: 0.35, energy: 0.80, valence: 0.40, acousticness: 0.08, instrumentalness: 0.45, liveness: 0.15, tempo: 130 },
  'Folk Metal':        { danceability: 0.55, energy: 0.80, valence: 0.65, acousticness: 0.30, instrumentalness: 0.20, liveness: 0.18, tempo: 140 },
  'Metalcore':         { danceability: 0.42, energy: 0.93, valence: 0.30, acousticness: 0.04, instrumentalness: 0.10, liveness: 0.20, tempo: 145 },
};

const DEFAULT_METRICS: AudioMetrics = GENRE_BASE_METRICS['Heavy Metal'];

// ═══════════════════════════════════════════════════════════
// AJUSTEMENTS PAR TAGS LAST.FM
// ═══════════════════════════════════════════════════════════
type TagAdjuster = (m: AudioMetrics) => void;

const TAG_ADJUSTMENTS: Record<string, TagAdjuster> = {
  'ambient':          (m) => { m.acousticness += 0.15; m.energy -= 0.10; },
  'acoustic':         (m) => { m.acousticness += 0.40; m.energy -= 0.15; },
  'instrumental':     (m) => { m.instrumentalness += 0.40; },
  'live':             (m) => { m.liveness += 0.30; },
  'melodic':          (m) => { m.valence += 0.10; },
  'brutal':           (m) => { m.energy += 0.05; m.valence -= 0.05; },
  'aggressive':       (m) => { m.energy += 0.05; m.valence -= 0.05; },
  'funeral doom':     (m) => { m.tempo -= 20; m.energy -= 0.10; },
  'slow':             (m) => { m.tempo -= 15; },
  'female vocalists': (m) => { m.valence += 0.05; },
  'epic':             (m) => { m.valence += 0.08; m.instrumentalness += 0.05; },
  'atmospheric':      (m) => { m.acousticness += 0.10; m.liveness += 0.05; },
};

// ═══════════════════════════════════════════════════════════
// ESTIMATION FALLBACK (Last.fm tags + pilier)
// ═══════════════════════════════════════════════════════════
export function estimateFromLastfm(
  pillar: string,
  tags: string[],
  bandName: string
): AudioMetrics {
  const base = GENRE_BASE_METRICS[pillar] || DEFAULT_METRICS;
  const metrics: AudioMetrics = { ...base };

  // Appliquer les ajustements de tags
  for (const tag of tags) {
    const adjuster = TAG_ADJUSTMENTS[tag.toLowerCase()];
    if (adjuster) adjuster(metrics);
  }

  // Variation déterministe ±0.06 pour éviter l'uniformité
  const seed = hashString(bandName);
  const keys: (keyof AudioMetrics)[] = [
    'danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'liveness',
  ];
  keys.forEach((key, i) => {
    metrics[key] = clamp01(metrics[key] + seededVariation(seed, i) * 0.12);
  });
  metrics.tempo = Math.max(40, Math.round(metrics.tempo + seededVariation(seed, 6) * 20));

  return metrics;
}

// ═══════════════════════════════════════════════════════════
// EXTRACTION ACOUSTICBRAINZ (low-level)
// ═══════════════════════════════════════════════════════════
export function extractFromAcousticBrainz(raw: any): Partial<AudioMetrics> | null {
  if (!raw) return null;

  // AcousticBrainz peut retourner un array si plusieurs enregistrements
  const data = Array.isArray(raw) ? raw[0] : raw;
  if (!data || typeof data !== 'object') return null;

  const metrics: Partial<AudioMetrics> = {};

  // Tempo ← rhythm.bpm
  const bpm = data.rhythm?.bpm;
  if (typeof bpm === 'number' && bpm > 30 && bpm < 300) {
    metrics.tempo = Math.round(bpm);
  }

  // Danceability ← tonal.danceability
  const dance = data.tonal?.danceability?.all?.danceable;
  if (typeof dance === 'number') metrics.danceability = clamp01(dance);

  // Energy ← dynamics.loudness (dB, typiquement -60..0)
  const loudness = data.dynamics?.loudness;
  if (typeof loudness === 'number') metrics.energy = clamp01((loudness + 60) / 55);

  // Valence ← tonal.mood_happy
  const happy = data.tonal?.mood_happy?.all?.happy;
  if (typeof happy === 'number') metrics.valence = clamp01(happy);

  // Acousticness ← tonal.mood_acoustic
  const acoustic = data.tonal?.mood_acoustic?.all?.acoustic;
  if (typeof acoustic === 'number') metrics.acousticness = clamp01(acoustic);

  // Instrumentalness ← tonal.voice_instrumental
  const instrumental = data.tonal?.voice_instrumental?.all?.instrumental;
  if (typeof instrumental === 'number') metrics.instrumentalness = clamp01(instrumental);

  // Au moins 2 métriques sinon on considère comme inutilisable
  return Object.keys(metrics).length >= 2 ? metrics : null;
}

// ═══════════════════════════════════════════════════════════
// FUSION : AcousticBrainz + complétion fallback
// ═══════════════════════════════════════════════════════════
export function mergeMetrics(
  abMetrics: Partial<AudioMetrics> | null,
  fallback: AudioMetrics
): { metrics: AudioMetrics; source: AudioFeaturesResponse['source']; coverage: number } {
  if (!abMetrics) {
    return { metrics: fallback, source: 'lastfm', coverage: 0 };
  }

  const keys: (keyof AudioMetrics)[] = [
    'danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'liveness', 'tempo',
  ];

  const merged = { ...fallback } as AudioMetrics;
  let fromAb = 0;

  for (const key of keys) {
    const value = abMetrics[key];
    if (typeof value === 'number') {
      (merged as any)[key] = value;
      fromAb++;
    }
  }

  const coverage = fromAb / keys.length;
  const source: AudioFeaturesResponse['source'] = coverage === 1 ? 'acousticbrainz' : 'hybrid';

  return { metrics: merged, source, coverage };
}
