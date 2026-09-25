import { data } from "react-router";
import { EventForm } from "~/components/admin/forms";
import { PageHeader } from "~/components/ui";
import { events } from "~/db/schema";
import { eventSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "content");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "content");
  const result = validateForm(eventSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [created] = await db
    .insert(events)
    .values({ ...result.data, createdBy: user.id })
    .returning({ id: events.id });
  await audit({
    userId: user.id,
    action: "event.create",
    entityType: "event",
    entityId: created!.id,
    summary: `Creó el evento "${result.data.title}"`,
  });
  return redirectWithToast("/admin/eventos", { type: "success", message: "Evento creado." });
}

export default function NewEvent({ actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Nuevo evento" back={{ to: "/admin/eventos", label: "Eventos" }} />
      <EventForm errors={actionData?.errors} values={actionData?.values} submitLabel="Crear evento" cancelTo="/admin/eventos" />
    </>
  );
}
