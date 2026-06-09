import { Button } from "../components/Button";
import { PokemonSprite } from "../components/PokemonSprite";
import { getPokemon } from "../lib/data";
import { MAX_MEMBERS } from "../lib/team";
import type { Team } from "../types/team";
import styles from "./MainMenu.module.css";

interface MainMenuProps {
  /** Aktuell aktives Team (für die Vorschau-Karte). */
  activeTeam?: Team;
  onStartBattle: () => void;
  /** Öffnet das aktive Team im Editor. */
  onOpenActiveTeam: () => void;
  /** Öffnet die Team-Liste (Fallback, wenn kein aktives Team existiert). */
  onManageTeams: () => void;
}

/**
 * S1 — Hauptmenü / Begrüßungsscreen. Prominenter CTA „Kampf starten" plus eine
 * Karte mit dem aktiven Team (statt eines redundanten „Team verwalten"-Buttons —
 * Team-Verwaltung liegt im Team-Tab). Tap auf die Karte öffnet das aktive Team.
 */
export function MainMenu({
  activeTeam,
  onStartBattle,
  onOpenActiveTeam,
  onManageTeams,
}: MainMenuProps) {
  return (
    <div className={styles.menu}>
      <div className={styles.hero}>
        <div className={styles.logo} aria-hidden="true">
          {/* Platzhalter-Mark — wird später durch das finale App-Icon ersetzt */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="32" stroke="var(--accent-primary)" strokeWidth="4" />
            <path d="M4 36h24" stroke="var(--accent-primary)" strokeWidth="4" />
            <path d="M44 36h24" stroke="var(--accent-primary)" strokeWidth="4" />
            <circle cx="36" cy="36" r="9" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="4" />
          </svg>
        </div>
        <h1 className={styles.title}>Battle Helper</h1>
        <p className={styles.subtitle}>
          Dein Begleiter für die Pick-Phase und den Live-Kampf in Pokémon
          Champions.
        </p>
      </div>

      <div className={styles.actions}>
        {activeTeam ? (
          <button
            type="button"
            className={styles.activeTeam}
            onClick={onOpenActiveTeam}
            aria-label={`Aktives Team „${activeTeam.name}" bearbeiten`}
          >
            <span className={styles.activeTeamHead}>
              <span className={styles.activeTeamLabel}>Aktives Team</span>
              <span className={styles.activeTeamName}>{activeTeam.name}</span>
            </span>
            <span className={styles.activeTeamSlots}>
              {Array.from({ length: MAX_MEMBERS }).map((_, i) => {
                const member = activeTeam.members[i];
                const mon = member ? getPokemon(member.pokemonId) : undefined;
                return (
                  <span key={i} className={styles.slot}>
                    {mon ? (
                      <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={36} />
                    ) : (
                      <span className={styles.slotEmpty} aria-hidden="true" />
                    )}
                  </span>
                );
              })}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.noTeam}
            onClick={onManageTeams}
          >
            Noch kein aktives Team — Team anlegen
          </button>
        )}

        <Button variant="primary" onClick={onStartBattle}>
          Kampf starten
        </Button>
      </div>
    </div>
  );
}
