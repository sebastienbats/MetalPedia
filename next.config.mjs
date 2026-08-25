import withPWAInit from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

// ═══════════════════════════════════════════
// WRAPPERS DE CONFIGURATION
// ═══════════════════════════════════════════

/**
 * Bundle Analyzer
 * Activé via : ANALYZE=true npm run build
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * PWA (Progressive Web App)
 * Désactivé en dev pour éviter les conflits de cache
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
    // API Metal (metal-api.dev) - StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/www\.metal-api\.dev\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'metal-api-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 24 * 60 * 60, // 24h
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // API interne - NetworkFirst
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'internal-api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1h
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // Images - CacheFirst
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

    // Google Fonts - CacheFirst
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 an
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },

    // Spotify Embeds - StaleWhileRevalidate
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
  ],
});

// ═══════════════════════════════════════════
// HEADERS DE SÉCURITÉ
// ═══════════════════════════════════════════

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.metal-archives.com https://cdn.metal-api.dev https://i.scdn.co https://cdn.jsdelivr.net",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://www.metal-api.dev https://*.supabase.co wss://*.supabase.co http://localhost:8000 https://*.up.railway.app",
  "frame-src 'self' https://open.spotify.com https://www.youtube.com",
  "media-src 'self' https://open.spotify.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

// ═══════════════════════════════════════════
// CONFIGURATION PRINCIPALE
// ═══════════════════════════════════════════

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // ⚠️ PAS de output: 'standalone' sur Vercel
  // Vercel détecte automatiquement Next.js
  // Le standalone est uniquement pour Docker/self-hosting

  // ─────────────────────────────────────────
  // IMAGES OPTIMISÉES
  // ─────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.metal-archives.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.metal-api.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'i.scdn.co', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  // ─────────────────────────────────────────
  // HEADERS
  // ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },

  // ─────────────────────────────────────────
  // REDIRECTS
  // ─────────────────────────────────────────
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/bands/:id', destination: '/band/:id', permanent: true },
    ];
  },

  // ─────────────────────────────────────────
  // REWRITES (Proxy ML Service)
  // ─────────────────────────────────────────
  async rewrites() {
    return [
      {
        source: '/ml-api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },

  // ─────────────────────────────────────────
  // EXPERIMENTAL (features stables uniquement)
  // ─────────────────────────────────────────
  experimental: {
    // ❌ PPR retiré (nécessite next@canary)
    // ❌ typedRoutes retiré (pas dans 15.1.4 stable)
    // ❌ logging retiré (pas une option de experimental)
    
    // ✅ serverActions
    serverActions: {
      bodySizeLimit: '2mb',
    },

    // ✅ optimizePackageImports
    optimizePackageImports: [
      'recharts',
      'd3',
      '@tanstack/react-query',
      'vis-timeline',
    ],
  },

  // ─────────────────────────────────────────
  // COMPILATION
  // ─────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // ─────────────────────────────────────────
  // VARIABLES D'ENVIRONNEMENT
  // ─────────────────────────────────────────
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '3.0.0',
  },

  // ─────────────────────────────────────────
  // WEBPACK CUSTOM
  // ─────────────────────────────────────────
  webpack: (config, { isServer, webpack }) => {
    // Support vis-timeline CSS
    config.module.rules.push({
      test: /\.css$/i,
      include: /node_modules\/vis-timeline/,
      use: ['style-loader', 'css-loader'],
    });

    // Fallbacks pour modules Node côté client
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

    // Ignorer les locales moment.js
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    return config;
  },

  // ─────────────────────────────────────────
  // VALIDATIONS
  // ─────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

// ═══════════════════════════════════════════
// EXPORT AVEC WRAPPERS
// ═══════════════════════════════════════════

export default withBundleAnalyzer(withPWA(nextConfig));
