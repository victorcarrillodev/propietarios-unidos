import { data } from "react-router";
import { ButtonLink } from "~/components/ui/button";
import { PageHeader } from "~/components/ui/data";

export function loader() {
  return data(null, { status: 404 });
}

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
      <PageHeader title="Página no encontrada" />
      <p className="text-sm text-stone-600">La sección que buscas no existe en el panel.</p>
      <ButtonLink to="/admin" className="mt-6">
        Volver al panel
      </ButtonLink>
    </div>
  );
}
