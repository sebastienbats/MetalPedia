
'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

interface AnimBorderProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  color?: string;
  borderWidth?: number;
  radius?: number;
  glow?: boolean;
  glowWidth?: number;
  glowOpacity?: number;
  segmentLength?: number;
  paused?: boolean;
}

interface Dimensions {
  width: number;
  height: number;
}

export default function AnimBorder({
  children,
  className = '',
  duration = 6,
  color = '#ff7518',
  borderWidth = 1,
  radius = 12,
  glow = true,
  glowWidth = 2,
  glowOpacity = 0.25,
  segmentLength = 18,
  paused = false,
}: AnimBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  // ==========================================
  // RESPONSIVE DIMENSIONS
  // ==========================================

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();

      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  // ==========================================
  // SVG ROUNDED RECTANGLE PATH
  // ==========================================

  const createRoundedPath = (
    width: number,
    height: number,
    strokeWidth: number,
    cornerRadius: number,
  ) => {
    const inset = strokeWidth / 2;

    const x = inset;
    const y = inset;

    const right = width - inset;
    const bottom = height - inset;

    const r = Math.max(
      0,
      Math.min(
        cornerRadius - inset,
        (Math.min(width, height) - strokeWidth) / 2,
      ),
    );

    return [
      `M ${x + r} ${y}`,
      `H ${right - r}`,
      `A ${r} ${r} 0 0 1 ${right} ${y + r}`,
      `V ${bottom - r}`,
      `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
      `H ${x + r}`,
      `A ${r} ${r} 0 0 1 ${x} ${bottom - r}`,
      `V ${y + r}`,
      `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
      'Z',
    ].join(' ');
  };

  // ==========================================
  // SVG GEOMETRY
  // ==========================================

  const safeBorderWidth = Math.max(0.1, borderWidth);
  const safeGlowWidth = Math.max(0, glowWidth);

  const path = dimensions.width > 0 && dimensions.height > 0
    ? createRoundedPath(
        dimensions.width,
        dimensions.height,
        safeBorderWidth,
        radius,
      )
    : '';

  const safeSegmentLength = Math.min(
    99,
    Math.max(1, segmentLength),
  );

  const dashArray = `${safeSegmentLength} ${100 - safeSegmentLength}`;

  // ==========================================
  // ANIMATION STYLE
  // ==========================================

  const animationStyle: CSSProperties = {
    animationDuration: `${Math.max(0.1, duration)}s`,
    animationPlayState: paused ? 'paused' : 'running',
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      ref={containerRef}
      className={`anim-border-v2 relative ${className}`}
      style={{
        borderRadius: `${radius}px`,
      }}
    >
      {/* ANIMATED SVG BORDER */}

      {path && (
        <svg
          className="anim-border-v2__svg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="anim-border-v2-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {/* ================================== */}
          {/* GLOW - SAME PATH AND ANIMATION */}
          {/* ================================== */}

          {glow && (
            <path
              d={path}
              pathLength="100"
              fill="none"
              stroke={color}
              strokeWidth={safeBorderWidth + safeGlowWidth * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashArray}
              filter="url(#anim-border-v2-glow)"
              opacity={glowOpacity}
              className="anim-border-v2__path"
              style={animationStyle}
            />
          )}

          {/* ================================== */}
          {/* ORANGE ANIMATED SEGMENT */}
          {/* ================================== */}

          <path
            d={path}
            pathLength="100"
            fill="none"
            stroke={color}
            strokeWidth={safeBorderWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashArray}
            className="anim-border-v2__path"
            style={animationStyle}
          />
        </svg>
      )}

      {/* CONTENT */}

      <div className="relative z-10">
        {children}
      </div>

      {/* ANIMATION CSS */}

      <style jsx global>{`
        .anim-border-v2 {
          position: relative;
          isolation: isolate;
        }

        .anim-border-v2__svg {
          position: absolute;
          inset: 0;
          z-index: 20;
          display: block;
          overflow: visible;
          pointer-events: none;
        }

        .anim-border-v2__path {
          animation-name: anim-border-v2-dash;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes anim-border-v2-dash {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -100;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-border-v2__path {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
