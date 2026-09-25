import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { Link, useNavigation, type LinkProps } from "react-router";
import { cn } from "~/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "light" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-forest-700 text-white shadow-xs hover:bg-forest-800 hover:shadow-sm focus-visible:ring-forest-600 focus-visible:ring-offset-cream active:bg-forest-900",
  secondary:
    "bg-white text-stone-800 shadow-xs ring-1 ring-stone-300 ring-inset hover:bg-stone-50 hover:ring-stone-400 focus-visible:ring-forest-600 focus-visible:ring-offset-cream",
  ghost:
    "text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-forest-600 focus-visible:ring-offset-cream active:bg-stone-200/70",
  danger:
    "bg-red-600 text-white shadow-xs hover:bg-red-700 hover:shadow-sm focus-visible:ring-red-600 focus-visible:ring-offset-cream active:bg-red-800",
  accent:
    "bg-amber-400 text-forest-950 shadow-xs font-semibold hover:bg-amber-300 hover:shadow-sm focus-visible:ring-amber-500 focus-visible:ring-offset-forest-950 active:bg-amber-500",
  light:
    "text-white font-semibold ring-2 ring-white/80 ring-inset hover:bg-white/20 hover:ring-white focus-visible:ring-white active:bg-white/30",
  outline:
    "bg-transparent text-forest-800 font-semibold ring-2 ring-forest-600 ring-inset hover:bg-forest-50 hover:text-forest-900 hover:ring-forest-700 focus-visible:ring-forest-600 focus-visible:ring-offset-cream active:bg-forest-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs sm:text-sm [&_svg]:size-3.5",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base [&_svg]:size-5",
  icon: "size-10 p-0",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
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
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
