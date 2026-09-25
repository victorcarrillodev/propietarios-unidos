import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { Globe, NotebookPen, Plus } from "lucide-react";
import { Link } from "react-router";
import { FilterBar, FilterSelect, SearchInput } from "~/components/admin/filters";
import { Badge, ButtonLink, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui";
import { activityRecords, users } from "~/db/schema";
import { RECORD_TYPES } from "~/lib/enums";
import { formatDate } from "~/lib/format";
import { RECORD_TYPE_LABELS, RECORD_TYPE_TONES, toOptions } from "~/lib/labels";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { likeEscape, pickEnum } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/list";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "records");
  const params = url.searchParams;
  const filters = {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    type: pickEnum(params.get("tipo"), RECORD_TYPES),
    visibility: pickEnum(params.get("visibilidad"), ["publica", "interna"]),
  };
  const pagination = getPaginationParams(url, 25);

  const conditions: SQL[] = [];
  if (filters.type) conditions.push(eq(activityRecords.type, filters.type));
  if (filters.visibility) conditions.push(eq(activityRecords.isPublic, filters.visibility === "publica"));
  if (filters.q) {
    const like = `%${likeEscape(filters.q)}%`;
    conditions.push(
      sql`(f_unaccent(${activityRecords.title}) ilike f_unaccent(${like}) or f_unaccent(coalesce(${activityRecords.location}, '')) ilike f_unaccent(${like}))`,
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: activityRecords.id,
        type: activityRecords.type,
        title: activityRecords.title,
        occurredOn: activityRecords.occurredOn,
        location: activityRecords.location,
        participants: activityRecords.participants,
        isPublic: activityRecords.isPublic,
        createdByName: users.name,
      })
      .from(activityRecords)
      .leftJoin(users, eq(users.id, activityRecords.createdBy))
      .where(where)
      .orderBy(desc(activityRecords.occurredOn), desc(activityRecords.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(activityRecords).where(where),
  ]);

  const meta = getPaginationMeta(pagination, total);
  return { rows, total: meta.total, page: meta.page, pageCount: meta.pageCount, filters };
}

export default function RecordsList({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, filters } = loaderData;
  const hasFilters = Boolean(filters.q || filters.type || filters.visibility);

  return (
    <>
      <PageHeader
        title="Bitácora"
        description="Registro de recorridos, jornadas, incidentes, asambleas y reuniones."
        actions={
          <ButtonLink to="/admin/bitacora/nuevo">
            <Plus aria-hidden /> Registrar actividad
          </ButtonLink>
        }
      />

      <FilterBar hasFilters={hasFilters}>
        <SearchInput defaultValue={filters.q} placeholder="Título o lugar" />
        <FilterSelect name="tipo" label="Tipo" options={toOptions(RECORD_TYPE_LABELS)} defaultValue={filters.type} />
        <FilterSelect
          name="visibilidad"
          label="Visibilidad"
          options={[
            { value: "publica", label: "Pública" },
            { value: "interna", label: "Interna" },
          ]}
          defaultValue={filters.visibility}
          allLabel="Todas"
        />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Actividad</Th>
                <Th>Tipo</Th>
                <Th className="text-right">Participantes</Th>
                <Th>Visibilidad</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((record) => (
                <tr key={record.id} className="hover:bg-stone-50">
                  <Td className="whitespace-nowrap">{formatDate(record.occurredOn)}</Td>
                  <Td>
                    <Link to={`/admin/bitacora/${record.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                      {record.title}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {[record.location, record.createdByName && `Registró: ${record.createdByName}`].filter(Boolean).join(" · ")}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={RECORD_TYPE_TONES[record.type]}>{RECORD_TYPE_LABELS[record.type]}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{record.participants ?? "—"}</Td>
                  <Td>
                    {record.isPublic ? (
                      <span className="inline-flex items-center gap-1 text-sm text-forest-700">
                        <Globe className="size-4" aria-hidden /> Pública
                      </span>
                    ) : (
                      <span className="text-sm text-stone-500">Interna</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={NotebookPen}
          title={hasFilters ? "No hay actividades con esos filtros" : "La bitácora está vacía"}
          description="Registra lo que la asociación hace por el bosque. Las actividades públicas se muestran en el sitio."
          action={
            <ButtonLink to="/admin/bitacora/nuevo">
              <Plus aria-hidden /> Registrar actividad
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
