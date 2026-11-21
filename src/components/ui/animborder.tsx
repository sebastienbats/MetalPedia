
'use client';

import React from 'react';

interface AnimBorderProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  color?: string;
  borderWidth?: number;
  radius?: number;
  glow?: boolean;
  paused?: boolean;
}

export default function AnimBorder({
  children,
  className = '',
  duration = 4,
  color = '#ff7518',
  borderWidth = 2,
  radius = 12,
  glow = true,
  paused = false,
}: AnimBorderProps) {
  // Identifiant unique pour chaque instance SVG
  const instanceId = React.useId().replace(/:/g, '');

  // Sécurisation de la durée
  const animationDuration = `${Math.max(0.1, duration)}s`;

  const glowId = `animborder-glow-${instanceId}`;
  const gradientId = `animborder-gradient-${instanceId}`;

  const pathData =
    'M 8,1 H 92 Q 99,1 99,8 V 92 Q 99,99 92,99 H 8 Q 1,99 1,92 V 8 Q 1,1 8,1 Z';

  return (
    <div
      className={`animborder relative ${className}`}
      style={{
        borderRadius: `${radius}px`,
        isolation: 'isolate',
      }}
    >
      {/* Contenu du composant */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>

      {/* Contour SVG animé */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Filtre du halo lumineux */}
          <filter
            id={glowId}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="1.8" />
          </filter>

          {/* Dégradé du segment lumineux */}
          <linearGradient id={gradientId}>
            <stop
              offset="0%"
              stopColor={color}
              stopOpacity="0"
            />
            <stop
              offset="50%"
              stopColor={color}
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor={color}
              stopOpacity="1"
            />
          </linearGradient>
        </defs>

        {/* Halo lumineux */}
        {glow && (
          <path
            d={pathData}
            pathLength="100"
            fill="none"
            stroke={color}
            strokeWidth={borderWidth * 2.5}
            strokeLinecap="round"
            strokeDasharray="18 82"
            className={
              !paused
                ? 'animborder-path animborder-glow'
                : ''
            }
            style={{
              animationDuration,
              filter: `url(#${glowId})`,
              opacity: 0.8,
            }}
          />
        )}

        {/* Segment orange animé */}
        <path
          d={pathData}
          pathLength="100"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
          strokeLinecap="round"
          strokeDasharray="18 82"
          className={!paused ? 'animborder-path' : ''}
          style={{
            animationDuration,
          }}
        />
      </svg>

      {/* Animation CSS */}
      <style jsx>{`
        .animborder-path {
          animation-name: animborder-flow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animborder-glow {
          animation-name: animborder-flow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes animborder-flow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -100;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animborder-path {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
