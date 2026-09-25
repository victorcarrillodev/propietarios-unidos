import { sql } from "drizzle-orm";
import { data, Outlet } from "react-router";
import { AdminShell } from "~/components/admin/shell";
import { Toaster } from "~/components/ui";
import { can } from "~/lib/permissions";
import { db } from "~/server/db.server";
import { readToast } from "~/server/flash.server";
import { getUser, requireUserMiddleware } from "~/server/guards.server";
import type { Route } from "./+types/layout";

export const middleware: Route.MiddlewareFunction[] = [requireUserMiddleware];

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = getUser(context);
  const { toast, setCookie } = await readToast(request);

  let badges = { reports: 0, requests: 0, messages: 0 };
  if (can(user.role, "inbox")) {
    const [counts] = await db.execute<{ reports: number; requests: number; messages: number }>(sql`
      select
        (select count(*)::int from citizen_reports where status = 'nuevo') as reports,
        (select count(*)::int from membership_requests where status = 'pendiente') as requests,
        (select count(*)::int from contact_messages where status = 'nuevo') as messages
    `);
    if (counts) badges = counts;
  }

  return data(
    { user, toast, badges },
    { headers: setCookie ? { "Set-Cookie": setCookie } : undefined },
  );
}

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { user, toast, badges } = loaderData;
  return (
    <AdminShell user={user} badges={badges}>
      <meta name="robots" content="noindex, nofollow" />
      <Outlet />
      <Toaster toast={toast} />
    </AdminShell>
  );
}
