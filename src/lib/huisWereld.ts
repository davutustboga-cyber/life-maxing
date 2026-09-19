// huisWereld.ts — de buitenkant van je huis (Life Maxi v29).
//
// Iedereen begint met hetzelfde, complete huis: een moderne villa met een tuin,
// een vijver, bomen, lantaarns en een pad naar de voordeur. Dat huis verandert
// nooit door wat je doet. De voortgang zit binnen, in de kamers (lib/huis.ts en
// lib/kamerScene.ts). Zo is de buitenkant een plek om naar terug te keren, en
// geen scorebord.
//
// Techniek (bewust niet zwaarder dan nodig): één inline-SVG met vier
// diepte-lagen (verre heuvels en vogels · huis · tuin en pad · voorgrond) die
// met je vinger of muis licht ten opzichte van elkaar schuiven (parallax), plus
// zachte beweging in CSS: bomen die wiegen, gras, water, lantaarns, vogels,
// vuurvliegjes en wolken. Alleen `transform` en `opacity` bewegen, dus het blijft
// soepel op een telefoon en het staat stil bij reduced-motion. Het dagdeel
// (ochtend, dag, avond, nacht) komt van de klok en kleurt lucht, gevel en
// verlichte ramen. Geen 3D-engine, geen bibliotheek, geen extra bestanden.
//
// Wat je kunt aantikken: de voordeur (en het huis). Meer niet; de tuin is er om
// naar te kijken.

export type Dagtijd = "ochtend" | "dag" | "avond" | "nacht";

export function dagtijdVan(nu: Date = new Date()): Dagtijd {
  const u = nu.getHours();
  if (u >= 5 && u < 9) return "ochtend";
  if (u >= 9 && u < 17) return "dag";
  if (u >= 17 && u < 21) return "avond";
  return "nacht";
}

const bloem = (x: number, y: number, k: number): string =>
  `<circle class="hw-bl hw-bl${k}" cx="${x}" cy="${y}" r="2.8"/><path class="hw-steel" d="M${x} ${y + 3}v9"/>`;

export function buitenSvg(): string {
  // ── laag 1: ver weg ───────────────────────────────────────────────
  const ver =
    `<g class="lg lg-1">` +
    `<path class="hw-heuvel2" d="M-120 352C-20 300 90 310 170 338S330 318 520 346V440H-120Z"/>` +
    `<path class="hw-heuvel" d="M-120 366C10 326 120 350 210 352S380 336 520 362V450H-120Z"/>` +
    `<g class="hw-boom-ver"><circle cx="34" cy="336" r="15"/><rect x="32" y="344" width="4" height="14"/>` +
    `<circle cx="376" cy="332" r="18"/><rect x="374" y="342" width="4" height="16"/>` +
    `<circle cx="352" cy="342" r="11"/><rect x="350" y="348" width="3" height="10"/></g>` +
    `<g class="hw-vogels" aria-hidden="true">` +
    `<path class="hw-vogel" style="animation-delay:-4s" d="M0 120q5-5 10 0q5-5 10 0"/>` +
    `<path class="hw-vogel hw-vogel--2" style="animation-delay:-19s" d="M0 150q4-4 8 0q4-4 8 0"/>` +
    `<path class="hw-vogel hw-vogel--3" style="animation-delay:-31s" d="M0 100q4-4 8 0q4-4 8 0"/>` +
    `</g>` +
    `</g>`;

  // ── laag 2: het huis zelf ─────────────────────────────────────────
  let planken = "";
  for (let x = 244; x <= 300; x += 8) planken += `M${x} 308V410`;
  const huis =
    `<g class="lg lg-2">` +
    `<rect class="hw-gras" x="-120" y="352" width="640" height="900"/>` +
    `<g class="hw-huis" data-hv="binnen" role="button" tabindex="0" aria-label="Naar binnen">` +
    // beganegrond
    `<rect class="hw-wand" x="96" y="306" width="208" height="106"/>` +
    `<rect class="hw-hout" x="238" y="306" width="66" height="106"/>` +
    `<path class="hw-planken" d="${planken}"/>` +
    `<rect class="hw-plint" x="96" y="404" width="208" height="8"/>` +
    `<rect class="hw-dak" x="88" y="298" width="224" height="10"/>` +
    // verdieping, iets verschoven: een moderne opbouw
    `<rect class="hw-wand hw-wand--boven" x="132" y="236" width="150" height="62"/>` +
    `<rect class="hw-dak" x="126" y="228" width="162" height="9"/>` +
    `<rect class="hw-raam" x="146" y="248" width="88" height="42" rx="2"/><path class="hw-kozijn" d="M175 248v42M204 248v42"/>` +
    `<rect class="hw-raam" x="246" y="254" width="24" height="30" rx="2"/><path class="hw-kozijn" d="M258 254v30"/>` +
    // balkon op het lage dak, met een glazen balustrade
    `<path class="hw-rail" d="M96 298V282H132V298"/><path class="hw-lijn" d="M96 282H132"/>` +
    // grote beglazing beneden
    `<rect class="hw-raam" x="112" y="322" width="80" height="70" rx="2"/><path class="hw-kozijn" d="M139 322v70M166 322v70M112 358h80"/>` +
    `<rect class="hw-raam" x="252" y="330" width="40" height="44" rx="2"/><path class="hw-kozijn" d="M272 330v44M252 352h40"/>` +
    // voordeur onder een luifel
    `<rect class="hw-dak" x="196" y="336" width="50" height="5"/>` +
    `<rect class="hw-deur" x="204" y="344" width="30" height="68" rx="1"/><path class="hw-kozijn" d="M219 344v68"/><circle class="hw-knop" cx="228" cy="382" r="1.8"/>` +
    `<circle class="hw-lamp-gloed" cx="242" cy="352" r="12"/><circle class="hw-lamp" cx="242" cy="352" r="2.6"/>` +
    // planten op het dak
    `<circle class="hw-struik" cx="286" cy="292" r="9"/><circle class="hw-struik" cx="298" cy="294" r="7"/>` +
    `<rect class="hw-hit" x="88" y="226" width="226" height="188"/>` +
    `</g>` +
    `</g>`;

  // ── laag 3: tuin, pad, vijver en bomen ────────────────────────────
  const stenen = [
    [214, 430, 15, 4],
    [212, 458, 19, 5],
    [208, 490, 24, 6],
    [204, 526, 31, 7],
  ]
    .map(([x, y, rx, ry]) => `<ellipse class="hw-steen" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`)
    .join("");

  const heg = (x: number, b: number): string =>
    `<g class="hw-heg"><rect class="hw-heg-vlak" x="${x}" y="422" width="${b}" height="28" rx="12"/>` +
    Array.from({ length: Math.floor(b / 16) }, (_, i) => `<circle class="hw-heg-vlak" cx="${x + 8 + i * 16}" cy="424" r="8"/>`).join("") +
    `</g>`;

  const boom = (x: number, y: number, s: number, vertraging: number): string =>
    `<g transform="translate(${x} ${y}) scale(${s})"><g class="hw-boom" style="animation-delay:${vertraging}s">` +
    `<rect class="hw-stam" x="-4" y="-60" width="8" height="66"/>` +
    `<circle class="hw-kroon" cx="0" cy="-78" r="30"/><circle class="hw-kroon" cx="-24" cy="-58" r="19"/><circle class="hw-kroon" cx="24" cy="-58" r="19"/>` +
    `<circle class="hw-kroon hw-kroon--licht" cx="6" cy="-88" r="14"/>` +
    `</g></g>`;

  const lantaarn = (x: number): string =>
    `<path class="hw-lijn" d="M${x} 452V418"/><rect class="hw-lamp-kap" x="${x - 5}" y="410" width="10" height="9" rx="2"/>` +
    `<circle class="hw-lamp-gloed hw-lamp-gloed--groot" cx="${x}" cy="414" r="20"/><circle class="hw-lamp" cx="${x}" cy="414" r="3"/>`;

  const bloemen =
    [24, 40, 56, 72].map((x, i) => bloem(x, 470 - (i % 2) * 4, (i % 4) + 1)).join("") +
    [268, 284, 300, 316, 332].map((x, i) => bloem(x, 468 - (i % 2) * 4, ((i + 1) % 4) + 1)).join("");

  const tuin =
    `<g class="lg lg-3">` +
    `<path class="hw-pad" d="M200 412h30l38 148H150Z"/>` +
    stenen +
    heg(20, 148) +
    heg(252, 132) +
    boom(48, 436, 1, 0) +
    boom(352, 440, 0.9, -2.4) +
    lantaarn(178) +
    lantaarn(258) +
    // een vijver met lelies en riet
    `<ellipse class="hw-water" cx="86" cy="512" rx="56" ry="12"/><path class="hw-glans" d="M56 512q14-4 30 0t30 0"/>` +
    `<ellipse class="hw-lelie" cx="68" cy="510" rx="8" ry="2.6"/><ellipse class="hw-lelie" cx="98" cy="509" rx="7" ry="2.4"/>` +
    `<circle class="hw-bl hw-bl1" cx="98" cy="507" r="2.4"/>` +
    `<path class="hw-riet" d="M36 508v-20M43 510v-14M124 510v-16M131 508v-22"/>` +
    // een bank in de tuin
    `<rect class="hw-hout" x="296" y="506" width="52" height="5" rx="1"/><rect class="hw-hout" x="298" y="494" width="48" height="4" rx="1"/>` +
    `<path class="hw-lijn" d="M302 511v14M342 511v14M300 498v8M344 498v8"/>` +
    bloemen +
    `</g>`;

  // ── laag 4: voorgrond ─────────────────────────────────────────────
  let gras = "";
  [14, 58, 118, 168, 236, 290, 338, 384].forEach((x, i) => {
    gras += `<path class="hw-tuft" style="animation-delay:${(i * 0.6).toFixed(1)}s" d="M${x} 566q3-16 7-24 3 11 6 24zM${x + 9} 566q4-12 9-18 1 8 3 18z"/>`;
  });
  const voorgrond = `<g class="lg lg-4">${gras}</g>`;

  const vuurvliegjes =
    `<g class="hw-vuurvliegjes hw-vuurvliegjes--vrij"><circle cx="150" cy="396" r="1.8"/><circle cx="266" cy="410" r="1.8"/>` +
    `<circle cx="320" cy="430" r="1.8"/><circle cx="40" cy="450" r="1.8"/><circle cx="110" cy="470" r="1.8"/></g>`;

  return (
    `<svg class="huis-buiten-svg" viewBox="0 0 400 560" preserveAspectRatio="xMidYMax meet" role="group" aria-label="Je huis van buiten">` +
    ver +
    huis +
    tuin +
    vuurvliegjes +
    voorgrond +
    `</svg>`
  );
}
