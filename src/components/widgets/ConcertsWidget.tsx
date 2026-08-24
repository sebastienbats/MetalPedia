'use client';

import Link from 'next/link';
import { useBandConcerts } from '@/api/concertsApi';

interface Props {
  bandName: string;
}

export default function ConcertsWidget({ bandName }: Props) {
  const { data: concerts, isLoading, error } = useBandConcerts(bandName);

  if (isLoading) {
    return (
      <div className="metal-card p-5 animate-pulse">
        <div className="h-4 bg-metal-gray rounded mb-3" />
        <div className="h-4 bg-metal-gray rounded mb-3 w-3/4" />
        <div className="h-4 bg-metal-gray rounded w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="metal-card p-5 text-center text-gray-400">
        <p>⚠️ Impossible de charger les concerts</p>
      </div>
    );
  }

  if (!concerts?.length) {
    return (
      <div className="metal-card p-5 text-center">
        <div className="text-4xl mb-2">🎤</div>
        <p className="text-gray-400 text-sm">
          Aucun concert prévu pour {bandName} pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="metal-card p-5">
      <h3 className="font-serif text-lg text-metal-fire mb-4 flex items-center gap-2">
        <span aria-hidden="true">🎤</span>
        Concerts à venir ({concerts.length})
      </h3>

      <ul className="space-y-3">
        {concerts.slice(0, 5).map((concert) => {
          const date = new Date(concert.datetime);
          const formattedDate = date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          const formattedTime = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <li
              key={concert.id}
              className="flex items-start justify-between gap-3 pb-3 border-b border-metal-gray last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Date badge */}
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-metal-black/50 border border-metal-gray rounded-lg shrink-0">
                  <span className="text-xl font-bold text-metal-fire">
                    {date.getDate()}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {date.toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                </div>

                {/* Concert info */}
                <div className="min-w-0 flex-1">
                  <a
                    href={concert.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm hover:text-metal-fire transition-colors truncate block"
                  >
                    {concert.displayName}
                  </a>
                  <div className="text-xs text-gray-400 mt-1">
                    📍 {concert.venue.displayName}
                    {concert.venue.city && ` — ${concert.venue.city}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    🕐 {formattedTime}
                  </div>
                </div>
              </div>

              {/* Action */}
              <a
                href={concert.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="metal-button text-xs px-3 py-2 shrink-0"
              >
                🎟️ Billets
              </a>
            </li>
          );
        })}
      </ul>

      {concerts.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            href={`/concerts/${encodeURIComponent(bandName)}`}
            className="text-sm text-metal-fire hover:text-metal-rust"
          >
            Voir tous les concerts ({concerts.length}) →
          </Link>
        </div>
      )}
    </div>
  );
}
