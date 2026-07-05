/**
 * JSON-Binding für den Datensatz. Lädt die generierten Dateien aus data/ und
 * stellt fertige Views, den Index, die Typ-Matrix und das Demo-Team bereit.
 * Die reinen Transforms liegen in dataset.ts (dort getestet).
 */
import pokemonJson from "../../data/pokemon.json";
import typeChartJson from "../../data/type-chart.json";
import usageJson from "../../data/usage.json";
import type {
  MovepoolMove,
  PokemonData,
  TypeChart,
  UsageData,
} from "../types/pokemon";
import type { Team, TeamsState } from "../types/team";
import {
  autoMoveset,
  indexById,
  mergeUsage,
  sortByUsage,
  type PokemonView,
} from "./dataset";
import { addMember, emptyTeam } from "./team";

const pokemonData = pokemonJson as unknown as PokemonData;
const usageData = usageJson as unknown as UsageData;

/** 18×18 Typ-Effektivität (für Phase 5). */
export const TYPE_CHART = typeChartJson as unknown as TypeChart;

/** Alle Pokémon, nach Usage absteigend sortiert (Grid-Quelle). */
export const ALL_POKEMON: PokemonView[] = sortByUsage(
  mergeUsage(pokemonData.pokemon, usageData.usage),
);

/** Schneller Zugriff per id. */
export const POKEMON_BY_ID: Map<string, PokemonView> = indexById(ALL_POKEMON);

export function getPokemon(id: string): PokemonView | undefined {
  return POKEMON_BY_ID.get(id);
}

/**
 * Entfernt Team-Mitglieder, deren pokemonId im aktuellen Datensatz nicht (mehr)
 * existiert — z. B. nach einem id-Wechsel durch einen Daten-Rebuild
 * ("basculegion" → "basculegion-male"). Solche Waisen würden sonst als nicht
 * löschbarer „Leer"-Slot hängen bleiben. Non-destruktiv für gültige Mitglieder.
 */
export function sanitizeTeams(state: TeamsState): TeamsState {
  return {
    ...state,
    teams: state.teams.map((t) => ({
      ...t,
      members: t.members.filter((m) => POKEMON_BY_ID.has(m.pokemonId)),
    })),
  };
}

/** Auto-Moveset (Top-4 von Pikalytics) für ein Pokémon. */
export function autoMovesetFor(id: string): MovepoolMove[] {
  const view = POKEMON_BY_ID.get(id);
  return view ? autoMoveset(view) : [];
}

/**
 * Demo-Team für den ersten App-Start (Handoff Abschnitt 9): ein gängiges
 * Champions-Team aus den Top-Usage-Pokémon.
 */
export const DEMO_TEAM_IDS = [
  "basculegion-male",
  "kingambit",
  "garchomp",
  "charizard", // Spezies-id (Phase 9): Grund-Form, mega-fähig zu Mega X/Y im Live-Kampf
  "incineroar",
  "whimsicott",
];

/** Baut das Demo-Team inkl. Auto-Movesets (überspringt fehlende ids robust). */
export function createDemoTeam(): Team {
  let team = emptyTeam(1);
  for (const id of DEMO_TEAM_IDS) {
    if (POKEMON_BY_ID.has(id)) team = addMember(team, id, autoMovesetFor(id));
  }
  return team;
}
