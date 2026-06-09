// @ts-nocheck
/**
 * build-data.mjs — baut den Datensatz für den Battle Helper.
 *
 * Quellen:
 *   - Pikalytics (gen9championsvgc2026regma): Usage %, Top-Attacken UND Typen
 *     (inkl. der Champions-eigenen Mega-Formen) + Sprite.
 *   - PokéAPI: deutsche Namen, Official-Artwork-Sprites, Typ-Effektivitäts-Matrix.
 *
 * Ausgabe (nach ../data/):
 *   - pokemon.json     statische Daten (id, Namen, Typen, Sprite)
 *   - usage.json       Usage % + Top-Moves pro Pokémon
 *   - type-chart.json  18×18 Typ-Effektivität
 *
 * Ausführen (Node ≥ 18, hat globales fetch):
 *   node scripts/build-data.mjs
 *
 * Robustheit: Pikalytics wird über den SICHTBAREN TEXT geparst (Tags entfernt),
 * nicht über CSS-Klassen. Bei Lücken kommen Warnungen am Ende.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

const FORMAT = "gen9championsvgc2026regma";
const PIKALYTICS_BASE = `https://www.pikalytics.com/pokedex/${FORMAT}`;
const POKEAPI = "https://pokeapi.co/api/v2";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

/**
 * Roster (~Top 40 der Champions-Meta, Stand Mai 2026), Spezies-Modell (Phase 9).
 *
 * Zwei Eintrags-Formen:
 *  1. Nicht-Mega: Tupel [Pikalytics-Name, PokéAPI-Slug].
 *     Typen kommen von Pikalytics, Sprite + Movepool + DE-Name von PokéAPI.
 *  2. Mega-fähige Spezies: Objekt
 *       { species, base, usage, megas: [{ label, api } | { label, pika }] }
 *     - `base`  PokéAPI-Slug der **Grund-Form** → Grund-Typen, Grund-Sprite,
 *               Movepool, DE-Name. (Pick-Phase rechnet mit den Grund-Typen.)
 *     - `usage` Pikalytics-Seite, von der Usage % + Top-Moves gezogen werden
 *               (im Champions-Meta unter dem **Mega**-Namen gelistet, nicht unter
 *               der Grund-Form). Top-Moves sind Spezies-Ebene (vor der Mega gewählt).
 *     - `megas` je Variante: `api` (PokéAPI-Slug → Typen + Mega-Artwork) ODER
 *               `pika` (Champions-eigene Mega ohne PokéAPI-Eintrag → Typen +
 *               Sprite von der Pikalytics-Seite).
 *
 * Hinweis: Im aktuellen Meta hat nur Glurak zwei Megas (X/Y). Das Modell trägt
 * generisch N Mega-Formen pro Spezies.
 */
const ROSTER = [
  // --- Nicht-Mega ---
  ["Basculegion", "basculegion-male"],
  ["Kingambit", "kingambit"],
  ["Garchomp", "garchomp"],
  ["Sneasler", "sneasler"],
  ["Incineroar", "incineroar"],
  ["Sinistcha", "sinistcha"],
  ["Sylveon", "sylveon"],
  ["Whimsicott", "whimsicott"],
  ["Archaludon", "archaludon"],
  ["Farigiraf", "farigiraf"],
  ["Pelipper", "pelipper"],
  ["Sableye", "sableye"],
  ["Maushold", "maushold-family-of-four"],
  ["Aegislash", "aegislash-shield"],
  ["Rotom-Wash", "rotom-wash"],
  ["Talonflame", "talonflame"],
  ["Kommo-o", "kommo-o"],
  ["Vivillon", "vivillon"],
  ["Corviknight", "corviknight"],
  ["Hydreigon", "hydreigon"],
  ["Arcanine-Hisui", "arcanine-hisui"],
  ["Oranguru", "oranguru"],
  ["Araquanid", "araquanid"],
  ["Politoed", "politoed"],
  ["Glimmora", "glimmora"],

  // --- Mega-fähige Spezies (PokéAPI-Megas) ---
  {
    species: "Charizard",
    base: "charizard",
    usage: "Charizard-Mega-Y",
    megas: [
      { label: "Mega X", api: "charizard-mega-x" },
      { label: "Mega Y", api: "charizard-mega-y" },
    ],
  },
  { species: "Aerodactyl", base: "aerodactyl", usage: "Aerodactyl-Mega", megas: [{ label: "Mega", api: "aerodactyl-mega" }] },
  { species: "Blastoise", base: "blastoise", usage: "Blastoise-Mega", megas: [{ label: "Mega", api: "blastoise-mega" }] },
  { species: "Tyranitar", base: "tyranitar", usage: "Tyranitar-Mega", megas: [{ label: "Mega", api: "tyranitar-mega" }] },
  { species: "Scizor", base: "scizor", usage: "Scizor-Mega", megas: [{ label: "Mega", api: "scizor-mega" }] },
  { species: "Gardevoir", base: "gardevoir", usage: "Gardevoir-Mega", megas: [{ label: "Mega", api: "gardevoir-mega" }] },
  { species: "Kangaskhan", base: "kangaskhan", usage: "Kangaskhan-Mega", megas: [{ label: "Mega", api: "kangaskhan-mega" }] },
  { species: "Venusaur", base: "venusaur", usage: "Venusaur-Mega", megas: [{ label: "Mega", api: "venusaur-mega" }] },
  { species: "Camerupt", base: "camerupt", usage: "Camerupt-Mega", megas: [{ label: "Mega", api: "camerupt-mega" }] },
  { species: "Abomasnow", base: "abomasnow", usage: "Abomasnow-Mega", megas: [{ label: "Mega", api: "abomasnow-mega" }] },
  { species: "Gengar", base: "gengar", usage: "Gengar-Mega", megas: [{ label: "Mega", api: "gengar-mega" }] },
  { species: "Steelix", base: "steelix", usage: "Steelix-Mega", megas: [{ label: "Mega", api: "steelix-mega" }] },

  // --- Mega-fähige Spezies (Champions-eigene Megas, kein PokéAPI-Eintrag) ---
  { species: "Floette", base: "floette", usage: "Floette-Mega", megas: [{ label: "Mega", pika: "Floette-Mega" }] },
  { species: "Dragonite", base: "dragonite", usage: "Dragonite-Mega", megas: [{ label: "Mega", pika: "Dragonite-Mega" }] },
  { species: "Skarmory", base: "skarmory", usage: "Skarmory-Mega", megas: [{ label: "Mega", pika: "Skarmory-Mega" }] },
  { species: "Froslass", base: "froslass", usage: "Froslass-Mega", megas: [{ label: "Mega", pika: "Froslass-Mega" }] },
];

/** Letzter Notnagel für Typen, falls Pikalytics-/PokéAPI-Parsing fehlschlägt. */
const TYPE_OVERRIDES = {
  // Champions-Mega-Formen (id der Mega-Form):
  "floette-mega": ["fairy"],
  // Grund-Formen (Spezies-id) — greifen nur, wenn PokéAPI keine Typen liefert:
  // (i. d. R. nicht nötig, PokéAPI ist hier zuverlässig)
};

const slug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Leitet den Spezies-Slug (für DE-Namen) aus dem Form-Namen ab. */
function speciesSlug(name) {
  return slug(name)
    .replace(/-mega(-[xy])?$/, "")
    .replace(/-(hisui|alola|galar|paldea)$/, "")
    .replace(/-(wash|heat|frost|mow|fan)$/, "")
    .replace(/-(family-of-four|family-of-three)$/, "")
    .replace(/-(shield|blade)$/, "")
    .replace(/-(average|small|large|super)$/, "");
}

/** Zerlegt "waterghost" → ["water","ghost"] (greedy longest match). */
function typesFromConcat(s) {
  const out = [];
  let rest = s.toLowerCase();
  while (rest.length && out.length < 2) {
    let best = null;
    for (const t of TYPES) {
      if (rest.startsWith(t) && (!best || t.length > best.length)) best = t;
    }
    if (!best) break;
    out.push(best);
    rest = rest.slice(best.length);
  }
  return out;
}

/** Entfernt <script>/<style> und alle Tags, dekodiert die wichtigsten Entities. */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "battle-helper-data-build/0.1 (HCI student project)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Baut die 18×18-Typ-Matrix aus PokéAPI. */
async function buildTypeChart() {
  const chart = {};
  for (const t of TYPES) {
    const rel = (await fetchJson(`${POKEAPI}/type/${t}`)).damage_relations;
    const row = {};
    for (const x of rel.double_damage_to) row[x.name] = 2;
    for (const x of rel.half_damage_to) row[x.name] = 0.5;
    for (const x of rel.no_damage_to) row[x.name] = 0;
    chart[t] = row;
    await sleep(50);
  }
  return chart;
}

/** Parst Typen, Usage %, Sprite und Top-Moves von einer Pikalytics-Detailseite. */
function parsePikalyticsDetail(html, pikalyticsName) {
  const flat = htmlToText(html).replace(/\s+/g, " ").trim();

  // Eigene Typen: erste zusammenhängende Typ-Badges im HTML, z. B.
  // <span class="type water" aria-hidden="true">water</span><span class="type ghost" …>
  // Die exakte Quote nach dem Typnamen schließt Filter-Chips
  // (class="type water pokedex-type-chip-offset") und andere Widgets aus.
  let types = [];
  const badgeBlock = html.match(
    /(?:<span class="type [a-z]+"[^>]*>[^<]*<\/span>\s*){1,2}/i,
  );
  if (badgeBlock) {
    types = [...badgeBlock[0].matchAll(/class="type ([a-z]+)"/gi)]
      .map((m) => m[1].toLowerCase())
      .filter((t) => TYPES.includes(t))
      .slice(0, 2);
  }

  // Usage %: "Usage Percent … 38%"
  let usagePercent = null;
  const usageMatch = flat.match(/Usage Percent\s*([\d.]+)\s*%/i);
  if (usageMatch) usagePercent = parseFloat(usageMatch[1]);

  // Sprite (Pikalytics-CDN) als Fallback
  let pikaSprite = null;
  const spriteMatch = html.match(/championssprites\/([a-z0-9_]+)\.png/i);
  if (spriteMatch) {
    pikaSprite = `https://cdn.pikalytics.com/images/championssprites/${spriteMatch[1]}.png`;
  }

  // Top-Moves zwischen "Best Moves" und der nächsten Sektion
  const topMoves = [];
  const start = flat.search(/Best Moves for/i);
  if (start !== -1) {
    let block = flat.slice(start);
    const end = block.search(/Best (Teammates|Items|Abilities|EV)/i);
    if (end !== -1) block = block.slice(0, end);
    const escName = pikalyticsName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    block = block
      .replace(new RegExp(`Best Moves for\\s+${escName}`, "i"), " ")
      .replace(/Best Moves for/i, " ");
    const typeAlt = TYPES.join("|");
    const re = new RegExp(
      `([A-Za-z][A-Za-z'’.\\- ]*?)\\s+(${typeAlt})\\s+(\\d{1,3}(?:\\.\\d+)?)%`,
      "gi",
    );
    let m;
    while ((m = re.exec(block)) !== null && topMoves.length < 4) {
      const name = m[1].trim().replace(/\s+/g, " ");
      if (/^other$/i.test(name) || name.length < 2) continue;
      topMoves.push({ name, type: m[2].toLowerCase(), usagePercent: parseFloat(m[3]) });
    }
  }

  return { types, usagePercent, pikaSprite, topMoves };
}

/**
 * Holt Typen, Sprite (Official Artwork) UND die Movepool-Slugs in einem Fetch.
 * Typen in Slot-Reihenfolge (Primär zuerst). Bei Fehler leere Defaults.
 * Gibt { types, sprite, moveSlugs } zurück.
 */
async function fetchPokemonApi(apiSlug) {
  try {
    const mon = await fetchJson(`${POKEAPI}/pokemon/${apiSlug}`);
    const types = (mon.types ?? [])
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type?.name)
      .filter((t) => TYPES.includes(t))
      .slice(0, 2);
    const sprite = mon.sprites?.other?.["official-artwork"]?.front_default ?? null;
    const moveSlugs = (mon.moves ?? []).map((m) => m.move.name);
    return { types, sprite, moveSlugs };
  } catch {
    return { types: [], sprite: null, moveSlugs: [] };
  }
}

/** Gültige Schadensklassen (PokéAPI `damage_class`). */
const MOVE_CATEGORIES = ["physical", "special", "status"];

/**
 * Deutsche Namen für Moves, die PokéAPI (noch) nicht auf Deutsch lokalisiert hat —
 * v. a. neue Gen-8/9-Moves. Greift nur als Fallback, wenn PokéAPI keinen `de`-Namen
 * liefert (eine echte PokéAPI-Lokalisierung schlägt den Override). Schlüssel =
 * `moveKey(englischer Name)`, Werte gegen pokemondb.net verifiziert (Stand 07.06.2026).
 * Hinweis: „Throat Chop" heißt auf Deutsch offiziell „Neck Strike" — das liefert
 * PokéAPI bereits korrekt, daher steht es bewusst NICHT hier.
 */
const MOVE_DE_OVERRIDES = {
  lastrespects: "Letzte Ehre",
  wavecrash: "Wellentackle",
  kowtowcleave: "Kniefallspalter",
  direclaw: "Unheilsklauen",
  matchagotcha: "Quirlschuss",
  terablast: "Tera-Ausbruch",
  snowscape: "Schneelandschaft",
  chillingwater: "Kalte Dusche",
  trailblaze: "Wegbereiter",
  twinbeam: "Doppelstrahl",
  populationbomb: "Mäuseplage",
  tidyup: "Aufräumen",
  pounce: "Anspringen",
  ragingfury: "Flammenwut",
  mortalspin: "Letalwirbler",
  icespinner: "Eiskreisel",
};

/** Normalisierter Schlüssel für den Abgleich von Move-Namen (Pikalytics ↔ PokéAPI). */
const moveKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** PokéAPI-Slug aus einem Anzeigenamen ("Wave Crash" → "wave-crash"). */
const moveNameSlug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Slug-Kandidaten für einen (evtl. mit Pokémon-Namen verunreinigten) Top-Move-Namen.
 * Liefert den vollen Namen plus alle Suffixe — so wird sowohl ein neuer Move geholt,
 * der nicht im PokéAPI-Movepool steht (z. B. "Wave Crash"), als auch der echte Move
 * hinter dem Pikalytics-Präfix-Artefakt ("Mega Charizard Y Heat Wave" → "heat-wave").
 */
const topMoveSlugCandidates = (name) => {
  const words = name.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const slug = moveNameSlug(words.slice(i).join(" "));
    if (slug) out.push(slug);
  }
  return out;
};

/**
 * Holt Typ, englischen Anzeigenamen und Schadensklasse einer Attacke von PokéAPI.
 * Gibt { name, type, category } zurück oder null (z. B. 404 / unbekannter Typ).
 */
async function fetchMoveInfo(moveSlug) {
  try {
    const mv = await fetchJson(`${POKEAPI}/move/${moveSlug}`);
    const type = mv.type?.name;
    if (!type || !TYPES.includes(type)) return null;
    const en = mv.names?.find((n) => n.language.name === "en")?.name;
    const de = mv.names?.find((n) => n.language.name === "de")?.name;
    // Fallback: Slug entkernen ("close-combat" → "Close Combat").
    const name =
      en ??
      moveSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    // Deutscher Anzeigename: PokéAPI → manueller Override → (engl.) Name als Fallback.
    const override = MOVE_DE_OVERRIDES[moveKey(name)];
    const nameDe = de ?? override ?? name;
    const hasDe = Boolean(de || override);
    const cat = mv.damage_class?.name;
    const category = MOVE_CATEGORIES.includes(cat) ? cat : undefined;
    return { name, nameDe, hasDe, type, category };
  } catch {
    return null;
  }
}

/** Holt den deutschen Namen über die Spezies. */
async function fetchNameDe(species) {
  try {
    const data = await fetchJson(`${POKEAPI}/pokemon-species/${species}`);
    return data.names.find((n) => n.language.name === "de")?.name ?? null;
  } catch {
    return null;
  }
}

/** Holt + parst eine Pikalytics-Detailseite (mit Fehler-Warnung). */
async function loadPikalytics(name, warnings) {
  let detail = { types: [], usagePercent: null, pikaSprite: null, topMoves: [] };
  try {
    const html = await fetchText(`${PIKALYTICS_BASE}/${name}`);
    detail = parsePikalyticsDetail(html, name);
  } catch (e) {
    warnings.push(`${name}: Pikalytics-Fehler (${e.message})`);
  }
  return detail;
}

/**
 * Verarbeitet einen Nicht-Mega-Eintrag [Pikalytics-Name, PokéAPI-Slug].
 * Typen von Pikalytics, Sprite + Movepool + DE-Name von PokéAPI. (Wie bisher.)
 */
async function processNonMega([name, apiSlug], ctx) {
  const { pokemon, usage, warnings, moveSlugsById } = ctx;
  const id = slug(name);
  process.stdout.write(`→ ${name} … `);

  const detail = await loadPikalytics(name, warnings);
  if (detail.topMoves.length === 0) warnings.push(`${name}: keine Moves geparst`);
  if (detail.usagePercent === null) warnings.push(`${name}: kein Usage % geparst`);

  let types = detail.types;
  if (types.length === 0) {
    if (TYPE_OVERRIDES[id]) types = TYPE_OVERRIDES[id];
    else warnings.push(`${name}: keine Typen geparst — BITTE PRÜFEN`);
  }

  const api = apiSlug
    ? await fetchPokemonApi(apiSlug)
    : { types: [], sprite: null, moveSlugs: [] };
  const sprite = api.sprite ?? detail.pikaSprite;
  if (!sprite) warnings.push(`${name}: kein Sprite gefunden`);
  moveSlugsById[id] = api.moveSlugs;

  const nameDe = (await fetchNameDe(speciesSlug(name))) ?? name;

  pokemon.push({ id, nameEn: name, nameDe, types, sprite: sprite ?? "", movepool: [], megas: [] });
  usage.push({ id, nameEn: name, usagePercent: detail.usagePercent, topMoves: detail.topMoves });

  console.log(
    `${types.join("/") || "?"}  usage ${detail.usagePercent ?? "?"}%  moves ${detail.topMoves.length}  pool ${api.moveSlugs.length}`,
  );
}

/**
 * Verarbeitet eine mega-fähige Spezies { species, base, usage, megas }.
 * Grund-Typen/-Sprite/-Movepool/-DE-Name aus PokéAPI (base); Usage + Top-Moves
 * von der Mega-Pikalytics-Seite (Spezies-Ebene); pro Mega Typen + Artwork aus
 * PokéAPI (api) bzw. Pikalytics (pika, Champions-Megas).
 */
async function processMegaSpecies(spec, ctx) {
  const { pokemon, usage, warnings, moveSlugsById } = ctx;
  const id = slug(spec.species);
  const name = spec.species;
  process.stdout.write(`→ ${name} (Mega-Spezies) … `);

  // Usage + Top-Moves von der Mega-Seite (im Champions-Meta dort gelistet).
  const usageDetail = await loadPikalytics(spec.usage, warnings);
  if (usageDetail.topMoves.length === 0) warnings.push(`${name}: keine Moves geparst (${spec.usage})`);
  if (usageDetail.usagePercent === null) warnings.push(`${name}: kein Usage % geparst (${spec.usage})`);

  // Grund-Form aus PokéAPI: Typen, Sprite, Movepool.
  const base = await fetchPokemonApi(spec.base);
  let baseTypes = base.types;
  if (baseTypes.length === 0) {
    if (TYPE_OVERRIDES[id]) baseTypes = TYPE_OVERRIDES[id];
    else warnings.push(`${name}: keine Grund-Typen von PokéAPI (${spec.base}) — BITTE PRÜFEN`);
  }
  const baseSprite = base.sprite ?? usageDetail.pikaSprite;
  if (!baseSprite) warnings.push(`${name}: kein Grund-Sprite gefunden`);
  moveSlugsById[id] = base.moveSlugs;

  const nameDe = (await fetchNameDe(speciesSlug(spec.species))) ?? name;

  // Mega-Formen.
  const megas = [];
  for (const m of spec.megas) {
    if (m.api) {
      const mApi = await fetchPokemonApi(m.api);
      if (mApi.types.length === 0) warnings.push(`${name}/${m.label}: keine Mega-Typen (${m.api})`);
      if (!mApi.sprite) warnings.push(`${name}/${m.label}: kein Mega-Artwork (${m.api})`);
      megas.push({ id: slug(m.api), label: m.label, types: mApi.types, sprite: mApi.sprite ?? "" });
      await sleep(120);
    } else {
      // Champions-Mega: eigene Pikalytics-Seite (== usage-Seite, falls gleicher Name).
      const mDetail = m.pika === spec.usage ? usageDetail : await loadPikalytics(m.pika, warnings);
      const megaId = slug(m.pika);
      let mTypes = mDetail.types;
      if (mTypes.length === 0) mTypes = TYPE_OVERRIDES[megaId] ?? [];
      if (mTypes.length === 0) warnings.push(`${name}/${m.label}: keine Mega-Typen (${m.pika})`);
      if (!mDetail.pikaSprite) warnings.push(`${name}/${m.label}: kein Mega-Sprite (${m.pika})`);
      megas.push({ id: megaId, label: m.label, types: mTypes, sprite: mDetail.pikaSprite ?? "" });
      if (m.pika !== spec.usage) await sleep(120);
    }
  }

  pokemon.push({ id, nameEn: name, nameDe, types: baseTypes, sprite: baseSprite ?? "", movepool: [], megas });
  usage.push({ id, nameEn: name, usagePercent: usageDetail.usagePercent, topMoves: usageDetail.topMoves });

  console.log(
    `base ${baseTypes.join("/") || "?"}  megas [${megas.map((x) => x.types.join("/") || "?").join(", ")}]  usage ${usageDetail.usagePercent ?? "?"}%  moves ${usageDetail.topMoves.length}  pool ${base.moveSlugs.length}`,
  );
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  console.log("→ Typ-Effektivitäts-Matrix von PokéAPI …");
  const typeChart = await buildTypeChart();

  const pokemon = [];
  const usage = [];
  const warnings = [];
  /** Pro Pokémon gesammelte Movepool-Slugs (PokéAPI) für die 2. Phase. */
  const moveSlugsById = {};

  const ctx = { pokemon, usage, warnings, moveSlugsById };
  for (const entry of ROSTER) {
    if (Array.isArray(entry)) {
      await processNonMega(entry, ctx);
    } else {
      await processMegaSpecies(entry, ctx);
    }
    await sleep(350); // höflich zu Pikalytics
  }

  // --- Movepool-Auflösung: alle eindeutigen Move-Slugs einmal von PokéAPI holen ---
  // Zusätzlich Slugs aus den Pikalytics-Top-Move-Namen (inkl. Suffix-Kandidaten),
  // damit auch Moves übersetzt werden, die nicht im PokéAPI-Movepool stehen, und das
  // Präfix-Artefakt ("Mega Charizard Y Heat Wave") über "heat-wave" aufgelöst wird.
  const topMoveSlugs = usage.flatMap((u) =>
    u.topMoves.flatMap((mv) => topMoveSlugCandidates(mv.name)),
  );
  const allSlugs = [
    ...new Set([...Object.values(moveSlugsById).flat(), ...topMoveSlugs]),
  ];
  console.log(`\n→ ${allSlugs.length} eindeutige Attacken von PokéAPI auflösen …`);
  const moveInfo = {}; // slug → { name, type, category }
  let done = 0;
  for (const ms of allSlugs) {
    const info = await fetchMoveInfo(ms);
    if (info) moveInfo[ms] = info;
    if (++done % 25 === 0) process.stdout.write(`  … ${done}/${allSlugs.length}\n`);
    await sleep(30);
  }

  // EN-Name → Kategorie bzw. DE-Name (für den Abgleich der Pikalytics-Top-Moves,
  // die nur über den englischen Anzeigenamen vorliegen — nicht über einen Slug).
  const categoryByName = {};
  const deByName = {};
  for (const info of Object.values(moveInfo)) {
    if (info.category) categoryByName[moveKey(info.name)] = info.category;
    if (info.nameDe) deByName[moveKey(info.name)] = info.nameDe;
  }

  // Stragglers melden: Moves ohne deutschen Namen (weder PokéAPI noch Override).
  // → ggf. in MOVE_DE_OVERRIDES (oben) ergänzen. Pikalytics-Präfix-Artefakte
  // ("Mega …") ausgenommen, die löst der Suffix-Match unten auf.
  const untranslated = Object.values(moveInfo)
    .filter((info) => !info.hasDe)
    .map((info) => info.name);
  if (untranslated.length > 0) {
    warnings.push(`Ohne deutschen Move-Namen: ${[...new Set(untranslated)].join(", ")}`);
  }

  // Top-Moves (Pikalytics, englisch) auf Deutsch übersetzen + Schadensklasse
  // anreichern. Suffix-Match (längster Treffer zuerst) räumt das Pikalytics-Präfix-
  // Artefakt ab — z. B. "Mega Charizard Y Heat Wave" → "Heat Wave" → "Hitzewelle".
  // Kein Treffer → englischer Name bleibt stehen (Safe Default).
  for (const u of usage) {
    for (const mv of u.topMoves) {
      const words = mv.name.split(/\s+/).filter(Boolean);
      for (let i = 0; i < words.length; i++) {
        const key = moveKey(words.slice(i).join(" "));
        if (deByName[key] || categoryByName[key]) {
          if (categoryByName[key]) mv.category = categoryByName[key];
          if (deByName[key]) mv.name = deByName[key];
          break;
        }
      }
    }
  }

  // Movepool je Pokémon bauen (Name+Typ+Kategorie, alphabetisch). Slug-Fehlschläge ignorieren.
  for (const mon of pokemon) {
    const slugs = moveSlugsById[mon.id] ?? [];
    let pool = slugs
      .map((s) => moveInfo[s])
      .filter(Boolean)
      .map((m) => ({ name: m.nameDe ?? m.name, type: m.type, category: m.category }));
    // Fallback für Pokémon ohne PokéAPI-Movepool (Champions-Megas): Top-4 nutzen.
    if (pool.length === 0) {
      const u = usage.find((x) => x.id === mon.id);
      pool = (u?.topMoves ?? []).map((m) => ({
        name: m.name,
        type: m.type,
        category: m.category,
      }));
    }
    // dedupe nach Name, alphabetisch sortieren
    const seen = new Set();
    pool = pool
      .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)))
      .sort((a, b) => a.name.localeCompare(b.name));
    mon.movepool = pool;
    if (pool.length === 0) warnings.push(`${mon.nameEn}: leerer Movepool`);
  }

  usage.sort((a, b) => (b.usagePercent ?? 0) - (a.usagePercent ?? 0));

  const now = new Date().toISOString();
  await writeFile(join(DATA_DIR, "type-chart.json"), JSON.stringify(typeChart, null, 2));
  await writeFile(
    join(DATA_DIR, "pokemon.json"),
    JSON.stringify({ meta: { generated: now, format: FORMAT, count: pokemon.length }, pokemon }, null, 2),
  );
  await writeFile(
    join(DATA_DIR, "usage.json"),
    JSON.stringify({ meta: { source: "pikalytics", format: FORMAT, date: now }, usage }, null, 2),
  );

  console.log(`\n✓ ${pokemon.length} Pokémon geschrieben nach data/`);
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} Warnungen:`);
    for (const w of warnings) console.log(`  - ${w}`);
  } else {
    console.log("Keine Warnungen.");
  }
}

main().catch((e) => {
  console.error("Fehler:", e);
  process.exit(1);
});
