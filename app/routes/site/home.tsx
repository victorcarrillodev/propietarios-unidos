import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { ArrowRight, Award, Calendar, Hammer, MapPin, MessagesSquare, ShieldCheck, TreeDeciduous, TriangleAlert, Users } from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";
import { TopoPattern } from "~/components/brand";
import { PROGRAMS } from "~/components/site/programs";
import { ActivityTimeline, Container, EventCard, PostCard, Section, SectionHeading } from "~/components/site/sections";
import { ButtonLink } from "~/components/ui";
import { activityRecords, events, posts } from "~/db/schema";
import { seo, siteSettingsFrom, siteUrlFrom } from "~/lib/seo";
import { cn } from "~/lib/utils";
import { db } from "~/server/db.server";
import type { loader as layoutLoader } from "./layout";
import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = ({ matches }) => {
  const siteUrl = siteUrlFrom(matches);
  const settings = siteSettingsFrom(matches);
  return [
    ...seo({ siteUrl, path: "/" }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "NGO",
        name: settings?.orgName ?? "Propietarios Unidos en Mejoras del Bosque La Primavera",
        url: siteUrl || undefined,
        logo: siteUrl ? `${siteUrl}/icon-512.png` : undefined,
        description: settings?.tagline || undefined,
        areaServed: "Bosque La Primavera, Jalisco, México",
        address: settings?.address || {
          "@type": "PostalAddress",
          addressLocality: "Tala",
          addressRegion: "Jalisco",
          addressCountry: "MX",
        },
        telephone: settings?.phone || undefined,
        email: settings?.email || undefined,
        sameAs: settings?.facebookUrl ? [settings.facebookUrl] : undefined,
      },
    },
  ];
};

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
}

export async function loader() {
  const now = new Date();
  const [latestPosts, upcomingEvents, activity] = await Promise.all([
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
      .where(and(eq(posts.published, true), lte(posts.publishedAt, now)))
      .orderBy(desc(posts.publishedAt))
      .limit(3),
    db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
      })
      .from(events)
      .where(and(eq(events.published, true), or(gte(events.startsAt, now), gte(events.endsAt, now))))
      .orderBy(asc(events.startsAt))
      .limit(3),
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
      .where(eq(activityRecords.isPublic, true))
      .orderBy(desc(activityRecords.occurredOn), desc(activityRecords.createdAt))
      .limit(4),
  ]);
  return { latestPosts, upcomingEvents, activity };
}

const STATS = [
  {
    icon: TreeDeciduous,
    value: "30,500 ha",
    title: "Área protegida",
    label: "Bosque de pino y encino en el poniente de Guadalajara",
  },
  {
    icon: Calendar,
    value: "1980",
    title: "Decreto federal",
    label: "Protegido como reserva natural desde hace más de 40 años",
  },
  {
    icon: MapPin,
    value: "4 municipios",
    title: "Territorio vivo",
    label: "Abarca Tala, Zapopan, Tlajomulco y El Arenal",
  },
  {
    icon: Award,
    value: "UNESCO",
    title: "Reconocimiento",
    label: "Distinción como Reserva de la Biosfera (MAB)",
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Cuidar",
    text: "Prevención de incendios, vigilancia y atención de denuncias en nuestros predios.",
  },
  {
    icon: Hammer,
    title: "Mejorar",
    text: "Mantenimiento de caminos, accesos, brechas cortafuego y señalización.",
  },
  {
    icon: MessagesSquare,
    title: "Comunicar",
    text: "Canales abiertos entre usuarios y propietarios para escuchar y construir acuerdos.",
  },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { latestPosts, upcomingEvents, activity } = loaderData;
  const layout = useRouteLoaderData<typeof layoutLoader>("routes/site/layout");
  const tagline = layout?.settings.tagline;

  return (
    <>
      {/* Portada */}
      <section className="relative isolate overflow-hidden bg-forest-950 text-white">
        <img
          src="/home/hero.webp"
          alt="Bosque La Primavera"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center brightness-105 contrast-[1.02]"
          aria-hidden="true"
        />
        {/* Capa con matiz verde bosque para unificar tono fotográfico */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-black/25"
          aria-hidden="true"
        />
        <Container className="relative flex min-h-[580px] flex-col justify-center pt-20 pb-28 sm:pb-32 lg:min-h-[650px]">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-forest-950/75 backdrop-blur-sm px-3.5 py-1 text-sm font-medium text-forest-100 ring-1 ring-white/25">
            <MapPin className="size-4 text-amber-300" aria-hidden /> Tala, Jalisco · Bosque La Primavera
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.08] sm:text-6xl lg:text-7xl drop-shadow-lg">
            Unidos por el <span className="text-amber-300">bosque</span> que nos da vida
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white sm:text-xl drop-shadow-md font-medium">
            {tagline ?? "Propietarios que cuidan, mejoran y defienden el Bosque La Primavera."} Prevenimos
            incendios, mejoramos caminos y escuchamos a quienes lo visitan.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink to="/quienes-somos" variant="accent" size="lg" prefetch="intent">
              Conócenos <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink to="/reportar" variant="light" size="lg">
              <TriangleAlert aria-hidden /> Reportar una incidencia
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Características y cifras del bosque */}
      <section className="relative z-10 -mt-16 sm:-mt-20">
        <Container>
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-forest-900/10 p-6 sm:p-8 lg:p-10 border-t-2 border-forest-600/40">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:divide-x lg:divide-forest-100">
              {STATS.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className={cn("flex items-start gap-4", idx > 0 && "lg:pl-8")}>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700 ring-1 ring-forest-200/80">
                      <Icon className="size-6" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block font-display text-2xl sm:text-3xl text-forest-950 leading-none">
                        {stat.value}
                      </span>
                      <span className="mt-1.5 block text-xs font-bold uppercase tracking-wider text-forest-700">
                        {stat.title}
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-stone-500">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-forest-100 pt-5 text-xs text-stone-500">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-forest-500" aria-hidden />
                Datos oficiales del Área de Protección de Flora y Fauna La Primavera (APFFLP)
              </span>
              <Link
                to="/el-bosque"
                className="inline-flex items-center gap-1 font-medium text-forest-700 transition-colors hover:text-forest-900 hover:underline"
              >
                Conoce más sobre el bosque y su biodiversidad <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Propósito */}
      <Section className="relative bg-gradient-to-b from-forest-50/70 via-white to-forest-50/30 border-y border-forest-900/5">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Nuestro propósito"
            title="Cuidar el bosque es cuidar nuestra casa"
            description="Somos dueñas y dueños de predios en La Primavera. Nos organizamos para que el bosque siga vivo: con trabajo en campo, acuerdos claros y diálogo con quienes lo visitan."
          />
          <ul className="grid gap-4">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-forest-900/10 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-forest-400/30"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-800 ring-1 ring-forest-200/70">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-forest-950">{title}</h3>
                  <p className="mt-1 text-stone-600">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Qué hacemos - Inmersión verde bosque */}
      <Section className="relative overflow-hidden bg-forest-950 text-white py-20 sm:py-28">
        <TopoPattern className="text-white/[0.04]" />
        <div
          className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-forest-800/25 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <SectionHeading
            light
            eyebrow="Qué hacemos"
            title="Trabajo constante por La Primavera"
            description="Acciones concretas, en campo y en comunidad, para prevenir daños y mejorar el bosque."
            align="center"
          />
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="group relative flex flex-col rounded-2xl bg-forest-900/75 p-6 ring-1 ring-forest-700/50 backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:bg-forest-900 hover:ring-forest-400/50 hover:shadow-xl"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-forest-800/90 text-amber-300 ring-1 ring-white/10 transition-colors group-hover:bg-amber-400 group-hover:text-forest-950">
                  <Icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-white transition-colors group-hover:text-amber-200">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-forest-100/90">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <ButtonLink to="/que-hacemos" variant="accent" size="lg" prefetch="intent">
              Ver todas nuestras acciones <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* Bitácora pública */}
      {activity.length > 0 && (
        <Section className="relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <SectionHeading
              eyebrow="Bitácora de acciones"
              title="Lo que hemos hecho recientemente"
              description="Registramos nuestras actividades para que cualquiera pueda ver el trabajo que hacemos por el bosque."
            />
            <div>
              <ActivityTimeline items={activity} />
              <Link
                to="/que-hacemos#bitacora"
                className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-900"
              >
                Ver la bitácora completa <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </Section>
      )}

      {/* Noticias y eventos */}
      {(latestPosts.length > 0 || upcomingEvents.length > 0) && (
        <Section className="relative bg-gradient-to-b from-forest-50/80 via-forest-100/30 to-forest-50/70 border-y border-forest-900/10">
          <div className="grid gap-12 lg:grid-cols-3">
            {latestPosts.length > 0 && (
              <div className={upcomingEvents.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                <div className="flex items-end justify-between gap-4">
                  <SectionHeading eyebrow="Noticias y avisos" title="Lo más reciente" />
                  <Link to="/noticias" className="text-sm font-semibold text-forest-700 hover:text-forest-900">
                    Ver todas
                  </Link>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {latestPosts.slice(0, upcomingEvents.length > 0 ? 2 : 3).map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div className={latestPosts.length > 0 ? undefined : "lg:col-span-3"}>
                <div className="flex items-end justify-between gap-4">
                  <SectionHeading eyebrow="Agenda" title="Próximos eventos" />
                  <Link to="/eventos" className="text-sm font-semibold text-forest-700 hover:text-forest-900">
                    Ver agenda
                  </Link>
                </div>
                <div className="mt-8 grid gap-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={{ ...event, description: null }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Llamados a la acción */}
      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 via-forest-950 to-forest-900 p-8 text-white ring-1 ring-forest-700/60 shadow-lg sm:p-10">
            <TopoPattern className="text-white/[0.04]" />
            <div className="relative">
              <Users className="size-10 text-amber-300" aria-hidden />
              <h2 className="mt-5 font-display text-3xl font-semibold">¿Tienes un predio en La Primavera?</h2>
              <p className="mt-3 max-w-md text-forest-100">
                Súmate a la asociación. Juntos tenemos más fuerza para cuidar, mejorar y defender el bosque.
              </p>
              <ButtonLink to="/unete" variant="accent" className="mt-8">
                Quiero unirme <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-950 via-forest-900 to-forest-950 p-8 text-white ring-1 ring-amber-400/30 shadow-lg sm:p-10">
            <TopoPattern className="text-white/[0.04]" />
            <div className="relative">
              <TriangleAlert className="size-10 text-amber-400" aria-hidden />
              <h2 className="mt-5 font-display text-3xl font-semibold">¿Viste humo, tala o basura?</h2>
              <p className="mt-3 max-w-md text-forest-100">
                Repórtalo y le daremos seguimiento. Si hay un incendio activo, llama primero al{" "}
                <a href="tel:911" className="font-semibold text-amber-300 underline underline-offset-2">
                  911
                </a>
                .
              </p>
              <ButtonLink to="/reportar" variant="light" className="mt-8">
                Hacer un reporte <ArrowRight aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
