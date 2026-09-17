import { and, count, desc, eq } from "drizzle-orm";
import { Check, Mail, MessageCircle, Phone, Trash2, UserPlus, X } from "lucide-react";
import { data, Form, Link } from "react-router";
import { FilterBar, FilterSelect } from "~/components/admin/filters";
import { Button, ConfirmButton } from "~/components/ui/button";
import { Badge, EmptyState, PageHeader, Pagination } from "~/components/ui/data";
import { members, membershipRequests, properties, users } from "~/db/schema";
import { REQUEST_STATUSES, type RequestStatus } from "~/lib/enums";
import { formatDateTime, todayISO } from "~/lib/format";
import { MEMBER_TYPE_LABELS, REQUEST_STATUS_LABELS, REQUEST_STATUS_TONES, toOptions } from "~/lib/labels";
import { can } from "~/lib/permissions";
import { telLink, toWhatsappNumber, whatsappLink } from "~/lib/utils";
import { pageParam } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import type { Route } from "./+types/requests";

const PAGE_SIZE = 20;

export async function loader({ context, url }: Route.LoaderArgs) {
  const user = requireModule(context, "inbox");
  const statusParam = url.searchParams.get("estado");
  // Por defecto se muestran las pendientes; "todas" quita el filtro.
  const status: RequestStatus | "" =
    statusParam === null ? "pendiente" : (REQUEST_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as RequestStatus) : "";
  const page = pageParam(url);
  const where = status ? eq(membershipRequests.status, status) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ request: membershipRequests, reviewedByName: users.name })
      .from(membershipRequests)
      .leftJoin(users, eq(users.id, membershipRequests.reviewedBy))
      .where(where)
      .orderBy(desc(membershipRequests.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(membershipRequests).where(where),
  ]);

  return {
    rows: rows.map((row) => ({ ...row, whatsapp: toWhatsappNumber(row.request.phone) })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    status,
    canManageMembers: can(user.role, "members"),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "inbox");
  const formData = await request.formData();
  const intent = getIntent(formData);
  const id = requireId(String(formData.get("requestId") ?? ""), "Solicitud no encontrada");

  const [membershipRequest] = await db.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1);
  if (!membershipRequest) throw notFound("Solicitud no encontrada");

  if (intent === "approve") {
    requireModule(context, "members");
    if (membershipRequest.status !== "pendiente") {
      return redirectWithToast("/admin/solicitudes", { type: "error", message: "La solicitud ya fue revisada." });
    }
    const member = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(members)
        .values({
          fullName: membershipRequest.fullName,
          memberType: membershipRequest.memberType,
          status: "activo",
          email: membershipRequest.email,
          phone: membershipRequest.phone,
          joinedOn: todayISO(),
          notes: membershipRequest.message ? `Mensaje de su solicitud: ${membershipRequest.message}` : null,
        })
        .returning({ id: members.id, memberNumber: members.memberNumber });
      if (membershipRequest.propertyName) {
        await tx.insert(properties).values({
          memberId: created!.id,
          name: membershipRequest.propertyName,
          municipality: membershipRequest.municipality,
          locality: membershipRequest.locality,
          areaHa: membershipRequest.areaHa,
          tenure: membershipRequest.memberType === "ejidatario" ? "ejidal" : "privada",
        });
      }
      await tx
        .update(membershipRequests)
        .set({ status: "aprobada", memberId: created!.id, reviewedBy: user.id, reviewedAt: new Date() })
        .where(eq(membershipRequests.id, id));
      return created!;
    });
    await audit({
      userId: user.id,
      action: "request.approve",
      entityType: "member",
      entityId: member.id,
      summary: `Aprobó la solicitud de ${membershipRequest.fullName} (socio No. ${member.memberNumber})`,
    });
    return redirectWithToast(`/admin/miembros/${member.id}`, {
      type: "success",
      message: `Solicitud aprobada: ${membershipRequest.fullName} ya es miembro.`,
    });
  }

  if (intent === "reject") {
    await db
      .update(membershipRequests)
      .set({ status: "rechazada", reviewedBy: user.id, reviewedAt: new Date() })
      .where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "pendiente")));
    await audit({ userId: user.id, action: "request.reject", summary: `Rechazó la solicitud de ${membershipRequest.fullName}` });
    return redirectWithToast("/admin/solicitudes", { type: "success", message: "Solicitud rechazada." });
  }

  if (intent === "delete") {
    await db.delete(membershipRequests).where(eq(membershipRequests.id, id));
    await audit({ userId: user.id, action: "request.delete", summary: `Eliminó la solicitud de ${membershipRequest.fullName}` });
    return redirectWithToast("/admin/solicitudes", { type: "success", message: "Solicitud eliminada." });
  }

  throw data("Acción no válida", { status: 400 });
}

export default function Requests({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, status, canManageMembers } = loaderData;

  return (
    <>
      <PageHeader title="Solicitudes de ingreso" description="Personas que pidieron unirse a la asociación desde el sitio web." />

      <FilterBar hasFilters={status !== "pendiente"}>
        <FilterSelect
          name="estado"
          label="Estado"
          options={toOptions(REQUEST_STATUS_LABELS)}
          defaultValue={status}
          allLabel="Todas"
        />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <ul className="space-y-4">
            {rows.map(({ request, reviewedByName, whatsapp }) => (
              <li key={request.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-stone-900">{request.fullName}</h2>
                      <Badge tone={REQUEST_STATUS_TONES[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Badge>
                      <Badge tone="earth">{MEMBER_TYPE_LABELS[request.memberType]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">Recibida el {formatDateTime(request.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <a href={`mailto:${request.email}`} className="inline-flex items-center gap-1 text-forest-700 hover:underline">
                      <Mail className="size-4" aria-hidden /> {request.email}
                    </a>
                    <a href={telLink(request.phone)} className="inline-flex items-center gap-1 text-forest-700 hover:underline">
                      <Phone className="size-4" aria-hidden /> {request.phone}
                    </a>
                    {whatsapp && (
                      <a
                        href={whatsappLink(whatsapp, `Hola ${request.fullName.split(" ")[0]}, te escribimos de Propietarios Unidos sobre tu solicitud de ingreso.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-forest-700 hover:underline"
                      >
                        <MessageCircle className="size-4" aria-hidden /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {(request.propertyName || request.municipality || request.locality || request.areaHa) && (
                  <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                    <span className="font-medium">Predio:</span>{" "}
                    {[
                      request.propertyName,
                      request.municipality,
                      request.locality,
                      request.areaHa ? `${Number(request.areaHa).toLocaleString("es-MX")} ha` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {request.message && <p className="mt-3 text-sm whitespace-pre-line text-stone-700">{request.message}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                  {request.status === "pendiente" ? (
                    <>
                      {canManageMembers && (
                        <Form method="post">
                          <input type="hidden" name="requestId" value={request.id} />
                          <ConfirmButton
                            name="intent"
                            value="approve"
                            size="sm"
                            message={`¿Aprobar a ${request.fullName}? Se registrará como miembro activo.`}
                          >
                            <Check aria-hidden /> Aprobar y registrar
                          </ConfirmButton>
                        </Form>
                      )}
                      <Form method="post">
                        <input type="hidden" name="requestId" value={request.id} />
                        <Button type="submit" name="intent" value="reject" variant="secondary" size="sm">
                          <X aria-hidden /> Rechazar
                        </Button>
                      </Form>
                    </>
                  ) : (
                    <p className="text-sm text-stone-500">
                      {REQUEST_STATUS_LABELS[request.status]}
                      {request.reviewedAt && ` el ${formatDateTime(request.reviewedAt)}`}
                      {reviewedByName && ` por ${reviewedByName}`}
                      {request.memberId && (
                        <>
                          {" · "}
                          <Link to={`/admin/miembros/${request.memberId}`} className="font-medium text-forest-700 hover:underline">
                            <UserPlus className="inline size-4" aria-hidden /> Ver miembro
                          </Link>
                        </>
                      )}
                    </p>
                  )}
                  <Form method="post" className="ml-auto">
                    <input type="hidden" name="requestId" value={request.id} />
                    <ConfirmButton name="intent" value="delete" variant="ghost" size="sm" message="¿Eliminar esta solicitud?" aria-label="Eliminar solicitud">
                      <Trash2 aria-hidden />
                    </ConfirmButton>
                  </Form>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={UserPlus}
          title={status === "pendiente" ? "No hay solicitudes pendientes" : "Sin solicitudes"}
          description="Las solicitudes enviadas desde la página “Únete” aparecerán aquí."
        />
      )}
    </>
  );
}
