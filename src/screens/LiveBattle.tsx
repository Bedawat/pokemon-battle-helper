import { useState } from "react";
import { MoveRow } from "../components/MoveRow";
import { PokemonSprite } from "../components/PokemonSprite";
import { TypeBadge } from "../components/TypeBadge";
import { initLive, swapToField } from "../lib/battle";
import { oppCombatant, ownCombatant } from "../lib/combatant";
import { getPokemon } from "../lib/data";
import { pairAmpel } from "../lib/matchup";
import {
  type MegaState,
  type Side,
  NO_MEGA,
  activeMegaId,
  canMega,
  commitMega,
  revertMega,
} from "../lib/mega";
import type { PokemonView } from "../lib/dataset";
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

interface Preview {
  side: Side;
  id: string;
  megaId: string;
}

/**
 * S5 — Live-Kampf: das Gegner-Team in „auf dem Feld" (2 aktiv) und „auf der Bank"
 * (4) aufgeteilt. Für jedes eigene Pokémon wird die Ampel gegen die aktiven Gegner
 * gezeigt; ein Tap auf ein Bank-Pokémon holt es auf den ausgewählten Feld-Slot.
 *
 * Mega-Handling (Phase 9): mega-fähige Pokémon auf dem Feld bzw. in der eigenen
 * Liste zeigen einen ⚡-Mega-Chip. Tap → Vorschau (Ampeln rechnen „als ob",
 * gestrichelt markiert) → Bestätigen/Abbrechen. Pro Seite nur ein Mega
 * (One-per-Side, eigene/Gegner unabhängig); bestätigte Mega ist rücknehmbar.
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
  const [megaState, setMegaState] = useState<MegaState>(NO_MEGA);
  const [preview, setPreview] = useState<Preview | null>(null);

  const leadSet = new Set(leads);

  /** Wirksame Mega-Form (Vorschau schlägt Festgeschriebenes für dieses Mon). */
  const effMegaId = (side: Side, id: string): string | null => {
    if (preview && preview.side === side && preview.id === id) return preview.megaId;
    return activeMegaId(megaState, side, id);
  };

  /** Sprite passend zur wirksamen Form (Mega-Artwork bzw. Grund-Sprite). */
  const spriteFor = (mon: PokemonView, side: Side, id: string): string => {
    const mId = effMegaId(side, id);
    const mega = mId ? mon.megas?.find((m) => m.id === mId) : undefined;
    return mega?.sprite ?? mon.sprite;
  };

  /** Typen passend zur wirksamen Form (für die Badge-Anzeige). */
  const typesFor = (mon: PokemonView, side: Side, id: string) => {
    const mId = effMegaId(side, id);
    const mega = mId ? mon.megas?.find((m) => m.id === mId) : undefined;
    return mega?.types ?? mon.types;
  };

  const fieldCombatants = live.field
    .map((id) => oppCombatant(id, effMegaId("opp", id)))
    .filter((c): c is Combatant => c != null);

  const handleExit = () => {
    if (window.confirm("Kampf wirklich beenden?")) onExit();
  };

  const confirmPreview = () => {
    if (!preview) return;
    setMegaState(commitMega(megaState, preview.side, preview.id, preview.megaId));
    setPreview(null);
  };

  /** Mega-Chips für ein Pokémon (eigene Liste oder Feld-Gegner). */
  const renderMegaChips = (mon: PokemonView, side: Side, id: string) => {
    if (!mon.megas || mon.megas.length === 0) return null;
    const locked = !canMega(megaState, side, id); // Seite hat ein anderes Mega
    return (
      <div className={styles.megaChips}>
        {mon.megas.map((m) => {
          const committed = activeMegaId(megaState, side, id) === m.id;
          const previewing =
            preview?.side === side && preview.id === id && preview.megaId === m.id;
          const state = committed ? "committed" : previewing ? "preview" : "idle";
          const label = mon.megas!.length > 1 ? m.label : "Mega";
          return (
            <button
              key={m.id}
              type="button"
              className={styles.megaChip}
              data-state={state}
              disabled={locked}
              aria-pressed={committed || previewing}
              onClick={() => {
                if (committed) {
                  // bereits Mega → zurücknehmen (Fehltipp-Schutz)
                  setMegaState(revertMega(megaState, side, id));
                  setPreview(null);
                } else {
                  setPreview({ side, id, megaId: m.id });
                }
              }}
            >
              ⚡ {label}
              {committed ? " ✓" : ""}
            </button>
          );
        })}
      </div>
    );
  };

  // Vorschau-Banner-Infos
  const previewMon = preview ? getPokemon(preview.id) : undefined;
  const previewMega = previewMon?.megas?.find((m) => m.id === preview?.megaId);

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <h2 className={styles.title}>Live-Kampf</h2>
        <button type="button" className={styles.exit} onClick={handleExit}>
          Kampf beenden
        </button>
      </header>

      {preview && previewMon && previewMega && (
        <div className={styles.previewBar} role="status">
          <span className={styles.previewText}>
            Vorschau: <strong>{previewMon.nameDe}</strong> → {previewMega.label} (
            {previewMega.types.join("/")})
          </span>
          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.previewConfirm}
              onClick={confirmPreview}
            >
              Mega bestätigen
            </button>
            <button
              type="button"
              className={styles.previewCancel}
              onClick={() => setPreview(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <section>
        <h3 className={styles.sectionTitle}>Auf dem Feld</h3>
        <div className={styles.field}>
          {live.field.map((id, slot) => {
            const mon = getPokemon(id);
            if (!mon) return null;
            const selected = slot === selectedSlot;
            const previewingThis =
              preview?.side === "opp" && preview.id === id;
            return (
              <div
                key={id}
                className={styles.fieldCard}
                data-selected={selected}
                data-preview={previewingThis}
              >
                <button
                  type="button"
                  className={styles.fieldSelect}
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={selected}
                  aria-label={`Feld-Slot ${slot + 1} (${mon.nameDe}) auswählen`}
                >
                  <div className={styles.fieldHead}>
                    <PokemonSprite
                      src={spriteFor(mon, "opp", id)}
                      alt={mon.nameDe}
                      size={48}
                    />
                    <div className={styles.fieldInfo}>
                      <span className={styles.name}>{mon.nameDe}</span>
                      <span className={styles.types}>
                        {typesFor(mon, "opp", id).map((t) => (
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
                {renderMegaChips(mon, "opp", id)}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>
          Bank{" "}
          <span className={styles.subtle}>
            — antippen, um auf den gewählten Feld-Slot zu holen
          </span>
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
            const own = member ? ownCombatant(member, effMegaId("own", id)) : undefined;
            if (!mon || !own) return null;
            const previewingOwn = preview?.side === "own" && preview.id === id;
            return (
              <li key={id} className={styles.ownRow}>
                <div className={styles.ownMain}>
                  <PokemonSprite
                    src={spriteFor(mon, "own", id)}
                    alt={mon.nameDe}
                    size={40}
                  />
                  <div className={styles.ownInfo}>
                    <span className={styles.ownNameRow}>
                      <span className={styles.name}>{mon.nameDe}</span>
                      {leadSet.has(id) && (
                        <span className={styles.leadPill}>Lead</span>
                      )}
                    </span>
                    {renderMegaChips(mon, "own", id)}
                  </div>
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
                    const cellPreview =
                      previewingOwn ||
                      (preview?.side === "opp" && preview.id === opp.id);
                    return (
                      <span
                        key={opp.id}
                        className={styles.ampelChip}
                        data-ampel={ampel}
                        data-preview={cellPreview}
                      >
                        <PokemonSprite
                          src={oppMon ? spriteFor(oppMon, "opp", opp.id) : ""}
                          alt={oppMon?.nameDe ?? opp.id}
                          size={22}
                        />
                        <span
                          className={styles.ampelDot}
                          data-ampel={ampel}
                          aria-hidden="true"
                        />
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
