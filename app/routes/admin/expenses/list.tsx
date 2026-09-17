import { count, desc, sql } from "drizzle-orm";
import { Download, Plus, Receipt } from "lucide-react";
import { Link, useLocation } from "react-router";
import { FilterBar, FilterDate, FilterSelect, SearchInput } from "~/components/admin/filters";
import { ButtonLink, buttonClasses } from "~/components/ui/button";
import { Badge, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui/data";
import { expenses } from "~/db/schema";
import { formatDate, formatMoney } from "~/lib/format";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, toOptions } from "~/lib/labels";
import { pageParam } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { expenseWhere, readExpenseFilters } from "~/server/queries/finance.server";
import type { Route } from "./+types/list";

const PAGE_SIZE = 25;

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const filters = readExpenseFilters(url);
  const page = pageParam(url);
  const where = expenseWhere(filters);

  const [rows, [summary]] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(where)
      .orderBy(desc(expenses.spentOn), desc(expenses.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: count(), sumCents: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::float8`.mapWith(Number) })
      .from(expenses)
      .where(where),
  ]);
  const total = summary?.total ?? 0;
  return { rows, total, sumCents: summary?.sumCents ?? 0, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filters };
}

export default function ExpensesList({ loaderData }: Route.ComponentProps) {
  const { rows, total, sumCents, page, pageCount, filters } = loaderData;
  const location = useLocation();
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        title="Gastos"
        description="Egresos de la asociación: obras, materiales, trámites y más."
        actions={
          <>
            <a href={`/admin/gastos/exportar${location.search}`} className={buttonClasses({ variant: "secondary" })}>
              <Download aria-hidden /> Exportar CSV
            </a>
            <ButtonLink to="/admin/gastos/nuevo">
              <Plus aria-hidden /> Registrar gasto
            </ButtonLink>
          </>
        }
      />

      <FilterBar hasFilters={hasFilters}>
        <SearchInput defaultValue={filters.q} placeholder="Descripción, proveedor o referencia" />
        <FilterSelect name="categoria" label="Categoría" options={toOptions(EXPENSE_CATEGORY_LABELS)} defaultValue={filters.category} allLabel="Todas" />
        <FilterDate name="desde" label="Desde" defaultValue={filters.from} />
        <FilterDate name="hasta" label="Hasta" defaultValue={filters.to} />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 text-sm text-stone-600">
            Total {hasFilters ? "con estos filtros" : "registrado"}:
            <strong className="text-base text-stone-900">{formatMoney(sumCents)}</strong>
          </div>
          <TableContainer>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Descripción</Th>
                <Th>Categoría</Th>
                <Th>Método</Th>
                <Th className="text-right">Monto</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((expense) => (
                <tr key={expense.id} className="hover:bg-stone-50">
                  <Td className="whitespace-nowrap">{formatDate(expense.spentOn)}</Td>
                  <Td>
                    <Link to={`/admin/gastos/${expense.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                      {expense.description}
                    </Link>
                    {(expense.supplier || expense.reference) && (
                      <p className="text-xs text-stone-500">
                        {[expense.supplier, expense.reference && `Ref. ${expense.reference}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <Badge tone="earth">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
                  </Td>
                  <Td>{PAYMENT_METHOD_LABELS[expense.method]}</Td>
                  <Td className="text-right font-medium whitespace-nowrap text-stone-900 tabular-nums">
                    {formatMoney(expense.amountCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No hay gastos con esos filtros" : "Aún no hay gastos registrados"}
          description="Registrar los gastos permite rendir cuentas claras a los miembros."
          action={
            <ButtonLink to="/admin/gastos/nuevo">
              <Plus aria-hidden /> Registrar gasto
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
