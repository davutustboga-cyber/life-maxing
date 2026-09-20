// kamerScene.ts — de zes kamers van binnen (Life Maxing v29).
//
// Elke kamer is een echte ruimte: een muur, een vloer, een raam en licht, met
// voorwerpen die bij het doel van die kamer horen. Wat er staat hangt af van wat
// je er gedaan hebt (lib/huis.ts → objectenAan): een kaars, een zitbank, een
// gebedsmat, een boekenkast. De kamer wordt nooit leger, en er staat nooit een
// getal in de tekening.
//
// Techniek: één inline-SVG per kamer (viewBox 360×220), alleen vlakken en
// lijnen in de kleuren van de kamer (`--accent`, zie style.css `.ks-*`). Een
// voorwerp is één <g> met een vaste plek in de tekenvolgorde (achter naar voor)
// en een eigen nummer: het nummer bepaalt wanneer het erbij komt, de volgorde
// waar het staat. Zo kan het kleed onder de kussens liggen terwijl de kaars als
// eerste is gekomen.
//
// Geloof: alleen respectvolle, niet-figuratieve voorwerpen (een gebedsmat, een
// boek op een leestafeltje, een lantaarn, een geometrisch patroon). Geen tekst
// in Arabisch schrift en geen afbeeldingen van mensen of dieren.

interface Voorwerp {
  /** Het nummer in de lijst van lib/huis.ts (OBJECT_NAMEN): wanneer het erbij komt. */
  i: number;
  /** De tekening. */
  z: string;
}

interface Kamerbouw {
  basis: string;
  voorwerpen: Voorwerp[];
}

const R = (c: string, x: number, y: number, w: number, h: number, rx = 0): string =>
  `<rect class="${c}" x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""}/>`;
const E = (c: string, cx: number, cy: number, rx: number, ry: number): string =>
  `<ellipse class="${c}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
const C = (c: string, cx: number, cy: number, r: number): string => `<circle class="${c}" cx="${cx}" cy="${cy}" r="${r}"/>`;
const P = (c: string, d: string): string => `<path class="${c}" d="${d}"/>`;

/** Een achtpuntige ster (geometrisch patroon), als pad. */
function ster8(cx: number, cy: number, groot: number, klein: number): string {
  let d = "";
  for (let i = 0; i < 16; i++) {
    const hoek = (Math.PI / 8) * i - Math.PI / 2;
    const r = i % 2 ? klein : groot;
    d += `${i ? "L" : "M"}${(cx + r * Math.cos(hoek)).toFixed(1)} ${(cy + r * Math.sin(hoek)).toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Een wandlamp: elke kamer heeft vanaf het begin een zacht licht. */
function wandlamp(x: number, y: number): string {
  return E("ks-gw", x, y + 6, 30, 30) + R("ks-h2", x - 4, y - 6, 8, 13, 2) + C("ks-w", x, y, 2.4);
}

/** Licht van het raam op de vloer: een zachte vlek, zodat ook een lege kamer al een ruimte is. */
function lichtvlek(d: string): string {
  return P("ks-vlek", d);
}

/** Een geometrische fries: kleine ruiten in een rij (Geloof). */
function fries(y: number): string {
  let d = "";
  for (let x = -300; x < 660; x += 24) d += `M${x} ${y - 5}l5 5-5 5-5-5z`;
  return P("ks-al", d) + P("ks-lijn", `M-900 ${y - 9}H1260M-900 ${y + 9}H1260`);
}

/** Een lichtsnoer: een kromme met kleine lampjes die elk op eigen tempo branden. */
function lichtsnoer(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number): string {
  let s = P("ks-draad", `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    s += `<g class="ks-lampje" style="animation-delay:${(-((i * 1.3) % 5)).toFixed(1)}s">${C("ks-gw", Math.round(x), Math.round(y + 5), 9)}${C("ks-w", Math.round(x), Math.round(y + 5), 2.2)}</g>`;
  }
  return s;
}

/** Boeken op een plank: `breedtes` naast elkaar, om en om in twee tinten. */
function boeken(x: number, plankY: number, hoogte: number, breedtes: number[]): string {
  let s = "";
  let px = x;
  breedtes.forEach((b, i) => {
    const h = hoogte - (i % 3) * 3;
    s += R(i % 3 === 0 ? "ks-a2" : i % 3 === 1 ? "ks-a" : "ks-c", px, plankY - h, b, h, 1);
    px += b + 1;
  });
  return s;
}

// ── Adem & rust: een zithoek bij een raam met de maan ───────────────────
function bouwAdem(): Kamerbouw {
  return {
    basis:
      R("ks-raam", 34, 24, 100, 96, 4) + C("ks-maan", 100, 54, 11) + C("ks-ster", 62, 46, 1.2) + C("ks-ster", 78, 88, 1) + C("ks-ster", 116, 92, 1.2) +
      P("ks-lijn", "M84 24V120M34 72H134") + R("ks-plank", 28, 120, 112, 5, 2) + wandlamp(172, 54) + lichtvlek("M44 180L134 180L206 240L98 240Z") +
      R("ks-h", 142, 148, 30, 5, 2) + R("ks-h2", 146, 153, 4, 19) + R("ks-h2", 164, 153, 4, 19),
    voorwerpen: [
      { i: 4, z: E("ks-a", 196, 198, 124, 14) },
      {
        i: 2,
        z:
          R("ks-a2", 198, 98, 124, 56, 12) + R("ks-a2", 190, 132, 140, 36, 9) + R("ks-a", 204, 106, 50, 26, 8) + R("ks-a", 266, 106, 50, 26, 8) +
          R("ks-h2", 198, 166, 6, 8) + R("ks-h2", 316, 166, 6, 8),
      },
      {
        i: 5,
        z:
          R("ks-h", 38, 152, 70, 6, 2) + R("ks-h2", 46, 158, 5, 18) + R("ks-h2", 95, 158, 5, 18) + P("ks-a2", "M56 152c0-13 34-13 34 0z") +
          E("ks-water", 73, 148, 14, 3) + E("ks-rimpel", 73, 148, 6, 1.6),
      },
      {
        i: 3,
        z:
          R("ks-h", 334, 152, 20, 20, 3) + P("ks-g", "M344 152C326 142 326 122 336 110C348 124 348 140 344 152Z") +
          P("ks-g2", "M344 152C358 144 362 130 354 118C342 130 340 142 344 152Z"),
      },
      { i: 1, z: E("ks-a2", 150, 190, 28, 9) + E("ks-a", 150, 185, 21, 6) },
      { i: 0, z: R("ks-c", 114, 180, 8, 12, 1) + E("ks-gw", 118, 176, 22, 22) + E("ks-vlam", 118, 175, 2.6, 4.6) },
      { i: 6, z: P("ks-lijn", "M250 -900V58") + P("ks-h2", "M234 76l8-18h16l8 18z") + E("ks-gw", 250, 96, 54, 40) + C("ks-w", 250, 78, 3) },
      {
        i: 7,
        z: R("ks-h2", 18, 12, 138, 4, 2) + R("ks-a", 24, 16, 22, 118, 3) + R("ks-a", 128, 16, 22, 118, 3) + lichtsnoer(164, 16, 258, 52, 352, 16, 7),
      },
    ],
  };
}

// ── Lichaam: een ruimte om in te bewegen, met uitzicht op de ochtend ────
function bouwLichaam(): Kamerbouw {
  return {
    basis:
      R("ks-raam", 240, 24, 100, 84, 4) + C("ks-w", 312, 88, 11) + P("ks-a2", "M240 108V86c20-14 40-14 60-2s30 4 40-4V108z") +
      P("ks-lijn", "M290 24V108M240 66H340") + R("ks-plank", 234, 108, 112, 5, 2) + wandlamp(218, 46) + lichtvlek("M250 180L340 180L382 238L284 238Z") +
      R("ks-h2", 96, 58, 32, 4, 1) + R("ks-h2", 101, 61, 3, 6) + R("ks-h2", 120, 61, 3, 6) + R("ks-a2", 104, 62, 16, 36, 2),
    voorwerpen: [
      { i: 5, z: R("ks-h", 126, 142, 100, 9, 3) + R("ks-h2", 134, 151, 6, 22) + R("ks-h2", 212, 151, 6, 22) + R("ks-a", 140, 134, 28, 8, 4) },
      {
        i: 2,
        z:
          R("ks-h2", 20, 22, 7, 150, 2) + R("ks-h2", 74, 22, 7, 150, 2) +
          P("ks-lijnh", "M27 44H74M27 62H74M27 80H74M27 98H74M27 116H74M27 134H74M27 152H74"),
      },
      { i: 0, z: P("ks-a2", "M104 192H236L228 210H96Z") + P("ks-lijn", "M118 199H224") },
      { i: 3, z: R("ks-h2", 88, 184, 26, 4, 1) + R("ks-h2", 84, 178, 7, 16, 2) + R("ks-h2", 111, 178, 7, 16, 2) },
      {
        i: 4,
        z:
          P("ks-a2", "M198 96h22a8 8 0 0 1 8 8v30h-38v-30a8 8 0 0 1 8-8z") + R("ks-h2", 200, 110, 26, 4, 1) + P("ks-h2", "M204 190h14v-10h10v16H204z"),
      },
      { i: 1, z: R("ks-a", 236, 156, 10, 22, 3) + R("ks-h2", 238, 151, 6, 6, 1) },
      { i: 6, z: R("ks-h2", 140, 30, 56, 44, 3) + R("ks-a", 144, 34, 48, 36, 2) + P("ks-al", "M150 66l14-20 10 13 8-9 12 16") + C("ks-w", 184, 44, 4.5) },
      {
        i: 7,
        z:
          C("ks-wiel", 262, 150, 20) + C("ks-wiel", 332, 150, 20) +
          P("ks-lijnh", "M262 150L288 120L310 150M288 120H304M310 150L300 124M262 150H292"),
      },
    ],
  };
}

// ── Mensen: een tafel waar plaats is voor iemand ────────────────────────
function bouwMensen(): Kamerbouw {
  return {
    basis:
      R("ks-raam", 252, 24, 84, 88, 4) + C("ks-w", 300, 84, 9) + P("ks-a2", "M252 112V92c14-8 28-8 42 0s28 6 42 0V112z") +
      P("ks-lijn", "M294 24V112M252 68H336") + R("ks-plank", 246, 112, 96, 5, 2) + wandlamp(56, 84) + lichtvlek("M262 180L336 180L374 238L292 238Z"),
    voorwerpen: [
      { i: 7, z: E("ks-a", 172, 200, 122, 13) + R("ks-h2", 22, 110, 5, 62) + R("ks-h", 22, 144, 30, 6, 2) + R("ks-h2", 24, 150, 5, 22) + R("ks-h2", 46, 150, 5, 22) },
      {
        i: 2,
        z:
          R("ks-h2", 78, 112, 5, 60) + R("ks-h", 78, 146, 30, 6, 2) + R("ks-h2", 80, 152, 5, 20) + R("ks-h2", 102, 152, 5, 20) +
          R("ks-h2", 226, 112, 5, 60) + R("ks-h", 200, 146, 30, 6, 2) + R("ks-h2", 202, 152, 5, 20) + R("ks-h2", 224, 152, 5, 20) +
          R("ks-h", 110, 128, 116, 8, 3) + R("ks-h2", 122, 136, 6, 36) + R("ks-h2", 208, 136, 6, 36),
      },
      { i: 5, z: R("ks-a2", 270, 112, 82, 36, 10) + R("ks-a2", 264, 136, 94, 32, 8) + R("ks-a", 276, 118, 30, 20, 6) + R("ks-a", 316, 118, 30, 20, 6) },
      { i: 3, z: R("ks-c", 148, 123, 26, 5, 1) + P("ks-al", "M148 123l13 4 13-4") },
      { i: 6, z: R("ks-c", 122, 118, 10, 10, 2) + R("ks-c", 192, 118, 10, 10, 2) + P("ks-lijn", "M127 114q3-4 0-8M197 114q3-4 0-8") },
      { i: 0, z: R("ks-h2", 150, 30, 40, 50, 2) + R("ks-a", 155, 35, 30, 40) + C("ks-al", 166, 55, 9) + C("ks-al", 176, 55, 9) },
      {
        i: 4,
        z:
          R("ks-h2", 200, 36, 26, 32, 2) + R("ks-a", 203, 39, 20, 26) + R("ks-h2", 110, 42, 30, 38, 2) + R("ks-a", 113, 45, 24, 32) +
          R("ks-h2", 84, 28, 20, 24, 2) + R("ks-a2", 87, 31, 14, 18),
      },
      { i: 1, z: lichtsnoer(0, 14, 112, 52, 234, 14, 7) },
    ],
  };
}

// ── Mijn visie: een studeerkamer met uitzicht op een sterrenhemel ───────
function bouwVisie(): Kamerbouw {
  return {
    basis:
      R("ks-raam", 200, 18, 140, 112, 4) + C("ks-ster", 226, 40, 1.3) + C("ks-ster", 256, 62, 1) + C("ks-ster", 300, 36, 1.4) + C("ks-ster", 322, 66, 1) +
      C("ks-ster", 240, 84, 1) + P("ks-a", "M200 130V106l24-18 20 14 30-26 26 22 16-8 24 18V130z") + P("ks-lijn", "M270 18V130") + R("ks-plank", 194, 130, 152, 5, 2) +
      // het bureau, met een lamp
      R("ks-h", 16, 138, 164, 9, 2) + R("ks-h2", 26, 147, 6, 26) + R("ks-h2", 162, 147, 6, 26) +
      P("ks-lijnh", "M150 138V116L130 102") + P("ks-h2", "M118 98l16-10 8 12z") + E("ks-gw", 126, 112, 44, 30) +
      // een plank met drie boeken
      R("ks-h", 96, 52, 62, 4, 1) + R("ks-a2", 102, 32, 8, 20, 1) + R("ks-a", 112, 36, 7, 16, 1) + R("ks-a2", 121, 30, 9, 22, 1) + lichtvlek("M210 180L330 180L382 240L242 240Z"),
    voorwerpen: [
      {
        i: 0,
        z:
          R("ks-h2", 30, 34, 52, 66, 2) + R("ks-c", 35, 39, 42, 56) + P("ks-al", "M42 52H70M42 62H70M42 72H64") +
          P("ks-w", "M56 80l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"),
      },
      { i: 1, z: C("ks-a2", 64, 124, 12) + P("ks-al", "M52 124a12 4 0 0 0 24 0") + P("ks-lijnh", "M64 136v4M56 140h16") },
      { i: 2, z: E("ks-spiegel", 172, 76, 15, 28) + P("ks-w", "M164 58q4-8 10-10") + P("ks-lijnh", "M172 104v8M164 112h16") },
      { i: 3, z: P("ks-lijnh", "M262 172L278 134M296 172L282 134M279 172V134") + P("ks-a2", "M254 128l38-24 8 12-38 24z") + R("ks-h2", 250, 126, 6, 10, 2) },
      { i: 4, z: R("ks-c", 82, 133, 30, 5, 1) + R("ks-a2", 86, 130, 22, 3, 1) + P("ks-lijn", "M94 132l22-5") },
    ],
  };
}

// ── Geloof: een stille ruimte met geometrie, licht en boeken ────────────
function bouwGeloof(): Kamerbouw {
  const kralen = Array.from({ length: 12 }, (_, k) => {
    const hoek = (Math.PI * 2 * k) / 12;
    return C("ks-a2", Math.round(217 + 5 * Math.cos(hoek)), Math.round(70 + 24 * Math.sin(hoek)), 2.1);
  }).join("");
  return {
    basis:
      P("ks-raam", "M36 122V64a38 38 0 0 1 76 0v58z") + P("ks-w", "M80 44a10 10 0 1 0 6 16 8 8 0 0 1-6-16z") + C("ks-ster", 52, 52, 1.2) +
      C("ks-ster", 96, 84, 1.1) + C("ks-ster", 58, 96, 1) + R("ks-plank", 30, 122, 88, 5, 2) + fries(150) + lichtvlek("M42 180L112 180L172 240L98 240Z") +
      P("ks-a2", "M14 172c-3-14 1-26 8-26s11 12 8 26z") + P("ks-lijnh", "M22 146V118M22 132l-8-10M22 127l8-10"),
    voorwerpen: [
      { i: 5, z: P("ks-a2", "M150 172V96a30 30 0 0 1 60 0v76z") + P("ks-nis", "M158 172V98a22 22 0 0 1 44 0v74z") + E("ks-gw", 180, 122, 34, 42) },
      {
        i: 2,
        z:
          R("ks-h", 296, 34, 58, 138, 3) + R("ks-h2", 300, 74, 50, 3) + R("ks-h2", 300, 112, 50, 3) + R("ks-h2", 300, 148, 50, 3) +
          boeken(301, 74, 30, [7, 5, 8, 6, 7, 5]) + boeken(301, 112, 30, [6, 8, 5, 7, 6, 8]) + boeken(301, 148, 26, [8, 6, 7]),
      },
      { i: 4, z: P("ks-al", ster8(250, 66, 24, 14)) + C("ks-al", 250, 66, 26) + P("ks-al", ster8(250, 66, 12, 7)) },
      { i: 3, z: P("ks-lijn", "M126 -900V36") + P("ks-h2", "M116 36h20l4 10v22h-28V46z") + R("ks-w", 120, 48, 12, 18, 2) + E("ks-gw", 126, 58, 36, 32) },
      {
        i: 1,
        z: P("ks-lijnh", "M240 176l22-30M270 176l-22-30") + P("ks-c", "M236 140l28-6 28 6v16l-28-6-28 6z") + P("ks-lijn", "M264 134v16"),
      },
      { i: 0, z: P("ks-a2", "M96 188H196L206 214H86Z") + P("ks-al", "M120 208v-8a26 12 0 0 1 52 0v8") + P("ks-lijn", "M100 196H192") },
      { i: 6, z: P("ks-lijn", "M217 30V44") + kralen + P("ks-lijn", "M217 94v10") },
      { i: 7, z: P("ks-al", ster8(74, 72, 34, 20)) + C("ks-al", 74, 72, 36) + P("ks-al", ster8(74, 72, 18, 11)) },
    ],
  };
}

// ── Motivatie: een warme kamer die er altijd is ─────────────────────────
function bouwMotivatie(): Kamerbouw {
  return {
    basis:
      // de open haard
      R("ks-h2", 100, 84, 160, 88, 3) + P("ks-z", "M120 172V118a60 60 0 0 1 120 0v54z") + E("ks-gw", 180, 150, 96, 54) +
      P("ks-w ks-vuur", "M158 172c-12-16 0-26 8-40 6 10 18 16 10 40z") + P("ks-w ks-vuur ks-vuur--2", "M186 172c-8-12 0-20 6-30 6 8 14 12 8 30z") +
      P("ks-w ks-vuur ks-vuur--3", "M206 172c-6-10 2-16 6-24 5 6 10 10 6 24z") + R("ks-h", 92, 72, 176, 10, 2),
    voorwerpen: [
      { i: 0, z: E("ks-a", 180, 200, 118, 12) },
      { i: 1, z: P("ks-a2", "M282 172v-48a14 14 0 0 1 14-14h40a14 14 0 0 1 14 14v48z") + R("ks-a", 278, 148, 84, 24, 9) },
      {
        i: 2,
        z:
          R("ks-h2", 24, 38, 58, 74, 3) + R("ks-c", 30, 46, 20, 20, 1) + R("ks-a2", 54, 50, 22, 16, 1) + R("ks-a", 32, 72, 24, 22, 1) + R("ks-c", 60, 76, 16, 26, 1),
      },
      { i: 3, z: R("ks-h2", 108, 50, 16, 22, 3) + R("ks-w", 111, 54, 10, 14, 2) + E("ks-gw", 116, 60, 26, 22) },
      { i: 4, z: R("ks-h2", 226, 42, 28, 30, 2) + R("ks-a", 230, 46, 20, 22) },
      { i: 5, z: R("ks-c", 206, 62, 7, 10, 1) + E("ks-vlam", 209.5, 58, 2.2, 4) },
    ],
  };
}

const BOUW: Record<string, () => Kamerbouw> = {
  adem: bouwAdem,
  lichaam: bouwLichaam,
  mensen: bouwMensen,
  visie: bouwVisie,
  geloof: bouwGeloof,
  motivatie: bouwMotivatie,
};

/**
 * De kamer als tekening. `aan[i]` zegt of voorwerp i er staat; `nieuw` is het
 * nummer van het voorwerp dat er zojuist bij kwam (dat komt langzamer en licht
 * even op).
 */
export function kamerSceneSvg(id: string, aan: boolean[], nieuw: number | null = null, viewBox = "0 0 360 220"): string {
  const bouw = BOUW[id]?.();
  if (!bouw) return "";
  const voorwerpen = bouw.voorwerpen
    .filter((v) => aan[v.i])
    .map((v) => `<g class="ks-ob${v.i === nieuw ? " ks-ob--nieuw" : ""}" style="--d:${v.i * 70}ms">${v.z}</g>`)
    .join("");
  return (
    `<svg class="ks-svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="De kamer van binnen">` +
    `<defs><radialGradient id="ks-gw"><stop offset="0" stop-color="#ffd28a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient></defs>` +
    `<rect class="ks-wand" x="-900" y="-900" width="2160" height="1074"/><rect class="ks-dado" x="-900" y="130" width="2160" height="44"/><path class="ks-dadolijn" d="M-900 130H1260"/><rect class="ks-vloer" x="-900" y="174" width="2160" height="900"/><path class="ks-plint" d="M-900 174H1260"/><path class="ks-planklijn" d="M-900 192H1260M-900 208H1260M-900 228H1260M-900 250H1260M-900 278H1260M-900 310H1260"/>` +
    bouw.basis +
    voorwerpen +
    `</svg>`
  );
}
