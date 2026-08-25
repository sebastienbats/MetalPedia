import { ImageResponse } from 'next/og';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════
export const runtime = 'edge';
export const alt = 'MetalPedia — Encyclopédie du Metal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ═══════════════════════════════════════════
// GÉNÉRATION DYNAMIQUE
// ═══════════════════════════════════════════
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)',
          position: 'relative',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Halo rouge en arrière-plan */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '300px',
            background: 'radial-gradient(circle at 50% 0%, rgba(139, 0, 0, 0.4) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Icône éclair */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 20,
            display: 'flex',
          }}
        >
          🤘
        </div>

        {/* Titre */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: '#d63031',
            marginBottom: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
          }}
        >
          MetalPedia
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: 32,
            color: '#e7e5e4',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          L'encyclopédie ultime du Metal
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#d63031', display: 'flex' }}>
              170K+
            </div>
            <div style={{ fontSize: 20, color: '#9ca3af', display: 'flex' }}>
              Groupes
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#d63031', display: 'flex' }}>
              15
            </div>
            <div style={{ fontSize: 20, color: '#9ca3af', display: 'flex' }}>
              Genres
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#d63031', display: 'flex' }}>
              100+
            </div>
            <div style={{ fontSize: 20, color: '#9ca3af', display: 'flex' }}>
              Pays
            </div>
          </div>
        </div>

        {/* Bordure décorative */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #8b0000, #d63031, #8b0000)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
