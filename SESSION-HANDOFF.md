# Session-Handoff — Pokémon Battle Helper (Stand 05.06.2026)

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

Phasen 1–6 verifiziert grün — der funktionale Prototyp ist fertig (alle drei User
Journeys laufen). Es bleibt **Phase 7 (Polish & Testing)** vor dem Usability-Test.
Offene Punkte siehe Backlog.

## Backlog / Offene Punkte (später, nicht blockierend)

- **Floette-Sprite fehlt** — bei Floette (Champions-Mega ohne PokéAPI-Slug) lädt
  kein Bild. Vermutlich Pikalytics-CDN-URL falsch/leer. In `build-data.mjs` den
  Sprite-Fallback für die Champions-Megas prüfen (ggf. manuell hinterlegen).
- **Mega-Entwicklungen in der Pick-Phase** — bei der Champion-/Gegner-Auswahl ist
  nur das Basis-Pokémon sichtbar (z. B. „Glurak"), **nicht** welche Mega der Gegner
  mitnimmt (Glurak-X = Feuer/Drache vs. Glurak-Y = Feuer/Flug). Das ändert die
  Typen und damit die Matchup-Bewertung. Aktuell stehen einzelne Mega-Formen als
  eigene Einträge im Datensatz — Konzept fehlt noch, wie wir Basis-Form vs.
  ungewisse Mega in der Gegner-Eingabe und im Matchup darstellen. Designentscheidung
  vor sauberer Umsetzung nötig (z. B. Basis-Form picken + im Live-Kampf Mega-Variante
  wählen, oder beide Mega-Matchups anzeigen).
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

## Git & GitHub (Stand 06.06.2026 — offen)

Ziel: Projekt unter Versionskontrolle und als **privates** GitHub-Repo sichtbar.

**Erledigt:**
- `.gitignore` ergänzt (`*.tsbuildinfo` zusätzlich zum Vite-Default). Liegt im Ordner.
- Entscheidung Pete: `data/*.json` **wird mitcommittet** (ohne Netz nicht reproduzierbar,
  ~356 KB) → bewusst NICHT in `.gitignore`.

**Blocker 1 — lokales git aus der Agent-Sandbox geht nicht.** Der Mount auf Petes
Ordner erlaubt **kein Unlink/Löschen** von Dateien (`rm` → „Operation not permitted",
selbst auf frisch angelegten Dateien). Git braucht aber ständig Unlink (`index.lock`
etc.), deshalb hängt jeder Commit. Ein von mir angefangenes `.git/` mit klemmendem
`index.lock` liegt evtl. noch im Ordner → Pete macht `rm -rf .git` und initialisiert frisch.

**Blocker 2 — GitHub-Connector bringt keine Write-Tools.** Pete hat die
„GitHub-Integration" verbunden (gleiche Ebene wie Google Calendar). Laut Beschreibung
ist das eine **Lese-/Kontext-Integration** (Repo-Dateien an Chat anhängen, Codebase als
Projekt-Kontext syncen, Repo-/Branch-/PR-Auswahl in Claude Code) — **kein MCP mit
`create_repository`/`push`**. Auch nach App-Neustart sind bei mir keine GitHub-Tools
aufgetaucht (mehrfach per ToolSearch geprüft). Erwartung: Ein neuer Chat zeigt sie
vermutlich auch nicht, weil diese Integration sie schlicht nicht mitbringt.

**TODO für nächsten Chat / Pete:**
1. (Optional) In neuem Chat checken, ob doch GitHub-Write-Tools auftauchen.
2. Wenn nicht (erwartbar): Repo lokal auf dem Mac anlegen + pushen. `gh` ist NICHT
   installiert → entweder `gh` installieren oder leeres Repo auf github.com anlegen.

```bash
cd "/Users/peter/Projects/CoworkPlayground/pokemon-battle-helper"
rm -rf .git && git init -b main
git config user.name "Pete"
git config user.email "peter.waetzel@gmail.com"
git add -A && git commit -m "Initial commit: Pokémon Battle Helper Prototyp (Phasen 1-7)"
# leeres PRIVATES Repo auf github.com anlegen (ohne README/gitignore), dann:
git remote add origin git@github.com:<dein-user>/pokemon-battle-helper.git
git push -u origin main
```

**Spätere Zugriffsbeschränkung (Petes Wunsch):** Kein Schreibzugriff auf bestimmte
Repos. Richtiges Mittel = **Fine-grained Personal Access Token**: nur ausgewählte Repos
sichtbar, Berechtigungen pro Scope auf „Read-only" statt „Read and write". Sobald ein
GitHub-Connector ein solches Token akzeptiert, so einrichten.

## Petes Arbeitsstil (aus CLAUDE.md)

Warm aber direkt, gerne challengen. Bei mehrstufigen Aufgaben Plan vor Ausführung.
Nichts ohne Rückfrage senden/löschen. Akademisches Deutsch, Fachbegriffe Englisch.
Kalibrierte Sicherheit — lieber „weiß ich nicht" als raten. Klärende Fragen über
das AskUserQuestion-Tool stellen, bevor größere Arbeit startet.
