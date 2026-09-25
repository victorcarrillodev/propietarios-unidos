import { ArrowLeft, TreePine } from "lucide-react";
import { data } from "react-router";
import { Section } from "~/components/site/sections";
import { ButtonLink } from "~/components/ui";

export function loader() {
  return data(null, { status: 404 });
}

export function meta() {
  return [{ title: "Página no encontrada · Propietarios Unidos" }, { name: "robots", content: "noindex" }];
}

export default function NotFound() {
  return (
    <Section>
      <div className="mx-auto max-w-lg py-10 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <TreePine className="size-8" aria-hidden />
        </span>
        <p className="mt-6 text-sm font-semibold tracking-wider text-earth-600 uppercase">Error 404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-forest-950">Te perdiste en el bosque</h1>
        <p className="mt-3 text-stone-600">La página que buscas no existe o cambió de lugar.</p>
        <ButtonLink to="/" className="mt-8">
          <ArrowLeft aria-hidden /> Volver al inicio
        </ButtonLink>
      </div>
    </Section>
  );
}
