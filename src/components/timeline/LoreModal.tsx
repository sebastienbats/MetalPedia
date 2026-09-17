'use client';

import { useEffect, useState } from 'react';
import { useClassStore } from '@/stores/classStore';
import { CHARACTER_CLASSES } from '@/lib/gamification/classes';
import type { CharacterClass } from '@/types/api';

// ═══════════════════════════════════════════════════════════
// INTERFACE DES ÉVÉNEMENTS DU METALVERSE
// ═══════════════════════════════════════════════════════════
export interface MetalverseEvent {
  id: number;
  content: string;
  start: string;
  end?: string;
  type?: 'point' | 'range';
  pillar: string;
  className: string;
  icon?: string;           // Icône du pilier (injectée par TimelineClient)
  color?: string;          // Couleur du pilier (injectée par TimelineClient)
  act: string;
  rune?: string;           // Rune gravée sur ce fragment de Table
  fragment_title?: string; // Nom poétique du fragment
  real_lore: string;
  metalverse_echo: string;
  xp: number;
  class_lore?: Partial<Record<CharacterClass, string>>;
}

interface LoreModalProps {
  event: MetalverseEvent | null;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════
// MAPPING PILIER → CLASSE ASSOCIÉE (pour le verrouillage)
// ═══════════════════════════════════════════════════════════
const PILLAR_TO_CLASS: Record<string, CharacterClass> = {
  'Heavy Metal': 'paladin',
  'Thrash Metal': 'berserker',
  'Death Metal': 'executioner',
  'Black Metal': 'necromancer',
  'Power Metal': 'bard',
  'Doom Metal': 'void_guardian',
  'Progressive Metal': 'chaos_architect',
  'Folk Metal': 'shaman',
  'Metalcore': 'chain_breaker',
};

export default function LoreModal({ event, onClose }: LoreModalProps) {
  const [activeTab, setActiveTab] = useState<'real' | 'echo' | 'class'>('real');
  const { selectedClass } = useClassStore();

  // Fermer avec la touche Échap
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

  // Réinitialiser l'onglet à chaque nouvel événement
  useEffect(() => {
    setActiveTab('real');
  }, [event]);

  if (!event) return null;

  const isRange = event.type === 'range';
  const dateLabel = isRange
    ? `${new Date(event.start).getFullYear()} → ${new Date(event.end || '').getFullYear()}`
    : new Date(event.start).getFullYear();

  // ✅ Vérifier que la classe du joueur correspond au pilier de l'événement
  const requiredClass = PILLAR_TO_CLASS[event.pillar];
  const hasExclusiveLore = !!(
    selectedClass && 
    requiredClass &&
    selectedClass === requiredClass && 
    event.class_lore && 
    event.class_lore[selectedClass]
  );
  
  const exclusiveLore = hasExclusiveLore ? event.class_lore![selectedClass!] : null;

  return (
    <div className="lore-overlay" onClick={onClose}>
      <div className="lore-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* ═══════════════════════════════════════════════════════════
            EN-TÊTE : Icône du PILIER en gros
            ═══════════════════════════════════════════════════════════ */}
        <div 
          className="lore-header" 
          style={{ 
            background: `linear-gradient(135deg, ${event.color || '#8b0000'} 0%, #0a0a0a 100%)` 
          }}
        >
          <div className="lore-header-top">
            {/* Icône du pilier en gros */}
            <div className="lore-icon-pillar">{event.icon || '🎸'}</div>
            <div className="lore-act-badge">🎭 {event.act}</div>
          </div>
          <div className="lore-header-content">
            <h2 className="lore-title">{event.content}</h2>
            <p className="lore-date">
              {dateLabel} • {event.pillar}
              {event.rune && <span className="lore-rune-mini"> • {event.rune}</span>}
            </p>
          </div>
          <button className="lore-close" onClick={onClose}>✕</button>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            ONGLETS
            ═══════════════════════════════════════════════════════════ */}
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
              title={!hasExclusiveLore 
                ? `Réservé à la classe ${requiredClass ? CHARACTER_CLASSES[requiredClass].name : event.pillar}` 
                : "Accéder à la Révélation"}
            >
              {hasExclusiveLore ? '🗝️ Révélation' : '🔒 Verrouillé'}
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CONTENU DES ONGLETS
            ═══════════════════════════════════════════════════════════ */}
        <div className="lore-body">
          
          {/* Onglet Chronique Réelle */}
          {activeTab === 'real' && (
            <p className="lore-text">{event.real_lore}</p>
          )}

          {/* Onglet Écho Metalverse */}
          {activeTab === 'echo' && (
            <div className="echo-container">
              <div className="echo-glow"></div>
              <p className="lore-text echo-text">{event.metalverse_echo}</p>
            </div>
          )}

          {/* ✅ Onglet Révélation : accessible seulement si bonne classe */}
          {activeTab === 'class' && hasExclusiveLore && selectedClass && (
            <div className="class-lore-container">
              
              {/* Fragment de Table : visible uniquement ici */}
              {event.rune && event.fragment_title && (
                <div className="fragment-block">
                  <div className="fragment-rune">{event.rune}</div>
                  <div className="fragment-info">
                    <span className="fragment-label">Fragment de la Table {event.pillar}</span>
                    <span className="fragment-title">{event.fragment_title}</span>
                  </div>
                </div>
              )}

              {/* Icône de la CLASSE du joueur + nom */}
              <div className="class-lore-badge">
                <span className="class-icon">{CHARACTER_CLASSES[selectedClass].icon}</span>
                <span>Révélation exclusive : {CHARACTER_CLASSES[selectedClass].name}</span>
              </div>
              
              <p className="lore-text class-lore-text">{exclusiveLore}</p>
              
              <div className="class-lore-footer">
                <span className="class-lore-xp">✨ +{Math.floor(event.xp * 1.5)} XP Bonus</span>
                <span className="class-lore-rarity">🏆 Contenu Légendaire</span>
              </div>
            </div>
          )}

          {/* Onglet Révélation verrouillé */}
          {activeTab === 'class' && !hasExclusiveLore && (
            <div className="class-locked-container">
              <div className="class-locked-icon">🔒</div>
              <h3 className="class-locked-title">Secret Scellé</h3>
              <p className="class-locked-text">
                Cette révélation du Metalverse — et le fragment de Table qu'elle contient — est réservée aux initiés de la voie : 
                <strong> {requiredClass ? CHARACTER_CLASSES[requiredClass].name : event.pillar}</strong>.
              </p>
              <p className="class-locked-hint">
                Incarne cette classe dans ton profil pour déchiffrer ce fragment de la Légende...
              </p>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER XP - Adapté selon l'onglet actif
            ═══════════════════════════════════════════════════════════ */}
        {(() => {
          let footerXp: number;
          let footerStatus: string;

          if (activeTab === 'real') {
            // Onglet Chronique Réelle : 100 XP, statut Commun
            footerXp = 100;
            footerStatus = '🥉 Commun';
          } else if (activeTab === 'echo') {
            // Onglet Écho Metalverse : 150 XP, statut Rare
            footerXp = 150;
            footerStatus = '🥇 Rare';
          } else {
            // Onglet Révélation : XP de base × 1.5, statut ÉPIQUE fixe
            footerXp = Math.floor(event.xp * 1.5);
            footerStatus = '🥇 Épique';
          }

          return (
            <div className="lore-footer">
              <div className="xp-reward">
                <span className="xp-icon">✨</span>
                <span className="xp-text">+{footerXp} XP</span>
              </div>
              <div className="lore-status">
                {footerStatus}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
