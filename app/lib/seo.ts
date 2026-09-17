import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "Propietarios Unidos · Bosque La Primavera";
export const DEFAULT_DESCRIPTION =
  "Asociación de propietarios que cuidan, mejoran y defienden el Bosque La Primavera, en Jalisco: prevención de incendios, mejora de caminos, vigilancia y diálogo con usuarios.";

type SeoInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  siteUrl?: string;
  type?: "website" | "article";
};

/** Etiquetas de título, descripción, Open Graph y URL canónica. */
export function seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image,
  siteUrl = "",
  type = "website",
}: SeoInput): MetaDescriptor[] {
  const fullTitle = title ? `${title} · Propietarios Unidos` : SITE_NAME;
  const url = `${siteUrl}${path}`;
  const imageUrl = image?.startsWith("http") ? image : `${siteUrl}${image ?? "/og-image.png"}`;
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
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

type MatchLike = { id: string; loaderData?: unknown } | undefined;

/** URL pública del sitio, tomada del loader de la raíz. */
export function siteUrlFrom(matches: ReadonlyArray<MatchLike>) {
  const root = matches.find((match) => match?.id === "root");
  return (root?.loaderData as { siteUrl?: string } | undefined)?.siteUrl ?? "";
}
