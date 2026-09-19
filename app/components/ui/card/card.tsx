import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type CardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  variant?: "default" | "muted" | "elevated";
  hoverable?: boolean;
};

export function Card({
  title,
  description,
  actions,
  footer,
  children,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
  variant = "default",
  hoverable = false,
}: CardProps) {
  const variantStyles = {
    default: "bg-white ring-1 ring-stone-200/80 shadow-xs",
    muted: "bg-stone-50/80 ring-1 ring-stone-200/60",
    elevated: "bg-white ring-1 ring-stone-200/70 shadow-sm hover:shadow-md",
  }[variant];

  return (
    <section
      className={cn(
        "rounded-2xl transition-all duration-200",
        variantStyles,
        hoverable && "hover:-translate-y-0.5 hover:ring-forest-300 hover:shadow-md",
        className,
      )}
    >
      {(title || actions) && (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:px-6",
            headerClassName,
          )}
        >
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-base font-semibold text-stone-900 tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
      {footer && (
        <footer
          className={cn(
            "border-t border-stone-100 bg-stone-50/50 px-5 py-3.5 rounded-b-2xl sm:px-6 text-sm text-stone-600",
            footerClassName,
          )}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
