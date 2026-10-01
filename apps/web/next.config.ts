import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@smart-campus/contracts",
    "@smart-campus/complaint-intelligence",
    "@smart-campus/ui",
    "@smart-campus/utils",
  ],
  reactStrictMode: true,
};

export default nextConfig;
