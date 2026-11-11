// Parche de instalación para @ffmpeg/ffmpeg 0.12.15.
//
// Turbopack (el bundler por defecto de Next 16.4.3+) falla el build con
// `Module not found: Can't resolve (<dynamic> | 'undefined')` porque
// `dist/esm/classes.js` contiene:
//
//     classWorkerURL ? new Worker(new URL(classWorkerURL, import.meta.url), ...) : ...
//
// `classWorkerURL` es una variable y Turbopack no puede resolverla
// estáticamente. Esa rama es código muerto para esta app: en
// `src/lib/video-compression.ts` nunca se pasa `classWorkerURL` a
// `ffmpeg.load()`, así que siempre se usa la rama estática (`./worker.js`).
//
// Se elimina solo la rama muerta del archivo instalado, que es el trabajo
// que recomienda el issue upstream (ffmpegwasm/ffmpeg.wasm#793). Se ejecuta
// desde `postinstall`, así que corre tanto en local como en CI/Vercel.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);

// El export "." resuelve a dist/esm/empty.mjs bajo la condición "node";
// classes.js está en ese mismo directorio.
const classesPath = path.join(
  path.dirname(require.resolve("@ffmpeg/ffmpeg")),
  "classes.js"
);

const DEAD_BRANCH =
  /classWorkerURL\s*\?\s*new Worker\(new URL\(classWorkerURL,\s*import\.meta\.url\),\s*\{\s*type:\s*"module",?\s*\},?\s*\)\s*:\s*/;

const source = await readFile(classesPath, "utf8");

if (!/classWorkerURL\s*\?/.test(source)) {
  // Ya parcheado, o la librería corrigió el problema upstream.
  process.exit(0);
}

const patched = source.replace(DEAD_BRANCH, "");

if (patched === source) {
  throw new Error(
    `No se pudo aplicar el parche de Turbopack a @ffmpeg/ffmpeg (${classesPath}). ` +
      "Revisá si la librería cambió el formato de `load()` y actualizá el patrón."
  );
}

await writeFile(classesPath, patched, "utf8");
console.log("[postinstall] @ffmpeg/ffmpeg: rama muerta de classWorkerURL eliminada");
