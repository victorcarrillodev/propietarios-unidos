import type { ReactNode } from "react";
import { TopoPattern } from "~/components/brand";
import { Container } from "./container";

export type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-white">
      <TopoPattern className="text-white/[0.07]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-forest-950/20 to-forest-950/60" aria-hidden />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        {eyebrow && <p className="text-xs font-semibold tracking-widest text-amber-300 uppercase">{eyebrow}</p>}
        <h1 className="mt-2.5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg sm:text-xl leading-relaxed text-forest-100/90">{description}</p>
        )}
        {children && <div className="mt-8 sm:mt-10">{children}</div>}
      </Container>
    </section>
  );
}
