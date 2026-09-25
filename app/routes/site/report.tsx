import { Camera, CircleCheck, Phone, ShieldAlert } from "lucide-react";
import { data, Form } from "react-router";
import { PrivacyConsent } from "~/components/site/privacy-consent";
import { Container, PageHero } from "~/components/site/sections";
import {
  Alert,
  ButtonLink,
  Honeypot,
  SelectField,
  SubmitButton,
  TextareaField,
  TextField,
} from "~/components/ui";
import { citizenReports } from "~/db/schema";
import { todayISO } from "~/lib/format";
import { REPORT_TYPE_LABELS, toOptions } from "~/lib/labels";
import { reportSchema } from "~/lib/schemas/public";
import { seo, siteUrlFrom } from "~/lib/seo";
import { escapeHtml } from "~/lib/utils";
import { formValues, validateForm, type FieldErrors } from "~/lib/validation";
import { db } from "~/server/db.server";
import { sendMail } from "~/server/mail.server";
import { getClientIp, rateLimit } from "~/server/rate-limit.server";
import { getSiteSettings } from "~/server/settings.server";
import { deleteFile, saveOptimizedImage } from "~/server/storage.server";
import { getFiles, isLikelyBot, parseMultipartForm } from "~/server/uploads.server";
import type { Route } from "./+types/report";

const MAX_PHOTOS = 3;
const MAX_PHOTO_MB = 8;

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Reportar una incidencia",
    description:
      "Reporta incendios, tala ilegal, basura, invasiones u otros daños en el Bosque La Primavera. Le daremos seguimiento.",
    path: "/reportar",
    siteUrl: siteUrlFrom(matches),
  });

type ActionResult = {
  ok: boolean;
  folio?: number | null;
  formError?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

export async function action({ request }: Route.ActionArgs) {
  const limit = rateLimit(`report:${getClientIp(request)}`, 5, 30 * 60_000);
  if (!limit.allowed) {
    return data<ActionResult>(
      { ok: false, formError: "Recibimos varios reportes seguidos desde tu conexión. Intenta de nuevo más tarde." },
      { status: 429 },
    );
  }

  const { formData, error } = await parseMultipartForm(request, { maxFileSizeMb: MAX_PHOTO_MB, maxFiles: MAX_PHOTOS });
  if (!formData) return data<ActionResult>({ ok: false, formError: error }, { status: 400 });
  if (isLikelyBot(formData)) return data<ActionResult>({ ok: true, folio: null });

  const result = validateForm(reportSchema, formData);
  if (!result.success) {
    return data<ActionResult>({ ok: false, errors: result.errors, values: result.values }, { status: 400 });
  }

  const photos = getFiles(formData, "photos");
  const photoKeys: string[] = [];
  try {
    for (const photo of photos.slice(0, MAX_PHOTOS)) {
      photoKeys.push(await saveOptimizedImage(photo, "reports"));
    }
  } catch {
    await Promise.all(photoKeys.map((key) => deleteFile(key)));
    return data<ActionResult>(
      {
        ok: false,
        errors: { photos: ["Alguna de las fotos no es una imagen válida. Usa archivos JPG, PNG o WEBP."] },
        values: formValues(formData),
      },
      { status: 400 },
    );
  }

  const { privacy: _privacy, ...report } = result.data;
  const [created] = await db
    .insert(citizenReports)
    .values({ ...report, photoKeys })
    .returning({ folio: citizenReports.folio });

  const settings = await getSiteSettings();
  if (settings.email) {
    await sendMail({
      to: settings.email,
      subject: `Nuevo reporte${created?.folio ? ` #${created.folio}` : ""}: ${REPORT_TYPE_LABELS[report.type]}`,
      replyTo: report.reporterEmail || undefined,
      html: `
        <p><strong>Tipo:</strong> ${escapeHtml(REPORT_TYPE_LABELS[report.type])}</p>
        ${report.occurredOn ? `<p><strong>Cuándo:</strong> ${escapeHtml(report.occurredOn)}</p>` : ""}
        <p><strong>Dónde:</strong> ${escapeHtml(report.location)}</p>
        <p><strong>Descripción:</strong><br>${escapeHtml(report.description).replace(/\n/g, "<br>")}</p>
        ${photoKeys.length ? `<p><strong>Fotos adjuntas:</strong> ${photoKeys.length}</p>` : ""}
        <hr>
        <p><strong>Quien reporta:</strong> ${report.reporterName ? escapeHtml(report.reporterName) : "Anónimo"}</p>
        ${report.reporterPhone ? `<p><strong>Teléfono:</strong> ${escapeHtml(report.reporterPhone)}</p>` : ""}
        ${report.reporterEmail ? `<p><strong>Correo:</strong> ${escapeHtml(report.reporterEmail)}</p>` : ""}
      `,
    });
  }

  return data<ActionResult>({ ok: true, folio: created?.folio ?? null });
}

export default function Report({ actionData }: Route.ComponentProps) {
  const errors = actionData?.errors;
  const values = actionData?.values;

  return (
    <>
      <PageHero
        eyebrow="Denuncia ciudadana"
        title="Reporta lo que daña al bosque"
        description="Tu reporte nos ayuda a actuar a tiempo. Revisamos cada caso y, cuando corresponde, lo canalizamos a las autoridades."
      />

      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {actionData?.ok ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
              <CircleCheck className="mx-auto size-12 text-forest-600" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold text-forest-950">¡Gracias por tu reporte!</h2>
              {actionData.folio ? (
                <p className="mt-2 text-stone-600">
                  Lo registramos con el folio <strong className="text-stone-900">#{actionData.folio}</strong>.
                  Guárdalo por si necesitas darle seguimiento.
                </p>
              ) : (
                <p className="mt-2 text-stone-600">Lo recibimos correctamente.</p>
              )}
              <ButtonLink to="/reportar" reloadDocument variant="secondary" className="mt-6">
                Enviar otro reporte
              </ButtonLink>
            </div>
          ) : (
            <Form
              method="post"
              encType="multipart/form-data"
              className="relative space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8"
            >
              <Honeypot />
              {actionData?.formError && <Alert tone="error">{actionData.formError}</Alert>}

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="¿Qué quieres reportar?"
                  name="type"
                  options={toOptions(REPORT_TYPE_LABELS)}
                  placeholder="Selecciona una opción"
                  defaultValue={values?.type ?? ""}
                  error={errors?.type}
                  required
                />
                <TextField
                  label="¿Cuándo ocurrió?"
                  name="occurredOn"
                  type="date"
                  max={todayISO()}
                  defaultValue={values?.occurredOn}
                  error={errors?.occurredOn}
                />
              </div>

              <TextField
                label="¿Dónde?"
                name="location"
                placeholder="Camino, paraje, predio o referencia cercana"
                defaultValue={values?.location}
                error={errors?.location}
                hint="Entre más precisa sea la ubicación, más rápido podremos atenderlo."
                required
              />

              <TextareaField
                label="Describe lo que viste"
                name="description"
                rows={5}
                defaultValue={values?.description}
                error={errors?.description}
                required
              />

              <div className="space-y-1.5">
                <label htmlFor="photos" className="block text-sm font-medium text-stone-700">
                  Fotos (opcional)
                </label>
                <label
                  htmlFor="photos"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-600 hover:border-forest-400"
                >
                  <Camera className="size-5 text-forest-600" aria-hidden />
                  <span>
                    Hasta {MAX_PHOTOS} fotos (JPG, PNG o WEBP, máximo {MAX_PHOTO_MB} MB cada una)
                  </span>
                </label>
                <input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-forest-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest-800"
                />
                {errors?.photos?.[0] && <p className="text-sm text-red-600">{errors.photos[0]}</p>}
              </div>

              <fieldset className="rounded-xl bg-stone-50 p-5">
                <legend className="px-1 text-sm font-semibold text-stone-800">Tus datos (opcional)</legend>
                <p className="text-sm text-stone-500">
                  Puedes reportar de forma anónima. Si nos dejas un contacto, podremos pedirte más detalles.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <TextField
                    label="Nombre"
                    name="reporterName"
                    autoComplete="name"
                    defaultValue={values?.reporterName}
                    error={errors?.reporterName}
                  />
                  <TextField
                    label="Teléfono"
                    name="reporterPhone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={values?.reporterPhone}
                    error={errors?.reporterPhone}
                  />
                  <TextField
                    label="Correo"
                    name="reporterEmail"
                    type="email"
                    autoComplete="email"
                    defaultValue={values?.reporterEmail}
                    error={errors?.reporterEmail}
                  />
                </div>
              </fieldset>

              <PrivacyConsent error={errors?.privacy} />

              <SubmitButton size="lg" pendingText="Enviando reporte…" className="w-full sm:w-auto">
                Enviar reporte
              </SubmitButton>
            </Form>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-red-700 p-6 text-white">
            <ShieldAlert className="size-8" aria-hidden />
            <h2 className="mt-3 font-display text-xl font-semibold">¿Hay un incendio activo?</h2>
            <p className="mt-2 text-sm text-red-50">
              No esperes: llama de inmediato al número de emergencias y aléjate del fuego.
            </p>
            <a
              href="tel:911"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
            >
              <Phone className="size-4" aria-hidden /> Llamar al 911
            </a>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="font-semibold text-forest-950">¿Qué puedes reportar?</h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>• Humo, fogatas o conatos de incendio</li>
              <li>• Tala o extracción ilegal de madera y leña</li>
              <li>• Tiraderos de basura o descargas</li>
              <li>• Construcciones, cercas o invasiones sospechosas</li>
              <li>• Cacería o saqueo de plantas y animales</li>
              <li>• Daños a caminos, cercas o señalización</li>
            </ul>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            Las fotos se optimizan y se eliminan sus metadatos (incluida la ubicación GPS) antes de guardarse.
          </p>
        </aside>
      </Container>
    </>
  );
}
