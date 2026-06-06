import { useState } from "react";
import { MoveRow } from "../components/MoveRow";
import { PokemonSprite } from "../components/PokemonSprite";
import { TypeBadge } from "../components/TypeBadge";
import { initLive, swapToField } from "../lib/battle";
import { oppCombatant, ownCombatant } from "../lib/combatant";
import { getPokemon } from "../lib/data";
import { pairAmpel } from "../lib/matchup";
import type { Combatant } from "../lib/synergy";
import type { Team } from "../types/team";
import styles from "./LiveBattle.module.css";

interface LiveBattleProps {
  team: Team;
  picked: string[];
  leads: string[];
  opponentIds: string[];
  onExit: () => void;
}

/**
 * S5 — Live-Kampf: das Gegner-Team in „auf dem Feld" (2 aktiv) und „auf der Bank"
 * (4) aufgeteilt. Für jedes eigene Pokémon wird die Ampel gegen die aktiven Gegner
 * gezeigt; ein Tap auf ein Bank-Pokémon holt es auf den ausgewählten Feld-Slot.
 */
export function LiveBattle({
  team,
  picked,
  leads,
  opponentIds,
  onExit,
}: LiveBattleProps) {
  const [live, setLive] = useState(() => initLive(opponentIds));
  const [selectedSlot, setSelectedSlot] = useState(0);

  const leadSet = new Set(leads);
  const fieldCombatants = live.field
    .map(oppCombatant)
    .filter((c): c is Combatant => c != null);

  const handleExit = () => {
    if (window.confirm("Kampf wirklich beenden?")) onExit();
  };

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <h2 className={styles.title}>Live-Kampf</h2>
        <button type="button" className={styles.exit} onClick={handleExit}>
          Kampf beenden
        </button>
      </header>

      <section>
        <h3 className={styles.sectionTitle}>Auf dem Feld</h3>
        <div className={styles.field}>
          {live.field.map((id, slot) => {
            const mon = getPokemon(id);
            if (!mon) return null;
            const selected = slot === selectedSlot;
            return (
              <button
                key={id}
                type="button"
                className={styles.fieldCard}
                data-selected={selected}
                onClick={() => setSelectedSlot(slot)}
                aria-pressed={selected}
              >
                <div className={styles.fieldHead}>
                  <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={48} />
                  <div className={styles.fieldInfo}>
                    <span className={styles.name}>{mon.nameDe}</span>
                    <span className={styles.types}>
                      {mon.types.map((t) => (
                        <TypeBadge key={t} type={t} size="sm" />
                      ))}
                    </span>
                  </div>
                </div>
                <div className={styles.moves}>
                  {mon.topMoves.map((m) => (
                    <MoveRow
                      key={m.name}
                      name={m.name}
                      type={m.type}
                      usagePercent={m.usagePercent}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>
          Bank <span className={styles.subtle}>— antippen, um auf den gewählten Feld-Slot zu holen</span>
        </h3>
        <div className={styles.bank}>
          {live.bank.map((id) => {
            const mon = getPokemon(id);
            if (!mon) return null;
            return (
              <button
                key={id}
                type="button"
                className={styles.benchMon}
                onClick={() => setLive(swapToField(live, selectedSlot, id))}
                aria-label={`${mon.nameDe} aufs Feld holen`}
              >
                <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={40} />
                <span className={styles.benchName}>{mon.nameDe}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Deine Pokémon gegen das Feld</h3>
        <ul className={styles.ownList}>
          {picked.map((id) => {
            const mon = getPokemon(id);
            const member = team.members.find((m) => m.pokemonId === id);
            const own = member ? ownCombatant(member) : undefined;
            if (!mon || !own) return null;
            return (
              <li key={id} className={styles.ownRow}>
                <div className={styles.ownMain}>
                  <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={40} />
                  <span className={styles.name}>{mon.nameDe}</span>
                  {leadSet.has(id) && <span className={styles.leadPill}>Lead</span>}
                </div>
                <div className={styles.ampelGroup}>
                  {fieldCombatants.map((opp) => {
                    const ampel = pairAmpel(
                      own.moveTypes,
                      own.types,
                      opp.moveTypes,
                      opp.types,
                    );
                    const oppMon = getPokemon(opp.id);
                    return (
                      <span key={opp.id} className={styles.ampelChip} data-ampel={ampel}>
                        <PokemonSprite
                          src={oppMon?.sprite ?? ""}
                          alt={oppMon?.nameDe ?? opp.id}
                          size={22}
                        />
                        <span className={styles.ampelDot} data-ampel={ampel} aria-hidden="true" />
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
