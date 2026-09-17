import { redirect } from "react-router";
import { audit } from "~/server/audit.server";
import { destroyUserSession, getSessionUser } from "~/server/auth.server";
import type { Route } from "./+types/logout";

// Cerrar sesión solo por POST para evitar que un enlace externo la cierre.
export function loader() {
  return redirect("/admin");
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSessionUser(request);
  const cookie = await destroyUserSession(request);
  if (session) await audit({ userId: session.user.id, action: "auth.logout", summary: "Cerró sesión" });
  return redirect("/admin/login", { headers: { "Set-Cookie": cookie } });
}
