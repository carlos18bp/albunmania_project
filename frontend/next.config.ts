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
    runtimeCaching: [
      {
        // Catálogo del álbum y assets de cromos — stale-while-revalidate
        urlPattern: /\/api\/v1\/albums\/.*/i,
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
    ];
  },
};

export default withPWA(nextConfig);
