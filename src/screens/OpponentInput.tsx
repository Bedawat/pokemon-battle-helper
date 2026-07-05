import { useState } from "react";
import { Button } from "../components/Button";
import { MetaToggle } from "../components/MetaToggle";
import { PokemonGrid } from "../components/PokemonGrid";
import { PokemonSprite } from "../components/PokemonSprite";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { ALL_POKEMON, getPokemon } from "../lib/data";
import {
  MAX_OPPONENTS,
  addOpponent,
  isOpponentFull,
  removeOpponent,
  type OpponentTeam,
} from "../lib/opponent";
import { applyMetaFilter, filterPokemon } from "../lib/search";
import styles from "./OpponentInput.module.css";

interface OpponentInputProps {
  opponent: OpponentTeam;
  onChange: (opponent: OpponentTeam) => void;
  onAnalyze: () => void;
  onBack: () => void;
}

/**
 * S2 — Gegner-Eingabe: 6 Slots, Top-20-Grid nach Usage, Suche (DE + EN).
 * Tap aufs Grid füllt den nächsten freien Slot, Tap auf einen Slot entfernt
 * (Korrektur). „Analyse starten" wird erst bei 6 gefüllten Slots aktiv.
 */
export function OpponentInput({
  opponent,
  onChange,
  onAnalyze,
  onBack,
}: OpponentInputProps) {
  const [query, setQuery] = useState("");
  const [metaOnly, setMetaOnly] = useState(true);
  const chosen = new Set(opponent);
  const grid = filterPokemon(applyMetaFilter(ALL_POKEMON, metaOnly, query), query);
  const full = isOpponentFull(opponent);

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title="Gegner-Team"
        onBack={onBack}
        trailing={`${opponent.length}/${MAX_OPPONENTS}`}
      />

      <div className={styles.slots}>
        {Array.from({ length: MAX_OPPONENTS }).map((_, i) => {
          const id = opponent[i];
          const mon = id ? getPokemon(id) : undefined;
          if (!id || !mon) {
            return (
              <div key={i} className={styles.slotEmpty}>
                <span>Leer</span>
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={styles.slot}
              onClick={() => onChange(removeOpponent(opponent, id))}
              aria-label={`${mon.nameDe} entfernen`}
            >
              <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={48} />
              <span className={styles.slotName}>{mon.nameDe}</span>
              <span className={styles.slotRemove} aria-hidden="true">
                ×
              </span>
            </button>
          );
        })}
      </div>

      <section className={styles.add}>
        <h3 className={styles.addTitle}>
          {query.trim() ? "Suchergebnisse" : "Häufigste Pokémon"}
        </h3>
        <SearchBar value={query} onChange={setQuery} />
        {full ? (
          <p className={styles.fullHint}>
            Gegner-Team komplett. Tippe auf einen Slot, um zu korrigieren.
          </p>
        ) : (
          <>
            {!query.trim() && (
              <MetaToggle
                metaOnly={metaOnly}
                onChange={setMetaOnly}
                hint={metaOnly ? `Top ${grid.length} im Meta` : `Alle ${grid.length}`}
              />
            )}
            <PokemonGrid
              pokemon={grid}
              onSelect={(id) => onChange(addOpponent(opponent, id))}
              disabledIds={chosen}
              emptyHint="Kein Pokémon gefunden."
            />
          </>
        )}
      </section>

      <div className={styles.cta}>
        <Button variant="primary" onClick={onAnalyze} disabled={!full}>
          Analyse starten
        </Button>
      </div>
    </div>
  );
}
