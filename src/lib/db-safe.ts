// Prisma reporta los fallos de conexión contra la base con estos códigos. Este
// proyecto apunta a un Postgres remoto detrás del proxy de Railway, y en la
// práctica no aparece solo P1001: también se ve P1002 cuando se agota la
// espera por un slot del pool, P1011 cuando el host remoto corta la conexión a
// mitad del handshake TLS y P1017 cuando el servidor cierra el socket. Los
// cuatro son transitorios y tienen la misma causa (la base no está disponible
// en ese instante), así que se detectan juntos.
const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1011", "P1017"]);

// Se matchean los mensajes además de los códigos porque, según el camino que
// bajó el error, el `code` puede venir sin serializar (por ejemplo cuando la
// excepción ya cruzó al cliente). Los mensajes son los que prints Prisma.
const CONNECTION_ERROR_MESSAGES = [
  "Can't reach database server",
  "Timed out fetching a new connection from the connection pool",
  "Error opening a TLS connection",
  "Server has closed the connection",
];

export function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === "string" && CONNECTION_ERROR_CODES.has(code)) return true;

  return CONNECTION_ERROR_MESSAGES.some((message) => error.message.includes(message));
}
