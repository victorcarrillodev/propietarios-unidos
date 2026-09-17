import { data } from "react-router";
import { MemberForm } from "~/components/admin/member-form";
import { PageHeader } from "~/components/ui/data";
import { members } from "~/db/schema";
import { todayISO } from "~/lib/format";
import { memberSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "members");
  return { today: todayISO() };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "members");
  const result = validateForm(memberSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [member] = await db
    .insert(members)
    .values(result.data)
    .returning({ id: members.id, memberNumber: members.memberNumber, fullName: members.fullName });

  await audit({
    userId: user.id,
    action: "member.create",
    entityType: "member",
    entityId: member!.id,
    summary: `Registró al miembro No. ${member!.memberNumber}: ${member!.fullName}`,
  });
  return redirectWithToast(`/admin/miembros/${member!.id}`, { type: "success", message: "Miembro registrado." });
}

export default function NewMember({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Nuevo miembro" back={{ to: "/admin/miembros", label: "Miembros" }} />
      <MemberForm
        member={{
          fullName: "",
          memberType: "propietario",
          status: "activo",
          email: null,
          phone: null,
          address: null,
          joinedOn: loaderData.today,
          notes: null,
        }}
        errors={actionData?.errors}
        values={actionData?.values}
        submitLabel="Registrar miembro"
        cancelTo="/admin/miembros"
      />
    </>
  );
}
