import { data } from "react-router";
import { PostForm } from "~/components/admin/forms";
import { PageHeader } from "~/components/ui";
import { posts } from "~/db/schema";
import { postSchema } from "~/lib/schemas/admin";
import { formValues, validateForm, type FieldErrors } from "~/lib/validation";
import { audit } from "~/server/audit.server";
import { db } from "~/server/db.server";
import { redirectWithToast } from "~/server/flash.server";
import { requireModule } from "~/server/guards.server";
import { uniquePostSlug } from "~/server/queries/content.server";
import { deleteFile, saveOptimizedImage } from "~/server/storage.server";
import { getFiles, parseMultipartForm } from "~/server/uploads.server";
import type { Route } from "./+types/new";

export function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "content");
  return null;
}

type ActionResult = { formError?: string; errors?: FieldErrors; values?: Record<string, string> };

export async function action({ request, context }: Route.ActionArgs) {
  const user = requireModule(context, "content");
  const { formData, error } = await parseMultipartForm(request, { maxFileSizeMb: 10, maxFiles: 1 });
  if (!formData) return data<ActionResult>({ formError: error }, { status: 400 });

  const result = validateForm(postSchema, formData);
  if (!result.success) return data<ActionResult>({ errors: result.errors, values: result.values }, { status: 400 });
  const { removeCover: _removeCover, slug, publishedAt, ...post } = result.data;

  let coverKey: string | null = null;
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

  try {
    const [created] = await db
      .insert(posts)
      .values({
        ...post,
        slug: await uniquePostSlug(slug ?? post.title),
        coverKey,
        publishedAt: publishedAt ?? (post.published ? new Date() : null),
        authorId: user.id,
      })
      .returning({ id: posts.id });
    await audit({
      userId: user.id,
      action: "post.create",
      entityType: "post",
      entityId: created!.id,
      summary: `${post.published ? "Publicó" : "Creó el borrador de"} la noticia "${post.title}"`,
    });
  } catch (dbError) {
    await deleteFile(coverKey);
    throw dbError;
  }

  return redirectWithToast("/admin/noticias", {
    type: "success",
    message: post.published ? "Noticia publicada." : "Borrador guardado.",
  });
}

export default function NewPost({ actionData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Nueva noticia" back={{ to: "/admin/noticias", label: "Noticias" }} />
      <PostForm
        errors={actionData?.errors}
        values={actionData?.values}
        formError={actionData?.formError}
        submitLabel="Guardar"
        cancelTo="/admin/noticias"
      />
    </>
  );
}
