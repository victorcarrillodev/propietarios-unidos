import { and, count, eq, ne } from "drizzle-orm";
import { data } from "react-router";
import { UserForm } from "~/components/admin/forms";
import { PageHeader } from "~/components/ui";
import { users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { ROLE_LABELS } from "~/lib/labels";
import { editUserSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { destroyOtherSessions, hashPassword } from "~/server/auth.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  const currentUser = requireModule(context, "users");
  const id = requireId(params.userId, "Usuario no encontrado");
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) throw notFound("Usuario no encontrado");
  return { user, isSelf: user.id === currentUser.id };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const currentUser = requireModule(context, "users");
  const id = requireId(params.userId, "Usuario no encontrado");
  const [target] = await db
    .select({ id: users.id, role: users.role, active: users.active })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) throw notFound("Usuario no encontrado");
  const isSelf = target.id === currentUser.id;

  const result = validateForm(editUserSchema, await request.formData());
  if (!result.success) {
    const { password: _password, ...values } = result.values;
    return data({ errors: result.errors, values }, { status: 400 });
  }
  const { password, ...changes } = result.data;
  const values = { name: changes.name, email: changes.email, role: changes.role, active: changes.active ? "on" : "" };

  // Nadie puede quitarse a sí mismo el rol de administrador ni desactivarse.
  if (isSelf) {
    changes.role = target.role;
    changes.active = true;
  }

  const [emailTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, changes.email), ne(users.id, id)))
    .limit(1);
  if (emailTaken) {
    return data({ errors: { email: ["Ya existe otro usuario con este correo"] }, values }, { status: 400 });
  }

  // Siempre debe quedar al menos un administrador activo.
  const losesAdmin = target.role === "admin" && target.active && (changes.role !== "admin" || !changes.active);
  if (losesAdmin) {
    const [{ admins }] = await db
      .select({ admins: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, id)));
    if (admins === 0) {
      return data(
        { errors: { role: ["Debe existir al menos un administrador activo. Asigna otro antes de cambiar este."] }, values },
        { status: 400 },
      );
    }
  }

  await db
    .update(users)
    .set({ ...changes, ...(password ? { passwordHash: await hashPassword(password) } : {}) })
    .where(eq(users.id, id));

  if (!changes.active || password) {
    await destroyOtherSessions(id, isSelf ? request : undefined);
  }

  const notes = [
    changes.role !== target.role && `rol: ${ROLE_LABELS[changes.role]}`,
    changes.active !== target.active && (changes.active ? "reactivado" : "desactivado"),
    password && "contraseña restablecida",
  ].filter(Boolean);
  await audit({
    userId: currentUser.id,
    action: "user.update",
    entityType: "user",
    entityId: id,
    summary: `Actualizó al usuario ${changes.email}${notes.length ? ` (${notes.join(", ")})` : ""}`,
  });
  return redirectWithToast("/admin/usuarios", { type: "success", message: "Usuario actualizado." });
}

export default function EditUser({ loaderData, actionData }: Route.ComponentProps) {
  const { user, isSelf } = loaderData;
  return (
    <>
      <PageHeader
        title={user.name}
        description={`Creado el ${formatDateTime(user.createdAt)} · último acceso: ${user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "nunca"}`}
        back={{ to: "/admin/usuarios", label: "Usuarios" }}
      />
      <UserForm
        mode="edit"
        user={user}
        isSelf={isSelf}
        errors={actionData?.errors}
        values={actionData?.values}
        submitLabel="Guardar cambios"
      />
    </>
  );
}
