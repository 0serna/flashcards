import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "@/lib/utils";

function DividedList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="divided-list"
      className={cn(
        "divide-y divide-border rounded-xl border border-border bg-background",
        className,
      )}
      {...props}
    />
  );
}

function DividedListRow({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="divided-list-row"
      className={cn(
        "flex min-w-0 items-center justify-between gap-4 p-4",
        className,
      )}
      {...props}
    />
  );
}

function DividedListStackedRow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="divided-list-row-stacked"
      className={cn("min-w-0 space-y-3 p-4", className)}
      {...props}
    />
  );
}

export { DividedList, DividedListRow, DividedListStackedRow };
