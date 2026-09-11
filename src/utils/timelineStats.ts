import type { TimelineEvent, GamificationPillar } from '@/types/api';

// Calculer le nombre d'événements dans une décennie
export const countEventsInDecade = (
  events: TimelineEvent[],
  decadeStart: number,
  decadeEnd: number
): number => {
  return events.filter(event => {
    const eventYear = new Date(event.start).getFullYear();
    return eventYear >= decadeStart && eventYear <= decadeEnd;
  }).length;
};

// Obtenir les piliers actifs dans une décennie
export const getActivePillarsInDecade = (
  events: TimelineEvent[],
  decadeStart: number,
  decadeEnd: number
): string[] => {
  const pillars = new Set<string>();
  
  events.forEach(event => {
    const eventYear = new Date(event.start).getFullYear();
    if (eventYear >= decadeStart && eventYear <= decadeEnd && event.pillar) {
      pillars.add(event.pillar);
    }
  });
  
  return Array.from(pillars);
};

// Trouver l'événement le plus marquant d'une décennie
export const findKeyEventInDecade = (
  events: TimelineEvent[],
  decadeStart: number,
  decadeEnd: number
): string | undefined => {
  // Priorité aux événements ponctuels (pas les ranges)
  const pointEvents = events.filter(event => {
    const eventYear = new Date(event.start).getFullYear();
    return eventYear >= decadeStart && eventYear <= decadeEnd && event.type !== 'range';
  });
  
  // Retourner le premier événement trouvé ou undefined
  return pointEvents[0]?.content;
};
