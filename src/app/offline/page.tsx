export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-7xl mb-4">📡</div>
      <h1 className="font-metal text-4xl text-metal-rust mb-3">Hors ligne</h1>
      <p className="text-gray-400 mb-6 max-w-md">
        Vous n'êtes pas connecté à internet. Vos favoris et données locales
        restent accessibles. La synchronisation reprendra automatiquement.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="metal-button"
      >
        🔄 Réessayer
      </button>
    </div>
  );
}
