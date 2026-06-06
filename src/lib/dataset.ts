/**
 * Reine Daten-Transforms (ohne JSON-Import, damit offline testbar).
 * Das JSON-Binding lebt in data.ts und nutzt diese Funktionen.
 */
import type {
  Move,
  MoveCategory,
  MovepoolMove,
  Pokemon,
  PokemonType,
  UsageEntry,
} from "../types/pokemon";

/** Pokémon-Stammdaten angereichert mit Usage + Top-Moves (für Grid & Detail). */
export interface PokemonView extends Pokemon {
  usagePercent: number | null;
  topMoves: Move[];
}

/** Baut eine Map id → Eintrag. */
export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((it) => [it.id, it]));
}

/** Verknüpft Pokémon-Stammdaten mit ihren Usage-Einträgen. */
export function mergeUsage(
  pokemon: Pokemon[],
  usage: UsageEntry[],
): PokemonView[] {
  const byId = indexById(usage);
  return pokemon.map((p) => {
    const u = byId.get(p.id);
    return {
      ...p,
      usagePercent: u?.usagePercent ?? null,
      topMoves: u?.topMoves ?? [],
    };
  });
}

/** Sortiert (Kopie) absteigend nach Usage; null-Usage ans Ende. */
export function sortByUsage(views: PokemonView[]): PokemonView[] {
  return [...views].sort(
    (a, b) => (b.usagePercent ?? -1) - (a.usagePercent ?? -1),
  );
}

/** Top-4 eines Pokémon als Team-Moveset (Name+Typ+Kategorie, ohne Usage). */
export function autoMoveset(view: PokemonView): MovepoolMove[] {
  return view.topMoves
    .slice(0, 4)
    .map(({ name, type, category }) => ({ name, type, category }));
}

/** Normalisiert einen Move-Namen für den Abgleich (Klein, ohne Sonderzeichen). */
export function normalizeMoveName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Typen der *offensiven* Attacken (physisch/speziell). Status-Moves werden
 * übersprungen, auch mit offensivem Typ (z. B. Irrlicht/Feuer), damit die
 * Matchup-Coverage nicht verfälscht wird.
 *
 * Die Kategorie kommt primär vom Move selbst; ist sie nicht gesetzt (z. B. ein
 * vor dem Daten-Rebuild gespeichertes Team), wird sie über den optionalen
 * `catalog` (Movepool/Top-Moves des Pokémon) per Namen nachgeschlagen. Bleibt
 * sie ganz unbekannt, gilt der Move als offensiv (Safe Default).
 * Rein und offline testbar; vom Combatant-Adapter genutzt.
 */
export function offensiveMoveTypes(
  moves: ReadonlyArray<{ name?: string; type: PokemonType; category?: MoveCategory }>,
  catalog?: ReadonlyArray<{ name: string; category?: MoveCategory }>,
): PokemonType[] {
  const byName = new Map<string, MoveCategory>();
  for (const m of catalog ?? []) {
    if (m.category) byName.set(normalizeMoveName(m.name), m.category);
  }
  return moves
    .filter((m) => {
      const category =
        m.category ?? (m.name ? byName.get(normalizeMoveName(m.name)) : undefined);
      return category !== "status";
    })
    .map((m) => m.type);
}
