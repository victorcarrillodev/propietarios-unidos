import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { formatNumber } from "~/lib/format";
import { cn } from "~/lib/utils";

export type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  className?: string;
};

export function Pagination({ page, pageCount, total, className }: PaginationProps) {
  const location = useLocation();
  const linkFor = (target: number) => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(target));
    return `${location.pathname}?${params.toString()}`;
  };

  const navClass =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-all shadow-xs ring-1 ring-inset";

  return (
    <nav
      aria-label="Paginación de resultados"
      className={cn("mt-4 flex flex-wrap items-center justify-between gap-3 text-sm", className)}
    >
      <p className="text-stone-500 tabular-nums">
        <span className="font-semibold text-stone-700">{formatNumber(total)}</span>{" "}
        {total === 1 ? "registro" : "registros"}
        {pageCount > 1 && (
          <span>
            {" "}
            · página <span className="font-semibold text-stone-700">{page}</span> de{" "}
            <span className="font-semibold text-stone-700">{pageCount}</span>
          </span>
        )}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              to={linkFor(page - 1)}
              className={cn(
                navClass,
                "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-95",
              )}
              aria-label="Ir a la página anterior"
            >
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </Link>
          ) : (
            <span
              className={cn(navClass, "bg-stone-50/50 text-stone-300 ring-stone-200/60 cursor-not-allowed")}
              aria-disabled="true"
            >
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </span>
          )}

          {page < pageCount ? (
            <Link
              to={linkFor(page + 1)}
              className={cn(
                navClass,
                "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50 hover:text-stone-900 active:scale-95",
              )}
              aria-label="Ir a la página siguiente"
            >
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span
              className={cn(navClass, "bg-stone-50/50 text-stone-300 ring-stone-200/60 cursor-not-allowed")}
              aria-disabled="true"
            >
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
