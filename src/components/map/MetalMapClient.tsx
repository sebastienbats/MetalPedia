'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
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
// DONNÉES DES PAYS
// ═══════════════════════════════════════════
interface CountryData {
  name: string;
  lat: number;
  lng: number;
  bandCount: number;
  flag: string;
}

const METAL_COUNTRIES: CountryData[] = [
  { name: 'États-Unis', lat: 39.8, lng: -98.5, bandCount: 35000, flag: '🇺🇸' },
  { name: 'Allemagne', lat: 51.1, lng: 10.4, bandCount: 15000, flag: '🇩🇪' },
  { name: 'Royaume-Uni', lat: 54.0, lng: -2.0, bandCount: 12000, flag: '🇬🇧' },
  { name: 'Suède', lat: 62.0, lng: 15.0, bandCount: 8000, flag: '🇸🇪' },
  { name: 'Finlande', lat: 64.0, lng: 26.0, bandCount: 7000, flag: '🇫🇮' },
  { name: 'Brésil', lat: -10.0, lng: -52.0, bandCount: 6000, flag: '🇧🇷' },
  { name: 'Norvège', lat: 61.0, lng: 9.0, bandCount: 5000, flag: '🇳🇴' },
  { name: 'France', lat: 46.6, lng: 2.2, bandCount: 5000, flag: '🇫🇷' },
  { name: 'Canada', lat: 56.0, lng: -106.0, bandCount: 4000, flag: '🇨🇦' },
  { name: 'Russie', lat: 61.5, lng: 90.0, bandCount: 3500, flag: '🇷🇺' },
  { name: 'Italie', lat: 42.5, lng: 12.5, bandCount: 3500, flag: '🇮🇹' },
  { name: 'Japon', lat: 36.2, lng: 138.2, bandCount: 3000, flag: '🇯🇵' },
  { name: 'Pologne', lat: 51.9, lng: 19.1, bandCount: 3000, flag: '🇵🇱' },
  { name: 'Pays-Bas', lat: 52.1, lng: 5.3, bandCount: 3000, flag: '🇳🇱' },
  { name: 'Australie', lat: -25.0, lng: 133.0, bandCount: 2500, flag: '🇦🇺' },
  { name: 'Espagne', lat: 40.4, lng: -3.7, bandCount: 2500, flag: '🇪🇸' },
  { name: 'Danemark', lat: 56.2, lng: 9.5, bandCount: 2000, flag: '🇩🇰' },
  { name: 'Mexique', lat: 23.6, lng: -102.5, bandCount: 2000, flag: '🇲🇽' },
  { name: 'Argentine', lat: -34.0, lng: -64.0, bandCount: 2000, flag: '🇦🇷' },
  { name: 'Grèce', lat: 39.0, lng: 22.0, bandCount: 1500, flag: '🇬🇷' },
  { name: 'Suisse', lat: 46.8, lng: 8.2, bandCount: 1500, flag: '🇨🇭' },
  { name: 'Autriche', lat: 47.5, lng: 14.5, bandCount: 1500, flag: '🇦🇹' },
  { name: 'Chili', lat: -31.0, lng: -71.0, bandCount: 1500, flag: '🇨🇱' },
];

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════

export default function MetalMapClient() {
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);

  const maxBandCount = useMemo(
    () => Math.max(...METAL_COUNTRIES.map((c) => c.bandCount)),
    []
  );

  const totalBands = useMemo(
    () => METAL_COUNTRIES.reduce((sum, c) => sum + c.bandCount, 0),
    []
  );

  const topCountries = useMemo(
    () => [...METAL_COUNTRIES].sort((a, b) => b.bandCount - a.bandCount).slice(0, 10),
    []
  );

  return (
    <div className="space-y-6">
      {/* Globe 3D */}
      {/* 🛡️ CORRECTION 1 : Ajout de 'relative' pour le positionnement absolu de l'info-bulle */}
      <div className="metal-card overflow-hidden relative" style={{ height: '600px' }}>
        <Globe
          // 🛡️ CORRECTION 2 : Dimensions explicites pour remplir le conteneur de 600px
          width="100%"
          height="100%"
          globeImageUrl="//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
          backgroundColor="transparent"
          pointsData={METAL_COUNTRIES}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointColor={() => '#d63031'}
          pointAltitude={(d: any) => (d.bandCount / maxBandCount) * 0.4}
          pointRadius={(d: any) => 0.3 + Math.sqrt(d.bandCount / maxBandCount) * 0.7}
          pointsMerge={false}
          onPointHover={(point: any) => setHoveredCountry(point as CountryData)}
          // 🛡️ CORRECTION 3 : HTML sécurisé et stylisé pour le label
          pointLabel={(d: any) => `
            <div style="background: #1a1a1a; padding: 8px 12px; border-radius: 6px; border: 1px solid #d63031; color: white; font-family: sans-serif; pointer-events: none;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${d.flag} ${d.name}</div>
              <div style="color: #d63031; font-size: 12px;">${d.bandCount.toLocaleString()} groupes</div>
            </div>
          `}
        />

        {/* Info du pays survolé (overlay) */}
        {hoveredCountry && (
          <div className="absolute top-4 left-4 metal-card p-4 pointer-events-none z-10 backdrop-blur-sm bg-metal-black/80">
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
          <div className="text-3xl font-bold text-metal-fire">{METAL_COUNTRIES.length}</div>
          <div className="text-sm text-gray-400 mt-1">Pays référencés</div>
        </div>
        <div className="metal-card p-5 text-center border border-metal-gray">
          <div className="text-3xl font-bold text-metal-fire">{totalBands.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Groupes au total</div>
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
        <h3 className="font-serif text-xl mb-4 text-metal-rust">🏆 Top 10 des pays metal</h3>
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
                {((country.bandCount / totalBands) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
