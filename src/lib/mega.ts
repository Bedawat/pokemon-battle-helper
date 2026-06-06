/**
 * Mega-Zustand im Live-Kampf (Phase 9, S5) — reine, immutable Logik. Modelliert
 * den Spiel-Constraint **ein Mega pro Seite und Kampf** (One-per-Side); eigene
 * und gegnerische Seite sind unabhängig. Offline testbar (mega.test.ts).
 *
 * Mega ändert im Scope nur die Typen (siehe MegaForm) — die Auflösung der
 * tatsächlichen Typen passiert im Aufrufer über `Pokemon.megas`.
 */

/** Welche Seite mega-entwickelt. */
export type Side = "own" | "opp";

/** Eine festgeschriebene Mega-Entwicklung: welches Pokémon, welche Mega-Form. */
export interface CommittedMega {
  /** pokemonId (Spezies-id) des mega-entwickelten Pokémon. */
  id: string;
  /** Gewählte Mega-Form (MegaForm.id), z. B. "charizard-mega-x". */
  megaId: string;
}

/** Festgeschriebene Megas je Seite — höchstens eine pro Seite. */
export interface MegaState {
  own: CommittedMega | null;
  opp: CommittedMega | null;
}

/** Startzustand: keine Seite hat mega-entwickelt. */
export const NO_MEGA: MegaState = { own: null, opp: null };

/**
 * Darf dieses Pokémon (auf dieser Seite) noch mega-entwickeln? Ja, wenn die
 * Seite noch kein Mega festgeschrieben hat — oder das festgeschriebene genau
 * dieses Pokémon ist (dann ist es bereits Mega, „zurücknehmen" bleibt möglich).
 */
export function canMega(state: MegaState, side: Side, id: string): boolean {
  const committed = state[side];
  return committed === null || committed.id === id;
}

/**
 * Schreibt die Mega-Entwicklung fest. No-op, wenn die Seite bereits ein
 * *anderes* Pokémon mega-entwickelt hat (One-per-Side).
 */
export function commitMega(
  state: MegaState,
  side: Side,
  id: string,
  megaId: string,
): MegaState {
  if (!canMega(state, side, id)) return state;
  return { ...state, [side]: { id, megaId } };
}

/**
 * Nimmt die Mega-Entwicklung dieses Pokémon zurück (Fehltipp-Schutz). No-op,
 * wenn dieses Pokémon auf der Seite nicht mega-entwickelt ist.
 */
export function revertMega(state: MegaState, side: Side, id: string): MegaState {
  if (state[side]?.id !== id) return state;
  return { ...state, [side]: null };
}

/** Festgeschriebene Mega-Form-id dieses Pokémon auf der Seite, sonst null. */
export function activeMegaId(
  state: MegaState,
  side: Side,
  id: string,
): string | null {
  return state[side]?.id === id ? state[side]!.megaId : null;
}
