import { cn } from "~/lib/utils";

/** Emblema provisional (árbol con raíces estilizado). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="#20452b" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#d4b07b" strokeOpacity="0.7" strokeWidth="1.5" />
      <circle cx="22" cy="29" r="8.5" fill="#2d6b3e" />
      <circle cx="42" cy="29" r="8.5" fill="#2d6b3e" />
      <circle cx="32" cy="22" r="11" fill="#5fa26e" />
      <circle cx="26" cy="31" r="7" fill="#3d8550" />
      <circle cx="38" cy="31" r="7" fill="#3d8550" />
      <path d="M29.6 32h4.8l1.4 13.5h-7.6z" fill="#b07a3d" />
      <path
        d="M32 45.5c-4 0-8 1.6-11 4.2M32 45.5c4 0 8 1.6 11 4.2M32 45.5v5"
        fill="none"
        stroke="#c49354"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LogoMark className="size-10 shrink-0 sm:size-11" />
      <span className="leading-tight">
        <span className={cn("block font-display text-lg font-semibold", light ? "text-white" : "text-forest-900")}>
          Propietarios Unidos
        </span>
        <span className={cn("block text-xs font-medium", light ? "text-forest-200" : "text-forest-600")}>
          Bosque La Primavera
        </span>
      </span>
    </span>
  );
}
