const PRELOAD_WINDOW_CARDS = 10;
const MAX_PRELOADED_IMAGES = PRELOAD_WINDOW_CARDS * 2;

const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g"]);

type NavigatorConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: NavigatorConnection;
};

export type PreloadSource = {
  front: { imageUrl: string | null };
  back: { imageUrl: string | null };
};

/**
 * Kick off browser prefetches for the next ten study cards after the
 * current one, capped at 20 image requests. The function is a no-op
 * when the browser reports data saving or a slow effective connection,
 * and when the connection API is unavailable the bounded behavior runs
 * as-is.
 */
export function preloadUpcomingImages(
  cards: PreloadSource[],
  currentIndex: number,
): void {
  if (typeof window === "undefined") return;

  const connection = (navigator as NavigatorWithConnection).connection;
  if (connection?.saveData) return;
  if (
    connection?.effectiveType &&
    SLOW_EFFECTIVE_TYPES.has(connection.effectiveType)
  ) {
    return;
  }

  const upcoming = cards.slice(
    currentIndex + 1,
    currentIndex + 1 + PRELOAD_WINDOW_CARDS,
  );

  const urls: string[] = [];
  for (const card of upcoming) {
    for (const url of [card.front.imageUrl, card.back.imageUrl]) {
      if (!url) continue;
      urls.push(url);
      if (urls.length >= MAX_PRELOADED_IMAGES) break;
    }
    if (urls.length >= MAX_PRELOADED_IMAGES) break;
  }

  for (const url of urls) {
    const img = new Image();
    img.src = url;
  }
}
