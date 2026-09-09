import PillarCard from './PillarCard';
import { GAMIFICATION_PILLARS } from '@/types/api';
import type { GenrePillarStats, GamificationPillar } from '@/types/api';

interface Props {
  pillarsStats: GenrePillarStats[];
}

export default function PillarsGrid({ pillarsStats }: Props) {
  // 🛡️ Garantir l'affichage des 9 piliers même si l'API n'en renvoie que 8
  const guaranteedPillarsStats: GenrePillarStats[] = GAMIFICATION_PILLARS.map((pillarName) => {
    const found = pillarsStats.find((p) => p.pillar === pillarName);
    return {
      pillar: pillarName as GamificationPillar,
      count: found ? found.count : 0,
      subgenres: found ? found.subgenres : [],
    };
  });

  const totalBands = guaranteedPillarsStats.reduce((sum, p) => sum + p.count, 0);

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg">
          <span className="text-metal-fire font-bold">{totalBands}</span> groupes répartis en{' '}
          <span className="text-metal-fire font-bold">9 piliers</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guaranteedPillarsStats.map((stats) => (
          <PillarCard
            key={stats.pillar}
            pillar={stats.pillar}
            count={stats.count}
            subgenresCount={stats.subgenres.length}
          />
        ))}
      </div>
    </div>
  );
}
