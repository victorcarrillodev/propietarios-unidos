import { CalendarDays, Clock, Leaf, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { TopoPattern } from "~/components/brand";
import { Badge } from "~/components/ui/data";
import type { RecordType } from "~/lib/enums";
import { dateParts, formatDate, formatTime, formatTimestampDate } from "~/lib/format";
import { RECORD_TYPE_LABELS, RECORD_TYPE_TONES } from "~/lib/labels";
import { cn } from "~/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-semibold tracking-wider uppercase",
            light ? "text-amber-300" : "text-earth-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl",
          light ? "text-white" : "text-forest-950",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-lg leading-relaxed", light ? "text-forest-100" : "text-stone-600")}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Encabezado para páginas interiores. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-white">
      <TopoPattern className="text-white/[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-forest-950/40" aria-hidden />
      <Container className="relative py-16 sm:py-20">
        {eyebrow && <p className="text-sm font-semibold tracking-wider text-amber-300 uppercase">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-forest-100">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}

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
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[16/10] overflow-hidden bg-forest-100">
        {post.coverKey ? (
          <img
            src={`/media/${post.coverKey}`}
            alt={post.coverAlt ?? ""}
            loading="lazy"
            decoding="async"
            width={800}
            height={500}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="relative flex h-full items-center justify-center bg-forest-800 text-forest-300">
            <TopoPattern className="text-white/10" />
            <Leaf className="relative size-10" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-earth-600">{formatTimestampDate(post.publishedAt)}</p>
        <h3 className="mt-2 font-display text-xl leading-snug font-semibold text-forest-950">
          <Link to={`/noticias/${post.slug}`} prefetch="intent" className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>}
      </div>
    </article>
  );
}

export type EventCardData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
};

export function EventCard({ event, muted = false }: { event: EventCardData; muted?: boolean }) {
  const parts = dateParts(event.startsAt);
  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200",
        muted && "bg-stone-50 shadow-none",
      )}
    >
      <div
        className={cn(
          "flex w-16 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-center",
          muted ? "bg-stone-200 text-stone-600" : "bg-forest-800 text-white",
        )}
      >
        <span className="text-xs font-medium uppercase">{parts.month}</span>
        <span className="font-display text-2xl leading-none font-semibold">{parts.day}</span>
        <span className="text-[11px] capitalize opacity-80">{parts.weekday}</span>
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-lg leading-snug font-semibold text-forest-950">{event.title}</h3>
        <ul className="mt-2 space-y-1 text-sm text-stone-600">
          <li className="flex items-center gap-1.5">
            <Clock className="size-4 text-forest-600" aria-hidden />
            {formatTime(event.startsAt)}
            {event.endsAt && ` – ${formatTime(event.endsAt)}`} h
          </li>
          {event.location && (
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-forest-600" aria-hidden />
              {event.location}
            </li>
          )}
        </ul>
        {event.description && (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-stone-600">{event.description}</p>
        )}
      </div>
    </article>
  );
}

export type ActivityData = {
  id: string;
  type: RecordType;
  title: string;
  description: string | null;
  occurredOn: string;
  location: string | null;
  participants: number | null;
};

export function ActivityTimeline({ items }: { items: ActivityData[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-forest-200 pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute top-1.5 -left-[31px] size-3.5 rounded-full border-2 border-cream bg-forest-600"
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDate(item.occurredOn)}
            </span>
            <Badge tone={RECORD_TYPE_TONES[item.type]}>{RECORD_TYPE_LABELS[item.type]}</Badge>
          </div>
          <h3 className="mt-1 font-semibold text-forest-950">{item.title}</h3>
          {item.description && (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-stone-600">{item.description}</p>
          )}
          {(item.location || item.participants) && (
            <p className="mt-1 text-xs text-stone-500">
              {item.location}
              {item.location && item.participants ? " · " : ""}
              {item.participants ? `${item.participants} participantes` : ""}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
