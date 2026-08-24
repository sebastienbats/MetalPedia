'use client';

import { useState } from 'react';
import { useBandReviews, useDeleteReview, ReviewWithAuthor } from '@/api/reviewsApi';
import { useAuth } from '@/api/authApi';
import Loader from '@/components/ui/Loader';

interface Props {
  bandId: number;
}

function ReviewItem({ review, currentUserId }: { review: ReviewWithAuthor; currentUserId?: string }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteReview();
  const isOwner = currentUserId === review.user_id;

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

  return (
    <div className="metal-card p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-metal-blood to-metal-rust flex items-center justify-center font-bold text-white">
            {review.profiles.username[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{review.profiles.username}</div>
            <div className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className={`text-3xl font-bold ${ratingColor}`}>
          {review.rating}%
        </div>
      </div>

      {/* Titre */}
      <h4 className="font-serif text-lg mb-2 text-metal-fire">{review.title}</h4>

      {/* Contenu */}
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
        {review.content}
      </p>

      {/* Actions owner */}
      {isOwner && (
        <div className="mt-4 flex items-center gap-3">
          {showDeleteConfirm ? (
            <>
              <span className="text-xs text-gray-400">Confirmer la suppression ?</span>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-xs px-2 py-1 rounded bg-red-900/50 hover:bg-red-800 text-red-200 transition-colors"
              >
                {deleteMutation.isPending ? '...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs px-2 py-1 rounded bg-metal-gray hover:bg-metal-blood/30 transition-colors"
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              🗑️ Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewList({ bandId }: Props) {
  const { data: reviews, isLoading, error } = useBandReviews(bandId);
  const { data: user } = useAuth();

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        ⚠️ Erreur lors du chargement des critiques
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">📜</div>
        <p className="text-gray-400">
          Aucune critique pour l'instant. Soyez le premier à partager votre avis !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-gray-300">
          {reviews.length} critique{reviews.length > 1 ? 's' : ''}
        </h3>
      </div>

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
