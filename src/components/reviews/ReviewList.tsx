'use client';

import Image from 'next/image';
import { useAuth } from '@/api/authApi';
import { useBandReviews, useBandAverageRating, useDeleteReview } from '@/api/reviewsApi';
import { ReviewWithAuthor } from '@/types/supabase';
import ReviewForm from './ReviewForm';

interface Props {
  bandId: number;
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT UTILITAIRE : ÉTOILES
// ═══════════════════════════════════════════════════════════

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL : LISTE DES AVIS
// ═══════════════════════════════════════════════════════════

export default function ReviewList({ bandId }: Props) {
  const { data: user } = useAuth();
  
  const { data: reviews = [], isLoading } = useBandReviews(bandId);
  const { averageRating, reviewCount } = useBandAverageRating(bandId);
  const deleteReview = useDeleteReview();

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Es-tu sûr de vouloir supprimer cet avis ?')) return;
    
    try {
      await deleteReview.mutateAsync(reviewId);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Impossible de supprimer cet avis. Vérifie tes permissions.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout d'avis */}
      <ReviewForm bandId={bandId} onSuccess={() => {}} />

      {/* Résumé des notes */}
      <div className="metal-card p-6 border border-metal-gray flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-metal-black to-metal-black/50">
        <div className="text-center sm:text-left">
          <h3 className="font-serif text-2xl text-metal-rust mb-1">Avis des Métalleux</h3>
          <p className="text-sm text-gray-400">
            {reviewCount} {reviewCount > 1 ? 'avis vérifiés' : 'avis vérifié'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-metal-gray/20 px-6 py-3 rounded-lg border border-metal-gray/50">
          <div className="text-center">
            <div className="text-3xl font-black text-white">
              {/* 🛡️ CORRECTION TYPE : Vérification explicite que averageRating n'est pas null */}
              {averageRating !== null && averageRating > 0 ? averageRating.toFixed(1) : '-'}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400">/ 5</div>
          </div>
          <div className="h-10 w-px bg-metal-gray/50" />
          <StarRating rating={averageRating !== null ? Math.round(averageRating) : 0} />
        </div>
      </div>

      {/* Liste des avis */}
      {isLoading ? (
        <div className="metal-card p-8 text-center border border-metal-gray animate-pulse">
          <p className="text-gray-500">Chargement des avis...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="metal-card p-12 text-center border border-metal-gray border-dashed">
          <div className="text-4xl mb-3">🤘</div>
          <h4 className="font-serif text-lg text-gray-300 mb-2">Aucun avis pour le moment</h4>
          <p className="text-sm text-gray-500">
            Sois le premier Métalleux à partager ton expérience sur ce groupe !
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem 
              key={review.id} 
              review={review} 
              isOwner={user?.id === review.user_id}
              onDelete={handleDelete}
              isDeleting={deleteReview.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPOSANT INTERNE : UN AVIS INDIVIDUEL
// ═══════════════════════════════════════════════════════════

interface ReviewItemProps {
  review: ReviewWithAuthor;
  isOwner: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ReviewItem({ review, isOwner, onDelete, isDeleting }: ReviewItemProps) {
  // 🛡️ CORRECTION TYPE : Gestion du cas où created_at est null pour éviter l'erreur de build
  const formattedDate = review.created_at 
    ? new Date(review.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date inconnue';

  const username = review.profiles?.username || 'Métalleux Anonyme';
  const avatarUrl = review.profiles?.avatar_url;

  return (
    <div className="metal-card p-5 border border-metal-gray hover:border-metal-fire/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar ou Initiale */}
        <div className="shrink-0">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={username} 
              width={40}
              height={40}
              unoptimized // Nécessaire pour les URLs d'avatar externes
              className="w-10 h-10 rounded-full border border-metal-gray object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-metal-fire/20 border border-metal-fire/50 flex items-center justify-center text-metal-fire font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Contenu de l'avis */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-200">{username}</span>
              <span className="text-gray-500 text-sm">•</span>
              <span className="text-gray-500 text-sm">{formattedDate}</span>
            </div>
            <StarRating rating={review.rating} />
          </div>

          {/* Titre de l'avis */}
          <h4 className="font-bold text-metal-rust text-lg mb-2">
            {review.title}
          </h4>

          {/* Contenu de l'avis */}
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {review.content}
          </p>

          {/* Bouton de suppression pour le propriétaire */}
          {isOwner && (
            <button
              onClick={() => onDelete(review.id)}
              disabled={isDeleting}
              className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              {isDeleting ? 'Suppression...' : '🗑️ Supprimer mon avis'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
