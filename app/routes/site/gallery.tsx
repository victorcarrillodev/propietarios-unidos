import { GalleryGrid, type GalleryPhoto, PageHero, Section } from "~/components/site";
import { seo, siteUrlFrom } from "~/lib/seo";
import type { Route } from "./+types/gallery";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Galería",
    description:
      "Fotos del trabajo de Propietarios Unidos en el Bosque La Primavera: mantenimiento de caminos, prevención de incendios, jornadas comunitarias y recorridos.",
    path: "/galeria",
    image: "/galeria/foto-01.webp",
    imageWidth: 1280,
    imageHeight: 730,
    imageAlt: "Mantenimiento de caminos y accesos en el Bosque La Primavera",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };
}

const CAPTIONS = [
  "Mantenimiento de caminos y accesos",
  "Brigada de prevención de incendios en labores de campo",
  "Jornada comunitaria de limpieza y mantenimiento",
  "Recorrido y trabajo en campo de propietarios y colaboradores",
  "Vigilancia y cuidado del territorio",
  "Paisaje y vegetación del Bosque La Primavera",
  "Atención a un incendio forestal",
  "Reforestación con especies nativas",
  "Visitantes y ciclistas en los senderos del bosque",
];

const SIZES: [number, number][] = [
  [1280, 730],
  [768, 1024],
  [1280, 960],
  [960, 1280],
  [1080, 1080],
  [1080, 1080],
  [1155, 866],
  [960, 1280],
  [1040, 780],
  [960, 1280],
  [1429, 792],
  [960, 1280],
  [701, 1440],
  [1280, 960],
  [960, 1280],
  [1280, 960],
  [960, 1280],
  [1440, 817],
  [960, 1280],
  [720, 720],
  [1040, 780],
  [1080, 1080],
  [1080, 1080],
  [1280, 960],
  [701, 1440],
  [1280, 960],
  [1280, 960],
  [860, 573],
  [1005, 1005],
  [854, 894],
  [1152, 560],
  [1440, 1440],
  [1440, 1440],
  [720, 1280],
  [1280, 720],
  [550, 960],
  [960, 1280],
  [1280, 960],
  [1280, 960],
  [1440, 1080],
  [1280, 960],
  [1440, 1080],
  [960, 1280],
  [960, 1280],
  [576, 1024],
  [720, 960],
  [1152, 560],
  [1440, 1080],
  [1080, 1440],
  [1440, 1080],
  [1280, 960],
  [1440, 1080],
  [1152, 560],
  [1152, 864],
  [864, 1152],
  [1280, 960],
  [960, 960],
  [560, 1152],
];

const PHOTOS: GalleryPhoto[] = SIZES.map(([width, height], index) => ({
  src: `/galeria/foto-${String(index + 1).padStart(2, "0")}.webp`,
  width,
  height,
  alt: CAPTIONS[index % CAPTIONS.length]!,
}));

export default function Gallery() {
  return (
    <>
      <PageHero
        eyebrow="Galería"
        title="El bosque y nuestro trabajo, en imágenes"
        description="Caminos, brigadas, jornadas y recorridos: así se ve el trabajo constante de propietarias y propietarios por La Primavera."
      />

      <Section>
        <GalleryGrid photos={PHOTOS} />
      </Section>
    </>
  );
}
