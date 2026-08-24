import type { Metadata, Viewport } from 'next';
import { Cinzel, Inter, Metal_Mania } from 'next/font/google';
import Script from 'next/script';
import { Providers } from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OfflineIndicator from '@/components/ui/OfflineIndicator';
import CommandPalette from '@/components/ui/CommandPalette';
import XPBar from '@/components/gamification/XPBar';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import '@/i18n';
import './globals.css';

// ═══════════════════════════════════════════
// POLICES GOOGLE (optimisées par next/font)
// ═══════════════════════════════════════════
const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fontCinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const fontMetalMania = Metal_Mania({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-metal-mania',
  display: 'swap',
});

// ═══════════════════════════════════════════
// MÉTADONNÉES SEO
// ═══════════════════════════════════════════
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://metalpedia.vercel.app'),
  title: {
    default: 'MetalPedia 🤘 Encyclopédie du Metal',
    template: '%s | MetalPedia',
  },
  description:
    'Plus de 170 000 groupes de metal référencés. Explorez le Black, Death, Heavy, Thrash, Power, Doom, Progressive et Folk metal avec recommandations ML et gamification épique.',
  keywords: [
    'metal',
    'encyclopedia',
    'black metal',
    'death metal',
    'heavy metal',
    'thrash metal',
    'power metal',
    'doom metal',
    'music database',
    'metalpedia',
  ],
  authors: [{ name: 'MetalPedia Team' }],
  creator: 'MetalPedia',
  publisher: 'MetalPedia',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'MetalPedia',
    title: 'MetalPedia 🤘 Encyclopédie du Metal',
    description: '170 000+ groupes de metal. Recommandations ML. Gamification épique.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MetalPedia 🤘 Encyclopédie du Metal',
    description: '170 000+ groupes de metal. Recommandations ML. Gamification épique.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    languages: {
      'fr-FR': '/fr',
      'en-US': '/en',
    },
  },
};

// ═══════════════════════════════════════════
// VIEWPORT (PWA + Mobile)
// ═══════════════════════════════════════════
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#8b0000' },
    { media: '(prefers-color-scheme: light)', color: '#8b0000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark',
  viewportFit: 'cover',
};

// ═══════════════════════════════════════════
// SCRIPT ANTI-FLASH DE THÈME
// Exécuté avant le rendu pour éviter le flash blanc/thème par défaut
// ═══════════════════════════════════════════
const themeInitializer = `
(function() {
  try {
    var stored = localStorage.getItem('metalpedia-ui');
    var theme = 'forge';
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.state && parsed.state.theme) {
          theme = parsed.state.theme;
        }
      } catch(e) {}
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'forge');
  }
})();
`;

// ═══════════════════════════════════════════
// LAYOUT RACINE
// ═══════════════════════════════════════════
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${fontInter.variable} ${fontCinzel.variable} ${fontMetalMania.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Script anti-flash : haute priorité, exécuté avant le paint */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializer }}
        />

        {/* Préconnexions pour les APIs tierces */}
        <link rel="preconnect" href="https://www.metal-api.dev" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        {/* DNS prefetch pour performance */}
        <link rel="dns-prefetch" href="https://www.metal-api.dev" />
        <link rel="dns-prefetch" href="https://open.spotify.com" />
      </head>

      <body
        className={`${fontInter.className} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {/* Skip link pour accessibilité */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:metal-button"
        >
          Aller au contenu principal
        </a>

        <Providers>
          {/* Header sticky avec recherche et sélecteur de thème */}
          <Header />

          {/* Contenu principal */}
          <main
            id="main-content"
            className="flex-1 container mx-auto px-4 py-8 max-w-7xl pb-28"
            tabIndex={-1}
          >
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* ═══════════════════════════════════════════
              COMPOSANTS GLOBAUX
              ═══════════════════════════════════════════ */}

          {/* Navigation rapide (Ctrl+K) */}
          <CommandPalette />

          {/* Indicateur offline (bas à droite) */}
          <OfflineIndicator />

          {/* Barre d'XP gamification (bas fixe) */}
          <XPBar />

          {/* Modal de level up (overlay) */}
          <LevelUpModal />
        </Providers>
      </body>
    </html>
  );
}
