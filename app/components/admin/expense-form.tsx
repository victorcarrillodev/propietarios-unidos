import { Form } from "react-router";
import { ButtonLink, SubmitButton } from "~/components/ui/button";
import { Card } from "~/components/ui/data";
import { SelectField, TextareaField, TextField } from "~/components/ui/form";
import type { Expense } from "~/db/schema";
import { centsToInput } from "~/lib/format";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  expense?: Pick<Expense, "category" | "description" | "amountCents" | "spentOn" | "supplier" | "method" | "reference" | "notes">;
  errors?: FieldErrors;
  values?: Record<string, string>;
  submitLabel: string;
  cancelTo: string;
};

export function ExpenseForm({ expense, errors, values, submitLabel, cancelTo }: Props) {
  return (
    <Form method="post">
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Descripción"
            name="description"
            placeholder="Ej. Renta de maquinaria para brecha cortafuego"
            defaultValue={values?.description ?? expense?.description}
            error={errors?.description}
            required
            className="md:col-span-2"
          />
          <SelectField
            label="Categoría"
            name="category"
            options={toOptions(EXPENSE_CATEGORY_LABELS)}
            defaultValue={values?.category ?? expense?.category ?? "caminos"}
            error={errors?.category}
            required
          />
          <TextField
            label="Monto (MXN)"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={values?.amount ?? (expense ? centsToInput(expense.amountCents) : "")}
            error={errors?.amount}
            required
          />
          <TextField
            label="Fecha"
            name="spentOn"
            type="date"
            defaultValue={values?.spentOn ?? expense?.spentOn}
            error={errors?.spentOn}
            required
          />
          <TextField
            label="Proveedor"
            name="supplier"
            defaultValue={values?.supplier ?? expense?.supplier ?? ""}
            error={errors?.supplier}
          />
          <SelectField
            label="Método de pago"
            name="method"
            options={toOptions(PAYMENT_METHOD_LABELS)}
            defaultValue={values?.method ?? expense?.method ?? "efectivo"}
            error={errors?.method}
            required
          />
          <TextField
            label="Referencia / factura"
            name="reference"
            defaultValue={values?.reference ?? expense?.reference ?? ""}
            error={errors?.reference}
          />
          <TextareaField
            label="Notas"
            name="notes"
            rows={2}
            defaultValue={values?.notes ?? expense?.notes ?? ""}
            error={errors?.notes}
            className="md:col-span-2"
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-5">
          <ButtonLink to={cancelTo} variant="ghost">
            Cancelar
          </ButtonLink>
          <SubmitButton intent="save">{submitLabel}</SubmitButton>
        </div>
      </Card>
    </Form>
  );
}
