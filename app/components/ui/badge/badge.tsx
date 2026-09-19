import type { ReactNode } from "react";
import type { Tone } from "~/lib/labels";
import { cn } from "~/lib/utils";

const toneClasses: Record<Tone, { badge: string; dot: string }> = {
  gray: {
    badge: "bg-stone-100 text-stone-700 ring-stone-200/80 hover:bg-stone-200/60",
    dot: "bg-stone-400",
  },
  green: {
    badge: "bg-forest-50 text-forest-800 ring-forest-200/80 hover:bg-forest-100/70",
    dot: "bg-forest-500",
  },
  amber: {
    badge: "bg-amber-50 text-amber-900 ring-amber-200/80 hover:bg-amber-100/70",
    dot: "bg-amber-500",
  },
  red: {
    badge: "bg-red-50 text-red-800 ring-red-200/80 hover:bg-red-100/70",
    dot: "bg-red-500",
  },
  blue: {
    badge: "bg-sky-50 text-sky-800 ring-sky-200/80 hover:bg-sky-100/70",
    dot: "bg-sky-500",
  },
  earth: {
    badge: "bg-earth-50 text-earth-900 ring-earth-200/80 hover:bg-earth-100/70",
    dot: "bg-earth-600",
  },
};

export type BadgeProps = {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
};

export function Badge({
  tone = "gray",
  dot = false,
  size = "sm",
  children,
  className,
}: BadgeProps) {
  const styles = toneClasses[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs sm:text-sm",
        styles.badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 shrink-0 rounded-full", styles.dot)} aria-hidden />}
      {children}
    </span>
  );
}
