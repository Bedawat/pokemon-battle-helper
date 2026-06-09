import { type ReactNode, useState } from "react";
import { MoveRow } from "../components/MoveRow";
import { PokemonSprite } from "../components/PokemonSprite";
import { TypeBadge } from "../components/TypeBadge";
import { initFromLeads, swapToField } from "../lib/battle";
import { oppCombatant, ownCombatant } from "../lib/combatant";
import { getPokemon } from "../lib/data";
import { canHitSuperEffective } from "../lib/matchup";
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
import type { Team } from "../types/team";
import styles from "./LiveBattle.module.css";

interface LiveBattleProps {
  team: Team;
  /** Die 4 gepickten eigenen Pokémon (feste Reihenfolge in beiden Karten). */
  picked: string[];
  /** Welche 2 Gegner zu Beginn auf dem Feld stehen (§14). */
  fieldLeads: string[];
  opponentIds: string[];
  onExit: () => void;
}

interface MegaPreview {
  side: Side;
  id: string;
  megaId: string;
}

/**
 * S5 — Live-Kampf (Phase 11, gegner-zentrisch). Primärachse sind die 2 aktiven
 * Feld-Gegner als gestapelte Karten; *in* jeder Karte stehen deine 4 Pokémon mit
 * bidirektionalem Matchup (zwei Icon-Kanäle):
 *
 * - ⚔️ grün = ich treffe diesen Gegner super-effektiv (meine Move-Typen, gewiss).
 * - 🛡️ rot = ich werde von ihm super-effektiv getroffen (seine geschätzten Top-4).
 *
 * Gegner-Moves sind als kompakte Typ-Badge-Zeile reduziert; ein Chevron klappt die
 * „Häufigsten Attacken (geschätzt)" inline auf. Mega und Eintausch teilen eine
 * Gestik: Vorschau → Bestätigen (Mega via ⚡-Chip, Eintausch via Bank-Tap).
 */
export function LiveBattle({
  team,
  picked,
  fieldLeads,
  opponentIds,
  onExit,
}: LiveBattleProps) {
  const [live, setLive] = useState(() => initFromLeads(opponentIds, fieldLeads));
  const [megaState, setMegaState] = useState<MegaState>(NO_MEGA);
  const [megaPreview, setMegaPreview] = useState<MegaPreview | null>(null);
  /** Bank-Pokémon, das gerade für den Eintausch vorgeschaut wird (§13 Punkt 8). */
  const [swapBankId, setSwapBankId] = useState<string | null>(null);
  /** Welche Gegner-Karten ihr Attacken-Detail aufgeklappt haben. */
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  /** Wirksame Mega-Form (Vorschau schlägt Festgeschriebenes für dieses Mon). */
  const effMegaId = (side: Side, id: string): string | null => {
    if (megaPreview && megaPreview.side === side && megaPreview.id === id) {
      return megaPreview.megaId;
    }
    return activeMegaId(megaState, side, id);
  };

  const spriteFor = (mon: PokemonView, side: Side, id: string): string => {
    const mId = effMegaId(side, id);
    const mega = mId ? mon.megas?.find((m) => m.id === mId) : undefined;
    return mega?.sprite ?? mon.sprite;
  };

  const typesFor = (mon: PokemonView, side: Side, id: string) => {
    const mId = effMegaId(side, id);
    const mega = mId ? mon.megas?.find((m) => m.id === mId) : undefined;
    return mega?.types ?? mon.types;
  };

  const handleExit = () => {
    if (window.confirm("Kampf wirklich beenden?")) onExit();
  };

  const toggleDetail = (id: string) => {
    setOpenDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmMega = () => {
    if (!megaPreview) return;
    setMegaState(
      commitMega(megaState, megaPreview.side, megaPreview.id, megaPreview.megaId),
    );
    setMegaPreview(null);
  };

  const startSwapPreview = (bankId: string) => {
    setMegaPreview(null); // keine verschachtelte „X kommt rein + megst"-Vorschau
    setSwapBankId(bankId);
  };

  const confirmSwap = (fieldSlot: number) => {
    if (!swapBankId) return;
    setLive(swapToField(live, fieldSlot, swapBankId));
    setSwapBankId(null);
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
            megaPreview?.side === side &&
            megaPreview.id === id &&
            megaPreview.megaId === m.id;
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
                  setMegaState(revertMega(megaState, side, id));
                  setMegaPreview(null);
                } else {
                  setSwapBankId(null);
                  setMegaPreview({ side, id, megaId: m.id });
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

  /** Die zwei Icon-Kanäle (⚔️ offensiv / 🛡️ defensiv) für ein eigenes Mon. */
  const renderChannels = (atk: boolean, def: boolean) => (
    <div className={styles.channels} aria-hidden={false}>
      <span
        className={styles.channel}
        data-kind="atk"
        data-on={atk}
        title={atk ? "Trifft super-effektiv" : "Trifft nicht super-effektiv"}
        aria-label={atk ? "Trifft super-effektiv" : "Trifft nicht super-effektiv"}
      >
        ⚔️
      </span>
      <span
        className={styles.channel}
        data-kind="def"
        data-on={def}
        title={
          def
            ? "Wird super-effektiv getroffen"
            : "Wird nicht super-effektiv getroffen"
        }
        aria-label={
          def
            ? "Wird super-effektiv getroffen"
            : "Wird nicht super-effektiv getroffen"
        }
      >
        🛡️
      </span>
    </div>
  );

  /** Die 4 eigenen Mons mit Zwei-Kanal-Matchup gegen diesen Gegner. */
  const renderOwnRows = (oppId: string) => {
    const opp = oppCombatant(oppId, effMegaId("opp", oppId));
    if (!opp) return null;
    return (
      <ul className={styles.ownList}>
        {picked.map((id) => {
          const mon = getPokemon(id);
          const member = team.members.find((m) => m.pokemonId === id);
          const own = member ? ownCombatant(member, effMegaId("own", id)) : undefined;
          if (!mon || !own) return null;
          const atk = canHitSuperEffective(own.moveTypes, opp.types);
          const def = canHitSuperEffective(opp.moveTypes, own.types);
          return (
            <li key={id} className={styles.ownRow}>
              <div className={styles.ownMain}>
                <PokemonSprite
                  src={spriteFor(mon, "own", id)}
                  alt={mon.nameDe}
                  size={36}
                />
                <span className={styles.name}>{mon.nameDe}</span>
              </div>
              <div className={styles.ownRight}>
                {renderMegaChips(mon, "own", id)}
                {renderChannels(atk, def)}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  /**
   * Gegner-Karte: Kopf (Sprite/Name/Typen) + Typ-Badge-Zeile + Chevron-Detail,
   * darunter die 4 eigenen Mons. `footer` zeigt im Eintausch-Preview die
   * Slot-Buttons. `previewing` markiert die Karte gestrichelt.
   */
  const renderOpponentCard = (
    oppId: string,
    opts: { previewing?: boolean; footer?: ReactNode; interactive?: boolean } = {},
  ) => {
    const mon = getPokemon(oppId);
    if (!mon) return null;
    const { previewing = false, footer, interactive = true } = opts;
    const open = openDetails.has(oppId);
    const moveBadges = mon.topMoves.slice(0, 4);
    return (
      <div
        key={oppId}
        className={styles.oppCard}
        data-preview={previewing}
      >
        <div className={styles.oppHead}>
          <PokemonSprite src={spriteFor(mon, "opp", oppId)} alt={mon.nameDe} size={48} />
          <div className={styles.oppInfo}>
            <span className={styles.name}>{mon.nameDe}</span>
            <span className={styles.types}>
              {typesFor(mon, "opp", oppId).map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </span>
          </div>
          {interactive && renderMegaChips(mon, "opp", oppId)}
        </div>

        <div className={styles.oppMoves}>
          <div className={styles.moveTypes}>
            {moveBadges.map((m, i) => (
              <TypeBadge key={`${m.type}-${i}`} type={m.type} size="sm" />
            ))}
          </div>
          {interactive && (
            <button
              type="button"
              className={styles.detailToggle}
              onClick={() => toggleDetail(oppId)}
              aria-expanded={open}
            >
              <span className={styles.detailLabel}>Attacken</span>
              <span className={styles.chevron} data-open={open} aria-hidden="true">
                ›
              </span>
            </button>
          )}
        </div>

        {interactive && open && (
          <div className={styles.detail}>
            <span className={styles.detailHead}>Häufigste Attacken (geschätzt)</span>
            {moveBadges.map((m) => (
              <MoveRow
                key={m.name}
                name={m.name}
                type={m.type}
                usagePercent={m.usagePercent}
              />
            ))}
          </div>
        )}

        <div className={styles.cardDivider} />
        {renderOwnRows(oppId)}
        {footer}
      </div>
    );
  };

  // Banner-Infos für die Mega-Vorschau
  const previewMon = megaPreview ? getPokemon(megaPreview.id) : undefined;
  const previewMega = previewMon?.megas?.find((m) => m.id === megaPreview?.megaId);
  const swapMon = swapBankId ? getPokemon(swapBankId) : undefined;

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <h2 className={styles.title}>Live-Kampf</h2>
        <button type="button" className={styles.exit} onClick={handleExit}>
          Kampf beenden
        </button>
      </header>

      {megaPreview && previewMon && previewMega && (
        <div className={styles.previewBar} role="status">
          <span className={styles.previewText}>
            Vorschau: <strong>{previewMon.nameDe}</strong> → {previewMega.label} (
            {previewMega.types.join("/")})
          </span>
          <div className={styles.previewActions}>
            <button type="button" className={styles.previewConfirm} onClick={confirmMega}>
              Mega bestätigen
            </button>
            <button
              type="button"
              className={styles.previewCancel}
              onClick={() => setMegaPreview(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {swapBankId && swapMon && (
        <section>
          <div className={styles.previewBar} role="status">
            <span className={styles.previewText}>
              Vorschau Eintausch: <strong>{swapMon.nameDe}</strong> — für welchen
              Feld-Gegner?
            </span>
            <div className={styles.previewActions}>
              <button
                type="button"
                className={styles.previewCancel}
                onClick={() => setSwapBankId(null)}
              >
                Abbrechen
              </button>
            </div>
          </div>
          {renderOpponentCard(swapBankId, {
            previewing: true,
            interactive: false,
            footer: (
              <div className={styles.swapSlots}>
                {live.field.map((fid, slot) => {
                  const fmon = getPokemon(fid);
                  return (
                    <button
                      key={fid}
                      type="button"
                      className={styles.swapSlotBtn}
                      onClick={() => confirmSwap(slot)}
                    >
                      Ersetzt {fmon?.nameDe ?? `Slot ${slot + 1}`}
                    </button>
                  );
                })}
              </div>
            ),
          })}
        </section>
      )}

      <section>
        <h3 className={styles.sectionTitle}>Auf dem Feld</h3>
        <div className={styles.field}>
          {live.field.map((id) => renderOpponentCard(id))}
        </div>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>
          Bank{" "}
          <span className={styles.subtle}>— antippen für eine Eintausch-Vorschau</span>
        </h3>
        <div className={styles.bank}>
          {live.bank.map((id) => {
            const mon = getPokemon(id);
            if (!mon) return null;
            const active = swapBankId === id;
            return (
              <button
                key={id}
                type="button"
                className={styles.benchMon}
                data-active={active}
                onClick={() => startSwapPreview(id)}
                aria-label={`${mon.nameDe} eintauschen (Vorschau)`}
              >
                <PokemonSprite src={mon.sprite} alt={mon.nameDe} size={40} />
                <span className={styles.benchName}>{mon.nameDe}</span>
              </button>
            );
          })}
          {live.bank.length === 0 && (
            <p className={styles.subtle}>Keine Bank-Pokémon.</p>
          )}
        </div>
      </section>
    </div>
  );
}
