import { useState } from "react";
import { Button } from "../components/Button";
import { PokemonGrid } from "../components/PokemonGrid";
import { PokemonSprite } from "../components/PokemonSprite";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { ALL_POKEMON, autoMovesetFor, getPokemon } from "../lib/data";
import { filterPokemon } from "../lib/search";
import { MAX_MEMBERS, addMember, removeMember } from "../lib/team";
import type { Team } from "../types/team";
import styles from "./TeamEditor.module.css";

interface TeamEditorProps {
  team: Team;
  onChange: (team: Team) => void;
  onOpenMember: (pokemonId: string) => void;
  onDone: () => void;
  onBack: () => void;
}

/** S7 — Team zusammenstellen: 6 Slots, Grid mit Suche, Auto-Moveset bei Auswahl. */
export function TeamEditor({
  team,
  onChange,
  onOpenMember,
  onDone,
  onBack,
}: TeamEditorProps) {
  const [query, setQuery] = useState("");
  const memberIds = new Set(team.members.map((m) => m.pokemonId));
  // Bereits im Team befindliche Pokémon verschwinden aus dem Grid (statt
  // ausgegraut). Sie tauchen wieder auf, sobald sie aus dem Team entfernt werden.
  const filtered = filterPokemon(ALL_POKEMON, query).filter(
    (p) => !memberIds.has(p.id),
  );
  const full = team.members.length >= MAX_MEMBERS;

  const handleAdd = (id: string) => {
    onChange(addMember(team, id, autoMovesetFor(id)));
  };

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={team.name}
        onBack={onBack}
        trailing={`${team.members.length}/${MAX_MEMBERS}`}
      />

      <div className={styles.slots}>
        {Array.from({ length: MAX_MEMBERS }).map((_, i) => {
          const member = team.members[i];
          const mon = member ? getPokemon(member.pokemonId) : undefined;
          if (!member || !mon) {
            return (
              <div key={i} className={styles.slotEmpty}>
                <span>Leer</span>
              </div>
            );
          }
          return (
            <div key={i} className={styles.slot}>
              <button
                type="button"
                className={styles.slotMain}
                onClick={() => onOpenMember(member.pokemonId)}
                aria-label={`${mon.nameDe} – Attacken bearbeiten`}
              >
                <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={48} />
                <span className={styles.slotName}>{mon.nameDe}</span>
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(removeMember(team, member.pokemonId))}
                aria-label={`${mon.nameDe} entfernen`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <section className={styles.add}>
        <h3 className={styles.addTitle}>Pokémon hinzufügen</h3>
        <SearchBar value={query} onChange={setQuery} />
        {full ? (
          <p className={styles.fullHint}>
            Team ist voll. Entferne ein Pokémon, um zu tauschen.
          </p>
        ) : (
          <PokemonGrid
            pokemon={filtered}
            onSelect={handleAdd}
            emptyHint="Kein Pokémon gefunden."
          />
        )}
      </section>

      <div className={styles.cta}>
        <Button variant="primary" onClick={onDone}>
          Team speichern
        </Button>
      </div>
    </div>
  );
}
