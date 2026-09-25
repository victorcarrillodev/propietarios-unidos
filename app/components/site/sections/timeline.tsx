import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "~/components/ui";
import type { RecordType } from "~/lib/enums";
import { formatDate } from "~/lib/format";
import { RECORD_TYPE_LABELS, RECORD_TYPE_TONES } from "~/lib/labels";

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
    <ol className="relative space-y-7 border-l-2 border-forest-200/90 pl-6 sm:pl-7">
      {items.map((item, index) => (
        <li key={item.id} className="relative group">
          {/* Nodo indicador en la línea temporal */}
          <span
            className={`absolute top-1.5 -left-[31px] sm:-left-[35px] size-4 rounded-full border-2 border-cream bg-forest-600 transition-transform group-hover:scale-125 ${
              index === 0 ? "ring-4 ring-forest-100" : ""
            }`}
            aria-hidden
          />

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 font-medium text-stone-600">
              <CalendarDays className="size-3.5 text-forest-600" aria-hidden />
              {formatDate(item.occurredOn)}
            </span>
            <Badge tone={RECORD_TYPE_TONES[item.type]} dot>
              {RECORD_TYPE_LABELS[item.type]}
            </Badge>
          </div>

          <h3 className="mt-1.5 font-display text-lg font-semibold text-forest-950 group-hover:text-forest-800 transition-colors">
            {item.title}
          </h3>

          {item.description && (
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-stone-600">
              {item.description}
            </p>
          )}

          {(item.location || item.participants) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium">
              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-forest-600" aria-hidden />
                  {item.location}
                </span>
              )}
              {item.participants && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5 text-forest-600" aria-hidden />
                  {item.participants} participantes
                </span>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
