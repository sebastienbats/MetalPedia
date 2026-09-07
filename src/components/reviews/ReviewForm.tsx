'use client';

import { useState } from 'react';
import { useAuth } from '@/api/authApi';
import { useSubmitReview } from '@/api/reviewsApi';
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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [localError, setLocalError] = useState('');

  // 🆕 Utilisation du hook React Query pour une synchronisation instantanée du cache
  const submitReview = useSubmitReview();

  if (!user) {
    return (
      <div className="metal-card p-6 text-center border border-metal-gray">
        <p className="text-gray-400 mb-4">Connecte-toi pour laisser un avis sur ce groupe.</p>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-metal-fire text-white rounded-lg hover:bg-metal-fire/80 transition-colors"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // 🛡️ Validations côté client avant l'envoi
    if (rating === 0) {
      setLocalError('Veuillez sélectionner une note.');
      return;
    }
    if (!title.trim()) {
      setLocalError('Veuillez ajouter un titre à ton avis.');
      return;
    }
    if (!content.trim()) {
      setLocalError('Veuillez écrire au moins quelques mots sur ce groupe.');
      return;
    }

    try {
      // 🆕 Envoi des données via le hook, parfaitement aligné avec le schéma DB
      await submitReview.mutateAsync({
        user_id: user.id,
        band_id: bandId,
        rating,
        title: title.trim(),
        content: content.trim(),
        album_id: null, // Optionnel selon ton schéma
      });

      // Reset du formulaire en cas de succès
      setRating(0);
      setTitle('');
      setContent('');
      onSuccess(); // Déclenche le rafraîchissement de la liste des avis
      
    } catch (err: any) {
      console.error('Erreur soumission avis:', err);
      
      // 🛡️ Gestion précise des erreurs Supabase/PostgreSQL
      if (err.code === '23505') { 
        setLocalError('Tu as déjà laissé un avis pour ce groupe.');
      } else if (err.message?.includes('violates row-level security') || err.code === '42501') {
        setLocalError('Erreur de permission. Vérifie que tu es bien connecté.');
      } else if (err.message?.includes('null value') || err.code === '23502') {
        setLocalError('Tous les champs obligatoires doivent être remplis.');
      } else {
        setLocalError(`Une erreur est survenue : ${err.message || 'Réessaie plus tard.'}`);
      }
    }
  };

  const isSubmitting = submitReview.isPending;

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
            aria-label={`Noter ${star} sur 5`}
          >
            <span className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}>
              ★
            </span>
          </button>
        ))}
      </div>

      {/* 🆕 Champ Titre (Requis par le schéma DB) */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de ton avis (ex: Un classique intemporel !)"
        className="w-full p-3 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none"
        maxLength={100}
        required
      />

      {/* Zone de commentaire (Renommé en 'content' pour correspondre à la DB) */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Partage ton expérience avec ce groupe..."
        className="w-full p-3 bg-metal-black/50 border border-metal-gray rounded-lg text-gray-200 focus:border-metal-fire focus:outline-none resize-none"
        rows={4}
        maxLength={1000}
        required
      />
      <div className="text-right text-xs text-gray-500">{content.length}/1000</div>

      {/* Message d'erreur stylisé */}
      {localError && (
        <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-500/30 flex items-center gap-2">
          <span>⚠️</span> {localError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0 || !title.trim() || !content.trim()}
        className="w-full py-2 bg-metal-fire text-white font-semibold rounded-lg hover:bg-metal-fire/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span> Envoi en cours...
          </>
        ) : (
          'Publier mon avis'
        )}
      </button>
    </form>
  );
}
