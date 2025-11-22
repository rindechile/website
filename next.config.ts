import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add empty turbopack config to acknowledge we're aware of the transition
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude @vercel/og and related packages that don't work with Cloudflare Workers
      config.externals = config.externals || [];
      config.externals.push({
        '@vercel/og': 'commonjs @vercel/og',
        'sharp': 'commonjs sharp',
      });
    }
    return config;
  },
};

export default nextConfig;