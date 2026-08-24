import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { metalServerApi } from '@/lib/metal-api';
import BandDetailClient from '@/components/bands/BandDetailClient';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// CONFIGURATION ISR
// ═══════════════════════════════════════════
export const revalidate = 3600; // Revalidation toutes les heures

// ═══════════════════════════════════════════
// PARAMS (Next.js 15 : params est une Promise)
// ═══════════════════════════════════════════
interface Props {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════
// GÉNÉRATION STATIQUE (groupes populaires)
// ═══════════════════════════════════════════
export async function generateStaticParams() {
  // IDs des groupes les plus populaires (pré-rendus)
  const popularBandIds = [1, 42, 123, 456, 789, 1000];
  return popularBandIds.map((id) => ({ id: String(id) }));
}

// ═══════════════════════════════════════════
// PAGE PRINCIPALE (Server Component)
// ═══════════════════════════════════════════
export default async function BandPage({ params }: Props) {
  const { id } = await params;
  const bandId = parseInt(id, 10);

  // Validation de l'ID
  if (isNaN(bandId) || bandId <= 0) {
    notFound();
  }

  try {
    const band = await metalServerApi.getBand(bandId);

    if (!band) {
      notFound();
    }

    return (
      <Suspense fallback={<Loader text="Chargement de la fiche groupe..." />}>
        <BandDetailClient band={band} />
      </Suspense>
    );
  } catch (error) {
    console.error(`Error fetching band ${bandId}:`, error);
    notFound();
  }
}

// ═══════════════════════════════════════════
// METADATA DYNAMIQUE (SEO)
// ═══════════════════════════════════════════
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const bandId = parseInt(id, 10);
    const band = await metalServerApi.getBand(bandId);

    if (!band) {
      return {
        title: 'Groupe introuvable',
      };
    }

    return {
      title: `${band.name} — Fiche complète`,
      description: `${band.genre} de ${band.country}, formé en ${band.formed}. Biographie, discographie, membres et critiques sur MetalPedia.`,
      openGraph: {
        title: `${band.name} | MetalPedia`,
        description: `${band.genre} — ${band.country}`,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${band.name} | MetalPedia`,
        description: `${band.genre} — Formé en ${band.formed}`,
      },
    };
  } catch {
    return {
      title: 'Groupe introuvable — MetalPedia',
    };
  }
}
