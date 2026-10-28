# Plan de implementación — 001-video-producto-no-reproduce

**Estado:** borrador
**Spec:** [spec.md](./spec.md)
**Tareas:** [tasks.md](./tasks.md)

## Resumen

El síntoma tiene dos causas que se refuerzan: la política de seguridad de contenido (CSP) no incluye `media-src`, así que el navegador bloquea el video servido desde el almacenamiento de media; y el núcleo del conversor local está en formato UMD, incompatible con el worker de tipo `module` que usa la librería, por lo que la conversión siempre falla y el formulario sube el original sin avisar. El plan corrige la CSP, reemplaza el núcleo por el build ESM oficial servido desde el mismo origen, elimina el fallback silencioso y garantiza que el único video asociable sea el convertido.

La galería pública ya renderiza `<video controls playsInline>` y no necesita cambios. El almacenamiento, la API de productos y el modelo de datos tampoco cambian.

## Archivos a tocar

| Archivo | Cambio | RF |
| --- | --- | --- |
| `public/ffmpeg/ffmpeg-core.js` | Reemplazar el build UMD actual (112.080 bytes) por el build ESM oficial de `@ffmpeg/core` 0.12.9 ya descargado en `C:\Users\Admin\AppData\Local\Temp\opencode\ffmpeg-core-esm.js` (111.804 bytes). El archivo debe exportar `default` (`createFFmpegCore`). | RF-2 |
| `public/ffmpeg/ffmpeg-core.wasm` | Sin cambios: el wasm local (32.232.419 bytes) es el mismo de 0.12.9 y se reutiliza. | RF-2 |
| `src/lib/video-compression.ts` | Quitar `toBlobURL`; cargar con URLs del mismo origen: `ffmpeg.load({ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" })`. En conversión exitosa devolver siempre el MP4 convertido, sin el atajo que devolvía el original cuando el resultado no era más chico. Mantener singleton, progreso, cleanup y mensajes de error. | RF-2, RF-3 |
| `src/lib/video-compression.test.ts` | Quitar el mock de `toBlobURL`; conservar el mock de `fetchFile`. Agregar aserción de `coreURL`/`wasmURL`. Reemplazar el test de "nunca empeora" por el de "siempre devuelve el convertido, aunque pese más". Mantener tests de comando, errores, cleanup, progreso y fallo de carga. | RF-2, RF-3 |
| `src/lib/csp.ts` (nuevo) | Función pura `buildContentSecurityPolicy(isDev: boolean): string`. Dueña de la política y de su comentario de justificación. Incluye `media-src 'self' blob: https://*.public.blob.vercel-storage.com` y `'wasm-unsafe-eval'` en `script-src`. Devuelve una sola línea normalizada terminada en `;`. | RF-5, RF-2 |
| `src/lib/csp.test.ts` (nuevo) | Tests de la política: `media-src` correcto, `'wasm-unsafe-eval'` presente, `'unsafe-eval'` sólo en dev, sin saltos de línea ni espacios duplicados, directivas de seguridad existentes intactas. | RF-5 |
| `next.config.ts` | Importar `buildContentSecurityPolicy` con ruta relativa (`./src/lib/csp`) y usar `value: buildContentSecurityPolicy(isDev)`. Conservar los headers y los comentarios relevantes; mover la justificación específica de la política junto a la función. | RF-5 |
| `src/components/admin/ProductForm.tsx` | Eliminar el `catch` interno que loguea y sube el original. Si la conversión falla, relanzar un error claro que indique que el video no se pudo convertir y que el producto no se guardó; el `catch` externo ya muestra el mensaje y el `finally` limpia el estado. No se debe llegar al `fetch` de productos. | RF-3, RF-4, RF-7, RF-8 |
| `src/components/product/ProductGallery.tsx` | Sin cambios. Ya renderiza `<video controls playsInline>` y recibe la URL del video. | RF-1 |

## Decisiones técnicas

1. **Conversión bloqueante y obligatoria (D1).** Todo video seleccionado en el formulario se convierte antes de subirse. No se ofrece guardar sin convertir ni se permite elegir el original.
2. **Sin fallback silencioso al original (D2).** Se elimina el `try/catch` de `ProductForm` que continuaba con el archivo original. También se elimina el retorno del original por tamaño dentro de `compressVideo`: un clip HEVC corto podría no achicar al recodificar y volvería a introducir el bug. La reproducibilidad tiene prioridad sobre el peso; el tradeoff aceptado es que algunos videos pequeños puedan pesar un poco más. Si la conversión termina con un archivo vacío, se trata como fallo, no como conversión exitosa.
3. **Núcleo ESM servido desde el mismo origen.** `@ffmpeg/ffmpeg` 0.12 crea un worker `{ type: "module" }`; dentro del worker `importScripts` no existe y el fallback hace `import(blobURL)` esperando `.default`. El core UMD no exporta `default`, por eso falla siempre. El build ESM oficial sí exporta `default`, y sirviéndolo desde `/ffmpeg/` el `import()` queda cubierto por `script-src 'self'`. No hace falta `toBlobURL`, ni un CDN, ni `blob:` en `script-src`.
4. **Permiso mínimo para WebAssembly.** La ejecución de WebAssembly en Chrome y Safari está bloqueada por CSP cuando existe `script-src`/`default-src` y no hay `'unsafe-eval'` ni `'wasm-unsafe-eval'`. Como la conversión corre en producción, se agrega `'wasm-unsafe-eval'` a `script-src` en ambas políticas. Es un permiso acotado a wasm: no habilita `eval()` de JavaScript, no requiere `'unsafe-eval'` en producción y no abre `blob:` ni orígenes externos para scripts. Sin este token, el core ESM cargaría pero la compilación del wasm fallaría en producción.
5. **CSP como función pura.** Extraer la construcción a `src/lib/csp.ts` permite testear la cadena exacta sin levantar Next. `next.config.ts` la importa con ruta relativa para no depender de la resolución de alias de TypeScript en el archivo de configuración. La función devuelve la política ya normalizada; se mantiene el orden de directivas y las directivas de seguridad existentes.
6. **`media-src` con allowlist.** `'self'` cubre medios del mismo origen, `blob:` cubre previews locales de archivos y `https://*.public.blob.vercel-storage.com` cubre los videos ya subidos. No se usa `media-src *` ni se toca `default-src`.
7. **Errores claros en el formulario.** El error de conversión se propaga al `catch` existente de `handleSubmit`, que ya llama a `setError` y muestra el mensaje; el `finally` limpia `uploadStatus` y `loading`. El mensaje debe dejar explícito que el producto no se guardó. No se envía ninguna petición de creación/edición si la conversión falla.
8. **Reintento.** El singleton de `getFFmpeg` ya limpia `loadPromise` cuando la carga falla; se conserva ese comportamiento para que un reintento no quede pegado a una promesa rechazada.
9. **Sin cambios en la galería, API, almacenamiento ni base de datos.** El problema es de reproducción y de formato de entrada, no del modelo ni del reproductor.

## Alternativas descartadas

- **Relajar `script-src` con `blob:` o `'unsafe-eval'` para seguir usando `toBlobURL`:** amplía innecesariamente la superficie de ejecución de scripts y no resuelve el problema de fondo (el core UMD no exporta `default`). Se prefiere el core ESM del mismo origen y, como único agregado, `'wasm-unsafe-eval'`, que sólo habilita WebAssembly.
- **Servir el core desde un CDN externo:** agrega una dependencia de disponibilidad y obliga a abrir `script-src`/`connect-src` a un tercero. El wasm ya está alojado localmente.
- **Subir el original cuando la conversión falla:** es exactamente el comportamiento que produce el bug y viola D2. El admin debe ver el error y decidir.
- **Mantener el atajo "si el comprimido no es más chico, subir el original":** puede dejar pasar un HEVC/H.265 sin convertir. Se descarta; el resultado convertido es el único válido.
- **Convertir en el servidor (función serverless) o en segundo plano:** los videos pesados pueden exceder timeouts y el proyecto ya eligió conversión client-side. Fuera de alcance.
- **Migrar automáticamente los HEVC ya guardados:** decisión D3; se resuelven re-subiéndolos.
- **Detectar el códec con `ffprobe` y saltar la conversión si ya es H.264:** agrega otro núcleo wasm y complejidad para un caso que la conversión obligatoria ya cubre. Siempre convertir es más simple y cumple D1.
- **Agregar nonce a la CSP:** rompería el rendering estático/ISR, tal como ya documenta la configuración actual. No se toca esa decisión.
- **Cambiar el reproductor o el diseño de la galería:** no es la causa; el `<video>` actual es correcto.

## Estrategia de tests

### Automatizados (`npm test`, Vitest + jsdom)

- **`src/lib/csp.test.ts`:**
  - Producción: `media-src 'self' blob: https://*.public.blob.vercel-storage.com;` presente; `'wasm-unsafe-eval'` presente; `'unsafe-eval'` ausente; `default-src 'self'`, `object-src 'none'` y `frame-ancestors 'none'` intactos.
  - Desarrollo: `'unsafe-eval'` presente además de `'wasm-unsafe-eval'`.
  - Formato: una sola línea, sin dobles espacios ni saltos de línea, terminada en `;`.
- **`src/lib/video-compression.test.ts`:**
  - `ffmpeg.load` recibe exactamente `{ coreURL: "/ffmpeg/ffmpeg-core.js", wasmURL: "/ffmpeg/ffmpeg-core.wasm" }`. Como el singleton cachea la instancia, esta aserción debe usar una importación fresca con `vi.resetModules()` (o ejecutarse antes de que otro test cargue el módulo) para no depender del orden.
  - El comando sigue usando `libx264`, `aac`, `MAX_VIDEO_WIDTH` y `VIDEO_CRF`.
  - Conversión exitosa devuelve el archivo convertido aunque pese más que el original; el nombre termina en `.mp4`.
  - Una salida vacía se trata como fallo y lanza `VideoProcessingError`.
  - `exec` con código distinto de cero, fallo de carga del core y errores inesperados lanzan `VideoProcessingError`.
  - Cleanup de archivos temporales y propagación de progreso se mantienen.
- **Regresión:** los tests existentes de imágenes, productos y pedidos deben seguir pasando; no se toca su código.

### Manual / integración

- **Camino feliz:** levantar `npm run dev`, entrar al admin, crear un producto con un video HEVC/H.265 (MP4 representativo de iPhone). Ver el progreso de conversión y subida; guardar. Abrir la ficha pública y comprobar reproducción con controles en Chrome, Safari, Firefox y Edge (escritorio y móvil; para Safari/iOS usar un dispositivo real o un servicio de browser cloud si no hay hardware disponible). Revisar la consola: sin violaciones de CSP.
- **Regresión H.264:** abrir un producto existente con video H.264 y confirmar que sigue reproduciéndose sin re-subirlo.
- **Fallo:** en DevTools, bloquear las peticiones a `/ffmpeg/ffmpeg-core.js` y `/ffmpeg/ffmpeg-core.wasm` (o simular offline), intentar guardar un producto con video. Debe aparecer el error, no debe salir ninguna petición a `/api/products`, el producto no debe cambiar y, al desbloquear, el reintento debe funcionar.
- **Cabecera CSP en dev:** con `npm run dev`, ejecutar `curl.exe -sI http://localhost:3000/` y verificar que `Content-Security-Policy` incluye `media-src 'self' blob: https://*.public.blob.vercel-storage.com` y `'wasm-unsafe-eval'`. La política de producción queda cubierta por el test unitario y por `npm run build`; opcionalmente, verificar también con `npm start`.
- **MIME del core:** comprobar que `/ffmpeg/ffmpeg-core.js` se sirve como JavaScript y `/ffmpeg/ffmpeg-core.wasm` como `application/wasm` (Next sirve los archivos de `public/` con su tipo correspondiente; se verifica en la misma pasada manual).

## Cobertura de requisitos

| Requisito | Implementación | Verificación |
| --- | --- | --- |
| RF-1 | `media-src` en CSP; conversión obligatoria; galería sin cambios | Manual en 4 navegadores |
| RF-2 | Core ESM same-origin; `load` con URLs locales; conversión siempre activa | Unitaria + manual HEVC |
| RF-3 | `compressVideo` devuelve siempre el MP4 convertido | Unitaria (caso "pesa más") |
| RF-4 | `ProductForm` sin fallback; error propagado; guardado abortado | Unitaria + manual con requests bloqueadas |
| RF-5 | `buildContentSecurityPolicy` con `media-src` y `'wasm-unsafe-eval'` | Unitaria + cabecera en dev |
| RF-6 | Sin migración; misma URL y reproductor; CSP autoriza el host | Manual con video H.264 existente |
| RF-7 | Callback de progreso existente, sin cambios | Unitaria existente + manual |
| RF-8 | `loadPromise` se reinicia ante fallo; formulario no queda bloqueado | Manual de fallo y reintento |

## Riesgos y notas

- **Videos HEVC ya guardados:** siguen sin reproducirse; es una decisión de producto (D3) y se resuelven re-subiendo. No se debe prometer que el fix los arregla.
- **Primera conversión:** descarga ~32 MB del wasm y puede tardar; el progreso de ffmpeg no avanza hasta que el core está cargado. Es el comportamiento actual y no se optimiza en este cambio.
- **Memoria/límites:** videos muy largos o pesados pueden fallar en el navegador. Ahora fallan con error visible y sin guardar, que es el comportamiento requerido.
- **Matriz de navegadores:** no hay automatización de navegadores en el repo; la verificación de reproducción es manual. Safari en iOS requiere hardware real o browser cloud.
- **Selector de archivos:** hoy acepta `video/mp4,video/webm`. La prueba E2E debe usar un MP4 HEVC; ampliar el selector a otros contenedores (por ejemplo `.mov`) no forma parte de este cambio.
- **`'wasm-unsafe-eval'`:** es una concesión acotada a WebAssembly, necesaria para que la conversión funcione con CSP en producción. No se agrega `'unsafe-eval'` en producción ni se abren orígenes de scripts.
