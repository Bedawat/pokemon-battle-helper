/**
 * Live-Kampf-Zustand (Phase 6, S5) — reine, immutable Feld/Bank-Logik.
 * Offline testbar (battle.test.ts). Das gegnerische Team wird in „auf dem Feld"
 * (2 aktive) und „auf der Bank" (Rest) aufgeteilt; der Nutzer tauscht, wenn im
 * echten Kampf ein Wechsel passiert.
 */

/** Wie viele Gegner gleichzeitig auf dem Feld stehen (Doppelkampf). */
export const FIELD_SIZE = 2;

/** Aufteilung des Gegner-Teams in aktive Feld-Pokémon und Bank. */
export interface LiveState {
  /** Aktuell aktive Gegner (max. FIELD_SIZE). */
  field: string[];
  /** Restliche Gegner auf der Bank. */
  bank: string[];
}

/** Startzustand: die ersten 2 Gegner aufs Feld, der Rest auf die Bank. */
export function initLive(opponentIds: string[]): LiveState {
  return {
    field: opponentIds.slice(0, FIELD_SIZE),
    bank: opponentIds.slice(FIELD_SIZE),
  };
}

/**
 * Startzustand aus den vom Nutzer gewählten Gegner-Leads (Phase 11, §14):
 * die gewählten Leads (max. FIELD_SIZE, in Auswahlreihenfolge) aufs Feld, der
 * Rest des Gegner-Teams in seiner ursprünglichen Reihenfolge auf die Bank.
 * Behebt die Phase-6-Vereinfachung „die ersten 2 raten". Unbekannte Lead-ids
 * werden ignoriert (Safe Default).
 */
export function initFromLeads(
  opponentIds: string[],
  leadIds: string[],
): LiveState {
  const field = [...new Set(leadIds)]
    .filter((id) => opponentIds.includes(id))
    .slice(0, FIELD_SIZE);
  const bank = opponentIds.filter((id) => !field.includes(id));
  return { field, bank };
}

/**
 * Tauscht ein Bank-Pokémon auf einen Feld-Slot; das verdrängte Feld-Pokémon geht
 * an dessen Bank-Position. No-op bei ungültigem Slot oder unbekannter Bank-id.
 */
export function swapToField(
  state: LiveState,
  fieldSlot: number,
  bankId: string,
): LiveState {
  const bankIndex = state.bank.indexOf(bankId);
  if (bankIndex < 0) return state;
  if (fieldSlot < 0 || fieldSlot >= state.field.length) return state;

  const field = [...state.field];
  const bank = [...state.bank];
  const displaced = field[fieldSlot];
  field[fieldSlot] = bankId;
  bank[bankIndex] = displaced;
  return { field, bank };
}
