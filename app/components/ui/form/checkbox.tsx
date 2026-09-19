import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "~/lib/utils";
import { firstError, type FieldBaseProps } from "./field";

export type CheckboxFieldProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;

export function CheckboxField({
  label,
  name,
  hint,
  className,
  id,
  error,
  ...props
}: CheckboxFieldProps) {
  const inputId = id ?? name;
  const message = firstError(error);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          aria-invalid={Boolean(message) || undefined}
          className="mt-0.5 size-4 rounded-md border-stone-300 text-forest-700 accent-forest-700 transition-colors focus:ring-2 focus:ring-forest-600 focus:ring-offset-2"
          {...props}
        />
        <div className="text-sm select-none">
          <label htmlFor={inputId} className="font-medium text-stone-800 cursor-pointer">
            {label}
          </label>
          {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
        </div>
      </div>
      {message && (
        <p className="flex items-center gap-1.5 pl-7 text-xs font-medium text-red-600">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
