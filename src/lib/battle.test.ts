import { describe, expect, it } from "vitest";
import { FIELD_SIZE, initLive, swapToField } from "./battle";

const six = ["a", "b", "c", "d", "e", "f"];

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
