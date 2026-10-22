'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import BandCard from '@/components/bands/BandCard';
import SubgenreFilter from '@/components/genres/SubgenreFilter';
import FloatingRunes, { type SymbolFamily } from '@/components/ui/FloatingRunes';
import FireTitle from '@/components/ui/FireTitle'; // ✅ NOUVEAU : Composant de titre enflammé
import { type Band, type GenrePillarStats } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// GÉNÉRATEUR DE DRAPEAUX (Identique à favorites/page.tsx)
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
  'unknown': 'UN', 'various': 'UN', 'worldwide': 'UN', 'cyprus': 'CY', 'estonia': 'EE', 
  'faroe islands': 'FO', 'guadeloupe': 'GP', 'india': 'IN', 'iraq': 'IQ', 'philippines': 'PH', 
  'portugal': 'PT', 'slovenia': 'SI', 'turkey': 'TR', 'bangladesh': 'BD', 'belize': 'BZ', 
  'bosnia and herzegovina': 'BA', 'croatia': 'HR', 'cuba': 'CU', 'honduras': 'HN', 'hong kong': 'HK', 
  'indonesia': 'ID', 'israel': 'IL', 'jamaica': 'JM', 'latvia': 'LV', 'malaysia': 'MY', 
  'montserrat': 'MS', 'peru': 'PE', 'serbia': 'RS', 'south africa': 'ZA',
  'taiwan (province of china)': 'TW', 'united arab emirates': 'AE', 
  'venezuela (bolivarian republic of)': 'VE', 'zimbabwe': 'ZW',
};

const getFlagEmojiFromIso = (countryCode: string) => {
  if (countryCode.length !== 2) {
    if (countryCode === 'SCT') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
    if (countryCode === 'WLS') return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
    if (countryCode === 'ENG') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    return '🌍';
  }
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getFlagEmoji = (countryName: string) => {
  if (!countryName) return '🌍';
  const normalized = countryName.trim().toLowerCase().replace(/\s+/g, ' ');
  const isoCode = COUNTRY_TO_ISO[normalized];
  return isoCode ? getFlagEmojiFromIso(isoCode) : '🌍';
};

// ═══════════════════════════════════════════════════════════
// COMPOSANT CLIENT
// ═══════════════════════════════════════════════════════════
type SortOption = 'name-asc' | 'name-desc' | 'listeners-asc' | 'listeners-desc';

interface PillarClientViewProps {
  bands: Band[];
  validPillar: string;
  pillarColor: string; // ✅ NOUVEAU : Reçoit la couleur du pilier pour le feu
  pillarMetadata: { icon: string; color: string; description: string };
  runesConfig: { family: SymbolFamily; colorClass: string; opacityFactor: number; baseDuration: number; count: number };
  currentPillarStats: GenrePillarStats | undefined;
  currentSubgenre?: string;
}

export default function PillarClientView({
  bands,
  validPillar,
  pillarColor, // ✅ NOUVEAU
  pillarMetadata,
  runesConfig,
  currentPillarStats,
  currentSubgenre,
}: PillarClientViewProps) {
  const [sortBy, setSortBy] = useState<SortOption>('listeners-desc');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // Extraction dynamique des pays (comme dans favorites)
  const uniqueCountries = useMemo(() => {
    const countries = new Set(
      bands.map((band) => band.country).filter((c): c is string => Boolean(c))
    );
    return Array.from(countries).sort((a, b) => a.localeCompare(b));
  }, [bands]);

  // Filtrage et tri côté client (ultra-rapide pour ~1300 éléments)
  const processedBands = useMemo(() => {
    let result = [...bands];

    if (filterCountry !== 'all') {
      result = result.filter((band) => band.country === filterCountry);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'listeners-asc': return (a.listeners || 0) - (b.listeners || 0);
        case 'listeners-desc': return (b.listeners || 0) - (a.listeners || 0);
        default: return 0;
      }
    });

    return result;
  }, [bands, filterCountry, sortBy]);

  return (
    <>
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <FloatingRunes
          family={runesConfig.family}
          colorClass={runesConfig.colorClass}
          opacityFactor={runesConfig.opacityFactor}
          baseDuration={runesConfig.baseDuration}
          count={runesConfig.count}
          boundaryFactor={0.9}
        />
      </div>

      <div className="relative z-20 w-full px-2 py-6 sm:px-4 sm:py-12">
        {/* En-tête */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            <Link href="/genres" className="hover:text-metal-fire transition-colors">Piliers</Link>
            <span>→</span>
            <span className="text-gray-300">{validPillar}</span>
            {currentSubgenre && (
              <>
                <span>→</span>
                <span className="text-metal-fire">{currentSubgenre}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-center">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl sm:text-4xl border-2 shrink-0"
              style={{
                borderColor: pillarMetadata.color,
                backgroundColor: `${pillarMetadata.color}15`,
                boxShadow: `0 0 20px ${pillarMetadata.color}40`,
              }}
            >
              {pillarMetadata.icon}
            </div>
            
            <div className="text-center">
              {/* ✅ REMPLACEMENT DU H1 PAR FIRETITLE AVEC LA COULEUR DU PILIER */}
              <FireTitle 
                text={validPillar} 
                color={pillarColor} 
                autoIgnite={true}
                className="text-3xl sm:text-5xl md:text-6xl drop-shadow-lg"
              />
              
              <p className="text-metal-bone font-serif text-sm sm:text-base mt-2 drop-shadow-md">
                {pillarMetadata.description}
              </p>
            </div>
          </div>

          <div className="text-metal-bone font-serif text-sm sm:text-base text-center">
            <span className="text-metal-fire font-bold text-xl sm:text-2xl">{processedBands.length}</span>
            {' '}groupe{processedBands.length > 1 ? 's' : ''}
            {currentSubgenre && (
              <>
                {' '}dans{' '}
                <span className="text-metal-fire font-semibold">{currentSubgenre}</span>
              </>
            )}
            {filterCountry !== 'all' && (
              <>
                {' '}en{' '}
                <span className="text-metal-fire font-semibold">{filterCountry}</span>
              </>
            )}
          </div>
        </div>

        {/* Filtre de sous-genre (Server-side via URL) */}
        {currentPillarStats && currentPillarStats.subgenres.length > 1 && (
          <SubgenreFilter pillar={validPillar} subgenres={currentPillarStats.subgenres} />
        )}

        {/* Barre de contrôles (Client-side : Pays + Tri) */}
        {bands.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
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
                    {getFlagEmoji(country)} {country}
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
                <option value="listeners-desc">👥 Auditeurs (Plus → Moins)</option>
                <option value="listeners-asc">👥 Auditeurs (Moins → Plus)</option>
                <option value="name-asc">🔤 Nom (A → Z)</option>
                <option value="name-desc">🔤 Nom (Z → A)</option>
              </select>
            </div>
          </div>
        )}

        {/* Grille des groupes */}
        {processedBands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {processedBands.map((band) => (
              <BandCard key={band.id} band={band} />
            ))}
          </div>
        ) : (
          <div className="metal-card p-6 sm:p-12 text-center border border-metal-gray/50 bg-metal-black/50 backdrop-blur-sm">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
            <p className="text-metal-bone font-serif text-sm sm:text-lg">
              Aucun groupe trouvé pour ces critères.
            </p>
            <button
              onClick={() => { setFilterCountry('all'); setSortBy('listeners-desc'); }}
              className="mt-3 sm:mt-4 inline-block text-metal-fire hover:underline text-sm sm:text-base cursor-pointer"
            >
              Réinitialiser les filtres →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
