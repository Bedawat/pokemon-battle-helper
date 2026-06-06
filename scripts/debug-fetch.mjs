// Diagnose: zeigt die Moves-Region einer Pikalytics-Seite (roh + JSON-LD).
// Ausführen: node scripts/debug-fetch.mjs [Name]   (Default: Gourgeist)
const name = process.argv[2] || "Gourgeist";
const url = `https://www.pikalytics.com/pokedex/gen9championsvgc2026regma/${name}`;
const html = await (
  await fetch(url, { headers: { "User-Agent": "battle-helper-debug/0.1" } })
).text();

console.log(`URL: ${url}  (HTML ${html.length} Zeichen)\n`);

const i = html.search(/Best Moves/i);
if (i === -1) {
  console.log("!! 'Best Moves' kommt im HTML gar nicht vor.");
} else {
  console.log("=== 'Best Moves' + 900 Zeichen danach (roh) ===\n");
  console.log(html.slice(i, i + 900));
}

console.log("\n\n=== FAQ-JSON-LD 'top moves' (falls vorhanden) ===");
const faq = html.match(/The top moves for[^"]+/i);
console.log(faq ? faq[0] : "(nicht gefunden)");
