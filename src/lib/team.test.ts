import { beforeEach, describe, expect, it } from "vitest";
import type { Team, TeamsState } from "../types/team";
import {
  MAX_MEMBERS,
  MAX_MOVES,
  MAX_TEAMS,
  addMember,
  createTeam,
  deleteTeam,
  emptyTeam,
  loadState,
  nextTeamId,
  removeMember,
  saveState,
  seedDemoIfEmpty,
  setActiveTeam,
  setMoveAt,
  updateTeam,
} from "./team";

/** Fake-Storage für die localStorage-Tests. */
function fakeStore() {
  const data: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    _data: data,
  };
}

const dragon = { name: "Dragon Claw", type: "dragon" as const };
const move = (n: string) => ({ name: n, type: "normal" as const });

describe("emptyTeam", () => {
  it("erzeugt ein leeres Team mit fixem Namen", () => {
    expect(emptyTeam(2)).toEqual({ id: 2, name: "Team 2", members: [] });
  });
});

describe("member-Operationen (immutable)", () => {
  it("addMember fügt mit (gekappten) Moves hinzu", () => {
    const t = addMember(emptyTeam(1), "garchomp", [
      dragon,
      move("a"),
      move("b"),
      move("c"),
      move("d"),
    ]);
    expect(t.members).toHaveLength(1);
    expect(t.members[0].pokemonId).toBe("garchomp");
    expect(t.members[0].moves).toHaveLength(MAX_MOVES);
  });

  it("addMember ignoriert Duplikate", () => {
    let t = addMember(emptyTeam(1), "garchomp", []);
    t = addMember(t, "garchomp", []);
    expect(t.members).toHaveLength(1);
  });

  it("addMember blockt bei vollem Team", () => {
    let t = emptyTeam(1);
    for (let i = 0; i < MAX_MEMBERS + 2; i++) t = addMember(t, `mon${i}`, []);
    expect(t.members).toHaveLength(MAX_MEMBERS);
  });

  it("removeMember entfernt das richtige Pokémon", () => {
    let t = addMember(addMember(emptyTeam(1), "a", []), "b", []);
    t = removeMember(t, "a");
    expect(t.members.map((m) => m.pokemonId)).toEqual(["b"]);
  });

  it("setMoveAt ersetzt einen Move-Slot", () => {
    let t = addMember(emptyTeam(1), "garchomp", [move("x"), move("y")]);
    t = setMoveAt(t, "garchomp", 1, dragon);
    expect(t.members[0].moves[1]).toEqual(dragon);
  });

  it("setMoveAt hängt an, wenn index == Länge und < MAX", () => {
    let t = addMember(emptyTeam(1), "garchomp", [move("x")]);
    t = setMoveAt(t, "garchomp", 1, dragon);
    expect(t.members[0].moves).toHaveLength(2);
  });

  it("ursprüngliches Team bleibt unverändert (immutable)", () => {
    const t0 = emptyTeam(1);
    addMember(t0, "garchomp", []);
    expect(t0.members).toHaveLength(0);
  });
});

describe("Team-Verwaltung", () => {
  it("nextTeamId liefert die niedrigste freie ID", () => {
    expect(nextTeamId({ teams: [], activeTeamId: null })).toBe(1);
    expect(
      nextTeamId({ teams: [emptyTeam(1), emptyTeam(3)], activeTeamId: null }),
    ).toBe(2);
  });

  it("nextTeamId gibt null bei drei Teams", () => {
    const full: TeamsState = {
      teams: [emptyTeam(1), emptyTeam(2), emptyTeam(3)],
      activeTeamId: null,
    };
    expect(nextTeamId(full)).toBeNull();
    expect(MAX_TEAMS).toBe(3);
  });

  it("createTeam legt ein neues Team an und gibt es zurück", () => {
    const { state, team } = createTeam({ teams: [], activeTeamId: null });
    expect(team?.id).toBe(1);
    expect(state.teams).toHaveLength(1);
  });

  it("updateTeam ersetzt nach ID", () => {
    const base: TeamsState = { teams: [emptyTeam(1)], activeTeamId: 1 };
    const edited: Team = addMember(emptyTeam(1), "garchomp", []);
    const next = updateTeam(base, edited);
    expect(next.teams[0].members).toHaveLength(1);
  });

  it("deleteTeam entfernt und löscht ggf. activeTeamId", () => {
    const base: TeamsState = {
      teams: [emptyTeam(1), emptyTeam(2)],
      activeTeamId: 1,
    };
    const next = deleteTeam(base, 1);
    expect(next.teams.map((t) => t.id)).toEqual([2]);
    expect(next.activeTeamId).toBeNull();
  });

  it("setActiveTeam markiert das aktive Team", () => {
    const base: TeamsState = {
      teams: [emptyTeam(1), emptyTeam(2)],
      activeTeamId: null,
    };
    expect(setActiveTeam(base, 2).activeTeamId).toBe(2);
  });
});

describe("Persistenz", () => {
  let store: ReturnType<typeof fakeStore>;
  beforeEach(() => {
    store = fakeStore();
  });

  it("loadState gibt leeren Zustand zurück, wenn nichts gespeichert ist", () => {
    expect(loadState(store)).toEqual({ teams: [], activeTeamId: null });
  });

  it("save → load round-trip", () => {
    const state: TeamsState = {
      teams: [addMember(emptyTeam(1), "garchomp", [dragon])],
      activeTeamId: 1,
    };
    saveState(store, state);
    expect(loadState(store)).toEqual(state);
  });

  it("loadState ist robust gegen kaputtes JSON", () => {
    store.setItem("pbh.teams.v1", "{nope");
    expect(loadState(store)).toEqual({ teams: [], activeTeamId: null });
  });
});

describe("Demo-Team", () => {
  it("seedDemoIfEmpty befüllt nur, wenn keine Teams existieren", () => {
    const demo = addMember(emptyTeam(1), "basculegion", [dragon]);
    const seeded = seedDemoIfEmpty({ teams: [], activeTeamId: null }, demo);
    expect(seeded.teams).toHaveLength(1);
    expect(seeded.activeTeamId).toBe(1);

    const existing: TeamsState = { teams: [emptyTeam(1)], activeTeamId: 1 };
    expect(seedDemoIfEmpty(existing, demo)).toBe(existing);
  });
});
