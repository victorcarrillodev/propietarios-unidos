import { eq } from "drizzle-orm";
import { data } from "react-router";
import { MemberForm } from "~/components/admin/member-form";
import { PageHeader } from "~/components/ui/data";
import { members } from "~/db/schema";
import { memberSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "members");
  const id = requireId(params.memberId, "Miembro no encontrado");
  const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!member) throw notFound("Miembro no encontrado");
  return { member };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "members");
  const id = requireId(params.memberId, "Miembro no encontrado");
  const result = validateForm(memberSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [member] = await db
    .update(members)
    .set(result.data)
    .where(eq(members.id, id))
    .returning({ id: members.id, fullName: members.fullName });
  if (!member) throw notFound("Miembro no encontrado");

  await audit({
    userId: user.id,
    action: "member.update",
    entityType: "member",
    entityId: id,
    summary: `Actualizó los datos de ${member.fullName}`,
  });
  return redirectWithToast(`/admin/miembros/${id}`, { type: "success", message: "Cambios guardados." });
}

export default function EditMember({ loaderData, actionData }: Route.ComponentProps) {
  const { member } = loaderData;
  return (
    <>
      <PageHeader title={`Editar: ${member.fullName}`} back={{ to: `/admin/miembros/${member.id}`, label: "Volver al miembro" }} />
      <MemberForm
        member={member}
        errors={actionData?.errors}
        values={actionData?.values}
        submitLabel="Guardar cambios"
        cancelTo={`/admin/miembros/${member.id}`}
      />
    </>
  );
}
