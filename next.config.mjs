import withPWAInit from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

// ═══════════════════════════════════════════
// WRAPPERS DE CONFIGURATION
// ═══════════════════════════════════════════

/**
 * Bundle Analyzer
 * Activé via : npm run analyze (ANALYZE=true next build)
 * Génère un rapport interactif de la taille du bundle
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * PWA (Progressive Web App)
 * Génère le service worker et le manifest
 * Désactivé en développement pour éviter les conflits de cache
 */
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
    image: '/icons/icon-192.png',
  },
  runtimeCaching: [
    // ─────────────────────────────────────────
    // API Metal (metal-api.dev)
    // Stratégie : StaleWhileRevalidate
    // → Réponse immédiate depuis le cache + refresh en arrière-plan
    // ─────────────────────────────────────────
    {
      urlPattern: /^https:\/\/www\.metal-api\.dev\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'metal-api-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 24 * 60 * 60, // 24 heures
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // ─────────────────────────────────────────
    // API interne (Next.js Route Handlers)
    // Stratégie : NetworkFirst avec fallback cache
    // ─────────────────────────────────────────
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'internal-api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 heure
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // ─────────────────────────────────────────
    // Images (locales et CDN)
    // Stratégie : CacheFirst (les images changent rarement)
    // ─────────────────────────────────────────
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
        },
      },
    },

    // ─────────────────────────────────────────
    // Polices (Google Fonts)
    // Stratégie : CacheFirst
    // ─────────────────────────────────────────
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 an
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },

    // ─────────────────────────────────────────
    // Assets Spotify Embed
    // Stratégie : StaleWhileRevalidate
    // ─────────────────────────────────────────
    {
      urlPattern: /^https:\/\/open\.spotify\.com\/embed\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'spotify-embed-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },

    // ─────────────────────────────────────────
    // Assets statiques Next.js (_next/static)
    // Stratégie : CacheFirst (versionnés par hash)
    // ─────────────────────────────────────────
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-cache',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ],
});

// ═══════════════════════════════════════════
// HEADERS DE SÉCURITÉ
// ═══════════════════════════════════════════

const securityHeaders = [
  // Protection contre le clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Protection contre le MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Contrôle du referrer
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // HSTS (force HTTPS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Permissions Policy (restreint les APIs navigateur)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // XSS Protection (legacy mais utile)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

/**
 * Content Security Policy
 * ⚠️ Ajustez selon vos besoins spécifiques
 */
const cspDirectives = [
  "default-src 'self'",
  // Scripts : self + inline pour les scripts Next.js nécessaires
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles : self + inline pour Tailwind et styled-jsx
  "style-src 'self' 'unsafe-inline'",
  // Images : self + data + APIs externes
  "img-src 'self' data: blob: https://www.metal-archives.com https://cdn.metal-api.dev https://i.scdn.co",
  // Polices
  "font-src 'self' data: https://fonts.gstatic.com",
  // Connexions API
  "connect-src 'self' https://www.metal-api.dev https://*.supabase.co wss://*.supabase.co http://localhost:8000",
  // Frames (Spotify embeds, YouTube)
  "frame-src 'self' https://open.spotify.com https://www.youtube.com",
  // Media
  "media-src 'self' https://open.spotify.com",
  // Workers (PWA)
  "worker-src 'self' blob:",
  // Manifest
  "manifest-src 'self'",
  // Object : aucun
  "object-src 'none'",
  // Base URI
  "base-uri 'self'",
  // Form action
  "form-action 'self'",
  // Upgrade des requêtes HTTP en HTTPS
  "upgrade-insecure-requests",
].join('; ');

// ═══════════════════════════════════════════
// CONFIGURATION PRINCIPALE
// ═══════════════════════════════════════════

const nextConfig = {
  // ─────────────────────────────────────────
  // BASE
  // ─────────────────────────────────────────
  reactStrictMode: true,
  poweredByHeader: false, // Cache le header X-Powered-By

  // Mode standalone pour le déploiement Docker
  // Génère un server.js autonome dans .next/standalone
  output: 'standalone',

  // ─────────────────────────────────────────
  // IMAGES OPTIMISÉES
  // ─────────────────────────────────────────
  images: {
    // Domaines autorisés pour les images externes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.metal-archives.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.metal-api.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify CDN
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net', // Globe textures
        pathname: '/**',
      },
    ],
    // Formats modernes
    formats: ['image/avif', 'image/webp'],
    // Tailles de devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Durée de cache minimale
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  // ─────────────────────────────────────────
  // HEADERS
  // ─────────────────────────────────────────
  async headers() {
    return [
      {
        // Applique les headers de sécurité à toutes les routes
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
      {
        // Cache long pour les assets statiques
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache pour le manifest
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },

  // ─────────────────────────────────────────
  // REDIRECTS
  // ─────────────────────────────────────────
  async redirects() {
    return [
      // Redirection des anciennes URLs si besoin
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/bands/:id',
        destination: '/band/:id',
        permanent: true,
      },
    ];
  },

  // ─────────────────────────────────────────
  // REWRITES (Proxy API)
  // ─────────────────────────────────────────
  async rewrites() {
    return [
      // Proxy vers le ML Service (évite les problèmes CORS)
      {
        source: '/ml-api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },

  // ─────────────────────────────────────────
  // FONCTIONNALITÉS EXPÉRIMENTALES
  // ─────────────────────────────────────────
  experimental: {
    // Partial Prerendering (Next.js 15)
    // Rendu statique + dynamique sur la même page
    ppr: true,

    // Optimisation des imports pour les grosses librairies
    // Réduit significativement la taille du bundle
    optimizePackageImports: [
      'recharts',
      'd3',
      '@tanstack/react-query',
      'lucide-react',
      'vis-timeline',
    ],

    // Actions serveur (formulaires)
    serverActions: {
      bodySizeLimit: '2mb',
    },

    // Logging des fetchs pour debug
    logging: {
      fetches: {
        fullUrl: true,
        hmrRefreshes: true,
      },
    },
  },

  // ─────────────────────────────────────────
  // ROUTES TYPÉES (TypeScript)
  // ─────────────────────────────────────────
  typedRoutes: true,

  // ─────────────────────────────────────────
  // COMPILATION
  // ─────────────────────────────────────────
  compiler: {
    // Supprime les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ─────────────────────────────────────────
  // VARIABLES D'ENVIRONNEMENT EXPOSÉES
  // ─────────────────────────────────────────
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '3.0.0',
  },

  // ─────────────────────────────────────────
  // WEBPACK CUSTOM
  // ─────────────────────────────────────────
  webpack: (config, { isServer, webpack }) => {
    // ─────────────────────────────────────
    // Gestion de vis-timeline (CSS + workers)
    // ─────────────────────────────────────
    config.module.rules.push({
      test: /\.css$/i,
      include: /node_modules\/vis-timeline/,
      use: ['style-loader', 'css-loader'],
    });

    // ─────────────────────────────────────
    // Fallbacks pour les modules Node (client uniquement)
    // ─────────────────────────────────────
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
      };
    }

    // ─────────────────────────────────────
    // Ignore les fichiers de locales inutilisés (moment.js)
    // Réduit la taille du bundle
    // ─────────────────────────────────────
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // ─────────────────────────────────────
    // Exclure les fichiers de tests du bundle
    // ─────────────────────────────────────
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader',
    });

    return config;
  },

  // ─────────────────────────────────────────
  // MODULARISE IGNORÉS (pour builds propres)
  // ─────────────────────────────────────────
  // Ignore les fichiers de dev dans le build production
  eslint: {
    // Attention : ne pas ignorer en CI, seulement en local si besoin
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Échoue le build si erreurs TypeScript (recommandé)
    ignoreBuildErrors: false,
  },

  // ─────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

// ═══════════════════════════════════════════
// EXPORT AVEC LES WRAPPERS
// ═══════════════════════════════════════════

export default withBundleAnalyzer(withPWA(nextConfig));
