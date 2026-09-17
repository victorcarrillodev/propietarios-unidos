import { eq } from "drizzle-orm";
import { data } from "react-router";
import { UserForm } from "~/components/admin/user-form";
import { PageHeader } from "~/components/ui/data";
import { users } from "~/db/schema";
import { ROLE_LABELS } from "~/lib/labels";
import { newUserSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { hashPassword } from "~/server/auth.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "users");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const currentUser = requireModule(context, "users");
  const formData = await request.formData();
  const result = validateForm(newUserSchema, formData);
  if (!result.success) {
    const { password: _password, ...values } = result.values;
    return data({ errors: result.errors, values }, { status: 400 });
  }
  const { password, ...user } = result.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email)).limit(1);
  if (existing) {
    return data(
      { errors: { email: ["Ya existe un usuario con este correo"] }, values: { name: user.name, email: user.email, role: user.role } },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(users)
    .values({ ...user, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });
  await audit({
    userId: currentUser.id,
    action: "user.create",
    entityType: "user",
    entityId: created!.id,
    summary: `Creó el usuario ${user.email} con rol ${ROLE_LABELS[user.role]}`,
  });
  return redirectWithToast("/admin/usuarios", { type: "success", message: "Usuario creado. Comparte la contraseña de forma segura." });
}

export default function NewUser({ actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Nuevo usuario" back={{ to: "/admin/usuarios", label: "Usuarios" }} />
      <UserForm mode="create" errors={actionData?.errors} values={actionData?.values} submitLabel="Crear usuario" />
    </>
  );
}
