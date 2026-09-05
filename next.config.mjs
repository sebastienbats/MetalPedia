import withPWAInit from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

// ═══════════════════════════════════════════════════════════
// WRAPPERS DE CONFIGURATION
// ═══════════════════════════════════════════════════════════

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
    {
      urlPattern: /^https:\/\/www\.metal-api\.dev\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'metal-api-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'internal-api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/open\.spotify\.com\/embed\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'spotify-embed-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-cache',
        expiration: { maxEntries: 1000, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
});

// ═══════════════════════════════════════════════════════════
// HEADERS DE SÉCURITÉ
// ═══════════════════════════════════════════════════════════

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

// 🛡️ SOLUTION ULTIME CSP (Conforme web.dev)
const cspDirectives = [
  "default-src 'self'",
  // Autorise les scripts de ton domaine + Vercel (pour les previews SSO)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.com https://*.vercel.app",
  "style-src 'self' 'unsafe-inline'",
  // 🌍 CRITIQUE CARTE : Autorise les CDN de textures 3D + tes domaines d'images
  "img-src 'self' data: blob: https://www.metal-archives.com https://cdn.metal-api.dev https://i.scdn.co https://*.scdn.co https://cdn.jsdelivr.net https://unpkg.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Autorise les connexions réseau vers tes APIs + les CDN de ressources + Vercel
  "connect-src 'self' https://www.metal-api.dev https://*.supabase.co wss://*.supabase.co https://api.songkick.com https://cdn.jsdelivr.net https://unpkg.com https://vercel.com https://*.vercel.app",
  "frame-src 'self' https://open.spotify.com https://www.youtube.com https://vercel.com https://*.vercel.app",
  "media-src 'self' https://open.spotify.com https://*.scdn.co",
  "worker-src 'self' blob:",
  // 📜 CRITIQUE MANIFESTE : Autorise le manifeste de ton domaine + celui de Vercel SSO
  "manifest-src 'self' https://vercel.com https://*.vercel.app",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION PRINCIPALE
// ═══════════════════════════════════════════════════════════

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.metal-archives.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.metal-api.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'i.scdn.co', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

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
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/bands/:id', destination: '/band/:id', permanent: true },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/ml-api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },

  // ═══════════════════════════════════════════════════════════
  // EXPERIMENTAL (uniquement features stables de Next.js 15.1.x)
  // ═══════════════════════════════════════════════════════════
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'recharts',
      'd3',
      '@tanstack/react-query',
      'vis-timeline',
      'cmdk',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '3.0.0',
  },

  // ═══════════════════════════════════════════════════════════
  // WEBPACK CUSTOM (SIMPLIFIÉ)
  // ═══════════════════════════════════════════════════════════
  webpack: (config, { isServer, webpack }) => {
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

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    return config;
  },

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

export default withBundleAnalyzer(withPWA(nextConfig));
