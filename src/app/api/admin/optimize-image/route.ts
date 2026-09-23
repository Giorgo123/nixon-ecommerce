import { NextRequest, NextResponse } from "next/server";
import { del, putImage, BlobError } from "@vercel/blob";
import { isAdminSessionActive } from "@/lib/admin-session";

// Mismo lado largo máximo y calidad que usaría cualquier PDP/card de esta
// tienda: 2400px cubre con margen el uso más exigente (imagen principal de
// la PDP, hasta 55vw en monitores grandes — ver ProductGallery.tsx) sin
// guardar la resolución completa de una foto de cámara/DSLR que nadie
// sirve nunca. next/image ya reescala hacia abajo para cada contexto de
// consumo; esto solo evita seguir pagando el peso del original en cada
// optimización on-demand. 82 es el punto estándar de compresión
// fotográfica en WebP (pérdida visual mínima en tela/estampado, reducción
// de peso sustancial frente al original sin comprimir).
const MAX_WIDTH = 2400;
const WEBP_QUALITY = 82;

// GIF animado: putImage no garantiza preservar animación al convertir
// formato (la propia Vercel Image Optimization, igual que sharp u otros
// pipelines de resize, trabaja frame a frame salvo que se pida lo
// contrario) — re-codificar un GIF animado a WebP sin cuidado puede
// aplanarlo a una imagen estática. Para fotos de producto de esta tienda
// (remeras/buzos, no memes) es un caso borde raro; en vez de arriesgarse a
// romper silenciosamente un GIF animado, se lo deja pasar sin optimizar.
const SKIP_OPTIMIZATION_CONTENT_TYPES = new Set(["image/gif"]);

// Mismo hostname que ya permite next.config.ts (remotePatterns) para
// next/image — la URL cruda que manda el cliente tiene que ser
// efectivamente un blob de NUESTRO propio store, nunca una URL externa
// arbitraria (evita que una sesión admin comprometida o un bug de cliente
// conviertan esta ruta en un proxy de fetch server-side hacia cualquier
// otra cosa).
const BLOB_HOSTNAME_PATTERN = /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/;

function isOwnBlobUrl(value: string): value is string {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      BLOB_HOSTNAME_PATTERN.test(url.hostname)
    );
  } catch {
    return false;
  }
}

// Optimiza una imagen ya subida (paso previo: el archivo crudo sube directo
// del navegador a Vercel Blob vía /api/admin/upload, sin pasar por ninguna
// función serverless — ver el comentario en esa ruta sobre el límite de
// ~4.5MB). Esta ruta NO recibe el archivo en el body: recibe la URL del
// blob crudo ya subido y le pide a Vercel Image Optimization (putImage)
// que lo baje, lo redimensione/recomprima a WebP y guarde el resultado —
// el fetch/transformación corre del lado de Vercel, no consume tiempo ni
// memoria de esta función. Reusa la infraestructura de storage existente,
// no agrega ninguna dependencia ni proveedor nuevo.
export async function POST(request: NextRequest) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const rawUrl = (body as { url?: unknown })?.url;
  if (typeof rawUrl !== "string" || !isOwnBlobUrl(rawUrl)) {
    return NextResponse.json(
      { error: "La URL debe ser un blob válido de nuestro propio storage" },
      { status: 400 }
    );
  }

  const rawContentType = (body as { contentType?: unknown })?.contentType;
  if (typeof rawContentType === "string" && SKIP_OPTIMIZATION_CONTENT_TYPES.has(rawContentType)) {
    // No se optimiza a propósito (ver comentario arriba) — la imagen cruda
    // ya subida sigue siendo la definitiva, no hay nada más que hacer.
    return NextResponse.json({ url: rawUrl, optimized: false });
  }

  try {
    const optimized = await putImage(`products/${crypto.randomUUID()}.webp`, new URL(rawUrl), {
      access: "public",
      optimizeImage: {
        width: MAX_WIDTH,
        quality: WEBP_QUALITY,
        format: "webp",
      },
    });

    // El blob crudo ya cumplió su propósito (fue la fuente para putImage) —
    // se borra para no dejar una copia sin comprimir pagando storage.
    // Falla no crítica: si el borrado falla, no rompemos la respuesta —
    // el admin ya tiene la imagen optimizada, que es lo que importa.
    try {
      await del(rawUrl);
    } catch {
      // best-effort, ver comentario arriba
    }

    return NextResponse.json({
      url: optimized.url,
      optimized: true,
      contentType: optimized.contentType,
    });
  } catch (error) {
    // Si putImage falla porque el archivo no era una imagen real (a pesar
    // de haber pasado el chequeo de Content-Type declarado en la subida —
    // ese header lo puede mandar cualquiera), limpiamos el blob crudo
    // inválido en vez de dejarlo huérfano en el storage.
    try {
      await del(rawUrl);
    } catch {
      // best-effort
    }

    const message =
      error instanceof BlobError
        ? error.message
        : "No se pudo optimizar la imagen. Probá con otro archivo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
