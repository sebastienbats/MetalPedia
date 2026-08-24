'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import {
  GraphData,
  GraphNode,
  GraphLink,
  buildGraphData,
  createForceSimulation,
  getGenreColor,
  getLinkColor,
  truncateName,
  formatSimilarity,
  getContainerDimensions,
} from '@/lib/d3-utils';
import type { Genre } from '@/types/api';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════

interface Props {
  sourceBand: {
    id: number;
    name: string;
    genre: Genre;
    country: string;
  };
  recommendations: Array<{
    name: string;
    genre: string;
    country: string;
    similarity_score: number;
  }>;
  height?: number;
}

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════

export default function SimilarityGraph({
  sourceBand,
  recommendations,
  height = 600,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const router = useRouter();

  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // ─────────────────────────────────────────
  // DONNÉES DU GRAPHE
  // ─────────────────────────────────────────
  const graphData: GraphData = useMemo(
    () => buildGraphData(sourceBand, recommendations, 20),
    [sourceBand, recommendations]
  );

  // ─────────────────────────────────────────
  // GESTION DU REDIMENSIONNEMENT
  // ─────────────────────────────────────────
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions(getContainerDimensions(containerRef.current));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // ─────────────────────────────────────────
  // INITIALISATION D3
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height: h } = dimensions;

    // Nettoyer le SVG précédent
    svg.selectAll('*').remove();

    // Créer la simulation
    const simulation = createForceSimulation(graphData.nodes, graphData.links, {
      width,
      height: h,
    });
    simulationRef.current = simulation;

    // ─────────────────────────────────────
    // LIENS
    // ─────────────────────────────────────
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('stroke', (d) => getLinkColor(d.strength))
      .attr('stroke-width', (d) => Math.sqrt(d.strength) * 3)
      .attr('stroke-linecap', 'round');

    // ─────────────────────────────────────
    // NŒUDS
    // ─────────────────────────────────────
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Halo pour le nœud source
    node
      .filter((d) => d.isSource === true)
      .append('circle')
      .attr('r', (d) => d.radius + 8)
      .attr('fill', 'none')
      .attr('stroke', '#d63031')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 2')
      .attr('opacity', 0.7);

    // Cercle principal
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => getGenreColor(d.genre))
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Label du nœud
    node
      .append('text')
      .text((d) => truncateName(d.name))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 15)
      .attr('fill', '#e7e5e4')
      .attr('font-size', (d) => (d.isSource ? '13px' : '11px'))
      .attr('font-weight', (d) => (d.isSource ? 'bold' : 'normal'))
      .attr('pointer-events', 'none')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 3);

    // ─────────────────────────────────────
    // INTERACTIONS
    // ─────────────────────────────────────
    node
      .on('mouseover', function (event, d) {
        // Agrandir le nœud
        d3.select(this)
          .select('circle:last-of-type')
          .transition()
          .duration(200)
          .attr('r', d.radius * 1.2);

        // Afficher le tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-sm">${d.name}</div>
            <div class="text-xs" style="color: ${getGenreColor(d.genre)}">${d.genre}</div>
            <div class="text-xs text-gray-400">🌍 ${d.country}</div>
            ${!d.isSource ? `<div class="text-xs text-metal-fire">Similarité : ${formatSimilarity(d.similarity)}</div>` : ''}
          `;
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          tooltipRef.current.style.left = `${event.clientX - containerRect.left + 15}px`;
          tooltipRef.current.style.top = `${event.clientY - containerRect.top - 10}px`;
        }
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .select('circle:last-of-type')
          .transition()
          .duration(200)
          .attr('r', d.radius);

        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Clic sur le fond pour désélectionner
    svg.on('click', () => setSelectedNode(null));

    // ─────────────────────────────────────
    // TICK DE LA SIMULATION
    // ─────────────────────────────────────
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
      svg.selectAll('*').remove();
    };
  }, [graphData, dimensions]);

  // ─────────────────────────────────────────
  // NAVIGATION VERS UN GROUPE
  // ─────────────────────────────────────────
  const handleNavigateToBand = useCallback(() => {
    if (!selectedNode) return;

    // Si c'est le groupe source, on y est déjà
    if (selectedNode.isSource) {
      router.push(`/band/${sourceBand.id}`);
      return;
    }

    // Pour les recommandations, on recherche le groupe
    router.push(`/search/${encodeURIComponent(selectedNode.name)}`);
  }, [selectedNode, sourceBand.id, router]);

  // ─────────────────────────────────────────
  // ÉTAT VIDE
  // ─────────────────────────────────────────
  if (recommendations.length === 0) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">🕸️</div>
        <p className="text-gray-400">
          Aucune recommandation disponible pour ce groupe.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Conteneur du graphe */}
      <div
        ref={containerRef}
        className="metal-card relative overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={height}
          className="w-full h-full"
        />

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="d3-tooltip"
          style={{ opacity: 0, transition: 'opacity 0.2s' }}
        />

        {/* Légende */}
        <div className="absolute top-4 left-4 metal-card p-3 max-w-xs">
          <h4 className="text-xs font-semibold text-gray-300 mb-2">Légende</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-metal-fire inline-block" />
              <span className="text-gray-400">{sourceBand.name} (source)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-metal-fire inline-block" />
              <span className="text-gray-400">Groupes similaires</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de détails du nœud sélectionné */}
      {selectedNode && (
        <div className="metal-card p-5 animate-slide-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getGenreColor(selectedNode.genre) }}
                />
                <h3 className="font-serif text-xl">{selectedNode.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-2 py-1 bg-metal-dark border border-metal-gray rounded">
                  🎸 {selectedNode.genre}
                </span>
                <span className="px-2 py-1 bg-metal-dark border border-metal-gray rounded">
                  🌍 {selectedNode.country}
                </span>
                {!selectedNode.isSource && (
                  <span className="px-2 py-1 bg-metal-blood/30 border border-metal-blood rounded text-metal-fire">
                    Similarité : {formatSimilarity(selectedNode.similarity)}
                  </span>
                )}
              </div>
            </div>
            <button onClick={handleNavigateToBand} className="metal-button shrink-0">
              Voir la fiche →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
