import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["**."],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.nintendo.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
