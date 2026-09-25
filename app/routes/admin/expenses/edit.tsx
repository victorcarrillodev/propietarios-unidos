import { eq } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { ExpenseForm } from "~/components/admin/forms";
import { Card, ConfirmButton, PageHeader } from "~/components/ui";
import { expenses } from "~/db/schema";
import { formatDateTime, formatMoney } from "~/lib/format";
import { expenseSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const id = requireId(params.expenseId, "Gasto no encontrado");
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense) throw notFound("Gasto no encontrado");
  return { expense };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "finance");
  const id = requireId(params.expenseId, "Gasto no encontrado");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const [deleted] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning({ description: expenses.description, amountCents: expenses.amountCents });
    if (!deleted) throw notFound("Gasto no encontrado");
    await audit({
      userId: user.id,
      action: "expense.delete",
      entityType: "expense",
      entityId: id,
      summary: `Eliminó el gasto "${deleted.description}" (${formatMoney(deleted.amountCents)})`,
    });
    return redirectWithToast("/admin/gastos", { type: "success", message: "Gasto eliminado." });
  }

  const result = validateForm(expenseSchema, formData);
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });
  const { amount, ...expense } = result.data;
  const [updated] = await db
    .update(expenses)
    .set({ ...expense, amountCents: amount })
    .where(eq(expenses.id, id))
    .returning({ id: expenses.id });
  if (!updated) throw notFound("Gasto no encontrado");

  await audit({
    userId: user.id,
    action: "expense.update",
    entityType: "expense",
    entityId: id,
    summary: `Actualizó el gasto "${expense.description}" (${formatMoney(amount)})`,
  });
  return redirectWithToast("/admin/gastos", { type: "success", message: "Gasto actualizado." });
}

export default function EditExpense({ loaderData, actionData }: Route.ComponentProps) {
  const { expense } = loaderData;
  return (
    <>
      <PageHeader
        title="Editar gasto"
        description={`Registrado el ${formatDateTime(expense.createdAt)}`}
        back={{ to: "/admin/gastos", label: "Gastos" }}
      />
      <div className="space-y-6">
        <ExpenseForm
          expense={expense}
          errors={actionData?.errors}
          values={actionData?.values}
          submitLabel="Guardar cambios"
          cancelTo="/admin/gastos"
        />
        <Card title="Eliminar gasto">
          <Form method="post" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">Si el gasto se registró por error, puedes eliminarlo.</p>
            <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message="¿Eliminar este gasto?">
              <Trash2 aria-hidden /> Eliminar
            </ConfirmButton>
          </Form>
        </Card>
      </div>
    </>
  );
}
