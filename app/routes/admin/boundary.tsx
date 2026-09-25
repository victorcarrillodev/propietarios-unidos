import { ShieldX, TriangleAlert } from "lucide-react";
import { isRouteErrorResponse, Outlet } from "react-router";
import { ButtonLink } from "~/components/ui";
import type { Route } from "./+types/boundary";

// Ruta sin URL que envuelve todas las páginas del panel: si una falla, el error
// se muestra dentro del panel sin perder el menú lateral.
export default function AdminBoundary() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const forbidden = status === 403;
  const notFound = status === 404;
  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : error.statusText
    : import.meta.env.DEV && error instanceof Error
      ? error.message
      : "Ocurrió un error inesperado. Intenta de nuevo.";

  const Icon = forbidden ? ShieldX : TriangleAlert;
  const title = forbidden ? "Acceso restringido" : notFound ? "No encontrado" : "Algo salió mal";

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
      <title>{`${title} · Panel Propietarios Unidos`}</title>
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Icon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">{title}</h1>
      <p className="mt-2 text-sm text-stone-600">{message}</p>
      <ButtonLink to="/admin" className="mt-6">
        Volver al panel
      </ButtonLink>
    </div>
  );
}
