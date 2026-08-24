import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-metal-gray py-6 text-center text-sm text-gray-500">
      <div className="container mx-auto px-4 max-w-7xl">
        <nav className="flex justify-center gap-4 mb-4">
          <Link href="/" className="hover:text-metal-fire">Accueil</Link>
          <Link href="/favorites" className="hover:text-metal-fire">Favoris</Link>
          <Link href="/profile" className="hover:text-metal-fire">Profil</Link>
          <Link href="/map" className="hover:text-metal-fire">Carte</Link>
          <Link href="/timeline" className="hover:text-metal-fire">Timeline</Link>
        </nav>
        <p>
          🤘 MetalPedia © 2026 — Propulsé par{' '}
          <a href="https://www.metal-api.dev" target="_blank" rel="noopener noreferrer" className="text-metal-fire">
            metal-api.dev
          </a>
        </p>
      </div>
    </footer>
  );
}
