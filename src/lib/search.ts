/**
 * Suche über Pokémon-Namen — findet sowohl deutsche als auch englische Namen
 * (Handoff Abschnitt 9). Reine Funktionen, offline testbar (search.test.ts).
 */
import type { Pokemon } from "../types/pokemon";

/** Für die Suche relevanter Teil eines Pokémon. */
type Named = Pick<Pokemon, "nameDe" | "nameEn">;

/**
 * Normalisiert einen String für den Vergleich:
 * lowercase, Diakritika entfernt, Bindestriche/Punkte/Unterstriche → Leerzeichen,
 * Mehrfach-Whitespace kollabiert, getrimmt. Idempotent.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True, wenn die (normalisierte) Query als Teilstring im DE- oder EN-Namen vorkommt. */
export function matchesQuery(pokemon: Named, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return (
    normalize(pokemon.nameDe).includes(q) ||
    normalize(pokemon.nameEn).includes(q)
  );
}

/** Filtert eine Liste nach der Query. Leere Query → Liste unverändert. */
export function filterPokemon<T extends Named>(list: T[], query: string): T[] {
  if (!normalize(query)) return list;
  return list.filter((p) => matchesQuery(p, query));
}
