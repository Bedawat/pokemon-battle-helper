import type { PokemonType } from "../types/pokemon";
import { LIGHT_TYPES, TYPE_LABEL_DE } from "../lib/typeLabels";
import styles from "./TypeBadge.module.css";

interface TypeBadgeProps {
  type: PokemonType;
  size?: "sm" | "md";
}

/** Farbige Typ-Pill mit deutschem Label. Farbe aus den Design Tokens. */
export function TypeBadge({ type, size = "md" }: TypeBadgeProps) {
  return (
    <span
      className={styles.badge}
      data-size={size}
      style={{
        background: `var(--type-${type})`,
        color: LIGHT_TYPES.has(type) ? "var(--bg-primary)" : "#ffffff",
      }}
    >
      {TYPE_LABEL_DE[type]}
    </span>
  );
}
