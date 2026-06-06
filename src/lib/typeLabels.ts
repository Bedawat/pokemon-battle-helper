/** Deutsche Anzeigenamen der 18 Typen (UI ist Deutsch). */
import type { PokemonType } from "../types/pokemon";

export const TYPE_LABEL_DE: Record<PokemonType, string> = {
  normal: "Normal",
  fire: "Feuer",
  water: "Wasser",
  electric: "Elektro",
  grass: "Pflanze",
  ice: "Eis",
  fighting: "Kampf",
  poison: "Gift",
  ground: "Boden",
  flying: "Flug",
  psychic: "Psycho",
  bug: "Käfer",
  rock: "Gestein",
  ghost: "Geist",
  dragon: "Drache",
  dark: "Unlicht",
  steel: "Stahl",
  fairy: "Fee",
};

/** Helle Typ-Farben → dunkler Text für Kontrast (WCAG, Handoff Phase 7). */
export const LIGHT_TYPES: ReadonlySet<PokemonType> = new Set<PokemonType>([
  "electric",
  "ice",
  "ground",
  "steel",
]);
