import { count, desc, eq } from "drizzle-orm";
import { ExternalLink, Newspaper, Plus } from "lucide-react";
import { Link } from "react-router";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui";
import { posts, users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/list";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "content");
  const pagination = getPaginationParams(url, 25);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        published: posts.published,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
        coverKey: posts.coverKey,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(users.id, posts.authorId))
      .orderBy(desc(posts.updatedAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(posts),
  ]);
  const meta = getPaginationMeta(pagination, total);
  return { rows, total: meta.total, page: meta.page, pageCount: meta.pageCount, now: new Date() };
}

export default function PostsList({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, now } = loaderData;

  return (
    <>
      <PageHeader
        title="Noticias y avisos"
        description="Publicaciones del sitio web."
        actions={
          <ButtonLink to="/admin/noticias/nueva">
            <Plus aria-hidden /> Nueva noticia
          </ButtonLink>
        }
      />

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th>Título</Th>
                <Th>Estado</Th>
                <Th>Publicación</Th>
                <Th>Actualizada</Th>
                <Th>
                  <span className="sr-only">Ver</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((post) => {
                const scheduled = post.published && post.publishedAt && new Date(post.publishedAt) > new Date(now);
                const live = post.published && !scheduled;
                return (
                  <tr key={post.id} className="hover:bg-stone-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        {post.coverKey ? (
                          <img src={`/media/${post.coverKey}`} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-600">
                            <Newspaper className="size-5" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link to={`/admin/noticias/${post.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                            {post.title}
                          </Link>
                          {post.authorName && <p className="text-xs text-stone-500">Por {post.authorName}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {live ? (
                        <Badge tone="green">Publicada</Badge>
                      ) : scheduled ? (
                        <Badge tone="blue">Programada</Badge>
                      ) : (
                        <Badge>Borrador</Badge>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">{post.published ? formatDateTime(post.publishedAt) : "—"}</Td>
                    <Td className="whitespace-nowrap">{formatDateTime(post.updatedAt)}</Td>
                    <Td className="text-right">
                      {live && (
                        <a
                          href={`/noticias/${post.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 hover:underline"
                        >
                          Ver <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={Newspaper}
          title="Aún no hay noticias"
          description="Comparte avisos, logros y actividades de la asociación en el sitio web."
          action={
            <ButtonLink to="/admin/noticias/nueva">
              <Plus aria-hidden /> Escribir la primera noticia
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
