import { Button } from "../components/Button";
import { PokemonSprite } from "../components/PokemonSprite";
import { TypeBadge } from "../components/TypeBadge";
import { getPokemon } from "../lib/data";
import { MAX_LEADS } from "../lib/synergy";
import styles from "./LeadSelect.module.css";

interface LeadSelectProps {
  picked: string[];
  leads: string[];
  onToggleLead: (pokemonId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * S4 — Lead-Auswahl: zeigt die 4 gewählten Pokémon, der Nutzer bestimmt 2 davon
 * als Leads. „Kampf starten" wird erst bei 2 Leads aktiv.
 */
export function LeadSelect({
  picked,
  leads,
  onToggleLead,
  onConfirm,
  onBack,
}: LeadSelectProps) {
  const leadSet = new Set(leads);
  const ready = leads.length === MAX_LEADS;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ Zurück
      </button>

      <header className={styles.head}>
        <h2 className={styles.title}>Leads wählen</h2>
        <span className={styles.count}>
          {leads.length}/{MAX_LEADS}
        </span>
      </header>

      <p className={styles.hint}>
        Welche zwei Pokémon schickst du zuerst aufs Feld?
      </p>

      <ul className={styles.grid}>
        {picked.map((id) => {
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
                <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={64} />
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
