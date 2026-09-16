import type { NextConfig } from "next";

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
          // frame-ancestors/object-src/base-uri: sin riesgo de romper nada (no
          // tocan qué carga el sitio, solo quién puede embeberlo y bloquean
          // vectores clásicos de inyección). Un CSP completo con allowlist de
          // script-src/connect-src (GA4, Mercado Pago) queda pendiente en
          // BACKLOG.md — hace falta probarlo contra el checkout real antes de
          // desplegarlo, un CSP mal armado puede romper el pago en silencio.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
