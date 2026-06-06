import { Button } from "../components/Button";
import styles from "./MainMenu.module.css";

interface MainMenuProps {
  onStartBattle: () => void;
  onManageTeam: () => void;
}

/**
 * S1 — Hauptmenü / Begrüßungsscreen.
 * Prominenter CTA "Kampf starten", sekundär "Team verwalten".
 */
export function MainMenu({ onStartBattle, onManageTeam }: MainMenuProps) {
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
        <Button variant="primary" onClick={onStartBattle}>
          Kampf starten
        </Button>
        <Button variant="secondary" onClick={onManageTeam}>
          Team verwalten
        </Button>
      </div>
    </div>
  );
}
