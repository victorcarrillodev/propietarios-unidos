import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "Propietarios Unidos · Bosque La Primavera";
export const DEFAULT_DESCRIPTION =
  "Asociación de propietarios que cuidan, mejoran y defienden el Bosque La Primavera, en Jalisco: prevención de incendios, mejora de caminos, vigilancia y diálogo con usuarios.";

const DEFAULT_IMAGE = "/og-image.png";
const DEFAULT_IMAGE_SIZE = { width: 1200, height: 630 };

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  siteUrl?: string;
  type?: "website" | "article";
};

/** Etiquetas de título, descripción, Open Graph, Twitter Card y URL canónica. */
export function seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image,
  imageAlt,
  imageWidth,
  imageHeight,
  siteUrl = "",
  type = "website",
}: SeoInput): MetaDescriptor[] {
  const fullTitle = title ? `${title} · Propietarios Unidos` : SITE_NAME;
  const url = `${siteUrl}${path}`;
  const isCustomImage = Boolean(image);
  const imageUrl = image?.startsWith("http") ? image : `${siteUrl}${image ?? DEFAULT_IMAGE}`;
  // Solo publicamos ancho/alto cuando los sabemos con certeza: la imagen por
  // defecto siempre mide 1200x630; una imagen personalizada solo si el
  // llamador los pasó explícitamente (evita anunciar medidas incorrectas).
  const size = isCustomImage
    ? imageWidth && imageHeight
      ? { width: imageWidth, height: imageHeight }
      : null
    : DEFAULT_IMAGE_SIZE;
  const altText = imageAlt ?? fullTitle;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "es_MX" },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:alt", content: altText },
    ...(size ? [{ property: "og:image:width", content: String(size.width) }] : []),
    ...(size ? [{ property: "og:image:height", content: String(size.height) }] : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: altText },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

type MatchLike = { id: string; loaderData?: unknown } | undefined;

/** URL pública del sitio, tomada del loader de la raíz. */
export function siteUrlFrom(matches: ReadonlyArray<MatchLike>) {
  const root = matches.find((match) => match?.id === "root");
  return (root?.loaderData as { siteUrl?: string } | undefined)?.siteUrl ?? "";
}

export type SiteLayoutSettings = {
  orgName: string;
  shortName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebookUrl: string;
  mapsUrl: string;
  hours: string;
};

/** Datos de contacto del sitio (nombre, dirección, redes…), tomados del loader del layout público. */
export function siteSettingsFrom(matches: ReadonlyArray<MatchLike>) {
  const layout = matches.find((match) => match?.id === "routes/site/layout");
  return (layout?.loaderData as { settings?: SiteLayoutSettings } | undefined)?.settings;
}
