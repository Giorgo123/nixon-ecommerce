import type { NextConfig } from "next";

// CSP sin nonce a propósito: este fork usa `src/middleware.ts` (no `proxy.ts`) y
// las páginas públicas dependen de rendering estático/ISR (revalidate = 300).
// Un nonce requiere rendering dinámico en toda página que lo use, lo cual
// rompería ese ISR; y una implementación mal hecha de nonce en Next 16 puede
// romper la hidratación. 'unsafe-inline' en script-src es necesario porque
// GoogleAnalytics.tsx (`src/components/analytics/GoogleAnalytics.tsx`) usa un
// script inline (`id="ga4-init"`) para inicializar gtag. No hace falta agregar
// dominios de Mercado Pago a connect-src: toda la integración de MP es
// fetch server-side (rutas /api/checkout/*, /api/mercadopago/*,
// /api/webhooks/mercadopago) y el checkout es una navegación de página
// completa al dominio de MP, no un fetch ni iframe embebido desde el browser.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com;
  img-src 'self' data: https://*.public.blob.vercel-storage.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
`;

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
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
