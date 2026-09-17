import { FileUp } from "lucide-react";
import { data, Form } from "react-router";
import { DocumentFields } from "~/components/admin/document-fields";
import { ButtonLink, SubmitButton } from "~/components/ui/button";
import { Card, PageHeader } from "~/components/ui/data";
import { Alert } from "~/components/ui/form";
import { documents } from "~/db/schema";
import { documentSchema } from "~/lib/schemas/admin";
import { formValues, validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import { createStorageKey, deleteFile, detectDocumentType, DOCUMENT_ACCEPT, saveFile } from "~/server/storage.server";
import { getFiles, parseMultipartForm } from "~/server/uploads.server";
import type { Route } from "./+types/upload";

const MAX_DOCUMENT_MB = 25;

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "documents");
  return { accept: DOCUMENT_ACCEPT, maxMb: MAX_DOCUMENT_MB };
}

type ActionResult = { formError?: string; errors?: FieldErrors; values?: Record<string, string> };

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "documents");
  const { formData, error } = await parseMultipartForm(request, { maxFileSizeMb: MAX_DOCUMENT_MB, maxFiles: 1 });
  if (!formData) return data<ActionResult>({ formError: error }, { status: 400 });

  const result = validateForm(documentSchema, formData);
  const [file] = getFiles(formData, "file");
  const errors: FieldErrors = result.success ? {} : { ...result.errors };
  if (!file) errors.file = ["Selecciona un archivo"];
  if (!result.success || !file) {
    return data<ActionResult>({ errors, values: formValues(formData) }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectDocumentType(bytes, file.name);
  if (!type) {
    return data<ActionResult>(
      {
        errors: { file: ["Tipo de archivo no permitido. Usa PDF, imágenes, Word, Excel, PowerPoint, OpenDocument, TXT o CSV."] },
        values: formValues(formData),
      },
      { status: 400 },
    );
  }

  const storageKey = createStorageKey("documents", type.extension);
  await saveFile(storageKey, bytes);

  try {
    const [created] = await db
      .insert(documents)
      .values({
        ...result.data,
        storageKey,
        fileName: file.name.slice(0, 200),
        mimeType: type.mimeType,
        sizeBytes: bytes.byteLength,
        uploadedBy: user.id,
      })
      .returning({ id: documents.id });

    await audit({
      userId: user.id,
      action: "document.upload",
      entityType: "document",
      entityId: created!.id,
      summary: `Subió el documento "${result.data.title}"${result.data.isPublic ? " (público)" : ""}`,
    });
  } catch (dbError) {
    await deleteFile(storageKey);
    throw dbError;
  }

  return redirectWithToast("/admin/documentos", { type: "success", message: "Documento guardado." });
}

export default function UploadDocument({ loaderData, actionData }: Route.ComponentProps) {
  const fileError = actionData?.errors?.file?.[0];
  return (
    <>
      <PageHeader title="Subir documento" back={{ to: "/admin/documentos", label: "Documentos" }} />
      <Form method="post" encType="multipart/form-data">
        <Card>
          {actionData?.formError && (
            <Alert tone="error" className="mb-5">
              {actionData.formError}
            </Alert>
          )}
          <div className="mb-6 space-y-1.5">
            <label htmlFor="file" className="block text-sm font-medium text-stone-700">
              Archivo <span className="text-red-600">*</span>
            </label>
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-8 text-center hover:border-forest-400"
            >
              <FileUp className="size-8 text-forest-600" aria-hidden />
              <span className="text-sm text-stone-600">
                PDF, imágenes, Word, Excel, PowerPoint, OpenDocument, TXT o CSV · máximo {loaderData.maxMb} MB
              </span>
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              accept={loaderData.accept}
              aria-invalid={fileError ? true : undefined}
              className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-forest-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest-800"
            />
            {fileError && <p className="text-sm text-red-600">{fileError}</p>}
          </div>

          <DocumentFields errors={actionData?.errors} values={actionData?.values} />

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-5">
            <ButtonLink to="/admin/documentos" variant="ghost">
              Cancelar
            </ButtonLink>
            <SubmitButton pendingText="Subiendo…">Subir documento</SubmitButton>
          </div>
        </Card>
      </Form>
    </>
  );
}
