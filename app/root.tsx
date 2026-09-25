import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useRouteLoaderData } from "react-router";
import { Analytics } from "~/components/site/analytics";
import { env } from "~/server/env.server";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&family=Special+Gothic+Condensed+One&display=swap",
  },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

// Encabezados de seguridad para todas las respuestas.
const securityHeaders: Route.MiddlewareFunction = async (_args, next) => {
  const response = await next();
  try {
    const headers: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    };
    for (const [name, value] of Object.entries(headers)) {
      if (!response.headers.has(name)) response.headers.set(name, value);
    }
  } catch {
    // Respuestas con encabezados inmutables: no hay nada que hacer.
  }
  return response;
};

export const middleware: Route.MiddlewareFunction[] = [securityHeaders];

export function loader() {
  return { siteUrl: env.SITE_URL, gaId: env.GA_MEASUREMENT_ID, contentsquareTagId: env.CONTENTSQUARE_TAG_ID };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  const isAdmin = useLocation().pathname.startsWith("/admin");

  return (
    <html lang="es-MX">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1b3924" />
        <Meta />
        <Links />
        {/* Analítica solo en el sitio público, nunca en el panel de administración. */}
        {!isAdmin && <Analytics gaId={data?.gaId} contentsquareTagId={data?.contentsquareTagId} />}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Algo salió mal";
  let details = "Ocurrió un error inesperado. Intenta de nuevo en unos minutos.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Página no encontrada";
      details = "La página que buscas no existe o fue movida.";
    } else if (error.status === 403) {
      title = "Acceso restringido";
      details = typeof error.data === "string" ? error.data : "No tienes permiso para ver esta página.";
    } else {
      details = typeof error.data === "string" ? error.data : error.statusText || details;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
      <title>{`${title} · Propietarios Unidos`}</title>
      <div className="w-full max-w-lg text-center">
        <p className="font-display text-6xl font-semibold text-forest-700">
          {isRouteErrorResponse(error) ? error.status : "¡Ups!"}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-forest-950">{title}</h1>
        <p className="mt-3 text-stone-600">{details}</p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            href="/"
            className="inline-flex h-11 items-center rounded-lg bg-forest-700 px-5 text-sm font-medium text-white hover:bg-forest-800"
          >
            Ir al inicio
          </a>
          <a
            href="/contacto"
            className="inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-forest-800 ring-1 ring-forest-200 hover:bg-forest-50"
          >
            Contacto
          </a>
        </div>
        {stack && (
          <pre className="mt-8 max-h-80 overflow-auto rounded-lg bg-stone-900 p-4 text-left text-xs text-stone-100">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
