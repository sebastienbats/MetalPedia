export default function Footer() {
  return (
    <footer className="border-t border-metal-gray py-6 text-center text-sm text-gray-500">
      <p>
        🤘 MetalPedia © 2026 — Données fournies par{' '}
        <a href="https://www.metal-api.dev" target="_blank" rel="noopener noreferrer" className="text-metal-fire hover:text-metal-rust">
          metal-api.dev
        </a>{' '}
        et{' '}
        <a href="https://www.metal-archives.com" target="_blank" rel="noopener noreferrer" className="text-metal-fire hover:text-metal-rust">
          Encyclopaedia Metallum
        </a>
      </p>
    </footer>
  );
}
