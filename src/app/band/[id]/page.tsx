import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { metalServerApi } from '@/lib/metal-api';
import BandDetailClient from '@/components/bands/BandDetailClient';
import Loader from '@/components/ui/Loader';

// ═══════════════════════════════════════════
// CONFIGURATION ISR
// ═══════════════════════════════════════════
export const revalidate = 3600;

// ═══════════════════════════════════════════
// PARAMS (Next.js 15)
// ═══════════════════════════════════════════
interface Props {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════
// GÉNÉRATION STATIQUE
// ═══════════════════════════════════════════
export async function generateStaticParams() {
  const popularBandIds = [1, 42, 123, 456, 789, 1000];
  return popularBandIds.map((id) => ({ id: String(id) }));
}

// ═══════════════════════════════════════════
// PAGE PRINCIPALE (Server Component)
// ═══════════════════════════════════════════
export default async function BandPage({ params }: Props) {
  const { id } = await params;
  const bandId = parseInt(id, 10);

  if (isNaN(bandId) || bandId <= 0) {
    notFound();
  }

  try {
    // 🆕 Fetch parallèle : band + albums + members
    const [band, albums, members] = await Promise.all([
      metalServerApi.getBand(bandId),
      metalServerApi.getBandAlbums(bandId),
      metalServerApi.getBandMembers(bandId),
    ]);

    if (!band) {
      notFound();
    }

    return (
      <Suspense fallback={<Loader text="Chargement de la fiche groupe..." />}>
        <BandDetailClient 
          band={band} 
          albums={albums}
          members={members}
        />
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
      return { title: 'Groupe introuvable' };
    }

    return {
      title: `${band.name} — Fiche complète`,
      description: `${band.genre} de ${band.country}, formé en ${band.formed}. Biographie, discographie, membres et critiques sur MetalPedia.`,
      openGraph: {
        title: `${band.name} | MetalPedia`,
        description: `${band.genre} — ${band.country}`,
        type: 'article',
        images: band.image_url ? [band.image_url] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${band.name} | MetalPedia`,
        description: `${band.genre} — Formé en ${band.formed}`,
        images: band.image_url ? [band.image_url] : [],
      },
    };
  } catch {
    return { title: 'Groupe introuvable — MetalPedia' };
  }
}
