// @ts-nocheck
/**
 * parse-champions-dex.mjs — parst scripts/champions-source.wiki (Bulbapedia-Wikitext,
 * {{gdex/Champs|...}}-Templates) zu scripts/champions-dex.json.
 *
 * Ausgabe = maschinenlesbarer Champions-Dex: Basis-Spezies (inkl. funktional
 * eigenständiger Regional-/Zucht-/Rotom-Formen) mit Typen direkt aus Bulbapedia,
 * plus angehängte Mega-Formen. Dieser Dex ersetzt den hardcodierten ROSTER in
 * build-data.mjs. Typen sind hier AUTORITATIV (Bulbapedia); build-data.mjs holt
 * nur noch Sprite/Movepool/DE-Name (PokéAPI) und Usage/Top-Moves (Pikalytics).
 *
 * Reines Offline-Parsing, kein Netz.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "champions-source.wiki");
const OUT = join(__dirname, "champions-dex.json");

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/**
 * PokéAPI-Default-Slug-Overrides: Spezies, deren PokéAPI-Standardform NICHT
 * einfach der Kleinbuchstaben-Name ist. build-data.mjs holt darüber Sprite/
 * Movepool/DE-Name. Bei 404 warnt das Skript → hier ergänzen.
 */
const API_BASE_OVERRIDE = {
  basculegion: "basculegion-male",
  maushold: "maushold-family-of-four",
  aegislash: "aegislash-shield",
  gourgeist: "gourgeist-average",
  lycanroc: "lycanroc-midday",
  meowstic: "meowstic-male",
  mimikyu: "mimikyu-disguised",
  morpeko: "morpeko-full-belly",
  palafin: "palafin-zero",
  eiscue: "eiscue-ice",
  "mr-rime": "mr-rime",
};

/**
 * Korrektur der id → PokéAPI-Slug, wo PokéAPI von unserer sauberen id abweicht
 * (gegen die PokéAPI-Namensliste verifiziert). Die id bleibt kurz/sauber, nur
 * der Fetch-Slug wird angepasst.
 */
const POKEAPI_SLUG_FIX = {
  "tauros-paldea-combat": "tauros-paldea-combat-breed",
  "tauros-paldea-blaze": "tauros-paldea-blaze-breed",
  "tauros-paldea-aqua": "tauros-paldea-aqua-breed",
  pyroar: "pyroar-male",
  "vivillon-high-plains": "vivillon", // PokéAPI führt nur die Basis-Form
};

/** ig=-Form-Suffix → PokéAPI-Slug-Suffix (Regional-/Zucht-/Rotom-/Mega-Formen). */
function apiSuffixFromIg(ig) {
  if (!ig) return "";
  const m = ig.replace(/^-/, "").trim().toLowerCase();
  const map = {
    alola: "-alola",
    galar: "-galar",
    hisui: "-hisui",
    "paldea combat": "-paldea-combat",
    "paldea blaze": "-paldea-blaze",
    "paldea aqua": "-paldea-aqua",
    heat: "-heat",
    wash: "-wash",
    frost: "-frost",
    fan: "-fan",
    mow: "-mow",
    mega: "-mega",
    "mega x": "-mega-x",
    "mega y": "-mega-y",
  };
  return map[m] ?? `-${m.replace(/\s+/g, "-")}`;
}

/** Baut den PokéAPI-Slug für eine Basis-/Formen-Zeile (kein Mega). */
function apiSlugFor(name, ig) {
  const base = slug(name);
  const suffix = apiSuffixFromIg(ig);
  if (suffix) return base + suffix;
  return API_BASE_OVERRIDE[base] ?? base;
}

/** Parst eine {{gdex/Champs|...}}-Zeile in ein Objekt. */
function parseGdex(line) {
  const inner = line.trim().replace(/^\{\{gdex\/Champs\|/, "").replace(/\}\}$/, "");
  const parts = inner.split("|").map((p) => p.trim());
  const dex = parts[0];
  const name = parts[1];
  const numTypes = parseInt(parts[2], 10);
  const types = [];
  let i = 3;
  for (let t = 0; t < numTypes; t++) types.push(parts[i++].toLowerCase());
  // Rest: flags (ig=, form=) + availability + version, Reihenfolge variabel.
  let ig = null;
  let form = null;
  let availability = null;
  let version = null;
  for (; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("ig=")) ig = p.slice(3);
    else if (p.startsWith("form=")) form = p.slice(5);
    else if (/^\d+\.\d+\.\d+$/.test(p)) version = p;
    else if (/^(Yes|No|Transfer only|Event only)/i.test(p)) availability = p;
  }
  return { dex, name, types, ig, form, availability, version };
}

async function main() {
  const raw = await readFile(SRC, "utf8");
  const lines = raw.split("\n");

  let section = null;
  const speciesById = new Map(); // id -> entry
  const megaByDex = new Map(); // dex -> [mega,...]
  let speciesCount = 0;
  let megaCount = 0;

  for (const line of lines) {
    if (/^=== (\w+) ===/.test(line)) {
      section = line.match(/^=== (\w+) ===/)[1];
      continue;
    }
    if (!line.trim().startsWith("{{gdex/Champs")) continue;
    const g = parseGdex(line);

    if (section === "MEGA") {
      megaCount++;
      const label = g.form.replace(/^Mega\s+/, "") // "Charizard X" / "Venusaur"
        .replace(new RegExp(`^${g.name}\\s*`), "").trim();
      const megaId = apiSlugFor(g.name, g.ig); // z. B. charizard-mega-x
      const apiMegaSlug = megaId; // Versuchs-Slug; nur offizielle Megas existieren
      const entry = {
        id: megaId,
        label: label ? `Mega ${label}` : "Mega",
        apiSlug: apiMegaSlug,
        types: g.types,
        version: g.version,
      };
      const list = megaByDex.get(g.dex) ?? [];
      list.push(entry);
      megaByDex.set(g.dex, list);
    } else {
      // MAIN + ROTOM: Basis-Spezies bzw. eigenständige Form.
      speciesCount++;
      const id = apiSlugFor(g.name, g.ig);
      speciesById.set(id, {
        id,
        dex: g.dex,
        nameEn: g.name + (g.form ? "" : ""),
        apiSlug: POKEAPI_SLUG_FIX[id] ?? id,
        form: g.form ?? null,
        types: g.types,
        availability: g.availability ?? "Yes",
        version: g.version,
        // Basis-Spezies-Slug (ohne Form) für Mega-Zuordnung:
        _baseSlug: slug(g.name),
        megas: [],
      });
    }
  }

  // Megas den Basis-Spezies zuordnen (per dex + Basis-Name, NICHT Regionalform).
  for (const [dex, megas] of megaByDex) {
    // Ziel: Eintrag mit gleichem dex, dessen id == _baseSlug (die Grundform).
    const target = [...speciesById.values()].find(
      (e) => e.dex === dex && e.id === e._baseSlug,
    );
    if (target) {
      target.megas = megas;
    } else {
      // Fallback: erster Eintrag mit dem dex.
      const any = [...speciesById.values()].find((e) => e.dex === dex);
      if (any) any.megas = megas;
      else console.warn(`⚠ Mega ohne Basis-Spezies: dex ${dex}`);
    }
  }

  const pokemon = [...speciesById.values()].map(({ _baseSlug, ...rest }) => rest);
  pokemon.sort((a, b) => a.dex.localeCompare(b.dex));

  const out = {
    meta: {
      source: "bulbapedia (List of Pokémon in Pokémon Champions)",
      generated: new Date().toISOString(),
      speciesEntries: pokemon.length,
      megaForms: megaCount,
    },
    pokemon,
  };
  await writeFile(OUT, JSON.stringify(out, null, 2));

  console.log(`Spezies-Einträge (MAIN+ROTOM): ${speciesCount}`);
  console.log(`Mega-Formen: ${megaCount}`);
  console.log(`Spezies mit ≥1 Mega: ${pokemon.filter((p) => p.megas.length).length}`);
  console.log(`→ ${OUT}`);

  // Stichproben-Checks
  const samples = ["basculegion-male", "maushold-family-of-four", "aegislash-shield", "rotom-wash", "tauros-paldea-blaze", "raichu-alola", "mr-rime", "charizard"];
  for (const id of samples) {
    const p = pokemon.find((x) => x.id === id);
    console.log(
      `  ${id.padEnd(22)} ${p ? p.types.join("/") + (p.megas.length ? "  megas: " + p.megas.map((m) => m.id).join(",") : "") : "❌ FEHLT"}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
