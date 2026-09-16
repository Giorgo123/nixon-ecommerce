type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In-memory: resets on cold start and isn't shared across serverless
// instances. Good enough as a first line of defense against casual
// brute-forcing; upgrade to a shared store (e.g. Upstash Redis) if the
// deploy target runs multiple concurrent instances.
export function checkRateLimit(key: string, maxAttempts = MAX_ATTEMPTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= maxAttempts) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function getClientIp(request: Request) {
  // El primer valor de X-Forwarded-For lo puede mandar el propio cliente
  // (spoofeable) — cada proxy real por el que pasa la request AGREGA su
  // propio valor al final, así que el último es el que efectivamente se
  // conectó al servidor (en Vercel, su edge). Confiar en el primero permite
  // esquivar el rate-limit mandando un header distinto en cada intento.
  const header = request.headers.get("x-forwarded-for");
  if (!header) return "unknown";
  const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "unknown";
}
