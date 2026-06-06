import { describe, expect, it } from "vitest";
import { filterPokemon, matchesQuery, normalize } from "./search";

const mons = [
  { nameDe: "Glurak", nameEn: "Charizard-Mega-Y" },
  { nameDe: "Pikachu", nameEn: "Pikachu" },
  { nameDe: "Knakrack", nameEn: "Garchomp" },
];

describe("normalize", () => {
  it("lowercased und getrimmt", () => {
    expect(normalize("  Pikachu  ")).toBe("pikachu");
  });

  it("ersetzt Bindestriche/Punkte durch Leerzeichen", () => {
    expect(normalize("Charizard-Mega-Y")).toBe("charizard mega y");
    expect(normalize("Kommo-o")).toBe("kommo o");
  });

  it("entfernt Diakritika", () => {
    expect(normalize("Flabébé")).toBe("flabebe");
  });

  it("ist idempotent", () => {
    expect(normalize(normalize("Charizard-Mega-Y"))).toBe("charizard mega y");
  });
});

describe("matchesQuery", () => {
  it("findet über den englischen Namen", () => {
    expect(matchesQuery(mons[0], "charizard")).toBe(true);
  });

  it("findet über den deutschen Namen", () => {
    expect(matchesQuery(mons[0], "glurak")).toBe(true);
  });

  it("ignoriert Groß/Klein und Bindestriche", () => {
    expect(matchesQuery(mons[0], "MEGA Y")).toBe(true);
  });

  it("leere Query matcht alles", () => {
    expect(matchesQuery(mons[1], "   ")).toBe(true);
  });

  it("kein Treffer bei Fremdname", () => {
    expect(matchesQuery(mons[1], "garchomp")).toBe(false);
  });
});

describe("filterPokemon", () => {
  it("leere Query gibt die Liste unverändert zurück", () => {
    expect(filterPokemon(mons, "")).toHaveLength(3);
  });

  it("filtert nach DE- und EN-Namen", () => {
    expect(filterPokemon(mons, "kna")).toEqual([mons[2]]);
    expect(filterPokemon(mons, "garchomp")).toEqual([mons[2]]);
  });
});
