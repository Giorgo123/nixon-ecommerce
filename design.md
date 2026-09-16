# Nixon Studio — Sistema de diseño

## Principios
1. **"Nike-UX" con identidad Dark Art.** Paleta oscura editorial (ver tokens abajo), un único acento carmesí para CTAs/badges/foco. La tienda pública (navbar, promo bars, hero, catálogo, PDP, footer) usa la identidad Dark Art; **el admin mantiene su propio tema genérico claro/oscuro**, no la comparte — no mezclar ambos.
2. **Motion con propósito.** `framer-motion` (hoy concentrado en `HeroSection.tsx`): `variants` + `staggerChildren`/`delayChildren` para entrada, `useScroll`/`useTransform` para parallax, `whileHover`/`whileTap` en CTAs, **siempre** gateado por `useReducedMotion()` con fallback estático. Cualquier componente nuevo con animación sigue el mismo patrón, no inventa uno propio.
3. **Contenido de confianza vive en el layout, no en una página aparte.** Cuotas, medios de pago, política de cambios y testimonios están en el home y en el flujo de compra.
4. **Todo texto de marca es verificable o está escrito como opinión/editorial.** No se publican métricas de negocio inventadas (cantidad de clientes, años en el mercado, premios, prensa). Testimonios son contenido de marca (nombre + inicial + ciudad); no llevan insignia de "compra verificada" — esa insignia implicaría una verificación que no existe.

## Tokens (`src/app/globals.css`, bloque `@theme inline`)
Tailwind v4 CSS-first, sin `tailwind.config.*`. Paleta Dark Art expuesta como colores nombrados:

| Token | Valor | Uso |
|---|---|---|
| `nixon-bg` | `#0d0d0d` | fondo base tienda pública |
| `nixon-bg-deep` | `#080808` | fondo más profundo (hero, footer) |
| `nixon-surface` / `nixon-surface-2` | `#141414` / `#1a1a1a` | tarjetas, paneles |
| `nixon-border` | `#262626` | bordes sutiles |
| `nixon-ink` / `nixon-ink-dim` | `#ffffff` / `#f3f4f6` | texto principal / secundario |
| `nixon-muted` | `#9ca3af` | texto terciario |
| `nixon-crimson` / `nixon-crimson-bright` | `#dc2626` / `#ef4444` | acento de marca, CTAs, badges |

**Adopción parcial a propósito**: `navbar`, `footer`, `PromoBar`, `NewsletterForm` ya usan `nixon-*`; Hero, home, PDP y CartDrawer todavía usan clases planas `black`/`white`/`red-*` de Tailwind (mismo resultado visual, previo a la introducción de los tokens). Al tocar un componente existente, preferir migrarlo a `nixon-*` si el cambio ya lo toca de lleno; no forzar una migración masiva no pedida.

Tipografía: Geist Sans / Geist Mono (`next/font/google`), sin fallback genérico.

## Componentes de confianza/marketing ya existentes (no duplicar)
- **`PromoBar`** (`src/components/layout/PromoBar.tsx`): franja fija sobre el navbar, texto estático + rotativo desde `src/lib/constants/commerce-copy.ts`.
- **`TrustBox`** (`src/components/product/TrustBox.tsx`): checklist de confianza en la PDP, mismo archivo de copy.
- **`NewsletterForm`** (`src/components/layout/NewsletterForm.tsx`): ya integrado en el footer, variantes `dark`/`adaptive`.
- **`CrossSell`** (`src/components/product/CrossSell.tsx`): "también te puede gustar" en la PDP.
- **`CartDrawer`**: panel lateral global (montado una vez en `SiteShell`), no por página.
- **`FeaturedProductSlider`** (dentro de `HeroSection`): slider de hasta 3 productos `isFeatured`.

Antes de agregar una sección nueva de "confianza" (value props, banner de envío, etc.), revisar si ya está cubierta por `PromoBar`/`TrustBox`/`commerce-copy.ts` — si ya existe, extenderla ahí en vez de crear una pieza paralela.

## Cuotas y medios de pago (crítico — no hardcodear números)
El copy general ("hasta 6 cuotas sin interés con tarjetas participantes" — corregido de "con todos los bancos", que era una afirmación absoluta poco creíble e inconsistente con el widget real) vive como texto de marketing en `commerce-copy.ts` y es intencionalmente genérico. Para cualquier lugar que muestre un **número o banco concreto**, usar `InstallmentsInfo` (`src/components/payments/InstallmentsInfo.tsx`), que consulta en vivo `/api/mercadopago/installments` (server-side, usa `MERCADOPAGO_ACCESS_TOKEN`, sin SDK — `fetch` directo igual que el resto de la integración de Mercado Pago del proyecto). Si no hay token configurado o la API no responde, el componente muestra un mensaje genérico y verdadero en vez de inventar un banco o un monto. Usado en: `ProductCard` (compacto), PDP (detallado, reemplaza el cálculo estático que había antes), `CheckoutForm` (detallado, sobre el total real post-cupón).

## Estructura del Home (`src/app/page.tsx`)
Hero (con `FeaturedProductSlider` si hay productos `isFeatured`) → **Beneficios** (`ValueProps.tsx`, 4 tiles reusando las mismas frases de `commerce-copy.ts` que ya usan `PromoBar`/`TrustBox` — misma fuente de verdad, presentación visual distinta) → destacados (`ProductGrid`) → CTA a catálogo → **Cuotas reales** (`InstallmentsShowcase.tsx`, mismo `InstallmentsInfo` que la PDP/checkout, con un monto de referencia = precio promedio del catálogo) → **Nuestra marca** (`BrandManifesto.tsx` — el único contenido de "quiénes somos" que existe hoy; `/contacto` es FAQ, no historia de marca) → **Testimonios** (`Testimonials.tsx`) → **Lookbook** (`Lookbook.tsx`, grid de fotos reales de producto que ya están en el catálogo, linkea a `SOCIAL_LINKS.instagram` real). `PromoBar`/`NewsletterForm`/footer llegan transitivamente vía `SiteShell`, no se repiten en `page.tsx`.

## Datos
`src/lib/catalog.ts` lee siempre de Postgres vía Prisma (`where: { active: true }`, incluye `variants` e `images`); no existe ni se usa un JSON de catálogo en esta rama. `revalidate = 300` como respaldo de ISR; el admin dispara `revalidatePath` al crear/editar/borrar un producto.
