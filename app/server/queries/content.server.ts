import { and, eq, like, ne, or } from "drizzle-orm";
import { posts } from "~/db/schema";
import { slugify } from "~/lib/utils";
import { likeEscape } from "~/lib/validation";
import { db } from "../db.server";

/** Devuelve un slug libre: "jornada-de-limpieza", "jornada-de-limpieza-2", … */
export async function uniquePostSlug(source: string, excludeId?: string) {
  const base = slugify(source) || "noticia";
  const rows = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      and(
        or(eq(posts.slug, base), like(posts.slug, `${likeEscape(base)}-%`)),
        excludeId ? ne(posts.id, excludeId) : undefined,
      ),
    );
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
