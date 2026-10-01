import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@smart-campus/contracts",
    "@smart-campus/complaint-intelligence",
    "@smart-campus/lost-and-found",
    "@smart-campus/ui",
    "@smart-campus/utils",
  ],
  reactStrictMode: true,
};

export default nextConfig;
