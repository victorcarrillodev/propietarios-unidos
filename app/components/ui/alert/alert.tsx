import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type AlertTone = "info" | "success" | "error" | "warning";

export type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

export function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const config = {
    info: {
      container: "bg-sky-50 text-sky-900 ring-sky-200/80",
      icon: Info,
      iconColor: "text-sky-600",
    },
    success: {
      container: "bg-forest-50 text-forest-900 ring-forest-200/80",
      icon: CheckCircle2,
      iconColor: "text-forest-600",
    },
    error: {
      container: "bg-red-50 text-red-900 ring-red-200/80",
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    warning: {
      container: "bg-amber-50 text-amber-900 ring-amber-200/80",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
  }[tone];

  const Icon = config.icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3.5 rounded-2xl p-4 ring-1 shadow-xs transition-all",
        config.container,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", config.iconColor)} aria-hidden />
      <div className="flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? "mt-1" : undefined, "text-stone-700")}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-black/5 transition-opacity"
          aria-label="Cerrar aviso"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
