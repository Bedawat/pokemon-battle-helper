/**
 * Team-Datenmodell (Phase 3). Teams werden in localStorage persistiert.
 * Namen sind fix "Team 1/2/3" (Handoff Abschnitt 9 — kein Freitext).
 */
import type { MovepoolMove } from "./pokemon";

/** Eine Attacke in einem Team-Set (Name + Typ). */
export type TeamMove = MovepoolMove;

/** Feste Team-Slots: maximal drei (Handoff S6). */
export type TeamId = 1 | 2 | 3;

/** Ein Pokémon-Slot im Team inkl. der gewählten (max. 4) Attacken. */
export interface TeamMember {
  pokemonId: string;
  moves: TeamMove[];
}

/** Ein Team mit bis zu sechs Mitgliedern. */
export interface Team {
  id: TeamId;
  name: string;
  members: TeamMember[];
}

/** Persistierter Gesamtzustand: vorhandene Teams + aktives Team. */
export interface TeamsState {
  teams: Team[];
  activeTeamId: TeamId | null;
}
