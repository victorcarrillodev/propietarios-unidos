import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { documents } from "~/db/schema";
import { db } from "~/server/db.server";
import { fileResponse } from "~/server/storage.server";
import type { Route } from "./+types/public-document";

export async function loader({ params, url }: Route.LoaderArgs) {
  const id = z.uuid().safeParse(params.documentId);
  if (!id.success) return new Response("No encontrado", { status: 404 });

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id.data), eq(documents.isPublic, true)))
    .limit(1);
  if (!doc) return new Response("No encontrado", { status: 404 });

  return fileResponse(doc.storageKey, {
    contentType: doc.mimeType,
    fileName: doc.fileName,
    download: url.searchParams.has("descargar"),
    cacheControl: "public, max-age=300",
  });
}
