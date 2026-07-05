// @ts-nocheck
/**
 * build-data.mjs — baut den Datensatz für den Battle Helper.
 *
 * NEU (Phase „Voller Champions-Dex"): Der Roster ist nicht mehr hier hardcodiert,
 * sondern kommt aus scripts/champions-dex.json (aus Bulbapedia geparst, via
 * parse-champions-dex.mjs). Damit sind ALLE in Pokémon Champions verfügbaren
 * Pokémon enthalten — nicht nur die Top-Meta.
 *
 * Datenquellen und Zuständigkeit:
 *   - champions-dex.json : Roster, TYPEN (autoritativ), Mega-Formen + deren Typen.
 *   - PokéAPI            : Sprite (Official Artwork), Movepool, deutscher Name,
 *                          Typ-Effektivitäts-Matrix.
 *   - Pikalytics (regmb) : Usage % + Top-Attacken — NUR für die Meta-Mons, die im
 *                          aktuellen Ranking auftauchen. Alle anderen: usage=null.
 *
 * Ausgabe (nach ../data/):
 *   - pokemon.json     statische Daten (id, Namen, Typen, Sprite, Megas)
 *   - usage.json       Usage % + Top-Moves pro Pokémon (nur Meta-Mons gefüllt)
 *   - type-chart.json  18×18 Typ-Effektivität
 *
 * Ausführen (Node ≥ 18, hat globales fetch):
 *   node scripts/parse-champions-dex.mjs   # nur nötig, wenn champions-source.wiki geändert wurde
 *   node scripts/build-data.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DEX_FILE = join(__dirname, "champions-dex.json");

const FORMAT = "gen9championsvgc2026regmb";
const PIKALYTICS_BASE = `https://www.pikalytics.com/pokedex/${FORMAT}`;
const PIKALYTICS_LIST = `https://www.pikalytics.com/pokedex/${FORMAT}`;
const POKEAPI = "https://pokeapi.co/api/v2";

const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

const slug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Leitet den pokemon-species-Slug (für den DE-Namen) aus einem PokéAPI-Formen-Slug
 * ab, indem bekannte Form-Suffixe abgeschnitten werden.
 */
function speciesSlugFromApi(apiSlug) {
  return apiSlug
    .replace(/-mega(-[xy])?$/, "")
    .replace(/-paldea-\w+(-breed)?$/, "")
    .replace(/-(alola|galar|hisui|paldea)(-\w+)?$/, "")
    .replace(/-(wash|heat|frost|fan|mow)$/, "")
    .replace(/-(family-of-four|family-of-three)$/, "")
    .replace(/-(shield|blade)$/, "")
    .replace(/-(midday|midnight|dusk)$/, "")
    .replace(/-(male|female)$/, "")
    .replace(/-(disguise)$/, "")
    .replace(/-(full-belly|hangry)$/, "")
    .replace(/-(zero|hero)$/, "")
    .replace(/-(average|small|large|super)$/, "")
    .replace(/-(eternal|incarnate)$/, "");
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
    headers: { "User-Agent": "battle-helper-data-build/0.2 (HCI student project)" },
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

/**
 * Parst Kennzahlen, Sprite und Top-Moves von einer Pikalytics-Detailseite.
 *
 * Hinweis (regmb / Champions-Turnierformat): Pikalytics zeigt hier KEINE
 * „Usage Percent" mehr, sondern „Winrate" + „Monthly Rank". `usagePercent`
 * bleibt daher meist null; `winrate` und `rank` sind die verfügbaren Meta-Signale.
 */
function parsePikalyticsDetail(html, pikalyticsName) {
  const flat = htmlToText(html).replace(/\s+/g, " ").trim();

  // Alt-Format (regma u. a.): explizites „Usage Percent … X%".
  let usagePercent = null;
  const usageMatch = flat.match(/Usage Percent\s*([\d.]+)\s*%/i);
  if (usageMatch) usagePercent = parseFloat(usageMatch[1]);

  // Neu (regmb): „Winrate  51.371%" und „Monthly Rank  #1".
  let winrate = null;
  const wrMatch = flat.match(/Winrate\s*([\d.]+)\s*%/i);
  if (wrMatch) winrate = parseFloat(wrMatch[1]);
  let rank = null;
  const rankMatch = flat.match(/Monthly Rank\s*#(\d+)/i);
  if (rankMatch) rank = parseInt(rankMatch[1], 10);

  let pikaSprite = null;
  const spriteMatch = html.match(/championssprites\/([a-z0-9_]+)\.png/i);
  if (spriteMatch) {
    pikaSprite = `https://cdn.pikalytics.com/images/championssprites/${spriteMatch[1]}.png`;
  }

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

  return { usagePercent, winrate, rank, pikaSprite, topMoves };
}

/**
 * Holt Sprite (Official Artwork) UND Movepool-Slugs von PokéAPI.
 * Gibt { sprite, moveSlugs, types } zurück (types nur als Fallback/Kontrolle).
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
    return { sprite, moveSlugs, types, ok: true };
  } catch {
    return { sprite: null, moveSlugs: [], types: [], ok: false };
  }
}

const MOVE_CATEGORIES = ["physical", "special", "status"];

/** Deutsche Move-Namen, die PokéAPI (noch) nicht lokalisiert hat (Fallback). */
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

const moveKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const moveNameSlug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const topMoveSlugCandidates = (name) => {
  const words = name.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const s = moveNameSlug(words.slice(i).join(" "));
    if (s) out.push(s);
  }
  return out;
};

/** Holt Typ, EN-/DE-Name und Schadensklasse einer Attacke von PokéAPI. */
async function fetchMoveInfo(moveSlug) {
  try {
    const mv = await fetchJson(`${POKEAPI}/move/${moveSlug}`);
    const type = mv.type?.name;
    if (!type || !TYPES.includes(type)) return null;
    const en = mv.names?.find((n) => n.language.name === "en")?.name;
    const de = mv.names?.find((n) => n.language.name === "de")?.name;
    const name =
      en ??
      moveSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
async function fetchNameDe(speciesSlug) {
  try {
    const data = await fetchJson(`${POKEAPI}/pokemon-species/${speciesSlug}`);
    return data.names.find((n) => n.language.name === "de")?.name ?? null;
  } catch {
    return null;
  }
}

/** Holt + parst eine Pikalytics-Detailseite (mit Fehler-Warnung). */
async function loadPikalytics(name, warnings) {
  let detail = { usagePercent: null, winrate: null, rank: null, pikaSprite: null, topMoves: [] };
  try {
    const html = await fetchText(`${PIKALYTICS_BASE}/${name}`);
    detail = parsePikalyticsDetail(html, name);
  } catch (e) {
    // 404 ist bei Nicht-Meta-Mons normal — leise behandeln.
    if (!/HTTP 404/.test(e.message)) warnings.push(`${name}: Pikalytics-Fehler (${e.message})`);
  }
  return detail;
}

/**
 * Holt das aktuelle Usage-Ranking von der Pikalytics-Format-Landingpage.
 * Robust gegen rohes HTML: extrahiert Mon-Namen aus den Detail-Links in
 * Erscheinungs-Reihenfolge (das Ranking-Widget steht oben auf der Seite),
 * dedupliziert und nimmt die ersten `limit`. Usage % kommt später aus den
 * Detailseiten — hier zählt nur die Reihenfolge/Auswahl.
 */
async function fetchRanking(warnings, limit = 40) {
  try {
    const html = await fetchText(PIKALYTICS_LIST);
    const re = new RegExp(`/pokedex/${FORMAT}/([A-Za-z0-9%._-]+)`, "g");
    const seen = new Set();
    const out = [];
    let m;
    while ((m = re.exec(html)) !== null) {
      const pikaName = decodeURIComponent(m[1]);
      // Selbst-Link auf die Format-Seite u. Ä. ignorieren.
      if (!pikaName || pikaName.toLowerCase().startsWith("gen9")) continue;
      const key = pikaName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ pikaName, usagePercent: null });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    warnings.push(`Ranking-Fetch fehlgeschlagen: ${e.message}`);
    return [];
  }
}

/**
 * Löst einen Pikalytics-Ranking-Namen auf eine Dex-id auf.
 * Meta-Namen können Mega-/Regional-/Formen-Namen sein.
 */
function resolvePikaNameToId(pikaName, dexIndex) {
  const raw = pikaName.replace(/_/g, "-");
  const direct = slug(raw);
  if (dexIndex.byId.has(direct)) return direct;

  // Mega → Basis-Spezies (Usage wird auf Spezies-Ebene geführt).
  const noMega = slug(raw.replace(/-Mega(-?[XY])?$/i, ""));
  if (dexIndex.byId.has(noMega)) return noMega;

  // Bekannte Default-Form-Abbildungen (Pikalytics nennt die Basis, Dex die Form).
  const defaults = {
    basculegion: "basculegion-male",
    maushold: "maushold-family-of-four",
    aegislash: "aegislash-shield",
    gourgeist: "gourgeist-average",
    lycanroc: "lycanroc-midday",
    meowstic: "meowstic-male",
    mimikyu: "mimikyu-disguise",
    morpeko: "morpeko-full-belly",
    palafin: "palafin-zero",
  };
  if (defaults[noMega] && dexIndex.byId.has(defaults[noMega])) return defaults[noMega];
  if (defaults[direct] && dexIndex.byId.has(defaults[direct])) return defaults[direct];

  return null;
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  console.log("→ Champions-Dex laden …");
  const dex = JSON.parse(await readFile(DEX_FILE, "utf8"));
  const dexIndex = { byId: new Map(dex.pokemon.map((p) => [p.id, p])) };
  console.log(`  ${dex.pokemon.length} Einträge, ${dex.pokemon.reduce((s, p) => s + p.megas.length, 0)} Megas`);

  console.log("→ Typ-Effektivitäts-Matrix von PokéAPI …");
  const typeChart = await buildTypeChart();

  const warnings = [];

  // --- 1) Usage-Ranking (regmb) holen und auf Dex-ids abbilden ---
  console.log("→ Usage-Ranking von Pikalytics …");
  const ranking = await fetchRanking(warnings);
  console.log(`  ${ranking.length} Mons im Ranking-Widget`);
  /** id → { usagePercent, winrate, rank, topMoves } */
  const usageById = new Map();
  // rank = Position in der Ranking-Reihenfolge der Landingpage. Diese Reihenfolge
  // IST die Usage-Rangfolge (robuster als das flaky „Monthly Rank #N" im HTML).
  let rankCounter = 0;
  for (const r of ranking) {
    const id = resolvePikaNameToId(r.pikaName, dexIndex);
    if (!id) {
      warnings.push(`Ranking-Mon nicht im Dex: ${r.pikaName} — BITTE PRÜFEN (evtl. neuer Champions-Mon)`);
      continue;
    }
    rankCounter++;
    // Detailseite für Winrate + Top-Moves.
    const detail = await loadPikalytics(r.pikaName, warnings);
    usageById.set(id, {
      usagePercent: detail.usagePercent ?? r.usagePercent ?? null,
      winrate: detail.winrate,
      rank: detail.rank ?? rankCounter,
      topMoves: detail.topMoves,
    });
    await sleep(350);
  }

  // --- 2) Pro Dex-Eintrag: PokéAPI-Anreicherung (Sprite, Movepool, DE-Name) ---
  const pokemon = [];
  const usage = [];
  const moveSlugsById = {};
  let idx = 0;
  for (const entry of dex.pokemon) {
    idx++;
    process.stdout.write(`→ [${idx}/${dex.pokemon.length}] ${entry.id} … `);

    const api = await fetchPokemonApi(entry.apiSlug);
    if (!api.ok) warnings.push(`${entry.id}: PokéAPI 404 (${entry.apiSlug}) — Slug prüfen`);
    const sprite = api.sprite ?? "";
    if (!sprite) warnings.push(`${entry.id}: kein Sprite`);
    moveSlugsById[entry.id] = api.moveSlugs;

    const nameDe = (await fetchNameDe(speciesSlugFromApi(entry.apiSlug))) ?? entry.nameEn;

    // Megas: Typen aus Dex (autoritativ); Sprite via PokéAPI-Mega-Slug, sonst Basis-Sprite.
    const megas = [];
    for (const m of entry.megas) {
      const mApi = await fetchPokemonApi(m.apiSlug);
      const megaSprite = mApi.sprite ?? sprite; // neue Champions-Megas: Fallback Basis-Sprite
      if (!mApi.ok) warnings.push(`${entry.id}/${m.label}: kein PokéAPI-Mega (${m.apiSlug}) — Basis-Sprite genutzt`);
      megas.push({ id: m.id, label: m.label, types: m.types, sprite: megaSprite });
      await sleep(80);
    }

    const u = usageById.get(entry.id) ?? { usagePercent: null, winrate: null, rank: null, topMoves: [] };

    pokemon.push({
      id: entry.id,
      nameEn: entry.nameEn,
      nameDe,
      types: entry.types, // AUTORITATIV aus Bulbapedia
      sprite,
      movepool: [],
      megas,
    });
    usage.push({
      id: entry.id,
      nameEn: entry.nameEn,
      usagePercent: u.usagePercent,
      winrate: u.winrate ?? null,
      rank: u.rank ?? null,
      topMoves: u.topMoves,
    });

    console.log(`${entry.types.join("/")}  winrate ${u.winrate ?? "—"}  rank ${u.rank ?? "—"}  megas ${megas.length}  pool ${api.moveSlugs.length}`);
    await sleep(120); // höflich
  }

  // --- 3) Movepool-Auflösung: alle eindeutigen Move-Slugs einmal holen ---
  const topMoveSlugs = usage.flatMap((u) =>
    u.topMoves.flatMap((mv) => topMoveSlugCandidates(mv.name)),
  );
  const allSlugs = [...new Set([...Object.values(moveSlugsById).flat(), ...topMoveSlugs])];
  console.log(`\n→ ${allSlugs.length} eindeutige Attacken von PokéAPI auflösen …`);
  const moveInfo = {};
  let done = 0;
  for (const ms of allSlugs) {
    const info = await fetchMoveInfo(ms);
    if (info) moveInfo[ms] = info;
    if (++done % 50 === 0) process.stdout.write(`  … ${done}/${allSlugs.length}\n`);
    await sleep(25);
  }

  const categoryByName = {};
  const deByName = {};
  for (const info of Object.values(moveInfo)) {
    if (info.category) categoryByName[moveKey(info.name)] = info.category;
    if (info.nameDe) deByName[moveKey(info.name)] = info.nameDe;
  }

  const untranslated = Object.values(moveInfo).filter((i) => !i.hasDe).map((i) => i.name);
  if (untranslated.length > 0) {
    warnings.push(`Ohne deutschen Move-Namen: ${[...new Set(untranslated)].join(", ")}`);
  }

  // Top-Moves (Pikalytics, englisch) → Deutsch + Schadensklasse (Suffix-Match).
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

  // Movepool je Pokémon bauen (Name+Typ+Kategorie, alphabetisch).
  for (const mon of pokemon) {
    const slugs = moveSlugsById[mon.id] ?? [];
    let pool = slugs
      .map((s) => moveInfo[s])
      .filter(Boolean)
      .map((m) => ({ name: m.nameDe ?? m.name, type: m.type, category: m.category }));
    if (pool.length === 0) {
      const u = usage.find((x) => x.id === mon.id);
      pool = (u?.topMoves ?? []).map((m) => ({ name: m.name, type: m.type, category: m.category }));
    }
    const seen = new Set();
    pool = pool
      .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)))
      .sort((a, b) => a.name.localeCompare(b.name));
    mon.movepool = pool;
    if (pool.length === 0) warnings.push(`${mon.nameEn}: leerer Movepool`);
  }

  // Meta-Mons (mit Rank) zuerst, aufsteigend nach Monthly Rank; Rest dahinter.
  usage.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

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

  console.log(`\n✓ ${pokemon.length} Pokémon geschrieben nach data/ (Format ${FORMAT})`);
  const ranked = usage.filter((u) => u.rank != null).length;
  console.log(`  davon ${ranked} im Meta-Ranking (Winrate + Rank + Top-Moves), Rest ohne Meta-Daten`);
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
