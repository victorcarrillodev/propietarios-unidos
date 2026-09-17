import { eq } from "drizzle-orm";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { DocumentFields } from "~/components/admin/document-fields";
import { ButtonLink, buttonClasses, ConfirmButton, SubmitButton } from "~/components/ui/button";
import { Card, DescriptionList, PageHeader } from "~/components/ui/data";
import { documents, users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { documentSchema } from "~/lib/schemas/admin";
import { formatFileSize } from "~/lib/utils";
import { validateForm } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import { deleteFile } from "~/server/storage.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "documents");
  const id = requireId(params.documentId, "Documento no encontrado");
  const [row] = await db
    .select({ document: documents, uploadedByName: users.name })
    .from(documents)
    .leftJoin(users, eq(users.id, documents.uploadedBy))
    .where(eq(documents.id, id))
    .limit(1);
  if (!row) throw notFound("Documento no encontrado");
  return row;
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "documents");
  const id = requireId(params.documentId, "Documento no encontrado");
  const formData = await request.formData();

  if (getIntent(formData) === "delete") {
    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ title: documents.title, storageKey: documents.storageKey });
    if (!deleted) throw notFound("Documento no encontrado");
    await deleteFile(deleted.storageKey);
    await audit({
      userId: user.id,
      action: "document.delete",
      entityType: "document",
      entityId: id,
      summary: `Eliminó el documento "${deleted.title}"`,
    });
    return redirectWithToast("/admin/documentos", { type: "success", message: "Documento eliminado." });
  }

  const result = validateForm(documentSchema, formData);
  if (!result.success) return data({ errors: result.errors, values: result.values }, { status: 400 });

  const [updated] = await db.update(documents).set(result.data).where(eq(documents.id, id)).returning({ id: documents.id });
  if (!updated) throw notFound("Documento no encontrado");

  await audit({
    userId: user.id,
    action: "document.update",
    entityType: "document",
    entityId: id,
    summary: `Actualizó el documento "${result.data.title}"${result.data.isPublic ? " (público)" : " (interno)"}`,
  });
  return redirectWithToast("/admin/documentos", { type: "success", message: "Documento actualizado." });
}

export default function EditDocument({ loaderData, actionData }: Route.ComponentProps) {
  const { document, uploadedByName } = loaderData;
  return (
    <>
      <PageHeader
        title={document.title}
        back={{ to: "/admin/documentos", label: "Documentos" }}
        actions={
          <>
            <a href={`/admin/documentos/${document.id}/archivo`} target="_blank" rel="noopener" className={buttonClasses({ variant: "secondary" })}>
              <ExternalLink aria-hidden /> Abrir
            </a>
            <a href={`/admin/documentos/${document.id}/archivo?descargar`} className={buttonClasses()}>
              <Download aria-hidden /> Descargar
            </a>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Form method="post" className="xl:col-span-2">
          <Card title="Datos del documento">
            <DocumentFields document={document} errors={actionData?.errors} values={actionData?.values} />
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-5">
              <ButtonLink to="/admin/documentos" variant="ghost">
                Cancelar
              </ButtonLink>
              <SubmitButton intent="save">Guardar cambios</SubmitButton>
            </div>
          </Card>
        </Form>

        <div className="space-y-6">
          <Card title="Archivo">
            <DescriptionList
              items={[
                { label: "Nombre", value: document.fileName },
                { label: "Tamaño", value: formatFileSize(document.sizeBytes) },
                { label: "Subido", value: formatDateTime(document.createdAt) },
                { label: "Por", value: uploadedByName ?? "—" },
              ]}
            />
            {document.isPublic && (
              <p className="mt-4 text-sm text-stone-600">
                Enlace público:{" "}
                <a href={`/documentos/${document.id}`} target="_blank" rel="noopener" className="font-medium break-all text-forest-700 hover:underline">
                  /documentos/{document.id}
                </a>
              </p>
            )}
          </Card>
          <Card title="Eliminar documento">
            <Form method="post">
              <p className="mb-3 text-sm text-stone-600">Se borrará el archivo de forma permanente.</p>
              <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message={`¿Eliminar "${document.title}" permanentemente?`}>
                <Trash2 aria-hidden /> Eliminar
              </ConfirmButton>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
}
