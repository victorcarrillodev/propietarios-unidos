import {
  ArrowRight,
  Bird,
  Building2,
  CloudSun,
  Droplets,
  ExternalLink,
  Flame,
  GraduationCap,
  Mountain,
  Phone,
  Pickaxe,
  Trash2,
  TreeDeciduous,
} from "lucide-react";
import { PageHero, Section, SectionHeading } from "~/components/site/sections";
import { ButtonLink } from "~/components/ui/button";
import { seo, siteUrlFrom } from "~/lib/seo";
import type { Route } from "./+types/forest";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "El Bosque La Primavera",
    description:
      "30,500 hectáreas protegidas al poniente de Guadalajara: por qué el Bosque La Primavera es vital para el agua, el clima y la biodiversidad de Jalisco, y cómo cuidarlo.",
    path: "/el-bosque",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };
}

const FACTS = [
  {
    value: "30,500 ha",
    title: "de bosque protegido",
    text: "Bosque de pino y encino en el centro de Jalisco, al poniente de la zona metropolitana de Guadalajara.",
  },
  {
    value: "1980",
    title: "protegido por decreto",
    text: "El decreto presidencial se publicó el 6 de marzo de 1980. Desde el año 2000 es Área de Protección de Flora y Fauna.",
  },
  {
    value: "4",
    title: "municipios",
    text: "Su territorio abarca parte de Zapopan, Tala, Tlajomulco de Zúñiga y El Arenal.",
  },
  {
    value: "UNESCO",
    title: "Reserva de la Biosfera",
    text: "Reconocido dentro del programa El Hombre y la Biosfera (MAB) de la UNESCO.",
  },
];

const SERVICES = [
  {
    icon: Droplets,
    title: "Agua",
    text: "Sus suelos y cañadas captan la lluvia y ayudan a recargar los mantos acuíferos de los que depende la región.",
  },
  {
    icon: CloudSun,
    title: "Clima",
    text: "Regula y amortigua la temperatura de la zona metropolitana y mejora la calidad del aire.",
  },
  {
    icon: Bird,
    title: "Biodiversidad",
    text: "Es refugio de venado cola blanca, puma, jaguarundi, coyote, zorra gris, armadillo y cacomixtle, además de una gran variedad de orquídeas.",
  },
  {
    icon: GraduationCap,
    title: "Educación y recreación",
    text: "Es aula abierta para la educación ambiental y espacio para disfrutar la naturaleza de forma responsable.",
  },
];

const THREATS = [
  { icon: Flame, title: "Incendios forestales", text: "La mayoría son provocados por actividades humanas y crecen en la temporada seca." },
  { icon: Building2, title: "Urbanización", text: "El cambio de uso de suelo fragmenta el bosque y reduce su capacidad de captar agua." },
  { icon: TreeDeciduous, title: "Tala ilegal", text: "La extracción de madera y leña sin permiso degrada el bosque y sus suelos." },
  { icon: Trash2, title: "Basura y tiraderos", text: "Contaminan suelo y agua, dañan a la fauna y pueden iniciar incendios." },
  { icon: Pickaxe, title: "Extracción y saqueo", text: "Retirar tierra, piedra, plantas o animales afecta el equilibrio del ecosistema." },
  { icon: Mountain, title: "Erosión de caminos", text: "El uso intensivo y sin control de caminos arrastra suelo en cada temporada de lluvias." },
];

const TIPS = [
  "No enciendas fogatas ni tires colillas: una chispa puede iniciar un incendio.",
  "Llévate tu basura de regreso a casa.",
  "Usa los caminos y accesos autorizados; respeta los predios y cercas.",
  "No extraigas plantas, tierra, piedras ni animales.",
  "Si ves humo o fuego, llama de inmediato al 911.",
];

const SOURCES = [
  {
    label: "CONANP: La Primavera celebra 39 años como Área Natural Protegida",
    href: "https://www.gob.mx/conanp/articulos/la-primavera-celebra-39-anos-como-area-natural-protegida",
  },
  {
    label: "SEMADET Jalisco: aniversario del Área de Protección de Flora y Fauna",
    href: "https://semadet.jalisco.gob.mx/prensa/noticias/blp-44-aniversario",
  },
];

export default function Forest() {
  return (
    <>
      <PageHero
        eyebrow="El bosque"
        title="El Bosque La Primavera"
        description="Un pulmón verde al poniente de Guadalajara que regula el clima, capta agua y resguarda una enorme diversidad de vida. Cuidarlo es cuidar el futuro de la región."
      />

      <Section>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <li key={fact.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <p className="font-display text-4xl font-semibold text-forest-700">{fact.value}</p>
              <p className="mt-1 font-semibold text-forest-950">{fact.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{fact.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="bg-white">
        <SectionHeading
          eyebrow="Su importancia"
          title="¿Por qué es tan importante?"
          description="El bosque nos brinda beneficios que no siempre se ven, pero de los que dependemos todos los días."
        />
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-5 rounded-2xl bg-cream p-6 ring-1 ring-earth-100">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-forest-800 text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-forest-950">{title}</h3>
                <p className="mt-2 leading-relaxed text-stone-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Amenazas"
          title="Lo que pone en riesgo al bosque"
          description="Conocer los riesgos es el primer paso para prevenirlos."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {THREATS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
              <Icon className="size-7 text-red-700" aria-hidden />
              <h3 className="mt-4 font-semibold text-forest-950">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="bg-forest-900 text-white">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              light
              eyebrow="El papel de los propietarios"
              title="Buena parte del bosque es de propiedad privada y ejidal"
              description="Por eso lo que hacemos quienes somos dueños de la tierra es decisivo: prevenir incendios en nuestros predios, mantener brechas y caminos, evitar cambios de uso de suelo y denunciar lo que daña al bosque."
            />
            <ButtonLink to="/unete" variant="accent" className="mt-8">
              Súmate a la asociación <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
          <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
            <h3 className="font-display text-2xl font-semibold">Si visitas el bosque</h3>
            <ul className="mt-5 space-y-3">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-3 text-forest-100">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
            <a
              href="tel:911"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
            >
              <Phone className="size-4" aria-hidden /> Emergencias: 911
            </a>
          </div>
        </div>
      </Section>

      <Section className="py-12 sm:py-14">
        <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">Fuentes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-forest-700 hover:text-forest-900 hover:underline"
              >
                {source.label} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
