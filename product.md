# Nixon Studio — Producto

## Qué es
Ecommerce de indumentaria streetwear/dark-art (remeras, buzos, posters de aluminio, tazas) vendido directo al consumidor desde Villa María, Córdoba (Argentina), con checkout vía Mercado Pago Checkout Pro o transferencia bancaria, envío gratis a todo el país y retiro en local.

## Propuesta de valor
- **Diseños con identidad**: estética dark art / streetwear "Nike-UX", no básicos genéricos.
- **Calidad de prenda**: algodón peinado 24/1 alto gramaje, estampa serigráfica de alta densidad.
- **Compra sin fricción**: catálogo → carrito → Mercado Pago o transferencia → confirmación, sin crear cuenta.
- **Cuotas reales**: la info de cuotas sin interés que se muestra en tarjeta de producto, ficha de producto y checkout se consulta en vivo contra la API de Mercado Pago (`/api/mercadopago/installments`) — no es un número fijo calculado a mano. Ver `design.md` § Cuotas.
- **Envío gratis a todo el país**, retiro sin cargo en Villa María.

## Catálogo y stock
Categorías: `remera`, `buzo`, `taza`, `poster` (`oversize` es legado, alias de `remera` — ver `normalizeCategory()` en `src/lib/categories.ts`). Fuente de verdad: `Product` en Postgres vía Prisma (`src/lib/catalog.ts`, sin fallback a JSON — la DB es la única fuente), administrado desde `/admin/products`.

- **Variantes**: cada `Product` tiene `ProductVariant[]` (talle + color opcionales, stock por variante — `@@unique([productId, size, color])`). El precio vive en `Product`, no en la variante.
- **Galería**: `Product.image` es la portada; `Product.images[]` (`ProductImage`) son fotos adicionales; `Product.videoUrl` opcional.
- **"A pedido"**: el modelo permite vender sin stock real (stock informativo, nunca bloquea el agregado al carrito — ver comentarios en `ProductActions.tsx`). Sin stock se muestra "A pedido", no "Agotado".
- Nota de catálogo: parte del arte usa referencias de personajes de terceros (manga/anime) como fan art autorizado — decisión de negocio ya tomada por el equipo.

## Checkout y pagos
- **Mercado Pago Checkout Pro**: preferencia creada server-side (`/api/checkout/preference`, rate-limited) con los items reales del carrito, vía `fetch` directo a la API REST de Mercado Pago (no se usa el SDK oficial en este proyecto).
- **Transferencia bancaria** (`/api/checkout/transfer`): medio alternativo, con descuento especial mencionado en el precio de producto; no interactúa con Mercado Pago.
- **Cupones**: `Coupon` (porcentaje o fijo), validados en `/api/coupons/validate`, aplicados sobre el subtotal en `createPendingOrder` (server-side, atómico). El total real de una compra es siempre `subtotal - discountAmount`, nunca el subtotal solo — cualquier cálculo de cuotas debe usar ese total real, no el subtotal bruto.
- El estado del pedido se actualiza por webhook (`/api/webhooks/mercadopago`), **validado por firma HMAC** (`x-signature`/`x-request-id`, ya implementado en `isValidWebhookSignature`) — no por el retorno del browser.
- Acceso a `/success` y a `GET /api/orders/[id]` sin sesión admin: solo con un token HMAC por-orden (`src/lib/order-token.ts`), minteado al crear la preferencia/transferencia.

## Panel admin
`/admin` (protegido por `proxy.ts` + sesión JWT firmada — `src/lib/session-token.ts`, `jose`): login con rate-limit + bcrypt contra la tabla `Admin`, dashboard, CRUD de productos (con variantes, galería, subida a Vercel Blob), pedidos (cambio de estado, tracking), cupones.

## Fuera de alcance (a propósito, por ahora)
- Cuentas de cliente / historial de pedidos por usuario (el acceso a `/success` es por token de orden, no por cuenta).
- Multi-moneda / venta fuera de Argentina.
- Reviews de producto verificadas con moderación (los testimonios del home son contenido editorial de marca, no un sistema de reseñas de compradores).
