# Pokémon Battle Helper

VGC-Begleit-App für **Pokémon Champions** — entlastet in der Pick-Phase (90 s)
und im Live-Kampf (45 s/Runde). HCI-Semesterprojekt (Semester 4).

Funktionale Umsetzung des Figma-Prototyps für den Usability-Test.
Design, Screens und Logik stammen aus dem
`University Wiki` → _Pokémon Battle Helper — Web-App Handoff_.

## Tech-Stack

- **React 18 + TypeScript**
- **Vite** als Dev-Server und Build-Tool
- CSS Custom Properties (Design Tokens 1:1 aus Figma), CSS Modules pro Komponente
- Ziel-Gerät: iPhone (393 × 852), Hochformat, Dark-Mode-only

## Setup

Voraussetzung: Node.js ≥ 18.

```bash
cd pokemon-battle-helper
npm install
npm run dev
```

Dann im Browser <http://localhost:5173> öffnen. Auf dem Desktop wird die App
als zentrierter iPhone-Frame gezeigt; auf dem Smartphone füllt sie den Screen.

### Auf dem iPhone im WLAN testen

```bash
npm run dev:lan
```

Vite zeigt dann eine Netzwerk-Adresse (z. B. `http://192.168.x.x:5173`), die du
auf dem iPhone im selben WLAN öffnen kannst.

## Scripts

| Befehl              | Zweck                                            |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Dev-Server (localhost)                           |
| `npm run dev:lan`   | Dev-Server im lokalen Netz (fürs iPhone)         |
| `npm run build`     | Production-Build (`tsc` + Vite) nach `dist/`     |
| `npm run preview`   | Production-Build lokal ansehen                   |
| `npm run typecheck` | Nur TypeScript-Typprüfung, ohne Build            |
| `npm run data`      | Datensatz neu bauen (Pikalytics + PokéAPI)       |

## Daten

`npm run data` (bzw. `node scripts/build-data.mjs`) baut den Datensatz nach
`data/`:

- `pokemon.json` — id, DE/EN-Name, Typen, Sprite (~40 Pokémon der Champions-Meta)
- `usage.json` — Usage % + Top-Moves pro Pokémon (Pikalytics)
- `type-chart.json` — 18×18 Typ-Effektivität (PokéAPI)

Braucht Internet (läuft auf deinem Mac, nicht im Browser). Sprites werden
remote von PokéAPI/Pikalytics geladen, nicht ins Repo kopiert. Zum
wöchentlichen Aktualisieren der Usage-Daten einfach erneut ausführen. Das
Script gibt am Ende eine Zusammenfassung mit Warnungen aus — die bitte prüfen.

## Projektstruktur

```
pokemon-battle-helper/
├── index.html
├── src/
│   ├── main.tsx              ← Einstiegspunkt
│   ├── App.tsx               ← Screen-Routing + App-Shell
│   ├── components/
│   │   ├── NavBar.tsx        ← Bottom-Navigation (Kampf/Team)
│   │   └── Button.tsx        ← CTA-Button (primary/secondary)
│   ├── screens/
│   │   ├── MainMenu.tsx      ← S1 Hauptmenü
│   │   └── Placeholder.tsx   ← Übergang für noch nicht gebaute Screens
│   ├── types/
│   │   └── navigation.ts     ← Screen- und Tab-Definitionen
│   └── styles/
│       ├── tokens.css        ← Design Tokens (Farben, Spacing, Typo)
│       └── global.css        ← Reset, App-Frame
└── (data/, assets/ folgen in Phase 1)
```

## Status (Phasenplan)

- [x] **Phase 2** — App-Grundgerüst: Vite-Setup, Design Tokens, NavBar, Hauptmenü, Screen-Routing
- [~] **Phase 1** — Daten sammeln: Script `npm run data` fertig, muss lokal laufen + verifiziert werden
- [ ] **Phase 3** — Team-Management (S6/S7/S8)
- [ ] **Phase 4** — Gegner-Eingabe (S2)
- [ ] **Phase 5** — Matchup-Logik & Synergie (S3/S4)
- [ ] **Phase 6** — Live-Kampf (S5)
- [ ] **Phase 7** — Polish & Testing

S2–S8 sind aktuell als Platzhalter eingebaut, damit die Navigation komplett
durchklickbar ist.
