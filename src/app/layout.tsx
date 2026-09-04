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
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializer }}
        />

        <link rel="preconnect" href="https://www.metal-api.dev" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        <link rel="dns-prefetch" href="https://www.metal-api.dev" />
        <link rel="dns-prefetch" href="https://open.spotify.com" />
      </head>

      {/* 🛡️ BLINDAGE 1 : Fond solide global pour éviter toute transparence indésirable */}
      <body
        className={`${fontInter.className} antialiased min-h-screen flex flex-col bg-metal-black text-gray-100`}
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:metal-button"
        >
          Aller au contenu principal
        </a>

        <Providers>
          <Header />

          {/* 🛡️ BLINDAGE 2 : flex-1 pousse le footer vers le bas. 
              pb-32 (128px) réserve un espace de sécurité pour les widgets fixes en bas de page. */}
          <main
            id="main-content"
            className="flex-1 container mx-auto px-4 py-8 max-w-7xl pb-32"
            tabIndex={-1}
          >
            {children}
          </main>

          {/* 🛡️ BLINDAGE 3 : Le footer a un z-index (50) SUPÉRIEUR à la XPBar (40). 
              Le bg-metal-black assure qu'il est 100% opaque et recouvre proprement la XPBar au scroll. */}
          <div className="relative z-50 bg-metal-black border-t border-metal-gray">
            <Footer />
          </div>

          {/* ═══════════════════════════════════════════
              COMPOSANTS GLOBAUX (z-index gérés en interne)
              ═══════════════════════════════════════════ */}
          <CommandPalette />
          <OfflineIndicator />
          
          {/* La XPBar reste en z-40, elle sera donc en dessous du footer (z-50) en bas de page */}
          <XPBar />
          
          <LevelUpModal />
        </Providers>
      </body>
    </html>
  );
}
