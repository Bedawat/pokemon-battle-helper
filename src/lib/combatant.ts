/**
 * Adapter: baut aus Team-Mitgliedern bzw. Gegner-ids die für Matchups nötigen
 * Combatant-Objekte (Typen + Move-Typen). Liegt getrennt von synergy.ts, damit
 * dort die reine, datenfreie Logik testbar bleibt.
 */
import type { TeamMember } from "../types/team";
import { getPokemon } from "./data";
import { offensiveMoveTypes } from "./dataset";
import type { Combatant } from "./synergy";

/**
 * Eigenes Pokémon: Move-Typen aus dem eingestellten Moveset, ohne Status-Moves
 * (die tragen nichts zur offensiven Coverage bei).
 */
export function ownCombatant(member: TeamMember): Combatant | undefined {
  const mon = getPokemon(member.pokemonId);
  if (!mon) return undefined;
  // Katalog (Movepool + Top-Moves) liefert die Kategorie nach, falls das
  // gespeicherte Team noch von vor dem Daten-Rebuild stammt (Moves ohne category).
  const catalog = [...(mon.movepool ?? []), ...mon.topMoves];
  return {
    id: member.pokemonId,
    types: mon.types,
    moveTypes: offensiveMoveTypes(member.moves, catalog),
  };
}

/**
 * Gegnerisches Pokémon: Move-Typen aus den Top-Attacken (Pikalytics), ohne
 * Status-Moves.
 */
export function oppCombatant(id: string): Combatant | undefined {
  const mon = getPokemon(id);
  if (!mon) return undefined;
  return {
    id,
    types: mon.types,
    moveTypes: offensiveMoveTypes(mon.topMoves, mon.movepool),
  };
}
