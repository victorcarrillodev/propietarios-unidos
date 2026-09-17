import { data } from "react-router";
import { RecordForm } from "~/components/admin/record-form";
import { PageHeader } from "~/components/ui/data";
import { activityRecords } from "~/db/schema";
import { todayISO } from "~/lib/format";
import { recordSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "records");
  return { today: todayISO() };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "records");
  const result = validateForm(recordSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [record] = await db
    .insert(activityRecords)
    .values({ ...result.data, createdBy: user.id })
    .returning({ id: activityRecords.id });

  await audit({
    userId: user.id,
    action: "record.create",
    entityType: "record",
    entityId: record!.id,
    summary: `Registró en bitácora: "${result.data.title}"${result.data.isPublic ? " (pública)" : ""}`,
  });
  return redirectWithToast("/admin/bitacora", { type: "success", message: "Actividad registrada." });
}

export default function NewRecord({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Registrar actividad" back={{ to: "/admin/bitacora", label: "Bitácora" }} />
      <RecordForm
        record={{
          type: "vigilancia",
          title: "",
          description: null,
          occurredOn: loaderData.today,
          location: null,
          participants: null,
          isPublic: false,
        }}
        errors={actionData?.errors}
        values={actionData?.values}
        submitLabel="Guardar actividad"
        cancelTo="/admin/bitacora"
      />
    </>
  );
}
