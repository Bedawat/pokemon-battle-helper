import styles from "./Placeholder.module.css";

interface PlaceholderProps {
  title: string;
  /** Kurzer Hinweis, in welcher Phase dieser Screen gebaut wird. */
  note: string;
}

/**
 * Übergangs-Screen für noch nicht implementierte Screens (S2–S8).
 * Wird Phase für Phase durch die echten Screens ersetzt.
 */
export function Placeholder({ title, note }: PlaceholderProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
