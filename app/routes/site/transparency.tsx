import { asc, desc, eq } from "drizzle-orm";
import { Download, FileText, FolderOpen } from "lucide-react";
import { PageHero, Section } from "~/components/site/sections";
import { EmptyState } from "~/components/ui";
import { documents } from "~/db/schema";
import { DOCUMENT_CATEGORIES } from "~/lib/enums";
import { formatDate, formatTimestampDate } from "~/lib/format";
import { DOCUMENT_CATEGORY_LABELS } from "~/lib/labels";
import { seo, siteUrlFrom } from "~/lib/seo";
import { formatFileSize } from "~/lib/utils";
import { db } from "~/server/db.server";
import type { Route } from "./+types/transparency";

export const meta: Route.MetaFunction = ({ matches }) =>
  seo({
    title: "Transparencia",
    description: "Documentos públicos de la asociación: actas, estatutos, informes y comunicados.",
    path: "/transparencia",
    siteUrl: siteUrlFrom(matches),
  });

export function headers() {
  return { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" };
}

export async function loader() {
  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      category: documents.category,
      documentDate: documents.documentDate,
      fileName: documents.fileName,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.isPublic, true))
    .orderBy(desc(documents.documentDate), desc(documents.createdAt), asc(documents.title));

  const groups = DOCUMENT_CATEGORIES.map((category) => ({
    category,
    label: DOCUMENT_CATEGORY_LABELS[category],
    items: rows.filter((row) => row.category === category),
  })).filter((group) => group.items.length > 0);

  return { groups };
}

export default function Transparency({ loaderData }: Route.ComponentProps) {
  const { groups } = loaderData;
  return (
    <>
      <PageHero
        eyebrow="Transparencia"
        title="Cuentas claras, bosque sano"
        description="La confianza se construye con información. Aquí publicamos los documentos de la asociación que pueden consultarse libremente."
      />
      <Section>
        {groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.category} aria-labelledby={`cat-${group.category}`}>
                <h2 id={`cat-${group.category}`} className="font-display text-2xl font-semibold text-forest-950">
                  {group.label}
                </h2>
                <ul className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                  {group.items.map((doc) => (
                    <li key={doc.id} className="flex flex-wrap items-center gap-4 p-5">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-stone-900">{doc.title}</h3>
                        {doc.description && <p className="mt-0.5 text-sm text-stone-600">{doc.description}</p>}
                        <p className="mt-1 text-xs text-stone-500">
                          {doc.documentDate ? formatDate(doc.documentDate) : formatTimestampDate(doc.createdAt)} ·{" "}
                          {formatFileSize(doc.sizeBytes)}
                        </p>
                      </div>
                      <a
                        href={`/documentos/${doc.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-2 text-sm font-medium text-white hover:bg-forest-800"
                        target="_blank"
                        rel="noopener"
                      >
                        <Download className="size-4" aria-hidden /> Ver documento
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="Todavía no hay documentos públicos"
            description="Pronto publicaremos aquí actas, informes y otros documentos de la asociación."
          />
        )}
      </Section>
    </>
  );
}
