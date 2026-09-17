import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Form, Link, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { inputClasses, type Option } from "~/components/ui/form";
import { cn } from "~/lib/utils";

/** Barra de filtros (formulario GET: los filtros quedan en la URL y se pueden compartir). */
export function FilterBar({ children, hasFilters }: { children: ReactNode; hasFilters: boolean }) {
  const location = useLocation();
  return (
    <Form method="get" className="mb-4 flex flex-wrap items-end gap-3 print:hidden" role="search">
      {children}
      <div className="flex gap-2">
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {hasFilters && (
          <Link
            to={location.pathname}
            className="inline-flex h-10 items-center px-2 text-sm font-medium text-stone-500 hover:text-stone-800"
          >
            Limpiar
          </Link>
        )}
      </div>
    </Form>
  );
}

export function SearchInput({
  name = "q",
  defaultValue,
  placeholder = "Buscar…",
  label = "Buscar",
  className,
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block min-w-56 flex-1", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn(inputClasses, "h-10 pl-9")}
      />
    </label>
  );
}

export function FilterSelect({
  name,
  label,
  options,
  defaultValue,
  allLabel = "Todos",
}: {
  name: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string;
  allLabel?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={cn(inputClasses, "h-10 min-w-40 pr-8")}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterDate({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <input type="date" name={name} defaultValue={defaultValue} className={cn(inputClasses, "h-10")} />
    </label>
  );
}
