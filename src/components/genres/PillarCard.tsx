import Link from 'next/link';
import { PILLAR_METADATA, type GamificationPillar } from '@/types/api';

interface Props {
  pillar: GamificationPillar;
  count: number;
  subgenresCount: number;
}

export default function PillarCard({ pillar, count, subgenresCount }: Props) {
  const metadata = PILLAR_METADATA[pillar];

  return (
    <Link
      href={`/genres/${encodeURIComponent(pillar)}`}
      className="metal-card group relative overflow-hidden transition-all hover:scale-105 hover:border-metal-fire/50"
    >
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{
          background: `radial-gradient(circle at top right, ${metadata.color}, transparent 70%)`,
        }}
      />

      <div className="relative p-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-4 border-2"
          style={{
            borderColor: metadata.color,
            backgroundColor: `${metadata.color}15`,
            boxShadow: `0 0 20px ${metadata.color}40`,
          }}
        >
          {metadata.icon}
        </div>

        <h3 className="font-metal text-2xl mb-2" style={{ color: metadata.color }}>
          {pillar}
        </h3>

        <p className="text-sm text-gray-400 mb-4">
          {metadata.description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-metal-fire">
              {count}
            </span>
            <span className="text-gray-500">
              groupe{count > 1 ? 's' : ''}
            </span>
          </div>

          {subgenresCount > 1 && (
            <div className="text-xs text-gray-500">
              {subgenresCount} sous-genre{subgenresCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="absolute top-6 right-6 text-gray-600 group-hover:text-metal-fire transition-colors">
          →
        </div>
      </div>
    </Link>
  );
}
