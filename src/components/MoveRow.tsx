import type { ReactNode } from "react";
import type { PokemonType } from "../types/pokemon";
import { TypeBadge } from "./TypeBadge";
import styles from "./MoveRow.module.css";

interface MoveRowProps {
  name: string;
  type: PokemonType;
  /** Optionaler Usage-Anteil (Pikalytics), wird als Caption gezeigt. */
  usagePercent?: number;
  /** Macht die Zeile antippbar (z. B. Attacke wechseln in S8). */
  onClick?: () => void;
  /** Optionales Element rechts (z. B. Chevron). */
  trailing?: ReactNode;
}

/** Eine Attacken-Zeile: Name + Typ-Badge (+ optional Usage und Trailing). */
export function MoveRow({
  name,
  type,
  usagePercent,
  onClick,
  trailing,
}: MoveRowProps) {
  const interactive = Boolean(onClick);
  const content = (
    <>
      <span className={styles.main}>
        <span className={styles.name}>{name}</span>
        {usagePercent != null && (
          <span className={styles.usage}>{usagePercent.toFixed(1)} %</span>
        )}
      </span>
      <span className={styles.right}>
        <TypeBadge type={type} size="sm" />
        {trailing}
      </span>
    </>
  );

  if (interactive) {
    return (
      <button type="button" className={styles.row} data-interactive onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={styles.row}>{content}</div>;
}
