"use client";

import { AppScreen } from "@/components/app-screen";

import { ErrorRecovery, type ErrorRecoveryProps } from "./error-recovery";

export default function Error(props: ErrorRecoveryProps) {
  return (
    <AppScreen variant="centered">
      <ErrorRecovery {...props} />
    </AppScreen>
  );
}
