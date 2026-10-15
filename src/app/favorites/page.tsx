'use client';

import { useState, useMemo } from 'react';
import { useFavoriteBands, useFavoritesCount } from '@/stores/favoritesStore';
import BandCard from '@/components/bands/BandCard';
import Link from 'next/link';
// ✅ Import direct depuis la source de vérité
import { GAMIFICATION_PILLARS, PILLAR_METADATA, type GamificationPillar } from '@/types/api';

// Dictionnaire des drapeaux pour les pays du metal (extensible)
const COUNTRY_FLAGS: Record<string, string> = {
  'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Finland': '🇫🇮', 'Denmark': '🇩🇰', 'Iceland': '🇮🇸',
  'Germany': '🇩🇪', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Canada': '🇨🇦',
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪',
  'Poland': '🇵🇱', 'Russia': '🇷🇺', 'Ukraine': '🇺🇦', 'Greece': '🇬🇷', 'Romania': '🇷🇴',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Mexico': '🇲🇽', 'Colombia': '🇨🇴',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳', 'Australia': '🇦🇺', 'New Zealand': '🇳🇿',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Hungary': '🇭🇺', 'Czech Republic': '🇨🇿', 'Slovakia': '🇸🇰',
  'Ireland': '🇮🇪', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Unknown': '🌍', 'Various': '🌍', 'Worldwide': '🌍'
};

const getFlagEmoji = (countryName: string) => {
  return COUNTRY_FLAGS[countryName] || '🌍'; // Fallback sur le globe si le pays n'est pas dans la liste
};

type SortOption = 'name-asc' | 'name-desc' | 'listeners-asc' | 'listeners-desc';

export default function FavoritesPage() {
  const favorites = useFavoriteBands();
  const count = useFavoritesCount();

  // États pour le tri et les filtres
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // ═══════════════════════════════════════════════════════════
  // EXTRACTION DYNAMIQUE DES PAYS (triés alphabétiquement)
  // ═══════════════════════════════════════════════════════════
  const uniqueCountries = useMemo(() => {
    const countries = new Set(
      favorites.map((band) => band.country).filter((c): c is string => Boolean(c))
    );
    return Array.from(countries).sort((a, b) => a.localeCompare(b));
  }, [favorites]);

  // ═══════════════════════════════════════════════════════════
  // LOGIQUE DE FILTRAGE ET DE TRI (Optimisée avec useMemo)
  // ═══════════════════════════════════════════════════════════
  const processedFavorites = useMemo(() => {
    let result = [...favorites];

    // 1. Filtrer par pilier
    if (filterPillar !== 'all') {
      result = result.filter((band) => band.genre_pillar === filterPillar);
    }

    // 2. Filtrer par pays
    if (filterCountry !== 'all') {
      result = result.filter((band) => band.country === filterCountry);
    }

    // 3. Trier le résultat
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'listeners-asc':
          return (a.listeners || 0) - (b.listeners || 0);
        case 'listeners-desc':
          return (b.listeners || 0) - (a.listeners || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [favorites, sortBy, filterPillar, filterCountry]);

  return (
    <div className="w-full px-2 py-6 sm:px-4 sm:py-12">
      {/* ── EN-TÊTE ── */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          ❤️ Mes Favoris
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg">
          {count} groupe{count > 1 ? 's' : ''} sauvegardé{count > 1 ? 's' : ''} dans ton Metalverse.
        </p>
      </div>

      {/* ── BARRE DE CONTRÔLES (Filtres & Tri) ── */}
      {favorites.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          
          {/* 1. Filtre par Pilier (Depuis src/types/api.ts) */}
          <div className="flex-1">
            <label htmlFor="filter-pillar" className="sr-only">
              Filtrer par pilier
            </label>
            <select
              id="filter-pillar"
              value={filterPillar}
              onChange={(e) => setFilterPillar(e.target.value)}
              className="w-full bg-metal-black border border-metal-gray rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-metal-fire focus:ring-1 focus:ring-metal-fire/50 transition-all cursor-pointer"
            >
              <option value="all">🏛️ Tous les Piliers</option>
              {GAMIFICATION_PILLARS.map((pillar) => (
                <option key={pillar} value={pillar}>
                  {PILLAR_METADATA[pillar as GamificationPillar].icon} {pillar}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filtre par Pays (Dynamique avec drapeaux) */}
          <div className="flex-1">
            <label htmlFor="filter-country" className="sr-only">
              Filtrer par pays
            </label>
            <select
              id="filter-country"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full bg-metal-black border border-metal-gray rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-metal-fire focus:ring-1 focus:ring-metal-fire/50 transition-all cursor-pointer"
            >
              <option value="all">🌍 Tous les Pays</option>
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {getFlagEmoji(country)} {country}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Tri */}
          <div className="flex-1">
            <label htmlFor="sort-by" className="sr-only">
              Trier par
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-metal-black border border-metal-gray rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-metal-fire focus:ring-1 focus:ring-metal-fire/50 transition-all cursor-pointer"
            >
              <option value="name-asc">🔤 Nom (A → Z)</option>
              <option value="name-desc">🔤 Nom (Z → A)</option>
              <option value="listeners-desc">👥 Auditeurs (Plus → Moins)</option>
              <option value="listeners-asc">👥 Auditeurs (Moins → Plus)</option>
            </select>
          </div>
        </div>
      )}

      {/* ── GRILLE DES FAVORIS OU ÉTAT VIDE ── */}
      {processedFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {processedFavorites.map((band) => (
            <BandCard key={band.id} band={band} />
          ))}
        </div>
      ) : (
        <div className="metal-card p-6 sm:p-8 text-center border border-metal-gray">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">
            {favorites.length === 0 ? '🎸' : '🔍'}
          </div>
          <h2 className="font-metal text-xl sm:text-3xl text-metal-fire mb-3 sm:mb-4">
            {favorites.length === 0
              ? 'Aucun favori pour le moment'
              : 'Aucun groupe trouvé pour ces critères'}
          </h2>
          <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
            {favorites.length === 0
              ? "Explore l'encyclopédie et ajoute des groupes à ta collection personnelle."
              : "Essaie de modifier tes filtres ou réinitialise-les pour tout voir."}
          </p>
          {favorites.length === 0 && (
            <Link
              href="/genres"
              className="inline-block px-6 py-3 bg-metal-fire text-white rounded-lg font-semibold hover:bg-metal-fire/80 transition-colors text-sm sm:text-base"
            >
              Explorer les 9 Piliers du Metal
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
