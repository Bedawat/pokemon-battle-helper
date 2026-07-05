import { useState } from "react";
import { Button } from "../components/Button";
import { MetaToggle } from "../components/MetaToggle";
import { PokemonGrid } from "../components/PokemonGrid";
import { PokemonSprite } from "../components/PokemonSprite";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { ALL_POKEMON, autoMovesetFor, getPokemon } from "../lib/data";
import { applyMetaFilter, filterPokemon } from "../lib/search";
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
  const [metaOnly, setMetaOnly] = useState(true);
  const memberIds = new Set(team.members.map((m) => m.pokemonId));
  // Bereits im Team befindliche Pokémon verschwinden aus dem Grid (statt
  // ausgegraut). Sie tauchen wieder auf, sobald sie aus dem Team entfernt werden.
  const filtered = filterPokemon(
    applyMetaFilter(ALL_POKEMON, metaOnly, query),
    query,
  ).filter((p) => !memberIds.has(p.id));
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
          if (!member) {
            return (
              <div key={i} className={styles.slotEmpty}>
                <span>Leer</span>
              </div>
            );
          }
          if (!mon) {
            // Verwaistes Mitglied (unbekannte id nach Daten-Rebuild): immer entfernbar.
            return (
              <div key={i} className={styles.slot}>
                <div className={styles.slotMain}>
                  <span className={styles.slotName}>Unbekannt</span>
                </div>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => onChange(removeMember(team, member.pokemonId))}
                  aria-label="Unbekanntes Pokémon entfernen"
                >
                  ×
                </button>
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
          <>
            {!query.trim() && (
              <MetaToggle
                metaOnly={metaOnly}
                onChange={setMetaOnly}
                hint={metaOnly ? `Top ${filtered.length} im Meta` : `Alle ${filtered.length}`}
              />
            )}
            <PokemonGrid
              pokemon={filtered}
              onSelect={handleAdd}
              emptyHint="Kein Pokémon gefunden."
            />
          </>
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
