// Compresión de video 100% client-side con ffmpeg.wasm — no existe
// ningún equivalente de `putImage()` (Vercel Blob) para video, así que a
// diferencia de las imágenes acá no hay infraestructura server-side para
// reutilizar. Se eligió esta opción explícitamente (no ffmpeg nativo en
// una función serverless) para no arriesgar timeouts de Vercel en un
// video pesado a mitad de recodificación — ver BACKLOG.md.
//
// El core de ffmpeg-core.wasm (~31MB) se sirve desde /public/ffmpeg/ (self
// hosted, mismo origen) en vez de un CDN externo, para no tener que tocar
// la CSP del proyecto (que ya restringe script-src/connect-src a una
// allowlist chica) ni depender de la disponibilidad de un CDN de terceros
// para una herramienta interna de admin.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Lado largo máximo del video ya comprimido. 1280px (~720p) es más que
// suficiente para un clip de showcase de producto reproducido dentro de
// la galería de la PDP — no es contenido cinematográfico que necesite
// full HD/4K.
export const MAX_VIDEO_WIDTH = 1280;
// CRF de libx264: valor estándar de compresión con pérdida moderada para
// entrega web (0 = sin pérdida/pesadísimo, 51 = pésima calidad). 28 es un
// punto de partida razonable para video de producto, no una elección
// arbitraria — es el rango que la propia documentación de x264 recomienda
// para "buena calidad visual con tamaño chico" en contenido no cinemático.
export const VIDEO_CRF = 28;
export const AUDIO_BITRATE = "128k";

export class VideoProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoProcessingError";
  }
}

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

// Carga el core una sola vez por sesión del navegador (singleton) — el
// download de ~31MB solo pasa la primera vez que un admin sube un video;
// las siguientes subidas en la misma pestaña reusan la instancia ya
// cargada.
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton?.loaded) return ffmpegSingleton;

  if (!loadPromise) {
    loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
        toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm"),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      ffmpegSingleton = ffmpeg;
      return ffmpeg;
    })().catch((error) => {
      // Si la carga falla, la próxima llamada tiene que poder reintentar
      // en vez de quedar pegada a una promesa rechazada para siempre.
      loadPromise = null;
      throw error;
    });
  }

  return loadPromise;
}

function outputFileName(originalName: string): string {
  return originalName.replace(/\.[^.]+$/, "") + ".mp4";
}

// Recomprime un video a H.264/AAC dentro de un contenedor mp4, con el
// lado largo tope en MAX_VIDEO_WIDTH y calidad VIDEO_CRF. Nunca "agranda"
// en el sentido de peso: si el resultado comprimido termina pesando igual
// o más que el original (clip ya muy comprimido, o muy corto), se
// descarta el resultado y se sube el original tal cual — mismo criterio
// de "nunca empeorar lo que ya había" que se usa en la optimización de
// imágenes (withoutEnlargement).
export async function compressVideo(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  let ffmpeg: FFmpeg;
  try {
    ffmpeg = await getFFmpeg();
  } catch {
    throw new VideoProcessingError(
      "No se pudo cargar el compresor de video. Probá de nuevo en unos segundos."
    );
  }

  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) {
      onProgress?.(Math.min(1, Math.max(0, progress)));
    }
  };
  ffmpeg.on("progress", progressHandler);

  const inputName = `input-${crypto.randomUUID()}`;
  const outputName = `output-${crypto.randomUUID()}.mp4`;

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const exitCode = await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      `scale='min(${MAX_VIDEO_WIDTH},iw)':-2`,
      "-c:v",
      "libx264",
      "-crf",
      String(VIDEO_CRF),
      "-preset",
      "veryfast",
      "-c:a",
      "aac",
      "-b:a",
      AUDIO_BITRATE,
      "-movflags",
      "+faststart",
      outputName,
    ]);

    if (exitCode !== 0) {
      throw new VideoProcessingError("No se pudo comprimir el video.");
    }

    const data = await ffmpeg.readFile(outputName);
    // readFile() devuelve FileData (Uint8Array | string) — el Uint8Array
    // que da ffmpeg.wasm puede estar respaldado por un ArrayBufferLike
    // (incluye SharedArrayBuffer) que BlobPart no acepta en TS estricto.
    // La copia a un Uint8Array nuevo garantiza un ArrayBuffer normal.
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
    const compressedBlob = new Blob([bytes], { type: "video/mp4" });

    if (compressedBlob.size === 0 || compressedBlob.size >= file.size) {
      return file;
    }

    return new File([compressedBlob], outputFileName(file.name), { type: "video/mp4" });
  } catch (error) {
    if (error instanceof VideoProcessingError) throw error;
    throw new VideoProcessingError("No se pudo procesar el video. Probá con otro archivo.");
  } finally {
    ffmpeg.off("progress", progressHandler);
    // Best-effort: limpiar el filesystem virtual de ffmpeg.wasm entre
    // subidas, para no acumular archivos de sesiones anteriores en la
    // misma pestaña.
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      // ignore
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      // ignore
    }
  }
}
