/**
 * Matchup-Engine (Phase 5) — Typ-Effektivität auf Ebene 2 (Typen + Move-Coverage).
 * Reine Funktionen, offline testbar (matchup.test.ts). Die Typ-Matrix wird per
 * Default aus data.ts gezogen, lässt sich für Tests aber überschreiben.
 */
import type { PokemonType, TypeChart } from "../types/pokemon";
import { TYPE_CHART } from "./data";

/** Ampel-Bewertung eines Matchups. */
export type Ampel = "good" | "neutral" | "bad";

/** Ab diesem Multiplikator gilt ein Treffer als „supereffektiv". */
export const SUPER_EFFECTIVE = 2;

/**
 * Multiplikator einer Angriffsart gegen ein (1- oder 2-Typ-)Verteidiger-Typing.
 * Fehlende Matrix-Einträge gelten als neutral (×1).
 */
export function effectiveness(
  attack: PokemonType,
  defenderTypes: PokemonType[],
  chart: TypeChart = TYPE_CHART,
): number {
  const row = chart[attack] ?? {};
  return defenderTypes.reduce((mult, def) => mult * (row[def] ?? 1), 1);
}

/**
 * Trifft mindestens eine der Angriffsarten den Verteidiger supereffektiv (≥×2)?
 * Modelliert den Offensiv- bzw. Defensiv-Check aus dem Bauplan (Abschnitt 6).
 */
export function canHitSuperEffective(
  attackTypes: PokemonType[],
  defenderTypes: PokemonType[],
  chart: TypeChart = TYPE_CHART,
): boolean {
  return attackTypes.some(
    (a) => effectiveness(a, defenderTypes, chart) >= SUPER_EFFECTIVE,
  );
}

/**
 * Ampel für ein Paar (eigenes vs. gegnerisches Pokémon), basierend auf den
 * tatsächlich eingestellten Move-Typen beider Seiten.
 *
 * | offensiv | defensiv | Ampel   |
 * |----------|----------|---------|
 * | ja       | nein     | grün    |
 * | nein     | ja       | rot     |
 * | sonst    |          | gelb    |
 */
export function pairAmpel(
  ownMoveTypes: PokemonType[],
  ownTypes: PokemonType[],
  oppMoveTypes: PokemonType[],
  oppTypes: PokemonType[],
  chart: TypeChart = TYPE_CHART,
): Ampel {
  const offensive = canHitSuperEffective(ownMoveTypes, oppTypes, chart);
  const defensive = canHitSuperEffective(oppMoveTypes, ownTypes, chart);
  if (offensive && !defensive) return "good";
  if (!offensive && defensive) return "bad";
  return "neutral";
}
