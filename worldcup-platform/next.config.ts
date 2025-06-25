import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stable configuration to prevent server issues
  experimental: {
    turbo: undefined, // Disable turbopack for stability
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
