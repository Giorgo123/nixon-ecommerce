# Especificación — Video de producto no se reproduce

**ID:** 001-video-producto-no-reproduce
**Estado:** borrador
**Fecha:** 2026-10-28

## Contexto

La ficha pública muestra un reproductor cuando un producto tiene un video asociado. Hoy el administrador puede cargar un video desde el panel, pero al abrir la ficha el reproductor queda en negro y el video no se reproduce. Las dos causas conocidas son independientes:

1. La política de seguridad de contenido de la tienda no autoriza el origen del almacenamiento de videos para la carga de medios, por lo que el navegador bloquea el video aunque el archivo exista y sea válido.
2. El conversor local de video no logra inicializarse. Como consecuencia, la carga continúa con el archivo original sin convertir; si ese archivo usa un códec que no todos los navegadores objetivo soportan (por ejemplo, HEVC/H.265 de iPhone), el video tampoco se reproduce.

El resultado es una experiencia rota para el cliente y una falsa sensación de éxito para el administrador: cree que publicó un video y el cliente no ve nada. La tienda necesita garantizar que todo video asociado a un producto sea reproducible en los navegadores objetivo y que, si no puede convertirse, el administrador lo sepa antes de guardar.

## Requisitos funcionales (EARS)

### RF-1 — Reproducción en la ficha pública

Cuando un producto tiene un video asociado, el sistema deberá reproducirlo en la ficha pública en las versiones actuales de Chrome, Safari, Firefox y Edge, tanto en escritorio como en móvil, mostrando los controles de reproducción y sin depender de complementos externos.

### RF-2 — Conversión obligatoria antes de asociar

Antes de asociar un video a un producto, el sistema deberá convertirlo automáticamente a un formato reproducible por los navegadores objetivo (MP4 con video H.264 y audio AAC), sin requerir una acción adicional del administrador.

### RF-3 — El video asociado es siempre el convertido

Cuando la conversión finaliza correctamente, el sistema deberá asociar y subir el archivo convertido, aunque su tamaño sea mayor que el del archivo original. El sistema no deberá sustituirlo por el original sin convertir.

### RF-4 — Error visible y guardado bloqueado

Si la conversión falla, entonces el sistema deberá mostrar al administrador un mensaje de error claro que indique que el video no pudo convertirse y que el producto no se guardó, y deberá impedir el guardado del producto con ese video. Si se trata de la edición de un producto existente, el producto y su video anterior deberán conservarse sin cambios.

### RF-5 — La política de seguridad permite el video

La política de seguridad de contenido de la tienda deberá permitir la carga de medios desde el almacenamiento de videos de la tienda y desde URLs temporales locales, sin bloquear el reproductor de la ficha pública ni la ejecución del conversor local.

### RF-6 — Compatibilidad con videos ya guardados

Los videos ya asociados a productos que se encuentran en un formato reproducible deberán seguir reproduciéndose después del cambio, sin migración, reprocesamiento ni modificación manual.

### RF-7 — Progreso visible

Mientras el video se convierte y se sube, el administrador deberá ver un estado de progreso que le permita saber que la operación está en curso.

### RF-8 — Reintento tras un fallo

Si el administrador reintenta guardar después de un error de conversión, el sistema deberá permitir un nuevo intento sin requerir recargar la página ni quedar bloqueado por el intento fallido.

## Casos límite

- **Video HEVC/H.265** (incluidos archivos exportados desde iPhone): debe convertirse a H.264/AAC; nunca debe guardarse el original sin convertir.
- **Video ya H.264/AAC en MP4:** se vuelve a convertir; el resultado puede pesar más que el original y aun así debe usarse, porque la reproducibilidad manda sobre el tamaño.
- **Video sin pista de audio:** la conversión debe completarse y el video debe reproducirse sin audio.
- **Video con nombre o extensión que no sea `.mp4`:** el archivo asociado debe quedar identificado como MP4.
- **El conversor no puede inicializarse** (fallo de red al descargar el motor, WebAssembly deshabilitado, worker bloqueado): se aplica RF-4; no se guarda el producto ni se sube el original.
- **La conversión falla a mitad de proceso o produce un archivo vacío** (archivo corrupto, formato no soportado, memoria insuficiente): se aplica RF-4; no debe quedar un producto a medio guardar.
- **La subida falla después de una conversión exitosa:** se muestra el error y no se asocia ningún video al producto.
- **Edición de un producto con video existente:** si el nuevo video falla, el producto conserva su video y sus datos anteriores.
- **Video inusualmente largo o pesado:** puede fallar por límites del navegador; debe fallar de forma clara y sin guardar el producto. Soportar archivos de ese tamaño no forma parte de este cambio.
- **Reintento inmediato:** después de un error, un nuevo intento debe poder cargar el conversor y completar la operación.

## Fuera de alcance

- Migrar, reprocesar o reemplazar automáticamente videos HEVC/H.265 ya guardados antes de este cambio. Esos videos se resuelven re-subiéndolos, como decisión de producto.
- Transcodificación en servidor, trabajos en segundo plano, colas o procesamiento diferido después de guardar.
- Reproducir o convertir formatos adicionales a los que ya acepta el selector de archivos del panel; el foco es que todo video cargado quede en un formato reproducible.
- Cambios de diseño, controles o comportamiento del reproductor de la ficha pública: el reproductor actual ya es el adecuado.
- Optimización adicional de peso o calidad más allá de los parámetros actuales del conversor.
- Subida por partes, streaming, HLS u optimización de videos existentes que ya son H.264/AAC.
- Soporte de navegadores antiguos o de códecs alternativos (AV1, VP9, etc.).
- Métricas, analítica o monitoreo de fallos de conversión.

## Criterios de aceptación

- **CA-1:** Dado un administrador que carga un video HEVC/H.265 representativo (por ejemplo, exportado desde iPhone) al crear un producto, cuando la conversión termina, entonces el producto guarda un MP4 con H.264/AAC y el video se reproduce con controles en las versiones actuales de Chrome, Safari, Firefox y Edge, en escritorio y en móvil.
- **CA-2:** Dado un producto existente cuyo video ya es H.264/AAC, cuando se abre su ficha pública después del cambio, entonces el video sigue reproduciéndose sin migración ni edición manual.
- **CA-3:** Dado que la conversión falla (por ejemplo, se bloquea la descarga del motor del conversor), cuando el administrador intenta guardar, entonces ve un mensaje claro de que el video no pudo convertirse y el producto no se guardó, no se envió el original al almacenamiento y no se creó ni modificó el producto.
- **CA-4:** La respuesta de la tienda incluye una política de seguridad que autoriza medios desde el almacenamiento de videos y desde URLs temporales locales, y la consola del navegador no muestra bloqueos de la política al reproducir un video.
- **CA-5:** Cuando la conversión es exitosa, el archivo asociado es siempre el convertido, incluso si pesa más que el original; no existe un camino silencioso que suba el original.
- **CA-6:** Durante la conversión y la subida, el administrador ve el progreso en pantalla.
- **CA-7:** Después de un error, el administrador puede reintentar sin recargar la página y el reintento puede completarse.
- **CA-8:** Las pruebas automatizadas, el lint y la compilación de producción pasan; la verificación de la cabecera de seguridad en el servidor de desarrollo muestra la autorización de medios esperada.
