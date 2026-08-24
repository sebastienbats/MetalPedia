'use client';

import { useState } from 'react';

interface Props {
  spotifyId: string;
  type?: 'album' | 'track' | 'artist' | 'playlist';
  height?: number;
}

export default function SpotifyEmbed({
  spotifyId,
  type = 'album',
  height,
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const defaultHeights: Record<string, number> = {
    track: 152,
    album: 352,
    artist: 352,
    playlist: 352,
  };

  const embedHeight = height || defaultHeights[type] || 352;
  const embedUrl = `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`;

  if (hasError) {
    return (
      <div className="rounded-lg border border-metal-gray bg-metal-dark p-4 text-center">
        <div className="text-3xl mb-2">🎵</div>
        <p className="text-sm text-gray-400">
          Impossible de charger le lecteur Spotify
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-metal-gray">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-metal-dark">
          <div className="animate-spin h-6 w-6">
            <svg viewBox="0 0 24 24" className="text-metal-fire">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        </div>
      )}

      <iframe
        title="Spotify Player"
        src={embedUrl}
        width="100%"
        height={embedHeight}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        style={{ borderRadius: '12px' }}
      />
    </div>
  );
}
