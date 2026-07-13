import { getReleaseId } from "@/lib/release/release-metadata";

/**
 * Public, non-cacheable release identity endpoint.
 *
 * Returns the opaque identity of the active production deployment so a
 * previously-loaded client can detect a different release on mount and
 * on foreground return. The endpoint is public because it exposes no
 * user data, runs on every foreground check, and is excluded from the
 * Supabase session proxy for the same reasons.
 *
 * Response headers explicitly opt out of browser and intermediary
 * caching. Missing production metadata returns a null `releaseId`
 * rather than a 404 so the client can disable comparison without
 * branching on a status code.
 */

const NO_STORE_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  pragma: "no-cache",
  expires: "0",
  "surrogate-control": "no-store",
};

export function GET(): Response {
  const releaseId = getReleaseId();
  return Response.json(
    { releaseId },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}
