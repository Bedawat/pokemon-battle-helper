import { describe, expect, it } from "vitest";
import type { PokemonView } from "./dataset";
import {
  MAX_OPPONENTS,
  addOpponent,
  gridSource,
  isOpponentFull,
  removeOpponent,
} from "./opponent";

/** Minimaler PokemonView nur mit den für die Tests relevanten Feldern. */
function view(id: string, nameDe: string, nameEn: string): PokemonView {
  return {
    id,
    nameEn,
    nameDe,
    types: ["normal"],
    sprite: "",
    movepool: [],
    usagePercent: null,
    topMoves: [],
  };
}

describe("addOpponent", () => {
  it("fügt in den nächsten freien Slot an und behält die Reihenfolge", () => {
    expect(addOpponent(["a"], "b")).toEqual(["a", "b"]);
  });

  it("ignoriert Duplikate (Species Clause)", () => {
    expect(addOpponent(["a", "b"], "a")).toEqual(["a", "b"]);
  });

  it("ist ein No-op, wenn alle 6 Slots gefüllt sind", () => {
    const full = ["a", "b", "c", "d", "e", "f"];
    expect(addOpponent(full, "g")).toBe(full);
  });

  it("mutiert die Eingabe nicht", () => {
    const ids = ["a"];
    addOpponent(ids, "b");
    expect(ids).toEqual(["a"]);
  });
});

describe("removeOpponent", () => {
  it("entfernt das angetippte Pokémon", () => {
    expect(removeOpponent(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("lässt die Liste unverändert, wenn die id fehlt", () => {
    expect(removeOpponent(["a"], "z")).toEqual(["a"]);
  });
});

describe("isOpponentFull", () => {
  it("false unter 6", () => {
    expect(isOpponentFull(["a", "b", "c", "d", "e"])).toBe(false);
  });

  it("true bei genau 6", () => {
    expect(isOpponentFull(["a", "b", "c", "d", "e", "f"])).toBe(true);
    expect(MAX_OPPONENTS).toBe(6);
  });
});

describe("gridSource", () => {
  const all = [
    view("a", "Glurak", "Charizard"),
    view("b", "Knakrack", "Garchomp"),
    view("c", "Pikachu", "Pikachu"),
  ];

  it("leere Suche → Top-N (Liste ist schon nach Usage sortiert)", () => {
    expect(gridSource(all, "", 2).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("nur-Whitespace zählt als leer", () => {
    expect(gridSource(all, "   ", 3)).toHaveLength(3);
  });

  it("Suche filtert nach DE-Namen", () => {
    expect(gridSource(all, "knak").map((p) => p.id)).toEqual(["b"]);
  });

  it("Suche filtert nach EN-Namen", () => {
    expect(gridSource(all, "garchomp").map((p) => p.id)).toEqual(["b"]);
  });
});
