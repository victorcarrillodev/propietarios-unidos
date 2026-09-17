import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { RecordForm } from "~/components/admin/record-form";
import { ConfirmButton } from "~/components/ui/button";
import { Card, PageHeader } from "~/components/ui/data";
import { activityRecords, users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { recordSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "records");
  const id = requireId(params.recordId, "Actividad no encontrada");
  const [row] = await db
    .select({ record: activityRecords, createdByName: users.name })
    .from(activityRecords)
    .leftJoin(users, eq(users.id, activityRecords.createdBy))
    .where(eq(activityRecords.id, id))
    .limit(1);
  if (!row) throw notFound("Actividad no encontrada");
  return row;
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "records");
  const id = requireId(params.recordId, "Actividad no encontrada");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const [deleted] = await db
      .delete(activityRecords)
      .where(eq(activityRecords.id, id))
      .returning({ title: activityRecords.title });
    if (!deleted) throw notFound("Actividad no encontrada");
    await audit({
      userId: user.id,
      action: "record.delete",
      entityType: "record",
      entityId: id,
      summary: `Eliminó de la bitácora: "${deleted.title}"`,
    });
    return redirectWithToast("/admin/bitacora", { type: "success", message: "Actividad eliminada." });
  }

  const result = validateForm(recordSchema, formData);
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [updated] = await db
    .update(activityRecords)
    .set(result.data)
    .where(eq(activityRecords.id, id))
    .returning({ id: activityRecords.id });
  if (!updated) throw notFound("Actividad no encontrada");

  await audit({
    userId: user.id,
    action: "record.update",
    entityType: "record",
    entityId: id,
    summary: `Actualizó en bitácora: "${result.data.title}"`,
  });
  return redirectWithToast("/admin/bitacora", { type: "success", message: "Actividad actualizada." });
}

export default function EditRecord({ loaderData, actionData }: Route.ComponentProps) {
  const { record, createdByName } = loaderData;
  return (
    <>
      <PageHeader
        title="Editar actividad"
        description={`Registrada el ${formatDateTime(record.createdAt)}${createdByName ? ` por ${createdByName}` : ""}`}
        back={{ to: "/admin/bitacora", label: "Bitácora" }}
      />
      <div className="space-y-6">
        <RecordForm
          record={record}
          errors={actionData?.errors}
          values={actionData?.values}
          submitLabel="Guardar cambios"
          cancelTo="/admin/bitacora"
        />
        <Card title="Eliminar actividad">
          <Form method="post" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">La actividad dejará de mostrarse en el panel y en el sitio público.</p>
            <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message="¿Eliminar esta actividad?">
              <Trash2 aria-hidden /> Eliminar
            </ConfirmButton>
          </Form>
        </Card>
      </div>
    </>
  );
}
