import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/40 text-center transition-all",
        compact ? "px-4 py-8" : "px-6 py-12 sm:py-16",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-stone-200/80 text-forest-700">
        <Icon className="size-7" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-stone-900 sm:text-lg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-stone-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
