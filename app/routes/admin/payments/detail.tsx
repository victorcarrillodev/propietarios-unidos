import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Ban, Printer } from "lucide-react";
import { data, Form, Link } from "react-router";
import { LogoMark } from "~/components/brand";
import { Badge, Button, Card, ConfirmButton, PageHeader, TextField } from "~/components/ui";
import { fees, members, payments, users } from "~/db/schema";
import { formatDate, formatDateTime, formatMoney } from "~/lib/format";
import {
  FEE_FREQUENCY_LABELS,
  PAYMENT_CONCEPT_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "~/lib/labels";
import { amountToWords } from "~/lib/number-words";
import { cancelPaymentSchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import { getSiteSettings } from "~/server/settings.server";
import type { Route } from "./+types/detail";

const recorder = alias(users, "recorder");
const canceller = alias(users, "canceller");

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "finance");
  const id = requireId(params.paymentId, "Pago no encontrado");

  const [[row], settings] = await Promise.all([
    db
      .select({
        payment: payments,
        memberName: members.fullName,
        memberNumber: members.memberNumber,
        feeName: fees.name,
        feeFrequency: fees.frequency,
        recordedByName: sql<string | null>`${recorder.name}`,
        cancelledByName: sql<string | null>`${canceller.name}`,
      })
      .from(payments)
      .leftJoin(members, eq(members.id, payments.memberId))
      .leftJoin(fees, eq(fees.id, payments.feeId))
      .leftJoin(recorder, eq(recorder.id, payments.recordedBy))
      .leftJoin(canceller, eq(canceller.id, payments.cancelledBy))
      .where(eq(payments.id, id))
      .limit(1),
    getSiteSettings(),
  ]);
  if (!row) throw notFound("Pago no encontrado");

  return {
    ...row,
    amountWords: amountToWords(row.payment.amountCents),
    org: { name: settings.orgName, address: settings.address, phone: settings.phone, email: settings.email },
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "finance");
  const id = requireId(params.paymentId, "Pago no encontrado");
  const formData = await request.formData();
  if (getIntent(formData) !== "cancel") throw data("Acción no válida", { status: 400 });

  const result = validateForm(cancelPaymentSchema, formData);
  if (!result.success) return data({ errors: result.errors }, { status: 400 });

  const [payment] = await db
    .update(payments)
    .set({ status: "cancelado", cancelReason: result.data.reason, cancelledAt: new Date(), cancelledBy: user.id })
    .where(eq(payments.id, id))
    .returning({ folio: payments.folio, amountCents: payments.amountCents });
  if (!payment) throw notFound("Pago no encontrado");

  await audit({
    userId: user.id,
    action: "payment.cancel",
    entityType: "payment",
    entityId: id,
    summary: `Canceló el pago folio ${payment.folio} (${formatMoney(payment.amountCents)}): ${result.data.reason}`,
  });
  return redirectWithToast(`/admin/pagos/${id}`, { type: "success", message: "Pago cancelado." });
}

export default function PaymentDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { payment, memberName, memberNumber, feeName, feeFrequency, recordedByName, cancelledByName, amountWords, org } =
    loaderData;
  const cancelled = payment.status === "cancelado";
  const payer = memberName ?? payment.payerName ?? "—";

  return (
    <>
      <PageHeader
        title={`Pago folio ${payment.folio}`}
        back={{ to: "/admin/pagos", label: "Pagos" }}
        description={
          <span className="flex items-center gap-2">
            Registrado el {formatDateTime(payment.createdAt)}
            <Badge tone={PAYMENT_STATUS_TONES[payment.status]}>{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
          </span>
        }
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer aria-hidden /> Imprimir recibo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recibo imprimible */}
        <article className="relative overflow-hidden rounded-xl bg-white p-8 shadow-sm ring-1 ring-stone-200 xl:col-span-2 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          {cancelled && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <span className="-rotate-12 rounded-xl border-4 border-red-600/60 px-8 py-2 text-5xl font-black tracking-widest text-red-600/60">
                CANCELADO
              </span>
            </div>
          )}
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-4">
              <LogoMark className="size-14" />
              <div>
                <p className="font-display text-lg leading-tight font-semibold text-forest-950">{org.name}</p>
                {org.address && <p className="text-xs text-stone-500">{org.address}</p>}
                <p className="text-xs text-stone-500">{[org.phone, org.email].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase">Recibo de pago</p>
              <p className="mt-1 text-3xl font-semibold text-stone-900">No. {String(payment.folio).padStart(5, "0")}</p>
              <p className="text-sm text-stone-600">{formatDate(payment.paidOn)}</p>
            </div>
          </header>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-stone-500">Recibimos de</dt>
              <dd className="font-semibold text-stone-900">
                {payer}
                {memberNumber && <span className="font-normal text-stone-500"> · Socio No. {memberNumber}</span>}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-stone-500">La cantidad de</dt>
              <dd>
                <span className="text-2xl font-semibold text-stone-900">{formatMoney(payment.amountCents)}</span>
                <span className="block text-xs text-stone-600">({amountWords})</span>
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-stone-500">Por concepto de</dt>
              <dd className="text-stone-900">
                {feeName
                  ? `${feeName}${feeFrequency ? ` (${FEE_FREQUENCY_LABELS[feeFrequency].toLowerCase()})` : ""}`
                  : PAYMENT_CONCEPT_LABELS[payment.concept]}
                {payment.period && ` · periodo ${payment.period}`}
              </dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-stone-500">Forma de pago</dt>
              <dd className="text-stone-900">
                {PAYMENT_METHOD_LABELS[payment.method]}
                {payment.reference && ` · Ref. ${payment.reference}`}
              </dd>
            </div>
            {payment.notes && (
              <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                <dt className="text-stone-500">Notas</dt>
                <dd className="whitespace-pre-line text-stone-900">{payment.notes}</dd>
              </div>
            )}
          </dl>

          <footer className="mt-14 grid gap-10 sm:grid-cols-2">
            <div className="text-center">
              <div className="mx-auto w-56 border-t border-stone-400 pt-2 text-xs text-stone-600">Recibió</div>
              {recordedByName && <p className="text-xs text-stone-500">{recordedByName}</p>}
            </div>
            <div className="text-center">
              <div className="mx-auto w-56 border-t border-stone-400 pt-2 text-xs text-stone-600">Entregó</div>
            </div>
          </footer>
        </article>

        <aside className="space-y-6 print:hidden">
          {memberName && payment.memberId && (
            <Card title="Miembro">
              <Link to={`/admin/miembros/${payment.memberId}`} className="font-medium text-forest-700 hover:underline">
                {memberName}
              </Link>
              <p className="mt-2 text-sm">
                <Link to={`/admin/pagos?miembro=${payment.memberId}`} className="text-stone-600 hover:text-forest-700">
                  Ver todos sus pagos →
                </Link>
              </p>
            </Card>
          )}

          {cancelled ? (
            <Card title="Pago cancelado">
              <p className="text-sm text-stone-700">{payment.cancelReason}</p>
              <p className="mt-2 text-xs text-stone-500">
                {formatDateTime(payment.cancelledAt)}
                {cancelledByName && ` · por ${cancelledByName}`}
              </p>
            </Card>
          ) : (
            <Card title="Cancelar pago" description="Los pagos no se eliminan: se cancelan y queda registro del motivo.">
              <Form method="post" className="space-y-3">
                <TextField label="Motivo de la cancelación" name="reason" error={actionData?.errors?.reason} required />
                <ConfirmButton
                  name="intent"
                  value="cancel"
                  variant="danger"
                  size="sm"
                  message={`¿Cancelar el pago folio ${payment.folio}? Dejará de contar en los totales.`}
                  confirmLabel="Cancelar pago"
                >
                  <Ban aria-hidden /> Cancelar pago
                </ConfirmButton>
              </Form>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
