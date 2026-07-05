import styles from "./MetaToggle.module.css";

interface MetaToggleProps {
  /** true = nur Meta-Mons (gerankt), false = alle verfügbaren Pokémon. */
  metaOnly: boolean;
  onChange: (metaOnly: boolean) => void;
  /** Optionaler Zähler „X von Y", z. B. wie viele Mons aktuell gezeigt werden. */
  hint?: string;
}

/**
 * Segmented Control „Nur Meta | Alle". Steuert, ob das Pokémon-Grid nur die
 * im aktuellen Pikalytics-Ranking gelisteten Mons oder den vollen Champions-Dex
 * zeigt. Bei aktiver Suche greift der Filter nicht (es wird immer alles gesucht).
 */
export function MetaToggle({ metaOnly, onChange, hint }: MetaToggleProps) {
  return (
    <div className={styles.row}>
      <div className={styles.toggle} role="group" aria-label="Grid-Umfang">
        <button
          type="button"
          className={styles.segment}
          data-active={metaOnly}
          aria-pressed={metaOnly}
          onClick={() => onChange(true)}
        >
          Nur Meta
        </button>
        <button
          type="button"
          className={styles.segment}
          data-active={!metaOnly}
          aria-pressed={!metaOnly}
          onClick={() => onChange(false)}
        >
          Alle
        </button>
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
