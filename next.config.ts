import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.105.116.29'],
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'plus.unsplash.com' },
      { hostname: 'image.pollinations.ai' },
      { hostname: 'i.pravatar.cc' },
      { hostname: 'api.dicebear.com' },
      { hostname: 'img.icons8.com' },
      { hostname: 'lottie.host' },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy /app/* → clean routes (permanent 308 redirects)
      { source: '/app', destination: '/browse', permanent: true },
      { source: '/app/browse', destination: '/browse', permanent: true },
      { source: '/app/submit', destination: '/submit', permanent: true },
      { source: '/app/post/:id', destination: '/post/:id', permanent: true },
      { source: '/app/avatar/:username', destination: '/@:username', permanent: true },
      { source: '/app/avatar', destination: '/browse', permanent: true },
    ];
  },
};

export default nextConfig;
