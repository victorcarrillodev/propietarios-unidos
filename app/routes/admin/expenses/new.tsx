import { data } from "react-router";
import { ExpenseForm } from "~/components/admin/expense-form";
import { PageHeader } from "~/components/ui/data";
import { expenses } from "~/db/schema";
import { formatMoney, todayISO } from "~/lib/format";
import { expenseSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "finance");
  return { today: todayISO() };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "finance");
  const result = validateForm(expenseSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const { amount, ...expense } = result.data;
  const [created] = await db
    .insert(expenses)
    .values({ ...expense, amountCents: amount, recordedBy: user.id })
    .returning({ id: expenses.id });

  await audit({
    userId: user.id,
    action: "expense.create",
    entityType: "expense",
    entityId: created!.id,
    summary: `Registró el gasto "${expense.description}" por ${formatMoney(amount)}`,
  });
  return redirectWithToast("/admin/gastos", { type: "success", message: "Gasto registrado." });
}

export default function NewExpense({ loaderData, actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Registrar gasto" back={{ to: "/admin/gastos", label: "Gastos" }} />
      <ExpenseForm
        expense={{
          category: "caminos",
          description: "",
          amountCents: 0,
          spentOn: loaderData.today,
          supplier: null,
          method: "efectivo",
          reference: null,
          notes: null,
        }}
        values={actionData?.values ?? { amount: "" }}
        errors={actionData?.errors}
        submitLabel="Registrar gasto"
        cancelTo="/admin/gastos"
      />
    </>
  );
}
