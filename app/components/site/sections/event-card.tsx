import { Clock, MapPin } from "lucide-react";
import { dateParts, formatTime } from "~/lib/format";
import { cn } from "~/lib/utils";

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
        "flex gap-4 sm:gap-5 rounded-2xl bg-white p-5 sm:p-6 shadow-xs ring-1 ring-stone-200/80 transition-all hover:shadow-md",
        muted && "bg-stone-50/70 shadow-none ring-stone-200/60 opacity-80",
      )}
    >
      {/* Bloque de fecha tipo calendario */}
      <div
        className={cn(
          "flex w-16 sm:w-18 shrink-0 flex-col items-center justify-center rounded-2xl py-3 text-center shadow-xs",
          muted ? "bg-stone-200 text-stone-600" : "bg-forest-900 text-white",
        )}
      >
        <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
          {parts.month}
        </span>
        <span className="font-display text-2xl sm:text-3xl leading-none font-semibold my-0.5">
          {parts.day}
        </span>
        <span className="text-[11px] capitalize opacity-80 font-medium">{parts.weekday}</span>
      </div>

      {/* Detalles del evento */}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg sm:text-xl leading-snug font-semibold text-forest-950">
          {event.title}
        </h3>
        <ul className="mt-2.5 space-y-1 text-sm text-stone-600">
          <li className="flex items-center gap-2">
            <Clock className="size-4 text-forest-600 shrink-0" aria-hidden />
            <span>
              {formatTime(event.startsAt)}
              {event.endsAt && ` – ${formatTime(event.endsAt)}`} h
            </span>
          </li>
          {event.location && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-forest-600" aria-hidden />
              <span className="truncate">{event.location}</span>
            </li>
          )}
        </ul>
        {event.description && (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-stone-600">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
}
