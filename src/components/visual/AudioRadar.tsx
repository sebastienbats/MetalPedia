'use client';

import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { useAudioFeatures } from '@/api/hooks';
import type { AudioFeaturesResponse } from '@/lib/audio/audioMetrics';

// ═══════════════════════════════════════════════════════════
// LABELS FRANÇAIS DES MÉTRIQUES
// ═══════════════════════════════════════════════════════════
const METRIC_LABELS: { key: keyof AudioFeaturesResponse['metrics']; label: string; icon: string }[] = [
  { key: 'danceability', label: 'Danse', icon: '💃' },
  { key: 'energy', label: 'Énergie', icon: '⚡' },
  { key: 'valence', label: 'Humeur', icon: '🌗' },
  { key: 'acousticness', label: 'Acoustique', icon: '🪕' },
  { key: 'instrumentalness', label: 'Instru', icon: '🎻' },
  { key: 'liveness', label: 'Live', icon: '🎤' },
];

const SOURCE_CONFIG = {
  acousticbrainz: { label: 'AcousticBrainz', icon: '🧬', color: '#00b894' },
  hybrid: { label: 'Hybride AB + Last.fm', icon: '🔀', color: '#fdcb6e' },
  lastfm: { label: 'Estimation Last.fm', icon: '🎯', color: '#d63031' },
} as const;

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
interface Props {
  bandId: number;
  bandName: string;
}

export default function AudioRadar({ bandId, bandName }: Props) {
  const { data, isLoading } = useAudioFeatures(bandId);

  const radarData = useMemo(() => {
    if (!data) return [];
    return METRIC_LABELS.map(({ key, label }) => ({
      metric: label,
      value: Math.round((data.metrics[key] as number) * 100),
    }));
  }, [data]);

  const sourceConfig = data ? SOURCE_CONFIG[data.source] : null;

  return (
    <div className="metal-card p-5 border border-metal-gray">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg text-gray-200 flex items-center gap-2">
           Empreinte Audio
        </h3>
        {sourceConfig && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{
              color: sourceConfig.color,
              borderColor: `${sourceConfig.color}60`,
              backgroundColor: `${sourceConfig.color}15`,
            }}
            title={`Source des données : ${sourceConfig.label}`}
          >
            {sourceConfig.icon} {sourceConfig.label}
          </span>
        )}
      </div>

      {isLoading || !data ? (
        <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
          <span className="animate-pulse">Analyse acoustique en cours...</span>
        </div>
      ) : (
        <>
          {/* Radar chart */}
          <div className="h-48 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#3a3a3a" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name={bandName}
                  dataKey="value"
                  stroke="#ff4500"
                  fill="#ff4500"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Tempo + détails */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-metal-black/50 rounded-lg p-2 text-center border border-metal-gray/50">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider">Tempo</div>
              <div className="text-metal-fire font-bold text-sm">
                {data.metrics.tempo} BPM
              </div>
            </div>
            <div className="bg-metal-black/50 rounded-lg p-2 text-center border border-metal-gray/50">
              <div className="text-gray-500 text-[10px] uppercase tracking-wider">Fiabilité</div>
              <div className="text-gray-200 font-bold text-sm">
                {Math.round(data.coverage * 100)}%
              </div>
            </div>
          </div>

          {/* Légende des métriques */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {METRIC_LABELS.map(({ key, label, icon }) => (
              <span
                key={key}
                className="text-[9px] px-1.5 py-0.5 bg-metal-black/40 border border-metal-gray/40 rounded text-gray-400"
                title={`${label} : ${Math.round((data.metrics[key] as number) * 100)}%`}
              >
                {icon} {Math.round((data.metrics[key] as number) * 100)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
