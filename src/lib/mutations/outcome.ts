export type MutationRejection =
  "invalid" | "not-found" | "stale" | "unauthorized";

export type MutationOutcome<T> =
  | { status: "confirmed"; value: T }
  | { status: "rejected"; reason: MutationRejection; message: string };

export function confirmed<T>(value: T): MutationOutcome<T> {
  return { status: "confirmed", value };
}

export function rejected<T = never>(
  reason: MutationRejection,
  message: string,
): MutationOutcome<T> {
  return { status: "rejected", reason, message };
}
