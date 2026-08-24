'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

const GENRES = [
  { value: 'Black Metal', label: '🌑 Black Metal', description: 'Sombre, atmosphérique, gothique' },
  { value: 'Death Metal', label: '💀 Death Metal', description: 'Brutal, sanglant, horrifique' },
  { value: 'Power Metal', label: '🎻 Power Metal', description: 'Épique, fantasy, héroïque' },
  { value: 'Thrash Metal', label: '⚡ Thrash Metal', description: 'Agressif, rapide, punk' },
  { value: 'Doom Metal', label: '🌑 Doom Metal', description: 'Lent, occulte, pesant' },
];

// ═══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════

export default function AILogoGenerator() {
  const [bandName, setBandName] = useState('');
  const [genre, setGenre] = useState('Black Metal');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ name: string; genre: string; url: string }>>([]);

  const selectedGenre = GENRES.find((g) => g.value === genre);

  // ─────────────────────────────────────────
  // GÉNÉRATION DU LOGO
  // ─────────────────────────────────────────
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!bandName.trim()) {
      setError('Veuillez entrer un nom de groupe');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/ai/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandName: bandName.trim(), genre }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('Aucune image générée');
      }

      setImageUrl(data.imageUrl);

      // Ajouter à l'historique
      setHistory((prev) => [
        { name: bandName.trim(), genre, url: data.imageUrl },
        ...prev.slice(0, 5), // Garder les 6 derniers
      ]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du logo');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─────────────────────────────────────────
  // TÉLÉCHARGEMENT
  // ─────────────────────────────────────────
  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bandName.toLowerCase().replace(/\s+/g, '-')}-logo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  // ─────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Formulaire */}
      <form onSubmit={handleGenerate} className="metal-card p-6 space-y-5">
        <div>
          <label htmlFor="bandName" className="block text-sm font-semibold mb-2">
            Nom du groupe
          </label>
          <input
            id="bandName"
            type="text"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            placeholder="Ex : Infernal Frost, Eternal Darkness..."
            className="metal-input"
            maxLength={50}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Genre musical</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GENRES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGenre(g.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  genre === g.value
                    ? 'border-metal-fire bg-metal-blood/30 shadow-glow-blood'
                    : 'border-metal-gray bg-metal-dark hover:border-metal-fire'
                }`}
              >
                <div className="font-semibold text-sm">{g.label}</div>
                <div className="text-xs text-gray-400 mt-1">{g.description}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-900/30 border border-red-800 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || !bandName.trim()}
          className="metal-button w-full py-3 text-lg"
        >
          {isGenerating ? '⚡ Génération en cours...' : '🎨 Générer le logo'}
        </button>

        {selectedGenre && (
          <p className="text-xs text-gray-500 text-center">
            Style : {selectedGenre.description}
          </p>
        )}
      </form>

      {/* Loader de génération */}
      {isGenerating && (
        <div className="metal-card p-8 text-center">
          <Loader text="L'IA forge votre logo dans les flammes..." variant="inline" />
          <p className="text-sm text-gray-500 mt-4">
            Cela peut prendre 10-30 secondes selon la charge du serveur.
          </p>
        </div>
      )}

      {/* Résultat */}
      {imageUrl && !isGenerating && (
        <div className="metal-card overflow-hidden animate-slide-up">
          <div className="relative aspect-square bg-metal-black">
            <Image
              src={imageUrl}
              alt={`Logo de ${bandName}`}
              fill
              className="object-contain"
            />
          </div>
          <div className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="font-serif text-lg">{bandName}</div>
              <div className="text-sm text-gray-400">{genre}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownload} className="metal-button">
                💾 Télécharger
              </button>
              <button
                onClick={() => {
                  setImageUrl(null);
                  setBandName('');
                }}
                className="metal-button opacity-80"
              >
                🔄 Nouveau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div className="metal-card p-6">
          <h3 className="font-serif text-lg mb-4">📜 Historique des générations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setImageUrl(item.url);
                  setBandName(item.name);
                  setGenre(item.genre);
                }}
                className="metal-card p-3 hover:border-metal-fire transition-colors"
              >
                <div className="relative aspect-square bg-metal-black rounded mb-2 overflow-hidden">
                  <Image
                    src={item.url}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-sm font-semibold truncate">{item.name}</div>
                <div className="text-xs text-gray-400">{item.genre}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Infos */}
      <div className="metal-card p-5">
        <h3 className="font-serif text-lg mb-3">ℹ️ À propos</h3>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>• Les logos sont générés par <strong>OpenAI GPT-Image</strong></li>
          <li>• Chaque génération consomme des crédits API (limite : 5/jour)</li>
          <li>• Les images sont en 1024x1024 pixels</li>
          <li>• Utilisez-les librement pour vos projets personnels</li>
          <li>• Les résultats peuvent varier d'une génération à l'autre</li>
        </ul>
      </div>
    </div>
  );
}
