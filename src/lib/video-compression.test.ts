// La transcodificación real de ffmpeg.wasm necesita un navegador real con
// WebAssembly + Web Workers — no es reproducible en este entorno de tests
// (node/jsdom), igual que hubiera pasado con Canvas API para imágenes. Se
// mockea el límite externo real (@ffmpeg/ffmpeg, @ffmpeg/util) y se
// testea la lógica propia: qué comando arma, el criterio de "nunca
// empeorar" (usar el original si la versión comprimida no achica nada),
// manejo de errores y cleanup — no la compresión en sí, que queda a
// cargo de ffmpeg.wasm mismo (mismo criterio que "no se re-testea que
// Prisma sea atómico" en order.test.ts).
import { beforeEach, describe, expect, it, vi } from "vitest";

const execMock = vi.fn();
const writeFileMock = vi.fn();
const readFileMock = vi.fn();
const deleteFileMock = vi.fn();
const loadMock = vi.fn();
const onMock = vi.fn();
const offMock = vi.fn();

class FakeFFmpeg {
  loaded = false;
  // Delega en loadMock (compartido, controlable desde cada test) en vez
  // de reconfigurar su implementación acá — si esto llamara
  // loadMock.mockImplementation(...) en cada construcción de instancia,
  // pisaría cualquier loadMock.mockRejectedValue(...) que un test haya
  // configurado antes de construir el FFmpeg (bug real que tuvo este
  // archivo en su primera versión).
  load = async (...args: unknown[]) => {
    const result = await loadMock(...args);
    this.loaded = true;
    return result;
  };
  exec = execMock;
  writeFile = writeFileMock;
  readFile = readFileMock;
  deleteFile = deleteFileMock;
  on = onMock;
  off = offMock;
}

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: FakeFFmpeg,
}));

vi.mock("@ffmpeg/util", () => ({
  fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
  toBlobURL: vi.fn(async (url: string) => `blob:${url}`),
}));

const { compressVideo, VideoProcessingError, MAX_VIDEO_WIDTH, VIDEO_CRF } = await import(
  "./video-compression"
);

function makeFile(name: string, sizeBytes: number, type = "video/mp4"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  loadMock.mockResolvedValue(true);
  execMock.mockResolvedValue(0);
  writeFileMock.mockResolvedValue(true);
  deleteFileMock.mockResolvedValue(true);
});

describe("compressVideo", () => {
  it("arma el comando de ffmpeg con el ancho máximo y CRF configurados", async () => {
    readFileMock.mockResolvedValue(new Uint8Array(10)); // resultado mas chico que el original

    const input = makeFile("clip.mov", 1000);
    await compressVideo(input);

    expect(execMock).toHaveBeenCalledTimes(1);
    const args = execMock.mock.calls[0][0] as string[];

    expect(args).toContain("-crf");
    expect(args[args.indexOf("-crf") + 1]).toBe(String(VIDEO_CRF));
    expect(args).toContain("-vf");
    expect(args[args.indexOf("-vf") + 1]).toContain(String(MAX_VIDEO_WIDTH));
    expect(args).toContain("libx264");
    expect(args).toContain("aac");
  });

  it("devuelve el archivo comprimido cuando pesa menos que el original", async () => {
    const input = makeFile("clip.mp4", 1000);
    readFileMock.mockResolvedValue(new Uint8Array(200)); // bien mas chico

    const result = await compressVideo(input);

    expect(result.size).toBe(200);
    expect(result.type).toBe("video/mp4");
    expect(result.name).toBe("clip.mp4");
  });

  it("nunca empeora: si el resultado comprimido pesa igual o mas que el original, devuelve el original sin tocar", async () => {
    const input = makeFile("clip.mp4", 100);
    readFileMock.mockResolvedValue(new Uint8Array(500)); // "comprimido" termino pesando mas

    const result = await compressVideo(input);

    expect(result).toBe(input);
    expect(result.size).toBe(100);
  });

  it("tira VideoProcessingError si ffmpeg.exec devuelve un codigo de error", async () => {
    execMock.mockResolvedValue(1);
    readFileMock.mockResolvedValue(new Uint8Array(10));

    const input = makeFile("corrupto.mp4", 1000);

    await expect(compressVideo(input)).rejects.toBeInstanceOf(VideoProcessingError);
  });

  it("intenta limpiar los archivos temporales del filesystem virtual incluso si falla", async () => {
    execMock.mockResolvedValue(1);
    readFileMock.mockResolvedValue(new Uint8Array(10));

    const input = makeFile("corrupto.mp4", 1000);

    await expect(compressVideo(input)).rejects.toThrow();
    expect(deleteFileMock).toHaveBeenCalledTimes(2); // input y output
  });

  it("propaga el progreso a través del callback onProgress", async () => {
    readFileMock.mockResolvedValue(new Uint8Array(10));
    const input = makeFile("clip.mp4", 1000);

    const progressUpdates: number[] = [];
    onMock.mockImplementation((event: string, cb: (data: { progress: number }) => void) => {
      if (event === "progress") {
        cb({ progress: 0.5 });
      }
    });

    await compressVideo(input, (ratio) => progressUpdates.push(ratio));

    expect(progressUpdates).toContain(0.5);
  });

  it("tira VideoProcessingError si falla la carga del core de ffmpeg", async () => {
    // El singleton que cachea la instancia cargada de ffmpeg (para no
    // re-descargar el core de 31MB en cada video) vive en el modulo — si
    // algun test anterior ya cargo exitosamente, este test no ejercitaria
    // el path de fallo. vi.resetModules() + reimport da una instancia de
    // modulo fresca con el singleton en null, sin depender del orden en
    // que corren los demas tests de este archivo.
    vi.resetModules();
    loadMock.mockRejectedValue(new Error("network error downloading wasm"));

    const freshModule = await import("./video-compression");

    const input = makeFile("clip.mp4", 1000);

    await expect(freshModule.compressVideo(input)).rejects.toBeInstanceOf(
      freshModule.VideoProcessingError
    );
  });
});
