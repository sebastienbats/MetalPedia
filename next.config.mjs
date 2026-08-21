import withPWA from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/www\.metal-api\.dev\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'metal-api-cache',
        expiration: { maxEntries: 500, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.metal-archives.com' },
      { protocol: 'https', hostname: 'cdn.metal-api.dev' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    ppr: true,
  },
});

export default withBundleAnalyzer(config);
