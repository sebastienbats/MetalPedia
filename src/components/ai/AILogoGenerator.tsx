'use client';

import { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import Loader from '@/components/ui/Loader';
import { PILLAR_METADATA, GAMIFICATION_PILLARS, type GamificationPillar } from '@/types/api';

declare global {
  interface Window {
    puter: any;
  }
}

const PROMPT_STYLES: Record<GamificationPillar, string> = {
  'Black Metal': 'Nordic runes, symmetrical, illegible twisted branches, gothic, frost, forest, dark atmospheric',
  'Death Metal': 'Brutal, bloody, illegible, skulls, gore, horror, aggressive typography, red and black, visceral',
  'Heavy Metal': 'Classic, eagle, lightning bolt, chrome, silver, 80s, traditional, majestic, wings, swords',
  'Thrash Metal': 'Aggressive, fast, sharp, punk style, angular, bright red, violent, 80s, jagged edges',
  'Power Metal': 'Epic, fantasy, dragon, golden, heroic, medieval, luminous, chivalrous, castles, knights',
  'Doom Metal': 'Slow, occult, heavy, ancient, mystical, candles, skull, gothic, dark, funeral, ritualistic',
  'Progressive Metal': 'Complex, geometric, futuristic, abstract, sophisticated, blue and violet, technical, cosmic',
  'Folk Metal': 'Nature, celtic runes, wood, green, viking, pagan, ancestral, organic, leaves, horns',
  'Metalcore': 'Modern, angular, black and white, aggressive, street, urban, contemporary, bold, sharp',
};

export default function AILogoGenerator() {
  const [bandName, setBandName] = useState('');
  const [genre, setGenre] = useState<GamificationPillar>('Black Metal');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ name: string; genre: GamificationPillar; url: string }>>([]);
  const [isPuterLoaded, setIsPuterLoaded] = useState(false);

  const pillarMeta = PILLAR_METADATA[genre];

  // Vérification périodique
  useEffect(() => {
    const checkPuter = () => typeof window !== 'undefined' && !!(window as any).puter?.ai;

    if (checkPuter()) {
      setIsPuterLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (checkPuter()) {
        setIsPuterLoaded(true);
        clearInterval(interval);
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkPuter()) {
        console.error('❌ Puter.js non détecté après 15s. window.puter =', (window as any).puter);
        setError("Le script Puter.js est bloqué ou n'a pas pu se charger. Essayez la navigation privée ou vérifiez vos paramètres de sécurité réseau.");
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();

    if (!bandName.trim()) {
      setError('Veuillez entrer un nom de groupe');
      return;
    }

    if (typeof window === 'undefined' || !(window as any).puter?.ai) {
      setError("Le moteur d'IA n'est pas disponible. Veuillez rafraîchir la page.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      const prompt = `A professional heavy metal band logo for the band named "${bandName.trim()}". 
Style: ${genre}. 
Visual elements: ${PROMPT_STYLES[genre]}. 
Requirements: Dark background, highly detailed, vector art style, aggressive and epic typography, centered, no extra text or watermarks, pure logo design, symmetrical composition, high contrast.`;

      console.log('🚀 Appel à puter.ai.txt2img...');
      const imageElement = await (window as any).puter.ai.txt2img(prompt, false);
      
      if (!imageElement || !imageElement.src) {
        throw new Error("L'IA n'a pas retourné d'image valide.");
      }

      console.log('✅ Image générée, récupération du blob...');
      const fetchResponse = await fetch(imageElement.src);
      if (!fetchResponse.ok) throw new Error("Échec du téléchargement de l'image générée.");
      
      const blob = await fetchResponse.blob();
      const file = new File([blob], `${bandName.trim().toLowerCase().replace(/\s+/g, '-')}-logo.png`, {
        type: blob.type || 'image/png',
      });

      console.log('📤 Envoi vers ImgBB...');
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/imgbb/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de l\'hébergement sur ImgBB');
      }

      const uploadData = await uploadResponse.json();
      setImageUrl(uploadData.url);
      
      setHistory((prev) => [
        { name: bandName.trim(), genre, url: uploadData.url },
        ...prev.slice(0, 5),
      ]);
    } catch (err: any) {
      console.error('❌ Erreur génération:', err);
      setError(err.message || 'Erreur lors de la génération du logo.');
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <>
      {/* Chargement direct du script avec gestion d'erreur explicite */}
      <Script 
        src="https://js.puter.com/v2/" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ Script Puter.js chargé avec succès.');
          setIsPuterLoaded(true);
        }}
        onError={(e) => {
          console.error('❌ Échec du chargement du script Puter.js:', e);
          setError("Impossible de charger le script Puter.js. Votre navigateur ou réseau bloque peut-être le domaine js.puter.com.");
        }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <form onSubmit={handleGenerate} className="metal-card p-6 space-y-5">
          <div>
            <label htmlFor="bandName" className="block text-sm font-semibold mb-2">Nom du groupe</label>
            <input
              id="bandName"
              type="text"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Ex : Infernal Frost, Eternal Darkness..."
              className="metal-input w-full"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Pilier du Metal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GAMIFICATION_PILLARS.map((pillarName) => {
                const meta = PILLAR_METADATA[pillarName];
                const isSelected = genre === pillarName;
                return (
                  <button
                    key={pillarName}
                    type="button"
                    onClick={() => setGenre(pillarName)}
                    className="p-3 rounded-lg border-2 text-left transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: isSelected ? `${meta.color}20` : 'rgba(20, 20, 20, 0.5)',
                      borderColor: isSelected ? meta.color : 'rgba(100, 100, 100, 0.5)',
                      boxShadow: isSelected ? `0 0 20px ${meta.color}40` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${meta.color})` }}>
                        {meta.icon}
                      </span>
                      <span className="font-metal text-sm font-bold" style={{ color: meta.color }}>
                        {pillarName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{meta.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-900/30 border border-red-800 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !bandName.trim() || !isPuterLoaded}
            className="w-full py-3 text-lg font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: `linear-gradient(135deg, ${pillarMeta.color}, ${pillarMeta.color}cc)`,
              boxShadow: `0 4px 20px ${pillarMeta.color}40`,
            }}
          >
            {!isPuterLoaded 
              ? '⏳ Chargement du moteur IA...' 
              : isGenerating 
                ? '⚡ Forge en cours...' 
                : '🎨 Générer le logo'}
          </button>

          {!isGenerating && (
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
              <span style={{ color: pillarMeta.color }}>{pillarMeta.icon}</span>
              Style IA : {PROMPT_STYLES[genre]}
            </p>
          )}
        </form>

        {isGenerating && (
          <div className="metal-card p-8 text-center">
            <Loader text="L'IA forge votre logo dans les flammes..." variant="inline" />
            <p className="text-sm text-gray-500 mt-4">
              Génération et hébergement en cours (cela peut prendre 10-20 secondes).
            </p>
          </div>
        )}

        {imageUrl && !isGenerating && (
          <div className="metal-card overflow-hidden border-2" style={{ borderColor: `${pillarMeta.color}60` }}>
            <div className="relative aspect-square bg-metal-black">
              <Image src={imageUrl} alt={`Logo de ${bandName}`} fill className="object-contain p-4" unoptimized />
            </div>
            <div className="p-4 flex items-center justify-between flex-wrap gap-4 border-t-2" style={{ borderColor: `${pillarMeta.color}40`, backgroundColor: `${pillarMeta.color}10` }}>
              <div>
                <div className="font-metal text-lg" style={{ color: pillarMeta.color }}>
                  {pillarMeta.icon} {bandName}
                </div>
                <div className="text-sm text-gray-400">{genre}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownload} className="px-4 py-2 rounded-lg font-bold text-white transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${pillarMeta.color}, ${pillarMeta.color}cc)`, boxShadow: `0 2px 10px ${pillarMeta.color}40` }}>
                  💾 Télécharger
                </button>
                <button onClick={() => { setImageUrl(null); setBandName(''); }} className="px-4 py-2 rounded-lg font-bold text-white bg-metal-gray/50 border border-metal-gray hover:bg-metal-gray/70 transition-all">
                  🔄 Nouveau
                </button>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="metal-card p-6">
            <h3 className="font-metal text-lg mb-4 text-metal-fire">📜 Historique des générations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {history.map((item, index) => {
                const itemMeta = PILLAR_METADATA[item.genre];
                return (
                  <button
                    key={index}
                    onClick={() => { setImageUrl(item.url); setBandName(item.name); setGenre(item.genre); }}
                    className="metal-card p-3 hover:scale-[1.02] transition-all text-left border-2"
                    style={{ borderColor: `${itemMeta.color}40` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = itemMeta.color;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 15px ${itemMeta.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${itemMeta.color}40`;
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div className="relative aspect-square bg-metal-black rounded mb-2 overflow-hidden border" style={{ borderColor: `${itemMeta.color}40` }}>
                      <Image src={item.url} alt={item.name} fill className="object-contain p-2" unoptimized />
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg">{itemMeta.icon}</span>
                      <div className="text-sm font-bold truncate" style={{ color: itemMeta.color }}>{item.name}</div>
                    </div>
                    <div className="text-xs text-gray-400">{item.genre}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="metal-card p-5">
          <h3 className="font-metal text-lg mb-3 text-metal-fire">ℹ️ À propos</h3>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Les logos sont générés gratuitement par <strong className="text-metal-fire">Puter.js AI</strong>.</li>
            <li>• Les images sont hébergées de manière persistante via <strong className="text-metal-fire">ImgBB</strong>.</li>
            <li>• ⚠️ <strong>Diagnostic :</strong> Si le bouton reste bloqué, ouvrez la console (F12). Si <code>window.puter</code> est <code>undefined</code>, votre navigateur ou réseau bloque activement le domaine <code>js.puter.com</code>.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
