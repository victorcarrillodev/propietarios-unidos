import { asc, count, eq, sql } from "drizzle-orm";
import { HandCoins, Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  PageHeader,
  SelectField,
  SubmitButton,
  TextField,
} from "~/components/ui";
import { fees, payments } from "~/db/schema";
import { centsToInput, formatMoney } from "~/lib/format";
import { FEE_FREQUENCY_LABELS, toOptions } from "~/lib/labels";
import { feeSchema } from "~/lib/schemas/admin";
import { validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/fees";

export async function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const rows = await db
    .select({
      id: fees.id,
      name: fees.name,
      description: fees.description,
      amountCents: fees.amountCents,
      frequency: fees.frequency,
      active: fees.active,
      paymentCount: sql<number>`(select count(*)::int from payments where payments.fee_id = ${fees.id})`,
    })
    .from(fees)
    .orderBy(sql`${fees.active} desc`, asc(fees.name));
  return { rows };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "finance");
  const formData = await request.formData();
  const intent = getIntent(formData);
  const feeId = String(formData.get("feeId") ?? "");

  if (intent === "create" || intent === "update") {
    const result = validateForm(feeSchema, formData);
    if (!result.success) {
      return data({ intent, feeId, errors: result.errors as FieldErrors, values: result.values }, { status: 400 });
    }
    const { amount, ...fee } = result.data;
    if (intent === "create") {
      await db.insert(fees).values({ ...fee, amountCents: amount });
      await audit({ userId: user.id, action: "fee.create", summary: `Creó la cuota "${fee.name}" de ${formatMoney(amount)}` });
      return redirectWithToast("/admin/cuotas", { type: "success", message: "Cuota creada." });
    }
    requireId(feeId);
    await db.update(fees).set({ ...fee, amountCents: amount }).where(eq(fees.id, feeId));
    await audit({ userId: user.id, action: "fee.update", entityType: "fee", entityId: feeId, summary: `Actualizó la cuota "${fee.name}"` });
    return redirectWithToast("/admin/cuotas", { type: "success", message: "Cuota actualizada." });
  }

  if (intent === "toggle") {
    requireId(feeId);
    const [fee] = await db
      .update(fees)
      .set({ active: sql`not ${fees.active}` })
      .where(eq(fees.id, feeId))
      .returning({ name: fees.name, active: fees.active });
    if (fee) {
      await audit({
        userId: user.id,
        action: "fee.toggle",
        entityType: "fee",
        entityId: feeId,
        summary: `${fee.active ? "Activó" : "Desactivó"} la cuota "${fee.name}"`,
      });
    }
    return redirectWithToast("/admin/cuotas", { type: "success", message: fee?.active ? "Cuota activada." : "Cuota desactivada." });
  }

  if (intent === "delete") {
    requireId(feeId);
    const [{ total }] = await db.select({ total: count() }).from(payments).where(eq(payments.feeId, feeId));
    if (total > 0) {
      return redirectWithToast("/admin/cuotas", {
        type: "error",
        message: "La cuota tiene pagos asociados; desactívala en lugar de eliminarla.",
      });
    }
    const [fee] = await db.delete(fees).where(eq(fees.id, feeId)).returning({ name: fees.name });
    if (fee) await audit({ userId: user.id, action: "fee.delete", summary: `Eliminó la cuota "${fee.name}"` });
    return redirectWithToast("/admin/cuotas", { type: "success", message: "Cuota eliminada." });
  }

  throw data("Acción no válida", { status: 400 });
}

type FeeFormProps = {
  intent: "create" | "update";
  fee?: { id: string; name: string; description: string | null; amountCents: number; frequency: string };
  errors?: FieldErrors;
  values?: Record<string, string>;
};

function FeeForm({ intent, fee, errors, values }: FeeFormProps) {
  const prefix = fee ? `fee-${fee.id}` : "fee-new";
  return (
    <Form method="post" className="grid gap-4 md:grid-cols-2">
      {fee && <input type="hidden" name="feeId" value={fee.id} />}
      <TextField id={`${prefix}-name`} label="Nombre" name="name" defaultValue={values?.name ?? fee?.name} error={errors?.name} required placeholder="Cuota anual" />
      <SelectField
        id={`${prefix}-frequency`}
        label="Periodicidad"
        name="frequency"
        options={toOptions(FEE_FREQUENCY_LABELS)}
        defaultValue={values?.frequency ?? fee?.frequency ?? "anual"}
        error={errors?.frequency}
      />
      <TextField
        id={`${prefix}-amount`}
        label="Monto (MXN)"
        name="amount"
        inputMode="decimal"
        defaultValue={values?.amount ?? (fee ? centsToInput(fee.amountCents) : "")}
        error={errors?.amount}
        required
      />
      <TextField
        id={`${prefix}-description`}
        label="Descripción"
        name="description"
        defaultValue={values?.description ?? fee?.description ?? ""}
        error={errors?.description}
      />
      <div className="md:col-span-2">
        <SubmitButton intent={intent} size="sm">
          {intent === "create" ? "Crear cuota" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </Form>
  );
}

export default function Fees({ loaderData, actionData }: Route.ComponentProps) {
  const { rows } = loaderData;
  const createErrors = actionData?.intent === "create" ? actionData : undefined;

  return (
    <>
      <PageHeader
        title="Cuotas"
        description="Define las cuotas y aportaciones que pagan los miembros. Se usan para calcular adeudos."
        back={{ to: "/admin/pagos", label: "Pagos" }}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {rows.length === 0 && (
            <EmptyState icon={HandCoins} title="Sin cuotas" description="Crea la primera cuota con el formulario." />
          )}
          {rows.map((fee) => {
            const editErrors = actionData?.intent === "update" && actionData.feeId === fee.id ? actionData : undefined;
            return (
              <Card key={fee.id} className={fee.active ? undefined : "opacity-75"}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-stone-900">{fee.name}</h2>
                      <Badge tone="earth">{FEE_FREQUENCY_LABELS[fee.frequency]}</Badge>
                      {!fee.active && <Badge>Inactiva</Badge>}
                    </div>
                    {fee.description && <p className="mt-1 text-sm text-stone-600">{fee.description}</p>}
                    <p className="mt-1 text-xs text-stone-500">{fee.paymentCount} pago(s) registrados</p>
                  </div>
                  <p className="text-2xl font-semibold text-stone-900">{formatMoney(fee.amountCents)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                  <Form method="post">
                    <input type="hidden" name="feeId" value={fee.id} />
                    <Button type="submit" name="intent" value="toggle" variant="secondary" size="sm">
                      {fee.active ? "Desactivar" : "Activar"}
                    </Button>
                  </Form>
                  {fee.paymentCount === 0 && (
                    <Form method="post">
                      <input type="hidden" name="feeId" value={fee.id} />
                      <ConfirmButton name="intent" value="delete" variant="ghost" size="sm" message={`¿Eliminar la cuota "${fee.name}"?`}>
                        <Trash2 aria-hidden /> Eliminar
                      </ConfirmButton>
                    </Form>
                  )}
                </div>
                <details className="mt-3" open={Boolean(editErrors)}>
                  <summary className="cursor-pointer text-sm font-medium text-forest-700">Editar cuota</summary>
                  <div className="mt-4">
                    <FeeForm intent="update" fee={fee} errors={editErrors?.errors} values={editErrors?.values} />
                  </div>
                </details>
              </Card>
            );
          })}
        </div>

        <Card title="Nueva cuota" className="h-fit">
          <FeeForm intent="create" errors={createErrors?.errors} values={createErrors?.values} />
        </Card>
      </div>
    </>
  );
}
