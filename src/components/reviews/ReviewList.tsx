'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/api/authApi';
import { metalServerApi } from '@/lib/metal-api';
import ReviewForm from './ReviewForm';

interface Props {
  bandId: number;
}

export default function ReviewList({ bandId }: Props) {
  const { data: user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    const data = await metalServerApi.getBandReviews(bandId);
    setReviews(data.reviews);
    setAverageRating(data.averageRating);
    setTotalReviews(data.totalReviews);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [bandId]);

  const handleDelete = async (reviewId: string) => {
    if (!user || !confirm('Supprimer cet avis ?')) return;
    try {
      await metalServerApi.deleteReview(reviewId, user.id);
      fetchReviews();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <ReviewForm bandId={bandId} onSuccess={fetchReviews} />

      {/* Résumé */}
      <div className="flex items-center gap-4 p-4 bg-metal-black/30 rounded-lg border border-metal-gray">
        <div className="text-4xl font-bold text-metal-fire">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</div>
        <div>
          <div className="flex text-yellow-400 text-xl">
            {'★'.repeat(Math.round(averageRating))}
            {'☆'.repeat(5 - Math.round(averageRating))}
          </div>
          <div className="text-sm text-gray-400">{totalReviews} avis au total</div>
        </div>
      </div>

      {/* Liste des avis */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Chargement des avis...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500 metal-card border border-metal-gray">
          Aucun avis pour le moment. Sois le premier !
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="metal-card p-4 border border-metal-gray">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-200">
                    {review.profiles?.username || 'Métalleux Anonyme'}
                  </div>
                  <div className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  {user && review.user_id === user.id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
