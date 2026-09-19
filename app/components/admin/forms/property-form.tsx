import { Form } from "react-router";
import { SubmitButton } from "~/components/ui/button";
import { SelectField, TextareaField, TextField, type Option } from "~/components/ui/form";
import type { Property } from "~/db/schema";
import { MUNICIPALITIES } from "~/lib/enums";
import { TENURE_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  intent: "add-property" | "update-property";
  property?: Pick<Property, "id" | "name" | "municipality" | "locality" | "tenure" | "areaHa" | "cadastralKey" | "notes">;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

export function PropertyForm({ intent, property, errors, values }: Props) {
  const idPrefix = property ? `property-${property.id}` : "property-new";
  const value = (name: "name" | "municipality" | "locality" | "tenure" | "areaHa" | "cadastralKey" | "notes") =>
    values?.[name] ?? property?.[name] ?? "";
  const municipalities: Option[] = MUNICIPALITIES.map((m) => ({ value: m, label: m }));
  const current = value("municipality");
  if (current && !municipalities.some((m) => m.value === current)) municipalities.unshift({ value: current, label: current });

  return (
    <Form method="post" className="grid gap-4 sm:grid-cols-2">
      {property && <input type="hidden" name="propertyId" value={property.id} />}
      <TextField id={`${idPrefix}-name`} label="Nombre del predio" name="name" defaultValue={value("name")} error={errors?.name} required />
      <SelectField
        id={`${idPrefix}-tenure`}
        label="Régimen"
        name="tenure"
        options={toOptions(TENURE_LABELS)}
        defaultValue={value("tenure") || "privada"}
        error={errors?.tenure}
      />
      <SelectField
        id={`${idPrefix}-municipality`}
        label="Municipio"
        name="municipality"
        options={municipalities}
        placeholder="Sin especificar"
        defaultValue={current}
        error={errors?.municipality}
      />
      <TextField id={`${idPrefix}-locality`} label="Localidad o paraje" name="locality" defaultValue={value("locality")} error={errors?.locality} />
      <TextField
        id={`${idPrefix}-area`}
        label="Superficie (ha)"
        name="areaHa"
        inputMode="decimal"
        defaultValue={value("areaHa")}
        error={errors?.areaHa}
      />
      <TextField
        id={`${idPrefix}-cadastral`}
        label="Clave catastral"
        name="cadastralKey"
        defaultValue={value("cadastralKey")}
        error={errors?.cadastralKey}
      />
      <TextareaField
        id={`${idPrefix}-notes`}
        label="Notas"
        name="notes"
        rows={2}
        defaultValue={value("notes")}
        error={errors?.notes}
        className="sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <SubmitButton intent={intent} size="sm">
          {intent === "add-property" ? "Agregar predio" : "Guardar predio"}
        </SubmitButton>
      </div>
    </Form>
  );
}
