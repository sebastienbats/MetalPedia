'use client';

import { useState } from 'react';
import { useBandReviews, useDeleteReview } from '@/api/reviewsApi';
import type { ReviewWithAuthor } from '@/types/supabase';
import { useAuth } from '@/api/authApi';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════

interface Props {
  bandId: number;
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT : REVIEW ITEM
// ═══════════════════════════════════════════════════════════

function ReviewItem({ 
  review, 
  currentUserId 
}: { 
  review: ReviewWithAuthor; 
  currentUserId?: string 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteReview();
  const isOwner = currentUserId === review.user_id;

  // Déterminer la couleur selon la note
  const ratingColor =
    review.rating >= 80 ? 'text-green-400' :
    review.rating >= 50 ? 'text-metal-fire' :
    'text-red-400';

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(review.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Formater la date (avec fallback si created_at est null)
  const formattedDate = new Date(
    review.created_at ?? new Date().toISOString()
  ).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="metal-card p-5 animate-slide-up">
      {/* Header : Auteur + Note */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-metal-blood to-metal-rust flex items-center justify-center font-bold text-white shrink-0">
            {review.profiles.username[0]?.toUpperCase() || '?'}
          </div>
          
          {/* Infos auteur */}
          <div>
            <div className="font-semibold">{review.profiles.username}</div>
            <div className="text-xs text-gray-400">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className={`text-3xl font-bold ${ratingColor} shrink-0`}>
          {review.rating}%
        </div>
      </div>

      {/* Titre */}
      <h4 className="font-serif text-lg mb-2 text-metal-fire">
        {review.title}
      </h4>

      {/* Contenu */}
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {review.content}
      </p>

      {/* Actions owner */}
      {isOwner && (
        <div className="mt-4 pt-4 border-t border-metal-gray">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Confirmer la suppression ?
              </span>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-xs px-3 py-1.5 rounded bg-red-900/50 hover:bg-red-800 text-red-200 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs px-3 py-1.5 rounded bg-metal-gray hover:bg-metal-blood/30 transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              🗑️ Supprimer ma critique
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : REVIEW LIST
// ═══════════════════════════════════════════════════════════

export default function ReviewList({ bandId }: Props) {
  const { data: reviews, isLoading, error } = useBandReviews(bandId);
  const { data: user } = useAuth();

  // ─────────────────────────────────────────
  // ÉTAT : CHARGEMENT
  // ─────────────────────────────────────────
  if (isLoading) {
    return <Loader text="Chargement des critiques..." />;
  }

  // ─────────────────────────────────────────
  // ÉTAT : ERREUR
  // ─────────────────────────────────────────
  if (error) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-400 mb-2">
          Erreur lors du chargement des critiques
        </p>
        <p className="text-sm text-gray-500">
          Veuillez réessayer plus tard.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ÉTAT : VIDE
  // ─────────────────────────────────────────
  if (!reviews?.length) {
    return (
      <div className="metal-card p-8 text-center">
        <div className="text-5xl mb-3">📜</div>
        <p className="text-gray-400 mb-2">
          Aucune critique pour l'instant
        </p>
        <p className="text-sm text-gray-500">
          Soyez le premier à partager votre avis sur ce groupe !
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ÉTAT : AVEC DONNÉES
  // ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Compteur */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-gray-300">
          {reviews.length} critique{reviews.length > 1 ? 's' : ''}
        </h3>
        
        {/* Note moyenne */}
        {reviews.length > 0 && (
          <div className="text-sm text-gray-400">
            Note moyenne :{' '}
            <span className="font-bold text-metal-fire">
              {Math.round(
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              )}%
            </span>
          </div>
        )}
      </div>

      {/* Liste des reviews */}
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
}
