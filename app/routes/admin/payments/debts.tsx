import { and, asc, eq, sql } from "drizzle-orm";
import { CircleCheck, ClipboardList, HandCoins, MessageCircle, Plus } from "lucide-react";
import { Form, Link } from "react-router";
import { StatTile } from "~/components/admin/charts";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  inputClasses,
  PageHeader,
  TableContainer,
  Td,
  Th,
} from "~/components/ui";
import { fees, members, payments } from "~/db/schema";
import { centsToInput, currentMonth, currentYear, formatMoney, formatNumber } from "~/lib/format";
import { FEE_FREQUENCY_LABELS } from "~/lib/labels";
import { cn, toWhatsappNumber, whatsappLink } from "~/lib/utils";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/debts";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const feeOptions = await db
    .select({ id: fees.id, name: fees.name, amountCents: fees.amountCents, frequency: fees.frequency })
    .from(fees)
    .where(eq(fees.active, true))
    .orderBy(asc(fees.name));

  const requestedFee = url.searchParams.get("cuota");
  const fee = feeOptions.find((option) => option.id === requestedFee) ?? feeOptions[0] ?? null;
  const show = url.searchParams.get("ver") === "pagados" ? "pagados" : url.searchParams.get("ver") === "todos" ? "todos" : "adeudo";

  if (!fee) return { feeOptions, fee: null, period: "", show, rows: [], summary: null };

  const requestedPeriod = url.searchParams.get("periodo") ?? "";
  const period =
    fee.frequency === "unica"
      ? ""
      : fee.frequency === "anual"
        ? /^\d{4}$/.test(requestedPeriod)
          ? requestedPeriod
          : String(currentYear())
        : /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriod)
          ? requestedPeriod
          : currentMonth();

  const paid = db
    .select({
      memberId: payments.memberId,
      paidCents: sql<number>`sum(${payments.amountCents})::float8`.as("paid_cents"),
    })
    .from(payments)
    .where(
      and(
        eq(payments.feeId, fee.id),
        eq(payments.status, "vigente"),
        fee.frequency === "unica" ? undefined : eq(payments.period, period),
      ),
    )
    .groupBy(payments.memberId)
    .as("paid");

  const allRows = await db
    .select({
      id: members.id,
      memberNumber: members.memberNumber,
      fullName: members.fullName,
      phone: members.phone,
      paidCents: sql<number>`coalesce(${paid.paidCents}, 0)`.mapWith(Number),
    })
    .from(members)
    .leftJoin(paid, eq(paid.memberId, members.id))
    .where(eq(members.status, "activo"))
    .orderBy(asc(members.fullName));

  const rows = allRows.map((row) => {
    const pendingCents = Math.max(0, fee.amountCents - row.paidCents);
    return { ...row, pendingCents, upToDate: pendingCents === 0, whatsapp: toWhatsappNumber(row.phone) };
  });
  const withDebt = rows.filter((row) => !row.upToDate);

  return {
    feeOptions,
    fee,
    period,
    show,
    rows: show === "todos" ? rows : show === "pagados" ? rows.filter((row) => row.upToDate) : withDebt,
    summary: {
      activeMembers: rows.length,
      upToDate: rows.length - withDebt.length,
      withDebt: withDebt.length,
      pendingCents: withDebt.reduce((sum, row) => sum + row.pendingCents, 0),
    },
  };
}

export default function Debts({ loaderData }: Route.ComponentProps) {
  const { feeOptions, fee, period, show, rows, summary } = loaderData;

  return (
    <>
      <PageHeader
        title="Adeudos"
        description="Quién está al corriente y quién tiene pagos pendientes de cada cuota."
        back={{ to: "/admin/pagos", label: "Pagos" }}
      />

      {!fee ? (
        <EmptyState
          icon={HandCoins}
          title="Primero crea una cuota"
          description="Define las cuotas de la asociación (por ejemplo, la cuota anual) para calcular los adeudos."
          action={<ButtonLink to="/admin/cuotas">Ir a cuotas</ButtonLink>}
        />
      ) : (
        <>
          <Form method="get" className="mb-6 flex flex-wrap items-end gap-3 print:hidden">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Cuota</span>
              <select name="cuota" defaultValue={fee.id} className={cn(inputClasses, "h-10 min-w-64 pr-8")}>
                {feeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({FEE_FREQUENCY_LABELS[option.frequency].toLowerCase()})
                  </option>
                ))}
              </select>
            </label>
            {fee.frequency !== "unica" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-stone-500">
                  Periodo ({fee.frequency === "anual" ? "AAAA" : "AAAA-MM"})
                </span>
                <input
                  key={fee.id}
                  name="periodo"
                  type={fee.frequency === "mensual" ? "month" : "number"}
                  min={fee.frequency === "anual" ? 2000 : undefined}
                  max={fee.frequency === "anual" ? 2100 : undefined}
                  defaultValue={period}
                  className={cn(inputClasses, "h-10 w-40")}
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">Mostrar</span>
              <select name="ver" defaultValue={show} className={cn(inputClasses, "h-10 pr-8")}>
                <option value="adeudo">Con adeudo</option>
                <option value="pagados">Al corriente</option>
                <option value="todos">Todos</option>
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Consultar
            </Button>
          </Form>

          {summary && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Miembros activos" value={formatNumber(summary.activeMembers)} />
              <StatTile label="Al corriente" value={formatNumber(summary.upToDate)} />
              <StatTile label="Con adeudo" value={formatNumber(summary.withDebt)} />
              <StatTile
                label="Monto pendiente"
                value={formatMoney(summary.pendingCents)}
                hint={`${fee.name}: ${formatMoney(fee.amountCents)} por miembro${period ? ` · ${period}` : ""}`}
              />
            </div>
          )}

          {rows.length > 0 ? (
            <TableContainer>
              <thead>
                <tr>
                  <Th>No.</Th>
                  <Th>Miembro</Th>
                  <Th className="text-right">Pagado</Th>
                  <Th className="text-right">Pendiente</Th>
                  <Th>Estado</Th>
                  <Th className="print:hidden">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50">
                    <Td className="text-stone-500 tabular-nums">{row.memberNumber}</Td>
                    <Td>
                      <Link to={`/admin/miembros/${row.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                        {row.fullName}
                      </Link>
                      {row.phone && <p className="text-xs text-stone-500">{row.phone}</p>}
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(row.paidCents)}</Td>
                    <Td className="text-right font-medium tabular-nums">{formatMoney(row.pendingCents)}</Td>
                    <Td>
                      {row.upToDate ? <Badge tone="green">Al corriente</Badge> : <Badge tone="amber">Pendiente</Badge>}
                    </Td>
                    <Td className="print:hidden">
                      {!row.upToDate && (
                        <div className="flex justify-end gap-1">
                          {row.whatsapp && (
                            <a
                              href={whatsappLink(
                                row.whatsapp,
                                `Hola ${row.fullName.split(" ")[0]}, te saludamos de Propietarios Unidos. Te recordamos que está pendiente la ${fee.name}${period ? ` (${period})` : ""} por ${formatMoney(row.pendingCents)}. ¡Gracias por tu apoyo al bosque!`,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-forest-700 hover:bg-forest-50"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageCircle className="size-4" aria-hidden /> Recordar
                            </a>
                          )}
                          <ButtonLink
                            to={`/admin/pagos/nuevo?miembro=${row.id}&cuota=${fee.id}${period ? `&periodo=${period}` : ""}&monto=${centsToInput(row.pendingCents)}`}
                            variant="secondary"
                            size="sm"
                          >
                            <Plus aria-hidden /> Pago
                          </ButtonLink>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          ) : (
            <EmptyState
              icon={show === "adeudo" ? CircleCheck : ClipboardList}
              title={show === "adeudo" ? "¡Todos al corriente!" : "Sin resultados"}
              description={
                show === "adeudo"
                  ? "Ningún miembro activo tiene adeudo de esta cuota en el periodo seleccionado."
                  : "No hay miembros para mostrar con este filtro."
              }
            />
          )}
        </>
      )}
    </>
  );
}
