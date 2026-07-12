"use client";

import "./globals.css";

import { AppScreen } from "@/components/app-screen";

import { ErrorRecovery, type ErrorRecoveryProps } from "./error-recovery";

export default function GlobalError(props: ErrorRecoveryProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-foreground">
        <AppScreen variant="centered">
          <ErrorRecovery {...props} />
        </AppScreen>
      </body>
    </html>
  );
}
