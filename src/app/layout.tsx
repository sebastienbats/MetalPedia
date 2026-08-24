import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import CommandPalette from '@/components/ui/CommandPalette';
import '@/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'MetalPedia 🤘 Encyclopédie du Metal',
  description: 'Plus de 170 000 groupes de metal référencés. Explorez le Black, Death, Heavy, Thrash et plus.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#8b0000',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            {children}
          </main>
          <Footer />
          <CommandPalette />
          <OfflineIndicator />
        </Providers>
      </body>
    </html>
  );
}
