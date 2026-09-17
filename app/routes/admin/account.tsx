import { eq } from "drizzle-orm";
import { KeyRound, UserRound } from "lucide-react";
import { data, Form } from "react-router";
import { SubmitButton } from "~/components/ui/button";
import { Card, DescriptionList, PageHeader } from "~/components/ui/data";
import { TextField } from "~/components/ui/form";
import { users } from "~/db/schema";
import { ROLE_LABELS } from "~/lib/labels";
import { changePasswordSchema, profileSchema } from "~/lib/schemas/admin";
import { validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { destroyOtherSessions, hashPassword, verifyPassword } from "~/server/auth.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, getUser } from "~/server/guards.server";
import { rateLimit } from "~/server/rate-limit.server";
import type { Route } from "./+types/account";

export function loader({ context }: Route.LoaderArgs) {
  return { user: getUser(context) };
}

type ActionResult = { intent: string; errors: FieldErrors };

export async function action({ request, context }: Route.ActionArgs) {
  const user = getUser(context);
  const formData = await request.formData();
  const intent = getIntent(formData);

  if (intent === "profile") {
    const result = validateForm(profileSchema, formData);
    if (!result.success) return data<ActionResult>({ intent, errors: result.errors }, { status: 400 });
    await db.update(users).set({ name: result.data.name }).where(eq(users.id, user.id));
    await audit({ userId: user.id, action: "account.profile", summary: "Actualizó su nombre" });
    return redirectWithToast("/admin/mi-cuenta", { type: "success", message: "Datos actualizados." });
  }

  if (intent === "password") {
    const limit = rateLimit(`password-change:${user.id}`, 5, 15 * 60_000);
    if (!limit.allowed) {
      return data<ActionResult>(
        { intent, errors: { currentPassword: ["Demasiados intentos. Espera unos minutos."] } },
        { status: 429 },
      );
    }
    const result = validateForm(changePasswordSchema, formData);
    if (!result.success) return data<ActionResult>({ intent, errors: result.errors }, { status: 400 });

    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(row.passwordHash, result.data.currentPassword))) {
      return data<ActionResult>(
        { intent, errors: { currentPassword: ["La contraseña actual no es correcta"] } },
        { status: 400 },
      );
    }
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(result.data.newPassword) })
      .where(eq(users.id, user.id));
    // Cierra la sesión en otros dispositivos, conserva la actual.
    await destroyOtherSessions(user.id, request);
    await audit({ userId: user.id, action: "account.password", summary: "Cambió su contraseña" });
    return redirectWithToast("/admin/mi-cuenta", {
      type: "success",
      message: "Contraseña actualizada. Se cerraron tus sesiones en otros dispositivos.",
    });
  }

  throw data("Acción no válida", { status: 400 });
}

export default function Account({ loaderData, actionData }: Route.ComponentProps) {
  const { user } = loaderData;
  const profileErrors = actionData?.intent === "profile" ? actionData.errors : undefined;
  const passwordErrors = actionData?.intent === "password" ? actionData.errors : undefined;

  return (
    <>
      <PageHeader title="Mi cuenta" description="Tus datos de acceso al panel." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Mis datos">
          <DescriptionList
            items={[
              { label: "Correo", value: user.email },
              { label: "Rol", value: ROLE_LABELS[user.role] },
            ]}
          />
          <Form method="post" className="mt-6 space-y-4 border-t border-stone-100 pt-5">
            <TextField label="Nombre" name="name" defaultValue={user.name} error={profileErrors?.name} required />
            <SubmitButton intent="profile" variant="secondary">
              <UserRound aria-hidden /> Guardar nombre
            </SubmitButton>
          </Form>
        </Card>

        <Card title="Cambiar contraseña" description="Usa al menos 10 caracteres; una frase fácil de recordar funciona bien.">
          <Form method="post" className="space-y-4">
            <TextField
              label="Contraseña actual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              error={passwordErrors?.currentPassword}
              required
            />
            <TextField
              label="Nueva contraseña"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              error={passwordErrors?.newPassword}
              required
            />
            <TextField
              label="Confirma la nueva contraseña"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              error={passwordErrors?.confirmPassword}
              required
            />
            <SubmitButton intent="password">
              <KeyRound aria-hidden /> Cambiar contraseña
            </SubmitButton>
          </Form>
        </Card>
      </div>
    </>
  );
}
