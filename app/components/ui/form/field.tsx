import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export const inputClasses =
  "block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-xs ring-1 ring-stone-300 ring-inset placeholder:text-stone-400 transition-all focus:ring-2 focus:ring-forest-600 focus:ring-inset focus:outline-none disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed aria-[invalid=true]:ring-red-500 aria-[invalid=true]:focus:ring-red-500";

export type ErrorValue = string | string[] | undefined | null;

export function firstError(error: ErrorValue): string | undefined {
  if (!error) return undefined;
  return Array.isArray(error) ? error[0] : error;
}

export type FieldProps = {
  label: ReactNode;
  htmlFor: string;
  error?: ErrorValue;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const message = firstError(error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-stone-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500" title="Campo obligatorio" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {message ? (
        <p id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-xs font-medium text-red-600 animate-in fade-in duration-150">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type FieldBaseProps = {
  label: ReactNode;
  name: string;
  error?: ErrorValue;
  hint?: ReactNode;
  className?: string;
};
