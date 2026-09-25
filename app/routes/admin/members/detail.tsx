import { and, count, desc, eq, sql } from "drizzle-orm";
import { MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import { data, Form, Link } from "react-router";
import { PropertyForm } from "~/components/admin/forms";
import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  ConfirmButton,
  DescriptionList,
  PageHeader,
  TableContainer,
  Td,
  Th,
} from "~/components/ui";
import { fees, members, payments, properties } from "~/db/schema";
import { formatDate, formatDateTime, formatMoney } from "~/lib/format";
import {
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_TONES,
  MEMBER_TYPE_LABELS,
  PAYMENT_CONCEPT_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  TENURE_LABELS,
} from "~/lib/labels";
import { can } from "~/lib/permissions";
import { propertySchema } from "~/lib/schemas/admin";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/detail";

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = requireModule(context, "members");
  const id = requireId(params.memberId, "Miembro no encontrado");

  const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
  if (!member) throw notFound("Miembro no encontrado");

  const showFinance = can(user.role, "finance");
  const [memberProperties, memberPayments, [paymentStats]] = await Promise.all([
    db.select().from(properties).where(eq(properties.memberId, id)).orderBy(properties.createdAt),
    showFinance
      ? db
          .select({
            id: payments.id,
            folio: payments.folio,
            concept: payments.concept,
            period: payments.period,
            amountCents: payments.amountCents,
            paidOn: payments.paidOn,
            status: payments.status,
            feeName: fees.name,
          })
          .from(payments)
          .leftJoin(fees, eq(fees.id, payments.feeId))
          .where(eq(payments.memberId, id))
          .orderBy(desc(payments.paidOn), desc(payments.folio))
          .limit(15)
      : [],
    db
      .select({
        total: count(),
        paidCents: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.status} = 'vigente'), 0)::float8`.mapWith(Number),
      })
      .from(payments)
      .where(eq(payments.memberId, id)),
  ]);

  const totalArea = memberProperties.reduce((sum, p) => sum + (p.areaHa ? Number(p.areaHa) : 0), 0);

  return {
    member,
    properties: memberProperties,
    totalArea,
    payments: memberPayments,
    paymentCount: paymentStats?.total ?? 0,
    paidCents: showFinance ? (paymentStats?.paidCents ?? 0) : null,
    showFinance,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "members");
  const id = requireId(params.memberId, "Miembro no encontrado");
  const formData = await request.formData();
  const intent = getIntent(formData);

  const [member] = await db
    .select({ id: members.id, fullName: members.fullName })
    .from(members)
    .where(eq(members.id, id))
    .limit(1);
  if (!member) throw notFound("Miembro no encontrado");

  if (intent === "add-property" || intent === "update-property") {
    const result = validateForm(propertySchema, formData);
    const propertyId = String(formData.get("propertyId") ?? "");
    if (!result.success) {
      return data({ intent, propertyId, errors: result.errors, values: result.values }, { status: 400 });
    }
    if (intent === "add-property") {
      await db.insert(properties).values({ ...result.data, memberId: id });
      await audit({
        userId: user.id,
        action: "property.create",
        entityType: "member",
        entityId: id,
        summary: `Agregó el predio "${result.data.name}" a ${member.fullName}`,
      });
      return redirectWithToast(`/admin/miembros/${id}`, { type: "success", message: "Predio agregado." });
    }
    requireId(propertyId);
    await db
      .update(properties)
      .set(result.data)
      .where(and(eq(properties.id, propertyId), eq(properties.memberId, id)));
    await audit({
      userId: user.id,
      action: "property.update",
      entityType: "member",
      entityId: id,
      summary: `Actualizó el predio "${result.data.name}" de ${member.fullName}`,
    });
    return redirectWithToast(`/admin/miembros/${id}`, { type: "success", message: "Predio actualizado." });
  }

  if (intent === "delete-property") {
    const propertyId = requireId(String(formData.get("propertyId") ?? ""));
    const [deleted] = await db
      .delete(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.memberId, id)))
      .returning({ name: properties.name });
    if (deleted) {
      await audit({
        userId: user.id,
        action: "property.delete",
        entityType: "member",
        entityId: id,
        summary: `Eliminó el predio "${deleted.name}" de ${member.fullName}`,
      });
    }
    return redirectWithToast(`/admin/miembros/${id}`, { type: "success", message: "Predio eliminado." });
  }

  if (intent === "delete-member") {
    const [{ total }] = await db.select({ total: count() }).from(payments).where(eq(payments.memberId, id));
    if (total > 0) {
      return redirectWithToast(`/admin/miembros/${id}`, {
        type: "error",
        message: "No se puede eliminar: el miembro tiene pagos registrados. Márcalo como inactivo.",
      });
    }
    await db.delete(members).where(eq(members.id, id));
    await audit({
      userId: user.id,
      action: "member.delete",
      entityType: "member",
      entityId: id,
      summary: `Eliminó al miembro ${member.fullName}`,
    });
    return redirectWithToast("/admin/miembros", { type: "success", message: "Miembro eliminado." });
  }

  throw data("Acción no válida", { status: 400 });
}

export default function MemberDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { member, properties: memberProperties, totalArea, payments: memberPayments, paymentCount, paidCents, showFinance } =
    loaderData;
  const addErrors = actionData?.intent === "add-property" ? actionData : undefined;

  return (
    <>
      <PageHeader
        title={member.fullName}
        back={{ to: "/admin/miembros", label: "Miembros" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Socio No. {member.memberNumber} · {MEMBER_TYPE_LABELS[member.memberType]}
            <Badge tone={MEMBER_STATUS_TONES[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
          </span>
        }
        actions={
          <>
            {showFinance && (
              <ButtonLink to={`/admin/pagos/nuevo?miembro=${member.id}`} variant="secondary">
                <Plus aria-hidden /> Registrar pago
              </ButtonLink>
            )}
            <ButtonLink to={`/admin/miembros/${member.id}/editar`}>
              <Pencil aria-hidden /> Editar
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Datos generales">
            <DescriptionList
              items={[
                { label: "Correo", value: member.email ? <a href={`mailto:${member.email}`} className="text-forest-700 hover:underline">{member.email}</a> : "—" },
                { label: "Teléfono", value: member.phone ?? "—" },
                { label: "Domicilio", value: member.address ?? "—" },
                { label: "Fecha de ingreso", value: formatDate(member.joinedOn) },
                { label: "Registrado", value: formatDateTime(member.createdAt) },
                { label: "Última actualización", value: formatDateTime(member.updatedAt) },
              ]}
            />
            {member.notes && (
              <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm whitespace-pre-line text-amber-950 ring-1 ring-amber-100">
                {member.notes}
              </div>
            )}
          </Card>

          <Card
            title="Predios"
            description={
              memberProperties.length > 0
                ? `${memberProperties.length} predio(s)${totalArea > 0 ? ` · ${totalArea.toLocaleString("es-MX")} ha en total` : ""}`
                : "Sin predios registrados"
            }
          >
            <ul className="space-y-4">
              {memberProperties.map((property) => {
                const editErrors =
                  actionData?.intent === "update-property" && actionData.propertyId === property.id ? actionData : undefined;
                return (
                  <li key={property.id} className="rounded-lg p-4 ring-1 ring-stone-200">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <MapPinned className="mt-0.5 size-5 shrink-0 text-forest-600" aria-hidden />
                        <div>
                          <p className="font-medium text-stone-900">{property.name}</p>
                          <p className="text-sm text-stone-500">
                            {[
                              TENURE_LABELS[property.tenure],
                              property.municipality,
                              property.locality,
                              property.areaHa ? `${Number(property.areaHa).toLocaleString("es-MX")} ha` : null,
                              property.cadastralKey ? `Clave ${property.cadastralKey}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {property.notes && <p className="mt-1 text-sm text-stone-600">{property.notes}</p>}
                        </div>
                      </div>
                      <Form method="post">
                        <input type="hidden" name="propertyId" value={property.id} />
                        <ConfirmButton
                          name="intent"
                          value="delete-property"
                          variant="ghost"
                          size="sm"
                          message={`¿Eliminar el predio "${property.name}"?`}
                          aria-label={`Eliminar predio ${property.name}`}
                        >
                          <Trash2 aria-hidden />
                        </ConfirmButton>
                      </Form>
                    </div>
                    <details className="mt-3" open={Boolean(editErrors)}>
                      <summary className="cursor-pointer text-sm font-medium text-forest-700">Editar predio</summary>
                      <div className="mt-4">
                        <PropertyForm
                          intent="update-property"
                          property={property}
                          errors={editErrors?.errors}
                          values={editErrors?.values}
                        />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
            <details className="mt-4 rounded-lg bg-stone-50 p-4" open={Boolean(addErrors) || memberProperties.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-forest-800">+ Agregar predio</summary>
              <div className="mt-4">
                <PropertyForm intent="add-property" errors={addErrors?.errors} values={addErrors?.values} />
              </div>
            </details>
          </Card>
        </div>

        <div className="space-y-6">
          {showFinance && (
            <Card
              title="Pagos"
              description={paidCents !== null ? `Total pagado: ${formatMoney(paidCents)}` : undefined}
              actions={
                paymentCount > 0 ? (
                  <Link to={`/admin/pagos?miembro=${member.id}`} className="text-sm font-medium text-forest-700 hover:text-forest-900">
                    Ver todos
                  </Link>
                ) : undefined
              }
              bodyClassName="p-0"
            >
              {memberPayments.length > 0 ? (
                <TableContainer className="rounded-none shadow-none ring-0">
                  <thead>
                    <tr>
                      <Th>Folio</Th>
                      <Th>Concepto</Th>
                      <Th className="text-right">Monto</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {memberPayments.map((payment) => (
                      <tr key={payment.id}>
                        <Td>
                          <Link to={`/admin/pagos/${payment.id}`} className="font-medium text-forest-700 hover:underline">
                            {payment.folio}
                          </Link>
                          <p className="text-xs text-stone-500">{formatDate(payment.paidOn)}</p>
                        </Td>
                        <Td>
                          {payment.feeName ?? PAYMENT_CONCEPT_LABELS[payment.concept]}
                          {payment.period && <span className="text-stone-500"> · {payment.period}</span>}
                          {payment.status !== "vigente" && (
                            <Badge tone={PAYMENT_STATUS_TONES[payment.status]} className="ml-1">
                              {PAYMENT_STATUS_LABELS[payment.status]}
                            </Badge>
                          )}
                        </Td>
                        <Td className="text-right whitespace-nowrap tabular-nums">{formatMoney(payment.amountCents)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableContainer>
              ) : (
                <p className="px-5 py-6 text-sm text-stone-500">Sin pagos registrados.</p>
              )}
            </Card>
          )}

          <Card title="Zona de riesgo">
            {paymentCount > 0 ? (
              <Alert tone="info">
                Este miembro tiene pagos registrados, por lo que no puede eliminarse. Si ya no participa, cambia su
                estado a <strong>Inactivo</strong>.
              </Alert>
            ) : (
              <Form method="post">
                <p className="mb-3 text-sm text-stone-600">Eliminar borra también sus predios. Esta acción no se puede deshacer.</p>
                <ConfirmButton
                  name="intent"
                  value="delete-member"
                  variant="danger"
                  message={`¿Eliminar definitivamente a ${member.fullName}?`}
                >
                  <Trash2 aria-hidden /> Eliminar miembro
                </ConfirmButton>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
