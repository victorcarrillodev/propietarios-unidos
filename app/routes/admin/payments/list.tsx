import { count, desc, eq, sql } from "drizzle-orm";
import { BadgeDollarSign, ClipboardList, Download, HandCoins, Plus } from "lucide-react";
import { Link, useLocation } from "react-router";
import { FilterBar, FilterDate, FilterSelect, SearchInput } from "~/components/admin/filters";
import { ButtonLink, buttonClasses } from "~/components/ui/button";
import { Badge, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui/data";
import { fees, members, payments } from "~/db/schema";
import { formatDate, formatMoney } from "~/lib/format";
import {
  PAYMENT_CONCEPT_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  toOptions,
} from "~/lib/labels";
import { pageParam } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { paymentWhere, readPaymentFilters } from "~/server/queries/finance.server";
import type { Route } from "./+types/list";

const PAGE_SIZE = 25;

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const filters = readPaymentFilters(url);
  const page = pageParam(url);
  const where = paymentWhere(filters);

  const [rows, [summary], filteredMember] = await Promise.all([
    db
      .select({
        id: payments.id,
        folio: payments.folio,
        paidOn: payments.paidOn,
        amountCents: payments.amountCents,
        concept: payments.concept,
        period: payments.period,
        method: payments.method,
        status: payments.status,
        payerName: payments.payerName,
        memberId: payments.memberId,
        memberName: members.fullName,
        feeName: fees.name,
      })
      .from(payments)
      .leftJoin(members, eq(members.id, payments.memberId))
      .leftJoin(fees, eq(fees.id, payments.feeId))
      .where(where)
      .orderBy(desc(payments.paidOn), desc(payments.folio))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        total: count(),
        validCents: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.status} = 'vigente'), 0)::float8`.mapWith(Number),
      })
      .from(payments)
      .leftJoin(members, eq(members.id, payments.memberId))
      .where(where),
    filters.memberId
      ? db.select({ fullName: members.fullName }).from(members).where(eq(members.id, filters.memberId)).limit(1)
      : [],
  ]);

  const total = summary?.total ?? 0;
  return {
    rows,
    total,
    validCents: summary?.validCents ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    filters,
    memberName: filteredMember[0]?.fullName ?? null,
  };
}

export default function PaymentsList({ loaderData }: Route.ComponentProps) {
  const { rows, total, validCents, page, pageCount, filters, memberName } = loaderData;
  const location = useLocation();
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Cuotas, aportaciones y donativos recibidos."
        actions={
          <>
            <ButtonLink to="/admin/pagos/adeudos" variant="secondary">
              <ClipboardList aria-hidden /> Adeudos
            </ButtonLink>
            <ButtonLink to="/admin/cuotas" variant="secondary">
              <HandCoins aria-hidden /> Cuotas
            </ButtonLink>
            <a href={`/admin/pagos/exportar${location.search}`} className={buttonClasses({ variant: "secondary" })}>
              <Download aria-hidden /> Exportar CSV
            </a>
            <ButtonLink to={filters.memberId ? `/admin/pagos/nuevo?miembro=${filters.memberId}` : "/admin/pagos/nuevo"}>
              <Plus aria-hidden /> Registrar pago
            </ButtonLink>
          </>
        }
      />

      {memberName && (
        <p className="mb-3 text-sm text-stone-600">
          Mostrando pagos de <strong className="text-stone-900">{memberName}</strong> ·{" "}
          <Link to="/admin/pagos" className="font-medium text-forest-700 hover:underline">
            ver todos
          </Link>
        </p>
      )}

      <FilterBar hasFilters={hasFilters}>
        {filters.memberId && <input type="hidden" name="miembro" value={filters.memberId} />}
        <SearchInput defaultValue={filters.q} placeholder="Nombre, referencia o folio" />
        <FilterSelect name="concepto" label="Concepto" options={toOptions(PAYMENT_CONCEPT_LABELS)} defaultValue={filters.concept} />
        <FilterSelect name="metodo" label="Método" options={toOptions(PAYMENT_METHOD_LABELS)} defaultValue={filters.method} />
        <FilterSelect name="estado" label="Estado" options={toOptions(PAYMENT_STATUS_LABELS)} defaultValue={filters.status} />
        <FilterDate name="desde" label="Desde" defaultValue={filters.from} />
        <FilterDate name="hasta" label="Hasta" defaultValue={filters.to} />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 text-sm text-stone-600">
            Total vigente {hasFilters ? "con estos filtros" : "registrado"}:
            <strong className="text-base text-stone-900">{formatMoney(validCents)}</strong>
          </div>
          <TableContainer>
            <thead>
              <tr>
                <Th>Folio</Th>
                <Th>Fecha</Th>
                <Th>Pagó</Th>
                <Th>Concepto</Th>
                <Th>Método</Th>
                <Th className="text-right">Monto</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((payment) => (
                <tr key={payment.id} className="hover:bg-stone-50">
                  <Td>
                    <Link to={`/admin/pagos/${payment.id}`} className="font-semibold text-forest-700 tabular-nums hover:underline">
                      {payment.folio}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(payment.paidOn)}</Td>
                  <Td>
                    {payment.memberId ? (
                      <Link to={`/admin/miembros/${payment.memberId}`} className="text-stone-900 hover:text-forest-700">
                        {payment.memberName}
                      </Link>
                    ) : (
                      <span>
                        {payment.payerName} <span className="text-xs text-stone-400">(externo)</span>
                      </span>
                    )}
                  </Td>
                  <Td>
                    {payment.feeName ?? PAYMENT_CONCEPT_LABELS[payment.concept]}
                    {payment.period && <span className="text-stone-500"> · {payment.period}</span>}
                  </Td>
                  <Td>{PAYMENT_METHOD_LABELS[payment.method]}</Td>
                  <Td className={`text-right whitespace-nowrap tabular-nums ${payment.status === "cancelado" ? "text-stone-400 line-through" : "font-medium text-stone-900"}`}>
                    {formatMoney(payment.amountCents)}
                  </Td>
                  <Td>
                    <Badge tone={PAYMENT_STATUS_TONES[payment.status]}>{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={BadgeDollarSign}
          title={hasFilters ? "No hay pagos con esos filtros" : "Aún no hay pagos registrados"}
          description={hasFilters ? "Prueba con otros filtros." : "Registra las cuotas y aportaciones para llevar la tesorería al día."}
          action={
            <ButtonLink to="/admin/pagos/nuevo">
              <Plus aria-hidden /> Registrar pago
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
