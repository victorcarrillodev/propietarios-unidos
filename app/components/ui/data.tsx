import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import { formatNumber } from "~/lib/format";
import type { Tone } from "~/lib/labels";
import { cn } from "~/lib/utils";

const toneClasses: Record<Tone, string> = {
  gray: "bg-stone-100 text-stone-700 ring-stone-200",
  green: "bg-forest-50 text-forest-700 ring-forest-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  earth: "bg-earth-50 text-earth-800 ring-earth-200",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl bg-white shadow-sm ring-1 ring-stone-200", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-stone-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="mb-6 print:hidden">
      <title>{`${title} · Panel Propietarios Unidos`}</title>
      {back && (
        <Link
          to={back.to}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-forest-700"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function TableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-stone-200", className)}>
      <table className="min-w-full divide-y divide-stone-200 text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "bg-stone-50 px-4 py-3 text-left text-xs font-semibold tracking-wide text-stone-500 uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-top text-stone-700", className)} {...props} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-forest-50 text-forest-700">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pageCount, total }: { page: number; pageCount: number; total: number }) {
  const location = useLocation();
  const linkFor = (target: number) => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(target));
    return `${location.pathname}?${params.toString()}`;
  };
  const navClass =
    "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium ring-1 ring-stone-300 ring-inset";
  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-stone-500">
        {formatNumber(total)} {total === 1 ? "registro" : "registros"}
        {pageCount > 1 && ` · página ${page} de ${pageCount}`}
      </p>
      {pageCount > 1 && (
        <div className="flex gap-2">
          {page > 1 ? (
            <Link to={linkFor(page - 1)} className={cn(navClass, "bg-white text-stone-700 hover:bg-stone-50")}>
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </Link>
          ) : (
            <span className={cn(navClass, "text-stone-300")}>
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </span>
          )}
          {page < pageCount ? (
            <Link to={linkFor(page + 1)} className={cn(navClass, "bg-white text-stone-700 hover:bg-stone-50")}>
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(navClass, "text-stone-300")}>
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

export function DescriptionList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase">{item.label}</dt>
          <dd className="mt-1 text-sm break-words text-stone-900">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
