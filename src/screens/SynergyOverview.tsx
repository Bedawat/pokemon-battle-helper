import { Button } from "../components/Button";
import { PokemonSprite } from "../components/PokemonSprite";
import { TypeBadge } from "../components/TypeBadge";
import { ownCombatant, oppCombatant } from "../lib/combatant";
import { getPokemon } from "../lib/data";
import {
  MAX_PICKS,
  coveredOpponents,
  synergyAmpel,
  threats,
} from "../lib/synergy";
import type { Team } from "../types/team";
import styles from "./SynergyOverview.module.css";

interface SynergyOverviewProps {
  team: Team;
  opponentIds: string[];
  picked: string[];
  onTogglePick: (pokemonId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * S3 — Synergie-Übersicht (Pick-Phase): die eigenen Pokémon mit dynamischer
 * Ampel gegen das Gegner-Team. Die Bewertung der noch nicht gewählten Pokémon
 * berücksichtigt, welche Gegner bereits von Picks abgedeckt sind.
 */
export function SynergyOverview({
  team,
  opponentIds,
  picked,
  onTogglePick,
  onConfirm,
  onBack,
}: SynergyOverviewProps) {
  const opponents = opponentIds
    .map(oppCombatant)
    .filter((c): c is NonNullable<typeof c> => c != null);

  const pickedSet = new Set(picked);
  const ready = picked.length === MAX_PICKS;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ Zurück
      </button>

      <header className={styles.head}>
        <h2 className={styles.title}>Synergie</h2>
        <span className={styles.count}>
          {picked.length}/{MAX_PICKS}
        </span>
      </header>

      <section className={styles.opponents} aria-label="Gegner-Team">
        <span className={styles.opponentsLabel}>Gegner</span>
        <div className={styles.opponentRow}>
          {opponents.map((opp) => {
            const mon = getPokemon(opp.id);
            return (
              <PokemonSprite
                key={opp.id}
                src={mon?.sprite ?? ""}
                alt={mon?.nameDe ?? opp.id}
                size={36}
              />
            );
          })}
        </div>
      </section>

      <p className={styles.hint}>
        Wähle {MAX_PICKS} Pokémon für den Kampf. Grün deckt neue Gegner ab, rot
        ist gefährdet oder redundant.
      </p>

      <ul className={styles.list}>
        {team.members.map((member) => {
          const mon = getPokemon(member.pokemonId);
          const own = ownCombatant(member);
          if (!mon || !own) return null;

          const selected = pickedSet.has(member.pokemonId);
          const others = team.members
            .filter(
              (m) => pickedSet.has(m.pokemonId) && m.pokemonId !== member.pokemonId,
            )
            .map(ownCombatant)
            .filter((c): c is NonNullable<typeof c> => c != null);

          const ampel = synergyAmpel(own, opponents, others);
          const hits = coveredOpponents(own, opponents).length;
          const threatenedBy = threats(own, opponents).length;
          const lockedOut = !selected && ready;

          return (
            <li key={member.pokemonId}>
              <button
                type="button"
                className={styles.card}
                data-ampel={ampel}
                data-selected={selected}
                disabled={lockedOut}
                onClick={() => onTogglePick(member.pokemonId)}
                aria-pressed={selected}
              >
                <span className={styles.dot} data-ampel={ampel} aria-hidden="true" />
                <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={48} />
                <span className={styles.info}>
                  <span className={styles.name}>{mon.nameDe}</span>
                  <span className={styles.types}>
                    {mon.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                  <span className={styles.stats}>
                    trifft {hits} · bedroht von {threatenedBy}
                  </span>
                </span>
                {selected && (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.cta}>
        <Button variant="primary" onClick={onConfirm} disabled={!ready}>
          Picks bestätigen
        </Button>
      </div>
    </div>
  );
}
