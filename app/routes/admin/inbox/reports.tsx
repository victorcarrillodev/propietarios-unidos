import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { Flag, Image } from "lucide-react";
import { Link } from "react-router";
import { FilterBar, FilterSelect } from "~/components/admin/filters";
import { Badge, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui/data";
import { citizenReports } from "~/db/schema";
import { REPORT_STATUSES, REPORT_TYPES } from "~/lib/enums";
import { formatDate, formatDateTime } from "~/lib/format";
import { REPORT_STATUS_LABELS, REPORT_STATUS_TONES, REPORT_TYPE_LABELS, toOptions } from "~/lib/labels";
import { truncate } from "~/lib/utils";
import { pageParam, pickEnum } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/reports";

const PAGE_SIZE = 25;

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "inbox");
  const filters = {
    status: pickEnum(url.searchParams.get("estado"), REPORT_STATUSES),
    type: pickEnum(url.searchParams.get("tipo"), REPORT_TYPES),
  };
  const page = pageParam(url);

  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(citizenReports.status, filters.status));
  if (filters.type) conditions.push(eq(citizenReports.type, filters.type));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: citizenReports.id,
        folio: citizenReports.folio,
        type: citizenReports.type,
        location: citizenReports.location,
        occurredOn: citizenReports.occurredOn,
        description: citizenReports.description,
        status: citizenReports.status,
        createdAt: citizenReports.createdAt,
        photoCount: sql<number>`jsonb_array_length(${citizenReports.photoKeys})`,
      })
      .from(citizenReports)
      .where(where)
      .orderBy(sql`${citizenReports.status} = 'nuevo' desc`, desc(citizenReports.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(citizenReports).where(where),
  ]);

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), filters };
}

export default function Reports({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, filters } = loaderData;
  const hasFilters = Boolean(filters.status || filters.type);

  return (
    <>
      <PageHeader
        title="Reportes ciudadanos"
        description="Denuncias enviadas desde el sitio público: incendios, tala, basura, invasiones y más."
      />

      <FilterBar hasFilters={hasFilters}>
        <FilterSelect name="estado" label="Estado" options={toOptions(REPORT_STATUS_LABELS)} defaultValue={filters.status} />
        <FilterSelect name="tipo" label="Tipo" options={toOptions(REPORT_TYPE_LABELS)} defaultValue={filters.type} />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th>Folio</Th>
                <Th>Recibido</Th>
                <Th>Reporte</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((report) => (
                <tr key={report.id} className={report.status === "nuevo" ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-stone-50"}>
                  <Td>
                    <Link to={`/admin/reportes/${report.id}`} className="font-semibold text-forest-700 tabular-nums hover:underline">
                      #{report.folio}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatDateTime(report.createdAt)}
                    {report.occurredOn && <p className="text-xs text-stone-500">Ocurrió: {formatDate(report.occurredOn)}</p>}
                  </Td>
                  <Td>
                    <Link to={`/admin/reportes/${report.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                      {REPORT_TYPE_LABELS[report.type]} · {report.location}
                    </Link>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {truncate(report.description, 140)}
                      {report.photoCount > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-stone-600">
                          <Image className="size-3.5" aria-hidden /> {report.photoCount}
                        </span>
                      )}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={REPORT_STATUS_TONES[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={Flag}
          title={hasFilters ? "No hay reportes con esos filtros" : "Sin reportes por ahora"}
          description="Los reportes que la ciudadanía envíe desde la página “Reportar” aparecerán aquí."
        />
      )}
    </>
  );
}
