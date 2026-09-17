import { auditLogs } from "~/db/schema";
import { db } from "./db.server";

type AuditInput = {
  userId: string | null;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
};

/** Registra una acción en la bitácora de auditoría. Nunca interrumpe la operación principal. */
export async function audit({ userId, action, summary, entityType, entityId }: AuditInput) {
  try {
    await db.insert(auditLogs).values({ userId, action, summary, entityType, entityId });
  } catch (error) {
    console.error("No se pudo registrar la auditoría", error);
  }
}
