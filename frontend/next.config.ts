import type { NextConfig } from 'next';

// next-pwa is added in fase A6 but not installed yet in this commit.
// We require it dynamically and noop in development so 'next dev' keeps
// working without a real install. Once `npm install` is run, the SW will
// register on production builds.
let withPWA: <T extends NextConfig>(c: T) => T = (c) => c;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pwa = require('next-pwa');
  withPWA = pwa({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    // Pull the Web Push listeners (push / notificationclick) into the
    // Workbox-generated sw.js. Keeping them in a separate file means
    // `npm run build` never clobbers the push logic — sw.js owns
    // caching, sw-push.js owns notifications. See public/sw-push.js.
    importScripts: ['/sw-push.js'],
    runtimeCaching: [
      {
        // Catálogo del álbum y assets de cromos — stale-while-revalidate.
        // The API lives at /api/albums/ (no /v1/ prefix).
        urlPattern: /\/api\/albums\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'albunmania-catalog', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 } },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/i,
        handler: 'CacheFirst',
        options: { cacheName: 'albunmania-images', expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
    ],
  });
} catch {
  // next-pwa not installed yet — keep config untouched.
}

const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:8000').replace(/\/$/, '');
let backendRemotePattern: { protocol: 'http' | 'https'; hostname: string; port?: string; pathname: string } | null = null;

try {
  const url = new URL(backendOrigin);
  backendRemotePattern = {
    protocol: (url.protocol.replace(':', '') as 'http' | 'https') || 'http',
    hostname: url.hostname,
    port: url.port || undefined,
    pathname: '/media/**',
  };
} catch {
  backendRemotePattern = null;
}

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/media/**',
      },
      ...(backendRemotePattern ? [backendRemotePattern] : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*/`,
      },
      {
        source: '/media/:path*',
        destination: `${backendOrigin}/media/:path*`,
      },
      // Proxy Django admin so http://localhost:4200/admin/ opens the
      // backend admin (instead of the Next.js panel, which lives at
      // /admin-panel). Trailing slash on the destination matches the
      // pattern used for /api/ — Django expects canonical /admin/<x>/
      // URLs and would otherwise loop-redirect. The /static/admin/
      // assets are served by Django's own admin static handler in DEBUG.
      { source: '/admin', destination: `${backendOrigin}/admin/` },
      { source: '/admin/:path*', destination: `${backendOrigin}/admin/:path*/` },
      { source: '/static/admin/:path*', destination: `${backendOrigin}/static/admin/:path*` },
    ];
  },
};

export default withPWA(nextConfig);
