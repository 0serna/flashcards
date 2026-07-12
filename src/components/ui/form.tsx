import * as React from "react";

import { cn } from "@/lib/utils";

function FormSurface({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form-surface"
      className={cn(
        "space-y-6 rounded-lg border border-border bg-background px-4 py-5 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

function FormActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export { FormActions, FormSurface };
