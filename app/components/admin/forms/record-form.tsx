import { Form } from "react-router";
import { ButtonLink, Card, CheckboxField, SelectField, SubmitButton, TextareaField, TextField } from "~/components/ui";
import type { ActivityRecord } from "~/db/schema";
import { RECORD_TYPE_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  record?: Pick<ActivityRecord, "type" | "title" | "description" | "occurredOn" | "location" | "participants" | "isPublic">;
  errors?: FieldErrors;
  values?: Record<string, string>;
  submitLabel: string;
  cancelTo: string;
};

export function RecordForm({ record, errors, values, submitLabel, cancelTo }: Props) {
  const isPublic = values ? values.isPublic === "on" : (record?.isPublic ?? false);
  return (
    <Form method="post">
      <Card>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Título"
            name="title"
            placeholder="Ej. Recorrido de vigilancia en el paraje El Chorro"
            defaultValue={values?.title ?? record?.title}
            error={errors?.title}
            required
            className="md:col-span-2"
          />
          <SelectField
            label="Tipo de actividad"
            name="type"
            options={toOptions(RECORD_TYPE_LABELS)}
            defaultValue={values?.type ?? record?.type ?? "vigilancia"}
            error={errors?.type}
            required
          />
          <TextField
            label="Fecha"
            name="occurredOn"
            type="date"
            defaultValue={values?.occurredOn ?? record?.occurredOn}
            error={errors?.occurredOn}
            required
          />
          <TextField
            label="Lugar"
            name="location"
            defaultValue={values?.location ?? record?.location ?? ""}
            error={errors?.location}
          />
          <TextField
            label="Número de participantes"
            name="participants"
            type="number"
            min={0}
            defaultValue={values?.participants ?? record?.participants ?? ""}
            error={errors?.participants}
          />
          <TextareaField
            label="Descripción y resultados"
            name="description"
            rows={5}
            defaultValue={values?.description ?? record?.description ?? ""}
            error={errors?.description}
            hint="Qué se hizo, qué se encontró y qué sigue."
            className="md:col-span-2"
          />
          <CheckboxField
            label="Mostrar en el sitio público"
            name="isPublic"
            defaultChecked={isPublic}
            hint="Aparecerá en la bitácora pública de “Qué hacemos”. No incluyas datos personales."
            className="md:col-span-2"
          />
        </div>
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
