import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { Link, useNavigation, type LinkProps } from "react-router";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-forest-700 text-white shadow-sm hover:bg-forest-800 focus-visible:outline-forest-700",
  secondary: "bg-white text-stone-800 shadow-sm ring-1 ring-stone-300 ring-inset hover:bg-stone-50",
  ghost: "text-stone-700 hover:bg-stone-100",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600",
  accent: "bg-amber-400 text-forest-950 shadow-sm hover:bg-amber-300 focus-visible:outline-amber-400",
  light: "text-white ring-1 ring-white/50 ring-inset hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}

/** Botón de envío que muestra estado de carga mientras se procesa el formulario. */
export function SubmitButton({
  children,
  pendingText = "Guardando…",
  intent,
  disabled,
  ...props
}: Omit<ButtonProps, "type"> & { pendingText?: string; intent?: string }) {
  const navigation = useNavigation();
  const pending =
    navigation.state === "submitting" && (intent === undefined || navigation.formData?.get("intent") === intent);
  return (
    <Button
      type="submit"
      name={intent ? "intent" : undefined}
      value={intent}
      disabled={pending || disabled}
      aria-busy={pending}
      {...props}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Botón que pide confirmación antes de enviar (por ejemplo, para eliminar). */
export function ConfirmButton({
  message,
  onClick,
  type = "submit",
  ...props
}: ButtonProps & { message: string }) {
  return (
    <Button
      type={type}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}
