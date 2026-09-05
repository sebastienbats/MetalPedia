'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { metalServerApi } from '@/lib/metal-api';
import type { Band } from '@/types/api';
import Loader from '@/components/ui/Loader';

// Import dynamique du globe (client-only, pas de SSR)
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-metal-black/50 rounded-lg border border-metal-gray">
      <Loader text="Chargement du globe 3D..." />
    </div>
  ),
});

// ═══════════════════════════════════════════
// COORDONNÉES ET DRAPEAUX DES PAYS
// (Les clés doivent correspondre aux pays normalisés par le script Python)
// ═══════════════════════════════════════════
const COUNTRY_INFO: Record<string, { lat: number; lng: number; flag: string }> = {
  'United States': { lat: 39.8, lng: -98.5, flag: '🇺🇸' },
  'Germany': { lat: 51.1, lng: 10.4, flag: '🇩🇪' },
  'United Kingdom': { lat: 54.0, lng: -2.0, flag: '🇬🇧' },
  'Sweden': { lat: 62.0, lng: 15.0, flag: '🇸🇪' },
  'Finland': { lat: 64.0, lng: 26.0, flag: '🇫🇮' },
  'Brazil': { lat: -10.0, lng: -52.0, flag: '🇧🇷' },
  'Norway': { lat: 61.0, lng: 9.0, flag: '🇳🇴' },
  'France': { lat: 46.6, lng: 2.2, flag: '🇫🇷' },
  'Canada': { lat: 56.0, lng: -106.0, flag: '🇨🇦' },
  'Russia': { lat: 61.5, lng: 90.0, flag: '🇷🇺' },
  'Italy': { lat: 42.5, lng: 12.5, flag: '🇮🇹' },
  'Japan': { lat: 36.2, lng: 138.2, flag: '🇯🇵' },
  'Poland': { lat: 51.9, lng: 19.1, flag: '🇵🇱' },
  'Netherlands': { lat: 52.1, lng: 5.3, flag: '🇳🇱' },
  'Australia': { lat: -25.0, lng: 133.0, flag: '🇦🇺' },
  'Spain': { lat: 40.4, lng: -3.7, flag: '🇪🇸' },
  'Denmark': { lat: 56.2, lng: 9.5, flag: '🇩🇰' },
  'Mexico': { lat: 23.6, lng: -102.5, flag: '🇲🇽' },
  'Argentina': { lat: -34.0, lng: -64.0, flag: '🇦🇷' },
  'Greece': { lat: 39.0, lng: 22.0, flag: '🇬🇷' },
  'Switzerland': { lat: 46.8, lng: 8.2, flag: '🇨🇭' },
  'Austria': { lat: 47.5, lng: 14.5, flag: '🇦🇹' },
  'Chile': { lat: -31.0, lng: -71.0, flag: '🇨🇱' },
  'Belgium': { lat: 50.5, lng: 4.5, flag: '🇧🇪' },
  'Portugal': { lat: 39.4, lng: -8.2, flag: '🇵🇹' },
  'Czechia': { lat: 49.8, lng: 15.5, flag: '🇨🇿' },
};

interface CountryData {
  name: string;
  lat: number;
  lng: number;
  bandCount: number;
  flag: string;
}

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════

export default function MetalMapClient() {
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);

  // 1. Récupération des VRAIES données depuis Supabase
  useEffect(() => {
    async function fetchRealData() {
      try {
        setLoading(true);
        const allBands = await metalServerApi.getAllBands();

        // 2. Comptage des groupes par pays (en excluant "Unknown")
        const countryCounts: Record<string, number> = {};
        allBands.forEach((band: Band) => {
          if (band.country && band.country !== 'Unknown') {
            countryCounts[band.country] = (countryCounts[band.country] || 0) + 1;
          }
        });

        // 3. Transformation en format attendu par le Globe
        const mappedCountries: CountryData[] = Object.entries(countryCounts)
          .map(([name, count]) => {
            const info = COUNTRY_INFO[name] || { lat: 0, lng: 0, flag: '🏳️' };
            return {
              name,
              lat: info.lat,
              lng: info.lng,
              bandCount: count,
              flag: info.flag,
            };
          })
          .filter((c) => c.lat !== 0) // On retire les pays non cartographiés
          .sort((a, b) => b.bandCount - a.bandCount); // Tri par nombre de groupes

        setCountriesData(mappedCountries);
      } catch (error) {
        console.error('Erreur lors du chargement des données de la carte:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, []);

  // Calculs pour l'affichage
  const maxBandCount = useMemo(
    () => (countriesData.length > 0 ? Math.max(...countriesData.map((c) => c.bandCount)) : 1),
    [countriesData]
  );

  const totalBands = useMemo(
    () => countriesData.reduce((sum, c) => sum + c.bandCount, 0),
    [countriesData]
  );

  const topCountries = useMemo(
    () => countriesData.slice(0, 10),
    [countriesData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-metal-black/50 rounded-lg border border-metal-gray">
        <Loader text="Analyse des données Supabase et génération du globe..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Globe 3D */}
      <div className="metal-card overflow-hidden relative" style={{ height: '600px' }}>
        <Globe
          // 🛡️ CORRECTION : width et height supprimés. Le globe s'adapte automatiquement au conteneur parent (600px de haut, 100% de large).
          globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          backgroundColor="transparent"
          pointsData={countriesData}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointColor={() => '#d63031'}
          pointAltitude={(d: any) => (d.bandCount / maxBandCount) * 0.4}
          pointRadius={(d: any) => 0.3 + Math.sqrt(d.bandCount / maxBandCount) * 0.7}
          pointsMerge={false}
          onPointHover={(point: any) => setHoveredCountry(point as CountryData)}
          pointLabel={(d: any) => `
            <div style="background: #1a1a1a; padding: 8px 12px; border-radius: 6px; border: 1px solid #d63031; color: white; font-family: sans-serif; pointer-events: none;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${d.flag} ${d.name}</div>
              <div style="color: #d63031; font-size: 12px;">${d.bandCount.toLocaleString()} groupes</div>
            </div>
          `}
        />

        {/* Info du pays survolé (overlay) */}
        {hoveredCountry && (
          <div className="absolute top-4 left-4 metal-card p-4 pointer-events-none z-10 backdrop-blur-sm bg-metal-black/80 border border-metal-gray">
            <div className="text-3xl mb-1">{hoveredCountry.flag}</div>
            <div className="font-serif font-bold text-lg text-white">{hoveredCountry.name}</div>
            <div className="text-metal-fire font-semibold">
              {hoveredCountry.bandCount.toLocaleString()} groupes
            </div>
          </div>
        )}
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metal-card p-5 text-center border border-metal-gray">
          <div className="text-3xl font-bold text-metal-fire">{countriesData.length}</div>
          <div className="text-sm text-gray-400 mt-1">Pays référencés</div>
        </div>
        <div className="metal-card p-5 text-center border border-metal-gray">
          <div className="text-3xl font-bold text-metal-fire">{totalBands.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Groupes localisés</div>
        </div>
        <div className="metal-card p-5 text-center border border-metal-gray">
          <div className="text-3xl font-bold text-metal-fire">
            {topCountries[0]?.flag} {topCountries[0]?.name}
          </div>
          <div className="text-sm text-gray-400 mt-1">Pays le plus représenté</div>
        </div>
      </div>

      {/* Classement des pays */}
      <div className="metal-card p-6 border border-metal-gray">
        <h3 className="font-serif text-xl mb-4 text-metal-rust">🏆 Top 10 des pays metal (Données réelles)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topCountries.map((country, index) => (
            <div
              key={country.name}
              className="flex items-center gap-3 p-3 bg-metal-black/50 rounded-lg border border-metal-gray hover:border-metal-fire transition-colors"
            >
              <div className="text-xl font-bold text-metal-fire w-8">#{index + 1}</div>
              <div className="text-2xl">{country.flag}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-200">{country.name}</div>
                <div className="text-xs text-gray-400">{country.bandCount.toLocaleString()} groupes</div>
              </div>
              <div className="text-sm text-metal-fire font-mono">
                {totalBands > 0 ? ((country.bandCount / totalBands) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
