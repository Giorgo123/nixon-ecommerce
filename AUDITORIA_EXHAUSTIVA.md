# Auditoría exhaustiva — sesión `redesign-nixon-studio`

Generada el 2026-09-17. Metodología: **cero confianza en resúmenes previos ni en BACKLOG.md**. Cada fila se valida solo con `git show <hash>` ejecutado en este momento contra el repo real. Rama base de comparación: `c4c6b93` (tip de `origin/master` antes de que arrancara esta sesión).

## Tabla — una fila por tarea pedida en la sesión

| # | Tarea pedida | Commit | Diff real (resumen verificado por stat, no por descripción) | Estado |
|---|---|---|---|---|
| 1 | Rediseño completo del home + cuotas reales de MP + refuerzo del flujo de compra (Fases A-F del plan inicial) | `b17f143` | 22 archivos, +958/-106. Crea `InstallmentsInfo.tsx` (widget que consulta `/api/mercadopago/installments` en vivo), `src/app/api/mercadopago/installments/route.ts` (133 líneas), `ValueProps.tsx`, `Testimonials.tsx`, `BrandManifesto.tsx`, `InstallmentsShowcase.tsx`, `Lookbook.tsx`; corrige copy "con todos los bancos"→"con tarjetas participantes"; migra `middleware.ts`→`proxy.ts`; agrega `product.md`/`design.md`; +220 líneas de tests en `order.test.ts`. | **IMPLEMENTADO** |
| 2 | Exclusión configurable de medios de pago en Checkout Pro | `b612e37` | +29/-0 en 2 archivos. Nuevo `src/lib/constants/payment-methods.ts` con `EXCLUDED_PAYMENT_TYPES`/`EXCLUDED_PAYMENT_METHODS` (vacíos por defecto); `preference/route.ts` solo manda `payment_methods` a MP si alguna lista tiene elementos. | **IMPLEMENTADO** (requiere `MERCADOPAGO_ACCESS_TOKEN` real para verificar que MP respeta la exclusión end-to-end — no verificable desde este entorno) |
| 3 | Botón "Confirmar transferencia recibida" en admin/pedidos | `b822747` | +18/-1 en 2 archivos. `OrderStatusActions` recibe `paymentMethod` como prop; botón dedicado visible solo si `paymentMethod === "transfer" && currentStatus === "pending_transfer"`, reusa `updateStatus("paid")`. | **IMPLEMENTADO** |
| 4 | Filtro por medio de pago en admin/pedidos | `141746e` | +61/-7 en 2 archivos. Query param `?paymentMethod=`, `where` condicional en `prisma.order.findMany`/`count`, tabs Todos/Mercado Pago/Transferencia, `Pagination.tsx` extendido para preservar el filtro entre páginas. | **IMPLEMENTADO** |
| 5 | Sacar el link visible a /admin del navbar público | `f8326f4` | -24/-0 (solo borrado) en `navbar.tsx`. Elimina el `<Link href="/admin/login">` + ícono de candado en desktop y mobile, y el componente `LockIcon` sin uso. | **IMPLEMENTADO** |
| 6 | Banner de 3 fotos con revelación deslizante en el home | `7c6c5d5` | +134/-0 en 2 archivos. Nuevo `ProductRevealBanner.tsx` (124 líneas): 3 fotos reales de `Product.image`, entrada alternada `x: -96/96 → 0` con `staggerChildren`, `whileInView`, fallback estático con `useReducedMotion`. | **IMPLEMENTADO** |
| 7 | Header auto-hide al scrollear | `eb15b89` | +44/-4 en `navbar.tsx`. `motion.header` + `useScroll`/`useMotionValueEvent`, `translateY` 0%/-100% según dirección, umbral de 4px anti-jitter, no oculta cerca del tope, siempre visible con `useReducedMotion`. | **IMPLEMENTADO** |
| 8 | ProductCard: hover con foto de galería real, sin zoom | `ba7c892` | +15/-1 en `ProductCard.tsx`. Reemplaza `scale-110` por crossfade `opacity` entre portada y `product.images[0]`; sin galería, la portada queda estática. | **IMPLEMENTADO** |
| 9 | Mejorar calidad/variedad del Lookbook | `a7c25cc` | +56/-6 en `Lookbook.tsx`. Nueva `collectLookbookPhotos()`: prioriza portadas únicas, completa con `images[0]` antes de repetir; corrige `sizes` de `16vw` a `380px` (estaba sirviendo imágenes pixeladas). | **IMPLEMENTADO** |
| 10 | Nuevas secciones del home + motion en secciones existentes | `1bb20cb` | +243/-22 en 6 archivos. Nueva `HowItWorks.tsx` (90 líneas, 3 pasos del flujo real); `whileInView`+`fadeUp`/`staggerContainer` agregado a `ValueProps`, `InstallmentsShowcase`, `BrandManifesto`, `Lookbook`. | **IMPLEMENTADO** |
| 11 | Botón flotante de WhatsApp | `aac4486` | +34/-0 en 2 archivos. Nuevo `WhatsappButton.tsx` fijo, usa `getWhatsappUrl()` real de `constants/social.ts`, montado en `SiteShell` (z-50, entre navbar z-40 y CartDrawer z-60). | **IMPLEMENTADO** |
| 12 | Corregir copy de cuotas/transferencia contra el código real + efecto cinta | `695de07` | +37/-5 en 2 archivos. Saca "con todos los bancos" (afirmación absoluta) y "descuento especial por transferencia" (no existe en `order.ts` — verificado por grep antes del commit); `PromoBar` gana marquee infinito con `aria-hidden`+`sr-only`, estático si reduced-motion. | **IMPLEMENTADO** |
| 13 | Forzar tema oscuro en toda la tienda pública (admin mantiene su tema propio) | `45de896` | +16/-5 en 2 archivos. `@custom-variant dark (&:where(.dark, .dark *))` en `globals.css`; `SiteShell` envuelve la tienda pública (no admin) en `div.dark`. | **IMPLEMENTADO** |
| 14 | Navbar: dropdown "Catálogo" con categorías + filtro real por URL | `2870534` | +121/-11 en 2 archivos. Dropdown accesible (`aria-expanded`, cierra con Escape/click-afuera) con las 4 categorías + "Ver todo"; `ProductCatalog.tsx` lee `?category=` como estado inicial. | **IMPLEMENTADO** |
| 15 | Diagnóstico de llamadas duplicadas a `/api/mercadopago/installments` | `971f959` | +41/-5 en `InstallmentsInfo.tsx`. `Map` a nivel de módulo memoiza la promesa fetch por `amount` redondeado (TTL 5 min), para que N `ProductCard` con el mismo precio compartan un solo request. | **IMPLEMENTADO** (el diagnóstico encontró el problema real y se corrigió, no quedó solo como hallazgo) |
| 16 | Quick-add en ProductCard debe mostrar el talle | `0ac5721` | +9/-1 en `ProductCard.tsx`. Si `variants.length > 1`, el botón pasa de "Agregar al carrito" a `Agregar (Talle X)`. | **IMPLEMENTADO** |
| 17 | Auditoría de compra: success más preciso, alt real en galería, foco del CartDrawer | `3792ca6` | +38/-3 en 3 archivos. `success/page.tsx` ya no afirma "tu pago fue procesado" sin verificar; `ProductGallery` thumbnails con alt descriptivo; `CartDrawer` mueve foco al abrir/cerrar. | **IMPLEMENTADO** |
| 18 | Auditoría senior de percepción de marca (404, empty state carrito, success) | `ab09d7b` | +66/-33 en 3 archivos. `not-found.tsx` rediseñado con CTA; `CartSummary.tsx` empty-state con CTA a catálogo (antes seguía mostrando Subtotal/Envío/Total en $0 con carrito vacío — corregido con `{items.length > 0 && (...)}`); `success/page.tsx` distingue "link vencido" de "checkout en curso". | **IMPLEMENTADO** |
| 19 | Auditoría de seguridad completa | `c765b68` | 10 archivos, +286/-210 (incluye `package-lock.json`, ruido de versión). RCE crítica parcheada (Next 16.3.0→16.3.5, GHSA-p293-qw3h-jr36); `order.ts` valida `quantity`/`variantId` (+3 tests); `rate-limit.ts` lee el ÚLTIMO valor de X-Forwarded-For, no el primero (spoofeable); `safeJsonLd()` escapa `<` contra XSS en JSON-LD; headers de seguridad + CSP mínimo en `next.config.ts`. | **IMPLEMENTADO** |
| 20 | Timeout en llamada a MP + fail-closed en token de orden | `eafc2c4` | +57/-30 en 2 archivos. `fetch` a MP con `signal: AbortSignal.timeout(15_000)`, 502 claro en vez de colgar; `GET /api/orders/[id]` envuelve la verificación de sesión/token en try/catch, falla a 401 en vez de 500 sin manejar. | **IMPLEMENTADO** |
| 21 | Test real de expiración de sesión admin (no solo por diseño) | `06651f0` | +44/-0. Nuevo `session-token.test.ts`: token recién creado verifica `true`; token vencido firmado manualmente con `jose` verifica `false`; token con secret distinto verifica `false`; token `undefined` verifica `false`. Requirió `// @vitest-environment node` (jsdom rompe `jose` por `TextEncoder` de otro realm). | **IMPLEMENTADO** |
| 22 | CSP completo (script-src/connect-src/img-src/style-src/font-src) | `995a162` | +36/-0 en `next.config.ts` (base commit compartido con `c765b68`, mergeados en `043fcf9` — el archivo final combina ambos). `script-src` con `unsafe-inline` justificado por el script inline de GA4; sin dominios de MP en `connect-src` (integración 100% server-side, verificado por grep). | **IMPLEMENTADO** |
| 23 | Survey inicial del repo (estado, deuda técnica, riesgos) | — | Sin commit — tarea de investigación pura, resultado fue análisis conversacional que alimentó el plan de las Fases A-F, no código. | **NO IMPLEMENTADO** (no aplica: tarea de investigación, no de código) |
| 24 | Explore: research de home/marketing (competencia, patrones) | — | Sin commit. | **NO IMPLEMENTADO** (no aplica: investigación) |
| 25 | Explore: research de producto/checkout/carrito | — | Sin commit. | **NO IMPLEMENTADO** (no aplica: investigación) |
| 26 | Explore: research de admin/auth/legal/SEO | — | Sin commit. | **NO IMPLEMENTADO** (no aplica: investigación) |
| 27 | Propuesta de navegación (no implementar, solo proponer) | — | Sin commit — se pidió explícitamente "NO implementar, esperar aprobación". | **NO IMPLEMENTADO** (correcto: instrucción explícita de no implementar) |
| — | QA integral + benchmark mundial (research, no implementar) | — | Sin commit, mismo motivo que la fila anterior. | **NO IMPLEMENTADO** (correcto: instrucción explícita de no implementar) |
| — | Diagnóstico de instalments API (ver fila 15) | `971f959` | Ya contabilizado arriba — el diagnóstico derivó en un fix real, no quedó como hallazgo sin acción. | **IMPLEMENTADO** (ver #15) |

Verificación cruzada de las filas "sin commit": `git log --oneline c4c6b93..HEAD --grep="survey|explor|propuesta|diagnóstic|QA integral|navegaci" -i` no devuelve ningún commit real de código para esas tareas (los 3 matches que trae son falsos positivos de otras palabras). Confirmado: no hay ningún commit oculto o no reportado para las tareas de investigación.

## Marcadores de merge sin resolver

```
grep -rn "^<<<<<<<\|^=======$\|^>>>>>>>" src *.md
```
**Sin resultados.** No quedó ningún conflicto de merge sin resolver en el árbol de trabajo.

## Los 4 checks, corridos desde cero en este momento

Se mataron 3 procesos `node.exe` residuales de `nixon-ecommerce` (dev server viejo) antes de correr los checks, para evitar el OOM conocido en este entorno Windows.

### `npm run lint`
```
> nixon-ecommerce@0.1.0 lint
> eslint
```
Sin errores ni warnings. **Limpio.**

### `npx tsc --noEmit`
Sin salida (0 errores). **Limpio.**

### `npx vitest run --no-file-parallelism`
```
 Test Files  11 passed (11)
      Tests  113 passed (113)
   Start at  15:25:30
   Duration  21.11s
```
**113/113 tests pasan.**

### `npm run build`
```
▲ Next.js 16.3.5 (Turbopack)
✓ Compiled successfully in 5.3s
  Running TypeScript ...
  Finished TypeScript in 4.1s ...
✓ Generating static pages using 7 workers (50/50) in 13.9s
```
50 páginas generadas, sin errores. Rutas API, admin y checkout marcadas `ƒ` (dinámicas) correctamente; home/catálogo/PDP marcadas `○`/`●` (estático/SSG) con `revalidate: 5m`, consistente con lo documentado en `design.md`. **Build limpio.**

## Cruce contra BACKLOG.md — inconsistencias

Se revisaron los 21 ítems ✅ de BACKLOG.md (excluyendo los 4 ítems 6-9 marcados ⏳, que el propio BACKLOG ya declara como pendientes de verificación en vivo, no como hechos). **Ninguno de los 21 ítems ✅ resultó "NO IMPLEMENTADO" en esta auditoría** — cada uno tiene un commit real con contenido que coincide con su descripción en BACKLOG.md. No se encontró ninguna inconsistencia grave.

Una aclaración menor, no una inconsistencia: BACKLOG.md numera sus ítems 1-27 con su propio criterio (algunos ítems del BACKLOG, como el 1 "Cuotas reales en el carrito" y el 2 "JSON-LD de Organization/WebSite", quedaron dentro del commit grande inicial `b17f143` en vez de tener un commit dedicado) — esto es coherente con cómo se trabajó, no una omisión.

## Qué queda genuinamente pendiente

1. **Ítems 6-9 del BACKLOG (⏳, ya marcados como no-hechos por el propio backlog):** pago real con tarjeta/dinero en cuenta/efectivo contra credenciales de test de MP; confirmación de que el webhook de MP llega con firma válida contra un deploy público; confirmación de entrega real de email en producción; comparación de cuotas mostradas vs. cuotas efectivamente cobradas. Ninguno es ejecutable desde este entorno (requieren navegador, cuenta de MP real y el deploy público) — son tareas para el usuario, con la app ya desplegada.
2. **Verificación end-to-end de la exclusión de medios de pago (#2 de la tabla):** el código es real y los tests pasan, pero con las listas vacías por defecto no hay comportamiento nuevo que un test automatizado pueda verificar contra la cuenta real de MP.
3. **Merge a `master`:** sigue explícitamente pausado a la espera de confirmación, tal como se acordó ("mergeamos cuando hayamos terminado todo").
4. No se encontró ningún commit fantasma, ningún ítem de BACKLOG inflado, ningún conflicto de merge sin resolver, y los 4 checks corren limpios desde cero en este momento — el estado del código en `redesign-nixon-studio` es el que los commits dicen que es.
