import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gyxcdrcdnnzjdmcrwbpr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'mdgvalmvpskltejtsgtl.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
