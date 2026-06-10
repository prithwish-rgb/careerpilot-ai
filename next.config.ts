import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pdf-parse", "mammoth"],
  eslint: { ignoreDuringBuilds: true },
  experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
export default nextConfig;
