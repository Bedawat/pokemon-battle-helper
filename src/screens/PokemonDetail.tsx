import { useState } from "react";
import { MoveRow } from "../components/MoveRow";
import { PokemonSprite } from "../components/PokemonSprite";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { TypeBadge } from "../components/TypeBadge";
import { getPokemon } from "../lib/data";
import { normalize } from "../lib/search";
import { MAX_MOVES, removeMember, setMoveAt } from "../lib/team";
import type { MovepoolMove } from "../types/pokemon";
import type { Team } from "../types/team";
import styles from "./PokemonDetail.module.css";

interface PokemonDetailProps {
  team: Team;
  pokemonId: string;
  onChange: (team: Team) => void;
  onBack: () => void;
}

/** S8 — Attacken eines Team-Pokémon ansehen/bearbeiten, Pokémon entfernen. */
export function PokemonDetail({
  team,
  pokemonId,
  onChange,
  onBack,
}: PokemonDetailProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const member = team.members.find((m) => m.pokemonId === pokemonId);
  const mon = getPokemon(pokemonId);

  if (!member || !mon) {
    return (
      <div className={styles.screen}>
        <ScreenHeader onBack={onBack} />
        <p className={styles.missing}>Pokémon nicht im Team.</p>
      </div>
    );
  }

  const movepool: MovepoolMove[] = mon.movepool ?? [];
  const openPicker = (index: number) => {
    setQuery("");
    setEditingIndex(index);
  };
  const pickMove = (move: MovepoolMove) => {
    if (editingIndex !== null) {
      onChange(setMoveAt(team, pokemonId, editingIndex, move));
    }
    setEditingIndex(null);
  };

  const filteredPool =
    normalize(query) === ""
      ? movepool
      : movepool.filter((m) => normalize(m.name).includes(normalize(query)));

  // Slots: vorhandene Moves + eine "Hinzufügen"-Zeile, falls < 4.
  const slotCount = Math.min(member.moves.length + 1, MAX_MOVES);

  return (
    <div className={styles.screen}>
      <ScreenHeader onBack={onBack} />

      <header className={styles.head}>
        <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={96} />
        <h2 className={styles.name}>{mon.nameDe}</h2>
        <div className={styles.types}>
          {mon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </header>

      <section className={styles.movesSection}>
        <h3 className={styles.sectionTitle}>Attacken</h3>
        <div className={styles.moves}>
          {Array.from({ length: slotCount }).map((_, i) => {
            const move = member.moves[i];
            if (move) {
              return (
                <MoveRow
                  key={i}
                  name={move.name}
                  type={move.type}
                  onClick={() => openPicker(i)}
                  trailing={<span className={styles.chevron}>›</span>}
                />
              );
            }
            return (
              <button
                key={i}
                type="button"
                className={styles.addMove}
                onClick={() => openPicker(i)}
              >
                + Attacke hinzufügen
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        className={styles.removeBtn}
        onClick={() => {
          onChange(removeMember(team, pokemonId));
          onBack();
        }}
      >
        Aus Team entfernen
      </button>

      {editingIndex !== null && (
        <div className={styles.picker} role="dialog" aria-label="Attacke wählen">
          <div className={styles.pickerHead}>
            <span className={styles.pickerTitle}>Attacke wählen</span>
            <button
              type="button"
              className={styles.pickerClose}
              onClick={() => setEditingIndex(null)}
            >
              Schließen
            </button>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Attacke suchen …"
          />
          {movepool.length === 0 ? (
            <p className={styles.poolEmpty}>
              Kein Movepool verfügbar. Führe „npm run data“ aus, um ihn zu laden.
            </p>
          ) : (
            <ul className={styles.pickerList}>
              {filteredPool.map((m) => (
                <li key={m.name}>
                  <MoveRow name={m.name} type={m.type} onClick={() => pickMove(m)} />
                </li>
              ))}
              {filteredPool.length === 0 && (
                <li className={styles.poolEmpty}>Keine Attacke gefunden.</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
