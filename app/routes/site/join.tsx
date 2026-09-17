import { CircleCheck, HandHeart, Megaphone, ShieldCheck, Users } from "lucide-react";
import { data, Form } from "react-router";
import { PrivacyConsent } from "~/components/site/privacy-consent";
import { Container, PageHero } from "~/components/site/sections";
import { SubmitButton } from "~/components/ui/button";
import { Alert, Honeypot, SelectField, TextareaField, TextField } from "~/components/ui/form";
import { membershipRequests } from "~/db/schema";
import { MUNICIPALITIES } from "~/lib/enums";
import { MEMBER_TYPE_LABELS, toOptions } from "~/lib/labels";
import { joinSchema } from "~/lib/schemas/public";
import { seo, siteUrlFrom } from "~/lib/seo";
import { validateForm, type FieldErrors } from "~/lib/validation";
import { db } from "~/server/db.server";
import { renderMarkdown } from "~/server/markdown.server";
import { getClientIp, rateLimit } from "~/server/rate-limit.server";
import { getSiteSettings } from "~/server/settings.server";
import { isLikelyBot, parseSmallForm } from "~/server/uploads.server";
import type { Route } from "./+types/join";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Únete",
    description:
      "¿Tienes un predio en el Bosque La Primavera o quieres colaborar? Súmate a Propietarios Unidos y trabajemos juntos por el bosque.",
    path: "/unete",
    siteUrl: siteUrlFrom(matches),
  });

export async function loader() {
  const settings = await getSiteSettings();
  return { donationHtml: renderMarkdown(settings.donationInfo) };
}

type ActionResult = { ok: boolean; formError?: string; errors?: FieldErrors; values?: Record<string, string> };

export async function action({ request }: Route.ActionArgs) {
  const limit = rateLimit(`join:${getClientIp(request)}`, 5, 30 * 60_000);
  if (!limit.allowed) {
    return data<ActionResult>(
      { ok: false, formError: "Recibimos varias solicitudes seguidas. Intenta de nuevo más tarde." },
      { status: 429 },
    );
  }
  const { formData, error } = await parseSmallForm(request);
  if (!formData) return data<ActionResult>({ ok: false, formError: error }, { status: 400 });
  if (isLikelyBot(formData)) return data<ActionResult>({ ok: true });

  const result = validateForm(joinSchema, formData);
  if (!result.success) {
    return data<ActionResult>({ ok: false, errors: result.errors, values: result.values }, { status: 400 });
  }
  const { privacy: _privacy, ...request_ } = result.data;
  await db.insert(membershipRequests).values(request_);
  return data<ActionResult>({ ok: true });
}

const BENEFITS = [
  { icon: Users, title: "Más fuerza unidos", text: "Coordinamos esfuerzos entre predios vecinos para cuidar mejor el territorio." },
  { icon: ShieldCheck, title: "Prevención y vigilancia", text: "Participas en acciones para prevenir incendios, tala e invasiones." },
  { icon: Megaphone, title: "Voz ante autoridades", text: "Representamos a los propietarios en el diálogo con autoridades y usuarios." },
  { icon: HandHeart, title: "Mejoras para todos", text: "Sumamos recursos para mejorar caminos, accesos y zonas afectadas." },
];

export default function Join({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData?.errors;
  const values = actionData?.values;

  return (
    <>
      <PageHero
        eyebrow="Únete"
        title="Súmate a Propietarios Unidos"
        description="Si tienes un predio en el Bosque La Primavera, eres ejidatario o quieres colaborar con nosotros, déjanos tus datos y te contactaremos."
      />

      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.4fr]">
        <aside className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-forest-950">¿Por qué unirte?</h2>
          <ul className="space-y-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                <Icon className="size-6 shrink-0 text-forest-600" aria-hidden />
                <div>
                  <h3 className="font-semibold text-forest-950">{title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          {loaderData.donationHtml && (
            <div className="rounded-2xl bg-earth-100 p-5 ring-1 ring-earth-200">
              <h3 className="font-semibold text-forest-950">Aportaciones y donativos</h3>
              <div className="prose-content mt-2 text-sm" dangerouslySetInnerHTML={{ __html: loaderData.donationHtml }} />
            </div>
          )}
        </aside>

        <div>
          {actionData?.ok ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
              <CircleCheck className="mx-auto size-12 text-forest-600" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold text-forest-950">¡Recibimos tu solicitud!</h2>
              <p className="mt-2 text-stone-600">
                Gracias por tu interés en cuidar el bosque. Nos pondremos en contacto contigo muy pronto.
              </p>
            </div>
          ) : (
            <Form method="post" className="relative space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
              <Honeypot />
              <h2 className="font-display text-2xl font-semibold text-forest-950">Solicitud de ingreso</h2>
              {actionData?.formError && <Alert tone="error">{actionData.formError}</Alert>}

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Nombre completo"
                  name="fullName"
                  autoComplete="name"
                  defaultValue={values?.fullName}
                  error={errors?.fullName}
                  required
                  className="sm:col-span-2"
                />
                <TextField
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={values?.email}
                  error={errors?.email}
                  required
                />
                <TextField
                  label="Teléfono / WhatsApp"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={values?.phone}
                  error={errors?.phone}
                  required
                />
                <SelectField
                  label="¿Cómo quieres participar?"
                  name="memberType"
                  options={toOptions(MEMBER_TYPE_LABELS)}
                  defaultValue={values?.memberType ?? "propietario"}
                  error={errors?.memberType}
                  required
                  className="sm:col-span-2"
                />
              </div>

              <fieldset className="rounded-xl bg-stone-50 p-5">
                <legend className="px-1 text-sm font-semibold text-stone-800">Datos del predio (si tienes)</legend>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Nombre del predio"
                    name="propertyName"
                    defaultValue={values?.propertyName}
                    error={errors?.propertyName}
                  />
                  <SelectField
                    label="Municipio"
                    name="municipality"
                    options={MUNICIPALITIES.map((m) => ({ value: m, label: m }))}
                    placeholder="Selecciona"
                    defaultValue={values?.municipality ?? ""}
                    error={errors?.municipality}
                  />
                  <TextField
                    label="Localidad o paraje"
                    name="locality"
                    defaultValue={values?.locality}
                    error={errors?.locality}
                  />
                  <TextField
                    label="Superficie aproximada (ha)"
                    name="areaHa"
                    inputMode="decimal"
                    placeholder="Ej. 2.5"
                    defaultValue={values?.areaHa}
                    error={errors?.areaHa}
                  />
                </div>
              </fieldset>

              <TextareaField
                label="¿Algo que quieras contarnos?"
                name="message"
                rows={4}
                defaultValue={values?.message}
                error={errors?.message}
              />

              <PrivacyConsent error={errors?.privacy} />

              <SubmitButton size="lg" pendingText="Enviando…" className="w-full sm:w-auto">
                Enviar solicitud
              </SubmitButton>
            </Form>
          )}
        </div>
      </Container>
    </>
  );
}
