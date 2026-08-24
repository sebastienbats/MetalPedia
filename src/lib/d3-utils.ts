import * as d3 from 'd3';
import type { Genre } from '@/types/api';

// ═══════════════════════════════════════════
// TYPES DU GRAPHE
// ═══════════════════════════════════════════

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  genre: Genre;
  country: string;
  similarity: number; // 0-1
  isSource?: boolean; // Le groupe central
  radius: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  strength: number; // 0-1
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ═══════════════════════════════════════════
// ÉCHELLE DE COULEURS PAR GENRE
// ═══════════════════════════════════════════

export const GENRE_COLOR_MAP: Record<string, string> = {
  'Black Metal': '#4a148c',
  'Death Metal': '#b71c1c',
  'Heavy Metal': '#c9a227',
  'Thrash Metal': '#ff6f00',
  'Power Metal': '#1565c0',
  'Doom Metal': '#5d4037',
  'Progressive Metal': '#00695c',
  'Folk Metal': '#8bc34a',
  'Symphonic Metal': '#ad1457',
  'Gothic Metal': '#311b92',
  'Nu Metal': '#616161',
  'Metalcore': '#00838f',
  'Sludge Metal': '#795548',
  'Stoner Metal': '#f57f17',
  'Groove Metal': '#e65100',
};

export const DEFAULT_NODE_COLOR = '#d63031';

export function getGenreColor(genre: string): string {
  return GENRE_COLOR_MAP[genre] || DEFAULT_NODE_COLOR;
}

// ═══════════════════════════════════════════
// CONSTRUCTION DES DONNÉES DU GRAPHE
// ═══════════════════════════════════════════

/**
 * Construit les données du graphe à partir du groupe source
 * et des recommandations du ML Service
 */
export function buildGraphData(
  sourceBand: {
    id: number;
    name: string;
    genre: Genre;
    country: string;
  },
  recommendations: Array<{
    name: string;
    genre: string;
    country: string;
    similarity_score: number;
  }>,
  maxNodes: number = 20
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Nœud central (groupe source)
  const sourceId = `source-${sourceBand.id}`;
  nodes.push({
    id: sourceId,
    name: sourceBand.name,
    genre: sourceBand.genre,
    country: sourceBand.country,
    similarity: 1,
    isSource: true,
    radius: 40,
  });

  // Nœuds des recommandations
  recommendations.slice(0, maxNodes).forEach((rec, index) => {
    const nodeId = `rec-${index}-${rec.name.toLowerCase().replace(/\s+/g, '-')}`;

    nodes.push({
      id: nodeId,
      name: rec.name,
      genre: rec.genre as Genre,
      country: rec.country,
      similarity: rec.similarity_score,
      isSource: false,
      radius: 15 + rec.similarity_score * 25, // 15-40 selon similarité
    });

    // Lien entre source et recommandation
    links.push({
      source: sourceId,
      target: nodeId,
      strength: rec.similarity_score,
    });
  });

  // Liens secondaires entre recommandations du même genre
  const recNodes = nodes.filter((n) => !n.isSource);
  for (let i = 0; i < recNodes.length; i++) {
    for (let j = i + 1; j < recNodes.length; j++) {
      if (recNodes[i].genre === recNodes[j].genre && Math.random() < 0.3) {
        links.push({
          source: recNodes[i].id,
          target: recNodes[j].id,
          strength: 0.3,
        });
      }
    }
  }

  return { nodes, links };
}

// ═══════════════════════════════════════════
// CONFIGURATION DE LA SIMULATION
// ═══════════════════════════════════════════

export interface SimulationConfig {
  width: number;
  height: number;
  chargeStrength?: number;
  linkDistance?: number;
  centerStrength?: number;
}

export function createForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  config: SimulationConfig
): d3.Simulation<GraphNode, GraphLink> {
  const {
    width,
    height,
    chargeStrength = -400,
    linkDistance = 120,
    centerStrength = 0.1,
  } = config;

  return d3
    .forceSimulation<GraphNode>(nodes)
    .force(
      'link',
      d3
        .forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(linkDistance)
        .strength((d) => d.strength * 0.5)
    )
    .force('charge', d3.forceManyBody().strength(chargeStrength))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(centerStrength))
    .force(
      'collision',
      d3.forceCollide<GraphNode>().radius((d) => d.radius + 10)
    )
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05));
}

// ═══════════════════════════════════════════
// UTILITAIRES DIVERS
// ═══════════════════════════════════════════

/**
 * Tronque un nom trop long pour l'affichage
 */
export function truncateName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 1) + '…';
}

/**
 * Formate le score de similarité en pourcentage
 */
export function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Calcule la couleur du lien selon sa force
 */
export function getLinkColor(strength: number): string {
  const opacity = 0.2 + strength * 0.6;
  return `rgba(214, 48, 49, ${opacity})`;
}

/**
 * Détecte si un point est dans le viewport (pour le responsive)
 */
export function getContainerDimensions(
  container: HTMLElement
): { width: number; height: number } {
  const rect = container.getBoundingClientRect();
  return {
    width: rect.width || 800,
    height: rect.height || 600,
  };
}
