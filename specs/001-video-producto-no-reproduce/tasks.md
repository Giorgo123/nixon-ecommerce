# Tareas — 001-video-producto-no-reproduce

Ordenadas de arriba hacia abajo: primero las correcciones base, después la verificación funcional y al final la validación completa. Cada tarea es autocontenida y puede revisarse con `git diff` propio.

## T1 — Extraer la CSP y autorizar medios y WebAssembly

**Estado:** hecha
**RF:** RF-5 (habilita RF-1 y RF-2)
**Archivos:** `src/lib/csp.ts` (nuevo), `src/lib/csp.test.ts` (nuevo), `next.config.ts`

Pasos:
1. Crear `buildContentSecurityPolicy(isDev: boolean): string` como función pura, con la política actual y los comentarios de justificación que hoy viven en `next.config.ts`.
2. Agregar `media-src 'self' blob: https://*.public.blob.vercel-storage.com;`.
3. Agregar `'wasm-unsafe-eval'` a `script-src` (en dev y producción); mantener `'unsafe-eval'` sólo en dev.
4. Devolver la política en una sola línea normalizada, terminada en `;`.
5. En `next.config.ts`, importar la función con ruta relativa y usarla como valor de `Content-Security-Policy`; conservar los demás headers y comentarios.
6. Tests: `media-src` exacto, `'wasm-unsafe-eval'` presente, `'unsafe-eval'` sólo en dev, directivas de seguridad existentes intactas, formato sin saltos de línea ni dobles espacios.

**Hecho cuando:** `npm test` pasa los tests de `csp`; `next.config.ts` no construye la política inline; la política de producción contiene `media-src` con el host de media y `'wasm-unsafe-eval'`, y la de desarrollo además contiene `'unsafe-eval'`.

## T2 — Reemplazar el core UMD por el ESM oficial y cargarlo desde el mismo origen

**Estado:** hecha
**RF:** RF-2
**Archivos:** `public/ffmpeg/ffmpeg-core.js`, `src/lib/video-compression.ts`, `src/lib/video-compression.test.ts`

Pasos:
1. Copiar el build ESM `C:\Users\Admin\AppData\Local\Temp\opencode\ffmpeg-core-esm.js` (111.804 bytes) sobre `public/ffmpeg/ffmpeg-core.js`. No tocar `ffmpeg-core.wasm`.
2. En `video-compression.ts`, quitar el import y el uso de `toBlobURL`; llamar a `ffmpeg.load({ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" })`.
3. Mantener el singleton, el reset de `loadPromise` ante fallo, el progreso y el cleanup.
4. Actualizar el mock de `@ffmpeg/util` (dejar sólo `fetchFile`) y agregar una aserción de que `load` recibe exactamente las dos URLs locales. Usar una importación fresca con `vi.resetModules()` si hace falta para evitar el singleton.

**Hecho cuando:** el archivo servido en `public/ffmpeg/ffmpeg-core.js` es byte a byte el ESM descargado; no queda ninguna referencia a `toBlobURL` en el módulo; el test verifica `coreURL` y `wasmURL`; el comando de conversión y los tests existentes siguen pasando.

## T3 — Garantizar que el video asociado sea siempre el convertido

**Estado:** hecha
**RF:** RF-2, RF-3
**Archivos:** `src/lib/video-compression.ts`, `src/lib/video-compression.test.ts`

Pasos:
1. Eliminar el retorno del archivo original cuando el resultado convertido pesa igual o más (`compressedBlob.size >= file.size`).
2. En una conversión exitosa, devolver siempre el `File` MP4 generado, con nombre `.mp4` y tipo `video/mp4`. Si el resultado está vacío, lanzar `VideoProcessingError` en vez de devolver un archivo inválido.
3. Reemplazar el test "nunca empeora: si el resultado comprimido pesa igual o más que el original, devuelve el original" por "devuelve siempre el convertido, aunque pese más que el original"; agregar el caso de salida vacía como error.
4. Mantener los tests de comando, errores, cleanup, progreso y fallo de carga.

**Hecho cuando:** no existe ningún camino que devuelva el archivo original después de una conversión exitosa; el test del caso "pesa más" verifica que el resultado es el convertido; el caso de salida vacía falla con `VideoProcessingError`; `npm test` pasa.

## T4 — Eliminar el fallback silencioso del formulario y mostrar un error claro

**Estado:** hecha
**RF:** RF-3, RF-4, RF-7, RF-8
**Archivos:** `src/components/admin/ProductForm.tsx`

Pasos:
1. Quitar el `catch` interno de la compresión que loguea `"No se pudo comprimir el video, se sube sin comprimir"` y continúa con `videoFile`.
2. Si `compressVideo` falla, relanzar un error claro que indique que el video no pudo convertirse y que el producto no se guardó. El `catch` externo de `handleSubmit` ya muestra el mensaje con `setError`; el `finally` ya limpia `uploadStatus` y `loading`.
3. Asegurar que el flujo se aborta antes de `uploadFile` y antes del `fetch` a `/api/products`.
4. No tocar el callback de progreso ni la lógica de subida.

**Hecho cuando:** al bloquear la carga del conversor, el formulario muestra un error visible, no se envía ninguna petición de creación/edición, no se sube el original y el producto no se crea ni modifica; al desbloquear, el reintento funciona sin recargar.

## T5 — Verificar el camino feliz y la regresión de videos H.264

**RF:** RF-1, RF-2, RF-5, RF-6, RF-7
**Archivos:** ninguno (verificación manual)

Pasos:
1. Con `npm run dev`, crear un producto con un video HEVC/H.265 (MP4 representativo de iPhone) y observar el progreso de conversión/subida.
2. Guardar y abrir la ficha pública; comprobar reproducción con controles en Chrome, Safari, Firefox y Edge, en escritorio y móvil (Safari/iOS con dispositivo real o browser cloud si no hay hardware).
3. Revisar la consola: sin violaciones de CSP; revisar la petición del video en Network (200/206 desde el almacenamiento).
4. Abrir un producto existente con video H.264 y confirmar que sigue reproduciéndose sin re-subirlo.

**Hecho cuando:** la matriz de 4 navegadores × escritorio/móvil queda verificada y registrada; al menos un HEVC convertido y un H.264 existente reproducen; no hay errores de CSP en consola.

## T6 — Verificar el camino de fallo y el reintento

**RF:** RF-4, RF-8
**Archivos:** ninguno (verificación manual)

Pasos:
1. En DevTools, bloquear `/ffmpeg/ffmpeg-core.js` y `/ffmpeg/ffmpeg-core.wasm` (o simular offline después de cargar el formulario).
2. Intentar crear un producto con video y, por separado, editar un producto existente con un video nuevo.
3. Confirmar que aparece el error, que no sale ninguna petición a `/api/products`, que no se sube el original y que el producto existente conserva su video y datos.
4. Desbloquear las peticiones y reintentar sin recargar; confirmar que la conversión y el guardado se completan.

**Hecho cuando:** ambos casos (alta y edición) fallan de forma visible y sin efectos parciales; el reintento posterior funciona.

## T7 — Validación final

**RF:** RF-1 a RF-8
**Archivos:** ninguno (verificación)

Pasos:
1. `npm test` (Vitest, jsdom).
2. `npm run lint`.
3. `npm run build`.
4. Con `npm run dev`, ejecutar `curl.exe -sI http://localhost:3000/` y comprobar que `Content-Security-Policy` incluye `media-src 'self' blob: https://*.public.blob.vercel-storage.com` y `'wasm-unsafe-eval'`.
5. Revisar el diff propio de este cambio y confirmar que sólo se tocaron los archivos previstos (más estos documentos de spec), sin mezclar cambios ajenos que ya estuvieran en el árbol de trabajo.

**Hecho cuando:** `npm test`, `npm run lint` y `npm run build` pasan; la cabecera CSP de dev contiene las directivas esperadas; el diff no incluye cambios accidentales.
