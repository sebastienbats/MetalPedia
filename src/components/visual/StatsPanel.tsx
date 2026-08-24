'use client';

import { useStatsStore } from '@/stores/statsStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#d63031', '#b33939', '#8b0000', '#c9a227', '#4a148c', '#0277bd'];

export default function StatsPanel() {
  const { getGenreBreakdown, getCountryBreakdown, getTotalViews } = useStatsStore();

  const genres = getGenreBreakdown();
  const countries = getCountryBreakdown();
  const total = getTotalViews();

  if (total === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🧬</div>
        <h3 className="font-serif text-xl mb-2">Votre ADN Metal</h3>
        <p className="text-gray-400">Explorez des groupes pour découvrir votre profil.</p>
      </div>
    );
  }

  const topGenre = genres[0];
  const topCountry = countries[0];

  return (
    <div className="metal-card p-6 space-y-6">
      <div>
        <h3 className="font-metal text-2xl text-metal-fire mb-2">🧬 Votre ADN Metal</h3>
        <p className="text-sm text-gray-400">Basé sur {total} groupes consultés</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-metal-black/50 rounded-lg p-4 border border-metal-gray">
          <div className="text-xs text-gray-400 mb-1">Genre dominant</div>
          <div className="text-lg font-bold">{topGenre?.genre}</div>
          <div className="text-sm text-metal-fire">{topGenre?.percent}%</div>
        </div>
        <div className="bg-metal-black/50 rounded-lg p-4 border border-metal-gray">
          <div className="text-xs text-gray-400 mb-1">Pays favori</div>
          <div className="text-lg font-bold">{topCountry?.country}</div>
          <div className="text-sm text-metal-fire">{topCountry?.percent}%</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm text-gray-300 mb-2">Répartition des genres</h4>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={genres.slice(0, 6)}
              dataKey="percent"
              nameKey="genre"
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
            >
              {genres.slice(0, 6).map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              labelStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
