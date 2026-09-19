import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Toast } from "~/lib/toast";
import { cn } from "~/lib/utils";

export function Toaster({ toast }: { toast: Toast | null }) {
  const [current, setCurrent] = useState<Toast | null>(toast);

  useEffect(() => {
    if (!toast) return;
    setCurrent(toast);
    const timer = setTimeout(() => setCurrent(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!current) return null;

  const Icon = current.type === "success" ? CheckCircle2 : current.type === "error" ? AlertCircle : Info;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6 print:hidden">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3.5 rounded-2xl p-4 text-sm shadow-xl ring-1 backdrop-blur-sm transition-all",
          current.type === "success" && "bg-forest-950/95 text-white ring-forest-700/80 shadow-forest-950/20",
          current.type === "error" && "bg-red-900/95 text-white ring-red-700/80 shadow-red-950/20",
          current.type === "info" && "bg-stone-900/95 text-white ring-stone-700/80 shadow-stone-950/20",
        )}
      >
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            current.type === "success" && "text-emerald-400",
            current.type === "error" && "text-red-300",
            current.type === "info" && "text-sky-300",
          )}
          aria-hidden
        />
        <p className="flex-1 font-medium leading-relaxed">{current.message}</p>
        <button
          type="button"
          onClick={() => setCurrent(null)}
          className="rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-white/10"
          aria-label="Cerrar aviso"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
