# Session-Handoff — Pokémon Battle Helper (Stand 06.06.2026)

Für einen neuen Chat/Agent, um die Web-App nahtlos weiterzubauen.
Sag im neuen Chat: **„Lies SESSION-HANDOFF.md im pokemon-battle-helper Ordner und mach weiter."**

## Wo wir stehen

Wir bauen die Web-App aus dem Bauplan
`University Wiki/wiki/HumanComputerInteraction/Ausarbeitung/Pokémon Battle Helper — Web-App Handoff.md`
(dort sind alle Design-Entscheidungen, Screens S1–S8, Matchup-Logik, Phasenplan).
Stack: **React 18 + TypeScript + Vite**, Dark-Mode-only, Ziel iPhone (393×852).
Projekt liegt in `/Users/peter/Projects/CoworkPlayground/pokemon-battle-helper/`.

**Wichtig zur Umgebung:** Die npm-Registry und das Internet sind im Agent-Sandbox
gesperrt. Ich (der Agent) kann **nicht** `npm install`, `npm run dev` oder die
Daten-Fetches ausführen. Pete macht das auf seinem Mac und schickt die Ausgabe
zurück. Code wird daher sorgfältig manuell reviewt; pure Parsing-Logik lässt sich
offline im Sandbox mit `node` testen (Node ist da, nur ohne Netz).

## Erledigt

- **Phase 1 (Daten) ✅** — `scripts/build-data.mjs` (`npm run data`).
  Letzter Lauf bei Pete (05.06.): **41 Pokémon geschrieben, keine Warnungen.**
  - Pikalytics: Usage %, Top-4-Moves (Name/Typ/%), eigene Typen, Sprite-Fallback.
  - PokéAPI: deutsche Namen, Official-Artwork-Sprites, 18×18 Type-Chart.
  - **Neu:** voller Movepool pro Pokémon (`movepool` in `pokemon.json`) für den
    Move-Picker in S8. Alle 41 haben einen Movepool.
  - Schreibt `data/pokemon.json`, `data/usage.json`, `data/type-chart.json`.
  - Der alte Gourgeist-Move-Parsing-Bug ist erledigt (Lauf ohne Warnungen).
- **Phase 2 (App-Grundgerüst) ✅** — Vite + React + TS, strikte tsconfig.
  Design Tokens 1:1 aus Figma (`src/styles/tokens.css`), iPhone-Frame
  (`src/styles/global.css`). App-Shell mit Screen-Routing (`src/App.tsx`,
  `src/types/navigation.ts`), `NavBar` (Kampf/Team, Team-Tab im Live-Kampf
  gesperrt), `MainMenu` (S1), `Button`.
- **Phase 3 (Team-Management) ✅** — kompletter Team-Flow, bei Pete verifiziert
  (`npm test`: **35 Tests grün**, `npm run typecheck` clean):
  - **Datenlayer** `src/lib/data.ts` lädt die JSON-Dateien typisiert.
  - **S6 Team-Liste** (`screens/TeamList.tsx`): 3 Slots, „aktives Team"
    markierbar, „Neues Team", Löschen mit Rückfrage. Persistenz über
    `lib/useTeams.ts` + `lib/team.ts` (`localStorage`).
  - **S7 Team-Editor** (`screens/TeamEditor.tsx`): 6 Slots, `PokemonGrid`,
    `SearchBar` mit Live-Suche (DE **und** EN), Auto-Moveset (Top-4) bei Auswahl.
  - **S8 Pokémon-Detail** (`screens/PokemonDetail.tsx`): Attacken tauschen via
    Movepool-Picker, Pokémon entfernen.
  - Reine Logik getestet in `lib/{search,team,dataset}.test.ts` (offline).
  - Demo-Team beim ersten Start vorbefüllt + aktiv.

Phasen 1–7 **und Phase 9 (Mega-Handling)** verifiziert grün — der funktionale
Prototyp inkl. Mega-Mechanik ist fertig (alle drei User Journeys + Mega-Vorschau im
Live-Kampf laufen, bei Pete durchgeklickt 06.06.).

**Offen / nächste Session (nicht blockierend):**
- **Phase 7 Restpunkte:** Cross-Device-Test auf dem iPhone (`npm run dev:lan`),
  Sicht-Check der aufgehellten Tertiärfarbe.
- **Backlog:** committetes Mega bleibt „verbraucht" beim Bank-Tausch (One-per-Side,
  akzeptabel); Top-Move-Name „Mega Charizard Y Heat Wave" (Pikalytics-Artefakt, kosmetisch).
- **Danach:** Usability-Test (Schwellen in `synergy.ts` kalibrieren).
- **Git:** Änderungen committen + pushen (lokal auf dem Mac, siehe Abschnitt „Git & GitHub").

## Backlog / Offene Punkte (später, nicht blockierend)

- **Floette-Sprite fehlt** — bei Floette (Champions-Mega ohne PokéAPI-Slug) lädt
  kein Bild. Vermutlich Pikalytics-CDN-URL falsch/leer. In `build-data.mjs` den
  Sprite-Fallback für die Champions-Megas prüfen (ggf. manuell hinterlegen).
- ~~**Mega-Entwicklungen in der Pick-Phase**~~ → **Design entschieden 06.06.2026**
  (Grill-Session). Volle Entscheidung + Umsetzungsplan im Wiki:
  `University Wiki/.../Pokémon Battle Helper — Web-App Handoff.md` §11.
  Kurzfassung → siehe **Phase 9** unten. Umsetzung noch offen.
- ~~Status-Moves verfälschen die Coverage~~ → **erledigt 06.06.** (siehe Phase 7).
  **Wichtig:** wirkt erst nach `npm run data` (Kategorie kommt frisch aus PokéAPI);
  bis dahin Safe Default (jeder Move zählt wie bisher).

## Phase 4 — Gegner-Eingabe (S2) ✅ (verifiziert 05.06.2026)

`lib/opponent.ts` (Slot-Logik + Grid-Quelle), `screens/OpponentInput.tsx`. Bei Pete
grün (`npm test` 47 Tests, Dev-Durchklick). 6 Slots, Top-20-Grid, Suche DE+EN, CTA
„Analyse starten" bei 6 → `synergy`. `opponentIds`-State in `App.tsx`.

## Phase 5 — Matchup + Synergie (S3/S4) ✅ (verifiziert 05.06.2026)

> Bei Pete grün: `npm test` (68 Tests), `npm run typecheck`, Dev-Durchklick.

- **Matchup-Engine** `lib/matchup.ts` (+ Test): `effectiveness` (Produkt aus der
  18×18-Matrix), `canHitSuperEffective`, `pairAmpel` (offensiv/defensiv →
  grün/gelb/rot, Bauplan Abschnitt 6).
- **Synergie** `lib/synergy.ts` (+ Test): `coveredOpponents`, `threats`,
  `synergyAmpel(own, gegner, bereits gepickt)` mit **kalibrierbaren Schwellen**
  (`GOOD_NEW_COVERAGE=2`, `GOOD_MAX_THREATS=1`, `BAD_THREATS=3` — im Usability-Test
  feinjustieren). `togglePick(list, id, max)` für Pick-/Lead-Auswahl.
- **Adapter** `lib/combatant.ts`: baut aus Team-Member / Gegner-id die `Combatant`-
  Objekte (Typen + Move-Typen). Hält `synergy.ts` datenfrei und testbar.
- **S3 Synergie-Übersicht** (`screens/SynergyOverview.tsx`): eigene Team-Pokémon mit
  dynamischer Ampel (Bewertung der Übrigen berücksichtigt schon gepickte Coverage),
  Gegner-Kontextleiste, 4 wählbar, CTA „Picks bestätigen".
- **S4 Lead-Auswahl** (`screens/LeadSelect.tsx`): die 4 Picks, 2 Leads wählbar,
  CTA „Kampf starten" → `live-battle`.
- **Wiring** `App.tsx`: `pickedIds`/`leadIds`-State, nutzt aktives Team +
  `opponentIds`; `synergy → lead-select → live-battle`. Picks/Leads werden beim
  Start eines neuen Kampfes bzw. beim Bestätigen der Picks zurückgesetzt.

## Phase 6 — Live-Kampf (S5) ✅ (verifiziert 05.06.2026)

> Bei Pete grün: `npm test` (75 Tests), `npm run typecheck`, Dev-Durchklick.
> Damit ist der funktionale Prototyp (User Journeys 1–3) fertig; es bleibt nur noch
> Phase 7 (Polish & Testing).

- **Feld/Bank-Logik** `lib/battle.ts` (+ Test): `initLive(opponentIds)` (2 aufs
  Feld, Rest auf die Bank), `swapToField(state, fieldSlot, bankId)` (immutabler
  Tausch). Reine Funktionen.
- **S5 Live-Kampf** (`screens/LiveBattle.tsx`): „Auf dem Feld" (2 Gegner, je mit
  Top-Attacken + Usage%), Feld-Slot antippbar zum Auswählen; „Bank" (4, Tap holt
  aufs gewählte Feld); „Deine Pokémon gegen das Feld" — die 4 Picks (Leads markiert)
  mit Ampel (`pairAmpel`) gegen jeden aktiven Feld-Gegner. Exit „Kampf beenden"
  (mit `window.confirm`) → Hauptmenü.
- **Wiring** `App.tsx`: `live-battle`-Case nutzt aktives Team + `pickedIds`/`leadIds`
  + `opponentIds`. Team-Tab bleibt im Live-Kampf gesperrt (`SCREENS_LOCKING_TEAM_TAB`).

Vereinfachung (Backlog-Kandidat): „auf dem Feld" startet mit den ersten 2 Gegnern
(wir kennen die echten Gegner-Leads nicht) — der Nutzer korrigiert per Tausch. Die
„Typ-Effektivität" der Feld-Gegner ist über die eigenen Ampeln abgebildet, nicht als
Zahl pro gegnerischer Attacke.

## Phase 7 — Polish & Testing (Stand 06.06.2026)

Erledigt in dieser Session. **Bei Pete verifiziert: `npm test` grün, `npm run
typecheck` clean (06.06.).** Einziger noch ausstehender Schritt für die volle
Wirkung der Status-Move-Coverage: `npm run data` neu bauen (zieht die Kategorien).

- **A11y-/Polish-Audit.** Kontraste per Skript durchgerechnet. `text-tertiary`
  #6b6b85 → **#9090b0** (war 2.84:1 auf Surface, jetzt 4.74:1 — Figma-Token
  nachziehen!). Weiße Remove-Badge-× → dunkel (`text-on-accent`, 6.1:1).
  Touch-Targets < 44px gefixt: Back-Buttons (Synergy/Lead), „Kampf beenden"
  (LiveBattle), Team-Karten-Actions (TeamList), Such-Clear- und Team-Remove-Button
  (unsichtbare `::before`-Trefferfläche). Lazy-Loading war schon da.
- **Edge Cases.** `TeamList` hat jetzt einen Empty State (0 Teams). `App.tsx`
  fängt ein aktives Team mit < `MAX_PICKS` (4) Mitgliedern vor der Synergie-Phase
  ab (war sonst toter „Picks bestätigen"-Button). Leere Suche, fehlende Usage und
  CTA-Guards waren bereits robust.
- **S5 Feld-Layout.** Die zwei Feld-Gegner passten auf 393px nicht nebeneinander.
  Entscheidung (Pete): **vertikal stapeln**. `.field` in `LiveBattle.module.css`
  von 2-Spalten-Grid auf einspaltig (flex column) umgestellt.
- **Status-Move-Coverage (Backlog erledigt).** Status-Moves zählen nicht mehr zur
  offensiven Coverage. Neue `MoveCategory` (`physical`/`special`/`status`,
  optional) auf `Move`/`MovepoolMove`. Reiner Helper `offensiveMoveTypes` in
  `dataset.ts` filtert Status-Moves (fehlende Kategorie = offensiv = Safe Default);
  `combatant.ts` nutzt ihn für beide Seiten, `autoMoveset` trägt die Kategorie mit.
  `build-data.mjs` zieht `damage_class` aus PokéAPI und schreibt `category` in
  `movepool` + `topMoves` (Top-Moves per normalisiertem Namens-Abgleich).
  Daten-Rebuild bei Pete gelaufen (06.06., `category` ist im Datensatz).
  **Nachtrag/Fix (06.06.):** Gespeicherte Teams aus localStorage von *vor* dem
  Rebuild hatten Moves ohne `category` → wurden fälschlich als offensiv gezählt
  (z. B. Whimsicott mit nur Status-Moves zeigte „trifft 2"). `offensiveMoveTypes`
  nimmt jetzt einen optionalen `catalog` (Movepool + Top-Moves) und schlägt die
  fehlende Kategorie per Namen nach; `combatant.ts` übergibt ihn. Damit heilen
  Altdaten-Teams ohne Neu-Picken. Eigene `category` schlägt den Katalog.
  Verifiziert: `tsc -b --noEmit` clean; `offensiveMoveTypes` offline gegen die echte
  `dataset.ts` getestet (Node 22 type-strip), inkl. Whimsicott-Fall. Neue Tests in
  `dataset.test.ts`.

Noch offen für Phase 7: Cross-Device-Test auf dem iPhone (`npm run dev:lan`),
Sicht-Check der aufgehellten Tertiär-Farbe. Plus Restbacklog (Floette-Sprite,
Mega-Handling). (`npm run data` ist gelaufen — Move-Kategorien sind im Datensatz.)

## Phase 9 — Mega-Handling + S3-Detailaufschlüsselung (Design entschieden 06.06.2026, Umsetzung offen)

Volle Entscheidung + Begründung im Wiki-Handoff §11. Kurzfassung:

**Mega-Handling.** 16/41 Pokémon sind Megas. Neues Modell: in der **Pick-Phase
pickt man die Grund-Form** (Matchup nutzt Grund-Typen) mit „⚡"-Marker bei
mega-fähigen; im **Live-Kampf** mega-entwickelbar — **beide Seiten**, aber **nur
eines pro Seite** (One-per-Side). Kernfeature: **Was-wäre-wenn-Vorschau** vor dem
Commit. Mega ändert **nur Typen** (keine Werte/Fähigkeiten). Sprite wechselt auf
**Mega-Artwork**. Movesets bleiben geteilt (vor dem Kampf gewählt = vor der Mega).

Umsetzungsschritte (jede testbar):
1. Datenmodell `Pokemon.megas?: MegaForm[] {id,label,types,sprite}`, `Pokemon.types`
   = Grund-Typen. `build-data.mjs`: Roster auf Spezies umbauen, **Charizard mit
   Mega-X UND Mega-Y**, Grund-Typen + Mega-Typen/-Artwork fetchen.
2. „⚡"-Marker in S2 + S3.
3. S5: Mega-Chip + Vorschau→Commit, One-per-Side, Sprite-Wechsel, Ampeln mit
   aktiver Form. State pro Slot: `base | megaId` + je Seite „Mega verbraucht".
4. `combatant.ts`: aktive Form als Parameter.
5. Tests: Mega-Matchup, One-per-Side, S3-Breakdown.

**S3-Synergie-Karte (separate Entscheidung, gleiche Session).** Die Zahlen „trifft X
· bedroht von Y" werden ersetzt durch **zwei beschriftete Sprite-Zeilen** „Trifft
sehr effektiv" (grün, `coveredOpponents`) / „Wird bedroht von" (rot, `threats`) mit
den Gegner-Sprites — Variante B (volle Breite, gestapelt). Großer Synergie-Punkt
bleibt die dynamische Gesamtwertung. Macht *gegen wen* sichtbar (Time-to-Insight).

### Phase 9 — Umsetzungsstand (Daten-Layer erledigt 06.06.2026, App-Layer offen)

**Erledigt (Schritt 1 des Plans, von mir typecheck-grün):**
- **Datenmodell** (`types/pokemon.ts`): neues `MegaForm { id, label, types, sprite }`,
  `Pokemon.megas?: MegaForm[]`, `Pokemon.types` jetzt = **Grund-Typen**.
- **`build-data.mjs` auf Spezies-Modell umgebaut:** Roster trägt zwei Eintrags-
  Formen — Nicht-Mega-Tupel (wie bisher) und Mega-Spezies-Objekte
  `{ species, base, usage, megas }`. Grund-Typen/-Sprite/-Movepool/-DE-Name aus
  PokéAPI (`base`); Usage + Top-Moves von der Mega-Pikalytics-Seite (`usage`,
  Spezies-Ebene); pro Mega Typen + Artwork aus PokéAPI (`api`) bzw. Pikalytics
  (`pika`, Champions-Megas). **Glurak mit Mega-X *und* Mega-Y.** 41 Spezies
  (25 Nicht-Mega + 16 Mega), keine ID-Kollisionen.
- **ID-Migration:** mega-fähige ids sind jetzt **Spezies-ids** (`charizard` statt
  `charizard-mega-y`). `DEMO_TEAM_IDS` angepasst; `STORAGE_KEY` `v1` → `v2`
  (verwirft alte Teams mit veralteten ids sauber).

**WICHTIG — Reihenfolge bei dir:** Code-Änderungen ziehen **und** `npm run data`
laufen lassen, *bevor* du die App testest. Bis zum Rebuild hat `pokemon.json` noch
die alten Mega-ids → das Demo-Team fände „charizard" nicht (5 statt 6 Mon). Nach
`npm run data` ist alles konsistent.

**Beim Lauf gegenprüfen (meine Annahmen, ich sehe Pikalytics/PokéAPI nicht):**
1. **Usage-Seiten** existieren unter den Mega-Namen (`Charizard-Mega-Y`,
   `Aerodactyl-Mega`, …) — die Top-Moves/Usage kommen von dort.
2. **Charizard-Mega-X** liefert via PokéAPI fire/dragon + Artwork (Mega-Y fire/flying).
3. **Champions-Megas** (Floette/Dragonite/Skarmory/Froslass): Grund-Form aus PokéAPI
   (`floette`/`dragonite`/`skarmory`/`froslass`), Mega-Typen+Sprite von der
   Pikalytics-Mega-Seite. Floette-Mega hat `fairy` als Override-Fallback.
4. **Erwartete Konsole:** pro Mega-Spezies eine Zeile `base …  megas […]  usage …`.
   Achte auf Warnungen „keine Grund-Typen", „keine Mega-Typen", „kein … Sprite".

Daten-Lauf bei Pete: **41 Pokémon, keine Warnungen** (06.06.). Charizard base
fire/flying → Mega X fire/dragon, Mega Y fire/flying; alle 16 mega-fähig korrekt.

### Phase 9 — App-Layer ✅ (verifiziert bei Pete 06.06.2026)

Schritte 2–6 gebaut. `tsc -b --noEmit` clean; reine Logik (mega.ts, resolveActiveTypes)
offline mit Node verifiziert (10/10). **Bei Pete: `npm test` grün + Durchklick i. O.**
(vitest läuft im Agent-Sandbox nicht — Rollup-Native-Binary ist für macOS, nicht linux-arm64.)

- **`lib/mega.ts`** (neu, rein): `MegaState`, `canMega`/`commitMega`/`revertMega`/
  `activeMegaId` — One-per-Side, Seiten unabhängig, immutabel. Tests `mega.test.ts`.
- **`combatant.ts`**: `ownCombatant`/`oppCombatant` nehmen optional `megaId` →
  aktive Typen aus Grund- oder Mega-Form. Reine Hilfsfunktion `resolveActiveTypes`
  exportiert + getestet (`combatant.test.ts`). **Achtung:** alle `.map(oppCombatant)`-
  Stellen auf `.map((id) => oppCombatant(id))` umgestellt (sonst Index als megaId).
- **⚡-Marker** (`components/MegaMarker.tsx`): statischer Corner-Badge. Im
  `PokemonGrid` → erscheint in **S2** (Gegner-Eingabe) *und* **S7** (Team-Editor,
  da Grid geteilt — gewollt konsistent). In **S3** zusätzlich Inline-Hinweis
  „→ Mega X / Mega Y" bei mehrdeutigen Megas (Glurak).
- **S3-Sprite-Zeilen** (Variante B): „Trifft sehr effektiv" (grün) / „Wird bedroht
  von" (rot) mit Gegner-Sprites statt „trifft X · bedroht von Y". Leere Zeile = „–".
- **S5-Mega-Interaktion** (`LiveBattle.tsx`): ⚡-Mega-Chip an eigenen + Feld-Gegner-
  Pokémon. Tap → Vorschau (Sprite/Typen/Ampeln rechnen „als ob", gestrichelt +
  Banner „Vorschau … → Mega Y") → „Mega bestätigen"/„Abbrechen". Nach Commit andere
  Chips derselben Seite ausgegraut (One-per-Side); committetes Mega per Tap
  rücknehmbar. Glurak zeigt zwei Chips (Mega X / Mega Y). Feld-Karte ist jetzt
  Container + innerer Select-Button (Chips dürfen nicht im Button verschachtelt sein).

**Durchgeklickt + bestätigt (06.06.) — für Regressionstests künftig prüfen:**
1. **S2/S7:** ⚡ an allen 16 mega-fähigen, an keinem anderen.
2. **S3:** Glurak zeigt „→ Mega X / Mega Y"; Sprite-Zeilen plausibel (mit Grund-Typen).
3. **S5 Vorschau:** Glurak-Chip „Mega X" antippen → Ampeln/Typen/Sprite ändern sich
   gestrichelt, Banner erscheint; „Mega Y" wechselt die Vorschau; Bestätigen schreibt
   fest, Sprite = Mega-Artwork.
4. **One-per-Side:** nach Commit eines eigenen Megas sind die anderen eigenen Chips
   grau; die Gegner-Seite bleibt frei. Commit rücknehmbar (Chip erneut tippen).
5. **Layout auf 393px:** Chips/Banner brechen sauber, Touch-Targets ≥ 44px.

Minor/Backlog: (a) committetes Mega bleibt „verbraucht", auch wenn das Mon auf die
Bank getauscht wird (One-per-Side-Semantik, akzeptabel); (b) Top-Move-Name
„Mega Charizard Y Heat Wave" (Pikalytics-Artefakt) — kosmetisch.

## Phase 10 — UX-Polish-Runde (Plan beschlossen 07.06.2026, Code erledigt — Verifikation offen)

> [!success] Schritte 1–7 **agentenseitig umgesetzt** (07.06.), Tests bei Pete grün.
> `tsc -b --noEmit` clean im Sandbox; Übersetzungslogik offline mit Node verifiziert.
>
> **Nachtrag 07.06. (nach Petes erstem Test):**
> - **Aktiv-Indikator verschoben:** „✓ Aktiv" sitzt jetzt an derselben Stelle wie
>   „Aktiv setzen" (Action-Zeile links) statt als Header-Pill → gleicher Ort,
>   Muscle-Memory. Akzent-Rahmen bleibt.
> - **Attacken-Übersetzung robuster:** (a) nicht übersetzte Moves werden über aus dem
>   Namen abgeleitete Slugs mitgeholt; (b) Präfix-Artefakt „Mega Charizard Y Heat Wave"
>   wird per Suffix-Match zu „Hitzewelle" aufgelöst.
> - **Override-Tabelle (`MOVE_DE_OVERRIDES`):** PokéAPI hat etliche neue Gen-8/9-Moves
>   gar nicht auf Deutsch lokalisiert (im Move-JSON fehlt der `de`-Eintrag). Manuell
>   ergänzt + **alle gegen pokemondb verifiziert** (16 Einträge). Greift nur als
>   Fallback (echte PokéAPI-de schlägt ihn). Erste Charge: Letzte Ehre, Wellentackle,
>   Kniefallspalter, Unheilsklauen, Quirlschuss. Zweite Charge (nach Petes 2. `npm run
>   data`-Warnung): Tera-Ausbruch, Schneelandschaft, Kalte Dusche, Wegbereiter,
>   Doppelstrahl, Mäuseplage, Aufräumen, Anspringen, Flammenwut, Letalwirbler,
>   Eiskreisel. Die Warnung „Ohne deutschen Move-Namen: …" listet künftige Stragglers.
> - **Kein Fix nötig — „Neck Strike":** das ist der offizielle **deutsche** Name von
>   „Throat Chop" (Deutsch nutzt hier einen englisch klingenden Namen). Kommt korrekt
>   aus PokéAPI, sieht nur englisch aus.
>
> **Bei dir noch offen:** `npm run data` erneut laufen lassen (alle Move-Fixes greifen
> erst danach), dann gegenprüfen. Auf die „Ohne deutschen Move-Namen"-Warnung achten —
> falls da noch was auftaucht, schick mir die Liste, dann ergänze ich die Override-Tabelle.

Geänderte/neue Dateien: `components/ScreenHeader.tsx` + `.module.css` (neu),
`components/NavBar.tsx`, `types/navigation.ts`, `App.tsx`, `screens/MainMenu.tsx`
(+ CSS), `screens/TeamEditor.tsx`, `screens/TeamList.tsx` (+ CSS),
`screens/OpponentInput.tsx`, `screens/SynergyOverview.tsx`, `screens/LeadSelect.tsx`,
`screens/PokemonDetail.tsx`, `scripts/build-data.mjs`. Keine Lib-Signaturen geändert
→ bestehende Tests sollten unverändert grün sein. (Nicht mehr genutzte CSS-Klassen
wie `.back`/`.head` in einzelnen Screen-Modulen sind belassen, schaden nicht.)

Feedback aus Petes Durchklicken. Entscheidungen am 07.06. getroffen. Volle Begründung
im Wiki-Handoff §12. Punkte 1–6 umsetzungsreif, Punkt 7 (Live-Kampf) → eigene
Grill-Session (Phase 11). Jeder Schritt einzeln testbar:

1. **`ScreenHeader`-Komponente** (neu) — Titel + optionaler Zurück-Button (Pfeil,
   ≥ 44px). Basis für die Zurück-Navigation.
2. **NavBar:** Label „Kampf" → **„Home"**, Schwert- → **Haus-Icon** (`NavBar.tsx`).
   Tab führt weiterhin auf `main-menu` — jetzt ehrlich benannt.
3. **MainMenu:** „Team verwalten"-Button **raus** (redundant zum Team-Tab). Stattdessen
   **Aktiv-Team-Karte** (Name + 6 Sprites, Tap → Team-Editor). `App.tsx` reicht
   `activeTeam` + Open-Handler durch.
4. **TeamEditor:** gewählte Pokémon **aus dem Grid entfernen** statt ausgrauen
   (`filtered.filter(p => !memberIds.has(p.id))` statt `disabledIds`). Kommen beim
   Entfernen aus dem Team reaktiv zurück. `PokemonGrid` bleibt generisch.
5. **TeamList:** Aktiv-Indikator verstärken — **Akzent-Rahmen + „✓ Aktiv"-Badge** um
   die ganze aktive Karte. (Ein schwacher „Aktiv"-Pill existiert schon → Pete nicht
   aufgefallen, daher verstärken statt neu bauen.)
6. **Zurück-Buttons per Screen** (kein globaler History-Stack — Petes Wahl). Über die
   gemeinsame `ScreenHeader`-Komponente, jeder Screen mit eigenem `onBack`-Ziel:
   `opponent-input` → Home, `team-list` → Home, `team-editor` → Team-Liste. Synergy/
   Lead/Detail haben `onBack` schon → auf den Header umstellen.
7. **Attacken auf Deutsch** (`build-data.mjs`): Movepool den `de`-Move-Namen aus PokéAPI
   ziehen (statt `en` in `fetchMoveInfo`); Pikalytics-Top-Moves per `moveKey` auf die
   deutschen Namen mappen (gleiche Technik wie die Move-Kategorie). **Wirkt erst nach
   `npm run data`.**
8. **Verifikation:** `npm run typecheck`, `npm test`, Durchklick bei Pete — Home zeigt
   aktives Team, Zurück auf allen Screens, Grid räumt gewählte Mons ab, Move-Namen
   deutsch nach Rebuild.

## Phase 11 — Live-Kampf-Redesign (Design entschieden 08.06.2026, Umsetzung offen)

Grill-Session am 08.06. durchgeführt. Volle Begründung + Umsetzungsplan im Wiki:
`University Wiki/.../Pokémon Battle Helper — Web-App Handoff.md` **§13** (Design) und
**§14-Flow** (Lead-Änderung). Kurzfassung:

**Kern-Job (Leitfrage pro Runde, ≈45 s):** symmetrisch/bidirektional — *welchen
Gegner treffe ich super-effektiv, und welcher trifft mich super-effektiv?* Für die
aktiven Feld-Gegner **und** vorbereitend für Einwechsler. App **unterstützt,
entscheidet nicht** (kein Recommender, kein Highlighting).

**Entschieden:**

1. **Gegner-zentrisch:** 2 aktive Feld-Gegner als gestapelte Karten; deine 4 Mons
   stehen *in* jeder Karte (keine separate „Deine Pokémon"-Sektion mehr).
2. **Bidirektional = zwei Icon-Kanäle pro Mon** (nicht Toggle, nicht S3-Zeilen):
   **⚔️ grün** = ich treffe super-effektiv (meine Moves, gewiss); **🛡️ rot** = ich
   werde super-effektiv getroffen (geschätzte Top-4 des Gegners). Sonst grau. Zeigt
   immer alle 4 Mons mit explizitem Zustand.
3. **Feste Mon-Reihenfolge** in beiden Karten gleich (Muscle-Memory; Sortieren nach
   Qualität = verdecktes Highlighting → raus).
4. **Gegner-Moves entrümpelt:** Haupt-View nur 4 **Typ-Badges**; Chevron klappt
   inline „**Häufigste Attacken (geschätzt)**" auf (Name + Usage%). Das „(geschätzt)"
   ist die einmalige Benennung der Daten-Unsicherheit (kein Pro-Icon-Marker). Eigene
   Mons nicht antippbar.
5. **Mega in die Karte gewandert:** ⚡-Chip steuert den einen geteilten State, beide
   Karten färben live; Seiten unabhängig, One-per-Side (bestehende `mega.ts`).
6. **Tausch + Eintausch-Vorschau = vereinheitlichtes Vorschau→Commit** (wie Mega):
   Bank-Tap → Was-wäre-wenn-Karte (gestrichelt + Banner) → „Eintausch bestätigen"
   (Slot-Wahl per 2 Buttons) / „Abbrechen". **`selectedSlot`-State entfällt.**
7. **Flow:** S4 (eigene Lead-Auswahl) **gestrichen** (speiste nur die wegfallende
   Lead-Pille). Neuer leichter **„Was führt der Gegner?"-Screen** an der S4-Position:
   2 der 6 Gegner antippen → Feld/Bank-Init korrekt gesetzt (behebt die Phase-6-
   „erste 2 raten"-Vereinfachung). Eigener Mini-Screen, nicht inline.

**Bewusst draußen:** kein Tipp/Recommender, kein Highlighting (nach dem Test
nachrüstbar), keine eigene Feld-Belegung modelliert (alle 4 gezeigt), kein
Item/Fähigkeit im Detail.

**Umsetzungsschritte (jede testbar):** (1) Flow/Screens (S4 raus, `opponent-leads`
rein, `leads`/Lead-Pille aus `LiveBattle`). (2) Gegner-Karte gegner-zentrisch +
Chevron-Detail. (3) Zwei-Kanal-Matchup: ⚔️ aus `canHitSuperEffective(own→opp)`,
🛡️ aus `canHitSuperEffective(opp→own)` statt der kombinierten `pairAmpel`. (4)
Eintausch-Preview→Commit via `swapToField`, `selectedSlot` weg. (5) Mega in der
Karte (bestehende `mega.ts`). (6) Tests + Durchklick auf 393px (Targets ≥ 44px).

## Befehle (auf Petes Mac)

```bash
cd "/Users/peter/Projects/CoworkPlayground/pokemon-battle-helper"
npm install          # einmalig
npm run dev          # Dev-Server, http://localhost:5173
npm run dev:lan      # fürs iPhone im WLAN
npm run data         # Datensatz neu bauen (zieht auch die Movepools)
npm test             # Vitest (search/team/dataset/opponent/matchup/synergy)
npm run typecheck    # TS prüfen
```

## Git & GitHub (Stand 06.06.2026 — ✅ erledigt)

Projekt ist unter Versionskontrolle und liegt **privat** auf GitHub:
**`github.com/Bedawat/pokemon-battle-helper`** (Remote `origin` via SSH, `main`
trackt `origin/main`). Root-Commit `d2b218e`, 73 Dateien.

- `.gitignore` ergänzt (`*.tsbuildinfo` zusätzlich zum Vite-Default).
- `data/*.json` **wird mitcommittet** (ohne Netz nicht reproduzierbar, ~356 KB) —
  bewusst NICHT in `.gitignore`.
- Setup lief komplett **lokal auf Petes Mac** (init → commit → SSH-Push).

**Lessons learned (für künftige Git-Aufgaben):**
- **Agent-Sandbox kann kein lokales git auf Petes Ordner.** Der Mount erlaubt kein
  Unlink/Löschen (`rm` → „Operation not permitted"), git braucht das aber laufend
  (`index.lock`). → git-Operationen immer Pete auf dem Mac ausführen lassen.
- **Die „GitHub-Integration" ist Lese-/Kontext-only** (Dateien an Chat anhängen,
  Codebase-Sync, Repo-Auswahl in Claude Code) — **keine Write-Tools** (`create_repository`/
  `push`) im Chat verfügbar, auch nach App-Neustart nicht. Repo anlegen/pushen geht
  daher nur lokal (oder mit `gh`, das aber NICHT installiert ist).

**Künftiger Workflow:** Änderungen, die ich (Agent) in Petes Ordner schreibe, committet
und pusht **Pete** auf dem Mac (`git add -A && git commit && git push`).

**Spätere Zugriffsbeschränkung (Petes Wunsch):** Kein Schreibzugriff auf bestimmte
Repos. Richtiges Mittel = **Fine-grained Personal Access Token**: nur ausgewählte Repos
sichtbar, Berechtigungen pro Scope auf „Read-only" statt „Read and write". Sobald ein
GitHub-Connector ein solches Token akzeptiert, so einrichten.

## Petes Arbeitsstil (aus CLAUDE.md)

Warm aber direkt, gerne challengen. Bei mehrstufigen Aufgaben Plan vor Ausführung.
Nichts ohne Rückfrage senden/löschen. Akademisches Deutsch, Fachbegriffe Englisch.
Kalibrierte Sicherheit — lieber „weiß ich nicht" als raten. Klärende Fragen über
das AskUserQuestion-Tool stellen, bevor größere Arbeit startet.
