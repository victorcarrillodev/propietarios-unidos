import { and, count, desc, eq, lte } from "drizzle-orm";
import { Newspaper } from "lucide-react";
import { PageHero, PostCard, Section } from "~/components/site/sections";
import { EmptyState, Pagination } from "~/components/ui";
import { posts } from "~/db/schema";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { seo, siteUrlFrom } from "~/lib/seo";
import { db } from "~/server/db.server";
import type { Route } from "./+types/news";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Noticias y avisos",
    description: "Noticias, avisos y comunicados de Propietarios Unidos sobre el Bosque La Primavera.",
    path: "/noticias",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
}

export async function loader({ url }: Route.LoaderArgs) {
  const pagination = getPaginationParams(url, 9);
  const where = and(eq(posts.published, true), lte(posts.publishedAt, new Date()));
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        coverKey: posts.coverKey,
        coverAlt: posts.coverAlt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(where)
      .orderBy(desc(posts.publishedAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(posts),
  ]);
  const meta = getPaginationMeta(pagination, total);
  return { items, page: meta.page, total: meta.total, pageCount: meta.pageCount };
}

export default function News({ loaderData }: Route.ComponentProps) {
  const { items, page, total, pageCount } = loaderData;
  return (
    <>
      <PageHero
        eyebrow="Noticias"
        title="Noticias y avisos"
        description="Entérate de lo que pasa en el bosque, de nuestras actividades y de los avisos importantes para usuarios y propietarios."
      />
      <Section>
        {items.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} />
          </>
        ) : (
          <EmptyState
            icon={Newspaper}
            title="Aún no hay noticias publicadas"
            description="Muy pronto compartiremos aquí avisos y novedades de la asociación."
          />
        )}
      </Section>
    </>
  );
}
