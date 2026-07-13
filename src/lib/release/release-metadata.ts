/**
 * Release identity shared between the server-side endpoint and the
 * client-side checker.
 *
 * The production GitHub Actions workflow derives an opaque identity
 * from the workflow run and exposes it through
 * `NEXT_PUBLIC_APP_RELEASE_ID` to `vercel build`. The same value is
 * embedded in both the bundle loaded by the client and the
 * `/api/release` response served by the matching deployment.
 *
 * The module is intentionally tiny and side-effect free. The checker
 * component reads `getReleaseId()` to compare its loaded identity
 * against the response, and the endpoint reads the same function to
 * return the active deployment's identity. Missing metadata disables
 * the comparison instead of producing a false update.
 */

export function getReleaseId(): string | null {
  // Keep this as a direct property access: Next.js only inlines public
  // environment variables into browser bundles when referenced statically.
  const raw = process.env.NEXT_PUBLIC_APP_RELEASE_ID;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

export function hasReleaseMetadata(): boolean {
  return getReleaseId() !== null;
}
