import { env } from "./env.server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpieza periódica para que el mapa no crezca indefinidamente.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
cleanup.unref?.();

/**
 * Limitador en memoria por ventana fija. Suficiente para una sola instancia;
 * si escalas a varias instancias usa Redis u otro almacenamiento compartido.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/** IP del cliente. Solo confía en encabezados de proxy si TRUST_PROXY=true. */
export function getClientIp(request: Request) {
  if (env.TRUST_PROXY) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const real = request.headers.get("x-real-ip")?.trim();
    const ip = forwarded || real;
    if (ip) return ip;
  }
  return "local";
}
