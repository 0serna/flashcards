"use client";

import { ErrorRecovery, type ErrorRecoveryProps } from "./error-recovery";
import "./globals.css";

export default function GlobalError(props: ErrorRecoveryProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <ErrorRecovery {...props} />
      </body>
    </html>
  );
}
