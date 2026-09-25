import { eq } from "drizzle-orm";
import { ExternalLink, Trash2 } from "lucide-react";
import { data, Form } from "react-router";
import { PostForm } from "~/components/admin/forms";
import { buttonClasses, Card, ConfirmButton, PageHeader } from "~/components/ui";
import { posts } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { postSchema } from "~/lib/schemas/admin";
import { formValues, validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { getIntent, notFound, requireId, requireModule } from "~/server/guards.server";
import { uniquePostSlug } from "~/server/queries/content.server";
import { deleteFile, saveOptimizedImage } from "~/server/storage.server";
import { getFiles, parseMultipartForm } from "~/server/uploads.server";
import type { Route } from "./+types/edit";

export async function loader({ context, params }: Route.LoaderArgs) {
  requireModule(context, "content");
  const id = requireId(params.postId, "Noticia no encontrada");
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) throw notFound("Noticia no encontrada");
  return { post, isLive: post.published && (!post.publishedAt || post.publishedAt <= new Date()) };
}

type ActionResult = { formError?: string; errors?: FieldErrors; values?: Record<string, string> };

export async function action({ request, context, params }: Route.ActionArgs) {
  const user = requireModule(context, "content");
  const id = requireId(params.postId, "Noticia no encontrada");
  const [existing] = await db
    .select({ title: posts.title, coverKey: posts.coverKey, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!existing) throw notFound("Noticia no encontrada");

  const { formData, error } = await parseMultipartForm(request, { maxFileSizeMb: 10, maxFiles: 1 });
  if (!formData) return data<ActionResult>({ formError: error }, { status: 400 });

  if (getIntent(formData) === "delete") {
    await db.delete(posts).where(eq(posts.id, id));
    await deleteFile(existing.coverKey);
    await audit({ userId: user.id, action: "post.delete", summary: `Eliminó la noticia "${existing.title}"` });
    return redirectWithToast("/admin/noticias", { type: "success", message: "Noticia eliminada." });
  }

  const result = validateForm(postSchema, formData);
  if (!result.success) return data<ActionResult>({ errors: result.errors, values: result.values }, { status: 400 });
  const { removeCover, slug, publishedAt, ...post } = result.data;

  let coverKey = removeCover ? null : existing.coverKey;
  const [cover] = getFiles(formData, "cover");
  if (cover) {
    try {
      coverKey = await saveOptimizedImage(cover, "images");
    } catch {
      return data<ActionResult>(
        { errors: { cover: ["La imagen no es válida. Usa JPG, PNG o WEBP."] }, values: formValues(formData) },
        { status: 400 },
      );
    }
  }

  await db
    .update(posts)
    .set({
      ...post,
      slug: await uniquePostSlug(slug ?? post.title, id),
      coverKey,
      publishedAt: publishedAt ?? (post.published ? (existing.publishedAt ?? new Date()) : null),
    })
    .where(eq(posts.id, id));

  if (existing.coverKey && existing.coverKey !== coverKey) await deleteFile(existing.coverKey);

  await audit({
    userId: user.id,
    action: "post.update",
    entityType: "post",
    entityId: id,
    summary: `Actualizó la noticia "${post.title}"${post.published ? "" : " (borrador)"}`,
  });
  return redirectWithToast("/admin/noticias", { type: "success", message: "Noticia actualizada." });
}

export default function EditPost({ loaderData, actionData }: Route.ComponentProps) {
  const { post, isLive } = loaderData;
  return (
    <>
      <PageHeader
        title="Editar noticia"
        description={`Última actualización: ${formatDateTime(post.updatedAt)}`}
        back={{ to: "/admin/noticias", label: "Noticias" }}
        actions={
          isLive ? (
            <a href={`/noticias/${post.slug}`} target="_blank" rel="noopener" className={buttonClasses({ variant: "secondary" })}>
              <ExternalLink aria-hidden /> Ver en el sitio
            </a>
          ) : undefined
        }
      />
      <div className="space-y-6">
        <PostForm
          post={post}
          errors={actionData?.errors}
          values={actionData?.values}
          formError={actionData?.formError}
          submitLabel="Guardar cambios"
          cancelTo="/admin/noticias"
        />
        <Card title="Eliminar noticia">
          <Form method="post" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-600">La noticia y su imagen se eliminarán de forma permanente.</p>
            <ConfirmButton name="intent" value="delete" variant="danger" size="sm" message={`¿Eliminar "${post.title}"?`}>
              <Trash2 aria-hidden /> Eliminar
            </ConfirmButton>
          </Form>
        </Card>
      </div>
    </>
  );
}
