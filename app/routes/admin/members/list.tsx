import { asc, count, sql } from "drizzle-orm";
import { Download, Plus, Users } from "lucide-react";
import { Link, useLocation } from "react-router";
import { FilterBar, FilterSelect, SearchInput } from "~/components/admin/filters";
import { Badge, ButtonLink, buttonClasses, EmptyState, PageHeader, Pagination, TableContainer, Td, Th } from "~/components/ui";
import { members } from "~/db/schema";
import { formatDate } from "~/lib/format";
import { MEMBER_STATUS_LABELS, MEMBER_STATUS_TONES, MEMBER_TYPE_LABELS, toOptions } from "~/lib/labels";
import { getPaginationMeta, getPaginationParams } from "~/lib/pagination";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import { memberWhere, readMemberFilters } from "~/server/queries/members.server";
import type { Route } from "./+types/list";

export async function loader({ context, url }: Route.LoaderArgs) {
  requireModule(context, "members");
  const filters = readMemberFilters(url);
  const pagination = getPaginationParams(url, 25);
  const where = memberWhere(filters);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: members.id,
        memberNumber: members.memberNumber,
        fullName: members.fullName,
        memberType: members.memberType,
        status: members.status,
        email: members.email,
        phone: members.phone,
        joinedOn: members.joinedOn,
        propertyCount: sql<number>`(select count(*)::int from properties where properties.member_id = ${members.id})`,
      })
      .from(members)
      .where(where)
      .orderBy(asc(members.fullName))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db.select({ total: count() }).from(members).where(where),
  ]);

  const meta = getPaginationMeta(pagination, total);
  return { rows, total: meta.total, page: meta.page, pageCount: meta.pageCount, filters };
}

export default function MembersList({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, pageCount, filters } = loaderData;
  const location = useLocation();
  const hasFilters = Boolean(filters.q || filters.status || filters.type);

  return (
    <>
      <PageHeader
        title="Miembros"
        description="Propietarios, ejidatarios y colaboradores de la asociación."
        actions={
          <>
            <a href={`/admin/miembros/exportar${location.search}`} className={buttonClasses({ variant: "secondary" })}>
              <Download aria-hidden /> Exportar CSV
            </a>
            <ButtonLink to="/admin/miembros/nuevo">
              <Plus aria-hidden /> Nuevo miembro
            </ButtonLink>
          </>
        }
      />

      <FilterBar hasFilters={hasFilters}>
        <SearchInput defaultValue={filters.q} placeholder="Nombre, correo, teléfono o número de socio" />
        <FilterSelect name="estado" label="Estado" options={toOptions(MEMBER_STATUS_LABELS)} defaultValue={filters.status} />
        <FilterSelect name="tipo" label="Tipo" options={toOptions(MEMBER_TYPE_LABELS)} defaultValue={filters.type} />
      </FilterBar>

      {rows.length > 0 ? (
        <>
          <TableContainer>
            <thead>
              <tr>
                <Th className="w-16">No.</Th>
                <Th>Nombre</Th>
                <Th>Tipo</Th>
                <Th>Estado</Th>
                <Th>Teléfono</Th>
                <Th className="text-right">Predios</Th>
                <Th>Ingreso</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((member) => (
                <tr key={member.id} className="hover:bg-stone-50">
                  <Td className="text-stone-500 tabular-nums">{member.memberNumber}</Td>
                  <Td>
                    <Link to={`/admin/miembros/${member.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                      {member.fullName}
                    </Link>
                    {member.email && <p className="text-xs text-stone-500">{member.email}</p>}
                  </Td>
                  <Td>{MEMBER_TYPE_LABELS[member.memberType]}</Td>
                  <Td>
                    <Badge tone={MEMBER_STATUS_TONES[member.status]}>{MEMBER_STATUS_LABELS[member.status]}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{member.phone ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{member.propertyCount}</Td>
                  <Td className="whitespace-nowrap">{formatDate(member.joinedOn)}</Td>
                </tr>
              ))}
            </tbody>
          </TableContainer>
          <Pagination page={page} pageCount={pageCount} total={total} />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No hay miembros con esos filtros" : "Aún no hay miembros registrados"}
          description={
            hasFilters ? "Prueba con otra búsqueda." : "Registra a los integrantes de la asociación para llevar su control."
          }
          action={
            !hasFilters && (
              <ButtonLink to="/admin/miembros/nuevo">
                <Plus aria-hidden /> Registrar el primer miembro
              </ButtonLink>
            )
          }
        />
      )}
    </>
  );
}
