import { formatMoney, formatMoneyCompact, formatMonth, formatMonthShort } from "~/lib/format";
import { cn } from "~/lib/utils";

export type MonthlyPoint = { month: string; income: number; expenses: number };

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

export function MonthlyFinanceChart({ data }: { data: MonthlyPoint[] }) {
  const maxPesos = Math.max(0, ...data.flatMap((point) => [point.income, point.expenses])) / 100;
  const top = niceCeil(Math.max(maxPesos, 1000)) * 100;
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <figure className="relative">
      <figcaption className="sr-only">Ingresos y gastos por mes, últimos {data.length} meses</figcaption>
      <ul className="flex flex-wrap gap-5 text-xs font-medium text-stone-600 mb-2" aria-label="Leyenda">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span className={cn("size-3 rounded-md shadow-2xs", series.bar)} aria-hidden />
            <span>{series.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-3">
        {/* Eje Y */}
        <div className="relative h-60 w-16 shrink-0 text-right text-xs text-stone-400 tabular-nums select-none" aria-hidden>
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - tick) * 100}%` }}>
              {formatMoneyCompact(top * tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Área de trazado */}
          <div className="relative h-60 border-b border-stone-200">
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
                <div key={point.month} className="flex h-full items-end gap-1 px-1">
                  {SERIES.map((series, index) => {
                    const value = point[series.key];
                    const pct = Math.min(100, (value / top) * 100);
                    return (
                      <div
                        key={series.key}
                        tabIndex={0}
                        aria-label={`${series.label}, ${formatMonth(point.month)}: ${formatMoney(value)}`}
                        className={cn(
                          "group/bar relative flex h-full flex-1 items-end outline-none cursor-pointer",
                          index === 0 ? "justify-end" : "justify-start",
                        )}
                      >
                        <div className="relative w-full max-w-5 transition-all duration-300" style={{ height: `${pct}%` }}>
                          <div
                            className={cn(
                              "h-full w-full rounded-t-md transition-all group-hover/bar:brightness-110 group-focus-visible/bar:brightness-110",
                              series.bar,
                            )}
                          />
                          <div
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-xl bg-forest-950/95 px-3 py-2 text-xs whitespace-nowrap text-white shadow-xl ring-1 ring-white/10 backdrop-blur-xs group-hover/bar:block group-focus-visible/bar:block"
                          >
                            <span className="block font-semibold">{formatMoney(value)}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-stone-300">
                              <span className={cn("h-1 w-2.5 rounded-full", series.bar)} aria-hidden />
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
            className="mt-2.5 grid text-center text-xs font-medium text-stone-500"
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

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer font-medium text-forest-700 hover:text-forest-900 transition-colors">
          Ver datos como tabla accesible
        </summary>
        <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-stone-200">
          <table className="min-w-full text-left text-sm divide-y divide-stone-200">
            <thead className="bg-stone-50 text-xs font-semibold text-stone-500 uppercase">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Mes</th>
                <th className="py-2.5 px-4 text-right font-semibold">Ingresos</th>
                <th className="py-2.5 px-4 text-right font-semibold">Gastos</th>
                <th className="py-2.5 px-4 text-right font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white tabular-nums text-stone-700">
              {data.map((point) => (
                <tr key={point.month} className="hover:bg-stone-50/70">
                  <td className="py-2 px-4 capitalize font-medium">{formatMonth(point.month)}</td>
                  <td className="py-2 px-4 text-right text-emerald-700">{formatMoney(point.income)}</td>
                  <td className="py-2 px-4 text-right text-amber-700">{formatMoney(point.expenses)}</td>
                  <td className="py-2 px-4 text-right font-semibold">
                    {formatMoney(point.income - point.expenses)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
