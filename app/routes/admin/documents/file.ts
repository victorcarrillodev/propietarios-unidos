import { eq } from "drizzle-orm";
import { documents } from "~/db/schema";
import { db } from "~/server/db.server";
import { notFound, requireId, requireModule } from "~/server/guards.server";
import { fileResponse } from "~/server/storage.server";
import type { Route } from "./+types/file";

// Descarga de documentos (públicos o internos) para usuarios con permiso.
export async function loader({ context, params, url }: Route.LoaderArgs) {
  requireModule(context, "documents");
  const id = requireId(params.documentId, "Documento no encontrado");
  const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc) throw notFound("Documento no encontrado");

  return fileResponse(doc.storageKey, {
    contentType: doc.mimeType,
    fileName: doc.fileName,
    download: url.searchParams.has("descargar"),
  });
}
