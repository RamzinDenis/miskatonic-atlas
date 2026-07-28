/**
 * How the atlas turns its leaves (docs/01-app/02-guides/view-transitions.md).
 *
 * Direction is declared by hand: a cross-reference goes deeper into the book
 * («nav-forward»), a «← Map» or «← Bestiarium» comes back out («nav-back»).
 * Nothing infers it, and a navigation carrying no type — a browser back
 * button, a first load — animates not at all, which `default: "none"` is
 * there to guarantee. Without that key every navigation in the app would
 * fire every declared animation.
 *
 * The looks live in globals.css («Turning the leaves»).
 */
export const TURN = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

/**
 * A chart leaves like a leaf but does not arrive like one: its widget mounts
 * only in the browser (leaflet touches `window`), so the frame a transition
 * would snapshot on arrival is the bare binding — sliding that in is the
 * black screen we already fixed once. Charts pair this with `enter="none"`.
 */
export const LEAVE_CHART = TURN;
