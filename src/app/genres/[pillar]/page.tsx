import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { metalServerApi } from '@/lib/metal-api';
import SubgenreFilter from '@/components/genres/SubgenreFilter';
import BandCard from '@/components/bands/BandCard';
import Loader from '@/components/ui/Loader';
import FloatingRunes, { type SymbolFamily } from '@/components/ui/FloatingRunes';
import { PILLAR_METADATA, type GamificationPillar } from '@/types/api';

interface Props {
  params: Promise<{ pillar: string }>;
  searchParams: Promise<{ subgenre?: string }>;
}

// ═══════════════════════════════════════════════════════════
// 🗺️ MAPPING ROBUSTE DES SLUGS URL VERS LES NOMS EXACTS
// (Résout le problème "folk-metal" vs "Folk Metal")
// ═══════════════════════════════════════════════════════════
const SLUG_TO_PILLAR: Record<string, GamificationPillar> = {
  'black-metal': 'Black Metal',
  'death-metal': 'Death Metal',
  'heavy-metal': 'Heavy Metal',
  'thrash-metal': 'Thrash Metal',
  'power-metal': 'Power Metal',
  'doom-metal': 'Doom Metal',
  'progressive-metal': 'Progressive Metal',
  'folk-metal': 'Folk Metal',       // ← La clé magique pour Folk Metal
  'metalcore': 'Metalcore',
  // Fallbacks pour les espaces encodés (ex: /genres/Folk%20Metal)
  'Black Metal': 'Black Metal',
  'Death Metal': 'Death Metal',
  'Heavy Metal': 'Heavy Metal',
  'Thrash Metal': 'Thrash Metal',
  'Power Metal': 'Power Metal',
  'Doom Metal': 'Doom Metal',
  'Progressive Metal': 'Progressive Metal',
  'Folk Metal': 'Folk Metal',
  'Metalcore': 'Metalcore',
};

// ═══════════════════════════════════════════════════════════
// 🎨 CONFIGURATION DES RUNES PAR PILIER (Ambiance Adaptative)
// ═══════════════════════════════════════════════════════════
const PILLAR_RUNES_CONFIG: Record<GamificationPillar, {
  family: SymbolFamily;
  colorClass: string;
  opacityFactor: number;
  baseDuration: number;
  count: number;
}> = {
  'Black Metal': { family: 'black', colorClass: 'text-slate-300', opacityFactor: 0.08, baseDuration: 22, count: 20 },
  'Death Metal': { family: 'death', colorClass: 'text-red-900', opacityFactor: 0.10, baseDuration: 18, count: 25 },
  'Heavy Metal': { family: 'medieval', colorClass: 'text-amber-400', opacityFactor: 0.12, baseDuration: 15, count: 30 },
  'Thrash Metal': { family: 'thrash', colorClass: 'text-orange-500', opacityFactor: 0.15, baseDuration: 8, count: 50 },
  'Power Metal': { family: 'celestial', colorClass: 'text-yellow-200', opacityFactor: 0.12, baseDuration: 14, count: 35 },
  'Doom Metal': { family: 'elements', colorClass: 'text-gray-500', opacityFactor: 0.08, baseDuration: 25, count: 15 },
  'Progressive Metal': { family: 'alchemical', colorClass: 'text-purple-300', opacityFactor: 0.10, baseDuration: 18, count: 25 },
  'Folk Metal': { family: 'folk', colorClass: 'text-green-400', opacityFactor: 0.10, baseDuration: 16, count: 30 },
  'Metalcore': { family: 'mixed', colorClass: 'text-rose-400', opacityFactor: 0.12, baseDuration: 10, count: 40 },
};

export async function generateStaticParams() {
  const pillars: GamificationPillar[] = [
    'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
    'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal', 'Metalcore'
  ];

  return pillars.map((pillar) => ({
    pillar: encodeURIComponent(pillar),
  }));
}

export async function generateMetadata({ params }: Props) {
  const { pillar } = await params;
  const decodedPillar = decodeURIComponent(pillar);
  const validPillar = SLUG_TO_PILLAR[decodedPillar] || (decodedPillar as GamificationPillar);

  return {
    title: `${validPillar} | MetalPedia`,
    description: `Découvrez les groupes de ${validPillar} et explorez les sous-genres de ce pilier du metal.`,
  };
}

export default async function PillarPage({ params, searchParams }: Props) {
  const { pillar } = await params;
  const { subgenre } = await searchParams;
  
  const decodedPillar = decodeURIComponent(pillar);
  
  // 🛡️ RÉSOLUTION SÉCURISÉE : On traduit le slug URL en nom exact de pilier
  const validPillar = SLUG_TO_PILLAR[decodedPillar];
  
  // Si le pilier n'existe pas dans le mapping ou les métadonnées, on affiche 404
  if (!validPillar || !PILLAR_METADATA[validPillar]) {
    notFound();
  }

  const pillarMetadata = PILLAR_METADATA[validPillar];
  const runesConfig = PILLAR_RUNES_CONFIG[validPillar];

  // On utilise validPillar (ex: "Folk Metal") pour tous les appels API et la logique
  const bands = await metalServerApi.getBandsByPillar(validPillar, subgenre);
  const pillarsStats = await metalServerApi.getGenrePillarsStats();
  const currentPillar = pillarsStats.find(p => p.pillar === validPillar);

  return (
    <>
      {/* 🌌 CALQUE D'ARRIÈRE-PLAN ADAPTATIF (z-10 : au-dessus du body, derrière le contenu) */}
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

      {/* 📜 CALQUE DE PREMIER PLAN (z-20 : au-dessus des runes) */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/genres" className="hover:text-metal-fire transition-colors">
              Piliers
            </Link>
            <span>→</span>
            <span className="text-gray-300">{validPillar}</span>
            {subgenre && (
              <>
                <span>→</span>
                <span className="text-metal-fire">{subgenre}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-4xl border-2 shrink-0"
              style={{
                borderColor: pillarMetadata.color,
                backgroundColor: `${pillarMetadata.color}15`,
                boxShadow: `0 0 20px ${pillarMetadata.color}40`,
              }}
            >
              {pillarMetadata.icon}
            </div>

            <div>
              <h1
                className="font-metal text-4xl md:text-5xl drop-shadow-lg"
                style={{ color: pillarMetadata.color }}
              >
                {validPillar}
              </h1>
              <p className="text-gray-400 mt-1 drop-shadow-md">
                {pillarMetadata.description}
              </p>
            </div>
          </div>

          <div className="text-gray-400">
            <span className="text-metal-fire font-bold text-2xl">{bands.length}</span>
            {' '}groupe{bands.length > 1 ? 's' : ''}
            {subgenre && (
              <>
                {' '}dans{' '}
                <span className="text-metal-fire font-semibold">{subgenre}</span>
              </>
            )}
          </div>
        </div>

        {currentPillar && currentPillar.subgenres.length > 1 && (
          <SubgenreFilter
            pillar={validPillar}
            subgenres={currentPillar.subgenres}
          />
        )}

        <Suspense fallback={<Loader text="Chargement des groupes..." />}>
          {bands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bands.map((band) => (
                <BandCard key={band.id} band={band} />
              ))}
            </div>
          ) : (
            <div className="metal-card p-12 text-center border border-metal-gray/50 bg-metal-black/50 backdrop-blur-sm">
              <div className="text-6xl mb-4">🎸</div>
              <p className="text-gray-400 text-lg">
                Aucun groupe trouvé{subgenre && ` pour le sous-genre "${subgenre}"`}
              </p>
              {subgenre && (
                <Link
                  href={`/genres/${encodeURIComponent(validPillar)}`}
                  className="mt-4 inline-block text-metal-fire hover:underline"
                >
                  Voir tous les groupes du pilier →
                </Link>
              )}
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
}
