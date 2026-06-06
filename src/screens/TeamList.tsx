import { Button } from "../components/Button";
import { PokemonSprite } from "../components/PokemonSprite";
import { getPokemon } from "../lib/data";
import { MAX_MEMBERS, MAX_TEAMS } from "../lib/team";
import type { Team, TeamId } from "../types/team";
import styles from "./TeamList.module.css";

interface TeamListProps {
  teams: Team[];
  activeTeamId: TeamId | null;
  onOpen: (id: TeamId) => void;
  onCreate: () => void;
  onSetActive: (id: TeamId) => void;
  onDelete: (id: TeamId) => void;
}

/** S6 — Übersicht der bis zu drei Teams. Aktives Team markierbar. */
export function TeamList({
  teams,
  activeTeamId,
  onOpen,
  onCreate,
  onSetActive,
  onDelete,
}: TeamListProps) {
  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <h2 className={styles.title}>Teams</h2>
        <p className={styles.subtitle}>
          Das aktive Team wird im Kampf zur Analyse genutzt.
        </p>
      </header>

      {teams.length === 0 && (
        <p className={styles.emptyState}>
          Noch kein Team angelegt. Erstelle dein erstes Team, um in den Kampf zu
          starten.
        </p>
      )}

      <ul className={styles.list}>
        {teams.map((team) => {
          const isActive = team.id === activeTeamId;
          return (
            <li key={team.id}>
              <article className={styles.card} data-active={isActive}>
                <button
                  type="button"
                  className={styles.cardMain}
                  onClick={() => onOpen(team.id)}
                  aria-label={`${team.name} bearbeiten`}
                >
                  <div className={styles.cardHead}>
                    <span className={styles.teamName}>{team.name}</span>
                    {isActive && <span className={styles.activePill}>Aktiv</span>}
                  </div>
                  <div className={styles.slots}>
                    {Array.from({ length: MAX_MEMBERS }).map((_, i) => {
                      const member = team.members[i];
                      const mon = member ? getPokemon(member.pokemonId) : undefined;
                      return (
                        <div key={i} className={styles.slot}>
                          {mon ? (
                            <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={40} />
                          ) : (
                            <span className={styles.slotEmpty} aria-hidden="true" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </button>

                <div className={styles.actions}>
                  {!isActive && (
                    <button
                      type="button"
                      className={styles.action}
                      onClick={() => onSetActive(team.id)}
                    >
                      Aktiv setzen
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.action}
                    data-danger
                    onClick={() => onDelete(team.id)}
                  >
                    Löschen
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {teams.length < MAX_TEAMS && (
        <div className={styles.create}>
          <Button variant="secondary" onClick={onCreate}>
            Neues Team
          </Button>
        </div>
      )}
    </div>
  );
}
