'use client';

import { useEffect, useState } from 'react';
import { useClassStore } from '@/stores/classStore';
import { CHARACTER_CLASSES } from '@/lib/gamification/classes';
import type { CharacterClass } from '@/types/api';

export interface MetalverseEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  type?: 'point' | 'range'; // ✅ Rendu optionnel
  pillar: string;
  className: string;
  icon?: string; // ✅ Rendu optionnel
  color?: string; // ✅ Rendu optionnel
  act: string;
  real_lore: string;
  metalverse_echo: string;
  xp: number;
  class_lore?: Partial<Record<CharacterClass, string>>;
}

interface LoreModalProps {
  event: MetalverseEvent | null;
  onClose: () => void;
}

export default function LoreModal({ event, onClose }: LoreModalProps) {
  const [activeTab, setActiveTab] = useState<'real' | 'echo' | 'class'>('real');
  const { selectedClass } = useClassStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (event) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  useEffect(() => {
    setActiveTab('real');
  }, [event]);

  if (!event) return null;

  const isRange = event.type === 'range';
  const dateLabel = isRange
    ? `${new Date(event.start).getFullYear()} → ${new Date(event.end || '').getFullYear()}`
    : new Date(event.start).getFullYear();

  const hasExclusiveLore = !!(selectedClass && event.class_lore && event.class_lore[selectedClass]);
  const exclusiveLore = hasExclusiveLore ? event.class_lore![selectedClass!] : null;

  const pillarClass = Object.values(CHARACTER_CLASSES).find(c => c.pillar === event.pillar)?.id;

  return (
    <div className="lore-overlay" onClick={onClose}>
      <div className="lore-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
<div className="lore-header" style={{ background: `linear-gradient(135deg, ${event.color || '#8b0000'} 0%, #0a0a0a 100%)` }}>
  <div className="lore-header-top">
    <div className="lore-icon-pillar">{event.icon || '🎸'}</div>
    <div className="lore-act-badge">🎭 {event.act}</div>
  </div>
  <div className="lore-header-content">
    <h2 className="lore-title">{event.content}</h2>
    <p className="lore-date">{dateLabel} • {event.pillar}</p>
  </div>
  <button className="lore-close" onClick={onClose}>✕</button>
</div>

        {/* ONGLETS */}
        <div className="lore-tabs">
          <button 
            className={`lore-tab ${activeTab === 'real' ? 'active' : ''}`} 
            onClick={() => setActiveTab('real')}
          >
            📜 Chronique Réelle
          </button>
          <button 
            className={`lore-tab ${activeTab === 'echo' ? 'active' : ''}`} 
            onClick={() => setActiveTab('echo')}
          >
            🌌 Écho Metalverse
          </button>
          {event.class_lore && (
            <button 
              className={`lore-tab ${activeTab === 'class' ? 'active' : ''} ${!hasExclusiveLore ? 'locked' : ''}`} 
              onClick={() => hasExclusiveLore && setActiveTab('class')}
              title={!hasExclusiveLore ? "Contenu réservé à une classe spécifique" : ""}
            >
              {hasExclusiveLore ? '🗝️ Révélation' : '🔒 Verrouillé'}
            </button>
          )}
        </div>

        {/* CONTENU */}
        <div className="lore-body">
          {activeTab === 'real' && (
            <p className="lore-text">{event.real_lore}</p>
          )}

          {activeTab === 'echo' && (
            <div className="echo-container">
              <div className="echo-glow"></div>
              <p className="lore-text echo-text">{event.metalverse_echo}</p>
            </div>
          )}

          {activeTab === 'class' && hasExclusiveLore && selectedClass && (
            <div className="class-lore-container">
              <div className="class-lore-badge">
                🗝️ Révélation exclusive : {CHARACTER_CLASSES[selectedClass].name}
              </div>
              <p className="lore-text class-lore-text">{exclusiveLore}</p>
              <div className="class-lore-footer">
                <span className="class-lore-xp">✨ +{Math.floor(event.xp * 1.5)} XP Bonus</span>
                <span className="class-lore-rarity">🏆 Contenu Légendaire</span>
              </div>
            </div>
          )}

          {activeTab === 'class' && !hasExclusiveLore && (
            <div className="class-locked-container">
              <div className="class-locked-icon">🔒</div>
              <h3 className="class-locked-title">Secret Scellé</h3>
              <p className="class-locked-text">
                Cette révélation du Metalverse est réservée aux initiés de la voie : 
                <strong> {pillarClass ? CHARACTER_CLASSES[pillarClass].name : event.pillar}</strong>.
              </p>
              <p className="class-locked-hint">
                Incarne cette classe dans ton profil pour déchiffrer ce fragment de la Légende...
              </p>
            </div>
          )}
        </div>

        {/* FOOTER XP */}
        {event.xp > 0 && (
          <div className="lore-footer">
            <div className="xp-reward">
              <span className="xp-icon">✨</span>
              <span className="xp-text">+{event.xp} XP</span>
            </div>
            <div className="lore-status">
              {event.xp >= 500 ? '🏆 Légendaire' : event.xp >= 200 ? '🥇 Rare' : '🥉 Commun'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
