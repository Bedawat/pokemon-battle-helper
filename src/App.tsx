import { useState } from "react";
import { NavBar } from "./components/NavBar";
import { MainMenu } from "./screens/MainMenu";
import { LeadSelect } from "./screens/LeadSelect";
import { LiveBattle } from "./screens/LiveBattle";
import { OpponentInput } from "./screens/OpponentInput";
import { Placeholder } from "./screens/Placeholder";
import { PokemonDetail } from "./screens/PokemonDetail";
import { SynergyOverview } from "./screens/SynergyOverview";
import { TeamEditor } from "./screens/TeamEditor";
import { TeamList } from "./screens/TeamList";
import { useTeams } from "./lib/useTeams";
import type { OpponentTeam } from "./lib/opponent";
import { MAX_LEADS, MAX_PICKS, togglePick } from "./lib/synergy";
import {
  createTeam,
  deleteTeam,
  setActiveTeam,
  updateTeam,
} from "./lib/team";
import {
  SCREEN_TO_TAB,
  SCREENS_LOCKING_TEAM_TAB,
  type NavTab,
  type Screen,
} from "./types/navigation";
import type { Team, TeamId } from "./types/team";

export default function App() {
  const [screen, setScreen] = useState<Screen>("main-menu");
  const [editingTeamId, setEditingTeamId] = useState<TeamId | null>(null);
  const [detailPokemonId, setDetailPokemonId] = useState<string | null>(null);
  const [opponentIds, setOpponentIds] = useState<OpponentTeam>([]);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [leadIds, setLeadIds] = useState<string[]>([]);
  const [teamsState, setTeamsState] = useTeams();

  const activeTab = SCREEN_TO_TAB[screen];
  const teamTabLocked = SCREENS_LOCKING_TEAM_TAB.has(screen);
  const editingTeam: Team | undefined = teamsState.teams.find(
    (t) => t.id === editingTeamId,
  );
  const activeTeam: Team | undefined = teamsState.teams.find(
    (t) => t.id === teamsState.activeTeamId,
  );

  const handleTabChange = (tab: NavTab) => {
    if (tab === "kampf") {
      setScreen("main-menu");
    } else {
      setEditingTeamId(null);
      setScreen("team-list");
    }
  };

  // ---------- Team-Aktionen ----------
  const openTeam = (id: TeamId) => {
    setEditingTeamId(id);
    setScreen("team-editor");
  };

  const handleCreateTeam = () => {
    const { state, team } = createTeam(teamsState);
    if (!team) return;
    setTeamsState(state);
    setEditingTeamId(team.id);
    setScreen("team-editor");
  };

  const handleDeleteTeam = (id: TeamId) => {
    const team = teamsState.teams.find((t) => t.id === id);
    const label = team?.name ?? "Team";
    if (!window.confirm(`${label} wirklich löschen?`)) return;
    setTeamsState(deleteTeam(teamsState, id));
  };

  const handleChangeTeam = (team: Team) => {
    setTeamsState(updateTeam(teamsState, team));
  };

  const openMember = (pokemonId: string) => {
    setDetailPokemonId(pokemonId);
    setScreen("pokemon-detail");
  };

  const renderTeamList = () => (
    <TeamList
      teams={teamsState.teams}
      activeTeamId={teamsState.activeTeamId}
      onOpen={openTeam}
      onCreate={handleCreateTeam}
      onSetActive={(id) => setTeamsState(setActiveTeam(teamsState, id))}
      onDelete={handleDeleteTeam}
    />
  );

  const renderTeamEditor = () => {
    if (!editingTeam) return renderTeamList();
    return (
      <TeamEditor
        team={editingTeam}
        onChange={handleChangeTeam}
        onOpenMember={openMember}
        onDone={() => setScreen("team-list")}
      />
    );
  };

  const renderScreen = () => {
    switch (screen) {
      case "main-menu":
        return (
          <MainMenu
            onStartBattle={() => {
              setOpponentIds([]);
              setScreen("opponent-input");
            }}
            onManageTeam={() => {
              setEditingTeamId(null);
              setScreen("team-list");
            }}
          />
        );
      case "opponent-input":
        return (
          <OpponentInput
            opponent={opponentIds}
            onChange={setOpponentIds}
            onAnalyze={() => {
              setPickedIds([]);
              setLeadIds([]);
              setScreen("synergy");
            }}
          />
        );
      case "synergy":
        if (!activeTeam || activeTeam.members.length === 0) {
          return (
            <Placeholder
              title="Synergie-Übersicht"
              note="Kein aktives Team. Lege im Team-Tab ein Team an und markiere es als aktiv."
            />
          );
        }
        if (activeTeam.members.length < MAX_PICKS) {
          return (
            <Placeholder
              title="Synergie-Übersicht"
              note={`Dein aktives Team „${activeTeam.name}" hat erst ${activeTeam.members.length} von ${MAX_PICKS} nötigen Pokémon. Ergänze es im Team-Tab, um die Pick-Phase zu starten.`}
            />
          );
        }
        return (
          <SynergyOverview
            team={activeTeam}
            opponentIds={opponentIds}
            picked={pickedIds}
            onTogglePick={(id) =>
              setPickedIds((prev) => togglePick(prev, id, MAX_PICKS))
            }
            onConfirm={() => {
              setLeadIds([]);
              setScreen("lead-select");
            }}
            onBack={() => setScreen("opponent-input")}
          />
        );
      case "lead-select":
        return (
          <LeadSelect
            picked={pickedIds}
            leads={leadIds}
            onToggleLead={(id) =>
              setLeadIds((prev) => togglePick(prev, id, MAX_LEADS))
            }
            onConfirm={() => setScreen("live-battle")}
            onBack={() => setScreen("synergy")}
          />
        );
      case "live-battle":
        if (!activeTeam) {
          return (
            <Placeholder
              title="Live-Kampf"
              note="Kein aktives Team. Lege im Team-Tab ein Team an und markiere es als aktiv."
            />
          );
        }
        return (
          <LiveBattle
            team={activeTeam}
            picked={pickedIds}
            leads={leadIds}
            opponentIds={opponentIds}
            onExit={() => setScreen("main-menu")}
          />
        );
      case "team-list":
        return renderTeamList();
      case "team-editor":
        return renderTeamEditor();
      case "pokemon-detail":
        if (!editingTeam || !detailPokemonId) return renderTeamEditor();
        return (
          <PokemonDetail
            team={editingTeam}
            pokemonId={detailPokemonId}
            onChange={handleChangeTeam}
            onBack={() => setScreen("team-editor")}
          />
        );
    }
  };

  return (
    <div className="app-frame">
      <main className="app-content">{renderScreen()}</main>
      <NavBar
        activeTab={activeTab}
        teamTabLocked={teamTabLocked}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
