# Especificación — Endurecimiento de producción: seguridad, ciclo de vida de órdenes y analítica

**ID:** 002-hardening-produccion
**Estado:** borrador
**Fecha:** 2026-11-10

## Contexto

Una auditoría de producción detectó varios problemas que, juntos, pueden hacer que la tienda pierda dinero, venda stock inexistente o mienta en sus métricas:

1. **Seguridad del framework.** La versión actual del framework de aplicación tiene vulnerabilidades conocidas (una crítica y varias altas en la auditoría de dependencias de producción). Existe una versión corregida disponible (16.4.6).
2. **Build no verificable.** El build local no se pudo comprobar porque el entorno apuntaba a una base de datos muerta. La integración continua no bloquea el merge cuando el build falla, así que una regresión de build puede llegar a producción sin que nadie lo note.
3. **Reserva huérfana en checkout.** El pedido se crea, el stock se descuenta y el cupón se consume antes de pedirle el link de pago a Mercado Pago. Si Mercado Pago falla, demora o devuelve una respuesta sin link, la orden queda pendiente para siempre, con stock y cupón retenidos.
4. **Estados de pago crudos.** La notificación de pago escribe el estado tal cual llega desde Mercado Pago. Estados como rechazado o en proceso quedan fuera del vencimiento (que solo mira "pendiente"), así que retienen stock indefinidamente y nunca devuelven el cupón. Tampoco hay defensas contra notificaciones repetidas ni contra retrocesos de una orden ya pagada.
5. **Vencimiento incompleto.** El barrido de órdenes vencidas solo libera stock, no devuelve usos de cupón. Las órdenes por transferencia nunca vencen.
6. **URLs de imagen malformadas.** Las imágenes subidas al almacenamiento de blobs son URLs absolutas; al concatenarles el dominio del sitio se genera una URL inválida que Mercado Pago recibe en el pago.
7. **Analítica imprecisa.** El evento de compra se dispara aunque el pago esté pendiente o rechazado, y la página de éxito puede ser indexada por buscadores. HSTS no se emite.
8. **CI permisiva.** El job de build tiene tolerancia a errores y no valida realmente el build de producción.

El resultado esperado es que ninguna orden pueda retener stock o cupón indefinidamente, que un pago real nunca se pierda ni se duplique, que la tienda no publique URLs inválidas y que la seguridad y el build queden verificados de forma automática.

## Requisitos funcionales (EARS)

### RF-1 — Seguridad del framework y verificación base

El sistema deberá ejecutarse sobre una versión corregida del framework de aplicación (objetivo: 16.4.6 o superior) y de su configuración de lint alineada. La auditoría de dependencias de producción no deberá reportar vulnerabilidades críticas. El lint, la verificación de tipos, las pruebas automatizadas y el build de producción deberán completarse correctamente.

### RF-2 — Liberación única, atómica e idempotente de la reserva

Cuando una orden haya reservado stock y consumido un cupón, el sistema deberá liberar ambos exactamente una vez cuando la orden expire, se cancele o se compense un checkout fallido. La liberación deberá ser atómica e idempotente: dos intentos concurrentes o repetidos no deberán devolver stock ni usos de cupón más de una vez, y una orden ya pagada no deberá liberarse.

### RF-3 — Compensación cuando falla la creación del link de pago

Si la creación de la preferencia de pago falla por timeout, error de red, respuesta no exitosa o respuesta sin un enlace de pago válido, entonces el sistema deberá cancelar la orden, liberar el stock y el cupón reservados, y responder al cliente con un error de indisponibilidad (502) que deje claro que el pedido no se completó. Si la preferencia se crea con un enlace de pago válido, el sistema no deberá compensar la orden.

### RF-4 — Interpretación y protección de estados de pago

Cuando el sistema reciba una notificación de pago, deberá interpretar el estado del pago y actualizar la orden según este mapeo:

- `approved` → orden pagada.
- `pending`, `authorized`, `in_process` e `in_mediation` → orden pendiente.
- `rejected` y `cancelled` → orden cancelada, liberando stock y cupón.
- `refunded` y `charged_back` → orden reembolsada.

El sistema no deberá degradar una orden ya pagada por notificaciones antiguas: un estado pendiente, rechazado o cancelado posterior a un pago aprobado deberá ignorarse. Una notificación de reembolso o contracargo sobre una orden pagada deberá marcarla como reembolsada sin liberar stock ni cupón, porque la venta ya se había confirmado.

Si un pago aprobado llega para una orden vencida o cancelada, entonces el sistema deberá intentar re-reservar el stock y re-consumir el cupón. Si no hay stock suficiente, deberá confirmar igual el pago, marcar la orden como pagada con conflicto de stock y alertar para revisión manual. El sistema deberá ser idempotente ante notificaciones repetidas y no deberá duplicar emails de confirmación.

### RF-5 — Vencimiento de órdenes por transferencia

Cuando una orden por transferencia supere las 72 horas sin confirmación, el sistema deberá liberar su reserva y marcarla como vencida. El barrido de órdenes vencidas deberá cubrir las órdenes de Mercado Pago a los 30 minutos y las de transferencia a las 72 horas, usando la misma liberación de stock y cupón.

### RF-6 — Limpieza programada protegida

El sistema deberá exponer un endpoint de limpieza de órdenes vencidas ejecutable por un cron horario. El endpoint deberá exigir un token Bearer configurado. Si el secreto no está configurado, deberá rechazar la ejecución sin liberar nada (fail-closed). Con el token correcto, deberá ejecutar el barrido e informar cuántas órdenes liberó.

### RF-7 — Construcción correcta de URLs de imagen

Cuando se construya una URL de imagen para pagos o metadatos, el sistema deberá conservar las URLs absolutas (por ejemplo, las del almacenamiento de blobs) y prefijar el dominio del sitio solo a las rutas relativas, sin duplicar el origen. La misma regla deberá aplicarse en la ficha de producto.

### RF-8 — Analítica y cabeceras correctas

El evento de compra de analítica solo deberá dispararse cuando la orden esté pagada o pagada con conflicto de stock, y como máximo una vez por sesión. La página de éxito no deberá ser indexada por buscadores. La cabecera HSTS solo deberá emitirse en producción.

### RF-9 — Integración continua bloqueante

La integración continua deberá fallar cuando el build de producción falle y deberá ejecutar la auditoría de dependencias de producción, fallando ante vulnerabilidades críticas. El build deberá recibir la conexión de base de datos no agrupada que necesita la herramienta de migraciones.

### RF-10 — Cobertura automatizada

Deberá existir cobertura automatizada para la liberación idempotente de reservas (stock y cupón), la compensación de checkout, el mapeo de estados de pago, el vencimiento de transferencias, la construcción de URLs absolutas y la autenticación del cron. Las pruebas existentes deberán seguir pasando.

## Casos límite

- **Mercado Pago no responde o responde lento:** se agota el timeout, la orden se cancela y se libera stock y cupón; el cliente recibe 502.
- **Mercado Pago responde con error HTTP:** misma compensación que el timeout.
- **Mercado Pago responde exitosamente pero sin enlace de pago:** se considera fallo; se compensa la orden y se responde 502.
- **La preferencia se creó correctamente:** no se compensa, aunque el envío del email de "pedido recibido" falle (el email no es condición de éxito).
- **La compensación falla** (por ejemplo, la base no responde en ese instante): la orden queda pendiente y el barrido programado la libera después; el cliente igual recibe 502.
- **Notificación de pago repetida:** no se duplica el descuento de stock, no se duplica el consumo de cupón y no se reenvía el email de confirmación.
- **Notificación antigua de rechazo o pendiente sobre una orden ya pagada:** se ignora; la orden sigue pagada.
- **Reembolso o contracargo sobre una orden pagada:** pasa a reembolsada, sin devolver stock ni cupón.
- **Reembolso o contracargo sobre una orden todavía pendiente:** se liberan stock y cupón y la orden queda reembolsada.
- **Pago aprobado después del vencimiento:** se re-reserva stock con control de disponibilidad y se re-consumen usos de cupón; si algún ítem no alcanza, la orden queda pagada con conflicto de stock y se alerta.
- **Cupón eliminado o ya sin usos al re-consumir:** la venta ya ocurrió; no se debe bloquear la confirmación del pago. El cupón se ajusta si existe y se registra el caso para revisión.
- **Estado de pago desconocido:** no se modifica la orden.
- **Orden por transferencia justo en el límite de 72 horas:** se considera vencida al superar el límite, no antes.
- **Dos procesos intentan liberar la misma orden a la vez:** solo uno libera; el otro no devuelve stock ni cupón.
- **URL de imagen absoluta con parámetros de consulta:** se conserva tal cual, sin prefijar el dominio.
- **URL de imagen relativa con o sin barra inicial:** se prefija correctamente y no se duplica la barra.
- **URL de imagen vacía:** no se inventa una URL; se conserva el valor vacío para que el llamador decida.
- **Orden pendiente o rechazada en la página de éxito:** no se dispara el evento de compra.
- **Misma orden abierta en dos pestañas:** el evento de compra se dispara una sola vez por sesión.
- **Cron sin secreto configurado:** responde cerrado, sin liberar órdenes.
- **Cron con token incorrecto o ausente:** rechaza la ejecución.
- **Cron con token correcto y sin órdenes vencidas:** responde correctamente indicando cero liberadas.
- **Entorno de desarrollo:** no se emite HSTS.

## Fuera de alcance

- Configurar variables reales de Vercel, Neon o Mercado Pago en este cambio.
- Ejecutar un cobro real con Mercado Pago. El token local no es de prueba y no se deben crear preferencias con él.
- Monitoreo con Sentry u otra plataforma.
- Backups automáticos de la base de datos.
- Pruebas end-to-end con Playwright.
- Migrar los montos de dinero de número flotante a un tipo decimal.
- Rate limiting distribuido entre instancias.
- Escapar HTML en los emails transaccionales.
- Corregir las imágenes del seed.
- Agregar defensa de autenticación en el layout de administración.
- Facturación electrónica (AFIP).
- Validar el monto o la moneda del pago contra la orden (queda documentado como riesgo).
- Agregar estados nuevos a la orden o modificar el esquema de la base de datos.

## Criterios de aceptación

- **CA-1:** La aplicación usa una versión del framework sin vulnerabilidades críticas conocidas (16.4.6 o superior) con la configuración de lint alineada; `npm audit --omit=dev` no reporta vulnerabilidades críticas; lint, tipos, pruebas y build pasan.
- **CA-2:** Al vencer, cancelar o compensar una orden, se devuelven el stock y el uso de cupón exactamente una vez; una segunda liberación o una liberación concurrente no modifica nada; una orden pagada no se libera.
- **CA-3:** Ante timeout, error de red, respuesta no exitosa o respuesta sin enlace de pago, la orden queda cancelada, el stock y el cupón se devuelven y el cliente recibe 502; si la preferencia se crea con enlace válido, no se libera nada.
- **CA-4:** El mapeo de estados de pago respeta la tabla de RF-4; una orden pagada no se degrada con notificaciones antiguas; un reembolso sobre una orden pagada no devuelve stock; un pago aprobado sobre una orden vencida re-reserva o marca conflicto con alerta; las notificaciones repetidas no duplican stock, cupón ni emails.
- **CA-5:** Las órdenes de Mercado Pago vencen a los 30 minutos y las de transferencia a las 72 horas; ambas usan la misma liberación de stock y cupón; el barrido informa cuántas liberó.
- **CA-6:** El endpoint de limpieza rechaza ejecuciones sin secreto o con token incorrecto, no libera nada en ese caso, y con el token correcto ejecuta el barrido e informa el número de órdenes liberadas; existe una programación horaria.
- **CA-7:** Las URLs absolutas de blobs se conservan sin duplicar el dominio; las rutas relativas se prefijan correctamente; la ficha de producto usa la misma regla.
- **CA-8:** El evento de compra solo se dispara para órdenes pagadas o pagadas con conflicto, una vez por sesión; la página de éxito declara `noindex`; HSTS aparece solo en producción.
- **CA-9:** La integración continua falla si el build falla, ejecuta la auditoría de dependencias de producción y recibe la conexión no agrupada para el build.
- **CA-10:** Las pruebas nuevas y las existentes pasan; el build de producción se verifica contra una base PostgreSQL local con las migraciones aplicadas.
