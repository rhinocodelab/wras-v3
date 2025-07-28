import type {NextConfig} from 'next';
import { join } from 'path';
require('dotenv').config({ path: './.env.local' });

// Set Google credentials path
process.env.GOOGLE_APPLICATION_CREDENTIALS = join(process.cwd(), 'config', 'isl.json');

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
};

export default nextConfig;
