// modulepreload.js — houdt de preload-lijst in public/index.html actueel.
//
// Gebruik (vanuit de projectmap, ná `tsc`):  node tools/modulepreload.js
//
// Waarom: de app is ongebundeld (31 ES-modules) en de service worker is
// netwerk-eerst, zodat je altijd de nieuwste versie krijgt. Zonder hints haalt
// de browser de modules in vier opeenvolgende golven op (main → app → 21 →
// 8), elk een netwerkronde. Met `<link rel="modulepreload">` staan ze allemaal
// in de eerste golf. Dat is puur een versnelling: een module die niet in de
// lijst staat wordt gewoon alsnog geladen, en er verandert niets aan de
// architectuur of aan wat er wanneer wordt uitgevoerd.

const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const index = path.join(__dirname, "..", "public", "index.html");
const START = "<!-- modulepreload:begin -->";
const EINDE = "<!-- modulepreload:einde -->";

const modules = [];
(function loop(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "fonts" && e.name !== "icons") loop(p);
    } else if (p.endsWith(".js") && e.name !== "service-worker.js" && e.name !== "main.js") {
      modules.push("./" + path.relative(dist, p).split(path.sep).join("/"));
    }
  }
})(dist);
modules.sort();

const blok = `${START}\n${modules.map((m) => `  <link rel="modulepreload" href="${m}" />`).join("\n")}\n  ${EINDE}`;
let html = fs.readFileSync(index, "utf8");
if (html.includes(START)) {
  html = html.replace(new RegExp(`${START}[\\s\\S]*?${EINDE}`), () => blok);
} else {
  html = html.replace('<link rel="stylesheet" href="./style.css" />', () => `<link rel="stylesheet" href="./style.css" />\n  ${blok}`);
}
fs.writeFileSync(index, html);
console.log("modulepreload:", modules.length, "modules");
