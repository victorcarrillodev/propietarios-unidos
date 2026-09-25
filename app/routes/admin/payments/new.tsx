import { asc, eq, inArray } from "drizzle-orm";
import { useRef } from "react";
import { data, Form } from "react-router";
import {
  Alert,
  ButtonLink,
  Card,
  PageHeader,
  SelectField,
  SubmitButton,
  TextareaField,
  TextField,
} from "~/components/ui";
import { fees, members, payments } from "~/db/schema";
import { centsToInput, currentMonth, currentYear, formatMoney, parseMoneyToCents, todayISO } from "~/lib/format";
import { FEE_FREQUENCY_LABELS, PAYMENT_CONCEPT_LABELS, PAYMENT_METHOD_LABELS, toOptions } from "~/lib/labels";
import { paymentSchema } from "~/lib/schemas/admin";
import { formValues, validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const [memberOptions, feeOptions] = await Promise.all([
    db
      .select({ id: members.id, memberNumber: members.memberNumber, fullName: members.fullName, status: members.status })
      .from(members)
      .where(inArray(members.status, ["activo", "pendiente"]))
      .orderBy(asc(members.fullName)),
    db
      .select({ id: fees.id, name: fees.name, amountCents: fees.amountCents, frequency: fees.frequency })
      .from(fees)
      .where(eq(fees.active, true))
      .orderBy(asc(fees.name)),
  ]);

  const params = url.searchParams;
  const memberId = params.get("miembro") ?? "";
  const feeId = params.get("cuota") ?? "";
  const period = params.get("periodo") ?? "";
  const amount = parseMoneyToCents(params.get("monto") ?? "");
  const fee = feeOptions.find((option) => option.id === feeId);

  return {
    memberOptions,
    feeOptions,
    defaults: {
      memberId: memberOptions.some((m) => m.id === memberId) ? memberId : "",
      feeId: fee?.id ?? "",
      concept: "cuota",
      period: /^\d{4}(-\d{2})?$/.test(period) ? period : "",
      amount: amount ? centsToInput(amount) : fee ? centsToInput(fee.amountCents) : "",
      paidOn: todayISO(),
    },
    currentYear: String(currentYear()),
    currentMonth: currentMonth(),
  };
}

type ActionResult = { errors: FieldErrors; values: Record<string, string>; formError?: string };

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "finance");
  const formData = await request.formData();
  const result = validateForm(paymentSchema, formData);
  if (!result.success) return data<ActionResult>({ errors: result.errors, values: result.values }, { status: 400 });

  const { amount, ...payment } = result.data;
  let payerLabel = payment.payerName ?? "";

  if (payment.memberId) {
    const [member] = await db
      .select({ fullName: members.fullName })
      .from(members)
      .where(eq(members.id, payment.memberId))
      .limit(1);
    if (!member) {
      return data<ActionResult>(
        { errors: { memberId: ["El miembro no existe"] }, values: formValues(formData) },
        { status: 400 },
      );
    }
    payerLabel = member.fullName;
    payment.payerName = null;
  }
  if (payment.feeId) {
    const [fee] = await db.select({ id: fees.id }).from(fees).where(eq(fees.id, payment.feeId)).limit(1);
    if (!fee) {
      return data<ActionResult>({ errors: { feeId: ["La cuota no existe"] }, values: formValues(formData) }, { status: 400 });
    }
  }

  const [created] = await db
    .insert(payments)
    .values({ ...payment, amountCents: amount, recordedBy: user.id })
    .returning({ id: payments.id, folio: payments.folio });

  await audit({
    userId: user.id,
    action: "payment.create",
    entityType: "payment",
    entityId: created!.id,
    summary: `Registró el pago folio ${created!.folio} de ${payerLabel} por ${formatMoney(amount)}`,
  });
  return redirectWithToast(`/admin/pagos/${created!.id}`, {
    type: "success",
    message: `Pago registrado con folio ${created!.folio}.`,
  });
}

export default function NewPayment({ loaderData, actionData }: Route.ComponentProps) {
  const { memberOptions, feeOptions, defaults } = loaderData;
  const errors = actionData?.errors;
  const values = actionData?.values;
  const formRef = useRef<HTMLFormElement>(null);

  // Al elegir una cuota se sugieren monto, concepto y periodo (se pueden cambiar).
  function handleFeeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const form = formRef.current;
    const fee = feeOptions.find((option) => option.id === event.target.value);
    if (!form || !fee) return;
    const set = (name: string, value: string) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value;
    };
    set("amount", centsToInput(fee.amountCents));
    set("concept", "cuota");
    set("period", fee.frequency === "anual" ? loaderData.currentYear : fee.frequency === "mensual" ? loaderData.currentMonth : "");
  }

  return (
    <>
      <PageHeader title="Registrar pago" back={{ to: "/admin/pagos", label: "Pagos" }} />
      <Form method="post" ref={formRef}>
        <Card>
          {actionData?.formError && <Alert tone="error" className="mb-5">{actionData.formError}</Alert>}
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Miembro"
              name="memberId"
              options={memberOptions.map((m) => ({
                value: m.id,
                label: `${m.fullName} (No. ${m.memberNumber})${m.status === "pendiente" ? " · pendiente" : ""}`,
              }))}
              placeholder="— No es miembro (donativo externo) —"
              defaultValue={values?.memberId ?? defaults.memberId}
              error={errors?.memberId}
              hint="Si quien paga no es miembro, deja esta opción vacía y escribe su nombre."
            />
            <TextField
              label="Nombre de quien paga (si no es miembro)"
              name="payerName"
              defaultValue={values?.payerName}
              error={errors?.payerName}
            />
            <SelectField
              label="Cuota"
              name="feeId"
              options={feeOptions.map((fee) => ({
                value: fee.id,
                label: `${fee.name} · ${formatMoney(fee.amountCents)} (${FEE_FREQUENCY_LABELS[fee.frequency].toLowerCase()})`,
              }))}
              placeholder="Sin cuota asociada"
              defaultValue={values?.feeId ?? defaults.feeId}
              error={errors?.feeId}
              onChange={handleFeeChange}
            />
            <SelectField
              label="Concepto"
              name="concept"
              options={toOptions(PAYMENT_CONCEPT_LABELS)}
              defaultValue={values?.concept ?? defaults.concept}
              error={errors?.concept}
              required
            />
            <TextField
              label="Periodo"
              name="period"
              placeholder="2026 o 2026-09"
              defaultValue={values?.period ?? defaults.period}
              error={errors?.period}
              hint="Año (cuota anual) o año-mes (cuota mensual)."
            />
            <TextField
              label="Monto (MXN)"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={values?.amount ?? defaults.amount}
              error={errors?.amount}
              required
            />
            <TextField
              label="Fecha de pago"
              name="paidOn"
              type="date"
              defaultValue={values?.paidOn ?? defaults.paidOn}
              error={errors?.paidOn}
              required
            />
            <SelectField
              label="Método de pago"
              name="method"
              options={toOptions(PAYMENT_METHOD_LABELS)}
              defaultValue={values?.method ?? "efectivo"}
              error={errors?.method}
              required
            />
            <TextField
              label="Referencia"
              name="reference"
              placeholder="Folio bancario, núm. de transferencia…"
              defaultValue={values?.reference}
              error={errors?.reference}
            />
            <TextareaField
              label="Notas"
              name="notes"
              rows={2}
              defaultValue={values?.notes}
              error={errors?.notes}
              className="md:col-span-2"
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-5">
            <ButtonLink to="/admin/pagos" variant="ghost">
              Cancelar
            </ButtonLink>
            <SubmitButton pendingText="Registrando…">Registrar pago</SubmitButton>
          </div>
        </Card>
      </Form>
    </>
  );
}
