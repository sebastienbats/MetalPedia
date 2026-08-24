import { notFound } from 'next/navigation';
import { metalServerApi } from '@/lib/metal-api';
import BandDetailClient from '@/components/bands/BandDetailClient';
import { Suspense } from 'react';

export const revalidate = 3600;

export async function generateStaticParams() {
  const popularBandIds = [1, 42, 123, 456];
  return popularBandIds.map((id) => ({ id: String(id) }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BandPage({ params }: Props) {
  const { id } = await params;
  const bandId = parseInt(id, 10);

  try {
    const band = await metalServerApi.getBand(bandId);
    return (
      <Suspense fallback={<div className="text-center py-16">Chargement...</div>}>
        <BandDetailClient band={band} />
      </Suspense>
    );
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const band = await metalServerApi.getBand(parseInt(id, 10));
    return {
      title: `${band.name} — MetalPedia`,
      description: `${band.genre} from ${band.country}. Formed in ${band.formed}.`,
    };
  } catch {
    return { title: 'Groupe introuvable — MetalPedia' };
  }
}
