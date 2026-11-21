
'use client';

import React, { useId } from 'react';

interface AnimBorderProps {
  children: React.ReactNode;
  className?: string;

  /** Durée d'un tour complet en secondes */
  duration?: number;

  /** Couleur du segment lumineux */
  color?: string;

  /** Épaisseur réelle du segment en pixels */
  borderWidth?: number;

  /** Rayon des angles en pixels */
  radius?: number;

  /** Active le halo lumineux */
  glow?: boolean;

  /** Épaisseur du halo en pixels */
  glowWidth?: number;

  /** Intensité du halo */
  glowOpacity?: number;

  /** Longueur du segment lumineux en pourcentage */
  segmentLength?: number;

  /** Met en pause l'animation */
  paused?: boolean;
}

export default function AnimBorder({
  children,
  className = '',
  duration = 4,
  color = '#ff7518',
  borderWidth = 1,
  radius = 12,
  glow = true,
  glowWidth = 4,
  glowOpacity = 0.55,
  segmentLength = 18,
  paused = false,
}: AnimBorderProps) {
  const rawId = useId().replace(/:/g, '');

  const filterId = `animborder-filter-${rawId}`;
  const gradientId = `animborder-gradient-${rawId}`;

  // Sécurisation des paramètres
  const safeDuration = Math.max(0.1, duration);
  const safeBorderWidth = Math.max(0, borderWidth);
  const safeGlowWidth = Math.max(0, glowWidth);
  const safeRadius = Math.max(0, radius);

  const safeSegmentLength = Math.min(
    99,
    Math.max(1, segmentLength)
  );

  const safeGlowOpacity = Math.min(
    1,
    Math.max(0, glowOpacity)
  );

  const dashArray = `${safeSegmentLength} ${100 - safeSegmentLength}`;

  const animationStyle = {
    animationDuration: `${safeDuration}s`,
    animationPlayState: paused ? 'paused' as const : 'running' as const,
  };

  return (
    <div
      className={`animborder-v2 relative ${className}`}
      style={{
        borderRadius: `${safeRadius}px`,
        isolation: 'isolate',
      }}
    >
      {/* CONTENU */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>

      {/* SVG RESPONSIVE */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Filtre du halo */}
          <filter
            id={filterId}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="1.5" />
          </filter>

          {/* Dégradé du segment */}
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.65" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* HALO LUMINEUX */}
        {glow && safeGlowWidth > 0 && (
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            rx="12"
            pathLength="100"
            fill="none"
            stroke={color}
            strokeWidth={safeGlowWidth}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${filterId})`}
            opacity={safeGlowOpacity}
            className="animborder-v2-path"
            style={animationStyle}
          />
        )}

        {/* SEGMENT LUMINEUX PRINCIPAL */}
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx="12"
          pathLength="100"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={safeBorderWidth}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="animborder-v2-path"
          style={animationStyle}
        />
      </svg>

      {/* ANIMATION CSS */}
      <style jsx>{`
        .animborder-v2-path {
          animation: animborder-v2-flow linear infinite;
        }

        @keyframes animborder-v2-flow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -100;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animborder-v2-path {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
