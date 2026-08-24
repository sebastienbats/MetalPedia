import type { Album } from '@/types/api';

export default function AlbumCard({ album }: { album: Album }) {
  return (
    <div className="metal-card p-4 hover:border-metal-fire transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-metal-blood to-metal-rust rounded flex items-center justify-center shrink-0">
          💿
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{album.name}</h4>
          <p className="text-xs text-metal-fire mt-1">{album.type}</p>
          <p className="text-xs text-gray-400 mt-1">{album.releaseDate}</p>
          {album.reviews && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-metal-gray rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-metal-blood to-metal-rust" style={{ width: `${album.reviews.percentage}%` }} />
              </div>
              <span className="text-xs">{album.reviews.percentage}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
