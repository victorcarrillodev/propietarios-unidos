import { ArrowUpRight, Leaf } from "lucide-react";
import { Link } from "react-router";
import { TopoPattern } from "~/components/brand";
import { formatTimestampDate } from "~/lib/format";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverKey: string | null;
  coverAlt: string | null;
  publishedAt: Date | string | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-stone-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-stone-300">
      <div className="aspect-[16/10] overflow-hidden bg-forest-100 relative">
        {post.coverKey ? (
          <img
            src={`/media/${post.coverKey}`}
            alt={post.coverAlt ?? ""}
            loading="lazy"
            decoding="async"
            width={800}
            height={500}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-forest-800 text-forest-300">
            <TopoPattern className="text-white/10" />
            <Leaf className="relative size-12 opacity-80" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold tracking-wider text-earth-600 uppercase">
          {formatTimestampDate(post.publishedAt)}
        </p>

        <h3 className="mt-2.5 font-display text-xl leading-snug font-semibold text-forest-950 group-hover:text-forest-700 transition-colors">
          <Link to={`/noticias/${post.slug}`} prefetch="intent" className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>
        )}

        <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-semibold text-forest-700 group-hover:text-forest-900">
          <span>Leer noticia</span>
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </div>
      </div>
    </article>
  );
}
