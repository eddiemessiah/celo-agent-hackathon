import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@hack/celo-pay", "@hack/game-kit"],
};

export default nextConfig;
