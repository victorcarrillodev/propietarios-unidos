import { ImageUp } from "lucide-react";
import { Form } from "react-router";
import { ButtonLink, SubmitButton } from "~/components/ui/button";
import { Card } from "~/components/ui/data";
import { Alert, CheckboxField, TextareaField, TextField } from "~/components/ui/form";
import type { Post } from "~/db/schema";
import { dateToLocalInput } from "~/lib/format";
import type { FieldErrors } from "~/lib/validation";

type Props = {
  post?: Pick<Post, "title" | "slug" | "excerpt" | "body" | "coverKey" | "coverAlt" | "published" | "publishedAt">;
  errors?: FieldErrors;
  values?: Record<string, string>;
  formError?: string;
  submitLabel: string;
  cancelTo: string;
};

export function PostForm({ post, errors, values, formError, submitLabel, cancelTo }: Props) {
  const published = values ? values.published === "on" : (post?.published ?? false);
  return (
    <Form method="post" encType="multipart/form-data">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          {formError && (
            <Alert tone="error" className="mb-5">
              {formError}
            </Alert>
          )}
          <div className="space-y-5">
            <TextField label="Título" name="title" defaultValue={values?.title ?? post?.title} error={errors?.title} required />
            <TextareaField
              label="Resumen"
              name="excerpt"
              rows={2}
              defaultValue={values?.excerpt ?? post?.excerpt ?? ""}
              error={errors?.excerpt}
              hint="Una o dos frases. Se muestra en las tarjetas y al compartir en redes sociales."
            />
            <TextareaField
              label="Contenido"
              name="body"
              rows={16}
              defaultValue={values?.body ?? post?.body}
              error={errors?.body}
              required
              className="font-mono"
              hint={
                <>
                  Admite formato Markdown: <code>## Subtítulo</code>, <code>**negritas**</code>, <code>- listas</code>,{" "}
                  <code>[enlace](https://…)</code>. Deja una línea en blanco entre párrafos.
                </>
              }
            />
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Publicación">
            <div className="space-y-4">
              <CheckboxField label="Publicada" name="published" defaultChecked={published} hint="Si no la marcas, se guarda como borrador." />
              <TextField
                label="Fecha de publicación"
                name="publishedAt"
                type="datetime-local"
                defaultValue={values?.publishedAt ?? dateToLocalInput(post?.publishedAt)}
                error={errors?.publishedAt}
                hint="Vacía = ahora. Una fecha futura la programa."
              />
              <TextField
                label="Dirección (slug)"
                name="slug"
                placeholder="se-genera-del-titulo"
                defaultValue={values?.slug ?? post?.slug ?? ""}
                error={errors?.slug}
                hint="Parte final de la URL: /noticias/…"
              />
            </div>
          </Card>

          <Card title="Imagen de portada">
            <div className="space-y-4">
              {post?.coverKey && (
                <div>
                  <img src={`/media/${post.coverKey}`} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
                  <CheckboxField label="Quitar portada actual" name="removeCover" className="mt-3" />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="cover" className="flex items-center gap-2 text-sm font-medium text-stone-700">
                  <ImageUp className="size-4" aria-hidden /> {post?.coverKey ? "Reemplazar imagen" : "Subir imagen"}
                </label>
                <input
                  id="cover"
                  name="cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-forest-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest-800"
                />
                {errors?.cover?.[0] ? (
                  <p className="text-sm text-red-600">{errors.cover[0]}</p>
                ) : (
                  <p className="text-xs text-stone-500">JPG, PNG o WEBP (máx. 10 MB). Se optimiza automáticamente.</p>
                )}
              </div>
              <TextField
                label="Descripción de la imagen"
                name="coverAlt"
                defaultValue={values?.coverAlt ?? post?.coverAlt ?? ""}
                error={errors?.coverAlt}
                hint="Para personas que usan lectores de pantalla."
              />
            </div>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink to={cancelTo} variant="ghost">
              Cancelar
            </ButtonLink>
            <SubmitButton intent="save" pendingText="Guardando…">
              {submitLabel}
            </SubmitButton>
          </div>
        </div>
      </div>
    </Form>
  );
}
