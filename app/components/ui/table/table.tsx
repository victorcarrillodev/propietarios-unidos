import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

export function TableContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl bg-white shadow-xs ring-1 ring-stone-200/80 transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <table className="min-w-full divide-y divide-stone-200 text-sm">{children}</table>
    </div>
  );
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("min-w-full divide-y divide-stone-200 text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-stone-50/80", className)} {...props} />;
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-stone-100 bg-white", className)} {...props} />;
}

export function Tr({
  className,
  clickable = false,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        clickable ? "cursor-pointer hover:bg-forest-50/40" : "hover:bg-stone-50/60",
        className,
      )}
      {...props}
    />
  );
}

export function Th({
  className,
  sticky = false,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { sticky?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "bg-stone-50/90 px-4 py-3.5 text-left text-xs font-semibold tracking-wider text-stone-500 uppercase",
        sticky && "sticky top-0 z-10 backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-stone-700", className)} {...props} />;
}
