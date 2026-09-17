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

### 10. Expiración real de sesión admin
**Por qué está bloqueado**: sin `SESSION_SECRET` local no se puede firmar un JWT de prueba ya vencido para probarlo en vivo.
**Qué falta**: confirmar en producción que, pasados los 7 días de `createSessionToken`, la sesión deja de funcionar y redirige a `/admin/login`. El mecanismo en sí (librería `jose`, valida `exp` automáticamente) está verificado por código/diseño, no por ejecución.

### 21. CSP completo (script-src/connect-src)
**Por qué no se hizo todavía**: un CSP mal armado puede romper el checkout en silencio (bloquear GA4 o el redirect de Mercado Pago) — no lo arme sin poder probarlo contra un navegador real primero.
**Qué falta**: armar el allowlist real (`script-src` para `googletagmanager.com`, `connect-src` para `google-analytics.com`/`api.mercadopago.com`, etc.) y probarlo contra el checkout desplegado antes de confirmarlo.

---

Nuevos ítems se agregan acá solo si de verdad refuerzan la tienda, con el mismo formato: motivo + qué se hizo/qué falta.
