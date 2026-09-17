import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { formatMoney, formatMoneyCompact, formatMonth, formatMonthShort } from "~/lib/format";
import { cn } from "~/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-stone-600">{label}</p>
        {Icon && <Icon className="size-4 text-stone-400" aria-hidden />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </>
  );
  const classes = "block rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200";
  return to ? (
    <Link to={to} className={cn(classes, "transition hover:ring-forest-300")}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export type MonthlyPoint = { month: string; income: number; expenses: number };

/** Redondea hacia arriba a un valor "limpio" (1, 2, 2.5, 5 × 10ⁿ). */
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

const SERIES = [
  { key: "income", label: "Ingresos", bar: "bg-chart-income" },
  { key: "expenses", label: "Gastos", bar: "bg-chart-expense" },
] as const;

/** Columnas agrupadas de ingresos y gastos por mes (sin librerías, renderizado en servidor). */
export function MonthlyFinanceChart({ data }: { data: MonthlyPoint[] }) {
  const maxPesos = Math.max(0, ...data.flatMap((point) => [point.income, point.expenses])) / 100;
  const top = niceCeil(Math.max(maxPesos, 1000)) * 100; // en centavos
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <figure>
      <figcaption className="sr-only">Ingresos y gastos por mes, últimos {data.length} meses</figcaption>
      <ul className="flex flex-wrap gap-4 text-sm text-stone-600" aria-label="Leyenda">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span className={cn("size-3 rounded-sm", series.bar)} aria-hidden />
            {series.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        {/* Eje Y */}
        <div className="relative h-56 w-16 shrink-0 text-right text-xs text-stone-500 tabular-nums" aria-hidden>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - tick) * 100}%` }}>
              {formatMoneyCompact(top * tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Área de trazado */}
          <div className="relative h-56 border-b border-stone-300">
            {ticks.slice(0, -1).map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-stone-100"
                style={{ top: `${(1 - tick) * 100}%` }}
                aria-hidden
              />
            ))}
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
              {data.map((point) => (
                <div key={point.month} className="flex h-full items-end gap-0.5 px-0.5">
                  {SERIES.map((series, index) => {
                    const value = point[series.key];
                    const pct = Math.min(100, (value / top) * 100);
                    return (
                      <div
                        key={series.key}
                        tabIndex={0}
                        aria-label={`${series.label}, ${formatMonth(point.month)}: ${formatMoney(value)}`}
                        className={cn(
                          "group/bar relative flex h-full flex-1 items-end outline-none",
                          index === 0 ? "justify-end" : "justify-start",
                        )}
                      >
                        <div className="relative w-full max-w-5" style={{ height: `${pct}%` }}>
                          <div
                            className={cn(
                              "h-full w-full rounded-t-[4px] transition-opacity group-hover/bar:opacity-75 group-focus-visible/bar:opacity-75",
                              series.bar,
                            )}
                          />
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg group-hover/bar:block group-focus-visible/bar:block"
                          >
                            <span className="block font-semibold">{formatMoney(value)}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-stone-300">
                              <span className={cn("h-0.5 w-3 rounded-full", series.bar)} aria-hidden />
                              {series.label} · {formatMonth(point.month)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Eje X */}
          <div
            className="mt-2 grid text-center text-xs text-stone-500"
            style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
            aria-hidden
          >
            {data.map((point) => (
              <span key={point.month} className="truncate">
                {formatMonthShort(point.month)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-forest-700 hover:text-forest-900">Ver como tabla</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-stone-500 uppercase">
              <tr>
                <th className="py-2 pr-4 font-semibold">Mes</th>
                <th className="py-2 pr-4 text-right font-semibold">Ingresos</th>
                <th className="py-2 pr-4 text-right font-semibold">Gastos</th>
                <th className="py-2 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 tabular-nums">
              {data.map((point) => (
                <tr key={point.month}>
                  <td className="py-1.5 pr-4 capitalize">{formatMonth(point.month)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatMoney(point.income)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatMoney(point.expenses)}</td>
                  <td className="py-1.5 text-right">{formatMoney(point.income - point.expenses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
