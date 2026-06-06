/**
 * Adapter: baut aus Team-Mitgliedern bzw. Gegner-ids die für Matchups nötigen
 * Combatant-Objekte (Typen + Move-Typen). Liegt getrennt von synergy.ts, damit
 * dort die reine, datenfreie Logik testbar bleibt.
 */
import type { MegaForm, PokemonType } from "../types/pokemon";
import type { TeamMember } from "../types/team";
import { getPokemon } from "./data";
import { offensiveMoveTypes } from "./dataset";
import type { PokemonView } from "./dataset";
import type { Combatant } from "./synergy";

/**
 * Aktive Typen: die Grund-Typen, oder — wenn `megaId` auf eine vorhandene
 * Mega-Form zeigt — deren Typen. Unbekanntes/fehlendes `megaId` → Grund-Typen
 * (Safe Default). Rein und offline testbar (combatant.test.ts).
 */
export function resolveActiveTypes(
  baseTypes: PokemonType[],
  megas: MegaForm[] | undefined,
  megaId?: string | null,
): PokemonType[] {
  if (!megaId) return baseTypes;
  const mega = megas?.find((m) => m.id === megaId);
  return mega ? mega.types : baseTypes;
}

/** Aktive Typen für ein konkretes Pokémon (Live-Kampf S5). */
function activeTypes(mon: PokemonView, megaId?: string | null): PokemonType[] {
  return resolveActiveTypes(mon.types, mon.megas, megaId);
}

/**
 * Eigenes Pokémon: Move-Typen aus dem eingestellten Moveset, ohne Status-Moves
 * (die tragen nichts zur offensiven Coverage bei). `megaId` (optional) schaltet
 * die Typen auf die gewählte Mega-Form um (Live-Kampf).
 */
export function ownCombatant(
  member: TeamMember,
  megaId?: string | null,
): Combatant | undefined {
  const mon = getPokemon(member.pokemonId);
  if (!mon) return undefined;
  // Katalog (Movepool + Top-Moves) liefert die Kategorie nach, falls das
  // gespeicherte Team noch von vor dem Daten-Rebuild stammt (Moves ohne category).
  const catalog = [...(mon.movepool ?? []), ...mon.topMoves];
  return {
    id: member.pokemonId,
    types: activeTypes(mon, megaId),
    moveTypes: offensiveMoveTypes(member.moves, catalog),
  };
}

/**
 * Gegnerisches Pokémon: Move-Typen aus den Top-Attacken (Pikalytics), ohne
 * Status-Moves. `megaId` (optional) schaltet die Typen auf die Mega-Form um.
 */
export function oppCombatant(
  id: string,
  megaId?: string | null,
): Combatant | undefined {
  const mon = getPokemon(id);
  if (!mon) return undefined;
  return {
    id,
    types: activeTypes(mon, megaId),
    moveTypes: offensiveMoveTypes(mon.topMoves, mon.movepool),
  };
}
