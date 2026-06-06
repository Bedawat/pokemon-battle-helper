import styles from "./SearchBar.module.css";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Suchleiste mit Lupe und Leeren-Button. Filtert DE + EN (siehe lib/search). */
export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className={styles.bar}>
      <svg
        className={styles.icon}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="m20 20-3.5-3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        className={styles.input}
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? "Pokémon suchen …"}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pokémon suchen"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange("")}
          aria-label="Suche leeren"
        >
          ×
        </button>
      )}
    </div>
  );
}
