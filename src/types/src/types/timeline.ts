// Interface pour le contenu enrichi des sceaux
export interface DecadeMetadata {
  year: string;           // Ex: "1970"
  epicTitle: string;      // Ex: "L'Éveil des Ténèbres"
  period: {
    start: number;        // Ex: 1970
    end: number;          // Ex: 1979
  };
  narrative: string;      // Lore narratif complet
  keyEvent?: string;      // Événement le plus important
  stats: {
    eventCount: number;   // Nombre d'événements
    pillars: string[];    // Piliers actifs
  };
}
