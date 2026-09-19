# Nixon Studio — Backlog técnico/producto

Pendientes evaluados y confirmados como mejoras reales (no relleno). Cada uno queda documentado con el motivo, aunque ya esté resuelto, para tener el historial de decisiones.

## ✅ 1. Cuotas reales también en el carrito/CartDrawer — hecho
`InstallmentsInfo` (compact) agregado en `CartSummary.tsx`, sobre el total, antes de los botones de acción. Se ve tanto en `/cart` como en el `CartDrawer` (mismo componente).

## ✅ 2. JSON-LD de Organization/WebSite — hecho
Agregado en `src/app/layout.tsx`: `Organization` (nombre, logo, `sameAs` con las redes reales de `SOCIAL_LINKS`) y `WebSite` con `SearchAction` apuntando a `/products?search=`. Sin datos inventados — solo lo que ya existía en `constants/social.ts`.

## ✅ 3. Exclusión configurable de medios de pago en Mercado Pago Checkout Pro — hecho
**Por qué sumaba**: la preference de MP no restringía ningún medio de pago — todo lo que la cuenta tuviera habilitado (tarjetas, dinero en cuenta, efectivo en puntos de pago) se ofrecía sin poder desactivar nada puntual desde el código.
Nuevo `src/lib/constants/payment-methods.ts` con `EXCLUDED_PAYMENT_TYPES`/`EXCLUDED_PAYMENT_METHODS` (vacías por defecto = mismo comportamiento de siempre). `preference/route.ts` solo manda `payment_methods` a Mercado Pago si alguna lista tiene contenido. Verificado por código/tests; falta confirmar con `MERCADOPAGO_ACCESS_TOKEN` real que MP respeta una exclusión configurada.

## ✅ 4. Botón "Confirmar transferencia recibida" en /admin/pedidos — hecho
**Por qué sumaba**: la confirmación de una transferencia usaba el mismo botón genérico "Pagada" que cualquier pedido, sin distinguir el caso puntual.
`OrderStatusActions` ahora recibe `paymentMethod` y muestra un botón dedicado cuando `paymentMethod === "transfer"` y `currentStatus === "pending_transfer"` — reusa la misma función `updateStatus("paid")` existente, no duplica lógica.

## ✅ 5. Filtro por medio de pago en /admin/pedidos — hecho
**Por qué sumaba**: no había forma de ver solo los pedidos de un medio de pago puntual (ej. priorizar transferencias pendientes, que necesitan acción manual).
Filtro `?paymentMethod=` (Todos/Mercado Pago/Transferencia) server-side sobre `prisma.order.findMany`/`count`, con tabs en la UI. `Pagination.tsx` ahora acepta `queryParams` opcional para preservar el filtro al cambiar de página. Verificado por código/tests; falta ver el filtro funcionando con pedidos reales de ambos medios de pago en una DB con datos.

## ✅ 11. Auditoría de seguridad — hecho
RCE crítica no autenticada en Next.js (16.3.0 → 16.3.5), `quantity` del carrito sin validar (permitía inflar stock y armar un total negativo con un número negativo), `X-Forwarded-For` spoofeable en el rate-limit (tomaba el primer valor, el cliente puede mandarlo; ahora toma el último, el que agrega el proxy real), XSS en JSON-LD (`</script>` en nombre/descripción de producto rompía el tag — ahora se escapa), headers de seguridad ausentes (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP mínimo). Riesgo aceptado: 8 vulnerabilidades restantes de `npm audit` son todas de herramientas de dev/build (vitest, browserslist, js-yaml, prisma CLI) que nunca corren contra tráfico real — el único fix automático de esa cadena bajaría `prisma` de 6.19.3 a 6.12.0 (downgrade), no se aplica sin evaluarlo aparte. CSP completo (allowlist de `script-src`/`connect-src`) queda pendiente — ver ítem 21 más abajo.

## ✅ 12. Banner de 3 fotos con revelación deslizante — hecho
Nuevo `ProductRevealBanner.tsx` (fotos reales de producto, no destacadas para no repetir lo ya visto en "Destacados"), mismo patrón de motion que `HeroSection.tsx` adaptado con `x` en vez de `y`. Ubicado entre "Destacados" y "Cómo comprar".

## ✅ 13. Header auto-hide al scrollear — hecho
El `<header>` del navbar se oculta/reaparece según dirección de scroll; el `PromoBar` sticky arriba queda siempre fijo, sin que el auto-hide lo tape.

## ✅ 14. Diagnóstico de llamadas a /api/mercadopago/installments — hecho, sin hallazgos
"N tarjetas → N fetches con distinto `amount`" es el comportamiento esperado (cada `InstallmentsInfo` cotiza su propio monto); el `useEffect` depende de un número primitivo derivado (`Math.round(amount)`), no de una referencia que cambie en cada render — no hay duplicación real. No se tocó código.

## ✅ 15. Sacar links visibles a /admin del sitio público — hecho
Ícono de candado (desktop y mobile) removido de `navbar.tsx`. El acceso admin sigue funcionando igual por URL directa — sin cambios en `proxy.ts`/JWT/rate-limit/bcrypt.

## ✅ 16. Hover en ProductCard usa foto de galería real — hecho
Si `product.images.length > 0`, el hover hace crossfade a `product.images[0]` (sin zoom); si no hay galería, la portada queda estática sin efecto.

## ✅ 17. Calidad visual del Lookbook — hecho
`collectLookbookPhotos()` evita fotos de portada repetidas completando con `product.images[0]` cuando hace falta variedad; `sizes` corregido (subestimaba el ancho real de la celda, servía una imagen más chica de lo renderizado).

## ✅ 18. Motion en secciones del home + nueva sección "Cómo comprar" — hecho
`ValueProps`, `InstallmentsShowcase`, `BrandManifesto`, `Lookbook` ahora animan al entrar en viewport (mismo patrón `fadeUp`/`staggerContainer`). Nueva `HowItWorks.tsx`: 3 pasos reales del flujo de compra, copy verificable, no duplica `PromoBar`/`TrustBox`/`ValueProps`.

## ✅ 19. Botón flotante de WhatsApp — hecho
Fijo, esquina inferior derecha, usa el número real ya existente en `constants/social.ts` (`getWhatsappUrl()`), montado en `SiteShell` junto a `CartDrawer`.

## ✅ 20. Copy del PromoBar corregido contra el código real + efecto cinta — hecho
"Hasta 6 cuotas... con todos los bancos" y "descuento especial por transferencia" no tenían respaldo real en el código (el máximo de cuotas lo decide MP en vivo y varía; no existe ningún descuento automático por transferencia en `order.ts`) — copy corregido para no prometer lo que no se cumple, en vez de inventar un descuento sin que el negocio lo haya definido. Franja superior del `PromoBar` con efecto de cinta (marquee), estática si `prefers-reduced-motion`.

## ✅ 22. Tema oscuro forzado en toda la tienda pública — hecho (bloqueante de marca)
**Por qué sumaba**: el variant `dark:` de Tailwind seguía `prefers-color-scheme` del SO del visitante — con el equipo en modo claro, todo el sitio debajo del Hero (catálogo, PDP, carrito, checkout, success) se veía blanco, rompiendo la identidad Dark Art justo después del Hero.
`globals.css`: `@custom-variant dark (&:where(.dark, .dark *))`. `SiteShell.tsx`: la tienda pública se envuelve en `div.dark` (admin no la recibe, sigue con su propio tema). Confirmado en vivo con curl: home con `class="dark..."`, `/admin/login` sin ella.

## ✅ 23. Navbar: dropdown "Catálogo" con categorías + `?category=` funcional — hecho
"Catálogo" pasó a ser un dropdown (desktop: hover/click con `aria-expanded`, cierra con Escape/click afuera; mobile: sublista expandible en el menú) con Remeras/Buzos/Tazas/Posters/Ver todo. `ProductCatalog.tsx` ahora lee `?category=` como estado inicial (mismo patrón que ya usaba `search`) — antes el link no aplicaba ningún filtro.

## ✅ 24. Fan-out de fetches de cuotas en el catálogo — hecho
`InstallmentsInfo.tsx` memoiza la promesa de `/api/mercadopago/installments` por monto exacto (no redondeado, para no alterar la cuota real mostrada) — varias tarjetas con el mismo precio comparten una sola llamada en vez de una por componente.

## ✅ 25. Quick-add en ProductCard muestra el talle — hecho
El botón pasa a decir "Agregar (Talle X)" cuando el producto tiene más de un talle, en vez de agregar uno elegido a ciegas sin que el comprador lo vea hasta abrir el carrito.

## ✅ 26. Copy honesto en /success + alt real en galería + foco en CartDrawer — hecho
`/success`: distingue "link de orden inválido/vencido" de "checkout en curso sin parámetros todavía", con CTA de WhatsApp en el primer caso — ninguno afirma un pago confirmado sin verificarlo. `ProductGallery.tsx`: thumbnails con `alt` descriptivo real en vez de `alt=""`. `CartDrawer.tsx`: mueve el foco al botón de cerrar al abrir, lo devuelve al trigger al cerrar.

## ✅ 27. Auditoría senior de percepción de marca — hecho lo rápido/bajo riesgo
404 con estilo de marca (badge, copy propio, CTA a inicio y catálogo, antes era texto plano default). Carrito vacío con diseño propio + CTA a catálogo (antes una línea suelta, y encima seguía mostrando Subtotal/Envío/Total en $0). `/success` con estados más precisos (ver ítem 26). Nada quedó listado como pendiente-de-decisión en esta pasada (favicon/meta/og:image ya estaban resueltos; no se encontraron componentes para "Sacar").

## ✅ 10. Expiración real de sesión admin — hecho (con test real, no solo por diseño)
`src/lib/session-token.test.ts` nuevo: token recién creado verifica `true`; token firmado manualmente ya vencido (`exp` en el pasado) verifica `false`; token firmado con otro secret verifica `false`; token `undefined` verifica `false` — los 4 con `jose` real, sin tocar `SESSION_SECRET` de producción. De paso se encontró y resolvió un problema real del entorno de test: bajo `environment: "jsdom"` de vitest, el `TextEncoder` de jsdom genera un `Uint8Array` de otro realm que `jose` rechaza — se resolvió con `// @vitest-environment node` en ese archivo puntual.

## ✅ 21. CSP completo (script-src/connect-src) — hecho
`next.config.ts`: `script-src`/`connect-src` con allowlist real de Google Analytics (único script externo client-side, confirmado por grep), `img-src` con el dominio real de Vercel Blob, `style-src`/`font-src`. Sin nonce (por elección, documentada en el propio archivo): este fork depende de ISR estático y un nonce mal implementado puede romper la hidratación — se prefirió `unsafe-inline` en vez de arriesgar eso. No hace falta ningún dominio de Mercado Pago en `connect-src`: el checkout es una navegación de página completa, no un fetch/iframe desde el browser (confirmado por grep). Probado en vivo con `curl -I` contra `/`, `/products`, la PDP, `/cart` y `/checkout` — todas 200 con el header puesto.

## ✅ 28. Reveal-on-scroll en los 3 productos del Hero — hecho
`FeaturedProductSlider.tsx` no tenía animación de entrada propia (heredaba el fade del contenedor padre del Hero, que dispara al montar, no al scrollear). Ahora reusa el patrón exacto de `ProductRevealBanner.tsx` (`staggerContainer` + `slideVariant` izquierda/derecha/izquierda alternado, `whileInView` con `viewport={{ once: true, amount: 0.3 }}`, gateado por `useReducedMotion` con fallback directo sin transición).

## ✅ 29. Copy de cuotas más contundente (sin cambiar el contenido verificable) — hecho
Reescritos: `TRUST_BOX_ITEMS[0]` y `PROMO_BAR_TOP` en `commerce-copy.ts`, los dos fallbacks de `InstallmentsInfo.tsx` (compact y detailed, cuando no hay cuotas sin interés vigentes), y el heading/subheading de `InstallmentsShowcase.tsx`. Se sacaron construcciones débiles ("mirá el detalle real en el producto", "no en promesas") por un tono más directo — ningún texto nuevo agrega un número de cuotas ni un banco fijo, la info sigue viniendo 100% de `InstallmentsInfo` en vivo contra Mercado Pago.

## ✅ 30. Lookbook rediseñado a mosaico bento inmersivo — hecho
`Lookbook.tsx` (última sección del home, ya era la sección de fotos de Instagram — no se creó una sección paralela, se extendió la existente por regla de `design.md`). Pasó de un grid parejo de 3 columnas contenido a `max-w-6xl` a un mosaico `grid-cols-4` con 1 tile grande (`col-span-2 row-span-2`) + el resto chicos, ancho ampliado a `max-w-7xl`, overlay con ícono de Instagram al hover, y CTA final "Ver el catálogo completo en Instagram". `collectLookbookPhotos()` (deduplicación de fotos reales del catálogo) no se tocó.

## ✅ 31. Copy de marketing del Hero — hecho
Subtítulo cambiado de "Remeras Oversize • Streetwear • Dark Art / Diseños premium con identidad propia" a "Streetwear oversize con identidad dark art / Piezas que no vas a ver en cualquier lado" (mismo registro que `BrandManifesto.tsx`). CTA secundario "Explorar Más" → "Ver Destacados" (más específico, ese link scrollea a `#featured`). Los labels de navegación "Catálogo"/"Contacto" del navbar se dejaron intactos a propósito — son navegación funcional, no copy de marketing, y tocarlos perjudicaría la usabilidad sin beneficio real.

## ✅ 32. Monto real por cuota en InstallmentsInfo — hecho
`InstallmentsInfo` ya estaba montado en `ProductCard` (compact) y en la PDP (detailed) desde el commit inicial del rediseño — no se volvió a agregar el componente, se le agregó el dato que faltaba. Antes solo mostraba "Hasta Nx sin interés"; ahora también muestra el monto por cuota real (`installmentAmount`, que la API de Mercado Pago ya devuelve y no se estaba usando) — ej. "Hasta 3x $13.708 sin interés". Si `installmentAmount` no viene, cae al texto anterior sin monto en vez de mostrar `$0`/`$undefined`. El fallback sin cuotas disponibles no se tocó.

**Diagnóstico de la API real** (código, sin credenciales de MP en este entorno — ver ítem 6 más abajo para la prueba con cuenta real): sin `MERCADOPAGO_ACCESS_TOKEN`, `/api/mercadopago/installments` responde `{ configured: false, options: [] }` (mensaje genérico honesto). Un plan de cuotas nuevo que Mercado Pago active en una tarjeta ya consultada (Visa/Master/Amex) se refleja automáticamente sin tocar código — el fetch es directo a la API real, sin filtro de planes. Única lista fija real: `DEFAULT_PAYMENT_METHOD_IDS` decide qué marcas consultar *antes* de que el comprador tipee su tarjeta (sin `bin`); si el comprador tipea la tarjeta, se consulta por `bin` real y esa lista no aplica.

## ✅ 33. Jerarquía visual de la sección de cuotas en la PDP — hecho (parcial)
Se agregó un eyebrow "Financiación" arriba de `InstallmentsInfo` en el bloque de precio de la PDP, mismo patrón visual que ya usa `InstallmentsShowcase.tsx` en el home — consistencia entre ambas secciones. No se rediseñó un "ver más detalle" expandible con múltiples planes: el componente `InstallmentsInfo` ya resuelve la jerarquía internamente (opción destacada arriba, issuers y texto legal más chicos debajo) y tocar eso en paralelo con el ítem 32 tenía riesgo real de conflicto — queda como posible mejora futura si en algún momento se necesita comparar varios planes lado a lado.

## ✅ 34. Testimonios: título más humano + loop continuo — hecho
Eyebrow "Lo que dicen" → "En la calle"; heading "Quienes ya se lo pusieron" → "Quienes ya andan con esto puesto" (sin insinuar "reseña verificada" — siguen siendo contenido editorial de marca). El carrusel, antes de scroll manual únicamente, ahora loopea solo (mismo patrón de marquee que `PromoBar.tsx`, con `useMotionValue`/`useAnimationFrame` en vez del atajo de keyframes para poder pausar en hover/focus sin salto visual — las quotes son texto largo, necesitan tiempo de lectura). Array de testimonios sin cambios.

## ✅ 35. Botón "volver arriba" — hecho
Aparece después de 400px de scroll, sube al tope con scroll suave. Apilado arriba del botón de WhatsApp (`bottom-24` vs `bottom-5`, mismo tamaño `h-14 w-14`, mismo `z-50`) sin superponerse, oculto en `/admin` igual que el resto de los widgets flotantes.

## ✅ 36. Flechas de navegación en CrossSell (PDP) — hecho
"También te puede gustar" pasó de solo-swipe a tener flechas izquierda/derecha que scrollean una página visible con `scrollBy` suave. Visibilidad calculada en vivo con `scrollLeft`/`scrollWidth`/`clientWidth` (nunca una flecha "fantasma" sin contenido hacia donde ir). Ocultas en mobile a propósito (el swipe táctil ya es el patrón esperado ahí).

## ✅ 37. Rediseño senior integral (Tanda 2, 8 subagentes A-H) — hecho
Auditoría de pulido sobre toda la tienda, sin reimplementar nada de lo ya cerrado arriba:
- **Hero + banners de reveal**: fix de un efecto muerto real (`bg-radial-gradient` no es una clase de Tailwind — animaba sobre fondo transparente hacía tiempo), partículas invisibles sobre video oscuro migradas a `nixon-crimson-bright`, badge con 3 rojos sueltos consolidado a un acento, bug de doble-transición CSS+Framer en los CTAs (hover con lag), auto-avance del slider ahora respeta `useReducedMotion` (no lo respetaba).
- **Catálogo**: sidebar de filtros bajado de peso visual (de bloques sólidos a lista con punto indicador + `aria-current`), sticky en desktop, contador de filtros activos, migrado a tokens `nixon-*`. `ProductCard` confirmado sin cambios — el badge "A pedido" ya comunicaba bien.
- **PDP**: causa raíz encontrada — la página tenía pares `black/dark:white` muertos (la tienda pública fuerza `.dark` siempre, la mitad clara nunca se pintaba), migrada a `nixon-*`. CTA de agregar al carrito pasa de outline a pill sólido `bg-nixon-crimson` a ancho completo. `focus-visible` agregado en flechas de galería, talles y acordeones (antes solo por mouse).
- **Checkout**: migrado a tokens `nixon-*`, eyebrows de sección agregados, resumen+CTA final elevados a bloque con más prominencia. Verificado línea por línea que es 100% cambio visual, sin tocar validación ni cálculo de precio/cupón.
- **Footer**: sacada "Hacete miembro" (implicaba cuentas de cliente, fuera de alcance según `product.md`), corregido "hecho en Villa María" (sin respaldo) por el texto real de `BrandManifesto.tsx`, "Quiénes somos" renombrado a "Preguntas frecuentes" para coincidir con el contenido real de `/contacto`.
- **Lookbook**: confirmado contra BACKLOG ítem 30, fix real de `sizes` de `next/image` que subestimaba el ancho del tile grande en mobile (quedaba pixelado).
- **Copy transversal**: pasada sobre catálogo/PDP/checkout, un solo cambio genuino ("N productos en esta vista" → "N productos"). El resto ya estaba respaldado por código o por `product.md` (ej. "Precio especial por Transferencia" se investigó a fondo y es una decisión de negocio ya documentada, no una inconsistencia).
- **Mobile/tablet**: el marquee de testimonios solo pausaba con mouse/focus — en touch era imposible frenarlo para leer una quote, corregido con `onTouchStart/onTouchEnd`. Fila de orden+filtros en el catálogo podía desbordar en 320px según el estado (texto de orden largo + contador de filtros) — corregido con `flex-1`/`truncate`+`shrink-0`.

Los 8 subagentes corrieron en paralelo (A-F) y en secuencia (G copy, H mobile, después de que A-F mergearan). Merges sin conflictos salvo el `SiteShell.tsx` de la Tanda 1 (ya resuelto en su momento). Verificado con los 4 checks completos + grep de marcadores de merge + recorrido real con `npm run dev`.

---

### Propuesta pendiente de aprobación — 2 secciones nuevas para el home
Del Subagente F (Tanda 2), basadas 100% en datos ya reales del catálogo (Postgres vía `getCatalogProducts()`), sin ninguna métrica inventada:
1. **"Explorá por categoría"**: 4 tiles (remera/buzo/taza/poster) con foto real representativa + labels ya escritos en `categories.ts`, linkeando a `/products?category=X` (deep-link ya existente y funcional). Iría después de `ValueProps`, antes de "Destacados" — hoy el home no comunica que hay 4 tipos de producto distintos, solo se descubre por el dropdown del navbar.
2. **"Ofertas activas"**: productos con `compareAtPrice > price` (mismo cálculo que ya usa `ProductCard`), condicional — si no hay ninguno en oferta, no se renderiza. Iría entre "Destacados" y el banner de 3 fotos. Hoy ningún descuento real se ve agrupado, solo dentro de cada card individual.

### Propuesta pendiente de aprobación — páginas nuevas para el navbar
Investigación (sin código, dropdown de Catálogo por hover ya estaba implementado desde el ítem 23 — no se reimplementó):
1. **`/nosotros`** ("Nuestra historia"): explicaría el origen del proyecto y, con transparencia, la decisión ya tomada de usar fan art autorizado. Requiere texto/fotos reales del dueño — sin eso no se arranca.
2. **`/guia-de-talles`**: compilar `SIZE_GUIDE_CM`/materiales/cuidado (ya existen como datos reales) en una página propia, accesible sin entrar a un producto. El de menor esfuerzo y mayor certeza — cero contenido nuevo que inventar.
3. **`/drops`**: el newsletter ya promete "drops exclusivos, ediciones limitadas" sin que el modelo de datos tenga ningún campo que lo represente. Requiere migración de schema + UI de admin — esfuerzo alto, solo tiene sentido si el negocio va a operar lanzamientos por tandas reales; si no, más honesto sacar esa frase del newsletter.

---

## ✅ 38. Revertir "Agregar (Talle X)" a "Agregar al carrito" en ProductCard — hecho
El ítem 25 (quick-add mostrando el talle) se había implementado correctamente según lo pedido en su momento (tanda de 9 subagentes). Decisión revertida ahora por pedido explícito: el botón de quick-add en `ProductCard.tsx` vuelve a decir siempre "Agregar al carrito", sin el talle. Se sacó `hasMultipleSizes`/`quickAddLabel` del componente — confirmado por grep que no queda ninguna otra instancia de ese patrón en el resto del repo.

## ✅ 39. Cuotas en ProductCard con jerarquía propia para ambos estados — hecho
`InstallmentsInfo.tsx` gana un tercer variant, `"card"`, usado solo en `ProductCard.tsx` (no toca `"compact"`, que sigue usando `CartSummary.tsx` sin cambios):
- **Con plan sin interés activo**: `{N}x ${monto} sin interés` en `text-sm font-bold text-nixon-crimson-bright`, agrupado justo debajo del precio — deja de ser una nota al pie gris.
- **Sin plan activo (estado real hoy, sin `MERCADOPAGO_ACCESS_TOKEN` local)**: `"Cuotas disponibles en el pago"`, corto, no rompe la tarjeta, sin ocultar que existe la opción.
Ambos casos siguen siendo 100% el dato real de `/api/mercadopago/installments` — ningún banco ni monto inventado. No se pudo verificar visualmente el estado "con plan" en este entorno (sin token de MP configurado localmente); queda para cuando el usuario active cuotas en el panel real.

## Auditoría final de la sesión — qué se pidió y no se implementó de verdad
Repaso de toda la sesión contra el código real (no contra lo que dice este archivo), a pedido explícito después de que el ítem 25 mostró un caso real de decisión-tomada-pero-luego-no-querida.

**Encontrado y corregido en esta pasada:**
- **Comentario incorrecto en `next.config.ts`** (línea 3, desde el commit de CSP completo): decía "este fork usa `src/middleware.ts` (no `proxy.ts`)" — es al revés. Confirmado con `ls`: existe `src/proxy.ts`, no existe `middleware.ts`. Bug de documentación real (nadie lo iba a notar funcionalmente porque no afecta comportamiento, pero es información falsa en el código) — corregido.
- **Ítem 25 (talle en quick-add)**: no era un caso de "nunca se implementó" — se implementó correctamente según lo pedido en su momento. Es una decisión revertida ahora por un pedido nuevo, no un fallo de ejecución pasada. Ver ítem 38.

**Verificado contra el código real y confirmado que SÍ está — sin hallazgos de "pedido y no hecho":**
admin login sin fallback de credenciales hardcodeadas, catálogo sin fallback a JSON (`src/lib/catalog.ts`), rutas `/api/products*` y `/api/orders/[id]` protegidas con `isAdminSessionActive()`, webhook con validación de firma HMAC, patrón `params: Promise<...>` en rutas dinámicas, `proxy.ts` como único mecanismo de protección de `/admin`, `.env.example` completo con las 4 variables agregadas en la Fase B original, comillas escapadas en `Testimonials.tsx`, cupón validado server-side en `createPendingOrder`, badge real de medio de pago por pedido en `/admin/orders`, páginas legales con contenido real (no boilerplate vacío), ruta `/api/newsletter` funcional (no solo UI).

**Deviación conocida, no un gap silencioso**: los labels "Catálogo"/"Contacto" del navbar se dejaron sin tocar en la tanda de copy del Hero, por una recomendación mía explícita en su momento (son navegación funcional, no marketing) — no una omisión, pero quedó sin tu confirmación explícita. Si preferís que se toquen igual, avisame.

**No se re-auditó en esta pasada** (por alcance/tiempo, no por decisión de omitir): la cobertura completa de los 27 ítems de la `AUDITORIA_EXHAUSTIVA.md` ya se hizo con diffs reales en esa sesión — esta pasada se enfocó en detectar el tipo específico de problema que motivó el pedido (una decisión de UI tomada pero luego no querida/mal aplicada), no en repetir la auditoría de seguridad completa.

---

## ⏳ Pendientes de verificación en vivo (bloqueados desde este entorno, no fallados)

Auditoría completa del flujo de compra (código, tests, DB real en lectura, servidor local) sin encontrar fallas nuevas más allá de las corregidas arriba. Estos puntos específicos no se pudieron ejecutar porque requieren cosas que este entorno no tiene — no son "no funciona", son "no se pudo probar desde acá".

### 6. Pago real con tarjeta crédito/débito, dinero en cuenta y efectivo
**Por qué está bloqueado**: no hay forma de generar credenciales de prueba de Mercado Pago sin entrar a la cuenta real (Tus integraciones → Credenciales de prueba) — requiere acceso al panel web de MP, que no tengo.
**Qué falta**: correr una compra de test por cada medio de pago activo en la cuenta, con las tarjetas oficiales de test de MP (aprobada / rechazada / pendiente).

### 7. Webhook real de Mercado Pago con firma válida
**Por qué está bloqueado**: requiere un pago real + un servidor públicamente alcanzable para que MP entregue el webhook — `localhost` no lo es.
**Qué falta**: probar contra el dominio real desplegado (no local), confirmar en el panel de MP (Webhooks → historial) que la entrega devuelve 200, y que el pedido pasa a `paid`/`rejected` sin quedar en `pending`.

### 8. Notificaciones de compra por email en producción
**Por qué está bloqueado**: este entorno local no tiene `RESEND_API_KEY` configurada.
**Qué falta**: confirmar en producción que llegan el mail de "pedido recibido" y el de "pago confirmado".

### 9. Cuotas mostradas = cuotas efectivamente cobradas
**Por qué está bloqueado**: solo se puede comparar contra un cobro real con tarjeta.
**Qué falta**: en la misma compra de test de tarjeta (ítem 6), comparar la cuota que mostró `InstallmentsInfo` contra lo que Mercado Pago cobró de verdad.

---

## ⏳ Pendiente de decisión del dueño (no técnico, no bloqueado por código)

- **Merge a `master`**: frenado a propósito, esperando confirmación explícita ("mergeamos cuando hayamos terminado todo").
- **2 secciones nuevas del home sin aprobar** (propuesta del Subagente F, Tanda 2): "Explorá por categoría" (4 tiles por categoría, deep-link a `/products?category=X` ya funcional) y "Ofertas activas" (productos con `compareAtPrice > price`, condicional). Ambas 100% con datos reales del catálogo, sin código todavía.
- **3 páginas nuevas del navbar sin aprobar** (propuesta del Subagente 4, Tanda 1): `/nosotros` (necesita texto/fotos reales del dueño), `/guia-de-talles` (menor esfuerzo, cero contenido nuevo), `/drops` (esfuerzo alto, solo si se van a operar lanzamientos por tandas reales — si no, más honesto sacar la frase "drops exclusivos" del newsletter).
- **Labels "Catálogo"/"Contacto" del navbar**: se dejaron intactos por recomendación mía (son navegación funcional, no marketing) — nunca hubo confirmación explícita de que el dueño esté de acuerdo.

## Detalles menores sin migrar a tokens nixon-* (no bloquean nada, identificados por los propios subagentes fuera de su alcance)
`CartSummary.tsx`, `TrustBox.tsx`, `ShareButtons.tsx` y `SizeGuideModal.tsx` siguen con clases planas `black/white` en vez de los tokens de marca — visualmente no se nota porque la tienda pública fuerza `.dark`, pero quedan como candidatos para una futura pasada de consistencia total del sistema de diseño.

---

## ✅ 40. Buscador del navbar como input visible (no ícono que abre otra cosa) — hecho
Desktop: campo de búsqueda siempre visible en la navbar, lupa dentro del campo a la izquierda, fondo gris claro, sin caja oscura alrededor (contraste intencional con el resto de la navbar, que sigue el tema oscuro forzado — es un control funcional, no una pieza de identidad de marca). Mobile: se mantiene el ícono que despliega el mismo campo (no entra una barra fija junto a logo/carrito en pantallas chicas), con el mismo estilo visual. La funcionalidad de búsqueda (`?search=`) no cambió, solo la presentación.

## ✅ 41. Íconos reales de compartir en la PDP (WhatsApp, Facebook, Pinterest, X) — hecho
`ShareButtons.tsx` reescrito: en vez de un único botón que abre el selector nativo del sistema, ahora son 4 links reales, cada uno al endpoint de compartir estándar y público de cada red (`wa.me`, `facebook.com/sharer/sharer.php`, `pinterest.com/pin/create`, `twitter.com/intent/tweet`) con la URL real del producto — nada inventado, no requieren API key. Pinterest recibe además la imagen real del producto (`absoluteImageUrl(product.image)`, ya usado en el JSON-LD de la misma página) para la preview del pin.

## ✅ 42. Galería sticky en la PDP (solo desktop) — hecho
La imagen principal de `ProductGallery` queda pegada (`lg:sticky lg:top-24`) mientras se scrollea la columna de info al lado (talles, cuotas, envío, acordeones), y se despega sola al llegar al final de esa columna — el grid ya tenía `lg:items-start`, que hace que la fila mida tanto como el contenido más largo sin estirar la imagen. Gateado a `lg:` a propósito: en mobile es una columna única apilada, donde sticky superpondría la foto sobre el resto del contenido en vez de ayudar.

## 📋 Diagnóstico + propuesta — jerarquía y copy de la PDP completa
Pedido explícitamente como diagnóstico, sin implementar. Ver mensaje aparte con la propuesta detallada (tamaño de fuente, ubicación y sensación de cada bloque: título, descripción, bullets, precio, cuotas, CTA) comparado contra el estándar de una tienda de indumentaria de referencia — pendiente de aprobación antes de tocar código.

---

Nuevos ítems se agregan acá solo si de verdad refuerzan la tienda, con el mismo formato: motivo + qué se hizo/qué falta.
