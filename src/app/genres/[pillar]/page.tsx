import { notFound } from 'next/navigation';
import { metalServerApi } from '@/lib/metal-api';
import PillarClientView from '@/components/genres/PillarClientView';
import { PILLAR_METADATA, getPillarColor, type GamificationPillar } from '@/types/api';

export const revalidate = 3600;

interface Props {
  params: Promise<{ pillar: string }>;
  searchParams: Promise<{ subgenre?: string }>;
}

const SLUG_TO_PILLAR: Record<string, GamificationPillar> = {
  'black-metal': 'Black Metal', 'death-metal': 'Death Metal', 'heavy-metal': 'Heavy Metal',
  'thrash-metal': 'Thrash Metal', 'power-metal': 'Power Metal', 'doom-metal': 'Doom Metal',
  'progressive-metal': 'Progressive Metal', 'folk-metal': 'Folk Metal', 'metalcore': 'Metalcore',
  'Black Metal': 'Black Metal', 'Death Metal': 'Death Metal', 'Heavy Metal': 'Heavy Metal',
  'Thrash Metal': 'Thrash Metal', 'Power Metal': 'Power Metal', 'Doom Metal': 'Doom Metal',
  'Progressive Metal': 'Progressive Metal', 'Folk Metal': 'Folk Metal', 'Metalcore': 'Metalcore',
};

const PILLAR_RUNES_CONFIG: Record<GamificationPillar, {
  family: any; colorClass: string; opacityFactor: number; baseDuration: number; count: number;
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
  return pillars.map((pillar) => ({ pillar: encodeURIComponent(pillar) }));
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
  const validPillar = SLUG_TO_PILLAR[decodedPillar];

  if (!validPillar || !PILLAR_METADATA[validPillar]) {
    notFound();
  }

  // Fetch côté serveur (rapide et optimisé pour le SEO)
  const bands = await metalServerApi.getBandsByPillar(validPillar, subgenre);
  const pillarsStats = await metalServerApi.getGenrePillarsStats();
  const currentPillar = pillarsStats.find(p => p.pillar === validPillar);

  // Rendu délégué au composant client, en lui passant la couleur sécurisée du pilier
  return (
    <PillarClientView
      bands={bands}
      validPillar={validPillar}
      pillarColor={getPillarColor(validPillar)} // ✅ Couleur dynamique injectée ici
      pillarMetadata={PILLAR_METADATA[validPillar]}
      runesConfig={PILLAR_RUNES_CONFIG[validPillar]}
      currentPillarStats={currentPillar}
      currentSubgenre={subgenre}
    />
  );
}
