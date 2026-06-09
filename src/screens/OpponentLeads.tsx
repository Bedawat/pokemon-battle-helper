import { Button } from "../components/Button";
import { MegaMarker } from "../components/MegaMarker";
import { PokemonSprite } from "../components/PokemonSprite";
import { ScreenHeader } from "../components/ScreenHeader";
import { TypeBadge } from "../components/TypeBadge";
import { FIELD_SIZE } from "../lib/battle";
import { getPokemon } from "../lib/data";
import styles from "./OpponentLeads.module.css";

interface OpponentLeadsProps {
  /** Die 6 eingegebenen Gegner (Reihenfolge der Eingabe). */
  opponentIds: string[];
  /** Aktuell als Feld-Leads markierte Gegner (max. FIELD_SIZE). */
  fieldLeads: string[];
  onToggleLead: (id: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * S4 (Phase 11 §14) — „Was führt der Gegner?": der Nutzer markiert 2 der bereits
 * eingegebenen 6 Gegner als die Pokémon, die der Gegner zuerst aufs Feld schickt.
 * Damit startet der Live-Kampf mit der korrekten Ausgangslage (statt „die ersten
 * 2 raten"). Ersetzt die alte eigene Lead-Auswahl, die mit dem Live-Kampf-Redesign
 * funktionslos wurde.
 */
export function OpponentLeads({
  opponentIds,
  fieldLeads,
  onToggleLead,
  onConfirm,
  onBack,
}: OpponentLeadsProps) {
  const leadSet = new Set(fieldLeads);
  const ready = fieldLeads.length === FIELD_SIZE;

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title="Was führt der Gegner?"
        onBack={onBack}
        trailing={`${fieldLeads.length}/${FIELD_SIZE}`}
      />

      <p className={styles.hint}>
        Welche zwei Pokémon schickt der Gegner zuerst aufs Feld? Den Rest tauschst
        du im Kampf ein.
      </p>

      <ul className={styles.grid}>
        {opponentIds.map((id) => {
          const mon = getPokemon(id);
          if (!mon) return null;
          const selected = leadSet.has(id);
          const lockedOut = !selected && ready;
          return (
            <li key={id}>
              <button
                type="button"
                className={styles.card}
                data-selected={selected}
                disabled={lockedOut}
                onClick={() => onToggleLead(id)}
                aria-pressed={selected}
              >
                <span className={styles.spriteWrap}>
                  <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={64} />
                  {mon.megas && mon.megas.length > 0 && <MegaMarker />}
                </span>
                <span className={styles.name}>{mon.nameDe}</span>
                <span className={styles.types}>
                  {mon.types.map((t) => (
                    <TypeBadge key={t} type={t} size="sm" />
                  ))}
                </span>
                {selected && (
                  <span className={styles.badge} aria-hidden="true">
                    Lead
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.cta}>
        <Button variant="primary" onClick={onConfirm} disabled={!ready}>
          Kampf starten
        </Button>
      </div>
    </div>
  );
}
