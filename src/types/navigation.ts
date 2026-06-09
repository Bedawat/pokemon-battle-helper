/**
 * Screen-Definitionen für das App-Routing.
 * Entspricht S1–S8 aus dem Web-App Handoff (Abschnitt 4).
 */
export type Screen =
  | "main-menu" // S1 — Hauptmenü / Begrüßung
  | "opponent-input" // S2 — Gegner-Eingabe
  | "synergy" // S3 — Synergie-Übersicht (Pick-Phase)
  | "lead-select" // S4 — Lead-Auswahl
  | "live-battle" // S5 — Live-Kampf
  | "team-list" // S6 — Team-Liste
  | "team-editor" // S7 — Team-Editor
  | "pokemon-detail"; // S8 — Pokémon-Detail (Attacken bearbeiten)

/** Die zwei Tabs der Bottom-NavBar. */
export type NavTab = "home" | "team";

/** Welcher Tab zu welchem Screen gehört (für die NavBar-Hervorhebung). */
export const SCREEN_TO_TAB: Record<Screen, NavTab> = {
  "main-menu": "home",
  "opponent-input": "home",
  synergy: "home",
  "lead-select": "home",
  "live-battle": "home",
  "team-list": "team",
  "team-editor": "team",
  "pokemon-detail": "team",
};

/**
 * Im Live-Kampf ist der Team-Tab deaktiviert (Handoff S5).
 * Diese Screens sperren den Team-Tab.
 */
export const SCREENS_LOCKING_TEAM_TAB: ReadonlySet<Screen> = new Set<Screen>([
  "live-battle",
]);
