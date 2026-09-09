import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { metalServerApi } from '@/lib/metal-api';
import SubgenreFilter from '@/components/genres/SubgenreFilter';
import BandCard from '@/components/bands/BandCard';
import Loader from '@/components/ui/Loader';
import FloatingRunes, { type SymbolFamily } from '@/components/ui/FloatingRunes'; // 🆕 Import
import { PILLAR_METADATA, type GamificationPillar } from '@/types/api';

interface Props {
  params: Promise<{ pillar: string }>;
  searchParams: Promise<{ subgenre?: string }>;
}

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
  'Black Metal': { 
    family: 'black', colorClass: 'text-slate-300', opacityFactor: 0.08, baseDuration: 22, count: 20 
  }, // Froid, occulte, lent et rare (cendre/lune)
  'Death Metal': { 
    family: 'death', colorClass: 'text-red-900', opacityFactor: 0.10, baseDuration: 18, count: 25 
  }, // Sombre, lourd, menaçant (sang séché)
  'Heavy Metal': { 
    family: 'medieval', colorClass: 'text-amber-400', opacityFactor: 0.12, baseDuration: 15, count: 30 
  }, // Épique, classique, chevaleresque (or/fer)
  'Thrash Metal': { 
    family: 'thrash', colorClass: 'text-orange-500', opacityFactor: 0.15, baseDuration: 8, count: 50 
  }, // Rapide, agressif, chaotique (feu/éclairs)
  'Power Metal': { 
    family: 'celestial', colorClass: 'text-yellow-200', opacityFactor: 0.12, baseDuration: 14, count: 35 
  }, // Lumineux, fantastique, céleste (étoiles)
  'Doom Metal': { 
    family: 'elements', colorClass: 'text-gray-500', opacityFactor: 0.08, baseDuration: 25, count: 15 
  }, // Extrêmement lent, lourd, géométrique (pierre/brume)
  'Progressive Metal': { 
    family: 'alchemical', colorClass: 'text-purple-300', opacityFactor: 0.10, baseDuration: 18, count: 25 
  }, // Complexe, mystique, intellectuel (symboles alchimiques)
  'Folk Metal': { 
    family: 'folk', colorClass: 'text-green-400', opacityFactor: 0.10, baseDuration: 16, count: 30 
  }, // Naturel, organique, vivant (feuilles/rune)
  'Metalcore': { 
    family: 'mixed', colorClass: 'text-rose-400', opacityFactor: 0.12, baseDuration: 10, count: 40 
  }, // Moderne, intense, mélange de styles
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

  return {
    title: `${decodedPillar} | MetalPedia`,
    description: `Découvrez les groupes de ${decodedPillar} et explorez les sous-genres de ce pilier du metal.`,
  };
}

export default async function PillarPage({ params, searchParams }: Props) {
  const { pillar } = await params;
  const { subgenre } = await searchParams;
  
  const decodedPillar = decodeURIComponent(pillar);
  const pillarMetadata = PILLAR_METADATA[decodedPillar as GamificationPillar];
  
  if (!pillarMetadata) {
    notFound();
  }

  // Récupération de la configuration des runes pour ce pilier spécifique
  const runesConfig = PILLAR_RUNES_CONFIG[decodedPillar as GamificationPillar];

  const bands = await metalServerApi.getBandsByPillar(decodedPillar, subgenre);
  const pillarsStats = await metalServerApi.getGenrePillarsStats();
  const currentPillar = pillarsStats.find(p => p.pillar === decodedPillar);

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
            <span className="text-gray-300">{decodedPillar}</span>
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
                {decodedPillar}
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
            pillar={decodedPillar}
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
                  href={`/genres/${encodeURIComponent(decodedPillar)}`}
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
