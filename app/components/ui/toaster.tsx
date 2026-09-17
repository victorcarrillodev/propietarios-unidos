import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
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

  const Icon = current.type === "success" ? CircleCheck : current.type === "error" ? CircleAlert : Info;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6 print:hidden">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl p-4 text-sm shadow-lg ring-1",
          current.type === "success" && "bg-forest-900 text-white ring-forest-700",
          current.type === "error" && "bg-red-700 text-white ring-red-600",
          current.type === "info" && "bg-stone-900 text-white ring-stone-700",
        )}
      >
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p className="flex-1">{current.message}</p>
        <button
          type="button"
          onClick={() => setCurrent(null)}
          className="rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Cerrar aviso"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
