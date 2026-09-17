import { ArrowRight, Eye, FileText, Handshake, Landmark, MessageCircle, Scale, TreePine, Users } from "lucide-react";
import { PageHero, Section, SectionHeading } from "~/components/site/sections";
import { ButtonLink, buttonClasses } from "~/components/ui/button";
import { seo, siteUrlFrom } from "~/lib/seo";
import { parseBoard } from "~/lib/site-settings";
import { initials, whatsappLink } from "~/lib/utils";
import { renderMarkdown } from "~/server/markdown.server";
import { getSiteSettings } from "~/server/settings.server";
import type { Route } from "./+types/about";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Quiénes somos",
    description:
      "Conoce a la Asociación de Propietarios Unidos en Mejoras del Bosque La Primavera: nuestra misión, visión, valores y forma de trabajo.",
    path: "/quienes-somos",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" };
}

export async function loader() {
  const settings = await getSiteSettings();
  return {
    tagline: settings.tagline,
    aboutHtml: renderMarkdown(settings.aboutText),
    historyHtml: renderMarkdown(settings.history),
    mission: settings.mission,
    vision: settings.vision,
    board: parseBoard(settings.board),
    whatsapp: settings.whatsapp,
  };
}

const VALUES = [
  { icon: TreePine, title: "Compromiso con el bosque", text: "Cada decisión parte de lo que es mejor para La Primavera." },
  { icon: Eye, title: "Transparencia", text: "Rendimos cuentas de lo que hacemos y de cómo usamos los recursos." },
  { icon: Handshake, title: "Diálogo y respeto", text: "Escuchamos a usuarios, vecinos y autoridades para construir acuerdos." },
  { icon: Users, title: "Corresponsabilidad", text: "Cuidar el bosque es tarea de todas y todos; sumamos esfuerzos." },
  { icon: Scale, title: "Legalidad", text: "Actuamos conforme a la ley y denunciamos lo que daña al bosque." },
];

export default function About({ loaderData }: Route.ComponentProps) {
  const { tagline, aboutHtml, historyHtml, mission, vision, board, whatsapp } = loaderData;

  return (
    <>
      <PageHero eyebrow="Quiénes somos" title="Propietarios unidos por La Primavera" description={tagline} />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="prose-content text-lg" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="font-display text-xl font-semibold text-forest-950">En pocas palabras</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <Landmark className="size-5 shrink-0 text-forest-600" aria-hidden />
                <div>
                  <dt className="font-semibold text-stone-900">Sede</dt>
                  <dd className="text-stone-600">Tala, Jalisco</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <TreePine className="size-5 shrink-0 text-forest-600" aria-hidden />
                <div>
                  <dt className="font-semibold text-stone-900">Enfoque</dt>
                  <dd className="text-stone-600">Conservación y mejoras del Bosque La Primavera</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="size-5 shrink-0 text-forest-600" aria-hidden />
                <div>
                  <dt className="font-semibold text-stone-900">Integrantes</dt>
                  <dd className="text-stone-600">Propietarios de predios, ejidatarios y colaboradores</dd>
                </div>
              </div>
            </dl>
            {whatsapp && (
              <a
                href={whatsappLink(whatsapp, "Hola, me gustaría conocer más sobre la asociación.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ className: "mt-6 w-full" })}
              >
                <MessageCircle aria-hidden /> Escríbenos por WhatsApp
              </a>
            )}
          </aside>
        </div>
      </Section>

      <Section className="bg-white">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl bg-forest-800 p-8 text-white sm:p-10">
            <p className="text-sm font-semibold tracking-wider text-amber-300 uppercase">Misión</p>
            <p className="mt-4 font-display text-2xl leading-snug">{mission}</p>
          </article>
          <article className="rounded-3xl bg-earth-100 p-8 text-forest-950 sm:p-10">
            <p className="text-sm font-semibold tracking-wider text-earth-700 uppercase">Visión</p>
            <p className="mt-4 font-display text-2xl leading-snug">{vision}</p>
          </article>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Valores" title="Lo que guía nuestro trabajo" align="center" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-forest-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {historyHtml && (
        <Section className="bg-white">
          <div className="mx-auto max-w-3xl">
            <SectionHeading eyebrow="Historia" title="Cómo nació la asociación" />
            <div className="prose-content mt-8" dangerouslySetInnerHTML={{ __html: historyHtml }} />
          </div>
        </Section>
      )}

      {board.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Mesa directiva" title="Quienes representan a la asociación" align="center" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {board.map((member) => (
              <li
                key={`${member.role}-${member.name}`}
                className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200"
              >
                <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-forest-800 font-display text-xl text-white">
                  {initials(member.name)}
                </span>
                <p className="mt-4 font-semibold text-forest-950">{member.name}</p>
                <p className="text-sm text-stone-500">{member.role}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className={board.length > 0 ? "bg-white" : undefined}>
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-forest-900 p-8 text-white sm:p-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">Cuentas claras, bosque sano</h2>
            <p className="mt-2 max-w-xl text-forest-100">
              Consulta nuestros documentos públicos, informes y acuerdos, o súmate como integrante.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/transparencia" variant="light">
              <FileText aria-hidden /> Transparencia
            </ButtonLink>
            <ButtonLink to="/unete" variant="accent">
              Únete <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
