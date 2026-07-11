/**
 * Typed model for the authenticated contextual navigation.
 *
 * - `items` is rendered in order. The first item is always the Home root
 *   and the last item is always the current (non-clickable) view.
 * - Pages provide the full visible chain, including the Home root.
 * - The final item is the current non-clickable view; ancestor items should
 *   provide an `href` so they can be guarded before navigation.
 */
export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
};
