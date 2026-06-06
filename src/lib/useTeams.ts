/**
 * React-Hook für den Team-Zustand: lädt aus localStorage, seedet beim ersten
 * Start ein Demo-Team und persistiert jede Änderung automatisch.
 */
import { useEffect, useState } from "react";
import type { TeamsState } from "../types/team";
import { createDemoTeam } from "./data";
import { loadState, saveState, seedDemoIfEmpty } from "./team";

export function useTeams() {
  const [state, setState] = useState<TeamsState>(() =>
    seedDemoIfEmpty(loadState(window.localStorage), createDemoTeam()),
  );

  useEffect(() => {
    saveState(window.localStorage, state);
  }, [state]);

  return [state, setState] as const;
}
