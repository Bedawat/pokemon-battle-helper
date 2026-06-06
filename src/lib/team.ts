/**
 * Team-Logik (Phase 3) — reine, immutable Funktionen + localStorage-Persistenz.
 * Offline testbar (team.test.ts). Kennt keine Pokémon-Daten; das Auto-Moveset
 * wird vom Aufrufer (Datenlayer) als Move-Liste übergeben.
 */
import type { Team, TeamId, TeamMove, TeamsState } from "../types/team";

export const MAX_MEMBERS = 6;
export const MAX_MOVES = 4;
export const MAX_TEAMS = 3;

// v2 (Phase 9): Mega-fähige Pokémon haben jetzt Spezies-ids (z. B. "charizard"
// statt "charizard-mega-y"). Der Bump verwirft alte Teams mit veralteten ids
// sauber, statt verwaiste Mitglieder zu zeigen.
const STORAGE_KEY = "pbh.teams.v2";
const TEAM_IDS: TeamId[] = [1, 2, 3];

/** Minimales Storage-Interface (Web-localStorage erfüllt es; Tests faken es). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Leeres Team mit fixem Namen "Team N". */
export function emptyTeam(id: TeamId): Team {
  return { id, name: `Team ${id}`, members: [] };
}

// ---------- Member-Operationen (immutable) ----------

/** Fügt ein Pokémon hinzu (mit optionalem Auto-Moveset). No-op bei Duplikat/voll. */
export function addMember(
  team: Team,
  pokemonId: string,
  moves: TeamMove[] = [],
): Team {
  if (team.members.length >= MAX_MEMBERS) return team;
  if (team.members.some((m) => m.pokemonId === pokemonId)) return team;
  return {
    ...team,
    members: [...team.members, { pokemonId, moves: moves.slice(0, MAX_MOVES) }],
  };
}

/** Entfernt ein Pokémon aus dem Team. */
export function removeMember(team: Team, pokemonId: string): Team {
  return {
    ...team,
    members: team.members.filter((m) => m.pokemonId !== pokemonId),
  };
}

/**
 * Setzt den Move an Position `index` (0..MAX_MOVES-1). index == Länge hängt an,
 * solange < MAX_MOVES. Außerhalb dieses Bereichs: unverändert.
 */
export function setMoveAt(
  team: Team,
  pokemonId: string,
  index: number,
  move: TeamMove,
): Team {
  return mapMember(team, pokemonId, (m) => {
    if (index < 0 || index > m.moves.length || index >= MAX_MOVES) return m;
    const moves = [...m.moves];
    moves[index] = move;
    return { ...m, moves: moves.slice(0, MAX_MOVES) };
  });
}

function mapMember(
  team: Team,
  pokemonId: string,
  fn: (m: Team["members"][number]) => Team["members"][number],
): Team {
  return {
    ...team,
    members: team.members.map((m) => (m.pokemonId === pokemonId ? fn(m) : m)),
  };
}

// ---------- Team-Verwaltung ----------

/** Niedrigste freie Team-ID (1..3) oder null, wenn alle vergeben sind. */
export function nextTeamId(state: TeamsState): TeamId | null {
  const used = new Set(state.teams.map((t) => t.id));
  return TEAM_IDS.find((id) => !used.has(id)) ?? null;
}

/** Legt ein neues leeres Team an (falls noch Platz). */
export function createTeam(state: TeamsState): {
  state: TeamsState;
  team: Team | null;
} {
  const id = nextTeamId(state);
  if (id === null) return { state, team: null };
  const team = emptyTeam(id);
  return { state: { ...state, teams: [...state.teams, team] }, team };
}

/** Ersetzt ein Team anhand seiner ID. */
export function updateTeam(state: TeamsState, team: Team): TeamsState {
  return {
    ...state,
    teams: state.teams.map((t) => (t.id === team.id ? team : t)),
  };
}

/** Löscht ein Team; war es aktiv, wird activeTeamId zurückgesetzt. */
export function deleteTeam(state: TeamsState, id: TeamId): TeamsState {
  return {
    teams: state.teams.filter((t) => t.id !== id),
    activeTeamId: state.activeTeamId === id ? null : state.activeTeamId,
  };
}

/** Markiert ein Team als aktiv. */
export function setActiveTeam(state: TeamsState, id: TeamId): TeamsState {
  return { ...state, activeTeamId: id };
}

// ---------- Persistenz ----------

const EMPTY_STATE: TeamsState = { teams: [], activeTeamId: null };

/** Lädt den Zustand aus dem Storage; robust gegen Fehlen/kaputtes JSON. */
export function loadState(store: KeyValueStore): TeamsState {
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) return clone(EMPTY_STATE);
  try {
    const parsed = JSON.parse(raw) as TeamsState;
    if (!parsed || !Array.isArray(parsed.teams)) return clone(EMPTY_STATE);
    return parsed;
  } catch {
    return clone(EMPTY_STATE);
  }
}

/** Schreibt den Zustand in den Storage. */
export function saveState(store: KeyValueStore, state: TeamsState): void {
  store.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Demo-Team ----------

/**
 * Befüllt den Zustand mit einem vorgegebenen Demo-Team — aber nur, wenn noch
 * gar keine Teams existieren (erster App-Start, Handoff Abschnitt 9).
 */
export function seedDemoIfEmpty(state: TeamsState, demoTeam: Team): TeamsState {
  if (state.teams.length > 0) return state;
  return { teams: [demoTeam], activeTeamId: demoTeam.id };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
