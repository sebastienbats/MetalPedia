'use client';

import PlayerCard from '@/components/gamification/PlayerCard';
import BadgesPanel from '@/components/gamification/BadgesPanel';
import QuestsPanel from '@/components/gamification/QuestsPanel';
import StatsPanel from '@/components/visual/StatsPanel';

export default function ProfilePage() {
  return (
    <div className="space-y-8 pb-24">
      <header className="text-center border-b border-metal-gray pb-6">
        <h1 className="font-metal text-5xl text-metal-rust mb-3">⚔️ Ta Légende</h1>
        <p className="text-gray-400 font-serif">
          Le Conseil des Neuf Genres observe ta progression
        </p>
      </header>

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
    </div>
  );
}
