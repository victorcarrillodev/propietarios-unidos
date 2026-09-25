import { createContext, data, redirect, type MiddlewareFunction, type RouterContextProvider } from "react-router";
import { can, type AppModule } from "~/lib/permissions";
import { getSessionUser, type SessionUser } from "./auth.server";

export const userContext = createContext<SessionUser>();

/** Middleware del panel: exige sesión válida y deja al usuario en el contexto. */
export const requireUserMiddleware: MiddlewareFunction<Response> = async ({ request, url, context }, next) => {
  const session = await getSessionUser(request);
  if (!session) {
    const redirectTo = `${url.pathname}${url.search}`;
    throw redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  context.set(userContext, session.user);
  const response = await next();
  if (session.setCookie) {
    try {
      response.headers.append("Set-Cookie", session.setCookie);
    } catch {
      // Algunas respuestas tienen encabezados inmutables; la sesión se renovará después.
    }
  }
  return response;
};

export function getUser(context: Readonly<RouterContextProvider>) {
  return context.get(userContext);
}

/** Verifica que el usuario tenga acceso al módulo; si no, responde 403. */
export function requireModule(context: Readonly<RouterContextProvider>, module: AppModule) {
  const user = context.get(userContext);
  if (!can(user.role, module)) {
    throw data("No tienes permiso para acceder a esta sección.", { status: 403 });
  }
  return user;
}

export function notFound(message = "No encontramos lo que buscas.") {
  return data(message, { status: 404 });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida un identificador de la URL; si no es válido responde 404. */
export function requireId(value: string | undefined, message?: string) {
  if (!value || !UUID_RE.test(value)) throw notFound(message);
  return value;
}

/** Lee el "intent" de un formulario con varias acciones. */
export function getIntent(formData: FormData) {
  const intent = formData.get("intent");
  return typeof intent === "string" ? intent : "";
}
