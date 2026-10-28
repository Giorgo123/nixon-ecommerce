import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/csp";

// CSP sin nonce a propósito: este fork usa `src/proxy.ts` (no `middleware.ts`) y
// las páginas públicas dependen de rendering estático/ISR (revalidate = 300).
// Un nonce requiere rendering dinámico en toda página que lo use, lo cual
// rompería ese ISR; y una implementación mal hecha de nonce en Next 16 puede
// romper la hidratación.
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(isDev),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
