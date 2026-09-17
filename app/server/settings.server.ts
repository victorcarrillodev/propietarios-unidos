import { eq } from "drizzle-orm";
import { settings } from "~/db/schema";
import { resolveSiteSettings, type SiteSettings } from "~/lib/site-settings";
import { db } from "./db.server";

const SITE_KEY = "site";
const CACHE_TTL_MS = 5 * 60_000;

// La configuración se lee en cada página pública; la guardamos en memoria
// y se invalida al guardar cambios desde el panel.
let cache: { value: SiteSettings; expiresAt: number } | null = null;

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SITE_KEY))
    .limit(1);
  const value = resolveSiteSettings(row?.value);
  cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function saveSiteSettings(value: SiteSettings) {
  await db
    .insert(settings)
    .values({ key: SITE_KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  cache = null;
}
