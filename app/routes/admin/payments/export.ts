import { desc, eq } from "drizzle-orm";
import { fees, members, payments } from "~/db/schema";
import { centsToInput, todayISO } from "~/lib/format";
import { PAYMENT_CONCEPT_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "~/lib/labels";
import { audit } from "~/server/audit.server";
import { csvResponse, toCsv } from "~/server/csv.server";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { paymentWhere, readPaymentFilters } from "~/server/queries/finance.server";
import type { Route } from "./+types/export";

export async function loader({ context, url }: Route.LoaderArgs) {
  const user = requireModule(context, "finance");
  const rows = await db
    .select({
      folio: payments.folio,
      paidOn: payments.paidOn,
      memberNumber: members.memberNumber,
      memberName: members.fullName,
      payerName: payments.payerName,
      feeName: fees.name,
      concept: payments.concept,
      period: payments.period,
      amountCents: payments.amountCents,
      method: payments.method,
      reference: payments.reference,
      status: payments.status,
      cancelReason: payments.cancelReason,
      notes: payments.notes,
    })
    .from(payments)
    .leftJoin(members, eq(members.id, payments.memberId))
    .leftJoin(fees, eq(fees.id, payments.feeId))
    .where(paymentWhere(readPaymentFilters(url)))
    .orderBy(desc(payments.paidOn), desc(payments.folio));

  await audit({ userId: user.id, action: "payment.export", summary: `Exportó ${rows.length} pagos a CSV` });

  const csv = toCsv(
    ["Folio", "Fecha", "No. socio", "Pagó", "Cuota", "Concepto", "Periodo", "Monto", "Método", "Referencia", "Estado", "Motivo de cancelación", "Notas"],
    rows.map((row) => [
      row.folio,
      row.paidOn,
      row.memberNumber,
      row.memberName ?? row.payerName,
      row.feeName,
      PAYMENT_CONCEPT_LABELS[row.concept],
      row.period,
      centsToInput(row.amountCents),
      PAYMENT_METHOD_LABELS[row.method],
      row.reference,
      PAYMENT_STATUS_LABELS[row.status],
      row.cancelReason,
      row.notes,
    ]),
  );
  return csvResponse(`pagos-${todayISO()}.csv`, csv);
}
