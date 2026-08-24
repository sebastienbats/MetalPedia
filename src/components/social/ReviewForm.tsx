'use client';

import { useState, FormEvent } from 'react';
import { useSubmitReview } from '@/api/reviewsApi';
import { useAuth } from '@/api/authApi';
import { useGamificationStore } from '@/stores/gamificationStore';

interface Props {
  bandId: number;
  bandName: string;
  onAuthRequired: () => void;
}

export default function ReviewForm({ bandId, bandName, onAuthRequired }: Props) {
  const [rating, setRating] = useState(75);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: user } = useAuth();
  const submitReview = useSubmitReview();
  const recordReview = useGamificationStore((s) => s.recordReview);

  const ratingColor =
    rating >= 80 ? 'text-green-400' :
    rating >= 50 ? 'text-metal-fire' :
    'text-red-400';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      onAuthRequired();
      return;
    }

    if (content.length < 50) {
      setError('Votre critique doit contenir au moins 50 caractères.');
      return;
    }

    if (content.length > 5000) {
      setError('Votre critique ne doit pas dépasser 5000 caractères.');
      return;
    }

    try {
      await submitReview.mutateAsync({
        user_id: user.id,
        band_id: bandId,
        album_id: null,
        rating,
        title,
        content,
      });

      // Gamification : XP pour review écrite
      recordReview();

      // Reset du formulaire
      setTitle('');
      setContent('');
      setRating(75);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication');
    }
  };

  if (!user) {
    return (
      <div className="metal-card p-6 text-center">
        <div className="text-5xl mb-3">✍️</div>
        <p className="text-gray-400 mb-4">
          Connectez-vous pour écrire une critique et gagner{' '}
          <span className="text-metal-fire font-bold">+100 XP</span>
        </p>
        <button onClick={onAuthRequired} className="metal-button">
          🔐 Se connecter
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="metal-card p-6 space-y-4">
      <h3 className="font-serif text-xl">
        ✍️ Écrire une critique pour{' '}
        <span className="text-metal-fire">{bandName}</span>
      </h3>

      {/* Slider de notation */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Note : <span className={`font-bold ${ratingColor}`}>{rating}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full accent-metal-fire"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>💀 Horrible</span>
          <span>😐 Moyen</span>
          <span>🔥 Chef-d'œuvre</span>
        </div>
      </div>

      {/* Titre */}
      <input
        type="text"
        placeholder="Titre de votre critique..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="metal-input"
        required
        maxLength={100}
      />

      {/* Contenu */}
      <textarea
        placeholder="Partagez votre avis sur ce groupe... (minimum 50 caractères)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="metal-input min-h-[150px]"
        required
        minLength={50}
        maxLength={5000}
      />

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-md bg-red-900/30 border border-red-800 text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-green-900/30 border border-green-800 text-green-300 text-sm">
          ✅ Critique publiée ! <span className="font-bold">+100 XP</span> gagnés.
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {content.length}/5000 caractères
        </span>
        <button
          type="submit"
          disabled={submitReview.isPending || content.length < 50}
          className="metal-button"
        >
          {submitReview.isPending ? '📜 Publication...' : '🚀 Publier la critique'}
        </button>
      </div>
    </form>
  );
}
