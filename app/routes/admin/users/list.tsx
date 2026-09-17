import { asc, desc } from "drizzle-orm";
import { Plus, UsersRound } from "lucide-react";
import { Link } from "react-router";
import { ButtonLink } from "~/components/ui/button";
import { Badge, EmptyState, PageHeader, TableContainer, Td, Th } from "~/components/ui/data";
import { users } from "~/db/schema";
import { formatDateTime } from "~/lib/format";
import { ROLE_LABELS } from "~/lib/labels";
import { db } from "~/server/db.server";
import { requireModule } from "~/server/guards.server";
import type { Route } from "./+types/list";

export async function loader({ context }: Route.LoaderArgs) {
  const currentUser = requireModule(context, "users");
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.active), asc(users.name));
  return { rows, currentUserId: currentUser.id };
}

export default function UsersList({ loaderData }: Route.ComponentProps) {
  const { rows, currentUserId } = loaderData;
  return (
    <>
      <PageHeader
        title="Usuarios del panel"
        description="Personas que pueden entrar a la administración y lo que cada una puede hacer."
        actions={
          <ButtonLink to="/admin/usuarios/nuevo">
            <Plus aria-hidden /> Nuevo usuario
          </ButtonLink>
        }
      />
      {rows.length > 0 ? (
        <TableContainer>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Último acceso</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50">
                <Td>
                  <Link to={`/admin/usuarios/${user.id}`} className="font-medium text-stone-900 hover:text-forest-700">
                    {user.name}
                  </Link>
                  {user.id === currentUserId && <span className="ml-2 text-xs text-stone-500">(tú)</span>}
                  <p className="text-xs text-stone-500">{user.email}</p>
                </Td>
                <Td>{ROLE_LABELS[user.role]}</Td>
                <Td>{user.active ? <Badge tone="green">Activo</Badge> : <Badge>Inactivo</Badge>}</Td>
                <Td className="whitespace-nowrap">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Nunca"}</Td>
              </tr>
            ))}
          </tbody>
        </TableContainer>
      ) : (
        <EmptyState icon={UsersRound} title="Sin usuarios" />
      )}
    </>
  );
}
