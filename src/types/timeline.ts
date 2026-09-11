// ═══════════════════════════════════════════
// MÉTADONNÉES DES DÉCENNIES (Pour les Sceaux)
// ═══════════════════════════════════════════

export interface DecadeMetadata {
  year: string;
  epicTitle: string;
  period: {
    start: number;
    end: number;
  };
  narrative: string;
  keyEvent?: string;
  stats: {
    eventCount: number;
    pillars: string[];
  };
}
