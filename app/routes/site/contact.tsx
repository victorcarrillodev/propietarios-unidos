import { CircleCheck, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { FacebookIcon } from "~/components/brand";
import type { ReactNode } from "react";
import { data, Form, useRouteLoaderData } from "react-router";
import { PrivacyConsent } from "~/components/site/privacy-consent";
import { Container, PageHero } from "~/components/site/sections";
import { SubmitButton } from "~/components/ui/button";
import { Alert, Honeypot, TextareaField, TextField } from "~/components/ui/form";
import { contactMessages } from "~/db/schema";
import { contactSchema } from "~/lib/schemas/public";
import { seo, siteUrlFrom } from "~/lib/seo";
import { telLink, whatsappLink } from "~/lib/utils";
import { validateForm, type FieldErrors } from "~/lib/validation";
import { db } from "~/server/db.server";
import { getClientIp, rateLimit } from "~/server/rate-limit.server";
import { isLikelyBot, parseSmallForm } from "~/server/uploads.server";
import type { loader as layoutLoader } from "./layout";
import type { Route } from "./+types/contact";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Contacto",
    description: "Escríbenos, llámanos o mándanos WhatsApp. Estamos abiertos a escuchar tus comentarios y denuncias.",
    path: "/contacto",
    siteUrl: siteUrlFrom(matches),
  });

type ActionResult = { ok: boolean; formError?: string; errors?: FieldErrors; values?: Record<string, string> };

export async function action({ request }: Route.ActionArgs) {
  const limit = rateLimit(`contact:${getClientIp(request)}`, 5, 10 * 60_000);
  if (!limit.allowed) {
    return data<ActionResult>(
      { ok: false, formError: "Has enviado varios mensajes seguidos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }
  const { formData, error } = await parseSmallForm(request);
  if (!formData) return data<ActionResult>({ ok: false, formError: error }, { status: 400 });
  if (isLikelyBot(formData)) return data<ActionResult>({ ok: true });

  const result = validateForm(contactSchema, formData);
  if (!result.success) {
    return data<ActionResult>({ ok: false, errors: result.errors, values: result.values }, { status: 400 });
  }
  const { privacy: _privacy, ...message } = result.data;
  await db.insert(contactMessages).values(message);
  return data<ActionResult>({ ok: true });
}

function ContactItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <div className="text-sm break-words text-stone-600">{children}</div>
      </div>
    </li>
  );
}

export default function Contact({ actionData }: Route.ComponentProps) {
  const layout = useRouteLoaderData<typeof layoutLoader>("routes/site/layout");
  const s = layout?.settings;
  const errors = actionData?.errors;
  const values = actionData?.values;

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos"
        description="Estamos abiertos a escuchar tus comentarios, dudas y denuncias. Escríbenos por el medio que prefieras."
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.4fr]">
        <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
          <ul className="space-y-6">
            {s?.whatsapp && (
              <ContactItem icon={<MessageCircle className="size-5" aria-hidden />} title="WhatsApp">
                <a
                  href={whatsappLink(s.whatsapp, "Hola, les escribo desde el sitio web.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-forest-700 hover:underline"
                >
                  Enviar mensaje
                </a>
              </ContactItem>
            )}
            {s?.phone && (
              <ContactItem icon={<Phone className="size-5" aria-hidden />} title="Teléfono">
                <a href={telLink(s.phone)} className="hover:text-forest-700">
                  {s.phone}
                </a>
              </ContactItem>
            )}
            {s?.email && (
              <ContactItem icon={<Mail className="size-5" aria-hidden />} title="Correo">
                <a href={`mailto:${s.email}`} className="hover:text-forest-700">
                  {s.email}
                </a>
              </ContactItem>
            )}
            {s?.address && (
              <ContactItem icon={<MapPin className="size-5" aria-hidden />} title="Dirección">
                <p>{s.address}</p>
                {s.mapsUrl && (
                  <a
                    href={s.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-medium text-forest-700 hover:underline"
                  >
                    Ver en el mapa
                  </a>
                )}
              </ContactItem>
            )}
            {s?.hours && (
              <ContactItem icon={<Clock className="size-5" aria-hidden />} title="Horario">
                {s.hours}
              </ContactItem>
            )}
            {s?.facebookUrl && (
              <ContactItem icon={<FacebookIcon className="size-5" />} title="Facebook">
                <a
                  href={s.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-forest-700 hover:underline"
                >
                  Visita nuestra página
                </a>
              </ContactItem>
            )}
          </ul>
        </aside>

        <div>
          {actionData?.ok ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
              <CircleCheck className="mx-auto size-12 text-forest-600" aria-hidden />
              <h2 className="mt-4 font-display text-2xl font-semibold text-forest-950">¡Mensaje enviado!</h2>
              <p className="mt-2 text-stone-600">Gracias por escribirnos. Te responderemos lo antes posible.</p>
            </div>
          ) : (
            <Form method="post" className="relative space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
              <Honeypot />
              <h2 className="font-display text-2xl font-semibold text-forest-950">Envíanos un mensaje</h2>
              {actionData?.formError && <Alert tone="error">{actionData.formError}</Alert>}
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Nombre"
                  name="name"
                  autoComplete="name"
                  defaultValue={values?.name}
                  error={errors?.name}
                  required
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
                  label="Teléfono (opcional)"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={values?.phone}
                  error={errors?.phone}
                />
                <TextField
                  label="Asunto"
                  name="subject"
                  defaultValue={values?.subject}
                  error={errors?.subject}
                  required
                />
              </div>
              <TextareaField
                label="Mensaje"
                name="message"
                rows={6}
                defaultValue={values?.message}
                error={errors?.message}
                required
              />
              <PrivacyConsent error={errors?.privacy} />
              <SubmitButton size="lg" pendingText="Enviando…" className="w-full sm:w-auto">
                Enviar mensaje
              </SubmitButton>
            </Form>
          )}
        </div>
      </Container>
    </>
  );
}
