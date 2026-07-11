let currentAppPath: string | null = null;
let previousAppPath: string | null = null;

export function recordAppPath(path: string): void {
  if (currentAppPath === path) return;
  previousAppPath = currentAppPath;
  currentAppPath = path;
}

export function getPreviousAppPath(): string | null {
  return previousAppPath;
}

/** Test-only reset. Keeps navigation provenance isolated between tests. */
export function __resetNavigationHistoryForTests(): void {
  currentAppPath = null;
  previousAppPath = null;
}
