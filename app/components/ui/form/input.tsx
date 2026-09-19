import type { InputHTMLAttributes } from "react";
import { cn } from "~/lib/utils";
import { Field, firstError, inputClasses, type FieldBaseProps } from "./field";

export type TextFieldProps = FieldBaseProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  id,
  required,
  ...props
}: TextFieldProps) {
  const inputId = id ?? name;
  const invalid = Boolean(firstError(error));
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <input
        id={inputId}
        name={name}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(inputClasses, invalid && "ring-red-500 focus:ring-red-500")}
        {...props}
      />
    </Field>
  );
}
