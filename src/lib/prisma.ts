import { PrismaClient } from "@prisma/client";

// Prisma tiene dos timeouts por defecto que hay que subir juntos contra una
// base remota:
//
//   - `connect_timeout` (5s): apertura del socket + handshake. El proxy de
//     Railway acepta el TCP enseguida, pero el contenedor Postgres puede
//     tardar bastante más en contestar cuando está frío.
//   - `pool_timeout` (10s): espera por un slot libre del pool. Tiene que ser
//     mayor o igual al anterior, porque si no el request se rinde esperando
//     un slot mientras la primera conexión todavía se está abriendo.
//
// Con los valores por defecto, las primeras consultas después de un arranque
// en frío fallaban con "Can't reach database server" y la página devolvía 500
// hasta que la base terminaba de despertar. Se suben los dos solo si la URL no
// los define, para no pisar la configuración del entorno.
const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;
const DEFAULT_POOL_TIMEOUT_MS = 30_000;

const TIMEOUT_PARAMS = {
  connect_timeout: DEFAULT_CONNECT_TIMEOUT_MS,
  pool_timeout: DEFAULT_POOL_TIMEOUT_MS,
};

function withTimeouts(url: string | undefined): string | undefined {
  if (!url) return url;

  const [base, query = ""] = url.split("?", 2);
  const params = new URLSearchParams(query);

  for (const [key, value] of Object.entries(TIMEOUT_PARAMS)) {
    if (!params.has(key)) params.set(key, String(value));
  }

  return `${base}?${params.toString()}`;
}

// `next dev` re-evalúa los módulos del server en cada guardado (HMR), así que
// sin este cache cada recarga corre `new PrismaClient()` y deja el anterior
// colgado con su pool de conexiones. Esos clientes huérfanos se acumulan hasta
// agotar el límite de conexiones del Postgres, y cuando eso pasa Prisma deja
// de poder abrir conexiones y vuelve a tirar "Can't reach database server" en
// cualquier página que consulte la DB. Es el patrón que recomienda Prisma: una
// sola instancia reutilizada, cacheada en globalThis fuera de producción.
const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

const prisma =
  globalForPrisma.prismaClient ??
  new PrismaClient({
    datasources: { db: { url: withTimeouts(process.env.DATABASE_URL) } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClient = prisma;

export default prisma;
