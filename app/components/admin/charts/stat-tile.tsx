import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

export type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  to?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
};

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  to,
  trend,
}: StatTileProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">{label}</p>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-xl bg-forest-50 text-forest-700 shadow-xs ring-1 ring-forest-200/50">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl tabular-nums">
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded-full",
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">{hint}</p>}
    </>
  );

  const containerClasses =
    "block rounded-2xl bg-white p-5 sm:p-6 shadow-xs ring-1 ring-stone-200/80 transition-all duration-200";

  return to ? (
    <Link
      to={to}
      className={cn(
        containerClasses,
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-forest-300 active:scale-[0.99]",
      )}
    >
      {content}
    </Link>
  ) : (
    <div className={containerClasses}>{content}</div>
  );
}
