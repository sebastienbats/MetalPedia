'use client';

import { useState } from 'react';
import { useAuth } from '@/api/authApi';
import { metalServerApi } from '@/lib/metal-api';
import { useRouter } from 'next/navigation';

interface Props {
  bandId: number;
  onSuccess: () => void;
}

export default function ReviewForm({ bandId, onSuccess }: Props) {
  const { data: user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="metal-card p-6 text-center border border-metal-gray">
        <p className="text-gray-400 mb-4">Connecte-toi pour laisser un avis sur ce groupe.</p>
        <button 
          onClick={() => router.push('/login')} // Adapte le chemin si ton login est ailleurs
          className="px-4 py-2 bg-metal-fire text-white rounded-lg hover:bg-metal-fire/80 transition-colors"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Veuillez sélectionner une note.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await metalServerApi.addReview(bandId, user.id, rating, comment);
      setRating(0);
      setComment('');
      onSuccess(); // Rafraîchir la liste des avis
    } catch (err: any) {
      if (err.code === '23505') { // Contrainte UNIQUE (déjà noté)
        setError('Tu as déjà laissé un avis pour ce groupe.');
      } else {
        setError('Une erreur est survenue. Réessaie plus tard.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="metal-card p-6 border border-metal-gray space-y-4">
      <h3 className="font-serif text-lg text-metal-rust">Laisser un avis</h3>
      
      {/* Étoiles interactives */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="text-3xl transition-colors focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <span className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}>
              ★
            </span>
          </button>
        ))}
      </div>

      {/* Zone de commentaire */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partage ton expérience avec ce groupe (optionnel)..."
        className="w-full p-3 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none resize-none"
        rows={3}
        maxLength={500}
      />
      <div className="text-right text-xs text-gray-500">{comment.length}/500</div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full py-2 bg-metal-fire text-white font-semibold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Envoi en cours...' : 'Publier mon avis'}
      </button>
    </form>
  );
}
