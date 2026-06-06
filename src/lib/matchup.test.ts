import { describe, expect, it } from "vitest";
import type { PokemonType, TypeChart } from "../types/pokemon";
import { canHitSuperEffective, effectiveness, pairAmpel } from "./matchup";

/** Minimale Test-Matrix (nur die im Test genutzten Beziehungen). */
const chart = {
  fire: { grass: 2, steel: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5 },
  grass: { water: 2, fire: 0.5 },
} as unknown as TypeChart;

describe("effectiveness", () => {
  it("einzelner supereffektiver Treffer = ×2", () => {
    expect(effectiveness("fire", ["grass"], chart)).toBe(2);
  });

  it("doppelt supereffektiv bei zwei passenden Typen = ×4", () => {
    expect(effectiveness("fire", ["grass", "steel"], chart)).toBe(4);
  });

  it("resistenter Typ = ×0.5", () => {
    expect(effectiveness("fire", ["water"], chart)).toBe(0.5);
  });

  it("fehlender Matrix-Eintrag = neutral (×1)", () => {
    expect(effectiveness("fire", ["fairy" as PokemonType], chart)).toBe(1);
  });
});

describe("canHitSuperEffective", () => {
  it("true, wenn eine Angriffsart ≥×2 trifft", () => {
    expect(canHitSuperEffective(["normal" as PokemonType, "fire"], ["grass"], chart)).toBe(true);
  });

  it("false, wenn keine Angriffsart supereffektiv ist", () => {
    expect(canHitSuperEffective(["fire"], ["water"], chart)).toBe(false);
  });
});

describe("pairAmpel", () => {
  it("grün: ich treffe SE, Gegner nicht", () => {
    // own fire-Move vs grass-Gegner = SE; gegnerischer water-Move vs grass = resist
    expect(pairAmpel(["fire"], ["grass"], ["water"], ["grass"], chart)).toBe("good");
  });

  it("rot: Gegner trifft SE, ich nicht", () => {
    expect(pairAmpel(["water"], ["grass"], ["fire"], ["grass"], chart)).toBe("bad");
  });

  it("gelb: beide treffen SE", () => {
    expect(pairAmpel(["fire"], ["grass"], ["fire"], ["grass"], chart)).toBe("neutral");
  });

  it("gelb: keiner trifft SE", () => {
    expect(pairAmpel(["water"], ["water"], ["water"], ["water"], chart)).toBe("neutral");
  });
});
