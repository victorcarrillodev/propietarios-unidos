import { asc, sql } from "drizzle-orm";
import { members } from "~/db/schema";
import { todayISO } from "~/lib/format";
import { MEMBER_STATUS_LABELS, MEMBER_TYPE_LABELS } from "~/lib/labels";
import { audit } from "~/server/audit.server";
import { csvResponse, toCsv } from "~/server/csv.server";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { memberWhere, readMemberFilters } from "~/server/queries/members.server";
import type { Route } from "./+types/export";

export async function loader({ context, url }: Route.LoaderArgs) {
  const user = requireModule(context, "members");
  const rows = await db
    .select({
      memberNumber: members.memberNumber,
      fullName: members.fullName,
      memberType: members.memberType,
      status: members.status,
      email: members.email,
      phone: members.phone,
      address: members.address,
      joinedOn: members.joinedOn,
      notes: members.notes,
      propertyNames: sql<string | null>`(select string_agg(p.name, '; ' order by p.created_at) from properties p where p.member_id = ${members.id})`,
      totalArea: sql<string | null>`(select sum(p.area_ha)::text from properties p where p.member_id = ${members.id})`,
    })
    .from(members)
    .where(memberWhere(readMemberFilters(url)))
    .orderBy(asc(members.fullName));

  await audit({ userId: user.id, action: "member.export", summary: `Exportó ${rows.length} miembros a CSV` });

  const csv = toCsv(
    ["No.", "Nombre", "Tipo", "Estado", "Correo", "Teléfono", "Domicilio", "Fecha de ingreso", "Predios", "Superficie (ha)", "Notas"],
    rows.map((row) => [
      row.memberNumber,
      row.fullName,
      MEMBER_TYPE_LABELS[row.memberType],
      MEMBER_STATUS_LABELS[row.status],
      row.email,
      row.phone,
      row.address,
      row.joinedOn,
      row.propertyNames,
      row.totalArea,
      row.notes,
    ]),
  );
  return csvResponse(`miembros-${todayISO()}.csv`, csv);
}
