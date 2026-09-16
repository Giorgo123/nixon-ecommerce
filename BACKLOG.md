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

---

Sin pendientes abiertos por ahora. Nuevos ítems se agregan acá solo si de verdad refuerzan la tienda, con el mismo formato: motivo + qué se hizo/qué falta.
