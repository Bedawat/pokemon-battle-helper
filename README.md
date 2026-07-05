# Pokémon Battle Helper

VGC-Begleit-App für **Pokémon Champions** (Doubles). Entlastet in der **Pick-Phase**
(Synergie & Matchups auf einen Blick) und im **Live-Kampf** (Typ-Effektivität,
Mega-Tracking). Entstanden als HCI-Semesterprojekt auf Basis eines
Figma-Prototyps für den Usability-Test.

> **Fan-Projekt, nicht offiziell.** Nicht mit Nintendo, Game Freak oder The Pokémon
> Company verbunden oder von ihnen unterstützt. „Pokémon" und alle Namen/Sprites
> sind Eigentum ihrer jeweiligen Rechteinhaber. Daten stammen aus öffentlichen
> Quellen (PokéAPI, Pikalytics). Rein nicht-kommerzielles Lern-/Portfolio-Projekt.

---

## Features

- **Team-Management** — mehrere Teams anlegen, bearbeiten, als aktiv markieren; Movesets pro Pokémon editieren. Persistenz via `localStorage`.
- **Gegner-Eingabe** — gegnerisches 6er-Team in Pick-Reihenfolge erfassen; deutsche **und** englische Namenssuche.
- **Synergie-Übersicht** — bewertet die eigenen Pokémon **dynamisch** gegen das Gegner-Team, abhängig von bereits gepickten Mons (Coverage-Lücken statt Redundanz). VGC-Regel: aus 6 bringst du 4.
- **Gegner-Leads** — markiere, welche zwei Gegner zu Kampfbeginn auf dem Feld stehen.
- **Live-Kampf** — Feld/Bank-Logik (2 aktiv), Typ-Effektivität, Mega-Tracking mit **One-per-Side**-Constraint.
- **Offline-fähige Logik** — Matchup-, Synergie-, Mega- und Kampf-Engine sind reine, getestete Funktionen (siehe [Tests](#tests)).

---

## Tech-Stack

- **React 18 + TypeScript**, **Vite**
- CSS Custom Properties (Design Tokens 1:1 aus Figma), CSS Modules pro Komponente
- Ziel-Gerät: iPhone (393 × 852), Hochformat, Dark-Mode-only
- Datensatz: PokéAPI (Typ-Chart) + Pikalytics (Usage/Top-Moves)

---

## Setup

Voraussetzung: Node.js ≥ 18.

```bash
npm install
npm run dev          # Dev-Server (localhost:5173)
```

Auf dem Desktop wird die App als zentrierter iPhone-Frame gezeigt; auf dem
Smartphone füllt sie den Screen.

### Auf dem iPhone im WLAN testen

```bash
npm run dev:lan      # zeigt eine Netzwerk-Adresse fürs iPhone im selben WLAN
```

---

## Scripts

| Befehl              | Zweck                                            |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Dev-Server (localhost)                           |
| `npm run dev:lan`   | Dev-Server im lokalen Netz (fürs iPhone)         |
| `npm run build`     | Production-Build (`tsc` + Vite) nach `dist/`     |
| `npm run preview`   | Production-Build lokal ansehen                   |
| `npm run typecheck` | Nur TypeScript-Typprüfung, ohne Build            |
| `npm test`          | Unit-Tests (Vitest, Watch-Modus)                 |
| `npm run test:run`  | Unit-Tests einmalig                              |
| `npm run data`      | Datensatz neu bauen (Pikalytics + PokéAPI)       |

---

## Tests

Die gesamte Kampf-/Bewertungslogik liegt in `src/lib/` als reine Funktionen und ist
mit Vitest abgedeckt (Matchup, Synergie, Mega, Live-Kampf, Team, Gegner, Suche,
Datentransforms).

```bash
npm run test:run
```

---

## Daten

Der Roster ist **nicht mehr hardcodiert**, sondern kommt aus dem vollständigen
Pokémon-Champions-Dex (alle verfügbaren Spezies + Mega-Formen, aus Bulbapedia).
Zwei Schritte:

1. **`node scripts/parse-champions-dex.mjs`** — parst `scripts/champions-source.wiki`
   (Bulbapedia-Wikitext) zu `scripts/champions-dex.json`. Typen sind hier
   **autoritativ**. Nur nötig, wenn sich der Dex ändert (neues Spiel-Update →
   `champions-source.wiki` aktualisieren, siehe unten).
2. **`npm run data`** (`node scripts/build-data.mjs`) baut den Datensatz nach `data/`:
   - `pokemon.json` — id, DE/EN-Name, Typen (aus Dex), Sprite, Mega-Formen
   - `usage.json` — **Winrate + Monthly Rank + Top-Moves** (Pikalytics, nur die ~25
     Meta-Mons des aktuellen Rankings; Rest ohne Meta-Daten). Hinweis: Pikalytics
     liefert fürs Champions-Turnierformat **keine Usage %** mehr — `usagePercent`
     ist daher meist `null`; das Grid sortiert nach `rank`.
   - `type-chart.json` — 18×18 Typ-Effektivität (PokéAPI)

**Aktuelles Format:** `gen9championsvgc2026regmb` (Regulation M-B). Bei einem neuen
Regulation-Wechsel nur `FORMAT` in `build-data.mjs` anpassen.

**Dex aktualisieren (neue Pokémon im Spiel):** die aktuelle Bulbapedia-Liste
(*List of Pokémon in Pokémon Champions*) in `scripts/champions-source.wiki`
eintragen (`{{gdex/Champs|...}}`-Zeilen, Sektionen `=== MAIN/MEGA/ROTOM ===`),
dann `parse-champions-dex.mjs` + `npm run data`. Der Daten-Build **warnt** zudem,
wenn ein Mon im Pikalytics-Ranking auftaucht, das nicht im Dex steht.

Braucht Internet (läuft auf deinem Mac, nicht im Browser). Sprites werden remote
geladen. Der volle Lauf dauert einige Minuten (~230 Spezies + Movepools).

---

## Projektstruktur

```
pokemon-battle-helper/
├── index.html
├── data/                       ← generierter Datensatz (pokemon/usage/type-chart)
├── scripts/build-data.mjs      ← Daten-Pipeline
└── src/
    ├── App.tsx                 ← Screen-Routing + App-Shell
    ├── components/             ← NavBar, Button, PokemonGrid, TypeBadge, …
    ├── screens/                ← MainMenu, OpponentInput, Synergy,
    │                              OpponentLeads, LiveBattle, TeamList,
    │                              TeamEditor, PokemonDetail
    ├── lib/                    ← reine Logik + Tests (matchup, synergy, mega,
    │                              battle, team, opponent, search, dataset)
    ├── types/                  ← Screen-, Pokémon- und Team-Typen
    └── styles/                 ← Design Tokens + globales CSS
```

---

## Lizenz

Code unter der [MIT-Lizenz](LICENSE). Die Lizenz gilt **nur für den eigenen Code**
dieses Projekts — nicht für Pokémon-bezogene Namen, Sprites oder Daten Dritter
(siehe Disclaimer oben).
