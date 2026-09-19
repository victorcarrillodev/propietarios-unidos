import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type DescriptionItem = {
  label: string;
  value: ReactNode;
  span?: 1 | 2;
};

export type DescriptionListProps = {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
};

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  const colClass = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <dl className={cn("grid gap-x-6 gap-y-5", colClass, className)}>
      {items.map((item) => (
        <div key={item.label} className={item.span === 2 ? "sm:col-span-2" : undefined}>
          <dt className="text-xs font-semibold tracking-wider text-stone-500 uppercase">{item.label}</dt>
          <dd className="mt-1.5 text-sm leading-relaxed break-words text-stone-900 font-medium">
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
