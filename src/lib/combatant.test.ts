import { describe, expect, it } from "vitest";
import type { MegaForm, PokemonType } from "../types/pokemon";
import { resolveActiveTypes } from "./combatant";

const base: PokemonType[] = ["fire", "flying"];
const megas: MegaForm[] = [
  { id: "charizard-mega-x", label: "Mega X", types: ["fire", "dragon"], sprite: "x.png" },
  { id: "charizard-mega-y", label: "Mega Y", types: ["fire", "flying"], sprite: "y.png" },
];

describe("resolveActiveTypes — Grund- vs. Mega-Typen", () => {
  it("liefert ohne megaId die Grund-Typen", () => {
    expect(resolveActiveTypes(base, megas)).toEqual(["fire", "flying"]);
    expect(resolveActiveTypes(base, megas, null)).toEqual(["fire", "flying"]);
  });

  it("schaltet auf die Typen der gewählten Mega-Form um", () => {
    expect(resolveActiveTypes(base, megas, "charizard-mega-x")).toEqual([
      "fire",
      "dragon",
    ]);
    expect(resolveActiveTypes(base, megas, "charizard-mega-y")).toEqual([
      "fire",
      "flying",
    ]);
  });

  it("fällt bei unbekanntem megaId auf die Grund-Typen zurück (Safe Default)", () => {
    expect(resolveActiveTypes(base, megas, "does-not-exist")).toEqual([
      "fire",
      "flying",
    ]);
  });

  it("gibt die Grund-Typen zurück, wenn die Spezies keine Megas hat", () => {
    expect(resolveActiveTypes(["water"], undefined, "whatever")).toEqual(["water"]);
    expect(resolveActiveTypes(["water"], [], "whatever")).toEqual(["water"]);
  });
});
