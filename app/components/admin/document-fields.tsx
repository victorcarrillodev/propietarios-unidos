import { CheckboxField, SelectField, TextareaField, TextField } from "~/components/ui/form";
import type { DocumentRow } from "~/db/schema";
import { DOCUMENT_CATEGORY_LABELS, toOptions } from "~/lib/labels";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  document?: Pick<DocumentRow, "title" | "description" | "category" | "documentDate" | "isPublic">;
  errors?: FieldErrors;
  values?: Record<string, string>;
};

/** Campos de metadatos de un documento (se usan al subir y al editar). */
export function DocumentFields({ document, errors, values }: Props) {
  const isPublic = values ? values.isPublic === "on" : (document?.isPublic ?? false);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        label="Título"
        name="title"
        placeholder="Ej. Acta de asamblea ordinaria"
        defaultValue={values?.title ?? document?.title}
        error={errors?.title}
        required
        className="md:col-span-2"
      />
      <SelectField
        label="Categoría"
        name="category"
        options={toOptions(DOCUMENT_CATEGORY_LABELS)}
        defaultValue={values?.category ?? document?.category ?? "acta"}
        error={errors?.category}
        required
      />
      <TextField
        label="Fecha del documento"
        name="documentDate"
        type="date"
        defaultValue={values?.documentDate ?? document?.documentDate ?? ""}
        error={errors?.documentDate}
        hint="Por ejemplo, la fecha de la asamblea o del informe."
      />
      <TextareaField
        label="Descripción"
        name="description"
        rows={3}
        defaultValue={values?.description ?? document?.description ?? ""}
        error={errors?.description}
        className="md:col-span-2"
      />
      <CheckboxField
        label="Documento público"
        name="isPublic"
        defaultChecked={isPublic}
        hint="Se podrá consultar en la página de Transparencia del sitio. Revisa que no contenga datos personales."
        className="md:col-span-2"
      />
    </div>
  );
}
