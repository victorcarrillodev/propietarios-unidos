import { count, desc, eq } from "drizzle-orm";
import { ArrowRight, Check, NotebookPen } from "lucide-react";
import { PROGRAMS } from "~/components/site/programs";
import { ActivityTimeline, PageHero, Section, SectionHeading } from "~/components/site/sections";
import { ButtonLink, EmptyState, Pagination } from "~/components/ui";
import { activityRecords } from "~/db/schema";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { seo, siteUrlFrom } from "~/lib/seo";
import { db } from "~/server/db.server";
import type { Route } from "./+types/work";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Qué hacemos",
    description:
      "Prevención de incendios, mejora de caminos, vigilancia, reforestación, limpieza y diálogo con usuarios: el trabajo de Propietarios Unidos por el Bosque La Primavera.",
    path: "/que-hacemos",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
}

export async function loader({ url }: Route.LoaderArgs) {
  const pagination = getPaginationParams(url, 10);
  const where = eq(activityRecords.isPublic, true);
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: activityRecords.id,
        type: activityRecords.type,
        title: activityRecords.title,
        description: activityRecords.description,
        occurredOn: activityRecords.occurredOn,
        location: activityRecords.location,
        participants: activityRecords.participants,
      })
      .from(activityRecords)
      .where(where)
      .orderBy(desc(activityRecords.occurredOn), desc(activityRecords.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(activityRecords).where(where),
  ]);
  const meta = getPaginationMeta(pagination, total);
  return { items, page: meta.page, total: meta.total, pageCount: meta.pageCount };
}

export default function Work({ loaderData }: Route.ComponentProps) {
  const { items, page, total, pageCount } = loaderData;

  return (
    <>
      <PageHero
        eyebrow="Qué hacemos"
        title="Trabajo en campo y en comunidad"
        description="Nuestras acciones buscan prevenir daños, mejorar el bosque y abrir canales de diálogo entre usuarios y propietarios."
      />

      <Section className="relative bg-gradient-to-b from-forest-50/70 via-white to-forest-50/30 border-b border-forest-900/5">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map(({ icon: Icon, title, text, details }) => (
            <li
              key={title}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-xs ring-1 ring-forest-900/10 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-forest-400/30"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-forest-100 text-forest-800 ring-1 ring-forest-200/70">
                <Icon className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-forest-950">{title}</h2>
              <p className="mt-2 leading-relaxed text-stone-600">{text}</p>
              <ul className="mt-4 space-y-2 border-t border-forest-100/80 pt-4 text-sm text-stone-600">
                {details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
                    {detail}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="bitacora">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading
              eyebrow="Bitácora pública"
              title="Registro de nuestras acciones"
              description="Publicamos las actividades que realizamos para que cualquier persona pueda conocer el trabajo de la asociación."
            />
            <ButtonLink to="/unete" className="mt-8">
              Quiero participar <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
          <div>
            {items.length > 0 ? (
              <>
                <ActivityTimeline items={items} />
                <Pagination page={page} pageCount={pageCount} total={total} />
              </>
            ) : (
              <EmptyState
                icon={NotebookPen}
                title="Pronto publicaremos nuestras actividades"
                description="Aquí aparecerán los recorridos, jornadas y mejoras que realicemos en el bosque."
              />
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
