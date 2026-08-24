'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AudioFeatures } from '@/api/spotify';
import { interpretFeatures } from '@/api/spotify';

interface Props {
  features: AudioFeatures;
  bandName: string;
}

export default function AudioRadar({ features, bandName }: Props) {
  const data = [
    { feature: 'Énergie', value: Math.round(features.energy * 100), fullMark: 100 },
    { feature: 'Danceabilité', value: Math.round(features.danceability * 100), fullMark: 100 },
    { feature: 'Positivité', value: Math.round(features.valence * 100), fullMark: 100 },
    { feature: 'Acoustique', value: Math.round(features.acousticness * 100), fullMark: 100 },
    { feature: 'Instru', value: Math.round(features.instrumentalness * 100), fullMark: 100 },
    { feature: 'Live', value: Math.round(features.liveness * 100), fullMark: 100 },
    { feature: 'Tempo', value: Math.round((features.tempo / 200) * 100), fullMark: 100 },
  ];

  const insights = interpretFeatures(features);

  // Déterminer le BPM category
  const bpmCategory =
    features.tempo > 160 ? '🔥 Très rapide' :
    features.tempo > 120 ? '⚡ Rapide' :
    features.tempo > 90 ? '🎸 Modéré' :
    '🐢 Lent';

  return (
    <div className="metal-card p-6 space-y-6">
      {/* Header */}
      <header className="text-center">
        <h3 className="font-serif text-2xl mb-2">🎧 Empreinte Audio</h3>
        <p className="text-sm text-gray-400">
          Analyse Spotify des top tracks de{' '}
          <span className="text-metal-fire font-semibold">{bandName}</span>
        </p>
      </header>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid stroke="#2a2a2a" />
          <PolarAngleAxis
            dataKey="feature"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={bandName}
            dataKey="value"
            stroke="#d63031"
            fill="#d63031"
            fillOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-metal-black/50 rounded-lg p-3 border border-metal-gray text-center">
          <div className="text-xs text-gray-400 mb-1">Tempo moyen</div>
          <div className="text-xl font-bold text-metal-fire">
            {Math.round(features.tempo)} BPM
          </div>
          <div className="text-xs text-gray-500 mt-1">{bpmCategory}</div>
        </div>

        <div className="bg-metal-black/50 rounded-lg p-3 border border-metal-gray text-center">
          <div className="text-xs text-gray-400 mb-1">Loudness</div>
          <div className="text-xl font-bold text-metal-fire">
            {features.loudness.toFixed(1)} dB
          </div>
        </div>

        <div className="bg-metal-black/50 rounded-lg p-3 border border-metal-gray text-center">
          <div className="text-xs text-gray-400 mb-1">Tracks analysées</div>
          <div className="text-xl font-bold text-metal-fire">
            {features.track_count}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-300 mb-3 font-semibold">
            💡 Interprétation musicale
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.map((insight, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-metal-gray/50 border border-metal-gray rounded-full text-sm hover:border-metal-fire transition-colors"
              >
                {insight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-metal-gray">
        Données basées sur les {features.track_count} tracks les plus populaires du groupe
      </div>
    </div>
  );
}
