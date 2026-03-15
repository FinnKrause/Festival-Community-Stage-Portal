import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["songreq.finnkrause.com", "192.168.178.81:3000"],
  async redirects() {
    return [{ source: "/", destination: "/songreq", permanent: true }];
  },
};

export default nextConfig;
