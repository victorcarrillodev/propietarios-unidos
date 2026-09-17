import { and, asc, desc, eq, gte, isNull, lt, or } from "drizzle-orm";
import { CalendarDays } from "lucide-react";
import { EventCard, PageHero, Section, SectionHeading } from "~/components/site/sections";
import { EmptyState } from "~/components/ui/data";
import { events } from "~/db/schema";
import { seo, siteUrlFrom } from "~/lib/seo";
import { db } from "~/server/db.server";
import type { Route } from "./+types/events";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Eventos",
    description: "Asambleas, jornadas de limpieza, reforestaciones y actividades de Propietarios Unidos en el Bosque La Primavera.",
    path: "/eventos",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
}

const eventFields = {
  id: events.id,
  title: events.title,
  description: events.description,
  location: events.location,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
};

export async function loader() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db
      .select(eventFields)
      .from(events)
      .where(and(eq(events.published, true), or(gte(events.startsAt, now), gte(events.endsAt, now))))
      .orderBy(asc(events.startsAt))
      .limit(30),
    db
      .select(eventFields)
      .from(events)
      .where(
        and(
          eq(events.published, true),
          lt(events.startsAt, now),
          or(isNull(events.endsAt), lt(events.endsAt, now)),
        ),
      )
      .orderBy(desc(events.startsAt))
      .limit(12),
  ]);
  return { upcoming, past };
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { upcoming, past } = loaderData;
  return (
    <>
      <PageHero
        eyebrow="Agenda"
        title="Eventos y actividades"
        description="Asambleas, jornadas de trabajo y actividades abiertas. ¡Te esperamos!"
      />
      <Section>
        <SectionHeading title="Próximos eventos" />
        <div className="mt-8">
          {upcoming.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No hay eventos programados por ahora"
              description="Síguenos en redes sociales o vuelve pronto para conocer las próximas actividades."
            />
          )}
        </div>
      </Section>
      {past.length > 0 && (
        <Section className="bg-white">
          <SectionHeading title="Eventos anteriores" />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} muted />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
