import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'i.pravatar.cc' },
      { hostname: 'api.dicebear.com' },
      { hostname: 'img.icons8.com' },
      { hostname: 'lottie.host' },
    ],
    unoptimized: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
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
