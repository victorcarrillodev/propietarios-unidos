import { asc, desc, gte, lt, or } from "drizzle-orm";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { Link } from "react-router";
import { ButtonLink } from "~/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "~/components/ui/data";
import { events } from "~/db/schema";
import { dateParts, formatTime } from "~/lib/format";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/list";

export async function loader({ context }: Route.LoaderArgs) {
  requireModule(context, "content");
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db
      .select()
      .from(events)
      .where(or(gte(events.startsAt, now), gte(events.endsAt, now)))
      .orderBy(asc(events.startsAt))
      .limit(100),
    db.select().from(events).where(lt(events.startsAt, now)).orderBy(desc(events.startsAt)).limit(30),
  ]);
  const upcomingIds = new Set(upcoming.map((event) => event.id));
  return { upcoming, past: past.filter((event) => !upcomingIds.has(event.id)) };
}

type EventItem = Route.ComponentProps["loaderData"]["upcoming"][number];

function EventList({ items }: { items: EventItem[] }) {
  return (
    <ul className="divide-y divide-stone-100">
      {items.map((event) => {
        const parts = dateParts(event.startsAt);
        return (
          <li key={event.id}>
            <Link to={`/admin/eventos/${event.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50">
              <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-forest-50 py-1 text-forest-800">
                <span className="text-[11px] font-medium uppercase">{parts.month}</span>
                <span className="text-lg leading-none font-semibold">{parts.day}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-stone-900">{event.title}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-xs text-stone-500">
                  <span>
                    {formatTime(event.startsAt)}
                    {event.endsAt && ` – ${formatTime(event.endsAt)}`} h
                  </span>
                  {event.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" aria-hidden /> {event.location}
                    </span>
                  )}
                </span>
              </span>
              {!event.published && <Badge>Interno</Badge>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function EventsAdmin({ loaderData }: Route.ComponentProps) {
  const { upcoming, past } = loaderData;
  return (
    <>
      <PageHeader
        title="Eventos"
        description="Asambleas, jornadas y actividades. Los eventos públicos aparecen en la agenda del sitio."
        actions={
          <ButtonLink to="/admin/eventos/nuevo">
            <Plus aria-hidden /> Nuevo evento
          </ButtonLink>
        }
      />
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no hay eventos"
          description="Programa asambleas y jornadas para que la comunidad se entere."
          action={
            <ButtonLink to="/admin/eventos/nuevo">
              <Plus aria-hidden /> Crear evento
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Próximos" bodyClassName="p-0">
            {upcoming.length > 0 ? (
              <EventList items={upcoming} />
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-500">No hay eventos próximos.</p>
            )}
          </Card>
          <Card title="Anteriores" bodyClassName="p-0">
            {past.length > 0 ? (
              <EventList items={past} />
            ) : (
              <p className="px-5 py-8 text-center text-sm text-stone-500">Sin eventos anteriores.</p>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
