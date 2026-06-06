/**
 * Gegner-Eingabe (Phase 4, S2) — reine, immutable Funktionen. Offline testbar
 * (opponent.test.ts). Das gegnerische Team ist eine geordnete Liste von
 * Pokémon-ids (Pick-Reihenfolge); kein localStorage (transient pro Kampf).
 */
import type { PokemonView } from "./dataset";
import { filterPokemon } from "./search";

/** Ein gegnerisches Team hat genau 6 Slots (Handoff S2). */
export const MAX_OPPONENTS = 6;

/** Wie viele Pokémon das Grid bei leerer Suche zeigt (Top nach Usage). */
export const TOP_GRID_COUNT = 20;

/** Geordnete Liste der gegnerischen Pokémon-ids (Pick-Reihenfolge). */
export type OpponentTeam = string[];

/** Fügt ein Pokémon in den nächsten freien Slot. No-op bei Duplikat/voll. */
export function addOpponent(ids: OpponentTeam, id: string): OpponentTeam {
  if (ids.length >= MAX_OPPONENTS) return ids;
  if (ids.includes(id)) return ids;
  return [...ids, id];
}

/** Entfernt ein Pokémon (Korrektur per Tap auf den Slot). */
export function removeOpponent(ids: OpponentTeam, id: string): OpponentTeam {
  return ids.filter((x) => x !== id);
}

/** True, sobald alle 6 Slots gefüllt sind → CTA „Analyse starten" aktiv. */
export function isOpponentFull(ids: OpponentTeam): boolean {
  return ids.length >= MAX_OPPONENTS;
}

/**
 * Quelle für das Grid: bei leerer Suche die Top-N nach Usage (Liste ist bereits
 * absteigend sortiert), sonst alle Treffer der Suche (DE + EN).
 */
export function gridSource(
  all: PokemonView[],
  query: string,
  topN: number = TOP_GRID_COUNT,
): PokemonView[] {
  if (!query.trim()) return all.slice(0, topN);
  return filterPokemon(all, query);
}
