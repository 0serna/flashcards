/**
 * Pure route-to-parent resolver.
 *
 * The authenticated browser Back gesture must always reach the
 * deterministic immediate parent of the current route, regardless of the
 * chronological browser history. The hierarchy mirrors what breadcrumbs
 * and explicit return links already use, so the user never sees a
 * mismatch between the gesture and the visible navigation.
 *
 * Home (`/`) is the absolute terminal: Back on Home stays on Home even
 * when the preceding entry is an external page.
 *
 * Query parameters never introduce hierarchy levels. Study modes share
 * the owning Deck as their parent so Review and Practice stay on the same
 * branch.
 *
 * The function is pure: it never inspects the DOM, the history stack, or
 * the React tree. That keeps it cheap to test and trivial to reuse from
 * the history boundary or a unit test.
 */

type ParentResolver = (path: string) => string;

const DECK_DETAIL_PATTERN = /^\/decks\/([^/]+)$/;
const DECK_EDIT_PATTERN = /^\/decks\/([^/]+)\/edit$/;
const DECK_NEW_CARD_PATTERN = /^\/decks\/([^/]+)\/cards\/new$/;
const DECK_ARCHIVED_CARDS_PATTERN = /^\/decks\/([^/]+)\/cards\/archived$/;
const DECK_STUDY_PATTERN = /^\/decks\/([^/]+)\/study$/;
const DECK_EDIT_CARD_PATTERN = /^\/decks\/([^/]+)\/cards\/([^/]+)\/edit$/;

function stripQuery(path: string): string {
  const queryIndex = path.indexOf("?");
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

export const resolveParentPath: ParentResolver = (rawPath) => {
  const path = stripQuery(rawPath);

  if (path === "/" || path === "") {
    return "/";
  }

  if (path === "/decks/archived" || path === "/decks/new") {
    return "/";
  }

  const deckMatch = DECK_DETAIL_PATTERN.exec(path);
  if (deckMatch) {
    return "/";
  }

  const editMatch = DECK_EDIT_PATTERN.exec(path);
  if (editMatch && editMatch[1]) {
    return `/decks/${editMatch[1]}`;
  }

  const newCardMatch = DECK_NEW_CARD_PATTERN.exec(path);
  if (newCardMatch && newCardMatch[1]) {
    return `/decks/${newCardMatch[1]}`;
  }

  const archivedCardsMatch = DECK_ARCHIVED_CARDS_PATTERN.exec(path);
  if (archivedCardsMatch && archivedCardsMatch[1]) {
    return `/decks/${archivedCardsMatch[1]}`;
  }

  const studyMatch = DECK_STUDY_PATTERN.exec(path);
  if (studyMatch && studyMatch[1]) {
    return `/decks/${studyMatch[1]}`;
  }

  const editCardMatch = DECK_EDIT_CARD_PATTERN.exec(path);
  if (editCardMatch && editCardMatch[1]) {
    return `/decks/${editCardMatch[1]}`;
  }

  // Safe fallback: any authenticated nested route we don't recognize
  // resolves to Home. Documented in the design as a defense against
  // future route additions forgetting the resolver.
  return "/";
};
