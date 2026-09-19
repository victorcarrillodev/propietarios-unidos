import type { SelectHTMLAttributes } from "react";
import { cn } from "~/lib/utils";
import { Field, firstError, inputClasses, type FieldBaseProps } from "./field";

export type Option = { value: string; label: string };

export type SelectFieldProps = FieldBaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly Option[];
    placeholder?: string;
  };

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  id,
  required,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const inputId = id ?? name;
  const invalid = Boolean(firstError(error));
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <select
        id={inputId}
        name={name}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(inputClasses, "pr-8", invalid && "ring-red-500 focus:ring-red-500")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
