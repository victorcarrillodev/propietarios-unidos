import { ExternalLink } from "lucide-react";
import { data, Form } from "react-router";
import { buttonClasses, Card, PageHeader, SubmitButton, TextareaField, TextField } from "~/components/ui";
import { siteSettingsSchema, type SiteSettings } from "~/lib/site-settings";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import { getSiteSettings, saveSiteSettings } from "~/server/settings.server";
import type { Route } from "./+types/settings";

export async function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "settings");
  return { settings: await getSiteSettings() };
}

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "settings");
  const result = validateForm(siteSettingsSchema, await request.formData());
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  await saveSiteSettings(result.data);
  await audit({ userId: user.id, action: "settings.update", summary: "Actualizó la configuración del sitio" });
  return redirectWithToast("/admin/configuracion", { type: "success", message: "Configuración guardada. Los cambios ya se ven en el sitio." });
}

const MARKDOWN_HINT = "Admite Markdown: **negritas**, listas con guiones y enlaces [texto](https://…).";

export default function Settings({ loaderData, actionData }: Route.ComponentProps) {
  const { settings } = loaderData;
  const errors = actionData?.errors;
  const value = (name: keyof SiteSettings) => actionData?.values?.[name] ?? settings[name];

  return (
    <>
      <PageHeader
        title="Configuración del sitio"
        description="Textos y datos de contacto que se muestran en el sitio público."
        actions={
          <a href="/" target="_blank" rel="noopener" className={buttonClasses({ variant: "secondary" })}>
            <ExternalLink aria-hidden /> Ver sitio
          </a>
        }
      />

      <Form method="post" className="space-y-6">
        <Card title="Identidad">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Nombre de la asociación" name="orgName" defaultValue={value("orgName")} error={errors?.orgName} required className="md:col-span-2" />
            <TextField label="Nombre corto" name="shortName" defaultValue={value("shortName")} error={errors?.shortName} required />
            <TextField label="Frase principal" name="tagline" defaultValue={value("tagline")} error={errors?.tagline} hint="Aparece en la portada y el pie de página." />
          </div>
        </Card>

        <Card title="Quiénes somos" description="Contenido de la página “Quiénes somos”.">
          <div className="grid gap-5">
            <TextareaField label="Presentación" name="aboutText" rows={8} defaultValue={value("aboutText")} error={errors?.aboutText} hint={MARKDOWN_HINT} />
            <div className="grid gap-5 md:grid-cols-2">
              <TextareaField label="Misión" name="mission" rows={4} defaultValue={value("mission")} error={errors?.mission} />
              <TextareaField label="Visión" name="vision" rows={4} defaultValue={value("vision")} error={errors?.vision} />
            </div>
            <TextareaField
              label="Historia (opcional)"
              name="history"
              rows={6}
              defaultValue={value("history")}
              error={errors?.history}
              hint={`Si la dejas vacía, la sección no se muestra. ${MARKDOWN_HINT}`}
            />
            <TextareaField
              label="Mesa directiva (opcional)"
              name="board"
              rows={5}
              defaultValue={value("board")}
              error={errors?.board}
              placeholder={"Presidencia | Nombre Apellido\nTesorería | Nombre Apellido"}
              hint="Una persona por línea con el formato: Cargo | Nombre. Si la dejas vacía, no se muestra."
            />
          </div>
        </Card>

        <Card title="Contacto">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Dirección" name="address" defaultValue={value("address")} error={errors?.address} className="md:col-span-2" />
            <TextField label="Teléfono" name="phone" defaultValue={value("phone")} error={errors?.phone} />
            <TextField
              label="WhatsApp"
              name="whatsapp"
              inputMode="numeric"
              defaultValue={value("whatsapp")}
              error={errors?.whatsapp}
              hint="Solo números con lada de país. Ej. 523312345678"
            />
            <TextField label="Correo" name="email" type="email" defaultValue={value("email")} error={errors?.email} />
            <TextField label="Horario de atención" name="hours" defaultValue={value("hours")} error={errors?.hours} />
            <TextField label="Página de Facebook" name="facebookUrl" type="url" defaultValue={value("facebookUrl")} error={errors?.facebookUrl} />
            <TextField
              label="Enlace de Google Maps"
              name="mapsUrl"
              type="url"
              defaultValue={value("mapsUrl")}
              error={errors?.mapsUrl}
            />
          </div>
        </Card>

        <Card title="Aportaciones y donativos" description="Se muestra en la página “Únete”.">
          <TextareaField
            label="Información para aportar"
            name="donationInfo"
            rows={5}
            defaultValue={value("donationInfo")}
            error={errors?.donationInfo}
            hint={`Por ejemplo, datos bancarios o cómo entregar aportaciones. Si la dejas vacía, no se muestra. ${MARKDOWN_HINT}`}
          />
        </Card>

        <div className="flex justify-end">
          <SubmitButton size="lg">Guardar configuración</SubmitButton>
        </div>
      </Form>
    </>
  );
}
