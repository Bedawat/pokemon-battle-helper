/**
 * Datenmodell für Pokémon, Typen, Attacken und Usage.
 * Wird aus data/pokemon.json, data/usage.json, data/type-chart.json geladen.
 * Erzeugt vom Script scripts/build-data.mjs.
 */

/** Die 18 Pokémon-Typen (englische Bezeichner, wie in den Daten). */
export type PokemonType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/**
 * Schadensklasse einer Attacke (PokéAPI `damage_class`). Status-Moves zählen
 * nicht zur offensiven Coverage, auch wenn sie einen offensiven Typ haben
 * (z. B. Irrlicht/Feuer). Optional, weil ältere Datensätze sie nicht enthalten —
 * fehlt sie, wird die Attacke als offensiv behandelt (Safe Default).
 */
export type MoveCategory = "physical" | "special" | "status";

/** Eine Attacke mit Typ und (bei Usage-Daten) Verbreitung. */
export interface Move {
  name: string;
  type: PokemonType;
  /** Anteil der Sets dieses Pokémon, die diese Attacke nutzen (Pikalytics). */
  usagePercent: number;
  /** Schadensklasse (PokéAPI). Fehlt in Altdaten → gilt als offensiv. */
  category?: MoveCategory;
}

/** Eine Attacke im Movepool (Name + Typ, ohne Usage). */
export interface MovepoolMove {
  name: string;
  type: PokemonType;
  /** Schadensklasse (PokéAPI). Fehlt in Altdaten → gilt als offensiv. */
  category?: MoveCategory;
}

/**
 * Eine Mega-Form einer Spezies. Mega ändert im Scope dieser App **nur die
 * Typen** (und damit das Matchup) sowie das Artwork — keine Werte/Fähigkeiten.
 * Usage und Movesets bleiben auf Spezies-Ebene (werden vor dem Kampf, also vor
 * der Mega-Entwicklung gewählt). Mehrdeutige Megas (z. B. Glurak X/Y) stehen als
 * mehrere Einträge in `Pokemon.megas`.
 */
export interface MegaForm {
  /** Stabiler Slug der Mega-Form, z. B. "charizard-mega-x". */
  id: string;
  /** Kurzlabel für die UI, z. B. "Mega X" oder "Mega". */
  label: string;
  /** Typen der Mega-Form (überschreiben im Live-Kampf die Grund-Typen). */
  types: PokemonType[];
  /** Mega-Artwork (PokéAPI bzw. Pikalytics-CDN bei Champions-Megas). */
  sprite: string;
}

/** Statische Pokémon-Daten (data/pokemon.json). */
export interface Pokemon {
  /** Stabiler Slug, Join-Key zwischen pokemon.json und usage.json. */
  id: string;
  /** Englischer Name (VGC-Community, z. B. "Charizard-Mega-Y"). */
  nameEn: string;
  /** Deutscher Anzeigename (UI). Fällt auf nameEn zurück, falls unbekannt. */
  nameDe: string;
  /**
   * Primär- und optionaler Sekundärtyp der **Grund-Form**. In der Pick-Phase
   * (S2/S3) rechnet das Matchup mit diesen Typen; Mega-Typen lösen sich erst im
   * Live-Kampf auf (siehe `megas`).
   */
  types: PokemonType[];
  /** Sprite-URL (PokéAPI Official Artwork oder Pikalytics-CDN). */
  sprite: string;
  /** Voller Movepool (PokéAPI), alphabetisch. Für den Move-Picker in S8. */
  movepool: MovepoolMove[];
  /**
   * Mega-Formen dieser Spezies. Leer/fehlend = nicht mega-fähig. Bei
   * mehrdeutigen Megas mehrere Einträge (z. B. Glurak: Mega X und Mega Y).
   */
  megas?: MegaForm[];
}

/** Usage-Eintrag pro Pokémon (data/usage.json). */
export interface UsageEntry {
  /** Join-Key zu Pokemon.id. */
  id: string;
  nameEn: string;
  /**
   * Globale Usage im Meta (Pikalytics). Für das Champions-Turnierformat (regmb)
   * liefert Pikalytics keine Usage mehr → i. d. R. null; stattdessen winrate/rank.
   */
  usagePercent: number | null;
  /** Winrate % (Pikalytics, regmb). null, wenn nicht im Meta-Ranking. */
  winrate?: number | null;
  /** Monthly Rank im Meta (1 = am stärksten vertreten). null außerhalb des Rankings. */
  rank?: number | null;
  /** Top-Attacken nach Verbreitung, absteigend (i. d. R. 4). */
  topMoves: Move[];
}

/**
 * Typ-Effektivitäts-Matrix.
 * typeChart[attacker][defender] = Multiplikator (0, 0.5, 1, 2).
 * Fehlende Einträge gelten als 1 (neutral).
 */
export type TypeChart = Record<PokemonType, Partial<Record<PokemonType, number>>>;

/** Wrapper-Form von data/pokemon.json. */
export interface PokemonData {
  meta: { generated: string; format: string; count: number };
  pokemon: Pokemon[];
}

/** Wrapper-Form von data/usage.json. */
export interface UsageData {
  meta: { source: string; format: string; date: string };
  usage: UsageEntry[];
}
