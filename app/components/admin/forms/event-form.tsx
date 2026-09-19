import { Form } from "react-router";
import { ButtonLink, SubmitButton } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { CheckboxField, TextareaField, TextField } from "~/components/ui/form";
import type { EventRow } from "~/db/schema";
import { dateToLocalInput } from "~/lib/format";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  event?: Pick<EventRow, "title" | "description" | "location" | "startsAt" | "endsAt" | "published">;
  errors?: FieldErrors;
  values?: Record<string, string>;
  submitLabel: string;
  cancelTo: string;
};

export function EventForm({ event, errors, values, submitLabel, cancelTo }: Props) {
  const published = values ? values.published === "on" : (event?.published ?? true);
  return (
    <Form method="post">
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Título"
            name="title"
            placeholder="Ej. Jornada de limpieza en el acceso La Cuchilla"
            defaultValue={values?.title ?? event?.title}
            error={errors?.title}
            required
            className="md:col-span-2"
          />
          <TextField
            label="Inicio"
            name="startsAt"
            type="datetime-local"
            defaultValue={values?.startsAt ?? dateToLocalInput(event?.startsAt)}
            error={errors?.startsAt}
            required
          />
          <TextField
            label="Término (opcional)"
            name="endsAt"
            type="datetime-local"
            defaultValue={values?.endsAt ?? dateToLocalInput(event?.endsAt)}
            error={errors?.endsAt}
          />
          <TextField
            label="Lugar"
            name="location"
            defaultValue={values?.location ?? event?.location ?? ""}
            error={errors?.location}
            className="md:col-span-2"
          />
          <TextareaField
            label="Descripción"
            name="description"
            rows={5}
            defaultValue={values?.description ?? event?.description ?? ""}
            error={errors?.description}
            hint="Qué se hará, qué llevar, punto de reunión, etc."
            className="md:col-span-2"
          />
          <CheckboxField
            label="Mostrar en el sitio público"
            name="published"
            defaultChecked={published}
            hint="Desmárcalo para eventos internos (solo visibles en el panel)."
            className="md:col-span-2"
          />
        </div>
        <p className="mt-4 text-xs text-stone-500">Las horas se registran en horario del centro de México.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-stone-100 pt-5">
          <ButtonLink to={cancelTo} variant="ghost">
            Cancelar
          </ButtonLink>
          <SubmitButton intent="save">{submitLabel}</SubmitButton>
        </div>
      </Card>
    </Form>
  );
}
