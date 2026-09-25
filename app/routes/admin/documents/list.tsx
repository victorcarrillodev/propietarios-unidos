import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { Download, FileText, FolderOpen, Globe, Lock, Upload } from "lucide-react";
import { Link } from "react-router";
import { FilterBar, FilterSelect, SearchInput } from "~/components/admin/filters";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui";
import { documents, users } from "~/db/schema";
import { DOCUMENT_CATEGORIES } from "~/lib/enums";
import { formatDate, formatTimestampDate } from "~/lib/format";
import { DOCUMENT_CATEGORY_LABELS, toOptions } from "~/lib/labels";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { formatFileSize } from "~/lib/utils";
import { likeEscape, pickEnum } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/list";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "documents");
  const params = url.searchParams;
  const filters = {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    category: pickEnum(params.get("categoria"), DOCUMENT_CATEGORIES),
    visibility: pickEnum(params.get("visibilidad"), ["publico", "interno"]),
  };
  const pagination = getPaginationParams(url, 25);

  const conditions: SQL[] = [];
  if (filters.category) conditions.push(eq(documents.category, filters.category));
  if (filters.visibility) conditions.push(eq(documents.isPublic, filters.visibility === "publico"));
  if (filters.q) {
    const like = `%${likeEscape(filters.q)}%`;
    conditions.push(
      sql`(f_unaccent(${documents.title}) ilike f_unaccent(${like}) or f_unaccent(${documents.fileName}) ilike f_unaccent(${like}))`,
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        category: documents.category,
        documentDate: documents.documentDate,
        fileName: documents.fileName,
        sizeBytes: documents.sizeBytes,
        isPublic: documents.isPublic,
        createdAt: documents.createdAt,
        uploadedByName: users.name,
      })
      .from(documents)
      .leftJoin(users, eq(users.id, documents.uploadedBy))
      .where(where)
      .orderBy(desc(documents.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(documents).where(where),
  ]);

  const meta = getPaginationMeta(pagination, total);
  return { rows, total: meta.total, page: meta.page, pageCount: meta.pageCount, filters };
}

export default function DocumentsList({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, filters } = loaderData;
  const hasFilters = Boolean(filters.q || filters.category || filters.visibility);

  return (
    <>
      <PageHeader
        title="Documentos"
        description="Actas, estatutos, informes, permisos y demás archivos de la asociación."
        actions={
          <ButtonLink to="/admin/documentos/subir">
            <Upload aria-hidden /> Subir documento
          </ButtonLink>
        }
      />

      <FilterBar hasFilters={hasFilters}>
        <SearchInput defaultValue={filters.q} placeholder="Título o nombre de archivo" />
        <FilterSelect
          name="categoria"
          label="Categoría"
          options={toOptions(DOCUMENT_CATEGORY_LABELS)}
          defaultValue={filters.category}
          allLabel="Todas"
        />
        <FilterSelect
          name="visibilidad"
          label="Visibilidad"
          options={[
            { value: "publico", label: "Público" },
            { value: "interno", label: "Interno" },
          ]}
          defaultValue={filters.visibility}
        />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th>Documento</Th>
                <Th>Categoría</Th>
                <Th>Fecha</Th>
                <Th>Visibilidad</Th>
                <Th className="text-right">Archivo</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((doc) => (
                <tr key={doc.id} className="hover:bg-stone-50">
                  <Td>
                    <div className="flex gap-3">
                      <FileText className="mt-0.5 size-5 shrink-0 text-stone-400" aria-hidden />
                      <div className="min-w-0">
                        <Link to={`/admin/documentos/${doc.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                          {doc.title}
                        </Link>
                        <p className="truncate text-xs text-stone-500">
                          {doc.fileName} · {formatFileSize(doc.sizeBytes)}
                          {doc.uploadedByName && ` · subió ${doc.uploadedByName}`}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="earth">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {doc.documentDate ? formatDate(doc.documentDate) : formatTimestampDate(doc.createdAt)}
                  </Td>
                  <Td>
                    {doc.isPublic ? (
                      <span className="inline-flex items-center gap-1 text-sm text-forest-700">
                        <Globe className="size-4" aria-hidden /> Público
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-stone-500">
                        <Lock className="size-4" aria-hidden /> Interno
                      </span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <a
                      href={`/admin/documentos/${doc.id}/archivo?descargar`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-forest-700 hover:bg-forest-50"
                    >
                      <Download className="size-4" aria-hidden /> Descargar
                    </a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title={hasFilters ? "No hay documentos con esos filtros" : "Aún no hay documentos"}
          description="Guarda aquí los documentos importantes. Los marcados como públicos aparecen en Transparencia."
          action={
            <ButtonLink to="/admin/documentos/subir">
              <Upload aria-hidden /> Subir documento
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
