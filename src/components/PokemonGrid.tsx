import type { PokemonView } from "../lib/dataset";
import { MegaMarker } from "./MegaMarker";
import { PokemonSprite } from "./PokemonSprite";
import { TypeBadge } from "./TypeBadge";
import styles from "./PokemonGrid.module.css";

interface PokemonGridProps {
  pokemon: PokemonView[];
  onSelect: (id: string) => void;
  /** Bereits gewählte/gesperrte Pokémon (ausgegraut, nicht klickbar). */
  disabledIds?: ReadonlySet<string>;
  /** Hinweis, wenn die Liste leer ist (z. B. Suche ohne Treffer). */
  emptyHint?: string;
}

/**
 * Grid aller Pokémon (Sprite + DE-Name + Typen). Wird vom Team-Editor (S7)
 * genutzt und in Phase 4 von der Gegner-Eingabe (S2) wiederverwendet.
 */
export function PokemonGrid({
  pokemon,
  onSelect,
  disabledIds,
  emptyHint,
}: PokemonGridProps) {
  if (pokemon.length === 0) {
    return <p className={styles.empty}>{emptyHint ?? "Keine Treffer."}</p>;
  }
  return (
    <ul className={styles.grid}>
      {pokemon.map((p) => {
        const disabled = disabledIds?.has(p.id) ?? false;
        return (
          <li key={p.id}>
            <button
              type="button"
              className={styles.cell}
              disabled={disabled}
              data-disabled={disabled}
              onClick={() => onSelect(p.id)}
            >
              <span className={styles.spriteWrap}>
                <PokemonSprite src={p.sprite} alt={p.nameDe} size={56} />
                {p.megas && p.megas.length > 0 && <MegaMarker />}
              </span>
              <span className={styles.name}>{p.nameDe}</span>
              <span className={styles.types}>
                {p.types.map((t) => (
                  <TypeBadge key={t} type={t} size="sm" />
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
