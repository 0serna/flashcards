import type React from "react";

import { cn } from "@/lib/utils";

type AppScreenProps = {
  children: React.ReactNode;
  contentClassName?: string;
};

export function AppScreen({ children, contentClassName }: AppScreenProps) {
  return (
    <main className="min-h-svh bg-secondary/30 px-4 py-4 text-foreground">
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-md flex-col",
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
