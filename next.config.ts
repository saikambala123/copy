import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    // Turbopack's persistent filesystem cache corrupts on this container's
    // overlayfs ("Invalid argument (os error 22)" panics) — disable it.
    turbopackFileSystemCacheForDev: false,
  },
  // Allow the sandbox preview proxy origin to load /_next/* assets.
  allowedDevOrigins: ["preview-chat-80662134-ffc9-412b-ba3b-4e65b2f62b74.space-z.ai"],
};

export default nextConfig;
