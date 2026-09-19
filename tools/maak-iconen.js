// maak-iconen.js — tekent het Life Maxing-icoon en schrijft de PNG's.
//
// Gebruik (vanuit de projectmap):  node tools/maak-iconen.js
//
// Het icoon: één verlichte boog, de deur die door de hele app terugkomt (de
// deuren op Vandaag en in de hal, de boog in Geloof), op het donkere paars van
// de app. Eén vorm en één lichtbron, zodat het ook op 60 px leesbaar blijft:
// een huis waarin het licht aan is. Geen tekst, geen kleine details.
//
// Geen afhankelijkheden: de tekening is een handvol afstandsfuncties die per
// pixel worden geëvalueerd (4×4 supersampling voor gladde randen), en de PNG
// wordt met alleen de ingebouwde zlib geschreven. Zo blijft het icoon
// reproduceerbaar zonder ontwerpprogramma of bibliotheek.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── kleuren ──
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const over = (basis, kleur, alpha) => mix(basis, kleur, clamp(alpha));

const GROND = hex("#100e15");
const GROND_WARM = hex("#2b2027");
const KREEM = hex("#f0e3cc");
const AMBER = hex("#f3b884");
const ROOS = hex("#7a4763");
const KERN = hex("#ffe4b5");

// ── de boog (eenheden: 0..1 over het hele icoon) ──
const CX = 0.5;
const R = 0.2; // halve breedte
const TOP = 0.2; // bovenkant van de boog
const BODEM = 0.8; // drempel
const CY = TOP + R; // middelpunt van de halve cirkel
const STREEK = 0.03; // lijndikte van de rand

/** Afstand tot de rand van de boog: negatief binnen, positief buiten. */
function boogAfstand(x, y) {
  let d;
  if (y >= CY) d = Math.abs(x - CX) - R;
  else d = Math.hypot(x - CX, y - CY) - R;
  return Math.max(d, y - BODEM);
}

function pixel(px0, py0, schaal) {
  // Een maskable icoon moet binnen de veilige zone (80% cirkel) blijven: de tekening wordt kleiner.
  const x = (px0 - 0.5) / schaal + 0.5;
  const y = (py0 - 0.5) / schaal + 0.5;
  // achtergrond: donker, met een warme gloed onder het midden
  const gx = x - 0.5;
  const gy = y - 0.62;
  const straal = Math.hypot(gx, gy * 1.15);
  let c = mix(GROND_WARM, GROND, clamp(straal / 0.72));

  const d = boogAfstand(x, y);

  // gloed rond de boog
  if (d > 0) c = over(c, AMBER, 0.3 * Math.exp(-d / 0.07));

  // binnenkant: van roos (boven) naar amber (onder), met een hete kern bij de drempel
  if (d < -STREEK / 2) {
    const t = clamp((y - TOP) / (BODEM - TOP));
    let binnen = mix(ROOS, AMBER, Math.pow(t, 0.85));
    const afstandKern = Math.hypot(x - CX, (y - (BODEM - 0.1)) * 1.25) / 0.16;
    const kern = Math.exp(-(afstandKern * afstandKern));
    binnen = over(binnen, KERN, 0.85 * kern);
    c = binnen;
  }

  // de rand: crème
  const rand = Math.abs(d) < STREEK / 2;
  if (rand && y <= BODEM - 0.001) c = KREEM;

  // de drempel: een dunne lijn, iets breder dan de boog
  if (Math.abs(y - (BODEM + 0.012)) < 0.008 && Math.abs(x - CX) < R + 0.085) c = over(c, KREEM, 0.7);

  return c;
}

function teken(maat, schaal) {
  const SS = 4;
  const data = Buffer.alloc(maat * (maat * 3 + 1));
  for (let py = 0; py < maat; py++) {
    data[py * (maat * 3 + 1)] = 0; // filter: geen
    for (let px = 0; px < maat; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = pixel((px + (sx + 0.5) / SS) / maat, (py + (sy + 0.5) / SS) / maat, schaal);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = SS * SS;
      const o = py * (maat * 3 + 1) + 1 + px * 3;
      data[o] = Math.round(r / n);
      data[o + 1] = Math.round(g / n);
      data[o + 2] = Math.round(b / n);
    }
  }
  return data;
}

// ── PNG schrijven ──
const CRC_TABEL = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABEL[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function brok(type, inhoud) {
  const lengte = Buffer.alloc(4);
  lengte.writeUInt32BE(inhoud.length);
  const kern = Buffer.concat([Buffer.from(type), inhoud]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(kern));
  return Buffer.concat([lengte, kern, crc]);
}
function png(maat, schaal = 1) {
  const kop = Buffer.alloc(13);
  kop.writeUInt32BE(maat, 0);
  kop.writeUInt32BE(maat, 4);
  kop[8] = 8; // bitdiepte
  kop[9] = 2; // RGB, zonder transparantie (iOS maskeert zelf de hoeken)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    brok("IHDR", kop),
    brok("IDAT", zlib.deflateSync(teken(maat, schaal), { level: 9 })),
    brok("IEND", Buffer.alloc(0)),
  ]);
}

const map = path.join(__dirname, "..", "public", "icons");
// Nieuwe bestandsnamen: de service worker bewaart iconen cache-eerst, dus een
// nieuw icoon op een oude naam zou bij bestaande gebruikers nooit aankomen.
const uit = { "lm-180.png": [180, 1], "lm-192.png": [192, 1], "lm-512.png": [512, 1], "lm-maskable-512.png": [512, 0.84] };
for (const [naam, [maat, schaal]] of Object.entries(uit)) {
  fs.writeFileSync(path.join(map, naam), png(maat, schaal));
  console.log("geschreven:", naam, maat + "×" + maat);
}
