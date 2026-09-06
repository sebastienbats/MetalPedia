'use client';

import Link from 'next/link';
import { useAuth } from '@/api/authApi';
import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import StatsPanel from '@/components/visual/StatsPanel';

export default function ProfilePage() {
  const { data: user } = useAuth();

  return (
    <div className="space-y-8">
      <header className="text-center border-b border-metal-gray pb-6">
        <h1 className="font-metal text-5xl text-metal-rust mb-3">⚔️ Ta Légende</h1>
        <p className="text-gray-400 font-serif">Le Conseil des Neuf Genres observe ta progression</p>
      </header>

      {/* 🆕 Bannière d'invitation pour les non-connectés */}
      {!user && (
        <div className="metal-card p-6 border-2 border-metal-fire/50 bg-gradient-to-r from-metal-fire/10 to-transparent">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-5xl">🔐</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-metal-fire mb-2">
                Sauvegarde ta progression dans le cloud
              </h2>
              <p className="text-gray-300 text-sm">
                Crée un compte pour synchroniser ton XP, tes badges et tes favoris sur tous tes appareils. 
                Ta légende mérite d'être immortalisée !
              </p>
            </div>
            <Link
              href="/login"
              className="px-6 py-3 bg-metal-fire text-white font-bold rounded-lg hover:bg-metal-fire/80 transition-all shadow-lg shadow-metal-fire/20 whitespace-nowrap"
            >
              Se connecter
            </Link>
          </div>
        </div>
      )}

      {/* Contenu principal (visible pour tous) */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <PlayerCard />
          <StatsPanel />
        </div>
        <div className="space-y-6">
          <QuestsPanel />
          <BadgesPanel />
        </div>
      </div>

      {/* Message pour les non-connectés en bas de page */}
      {!user && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            💡 Tes statistiques sont sauvegardées localement dans ton navigateur.
            <br />
            <Link href="/login" className="text-metal-fire hover:underline">
              Connecte-toi
            </Link>
            {' '}pour les synchroniser dans le cloud.
          </p>
        </div>
      )}
    </div>
  );
}
