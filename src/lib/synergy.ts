/**
 * Synergie-Logik (Phase 5, S3) — bewertet die eigenen Pokémon dynamisch gegen
 * das Gegner-Team, abhängig davon, was bereits gepickt wurde (Coverage-Lücken
 * statt Redundanz). Reine Funktionen, offline testbar (synergy.test.ts).
 */
import type { PokemonType, TypeChart } from "../types/pokemon";
import { TYPE_CHART } from "./data";
import { type Ampel, canHitSuperEffective } from "./matchup";

/** Ein Kämpfer (eigen oder gegnerisch) auf das für Matchups Nötige reduziert. */
export interface Combatant {
  id: string;
  types: PokemonType[];
  /** Typen der eingestellten bzw. wahrscheinlichsten Attacken. */
  moveTypes: PokemonType[];
}

/** Anzahl der Picks in der Pick-Phase (Bauplan S3). */
export const MAX_PICKS = 4;
/** Anzahl der Leads (Bauplan S4). */
export const MAX_LEADS = 2;

// Kalibrierbare Schwellen (im Usability-Test feinjustierbar, Bauplan Abschnitt 6).
/** Ab so vielen neu abgedeckten Gegnern (und wenig Bedrohung) → grün. */
export const GOOD_NEW_COVERAGE = 2;
/** Höchstens so viele Bedrohungen für „grün". */
export const GOOD_MAX_THREATS = 1;
/** Ab so vielen Bedrohungen → rot (unabhängig von der Coverage). */
export const BAD_THREATS = 3;

/** Gegner-ids, die dieses eigene Pokémon offensiv supereffektiv trifft. */
export function coveredOpponents(
  own: Combatant,
  opponents: Combatant[],
  chart: TypeChart = TYPE_CHART,
): string[] {
  return opponents
    .filter((opp) => canHitSuperEffective(own.moveTypes, opp.types, chart))
    .map((opp) => opp.id);
}

/** Gegner-ids, die dieses eigene Pokémon supereffektiv bedrohen. */
export function threats(
  own: Combatant,
  opponents: Combatant[],
  chart: TypeChart = TYPE_CHART,
): string[] {
  return opponents
    .filter((opp) => canHitSuperEffective(opp.moveTypes, own.types, chart))
    .map((opp) => opp.id);
}

/**
 * Synergie-Ampel für ein eigenes Pokémon. `alreadyPicked` sind die bereits
 * gewählten eigenen Pokémon (ohne dieses) — deren Coverage gilt als abgedeckt.
 * Grün, wenn es genug *neue* Gegner abdeckt und wenig bedroht ist; rot, wenn es
 * keine neuen abdeckt oder stark bedroht ist; sonst gelb.
 */
export function synergyAmpel(
  own: Combatant,
  opponents: Combatant[],
  alreadyPicked: Combatant[],
  chart: TypeChart = TYPE_CHART,
): Ampel {
  const alreadyCovered = new Set(
    alreadyPicked.flatMap((p) => coveredOpponents(p, opponents, chart)),
  );
  const newCovered = coveredOpponents(own, opponents, chart).filter(
    (id) => !alreadyCovered.has(id),
  ).length;
  const threatCount = threats(own, opponents, chart).length;

  if (newCovered === 0 || threatCount >= BAD_THREATS) return "bad";
  if (newCovered >= GOOD_NEW_COVERAGE && threatCount <= GOOD_MAX_THREATS) {
    return "good";
  }
  return "neutral";
}

/**
 * Auswahl-Toggle mit Obergrenze: fügt `id` hinzu (falls < `max` und nicht
 * vorhanden) oder entfernt sie. Genutzt für Picks (max 4) und Leads (max 2).
 */
export function togglePick(
  selected: string[],
  id: string,
  max: number,
): string[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  if (selected.length >= max) return selected;
  return [...selected, id];
}
