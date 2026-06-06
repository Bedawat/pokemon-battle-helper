import { describe, expect, it } from "vitest";
import type { Pokemon, UsageEntry } from "../types/pokemon";
import {
  autoMoveset,
  indexById,
  mergeUsage,
  offensiveMoveTypes,
  sortByUsage,
} from "./dataset";

const mon = (id: string): Pokemon => ({
  id,
  nameEn: id,
  nameDe: id,
  types: ["normal"],
  sprite: "",
  movepool: [],
});

const usageEntry = (id: string, pct: number): UsageEntry => ({
  id,
  nameEn: id,
  usagePercent: pct,
  topMoves: [
    { name: "Tackle", type: "normal", usagePercent: 90 },
    { name: "Protect", type: "normal", usagePercent: 80 },
  ],
});

describe("indexById", () => {
  it("baut eine Map nach id", () => {
    const map = indexById([mon("a"), mon("b")]);
    expect(map.get("b")?.id).toBe("b");
    expect(map.size).toBe(2);
  });
});

describe("mergeUsage", () => {
  it("hängt Usage + Top-Moves an die Pokémon", () => {
    const views = mergeUsage([mon("a")], [usageEntry("a", 42)]);
    expect(views[0].usagePercent).toBe(42);
    expect(views[0].topMoves).toHaveLength(2);
  });

  it("setzt usagePercent null und leere Moves, wenn kein Eintrag existiert", () => {
    const views = mergeUsage([mon("x")], []);
    expect(views[0].usagePercent).toBeNull();
    expect(views[0].topMoves).toEqual([]);
  });
});

describe("sortByUsage", () => {
  it("sortiert absteigend, null-Usage ans Ende", () => {
    const views = mergeUsage(
      [mon("a"), mon("b"), mon("c")],
      [usageEntry("a", 10), usageEntry("b", 50)],
    );
    expect(sortByUsage(views).map((v) => v.id)).toEqual(["b", "a", "c"]);
  });

  it("mutiert das Original nicht", () => {
    const views = mergeUsage([mon("a"), mon("b")], [usageEntry("b", 50)]);
    const before = views.map((v) => v.id).join();
    sortByUsage(views);
    expect(views.map((v) => v.id).join()).toBe(before);
  });
});

describe("autoMoveset", () => {
  it("nimmt die Top-4 als Name+Typ ohne usagePercent", () => {
    const [view] = mergeUsage([mon("a")], [usageEntry("a", 10)]);
    const set = autoMoveset(view);
    expect(set).toEqual([
      { name: "Tackle", type: "normal" },
      { name: "Protect", type: "normal" },
    ]);
  });

  it("trägt die Schadensklasse mit, wenn vorhanden", () => {
    const view = mergeUsage(
      [mon("a")],
      [
        {
          id: "a",
          nameEn: "a",
          usagePercent: 10,
          topMoves: [
            { name: "Flamethrower", type: "fire", usagePercent: 90, category: "special" },
            { name: "Will-O-Wisp", type: "fire", usagePercent: 80, category: "status" },
          ],
        },
      ],
    )[0];
    expect(autoMoveset(view)).toEqual([
      { name: "Flamethrower", type: "fire", category: "special" },
      { name: "Will-O-Wisp", type: "fire", category: "status" },
    ]);
  });
});

describe("offensiveMoveTypes", () => {
  it("überspringt Status-Moves trotz offensiven Typs", () => {
    expect(
      offensiveMoveTypes([
        { type: "fire", category: "special" },
        { type: "fire", category: "status" },
        { type: "ground", category: "physical" },
      ]),
    ).toEqual(["fire", "ground"]);
  });

  it("behandelt fehlende Kategorie als offensiv (Safe Default für Altdaten)", () => {
    expect(
      offensiveMoveTypes([{ type: "water" }, { type: "ice" }]),
    ).toEqual(["water", "ice"]);
  });

  it("gibt eine leere Liste zurück, wenn alle Moves Status sind", () => {
    expect(
      offensiveMoveTypes([
        { type: "normal", category: "status" },
        { type: "psychic", category: "status" },
      ]),
    ).toEqual([]);
  });

  it("schlägt fehlende Kategorie über den Katalog nach (Altdaten-Team)", () => {
    // Whimsicott-Fall: gespeichertes Team von vor dem Rebuild, Moves ohne category.
    const stored = [
      { name: "Tailwind", type: "flying" as const },
      { name: "Attract", type: "normal" as const },
      { name: "Encore", type: "normal" as const },
      { name: "Protect", type: "normal" as const },
    ];
    const catalog = [
      { name: "Tailwind", category: "status" as const },
      { name: "Attract", category: "status" as const },
      { name: "Encore", category: "status" as const },
      { name: "Protect", category: "status" as const },
      { name: "Moonblast", category: "special" as const },
    ];
    expect(offensiveMoveTypes(stored, catalog)).toEqual([]);
  });

  it("matcht Namen unabhängig von Schreibweise/Sonderzeichen", () => {
    expect(
      offensiveMoveTypes(
        [{ name: "Will-O-Wisp", type: "fire" }],
        [{ name: "will o wisp", category: "status" }],
      ),
    ).toEqual([]);
  });

  it("eigene Kategorie schlägt den Katalog (kein Override)", () => {
    expect(
      offensiveMoveTypes(
        [{ name: "Move", type: "water", category: "special" }],
        [{ name: "Move", category: "status" }],
      ),
    ).toEqual(["water"]);
  });
});
