import { and, desc, eq, lte, ne } from "drizzle-orm";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { data, Link, useRouteLoaderData } from "react-router";
import { FacebookIcon } from "~/components/brand";
import { Container, PostCard, Section } from "~/components/site/sections";
import { ButtonLink } from "~/components/ui/button";
import { posts } from "~/db/schema";
import { formatTimestampDate } from "~/lib/format";
import { seo, siteUrlFrom } from "~/lib/seo";
import { db } from "~/server/db.server";
import { renderMarkdown } from "~/server/markdown.server";
import type { loader as rootLoader } from "~/root";
import type { Route } from "./+types/news-post";

export const meta: Route.MetaFunction = ({ loaderData, matches, params }) => {
  if (!loaderData) return [{ title: "Noticia no encontrada · Propietarios Unidos" }];
  const { post } = loaderData;
  return seo({
    title: post.title,
    description: post.excerpt ?? undefined,
    path: `/noticias/${params.slug}`,
    image: post.coverKey ? `/media/${post.coverKey}` : null,
    siteUrl: siteUrlFrom(matches),
    type: "article",
  });
};

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" };
}

export async function loader({ params }: Route.LoaderArgs) {
  const now = new Date();
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, params.slug), eq(posts.published, true), lte(posts.publishedAt, now)))
    .limit(1);
  if (!post) throw data("Noticia no encontrada", { status: 404 });

  const more = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverKey: posts.coverKey,
      coverAlt: posts.coverAlt,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.published, true), lte(posts.publishedAt, now), ne(posts.id, post.id)))
    .orderBy(desc(posts.publishedAt))
    .limit(3);

  return {
    post: {
      title: post.title,
      excerpt: post.excerpt,
      coverKey: post.coverKey,
      coverAlt: post.coverAlt,
      publishedAt: post.publishedAt,
      html: renderMarkdown(post.body),
    },
    more,
  };
}

export default function NewsPost({ loaderData, params }: Route.ComponentProps) {
  const { post, more } = loaderData;
  const root = useRouteLoaderData<typeof rootLoader>("root");
  const url = `${root?.siteUrl ?? ""}/noticias/${params.slug}`;

  return (
    <>
      <article>
        <header className="bg-forest-900 text-white">
          <Container className="max-w-3xl py-14 sm:py-20">
            <Link
              to="/noticias"
              className="inline-flex items-center gap-1 text-sm font-medium text-forest-200 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden /> Noticias
            </Link>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-forest-200">{formatTimestampDate(post.publishedAt)}</p>
          </Container>
        </header>
        <Container className="max-w-3xl py-12">
          {post.coverKey && (
            <img
              src={`/media/${post.coverKey}`}
              alt={post.coverAlt ?? ""}
              width={1200}
              height={750}
              className="-mt-24 mb-10 w-full rounded-2xl object-cover shadow-lg sm:-mt-28"
            />
          )}
          {post.excerpt && <p className="mb-8 text-xl leading-relaxed text-stone-700">{post.excerpt}</p>}
          <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: post.html }} />

          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
            <span className="text-sm font-medium text-stone-600">Compartir:</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50"
            >
              <FacebookIcon className="size-4" /> Facebook
            </a>
          </div>
        </Container>
      </article>

      {more.length > 0 && (
        <Section className="bg-white">
          <h2 className="font-display text-2xl font-semibold text-forest-950">Más noticias</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <PostCard key={item.slug} post={item} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

export function ErrorBoundary() {
  return (
    <Section>
      <title>Noticia no encontrada · Propietarios Unidos</title>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-semibold text-forest-950">Noticia no encontrada</h1>
        <p className="mt-3 text-stone-600">Es posible que la noticia se haya retirado o que el enlace sea incorrecto.</p>
        <ButtonLink to="/noticias" className="mt-8">
          <ArrowLeft aria-hidden /> Ver todas las noticias
        </ButtonLink>
      </div>
    </Section>
  );
}
