import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Supabase Storage and Google CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ffzyddpeyllnjuhgghm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Required for Razorpay SDK (Node.js-only module)
  serverExternalPackages: ['razorpay'],
  // Increase body size limit for passport photo uploads (10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
