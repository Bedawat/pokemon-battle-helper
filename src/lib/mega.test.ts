import { describe, expect, it } from "vitest";
import {
  type MegaState,
  NO_MEGA,
  activeMegaId,
  canMega,
  commitMega,
  revertMega,
} from "./mega";

describe("mega — One-per-Side-Zustand", () => {
  it("erlaubt anfangs jede Seite mega-zuentwickeln", () => {
    expect(canMega(NO_MEGA, "own", "charizard")).toBe(true);
    expect(canMega(NO_MEGA, "opp", "gengar")).toBe(true);
  });

  it("schreibt eine Mega-Form fest und liefert ihre id zurück", () => {
    const s = commitMega(NO_MEGA, "own", "charizard", "charizard-mega-x");
    expect(activeMegaId(s, "own", "charizard")).toBe("charizard-mega-x");
    expect(activeMegaId(s, "own", "gengar")).toBeNull();
  });

  it("sperrt nach dem Commit andere Pokémon derselben Seite (One-per-Side)", () => {
    const s = commitMega(NO_MEGA, "own", "charizard", "charizard-mega-y");
    expect(canMega(s, "own", "charizard")).toBe(true); // sich selbst weiter ok
    expect(canMega(s, "own", "scizor")).toBe(false); // anderes eigenes nein
  });

  it("hält die Seiten unabhängig", () => {
    const s = commitMega(NO_MEGA, "own", "charizard", "charizard-mega-x");
    expect(canMega(s, "opp", "gengar")).toBe(true);
    const s2 = commitMega(s, "opp", "gengar", "gengar-mega");
    expect(activeMegaId(s2, "own", "charizard")).toBe("charizard-mega-x");
    expect(activeMegaId(s2, "opp", "gengar")).toBe("gengar-mega");
  });

  it("ist No-op, wenn die Seite schon ein anderes Mon mega-entwickelt hat", () => {
    const s = commitMega(NO_MEGA, "own", "charizard", "charizard-mega-x");
    const s2 = commitMega(s, "own", "scizor", "scizor-mega");
    expect(s2).toBe(s); // unverändert
    expect(activeMegaId(s2, "own", "scizor")).toBeNull();
  });

  it("nimmt eine Mega-Entwicklung zurück und gibt die Seite wieder frei", () => {
    const s = commitMega(NO_MEGA, "opp", "gengar", "gengar-mega");
    const s2 = revertMega(s, "opp", "gengar");
    expect(activeMegaId(s2, "opp", "gengar")).toBeNull();
    expect(canMega(s2, "opp", "blastoise")).toBe(true);
  });

  it("revert ist No-op für ein nicht mega-entwickeltes Pokémon", () => {
    const s = commitMega(NO_MEGA, "own", "charizard", "charizard-mega-x");
    const s2 = revertMega(s, "own", "scizor");
    expect(s2).toBe(s);
  });

  it("bleibt immutabel (mutiert den Eingangs-State nicht)", () => {
    const s: MegaState = { ...NO_MEGA };
    commitMega(s, "own", "charizard", "charizard-mega-x");
    expect(s.own).toBeNull();
  });
});
