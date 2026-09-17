import { eq } from "drizzle-orm";
import { Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { ButtonLink, ConfirmButton, SubmitButton } from "~/components/ui/button";
import { Badge, Card, DescriptionList, PageHeader } from "~/components/ui/data";
import { SelectField, TextareaField } from "~/components/ui/form";
import { citizenReports } from "~/db/schema";
import { formatDate, formatDateTime } from "~/lib/format";
import { REPORT_STATUS_LABELS, REPORT_STATUS_TONES, REPORT_TYPE_LABELS, toOptions } from "~/lib/labels";
import { can } from "~/lib/permissions";
import { reportUpdateSchema } from "~/lib/schemas/admin";
import { telLink, toWhatsappNumber, whatsappLink } from "~/lib/utils";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import { deleteFile } from "~/server/storage.server";
import type { Route } from "./+types/report-detail";

export async function loader({ context, params }: Route.LoaderArgs) {
  const user = requireModule(context, "inbox");
  const id = requireId(params.reportId, "Reporte no encontrado");
  const [report] = await db.select().from(citizenReports).where(eq(citizenReports.id, id)).limit(1);
  if (!report) throw notFound("Reporte no encontrado");
  return {
    report,
    whatsapp: toWhatsappNumber(report.reporterPhone),
    canCreateRecord: can(user.role, "records"),
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "inbox");
  const id = requireId(params.reportId, "Reporte no encontrado");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const [deleted] = await db
      .delete(citizenReports)
      .where(eq(citizenReports.id, id))
      .returning({ folio: citizenReports.folio, photoKeys: citizenReports.photoKeys });
    if (!deleted) throw notFound("Reporte no encontrado");
    await Promise.all(deleted.photoKeys.map((key) => deleteFile(key)));
    await audit({ userId: user.id, action: "report.delete", summary: `Eliminó el reporte #${deleted.folio}` });
    return redirectWithToast("/admin/reportes", { type: "success", message: "Reporte eliminado." });
  }

  const result = validateForm(reportUpdateSchema, formData);
  if (!result.success) return data({ errors: result.errors }, { status: 400 });

  const [updated] = await db
    .update(citizenReports)
    .set(result.data)
    .where(eq(citizenReports.id, id))
    .returning({ folio: citizenReports.folio });
  if (!updated) throw notFound("Reporte no encontrado");

  await audit({
    userId: user.id,
    action: "report.update",
    entityType: "report",
    entityId: id,
    summary: `Actualizó el reporte #${updated.folio} a "${REPORT_STATUS_LABELS[result.data.status]}"`,
  });
  return redirectWithToast(`/admin/reportes/${id}`, { type: "success", message: "Seguimiento guardado." });
}

export default function ReportDetail({ loaderData, actionData }: Route.ComponentProps) {
  const { report, whatsapp, canCreateRecord } = loaderData;
  const hasContact = report.reporterName || report.reporterPhone || report.reporterEmail;

  return (
    <>
      <PageHeader
        title={`Reporte #${report.folio}`}
        back={{ to: "/admin/reportes", label: "Reportes" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {REPORT_TYPE_LABELS[report.type]} · recibido el {formatDateTime(report.createdAt)}
            <Badge tone={REPORT_STATUS_TONES[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>
          </span>
        }
        actions={
          canCreateRecord ? (
            <ButtonLink to="/admin/bitacora/nuevo" variant="secondary">
              Registrar en bitácora
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Detalle del reporte">
            <DescriptionList
              items={[
                { label: "Tipo", value: REPORT_TYPE_LABELS[report.type] },
                { label: "Fecha en que ocurrió", value: formatDate(report.occurredOn) },
                { label: "Ubicación", value: report.location },
              ]}
            />
            <div className="mt-5">
              <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">Descripción</p>
              <p className="mt-1 text-sm whitespace-pre-line text-stone-900">{report.description}</p>
            </div>
          </Card>

          {report.photoKeys.length > 0 && (
            <Card title="Fotos" description="Haz clic en una foto para verla completa.">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.photoKeys.map((_, index) => (
                  <li key={index}>
                    <a href={`/admin/reportes/${report.id}/fotos/${index}`} target="_blank" rel="noopener">
                      <img
                        src={`/admin/reportes/${report.id}/fotos/${index}`}
                        alt={`Foto ${index + 1} del reporte ${report.folio}`}
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-lg object-cover ring-1 ring-stone-200 hover:opacity-90"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Seguimiento">
            <Form method="post" className="space-y-4">
              <SelectField
                label="Estado"
                name="status"
                options={toOptions(REPORT_STATUS_LABELS)}
                defaultValue={report.status}
                error={actionData?.errors?.status}
              />
              <TextareaField
                label="Notas internas"
                name="adminNotes"
                rows={5}
                defaultValue={report.adminNotes ?? ""}
                error={actionData?.errors?.adminNotes}
                hint="Acciones tomadas, a quién se canalizó, número de denuncia oficial, etc."
              />
              <SubmitButton intent="update" className="w-full">
                Guardar seguimiento
              </SubmitButton>
            </Form>
          </Card>

          <Card title="Quien reporta">
            {hasContact ? (
              <div className="space-y-3 text-sm">
                {report.reporterName && <p className="font-medium text-stone-900">{report.reporterName}</p>}
                {report.reporterPhone && (
                  <p className="flex flex-wrap items-center gap-3">
                    <a href={telLink(report.reporterPhone)} className="inline-flex items-center gap-1.5 text-forest-700 hover:underline">
                      <Phone className="size-4" aria-hidden /> {report.reporterPhone}
                    </a>
                    {whatsapp && (
                      <a
                        href={whatsappLink(whatsapp, `Hola, te contactamos de Propietarios Unidos sobre tu reporte #${report.folio}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-forest-700 hover:underline"
                      >
                        <MessageCircle className="size-4" aria-hidden /> WhatsApp
                      </a>
                    )}
                  </p>
                )}
                {report.reporterEmail && (
                  <a href={`mailto:${report.reporterEmail}`} className="inline-flex items-center gap-1.5 break-all text-forest-700 hover:underline">
                    <Mail className="size-4 shrink-0" aria-hidden /> {report.reporterEmail}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Reporte anónimo: no dejó datos de contacto.</p>
            )}
          </Card>

          <Card title="Eliminar reporte">
            <Form method="post">
              <p className="mb-3 text-sm text-stone-600">Se borrarán también las fotos. Úsalo solo para spam o duplicados.</p>
              <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message={`¿Eliminar el reporte #${report.folio}?`}>
                <Trash2 aria-hidden /> Eliminar
              </ConfirmButton>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
}
