import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    output: "standalone",
    allowedDevOrigins: ['42chan.fr'],
};

export default nextConfig;
