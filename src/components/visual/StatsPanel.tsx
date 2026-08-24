'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useStatsStore } from '@/stores/statsStore';
import { useGamificationStore } from '@/stores/gamificationStore';

// ═══════════════════════════════════════════
// COULEURS DES GRAPHIQUES
// ═══════════════════════════════════════════

const GENRE_COLORS = [
  '#d63031', // Rouge metal
  '#b33939', // Rouge sombre
  '#8b0000', // Sang
  '#c9a227', // Or
  '#4a148c', // Violet gothique
  '#0277bd', // Bleu frost
  '#00695c', // Vert doom
  '#ff6f00', // Orange thrash
];

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════

export default function StatsPanel() {
  const {
    getGenreBreakdown,
    getCountryBreakdown,
    getTotalViews,
    getMostViewedGenre,
  } = useStatsStore();

  const totalXP = useGamificationStore((s) => s.stats.totalXP);
  const level = useGamificationStore((s) => s.stats.level);

  const genres = useMemo(() => getGenreBreakdown(), [getGenreBreakdown]);
  const countries = useMemo(() => getCountryBreakdown(), [getCountryBreakdown]);
  const totalViews = getTotalViews();
  const topGenre = getMostViewedGenre();

  // ─────────────────────────────────────────
  // ÉTAT VIDE
  // ─────────────────────────────────────────
  if (totalViews === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3 animate-bounce-subtle">🧬</div>
        <h3 className="font-serif text-xl mb-2">Votre ADN Metal</h3>
        <p className="text-gray-400 text-sm">
          Explorez des groupes pour découvrir votre profil metal unique.
          Chaque consultation nourrit votre légende.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ÉTAT AVEC DONNÉES
  // ─────────────────────────────────────────
  const topCountry = countries[0];
  const genreData = genres.slice(0, 6);

  return (
    <div className="metal-card p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-metal text-2xl text-metal-fire mb-2 flex items-center gap-2">
          <span aria-hidden="true">🧬</span>
          Votre ADN Metal
        </h3>
        <p className="text-sm text-gray-400">
          Basé sur <span className="text-metal-fire font-semibold">{totalViews}</span> groupes consultés
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-metal-black/50 rounded-lg p-4 border border-metal-gray">
          <div className="text-xs text-gray-400 mb-1">Genre dominant</div>
          <div className="text-lg font-bold truncate" title={topGenre || undefined}>
            {topGenre || '—'}
          </div>
          {genres[0] && (
            <div className="text-sm text-metal-fire">{genres[0].percent}%</div>
          )}
        </div>

        <div className="bg-metal-black/50 rounded-lg p-4 border border-metal-gray">
          <div className="text-xs text-gray-400 mb-1">Pays favori</div>
          <div className="text-lg font-bold truncate" title={topCountry?.country}>
            {topCountry?.country || '—'}
          </div>
          {topCountry && (
            <div className="text-sm text-metal-fire">{topCountry.percent}%</div>
          )}
        </div>
      </div>

      {/* Graphique en camembert : Genres */}
      {genreData.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-300 mb-2 font-semibold">
            🎸 Répartition des genres
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genreData}
                dataKey="count"
                nameKey="genre"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={2}
              >
                {genreData.map((_, idx) => (
                  <Cell
                    key={`genre-${idx}`}
                    fill={GENRE_COLORS[idx % GENRE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [`${value} groupes`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Légende */}
          <div className="grid grid-cols-2 gap-1 mt-2">
            {genreData.map((genre, idx) => (
              <div key={genre.genre} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: GENRE_COLORS[idx % GENRE_COLORS.length] }}
                />
                <span className="truncate flex-1" title={genre.genre}>
                  {genre.genre}
                </span>
                <span className="text-gray-400">{genre.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphique en barres : Pays */}
      {countries.length > 0 && (
        <div>
          <h4 className="text-sm text-gray-300 mb-2 font-semibold">
            🌍 Top pays explorés
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={countries.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="country"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value} groupes`, 'Consultations']}
              />
              <Bar dataKey="count" fill="#d63031" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer : Niveau gamification */}
      <div className="pt-4 border-t border-metal-gray flex items-center justify-between">
        <span className="text-sm text-gray-400">Progression totale</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Niv. {level}</span>
          <span className="text-metal-fire font-bold">
            {totalXP.toLocaleString()} XP
          </span>
        </div>
      </div>
    </div>
  );
}
