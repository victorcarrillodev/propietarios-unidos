import { desc } from "drizzle-orm";
import { expenses } from "~/db/schema";
import { centsToInput, todayISO } from "~/lib/format";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "~/lib/labels";
import { audit } from "~/server/audit.server";
import { csvResponse, toCsv } from "~/server/csv.server";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { expenseWhere, readExpenseFilters } from "~/server/queries/finance.server";
import type { Route } from "./+types/export";

export async function loader({ context, url }: Route.LoaderArgs) {
  const user = requireModule(context, "finance");
  const rows = await db
    .select()
    .from(expenses)
    .where(expenseWhere(readExpenseFilters(url)))
    .orderBy(desc(expenses.spentOn), desc(expenses.createdAt));

  await audit({ userId: user.id, action: "expense.export", summary: `Exportó ${rows.length} gastos a CSV` });

  const csv = toCsv(
    ["Fecha", "Descripción", "Categoría", "Monto", "Proveedor", "Método", "Referencia", "Notas"],
    rows.map((row) => [
      row.spentOn,
      row.description,
      EXPENSE_CATEGORY_LABELS[row.category],
      centsToInput(row.amountCents),
      row.supplier,
      PAYMENT_METHOD_LABELS[row.method],
      row.reference,
      row.notes,
    ]),
  );
  return csvResponse(`gastos-${todayISO()}.csv`, csv);
}
