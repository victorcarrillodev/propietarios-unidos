import { eq } from "drizzle-orm";
import { citizenReports } from "~/db/schema";
import { db } from "~/server/db.server";
import { notFound, requireId, requireModule } from "~/server/guards.server";
import { fileResponse } from "~/server/storage.server";
import type { Route } from "./+types/report-photo";

// Fotos de reportes: solo visibles para usuarios del panel con acceso a la bandeja.
export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "inbox");
  const id = requireId(params.reportId, "Reporte no encontrado");
  const index = Number.parseInt(params.index, 10);

  const [report] = await db
    .select({ photoKeys: citizenReports.photoKeys })
    .from(citizenReports)
    .where(eq(citizenReports.id, id))
    .limit(1);
  const key = report && Number.isInteger(index) ? report.photoKeys[index] : undefined;
  if (!key) throw notFound("Foto no encontrada");

  return fileResponse(key, { contentType: "image/webp", cacheControl: "private, max-age=86400" });
}
