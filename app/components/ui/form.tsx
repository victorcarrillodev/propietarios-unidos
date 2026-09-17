import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

export const inputClasses =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm ring-1 ring-stone-300 ring-inset placeholder:text-stone-400 focus:ring-2 focus:ring-forest-600 focus:ring-inset focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 aria-[invalid=true]:ring-red-500";

type ErrorValue = string | string[] | undefined | null;

function firstError(error: ErrorValue) {
  if (!error) return undefined;
  return Array.isArray(error) ? error[0] : error;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  error?: ErrorValue;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const message = firstError(error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-stone-700">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {message ? (
        <p id={`${htmlFor}-error`} className="text-sm text-red-600">
          {message}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type FieldBaseProps = {
  label: ReactNode;
  name: string;
  error?: ErrorValue;
  hint?: ReactNode;
  className?: string;
};

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  id,
  required,
  ...props
}: FieldBaseProps & InputHTMLAttributes<HTMLInputElement>) {
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
        className={inputClasses}
        {...props}
      />
    </Field>
  );
}

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
}: FieldBaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
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
        className={cn(inputClasses, "resize-y")}
        {...props}
      />
    </Field>
  );
}

export type Option = { value: string; label: string };

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
}: FieldBaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: readonly Option[];
    placeholder?: string;
  }) {
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
        className={cn(inputClasses, "pr-8")}
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

export function CheckboxField({
  label,
  name,
  hint,
  className,
  id,
  error,
  ...props
}: FieldBaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? name;
  const message = firstError(error);
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          aria-invalid={Boolean(message) || undefined}
          className="mt-0.5 size-4 rounded border-stone-300 text-forest-700 accent-forest-700 focus:ring-forest-600"
          {...props}
        />
        <div className="text-sm">
          <label htmlFor={inputId} className="font-medium text-stone-700">
            {label}
          </label>
          {hint && <p className="text-stone-500">{hint}</p>}
        </div>
      </div>
      {message && <p className="mt-1 text-sm text-red-600">{message}</p>}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "success" | "error" | "warning";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-sky-50 text-sky-900 ring-sky-200",
    success: "bg-forest-50 text-forest-900 ring-forest-200",
    error: "bg-red-50 text-red-900 ring-red-200",
    warning: "bg-amber-50 text-amber-900 ring-amber-200",
  }[tone];
  const Icon = tone === "success" ? CircleCheck : tone === "info" ? Info : CircleAlert;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl p-4 ring-1", styles, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
      </div>
    </div>
  );
}

/** Campo oculto "trampa" para bots: las personas no lo ven ni lo llenan. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        No llenes este campo
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
