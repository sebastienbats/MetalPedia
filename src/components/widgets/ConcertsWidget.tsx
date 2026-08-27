'use client';

import { useUpcomingBandConcerts, formatConcertDate } from '@/api/concertsApi';
import type { Concert } from '@/types/api';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface Props {
  bandId: number;
  bandName: string;
}

// ═══════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════

type ConcertSource = 'bandsintown' | 'lastfm' | 'setlistfm' | 'unknown';

function getConcertSource(concertId: string): ConcertSource {
  if (concertId.startsWith('bit-')) return 'bandsintown';
  if (concertId.startsWith('lf-')) return 'lastfm';
  if (concertId.startsWith('sf-')) return 'setlistfm';
  return 'unknown';
}

const SOURCE_CONFIG: Record<ConcertSource, { label: string; icon: string; color: string }> = {
  bandsintown: { label: 'Bandsintown', icon: '🎫', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  lastfm: { label: 'Last.fm', icon: '🔴', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  setlistfm: { label: 'Setlist.fm', icon: '🎸', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  unknown: { label: 'Inconnue', icon: '❓', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

// ═══════════════════════════════════════════════════════════
// COMPOSANT : CONCERT CARD
// ═══════════════════════════════════════════════════════════

function ConcertCard({ concert }: { concert: Concert }) {
  const source = getConcertSource(concert.id);
  const sourceInfo = SOURCE_CONFIG[source];
  const isSetlist = source === 'setlistfm';

  // ✅ Gestion sécurisée de datetime (peut être undefined)
  const dateToDisplay = concert.datetime ?? concert.date;
  const formattedDate = dateToDisplay
    ? formatConcertDate(dateToDisplay)
    : 'Date inconnue';

  return (
    <div className="metal-card p-4 hover:border-metal-fire/50 transition-all group">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* DATE */}
        <div className="sm:w-32 shrink-0 text-center sm:text-left">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Date
          </div>
          <div className="text-sm font-semibold text-metal-fire capitalize">
            {formattedDate}
          </div>
        </div>

        {/* LIEU */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Groupe
          </div>
          {/* ✅ Utilisation de band_name (pas displayName) */}
          <div className="font-semibold text-gray-100 truncate">
            {concert.band_name}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mt-2 mb-1">
            Lieu
          </div>
          {/* ✅ venue est une string simple, pas un objet */}
          <div className="font-semibold text-gray-100 truncate">
            {concert.venue}
          </div>
          <div className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
            <span>📍</span>
            {/* ✅ city est une string simple */}
            <span className="truncate">
              {concert.city}{concert.country ? `, ${concert.country}` : ''}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="sm:w-48 shrink-0 flex flex-col gap-2">
          {/* ✅ Utilisation de url (pas uri) */}
          {concert.url && (
            <a
              href={concert.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                font-semibold text-sm transition-all
                ${isSetlist
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-metal-fire hover:bg-metal-fire/80 text-white'
                }
              `}
            >
              {isSetlist ? (
                <>
                  <span>🎸</span>
                  <span>Voir la setlist</span>
                </>
              ) : (
                <>
                  <span>🎫</span>
                  <span>Billets / Infos</span>
                </>
              )}
            </a>
          )}

          {/* Badge source */}
          <div className={`
            inline-flex items-center justify-center gap-1 px-2 py-1 rounded 
            text-xs border ${sourceInfo.color}
          `}>
            <span>{sourceInfo.icon}</span>
            <span>{sourceInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function ConcertsWidget({ bandId, bandName }: Props) {
  // ✅ Passage correct des 2 arguments : bandId ET bandName
  const { data: concerts, isLoading, error } = useUpcomingBandConcerts(bandId, bandName);

  if (isLoading) {
    return (
      <div className="metal-card p-8">
        <Loader text="Recherche des prochains concerts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-400 mb-2">
          Impossible de récupérer les concerts
        </p>
        <p className="text-sm text-gray-500">
          Veuillez réessayer plus tard.
        </p>
      </div>
    );
  }

  if (!concerts || concerts.length === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🎸</div>
        <p className="text-gray-400 mb-2">
          Aucun concert à venir pour {bandName}
        </p>
        <p className="text-sm text-gray-500">
          Ce groupe n'a pas de dates annoncées pour le moment.
          <br />
          <span className="text-xs mt-2 block text-gray-600">
            Sources consultées : Bandsintown, Last.fm, Setlist.fm
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-gray-200 flex items-center gap-2">
          <span>🎤</span>
          <span>Prochains concerts</span>
        </h3>
        <span className="text-xs text-gray-500">
          {concerts.length} date{concerts.length > 1 ? 's' : ''} trouvée{concerts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {concerts.map((concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>

      <div className="text-xs text-gray-600 text-center pt-2 border-t border-metal-gray/30">
        Données fournies par Bandsintown, Last.fm et Setlist.fm
      </div>
    </div>
  );
}
