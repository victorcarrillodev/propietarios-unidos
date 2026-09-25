import { Form } from "react-router";
import { ButtonLink, Card, CheckboxField, SelectField, SubmitButton, TextField } from "~/components/ui";
import { USER_ROLES, type UserRole } from "~/lib/enums";
import { ROLE_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Acceso total, incluidos usuarios, configuración del sitio y auditoría.",
  tesoreria: "Miembros, pagos, cuotas, adeudos, gastos, documentos y bitácora.",
  secretaria: "Miembros, bitácora, documentos, bandeja y contenido del sitio.",
  comunicacion: "Bitácora, bandeja (reportes, solicitudes y mensajes) y contenido del sitio.",
};

type Props = {
  mode: "create" | "edit";
  user?: { name: string; email: string; role: UserRole; active: boolean };
  errors?: FieldErrors;
  values?: Record<string, string>;
  isSelf?: boolean;
  submitLabel: string;
};

export function UserForm({ mode, user, errors, values, isSelf = false, submitLabel }: Props) {
  const active = values ? values.active === "on" : (user?.active ?? true);
  return (
    <Form method="post">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Nombre" name="name" defaultValue={values?.name ?? user?.name} error={errors?.name} required />
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={values?.email ?? user?.email}
              error={errors?.email}
              required
              hint="Con este correo inicia sesión."
            />
            <SelectField
              label="Rol"
              name="role"
              options={toOptions(ROLE_LABELS)}
              defaultValue={values?.role ?? user?.role ?? "secretaria"}
              error={errors?.role}
              disabled={isSelf}
              required
              hint={isSelf ? "No puedes cambiar tu propio rol." : undefined}
            />
            <TextField
              label={mode === "create" ? "Contraseña" : "Nueva contraseña"}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              error={errors?.password}
              required={mode === "create"}
              hint={mode === "create" ? "Mínimo 10 caracteres." : "Déjala vacía para conservar la actual."}
            />
            {mode === "edit" && (
              <CheckboxField
                label="Usuario activo"
                name="active"
                defaultChecked={active}
                disabled={isSelf}
                hint={isSelf ? "No puedes desactivar tu propia cuenta." : "Si lo desactivas, se cerrarán sus sesiones y no podrá entrar."}
                className="md:col-span-2"
              />
            )}
            {isSelf && (
              <>
                <input type="hidden" name="role" value={user?.role} />
                {user?.active && <input type="hidden" name="active" value="on" />}
              </>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-stone-100 pt-5">
            <ButtonLink to="/admin/usuarios" variant="ghost">
              Cancelar
            </ButtonLink>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </Card>

        <Card title="Roles y permisos" className="h-fit">
          <dl className="space-y-3.5 text-sm">
            {USER_ROLES.map((role) => (
              <div key={role}>
                <dt className="font-semibold text-stone-900">{ROLE_LABELS[role]}</dt>
                <dd className="mt-0.5 text-xs text-stone-600 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Form>
  );
}
