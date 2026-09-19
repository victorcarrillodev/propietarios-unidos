import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Telón de fondo (backdrop) */}
      <div
        className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del diálogo */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-900/10 transition-all",
          "animate-in fade-in zoom-in-95 duration-200",
          sizeClasses,
          className,
        )}
      >
        {/* Cabecera */}
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
            <div className="pr-6">
              {title && (
                <h3 id="modal-title" className="font-display text-xl font-semibold text-stone-900">
                  {title}
                </h3>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-stone-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-forest-600"
              aria-label="Cerrar modal"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6 max-h-[calc(85vh-10rem)] overflow-y-auto">{children}</div>

        {/* Pie de modal */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
