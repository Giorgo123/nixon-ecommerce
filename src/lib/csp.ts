// Política CSP sin nonce a propósito: este fork usa `src/proxy.ts` (no
// `middleware.ts`) y las páginas públicas dependen de rendering estático/ISR
// (revalidate = 300). Un nonce requiere rendering dinámico en toda página que
// lo use, lo cual rompería ese ISR; y una implementación mal hecha de nonce en
// Next 16 puede romper la hidratación.
//
// 'unsafe-inline' en script-src es necesario porque GoogleAnalytics.tsx
// (`src/components/analytics/GoogleAnalytics.tsx`) usa un script inline
// (`id="ga4-init"`) para inicializar gtag. No hace falta agregar dominios de
// Mercado Pago a connect-src: toda la integración de MP es fetch server-side
// (rutas /api/checkout/*, /api/mercadopago/*, /api/webhooks/mercadopago) y el
// checkout es una navegación de página completa al dominio de MP, no un fetch
// ni iframe embebido desde el browser.
//
// La política estricta es solo para producción. En `next dev` React necesita
// `eval()` para reconstruir callstacks y mostrar el overlay de errores: sin
// 'unsafe-eval' el browser lo bloquea y quedan rotos el overlay de HMR y las
// warnings de desarrollo. Por eso 'unsafe-eval' se agrega únicamente cuando
// isDev es true, y la política de producción queda intacta.
//
// 'wasm-unsafe-eval' se agrega siempre porque la compresión de video
// (src/lib/video-compression.ts) ejecuta WebAssembly en producción. Chrome y
// Safari bloquean la compilación del wasm con CSP cuando hay script-src y no
// está este token. Es un permiso acotado a WebAssembly: no habilita eval() de
// JavaScript ni requiere 'unsafe-eval' en producción.
//
// media-src autoriza el video de producto: 'self' cubre medios del mismo
// origen, blob: cubre previews locales de archivos y
// https://*.public.blob.vercel-storage.com cubre los videos ya subidos.
export function buildContentSecurityPolicy(isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://vercel.com https://*.public.blob.vercel-storage.com",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ];

  return directives
    .map((directive) => `${directive};`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
