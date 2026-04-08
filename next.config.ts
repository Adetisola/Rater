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
};

export default nextConfig;
