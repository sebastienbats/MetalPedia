import type { Metadata } from 'next';
import AILogoGenerator from '@/components/ai/AILogoGenerator';

export const metadata: Metadata = {
  title: 'AI Metal Studio — Générateur de logos',
  description:
    'Générez un logo de groupe de metal avec l\'intelligence artificielle. Choisissez votre genre et laissez la magie opérer.',
};

export default function AIStudioPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-metal-gray pb-6 text-center">
        <h1 className="font-metal text-5xl text-metal-rust mb-3">🤖 AI Metal Studio</h1>
        <p className="text-gray-400 font-serif">
          Générez un logo de groupe avec l'intelligence artificielle
        </p>
      </header>

      <AILogoGenerator />
    </div>
  );
}
