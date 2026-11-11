# Plan de implementación — 002-hardening-produccion

**Estado:** borrador
**Spec:** [spec.md](./spec.md)
**Tareas:** [tasks.md](./tasks.md)

## Resumen

El cambio ataca un bloqueante de seguridad y tres bugs de ciclo de vida de órdenes que comparten una misma causa: la reserva (stock + cupón) no tiene un dueño único ni una transición de estado atómica. El plan introduce un helper idempotente de liberación que reclama la orden con un `updateMany` condicional por estado, y lo reutiliza en vencimiento, cancelación administrativa, compensación de checkout y webhooks. Sobre esa base, el checkout compensa la orden cuando Mercado Pago no entrega un link válido, y el webhook traduce los estados de pago a un mapeo explícito, protege las órdenes ya pagadas y re-reserva si un pago aprobado llega tarde.

En paralelo se actualiza el framework a 16.4.6, se vuelve bloqueante el build de CI y se agrega la auditoría de dependencias. Las mejoras menores (URLs de imagen, analítica, `noindex`, HSTS, cron protegido) se resuelven en la capa que ya posee cada responsabilidad: `seo.ts` para URLs, `PurchaseTracker` para el evento, la metadata de la página de éxito para el `noindex`, `next.config.ts` para HSTS y un route handler nuevo para el cron. No se toca el esquema de Prisma ni se agregan estados.

La verificación final se hace contra el PostgreSQL 16 local (`nixon_ecommerce_test`), porque el `.env` actual apunta a una base muerta. El cobro real con Mercado Pago queda pendiente: el token local no es de prueba y no se deben crear preferencias con él.

## Archivos a tocar

| Archivo | Cambio | RF |
| --- | --- | --- |
| `package.json`, `package-lock.json` | Subir `next` a `16.4.6` exacto y alinear `eslint-config-next` a `16.4.6`. Actualizar el lockfile con `npm install`. | RF-1 |
| `.github/workflows/ci.yml` | Quitar `continue-on-error: true` del job `build`; agregar `DATABASE_URL_UNPOOLED` a su `env`; agregar `npm audit --omit=dev --audit-level=critical` al job `checks`. Actualizar el comentario de secrets requeridos. | RF-9 |
| `src/lib/order-status.ts` (nuevo) | Dueño del vocabulario de estados: tipo `OrderStatus`, `isPaidStatus`, `isReleasableStatus`, `mapMercadoPagoStatus`. Funciones puras, sin Prisma. | RF-4, RF-8 |
| `src/lib/order.ts` | Exportar `RELEASABLE_STATUSES`; reemplazar `releaseOrderStock` por `releaseOrderReservation(orderId, finalStatus)` con reclamo atómico (`updateMany` por estado), devolución de stock y decremento de `Coupon.usedCount`. Agregar `reReserveOrder(orderId, paymentId?)` para pagos tardíos y confirmaciones manuales (solo `expired`/`cancelled`). Agregar `PENDING_TRANSFER_TTL_HOURS = 72`. Reescribir `releaseExpiredPendingOrders(now?)` para cubrir `pending` (30 min) y `pending_transfer` (72 h) con el helper. | RF-2, RF-4, RF-5 |
| `src/app/api/orders/[id]/route.ts` | Reemplazar `releaseOrderStock(id)` por `releaseOrderReservation(id, "cancelled")` en el cambio a cancelada. El helper ya deja el estado cancelado; el update posterior conserva `trackingInfo` si vino. | RF-2 |
| `src/app/api/checkout/preference/route.ts` | Compensar la orden ante timeout, error de red, `!response.ok` o respuesta sin `init_point`; no compensar si el link es válido. Usar `absoluteAssetUrl` para `picture_url`. Responder 502 con mensaje claro. | RF-3, RF-7 |
| `src/app/api/webhooks/mercadopago/route.ts` | Usar `mapMercadoPagoStatus`; aplicar guardas de estado (no degradar pagadas, reembolso sin liberar, revivir vencidas con re-reserva); liberar con el helper en rechazo/cancelación; mantener idempotencia y no duplicar emails. | RF-4 |
| `src/app/api/cron/cleanup-orders/route.ts` (nuevo) | `GET` protegido con `Authorization: Bearer ${CRON_SECRET}`; fail-closed si falta el secreto; llama a `releaseExpiredPendingOrders()` y devuelve `{ ok: true, released }`. | RF-6 |
| `vercel.json` (nuevo) | Configurar un cron horario (`0 * * * *`) hacia `/api/cron/cleanup-orders`. | RF-6 |
| `.env.example` | Documentar `CRON_SECRET` con generación sugerida y explicar que Vercel lo envía como Bearer. | RF-6 |
| `src/lib/seo.ts` | Agregar `absoluteAssetUrl(url)`: conserva `http(s)://`, prefija relativas con `getSiteUrl()` vía `absoluteUrl`. | RF-7 |
| `src/app/products/[slug]/page.tsx` | Eliminar el helper local `absoluteImageUrl`; importar y usar `absoluteAssetUrl` de `@/lib/seo`. Mantener `siteUrl` local solo para la URL de la oferta JSON-LD. | RF-7 |
| `src/components/analytics/PurchaseTracker.tsx` | Disparar `purchase` solo si `isPaidStatus(order.status)`; deduplicar por sesión con `sessionStorage` y una clave por orden; tolerar `sessionStorage` bloqueado. | RF-8 |
| `src/app/success/page.tsx` | Exportar `metadata` con `robots: { index: false, follow: false }`. | RF-8 |
| `next.config.ts` | Agregar `Strict-Transport-Security` solo cuando `isDev === false`. No tocar CSP ni las demás cabeceras. | RF-8 |
| `src/lib/order-status.test.ts` (nuevo) | Tests de la tabla de mapeo, estados desconocidos, `isPaidStatus` y `isReleasableStatus`. | RF-4, RF-8 |
| `src/lib/order-reservation.test.ts` (nuevo) | Tests del helper de liberación (stock + cupón, idempotencia, orden pagada) y del barrido con ambos TTL. | RF-2, RF-5, RF-10 |
| `src/app/api/checkout/preference/route.test.ts` (nuevo) | Tests de compensación: timeout, red, `!ok`, sin `init_point`, éxito sin compensación, 502. | RF-3, RF-10 |
| `src/app/api/webhooks/mercadopago/route.test.ts` (nuevo) | Tests de guardas: no degradar pagada, reembolso de pagada sin liberar, aprobado repetido sin email duplicado, aprobado sobre vencida. | RF-4, RF-10 |
| `src/app/api/cron/cleanup-orders/route.test.ts` (nuevo) | Tests de auth: sin secreto (fail-closed), token incorrecto, token correcto con conteo. | RF-6, RF-10 |
| `src/lib/seo.test.ts` | Agregar casos de `absoluteAssetUrl`: URL absoluta, relativa con y sin barra, con query string, vacía. | RF-7, RF-10 |

## Decisiones técnicas

1. **Estados existentes, sin migración (D1, ya tomada).** Se usan `pending`, `pending_transfer`, `paid`, `paid_stock_conflict`, `cancelled`, `refunded` y `expired`. No se agrega ningún estado ni columna. El esquema de Prisma no se toca (D5).
2. **TTL de transferencia de 72 h y de Mercado Pago de 30 min (D2, ya tomada).** Se documenta como constante exportada. El barrido recibe `now` como parámetro opcional para poder testear el borde sin depender del reloj real.
3. **Cron horario de Vercel y fail-closed sin secreto (D3, ya tomada).** El endpoint no libera nada si `CRON_SECRET` no está configurado. Vercel envía el header `Authorization: Bearer <CRON_SECRET>` de forma automática cuando la variable existe. La comparación es timing-safe.
4. **Sin validación de monto ni moneda (D4, ya tomada).** Queda como riesgo documentado; no se implementa en esta iteración.
5. **Un único helper de liberación (D6).** `releaseOrderReservation(orderId, finalStatus)` es el dueño de devolver stock y cupón. El reclamo se hace con `order.updateMany({ where: { id, status: { in: RELEASABLE_STATUSES } }, data: { status: finalStatus } })` dentro de una transacción. Si `count === 0`, otro proceso ya la reclamó o la orden no era liberable: devuelve `{ released: false }` y no toca nada. Después incrementa el stock de cada ítem y, si la orden tiene `couponCode`, decrementa `usedCount` con `where: { code, usedCount: { gt: 0 } }` para no dejarlo negativo y sin fallar si el cupón ya no existe. El helper reemplaza a `releaseOrderStock` en todos sus usos.
6. **Compensación solo por fallo de preferencia (D7).** La orden se crea primero (comportamiento actual). Si la preferencia no entrega un `init_point` válido, se compensa con el helper en estado `cancelled` y se responde 502. Si el link es válido, no se compensa nunca: el pago puede estar en curso y el webhook es la fuente de verdad. La compensación se envuelve en su propio `try/catch` para que un fallo al liberar no oculte el 502; si falla, el barrido programado la recupera.
7. **Máquina de estados del webhook (D8).** El mapeo pago→orden vive en una función pura. Las guardas se aplican sobre el estado leído antes de actualizar: una orden pagada ignora `pending`/`rejected`/`cancelled`; un `refunded`/`charged_back` sobre pagada solo cambia el estado; una orden vencida/cancelada solo revive con `approved`; una orden `refunded` es terminal y no revive con ningún estado (su reserva nunca se liberó, así que revivirla descontaría stock/cupón dos veces); una orden pendiente aplica el mapeo. El email de pago confirmado se envía solo en la transición de no-pagada a pagada. El `paymentId` se persiste en toda transición aplicada.
8. **Re-reserva con control de disponibilidad (D9).** `reReserveOrder(orderId, paymentId?)` vuelve a descontar stock con `updateMany({ where: { id, stock: { gte: quantity } } })`; si algún ítem falla, marca `paid_stock_conflict` y alerta. El cupón se re-incrementa si la orden lo tenía, sin bloquear por `maxUses`: la venta ya ocurrió y el objetivo es que el contador refleje un uso real. La alternativa (rechazar el pago) se descarta porque nunca se debe ignorar un cobro real.
9. **URLs absolutas en una sola función (D10).** `absoluteAssetUrl` conserva las URLs que empiezan con `http://` o `https://` y delega el resto en `absoluteUrl`, que ya normaliza la barra inicial y el dominio. Se usa en checkout y en la PDP; se elimina el helper local duplicado.
10. **Analítica con estado y sesión (D11).** `PurchaseTracker` consulta `isPaidStatus` y una clave `purchase_tracked:<orderId>` en `sessionStorage`. La comprobación y la escritura ocurren en el mismo `useEffect`, de forma síncrona, para que dos montajes seguidos no dupliquen el evento. Si el almacenamiento no está disponible, se dispara una vez por montaje (degradación aceptada).
11. **HSTS solo en producción (D12).** La cabecera se agrega condicionalmente en `next.config.ts` con `max-age=63072000; includeSubDomains`. No se incluye `preload` en esta iteración: es una decisión difícil de revertir y requiere que todos los subdominios sean HTTPS.
12. **CI bloqueante (D13).** El job de build deja de ser tolerante a errores. Para que sea reproducible, recibe `DATABASE_URL_UNPOOLED` además de las variables existentes. La auditoría se ejecuta en el job de checks con `--audit-level=critical`, que falla solo ante críticas (las altas quedan visibles en el log). La documentación del workflow debe decir que los secrets son obligatorios.
13. **Tests con Vitest, no `node --test`.** El repositorio ya usa `vitest run` y la convención `src/**/*.test.ts`. Se respeta esa infraestructura; no se agrega un runner nuevo.
14. **Funciones puras con `now` inyectable.** `releaseExpiredPendingOrders(now = new Date())` y el mapeo de estados no leen el reloj global, para que los tests cubran los bordes de 30 min y 72 h sin esperas.

## Alternativas descartadas

- **Bloquear filas con `SELECT ... FOR UPDATE` o subir el nivel de aislamiento a serializable:** el `updateMany` condicional por estado ya es atómico a nivel de fila y encaja con el patrón que usa `createPendingOrder` para stock y cupón. Subir el aislamiento agrega reintentos y complejidad para el mismo resultado.
- **Guardar el stock/cupón consumido en campos nuevos de la orden:** permitiría liberar sin mirar el cupón, pero obliga a migrar el esquema y duplica información que ya está en `OrderItem` y `couponCode`. Fuera de alcance por D5.
- **Compensar también cuando el email de "pedido recibido" falla:** el email es best-effort y no invalida el link de pago. Compensar ahí cancelaría una orden que el cliente sí puede pagar.
- **Rechazar un pago aprobado si no hay stock:** viola la regla de negocio de no ignorar un cobro real. Se prefiere `paid_stock_conflict` y alerta.
- **Liberar stock en un reembolso de una orden pagada:** el stock ya se comprometió y el reembolso es una devolución de dinero, no una reversión de la reserva. Se descarta para no sobrevender.
- **Agregar un estado `payment_rejected` o `processing`:** cambia el vocabulario de estados y obliga a tocar admin, emails, success y filtros. Se descarta por D1.
- **Usar un cron externo (GitHub Actions, servicio de terceros):** agrega un proveedor y secretos extra. Vercel Cron ya está disponible en el despliegue.
- **Validar monto y moneda en el webhook:** requiere una decisión de producto sobre diferencias de redondeo/impuestos y no estaba pedido. Queda como riesgo.
- **Poner HSTS con `preload`:** irreversible a corto plazo y exige que todos los subdominios sean HTTPS. Se deja para una decisión posterior.
- **Mover el evento de compra al webhook:** es la fuente más precisa, pero necesita un mecanismo de atribución de sesión/cliente que no existe. Se mantiene el gate por estado en la página de éxito.
- **Reemplazar el helper local de la PDP por una lógica inline:** duplicaría la regla de URLs. Se centraliza en `seo.ts`.

## Estrategia de tests

### Automatizados (`npm test`, Vitest + jsdom)

- **`src/lib/order-status.test.ts`** (nuevo):
  - `mapMercadoPagoStatus` devuelve `paid` para `approved`; `pending` para `pending`, `authorized`, `in_process`, `in_mediation`; `cancelled` con `releasesReservation: true` para `rejected` y `cancelled`; `refunded` para `refunded` y `charged_back`; `null`/sin cambio para un estado desconocido.
  - `isPaidStatus` reconoce `paid` y `paid_stock_conflict`, y rechaza el resto.
  - `isReleasableStatus` reconoce `pending` y `pending_transfer`, y rechaza pagadas/canceladas.
- **`src/lib/order-reservation.test.ts`** (nuevo): mock de `@/lib/prisma` con `$transaction`, `order.findUnique`, `order.updateMany`, `productVariant.update`, `coupon.updateMany` y `order.findMany`.
  - Libera stock de todos los ítems y decrementa el cupón una vez cuando la orden está `pending`.
  - Si el `updateMany` de reclamo devuelve `count: 0`, no incrementa stock ni toca el cupón (`released: false`). Simula la segunda llamada y la carrera concurrente.
  - No libera una orden `paid`, `cancelled`, `refunded` o inexistente.
  - No deja `usedCount` negativo si el cupón ya estaba en cero o no existe.
  - El barrido consulta `pending` con corte de 30 min y `pending_transfer` con corte de 72 h; usa el helper y cuenta solo las liberadas. Se inyecta `now` para fijar los bordes.
- **`src/app/api/checkout/preference/route.test.ts`** (nuevo): mock de `@/lib/order` (`createPendingOrder`, `releaseOrderReservation`), `@/lib/email`, `@/lib/rate-limit`, `@/lib/coupon` y `global.fetch`.
  - `fetch` lanza `TimeoutError` → se llama la liberación con la orden y `cancelled`; responde 502.
  - `fetch` lanza error de red → 502 y liberación.
  - `fetch` devuelve `!ok` → 502 y liberación.
  - `fetch` devuelve `ok` sin `init_point` → 502 y liberación.
  - `fetch` devuelve `ok` con `init_point` → 200 con el link, sin liberación y con email de pedido recibido.
  - La orden creada con cupón se compensa con el mismo helper (no hay camino que libere solo stock).
- **`src/app/api/webhooks/mercadopago/route.test.ts`** (nuevo): mock de `@/lib/prisma`, `@/lib/email` y `global.fetch` (respuesta de pago).
  - `approved` sobre `pending` → `paid`, email de confirmación una vez.
  - `approved` repetido sobre `paid` → sin cambio y sin segundo email.
  - `rejected` sobre `paid` → sin cambio (no degrada).
  - `refunded` sobre `paid` → `refunded` sin llamar al helper de liberación.
  - `rejected` sobre `pending` → liberación con `cancelled`.
  - `approved` sobre `expired` → re-reserva con `gte`; si falla, `paid_stock_conflict` y alerta.
  - Estado desconocido → sin cambio.
- **`src/app/api/cron/cleanup-orders/route.test.ts`** (nuevo): mock de `@/lib/order`.
  - Sin `CRON_SECRET` → respuesta cerrada (500) y `releaseExpiredPendingOrders` no se llama.
  - Token ausente o incorrecto → 401 y no se llama.
  - Token correcto → 200 con `{ ok: true, released: n }`.
- **`src/lib/seo.test.ts`** (extender):
  - `absoluteAssetUrl("https://...blob...jpg")` devuelve la misma URL.
  - `absoluteAssetUrl("/img.jpg")` y `absoluteAssetUrl("img.jpg")` prefijan `getSiteUrl()` sin doble barra.
  - Una URL absoluta con query string se conserva completa.
  - Cadena vacía se conserva vacía.
- **Regresión:** `src/lib/order.test.ts` debe seguir pasando. El mock de `order.findMany` devuelve `[]`, así que el barrido dentro de `createPendingOrder` no cambia su comportamiento. Los tests de imágenes, productos, cupones, tokens, CSP y compresión no se tocan.

### Manual / integración (PostgreSQL local)

- Levantar el PostgreSQL 16 local en `localhost:5432` con usuario `postgres`/`postgres` y la base `nixon_ecommerce_test`.
- Exportar en la sesión (sin commitear `.env`):
  - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nixon_ecommerce_test"`
  - `DATABASE_URL_UNPOOLED="postgresql://postgres:postgres@localhost:5432/nixon_ecommerce_test"`
- `npx prisma migrate deploy` para aplicar el esquema.
- `npm run build` y `npm start` para verificar el build de producción real.
- Smoke tests con `curl.exe`:
  - `curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/api/cron/cleanup-orders` sin header → 401 (o 500 si no hay secreto configurado), sin liberar.
  - El mismo request con `Authorization: Bearer <CRON_SECRET>` → 200 y `{ "ok": true, "released": 0 }`.
  - `curl.exe -sI http://localhost:3000/` con `npm start` → `Strict-Transport-Security` presente; con `npm run dev` → ausente.
  - `curl.exe -s http://localhost:3000/success` → la metadata incluye `robots` con `noindex`.
- **Mercado Pago:** no se crean preferencias con el token local (no es `TEST`). La verificación del cobro real queda pendiente por credenciales y se cubre con los tests de fetch mockeado.

## Cobertura de requisitos

| Requisito | Implementación | Verificación |
| --- | --- | --- |
| RF-1 | Subida de `next`/`eslint-config-next` a 16.4.6 + auditoría | `npm audit --omit=dev`, lint, tsc, tests, build |
| RF-2 | `releaseOrderReservation` con reclamo atómico | `order-reservation.test.ts` |
| RF-3 | Compensación en checkout ante fallo de preferencia | `checkout/preference/route.test.ts` |
| RF-4 | `mapMercadoPagoStatus` + guardas + re-reserva | `order-status.test.ts`, `webhooks/mercadopago/route.test.ts` |
| RF-5 | `PENDING_TRANSFER_TTL_HOURS = 72` + barrido con dos cortes | `order-reservation.test.ts` |
| RF-6 | Route handler con Bearer fail-closed + `vercel.json` | `cron/cleanup-orders/route.test.ts` + curl |
| RF-7 | `absoluteAssetUrl` en `seo.ts`, checkout y PDP | `seo.test.ts` |
| RF-8 | Gate en `PurchaseTracker`, `noindex`, HSTS condicional | Tests de estado + curl de cabeceras |
| RF-9 | CI bloqueante + audit + `DATABASE_URL_UNPOOLED` | Revisión del workflow + build local |
| RF-10 | Suites nuevas y regresión existente | `npm test` |

## Riesgos y notas

- **Salto de versión de Next:** 16.4.6 puede traer cambios de API o de comportamiento. Antes de codificar hay que leer `node_modules/next/dist/docs/` de la versión instalada (regla de `AGENTS.md`). Si el build falla por una deprecación, se resuelve en la misma tarea de actualización.
- **Auditoría:** si tras subir Next queda alguna vulnerabilidad crítica en una dependencia transitiva sin fix disponible, RF-1 no se puede cumplir y hay que escalarlo; no se debe silenciar con `--force`.
- **CI con secrets:** al quitar `continue-on-error`, el job de build falla si los secrets no están configurados. Es el comportamiento buscado, pero requiere que el repositorio tenga `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, `MERCADOPAGO_ACCESS_TOKEN` y `NEXT_PUBLIC_SITE_URL`.
- **Webhook y concurrencia:** el helper reclama la orden por estado; si Mercado Pago envía dos notificaciones simultáneas, solo una transición se aplica. El email se envía después de la actualización, por lo que una caída entre update y email puede perder la notificación (se acepta; no hay cola de reintentos).
- **Reembolso de orden pagada:** no devuelve stock ni cupón. Es una decisión de negocio documentada; si se quisiera reponer stock habría que definir si la mercadería volvió físicamente.
- **Cupón al revivir una orden:** se incrementa `usedCount` sin respetar `maxUses`. La venta ya ocurrió; el contador puede superar el límite y eso es preferible a perder el cobro.
- **Validación de monto/moneda:** fuera de alcance (D4). Un pago con monto distinto al de la orden no se detecta en esta iteración.
- **HSTS:** se emite con `includeSubDomains` y sin `preload`. Si en el futuro se agrega `preload`, es una decisión difícil de revertir.
- **Analítica:** el gate por estado reduce falsos positivos, pero la página de éxito no es la confirmación definitiva del webhook; un pago que se confirma después de la visita no dispara el evento. Se acepta.
- **`sessionStorage`:** en modo incógnito/privado o con almacenamiento bloqueado puede no persistir; el evento se dispara una vez por montaje.
- **Datos de prueba:** el seed y las imágenes rotas quedan fuera de alcance; la verificación de build no depende de datos semilla, solo de que las migraciones apliquen.
- **Cambios ajenos en el árbol:** el branch tiene modificaciones sin commitear de UI/analytics y `.opencode`. Las tareas deben revisarse con `git diff` propio y no mezclar esos archivos.
- **`@ffmpeg/ffmpeg` pinneado y parche de postinstall:** el paquete queda fijado a `0.12.15` exacto (sin `^`) en `package.json` y el lockfile porque `scripts/patch-ffmpeg-worker-url.mjs` depende del texto exacto de `dist/esm/classes.js` de esa versión. El script corre desde `postinstall` (local, CI y Vercel) y elimina la rama muerta de `classWorkerURL` que Turbopack no puede resolver. Si se actualiza la librería hay que revisar el patrón del script; si el formato cambió, el postinstall falla a propósito para no dejar un build silenciosamente roto.
- **`refunded` no revive:** una orden reembolsada es terminal para el webhook y para el admin. Un reembolso de una orden pagada no liberó stock ni cupón (la reserva ya se había consumido al pagar), así que revivirla con un `approved` tardío los descontaría por segunda vez. El caso `refunded` queda fuera del reclamo de `reReserveOrder` y `PUT` responde 409 si se intenta volver a pagar.
