import styles from "./MegaMarker.module.css";

interface MegaMarkerProps {
  /** Tooltip/Label, z. B. "Kann mega-entwickeln" oder "→ Mega X/Y". */
  label?: string;
}

/**
 * Statischer „⚡"-Marker für mega-fähige Pokémon (Pick-Phase, S2/S3). Wird
 * absolut positioniert — der Eltern-Container muss `position: relative` sein.
 * Im Live-Kampf (S5) gibt es stattdessen einen interaktiven Mega-Chip.
 */
export function MegaMarker({ label = "Kann mega-entwickeln" }: MegaMarkerProps) {
  return (
    <span className={styles.mark} title={label} aria-label={label}>
      ⚡
    </span>
  );
}
