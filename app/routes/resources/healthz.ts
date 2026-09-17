import { sql } from "drizzle-orm";
import { db } from "~/server/db.server";

// Verificación de salud para Docker / monitoreo.
export async function loader() {
  try {
    await db.execute(sql`select 1`);
    return new Response("ok", { headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
  } catch {
    return new Response("database unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
