import type { ReactNode } from "react";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  /** Titel des Screens (optional — z. B. Detail-Screens mit eigenem Hero). */
  title?: string;
  /** Zeigt einen Zurück-Button mit diesem Handler (eine Seite zurück). */
  onBack?: () => void;
  /** Optionales Element rechts neben dem Titel (z. B. Zähler „2/6"). */
  trailing?: ReactNode;
}

/**
 * Gemeinsamer Screen-Kopf: einheitlicher Zurück-Button (≥ 44px, Fitts' Law) plus
 * Titelzeile. Jeder Screen füttert seinen eigenen `onBack`-Zielzustand (Per-Screen-
 * Navigation, kein globaler History-Stack — bewusste Entscheidung, Handoff §12).
 */
export function ScreenHeader({ title, onBack, trailing }: ScreenHeaderProps) {
  return (
    <div className={styles.wrap}>
      {onBack && (
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          aria-label="Zurück"
        >
          <span className={styles.backIcon} aria-hidden="true">
            ‹
          </span>
          Zurück
        </button>
      )}
      {(title != null || trailing != null) && (
        <div className={styles.titleRow}>
          {title != null && <h2 className={styles.title}>{title}</h2>}
          {trailing != null && <div className={styles.trailing}>{trailing}</div>}
        </div>
      )}
    </div>
  );
}
