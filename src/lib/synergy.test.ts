import { describe, expect, it } from "vitest";
import type { PokemonType, TypeChart } from "../types/pokemon";
import {
  type Combatant,
  coveredOpponents,
  synergyAmpel,
  threats,
  togglePick,
} from "./synergy";

const chart = {
  fire: { grass: 2 },
  water: { fire: 2 },
  grass: { water: 2 },
  electric: { water: 2 },
} as unknown as TypeChart;

function c(id: string, types: PokemonType[], moveTypes: PokemonType[]): Combatant {
  return { id, types, moveTypes };
}

const opponents = [
  c("o-grass", ["grass"], ["grass"]),
  c("o-water", ["water"], ["water"]),
  c("o-fire", ["fire"], ["fire"]),
];

describe("coveredOpponents", () => {
  it("listet Gegner, die offensiv SE getroffen werden", () => {
    const fireMon = c("fire", ["fire"], ["fire"]); // trifft grass
    expect(coveredOpponents(fireMon, opponents, chart)).toEqual(["o-grass"]);
  });

  it("Mehrfach-Coverage über mehrere Move-Typen", () => {
    const mixed = c("mix", ["normal"], ["fire", "electric"]); // grass + water
    expect(coveredOpponents(mixed, opponents, chart)).toEqual(["o-grass", "o-water"]);
  });
});

describe("threats", () => {
  it("listet Gegner, die das eigene Pokémon SE bedrohen", () => {
    const grassMon = c("grass", ["water"], ["grass"]); // water-Typ wird von grass & electric bedroht
    expect(threats(grassMon, opponents, chart)).toEqual(["o-grass"]);
  });
});

describe("synergyAmpel", () => {
  it("grün: deckt ≥2 neue Gegner ab, kaum bedroht", () => {
    const mon = c("mix", ["normal"], ["fire", "electric"]); // grass + water, normal-Typ ungefährdet
    expect(synergyAmpel(mon, opponents, [], chart)).toBe("good");
  });

  it("gelb: deckt nur 1 neuen Gegner ab", () => {
    const mon = c("fire", ["bug" as PokemonType], ["fire"]); // nur grass
    expect(synergyAmpel(mon, opponents, [], chart)).toBe("neutral");
  });

  it("rot: deckt keinen neuen Gegner ab (schon abgedeckt)", () => {
    const mon = c("fire", ["normal"], ["fire"]); // grass
    const picked = [c("other", ["normal"], ["fire"])]; // deckt grass bereits
    expect(synergyAmpel(mon, opponents, picked, chart)).toBe("bad");
  });

  it("rot: stark bedroht trotz Coverage", () => {
    // deckt grass+water ab, ist aber water-Typ → von grass UND electric... hier nur grass im Set
    const oppMany = [
      c("a", ["grass"], ["grass"]),
      c("b", ["grass"], ["grass"]),
      c("d", ["grass"], ["grass"]),
    ];
    const mon = c("mix", ["water"], ["fire"]); // water-Typ, von 3× grass bedroht; trifft 0 grass? fire->grass SE
    // fire trifft alle 3 grass → newCovered 3, aber threats 3 → rot
    expect(synergyAmpel(mon, oppMany, [], chart)).toBe("bad");
  });
});

describe("togglePick", () => {
  it("fügt hinzu, solange unter dem Limit", () => {
    expect(togglePick(["a"], "b", 4)).toEqual(["a", "b"]);
  });

  it("entfernt eine bereits gewählte id", () => {
    expect(togglePick(["a", "b"], "a", 4)).toEqual(["b"]);
  });

  it("No-op beim Hinzufügen über dem Limit", () => {
    expect(togglePick(["a", "b"], "c", 2)).toEqual(["a", "b"]);
  });

  it("Entfernen funktioniert auch bei vollem Limit", () => {
    expect(togglePick(["a", "b"], "b", 2)).toEqual(["a"]);
  });
});
