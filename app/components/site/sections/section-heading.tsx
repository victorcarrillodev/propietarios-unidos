import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-xs font-semibold tracking-widest uppercase",
            light ? "text-amber-300" : "text-earth-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight",
          light ? "text-white" : "text-forest-950",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-base sm:text-lg leading-relaxed", light ? "text-forest-100" : "text-stone-600")}>
          {description}
        </p>
      )}
    </div>
  );
}
