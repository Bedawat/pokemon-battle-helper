// @ts-nocheck
/**
 * diagnose-usage.mjs — Ein-Zweck-Diagnose für das „0 Usage"-Problem.
 * Zeigt, ob (a) das Pikalytics-Ranking-Widget Namen liefert und (b) ob eine
 * Detailseite das Usage-% parsebar enthält. Auf deinem Mac ausführen:
 *   node scripts/diagnose-usage.mjs
 */
const FORMAT = "gen9championsvgc2026regmb";
const BASE = `https://www.pikalytics.com/pokedex/${FORMAT}`;
const UA = { headers: { "User-Agent": "battle-helper-diagnose/0.1" } };

const get = async (u) => {
  const r = await fetch(u, UA);
  return { status: r.status, text: r.ok ? await r.text() : "" };
};

// --- 1) Ranking-Widget: Namen aus Detail-Links ziehen (wie build-data) ---
const land = await get(BASE);
console.log(`Landing: HTTP ${land.status}, ${land.text.length} Zeichen`);
const re = new RegExp(`/pokedex/${FORMAT}/([A-Za-z0-9%._-]+)`, "g");
const seen = new Set();
let m;
while ((m = re.exec(land.text)) !== null) {
  const n = decodeURIComponent(m[1]);
  if (!n || n.toLowerCase().startsWith("gen9")) continue;
  seen.add(n);
}
console.log(`Ranking-Namen gefunden: ${seen.size}`);
console.log("  erste 10:", [...seen].slice(0, 10).join(", ") || "(KEINE — Ranking-Extraktion ist das Problem)");

// --- 2) Detailseite: Usage-% parsebar? (Garchomp als Referenz) ---
const det = await get(`${BASE}/Garchomp`);
console.log(`\nGarchomp-Detail: HTTP ${det.status}, ${det.text.length} Zeichen`);
console.log('  enthält "Usage Percent":', /Usage Percent/i.test(det.text));
const flat = det.text.replace(/<[^>]+>/g, "\n").replace(/\s+/g, " ").trim();
const um = flat.match(/Usage Percent\s*([\d.]+)\s*%/i);
console.log("  aktuelles Parse-Ergebnis:", um ? um[1] + "%" : "FEHLGESCHLAGEN");
if (!um) {
  // Zeig den Kontext um "Usage Percent", damit wir das echte Format sehen.
  const i = flat.search(/Usage Percent/i);
  console.log("  Kontext:", i >= 0 ? JSON.stringify(flat.slice(i, i + 120)) : "(Label nicht gefunden)");
  const anyPct = flat.match(/([\d.]+)\s*%/);
  console.log("  erstes % auf der Seite:", anyPct ? anyPct[0] : "keins");
}
