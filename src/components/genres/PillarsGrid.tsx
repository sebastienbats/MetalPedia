import PillarCard from './PillarCard';
import type { GenrePillarStats } from '@/types/api';

interface Props {
  pillarsStats: GenrePillarStats[];
}

export default function PillarsGrid({ pillarsStats }: Props) {
  const totalBands = pillarsStats.reduce((sum, p) => sum + p.count, 0);

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-lg">
          <span className="text-metal-fire font-bold">{totalBands}</span> groupes répartis en{' '}
          <span className="text-metal-fire font-bold">9 piliers</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillarsStats.map((stats) => (
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
