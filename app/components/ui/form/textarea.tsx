import type { TextareaHTMLAttributes } from "react";
import { cn } from "~/lib/utils";
import { Field, firstError, inputClasses, type FieldBaseProps } from "./field";

export type TextareaFieldProps = FieldBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    rows?: number;
  };

export function TextareaField({
  label,
  name,
  error,
  hint,
  className,
  id,
  required,
  rows = 4,
  ...props
}: TextareaFieldProps) {
  const inputId = id ?? name;
  const invalid = Boolean(firstError(error));
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(inputClasses, "resize-y", invalid && "ring-red-500 focus:ring-red-500")}
        {...props}
      />
    </Field>
  );
}
