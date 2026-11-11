# Tareas — 002-hardening-produccion

Ordenadas de arriba hacia abajo: primero la base de seguridad y el helper de reservas, después los tres bugs de ciclo de vida, luego las mejoras menores y la integración continua, y al final la verificación completa contra PostgreSQL local. Cada tarea es autocontenida, se revisa con su propio `git diff` y no debe mezclar los cambios ajenos que ya están en el árbol de trabajo (UI/analytics y `.opencode`).

## T1 — Actualizar Next.js y eslint-config-next, verificar auditoría

**Estado:** hecha
**RF:** RF-1
**Archivos:** `package.json`, `package-lock.json`

Pasos:
1. Instalar la versión corregida exacta: `npm install next@16.4.6 eslint-config-next@16.4.6`. Confirmar que `package.json` queda con `next` en `16.4.6` (no `^`) y `eslint-config-next` alineado.
2. Leer la documentación local de la versión instalada en `node_modules/next/dist/docs/` y revisar notas de deprecación que afecten a App Router, route handlers o metadata.
3. Ejecutar `npm audit --omit=dev` y confirmar que no quedan vulnerabilidades críticas. Si queda alguna crítica en una transitiva sin fix, detenerse y escalar; no usar `--force`.
4. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm test`.

**Hecho cuando:** `next` y `eslint-config-next` están en 16.4.6, `npm audit --omit=dev` no reporta críticas, y lint, tipos y tests pasan con la versión nueva. El build se valida en T9 con la base local.

## T2 — Crear el mapeo de estados y el helper idempotente de liberación

**Estado:** hecha
**RF:** RF-2, RF-4, RF-10
**Archivos:** `src/lib/order-status.ts` (nuevo), `src/lib/order.ts`, `src/app/api/orders/[id]/route.ts`, `src/lib/order-status.test.ts` (nuevo), `src/lib/order-reservation.test.ts` (nuevo)

Pasos:
1. Crear `src/lib/order-status.ts` con:
   - el tipo `OrderStatus` con los siete estados existentes;
   - `isPaidStatus(status)` para `paid` y `paid_stock_conflict`;
   - `isReleasableStatus(status)` para `pending` y `pending_transfer`;
   - `mapMercadoPagoStatus(mpStatus)` que devuelve `{ status, releasesReservation }` según la tabla de RF-4 y `null` para estados desconocidos.
2. En `src/lib/order.ts`, exportar `RELEASABLE_STATUSES` y reemplazar `releaseOrderStock` por `releaseOrderReservation(orderId, finalStatus)`:
   - dentro de una transacción, leer la orden con sus ítems;
   - reclamar con `order.updateMany({ where: { id, status: { in: RELEASABLE_STATUSES } }, data: { status: finalStatus } })`;
   - si `count === 0`, devolver `{ released: false }` sin tocar stock ni cupón;
   - incrementar el stock de cada ítem;
   - si hay `couponCode`, decrementar `Coupon.usedCount` con `where: { code, usedCount: { gt: 0 } }`, sin fallar si el cupón no existe;
   - devolver `{ released: true }`.
3. Actualizar `src/app/api/orders/[id]/route.ts`: en el cambio a `cancelled`, llamar a `releaseOrderReservation(id, "cancelled")` en lugar de `releaseOrderStock`. Mantener el update posterior para `trackingInfo` y estado.
4. Tests:
   - `order-status.test.ts`: tabla completa de mapeo, estado desconocido, `isPaidStatus`, `isReleasableStatus`.
   - `order-reservation.test.ts`: libera stock y cupón una vez; segunda llamada con reclamo `count: 0` no modifica nada; no libera orden pagada/cancelada/inexistente; no deja `usedCount` negativo; cupón inexistente no rompe.

**Hecho cuando:** `releaseOrderStock` ya no existe ni tiene usos; la cancelación administrativa usa el helper; el helper devuelve `released: false` ante un segundo intento o una orden pagada; los tests nuevos pasan y `src/lib/order.test.ts` sigue pasando.

## T3 — Expiración de pendientes y transferencias con el mismo helper

**Estado:** hecha
**RF:** RF-5, RF-2
**Archivos:** `src/lib/order.ts`, `src/lib/order-reservation.test.ts`

Pasos:
1. Agregar `PENDING_TRANSFER_TTL_HOURS = 72` junto a `PENDING_ORDER_TTL_MINUTES = 30`, con comentario que explique la diferencia (la transferencia se acredita a mano y puede demorar).
2. Reescribir `releaseExpiredPendingOrders(now = new Date())` para consultar con `OR`:
   - `pending` con `createdAt < now - 30 min`;
   - `pending_transfer` con `createdAt < now - 72 h`.
3. Para cada orden, llamar a `releaseOrderReservation(order.id, "expired")`. Enviar el email de carrito abandonado solo si `released === true` (usar la orden ya cargada con ítems).
4. Devolver el número de órdenes efectivamente liberadas.
5. Mantener la llamada al barrido desde `createPendingOrder` y actualizar el comentario que decía que transferencia nunca expira.
6. Tests: fijar `now` y verificar que una orden `pending` de 31 min se libera y una de 29 min no; una `pending_transfer` de 73 h se libera y una de 71 h no; una segunda pasada no vuelve a liberar; el conteo es el de liberadas, no el de encontradas.

**Hecho cuando:** las órdenes por transferencia vencen a las 72 h, ambas cohortes usan el helper, el barrido devuelve el conteo de liberadas y los tests de bordes de tiempo pasan.

## T4 — Compensar el checkout y centralizar las URLs absolutas

**Estado:** hecha
**RF:** RF-3, RF-7, RF-10
**Archivos:** `src/app/api/checkout/preference/route.ts`, `src/lib/seo.ts`, `src/lib/seo.test.ts`, `src/app/products/[slug]/page.tsx`, `src/app/api/checkout/preference/route.test.ts` (nuevo)

Pasos:
1. En `src/lib/seo.ts`, agregar `absoluteAssetUrl(url)`: si empieza con `http://` o `https://` devolverla tal cual; si no, delegar en `absoluteUrl`.
2. En `src/app/products/[slug]/page.tsx`, eliminar el helper local `absoluteImageUrl` e importar `absoluteAssetUrl` desde `@/lib/seo`. Reemplazar sus tres usos (`openGraph.images`, `productJsonLd.image`, `ShareButtons.image`). No cambiar la lógica de la URL de la oferta JSON-LD.
3. En `src/app/api/checkout/preference/route.ts`:
   - usar `absoluteAssetUrl` para `picture_url`;
   - ante una excepción de `fetch` (timeout o red), llamar a `releaseOrderReservation(order.id, "cancelled")` en un `try/catch` propio que loguee el fallo sin ocultar el 502, y responder 502;
   - ante `!response.ok`, hacer lo mismo y responder 502;
   - luego de parsear la respuesta, si no hay `init_point` válido, compensar y responder 502;
   - si hay `init_point`, no compensar, enviar el email de pedido recibido y devolver el link.
4. Tests:
   - `seo.test.ts`: URL absoluta intacta, relativa con y sin barra, query string, cadena vacía.
   - `checkout/preference/route.test.ts`: timeout, error de red, `!ok`, `ok` sin `init_point` → liberación + 502; `ok` con `init_point` → 200 sin liberación y con email.

**Hecho cuando:** ningún camino de fallo de preferencia deja la orden pendiente sin intento de liberación; el camino exitoso no libera; `picture_url` usa una URL válida para imágenes de blob; la PDP usa el helper compartido; los tests nuevos pasan.

## T5 — Webhook: mapeo, guardas de estado, re-reserva e idempotencia

**Estado:** hecha
**RF:** RF-4, RF-10
**Archivos:** `src/app/api/webhooks/mercadopago/route.ts`, `src/lib/order.ts`, `src/app/api/webhooks/mercadopago/route.test.ts` (nuevo)

Pasos:
1. En `src/lib/order.ts`, agregar `reReserveOrder(orderId)` para pagos tardíos:
   - dentro de una transacción, volver a descontar stock con `updateMany({ where: { id, stock: { gte: quantity } } })`;
   - marcar `stockConflict = true` si algún ítem no alcanza, sin abortar la transacción;
   - si la orden tiene `couponCode`, incrementar `usedCount` (sin bloquear por `maxUses`; si el cupón no existe, continuar);
   - actualizar la orden a `paid` o `paid_stock_conflict` y persistir `paymentId`;
   - devolver `{ order, stockConflict }`.
2. En el webhook, conservar la validación de firma y la consulta del pago. Reemplazar el `if/else` actual por:
   - calcular `mapped = mapMercadoPagoStatus(payment.status)`; si es `null`, responder `{ ok: true }`;
   - si la orden está pagada: `refunded`/`charged_back` → actualizar a `refunded` sin liberar; cualquier otro estado → ignorar;
   - si la orden está `cancelled`/`expired`: solo `approved` revive con `reReserveOrder`; el resto se ignora; si la orden está `refunded` es terminal y cualquier notificación (incluido `approved`) se ignora (T10 supersede esta rama: la resurrección ya no incluye `refunded`);
   - si la orden está `pending`/`pending_transfer`: si el mapeo pide liberación, llamar a `releaseOrderReservation(orderId, "cancelled")` (o `"refunded"` para reembolsos) y persistir `paymentId`; si es `paid`, actualizar a `paid` y persistir `paymentId`; si es `pending`, actualizar a `pending` y persistir `paymentId`.
   - Enviar el email de pago confirmado solo cuando la orden pasa de no pagada a pagada. Enviar la alerta de conflicto de stock cuando `stockConflict` sea verdadero.
3. Asegurar que una notificación repetida de `approved` sobre una orden pagada no reenvía el email ni vuelve a mover stock/cupón.
4. Tests:
   - `approved` sobre `pending` → `paid` + email una vez.
   - `approved` repetido sobre `paid` → sin cambio y sin segundo email.
   - `rejected` sobre `paid` → sin cambio.
   - `refunded` sobre `paid` → `refunded` sin llamar al helper.
   - `rejected` sobre `pending` → liberación con `cancelled`.
   - `approved` sobre `expired` con stock suficiente → re-reserva y `paid`; con stock insuficiente → `paid_stock_conflict` + alerta.
   - estado desconocido → sin cambio.

**Hecho cuando:** el webhook nunca escribe un estado crudo de Mercado Pago en la orden; una orden pagada no se degrada; los reembolsos de pagadas no liberan stock; los pagos tardíos se re-reservan o marcan conflicto; no se duplican emails; los tests pasan.

## T6 — Endpoint de cron y programación horaria

**Estado:** hecha
**RF:** RF-6, RF-10
**Archivos:** `src/app/api/cron/cleanup-orders/route.ts` (nuevo), `vercel.json` (nuevo), `.env.example`, `src/app/api/cron/cleanup-orders/route.test.ts` (nuevo)

Pasos:
1. Crear `GET` en `src/app/api/cron/cleanup-orders/route.ts`:
   - leer `CRON_SECRET`; si falta, responder cerrado (500) y no ejecutar el barrido;
   - comparar `Authorization` con `Bearer <secret>` de forma timing-safe; si no coincide o falta, responder 401;
   - ejecutar `releaseExpiredPendingOrders()` y devolver `{ ok: true, released }`.
2. Crear `vercel.json` con `{ "crons": [{ "path": "/api/cron/cleanup-orders", "schedule": "0 * * * *" }] }`.
3. Agregar `CRON_SECRET` a `.env.example` con comentario: valor largo y aleatorio, generado con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`; Vercel lo envía como `Authorization: Bearer`.
4. Tests: sin secreto → cerrado y sin barrido; token ausente/incorrecto → 401; token correcto → 200 con el conteo del mock.

**Hecho cuando:** el endpoint no libera nada sin secreto o con token incorrecto; con el token correcto ejecuta el barrido y devuelve el número de liberadas; `vercel.json` declara el cron horario; `.env.example` documenta `CRON_SECRET`; los tests pasan.

## T7 — Analítica, noindex y HSTS

**Estado:** hecha
**RF:** RF-8
**Archivos:** `src/components/analytics/PurchaseTracker.tsx`, `src/app/success/page.tsx`, `next.config.ts`

Pasos:
1. En `PurchaseTracker`, importar `isPaidStatus`. En el `useEffect`, salir sin disparar si la orden no está pagada. Usar una clave `purchase_tracked:<order.id>` en `sessionStorage`: si ya existe, no disparar; si no, escribirla y disparar. Envolver el acceso al almacenamiento en `try/catch` para tolerar bloqueos.
2. En `src/app/success/page.tsx`, exportar `metadata` con `robots: { index: false, follow: false }`. Mantener `dynamic = "force-dynamic"` y el resto del comportamiento.
3. En `next.config.ts`, agregar `Strict-Transport-Security` con `max-age=63072000; includeSubDomains` solo cuando `isDev === false`. No tocar la CSP ni las demás cabeceras.
4. Verificar manualmente en T9: HSTS presente con `npm start`, ausente con `npm run dev`; `robots` en el HTML de `/success`.

**Hecho cuando:** una orden `pending`/`rejected`/`cancelled` no dispara `purchase`; una orden pagada dispara una sola vez por sesión; `/success` declara `noindex`; HSTS aparece solo en producción.

## T8 — Integración continua bloqueante y auditoría

**Estado:** hecha
**RF:** RF-9
**Archivos:** `.github/workflows/ci.yml`

Pasos:
1. En el job `build`, quitar `continue-on-error: true`.
2. Agregar `DATABASE_URL_UNPOOLED: ${{ secrets.DATABASE_URL_UNPOOLED }}` al `env` del paso de build, junto a las variables existentes.
3. En el job `checks`, después de `npm ci` o de los tests, agregar `npm audit --omit=dev --audit-level=critical`.
4. Actualizar el comentario de secrets: ahora el job de build bloquea el merge y requiere `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, `MERCADOPAGO_ACCESS_TOKEN` y `NEXT_PUBLIC_SITE_URL`.

**Hecho cuando:** el workflow no tolera errores en el build, pasa la conexión no agrupada y ejecuta la auditoría de producción con nivel crítico; el comentario refleja que los secrets son obligatorios. La ejecución real del CI se valida al abrir el PR.

## T9 — Verificación final contra PostgreSQL local

**Estado:** hecha
**RF:** RF-1 a RF-10
**Archivos:** ninguno (verificación; solo se ajusta código si algo falla)

Pasos:
1. Confirmar que el PostgreSQL 16 local está en `localhost:5432` (usuario `postgres`, contraseña `postgres`) y que existe la base `nixon_ecommerce_test`. No commitear cambios de `.env`.
2. Exportar en la sesión:
   - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nixon_ecommerce_test"`
   - `DATABASE_URL_UNPOOLED="postgresql://postgres:postgres@localhost:5432/nixon_ecommerce_test"`
3. Ejecutar `npx prisma migrate deploy` y confirmar que todas las migraciones aplican sin error.
4. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm test`.
5. Ejecutar `npm run build` y luego `npm start`.
6. Smoke tests con `curl.exe`:
   - cron sin header → 401 (o 500 si no hay `CRON_SECRET`), sin liberar;
   - cron con `Authorization: Bearer <CRON_SECRET>` → 200 con `{ ok: true, released: 0 }`;
   - `curl.exe -sI http://localhost:3000/` con `npm start` → `Strict-Transport-Security` presente; con `npm run dev` → ausente;
   - `curl.exe -s http://localhost:3000/success` → metadata con `robots` `noindex`.
7. Revisar `git diff` y `git status`: solo deben aparecer los archivos de este plan y los tres documentos de spec. No mezclar las modificaciones de UI/analytics ni `.opencode` que ya estaban en el árbol.
8. **Mercado Pago:** no crear preferencias ni ejecutar cobros con el token local, porque no es de prueba. La validación del cobro real queda pendiente por credenciales y se cubre con los tests de fetch mockeado. Dejarlo anotado en el PR.

**Hecho cuando:** `migrate deploy` aplica contra la base local; lint, tipos, tests y build pasan; los smoke tests de cron, HSTS y `noindex` dan el resultado esperado; el diff contiene solo los archivos previstos; y queda documentado que el cobro real con Mercado Pago está pendiente por credenciales.

## T10 — Correcciones post-review

**Estado:** hecha
**RF:** RF-2, RF-3, RF-4, RF-10
**Archivos:** `src/lib/order.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/checkout/preference/route.ts`, `src/app/api/orders/[id]/route.test.ts` (nuevo), `src/lib/order-reservation.test.ts`, `src/app/api/webhooks/mercadopago/route.test.ts`, `src/app/api/checkout/preference/route.test.ts`, `package.json`, `package-lock.json`

Correcciones bloqueantes:
1. `reReserveOrder` reclama solo `expired` y `cancelled`, nunca `refunded`. El webhook ignora cualquier notificación sobre una orden `refunded` (incluido `approved`): no re-reserva, no mueve stock/cupón y no envía email. Esto supersede la línea de T5 que incluía `refunded` en la rama de resurrección: la rama válida es solo `expired`/`cancelled` y `approved` sobre `refunded` se ignora.
2. `reReserveOrder(orderId, paymentId?)` acepta paymentId opcional: la confirmación manual del admin reclama a `paid` sin sobrescribir el paymentId guardado. `PUT /api/orders/[id]` con `status: "paid"`:
   - `pending`/`pending_transfer`: claim atómico; si el claim devuelve 0, re-lee y revive una orden vencida/cancelada.
   - `expired`/`cancelled`: re-reserva (con alerta si hay conflicto de stock) y responde 409 si no pudo.
   - `paid`/`paid_stock_conflict`: no-op. `refunded`: 409.

Transiciones del admin (validación por estado actual):

| Actual | pending | paid | cancelled | refunded |
| --- | --- | --- | --- | --- |
| pending | no-op | claim | libera `cancelled` | libera `refunded` |
| pending_transfer | no-op (conserva 72 h) | claim | libera `cancelled` | libera `refunded` |
| paid / paid_stock_conflict | 409 | no-op | 409 (usar Reembolsada) | cambia a `refunded` sin liberar |
| expired / cancelled | 409 | re-reserva | no-op | cambia a `refunded` (ya liberada) |
| refunded | 409 | 409 | 409 | no-op |

Correcciones importantes y menores:
3. Validación de transiciones inválidas en `PUT /api/orders/[id]` según la tabla anterior: una orden pagada no vuelve a `pending` (el barrido liberaría stock vendido) ni a `cancelled`; una reembolsada queda terminal. `expired → cancelled` es no-op (ya no tiene reserva), documentado en el código.
4. Carrera `approved` vs liberación en el webhook: si el claim `pending/pending_transfer → paid` devuelve 0, se re-lee la orden; si quedó `cancelled`/`expired` se re-reserva con `payment.id`, se envía el email de pago confirmado y la alerta si hubo conflicto; si quedó `paid`/`paid_stock_conflict`/`refunded` no se hace nada.
5. `reReserveOrder` registra con `console.warn` cuando `coupon.updateMany` no re-consumió el cupón (`count === 0`), sin bloquear el pago.
6. Ajustes de bajo riesgo:
   - `@ffmpeg/ffmpeg` pinneado a `0.12.15` exacto (sin `^`) en `package.json` y lockfile, porque `scripts/patch-ffmpeg-worker-url.mjs` (que corre desde `postinstall`) depende del texto exacto de `dist/esm/classes.js` de esa versión y elimina la rama muerta de `classWorkerURL` que Turbopack no puede resolver.
   - Un pago `pending` de Mercado Pago sobre `pending_transfer` solo actualiza `paymentId` y conserva el TTL de 72 h.
   - El catch del webhook registra el error en el servidor y responde `{ error: "Webhook error" }` genérico.
   - En checkout, el token del back_url `success` se calcula después de crear la orden; si falla, se libera la reserva y se responde 500 "No se pudo iniciar el checkout" (no se reporta como error de conexión a MP).

Tests: `orders/[id]/route.test.ts` nuevo (claim, re-reserva, 409, tracking, 401); casos de `refunded` que no revive, carrera del webhook, `pending` sobre `pending_transfer` y error genérico; caso de fallo del token en checkout; reclamo de `reReserveOrder` sin `refunded`, sin paymentId y warning de cupón.

**Hecho cuando:** `npm test`, `tsc --noEmit`, `eslint src` y el build contra PostgreSQL local pasan; la tabla de transiciones queda cubierta por tests y ningún camino revivido descuenta stock/cupón dos veces.
