import { describe, expect, it } from "vitest";
import { FIELD_SIZE, initFromLeads, initLive, swapToField } from "./battle";

const six = ["a", "b", "c", "d", "e", "f"];

describe("initFromLeads", () => {
  it("setzt die gewählten Leads aufs Feld, den Rest in Originalreihenfolge auf die Bank", () => {
    expect(initFromLeads(six, ["c", "e"])).toEqual({
      field: ["c", "e"],
      bank: ["a", "b", "d", "f"],
    });
  });

  it("behält die Auswahlreihenfolge der Leads bei", () => {
    expect(initFromLeads(six, ["e", "c"]).field).toEqual(["e", "c"]);
  });

  it("ignoriert unbekannte Lead-ids (Safe Default)", () => {
    expect(initFromLeads(six, ["c", "z"])).toEqual({
      field: ["c"],
      bank: ["a", "b", "d", "e", "f"],
    });
  });

  it("nimmt höchstens FIELD_SIZE Leads", () => {
    expect(initFromLeads(six, ["a", "b", "c"]).field).toHaveLength(FIELD_SIZE);
  });

  it("kommt mit leerer Lead-Auswahl klar", () => {
    expect(initFromLeads(six, [])).toEqual({ field: [], bank: six });
  });

  it("entdoppelt Lead-ids (Robustheit)", () => {
    expect(initFromLeads(six, ["c", "c"])).toEqual({
      field: ["c"],
      bank: ["a", "b", "d", "e", "f"],
    });
  });
});

describe("initLive", () => {
  it("setzt die ersten 2 aufs Feld, den Rest auf die Bank", () => {
    expect(initLive(six)).toEqual({
      field: ["a", "b"],
      bank: ["c", "d", "e", "f"],
    });
    expect(FIELD_SIZE).toBe(2);
  });

  it("kommt mit weniger als 2 Gegnern klar", () => {
    expect(initLive(["a"])).toEqual({ field: ["a"], bank: [] });
  });
});

describe("swapToField", () => {
  const state = initLive(six);

  it("tauscht ein Bank-Pokémon auf einen Feld-Slot, verdrängtes geht auf die Bank", () => {
    const next = swapToField(state, 0, "d");
    expect(next.field).toEqual(["d", "b"]);
    expect(next.bank).toEqual(["c", "a", "e", "f"]); // d's Platz nimmt das verdrängte a
  });

  it("tauscht auf den zweiten Feld-Slot", () => {
    const next = swapToField(state, 1, "e");
    expect(next.field).toEqual(["a", "e"]);
    expect(next.bank).toEqual(["c", "d", "b", "f"]);
  });

  it("No-op bei unbekannter Bank-id", () => {
    expect(swapToField(state, 0, "z")).toBe(state);
  });

  it("No-op bei ungültigem Feld-Slot", () => {
    expect(swapToField(state, 5, "c")).toBe(state);
  });

  it("mutiert den Ausgangszustand nicht", () => {
    swapToField(state, 0, "d");
    expect(state.field).toEqual(["a", "b"]);
    expect(state.bank).toEqual(["c", "d", "e", "f"]);
  });
});
