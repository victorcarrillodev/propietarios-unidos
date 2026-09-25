import { and, asc, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { ScrollText } from "lucide-react";
import { FilterBar, FilterSelect, SearchInput } from "~/components/admin/filters";
import { EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui";
import { auditLogs, users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { likeEscape } from "~/lib/validation";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/audit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "audit");
  const userParam = url.searchParams.get("usuario") ?? "";
  const filters = {
    q: (url.searchParams.get("q") ?? "").trim().slice(0, 100),
    userId: UUID_RE.test(userParam) ? userParam : "",
  };
  const pagination = getPaginationParams(url, 50);

  const conditions: SQL[] = [];
  if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters.q) {
    conditions.push(sql`f_unaccent(${auditLogs.summary}) ilike f_unaccent(${`%${likeEscape(filters.q)}%`})`);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }], userOptions] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        summary: auditLogs.summary,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(auditLogs).where(where),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
  ]);

  const meta = getPaginationMeta(pagination, total);
  return { rows, total: meta.total, page: meta.page, pageCount: meta.pageCount, filters, userOptions };
}

export default function Audit({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, filters, userOptions } = loaderData;
  const hasFilters = Boolean(filters.q || filters.userId);

  return (
    <>
      <PageHeader title="Auditoría" description="Quién hizo qué y cuándo dentro del panel." />
      <FilterBar hasFilters={hasFilters}>
        <SearchInput defaultValue={filters.q} placeholder="Buscar en la descripción" />
        <FilterSelect
          name="usuario"
          label="Usuario"
          options={userOptions.map((user) => ({ value: user.id, label: user.name }))}
          defaultValue={filters.userId}
        />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Usuario</Th>
                <Th>Acción</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td className="whitespace-nowrap text-stone-500">{formatDateTime(row.createdAt)}</Td>
                  <Td className="whitespace-nowrap">{row.userName ?? "—"}</Td>
                  <Td>
                    {row.summary}
                    <p className="font-mono text-xs text-stone-400">{row.action}</p>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState icon={ScrollText} title="Sin registros" description="Aquí aparecerán las acciones realizadas en el panel." />
      )}
    </>
  );
}
