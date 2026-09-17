import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { EventForm } from "~/components/admin/event-form";
import { ConfirmButton } from "~/components/ui/button";
import { Card, PageHeader } from "~/components/ui/data";
import { events } from "~/db/schema";
import { eventSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "content");
  const id = requireId(params.eventId, "Evento no encontrado");
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) throw notFound("Evento no encontrado");
  return { event };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "content");
  const id = requireId(params.eventId, "Evento no encontrado");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning({ title: events.title });
    if (!deleted) throw notFound("Evento no encontrado");
    await audit({ userId: user.id, action: "event.delete", summary: `Eliminó el evento "${deleted.title}"` });
    return redirectWithToast("/admin/eventos", { type: "success", message: "Evento eliminado." });
  }

  const result = validateForm(eventSchema, formData);
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [updated] = await db.update(events).set(result.data).where(eq(events.id, id)).returning({ id: events.id });
  if (!updated) throw notFound("Evento no encontrado");
  await audit({
    userId: user.id,
    action: "event.update",
    entityType: "event",
    entityId: id,
    summary: `Actualizó el evento "${result.data.title}"`,
  });
  return redirectWithToast("/admin/eventos", { type: "success", message: "Evento actualizado." });
}

export default function EditEvent({ loaderData, actionData }: Route.ComponentProps) {
  const { event } = loaderData;
  return (
    <>
      <PageHeader title="Editar evento" back={{ to: "/admin/eventos", label: "Eventos" }} />
      <div className="space-y-6">
        <EventForm
          event={event}
          errors={actionData?.errors}
          values={actionData?.values}
          submitLabel="Guardar cambios"
          cancelTo="/admin/eventos"
        />
        <Card title="Eliminar evento">
          <Form method="post" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">El evento dejará de mostrarse en la agenda.</p>
            <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message={`¿Eliminar "${event.title}"?`}>
              <Trash2 aria-hidden /> Eliminar
            </ConfirmButton>
          </Form>
        </Card>
      </div>
    </>
  );
}
