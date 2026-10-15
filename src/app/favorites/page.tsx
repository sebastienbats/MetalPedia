'use client';

import { useState, useMemo } from 'react';
import { useFavoriteBands, useFavoritesCount } from '@/stores/favoritesStore';
import BandCard from '@/components/bands/BandCard';
import Link from 'next/link';
import { GAMIFICATION_PILLARS, PILLAR_METADATA, type GamificationPillar } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// GÉNÉRATEUR DE DRAPEAUX + CODE ISO (Pour compatibilité Windows/Mac)
// ═══════════════════════════════════════════════════════════

const COUNTRY_TO_ISO: Record<string, string> = {
  'norway': 'NO', 'sweden': 'SE', 'finland': 'FI', 'denmark': 'DK', 'iceland': 'IS',
  'germany': 'DE', 'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB',
  'united states': 'US', 'usa': 'US', 'us': 'US', 'united states of america': 'US', 'america': 'US',
  'canada': 'CA', 'france': 'FR', 'italy': 'IT', 'spain': 'ES', 'netherlands': 'NL', 'the netherlands': 'NL',
  'belgium': 'BE', 'poland': 'PL', 'russia': 'RU', 'russian federation': 'RU', 'ukraine': 'UA',
  'greece': 'GR', 'romania': 'RO', 'brazil': 'BR', 'argentina': 'AR', 'chile': 'CL',
  'mexico': 'MX', 'colombia': 'CO', 'japan': 'JP', 'south korea': 'KR', 'korea, republic of': 'KR',
  'china': 'CN', 'australia': 'AU', 'new zealand': 'NZ', 'switzerland': 'CH', 'austria': 'AT',
  'hungary': 'HU', 'czech republic': 'CZ', 'czechia': 'CZ', 'slovakia': 'SK', 'ireland': 'IE',
  'scotland': 'SCT', 'wales': 'WLS', 'england': 'ENG',
  'unknown': 'UN', 'various': 'UN', 'worldwide': 'UN'
};

const getFlagEmojiFromIso = (countryCode: string) => {
  if (countryCode.length !== 2) {
    if (countryCode === 'SCT') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
    if (countryCode === 'WLS') return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
    if (countryCode === 'ENG') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    return '🌍';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// ✅ Fonction qui retourne l'émoji + le code ISO entre crochets pour une compatibilité totale
const getCountryDisplay = (countryName: string) => {
  if (!countryName) return '🌍 [??] Unknown';
  
  const normalized = countryName.trim().toLowerCase().replace(/\s+/g, ' ');
  const isoCode = COUNTRY_TO_ISO[normalized];
  
  if (isoCode) {
    const flag = getFlagEmojiFromIso(isoCode);
    const codeDisplay = isoCode.length === 2 ? `[${isoCode}]` : '';
    return `${flag} ${codeDisplay} ${countryName}`.trim();
  }
  
  return `🌍 [??] ${countryName}`;
};

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

type SortOption = 'name-asc' | 'name-desc' | 'listeners-asc' | 'listeners-desc';

export default function FavoritesPage() {
  const favorites = useFavoriteBands();
  const count = useFavoritesCount();

  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [filterPillar, setFilterPillar] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  const uniqueCountries = useMemo(() => {
    const countries = new Set(
      favorites.map((band) => band.country).filter((c): c is string => Boolean(c))
    );
    return Array.from(countries).sort((a, b) => a.localeCompare(b));
  }, [favorites]);

  const processedFavorites = useMemo(() => {
    let result = [...favorites];

    if (filterPillar !== 'all') {
      result = result.filter((band) => band.genre_pillar === filterPillar);
    }

    if (filterCountry !== 'all') {
      result = result.filter((band) => band.country === filterCountry);
    }

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
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="font-metal text-2xl sm:text-4xl text-metal-fire mb-2 sm:mb-4">
          ❤️ Mes Favoris
        </h1>
        <p className="text-metal-bone font-serif text-sm sm:text-base lg:text-lg">
          {count} groupe{count > 1 ? 's' : ''} sauvegardé{count > 1 ? 's' : ''} dans ton Metalverse.
        </p>
      </div>

      {favorites.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <label htmlFor="filter-pillar" className="sr-only">Filtrer par pilier</label>
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

          <div className="flex-1">
            <label htmlFor="filter-country" className="sr-only">Filtrer par pays</label>
            <select
              id="filter-country"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full bg-metal-black border border-metal-gray rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-metal-fire focus:ring-1 focus:ring-metal-fire/50 transition-all cursor-pointer"
            >
              <option value="all">🌍 Tous les Pays</option>
              {uniqueCountries.map((country) => (
                <option key={country} value={country}>
                  {getCountryDisplay(country)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="sort-by" className="sr-only">Trier par</label>
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
