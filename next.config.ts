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
    allowedDevOrigins: ['10.119.161.29'],
  },
};

export default nextConfig;
