import { createCookieSessionStorage, redirect } from "react-router";
import type { Toast } from "~/lib/toast";
import { env } from "./env.server";

// Cookie separada de la sesión para mensajes de una sola vez ("Miembro guardado").
const flashStorage = createCookieSessionStorage<Record<string, never>, { toast: Toast }>({
  cookie: {
    name: "pu_flash",
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    secure: env.secureCookies,
    secrets: [env.SESSION_SECRET],
    maxAge: 60,
  },
});

export async function redirectWithToast(
  url: string,
  toast: Omit<Toast, "id">,
  init?: { headers?: HeadersInit },
) {
  const session = await flashStorage.getSession();
  session.flash("toast", { id: crypto.randomUUID(), ...toast });
  const headers = new Headers(init?.headers);
  headers.append("Set-Cookie", await flashStorage.commitSession(session));
  return redirect(url, { headers });
}

export async function readToast(request: Request) {
  const session = await flashStorage.getSession(request.headers.get("Cookie"));
  const toast = session.get("toast") ?? null;
  return {
    toast,
    setCookie: toast ? await flashStorage.commitSession(session) : null,
  };
}
