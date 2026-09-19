import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export type Breadcrumb = {
  label: string;
  to?: string;
};

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  breadcrumbs?: Breadcrumb[];
  badge?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  back,
  breadcrumbs,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 print:hidden", className)}>
      <title>{`${title} · Panel Propietarios Unidos`}</title>

      {/* Migajas de pan (breadcrumbs) */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Migajas de pan" className="mb-3 flex items-center gap-1.5 text-xs text-stone-500">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.label} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="size-3 text-stone-400" aria-hidden />}
              {crumb.to ? (
                <Link to={crumb.to} className="transition-colors hover:text-forest-700 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-stone-700" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Botón de regreso rápido */}
      {back && (
        <Link
          to={back.to}
          className="group mb-2.5 inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-forest-800"
        >
          <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          {back.label}
        </Link>
      )}

      {/* Título principal y acciones */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600 max-w-3xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
