// huisHal.ts — de centrale hal van binnen (Life Maxi v29).
//
// Je komt binnen in een hoge hal met twee verdiepingen: beneden Adem & rust,
// Lichaam en Mensen; op de galerij Mijn visie, Geloof en Motivatie. De
// tekening hieronder is alleen de ruimte (muren, galerij, vloer, kleed,
// kroonluchter, trap, planten); de zes deuren zijn echte knoppen, bovenop de
// tekening gelegd op vaste plekken (`HAL_DEUREN`, in procenten van de tekening),
// zodat ze goed aan te tikken en te bereiken zijn met toetsenbord en
// schermlezer.

import type { KamerId } from "../data/kamers.js";

export interface HalDeur {
  kamer: KamerId;
  /** Linkerkant, bovenkant, breedte en hoogte in procenten van de hal. */
  x: number;
  y: number;
  b: number;
  h: number;
}

const BREED = 24;
const HOOG = 26;
const BOVEN = 15;
const BENEDEN = 60;

/** In leesvolgorde: eerst de galerij, dan beneden. */
export const HAL_DEUREN: HalDeur[] = [
  { kamer: "visie", x: 12, y: BOVEN, b: BREED, h: HOOG },
  { kamer: "geloof", x: 40, y: BOVEN, b: BREED, h: HOOG },
  { kamer: "motivatie", x: 68, y: BOVEN, b: BREED, h: HOOG },
  { kamer: "adem", x: 12, y: BENEDEN, b: BREED, h: HOOG },
  { kamer: "lichaam", x: 40, y: BENEDEN, b: BREED, h: HOOG },
  { kamer: "mensen", x: 68, y: BENEDEN, b: BREED, h: HOOG },
];

/** Het midden van een deur in procenten, voor de camera die erop inzoomt. */
export function deurMidden(kamer: KamerId): { x: number; y: number } {
  const d = HAL_DEUREN.find((k) => k.kamer === kamer);
  return d ? { x: d.x + d.b / 2, y: d.y + d.h / 2 } : { x: 50, y: 50 };
}

export function halSvg(): string {
  let posten = "";
  for (let x = 10; x < 360; x += 22) posten += `M${x} 198v16`;
  let treden = "";
  for (let i = 1; i < 9; i++) treden += `M0 ${442 - i * 24}L${(i * 46) / 9 + 2} ${442 - i * 24}`;
  return (
    `<svg class="hal-svg" viewBox="0 0 360 500" preserveAspectRatio="none" aria-hidden="true">` +
    `<defs><radialGradient id="hl-gw"><stop offset="0" stop-color="#ffd28a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="hl-baan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6b0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe6b0" stop-opacity="0"/></linearGradient></defs>` +
    // muren en galerij
    `<rect class="hl-wand" width="360" height="500"/>` +
    `<rect class="hl-lambrisering" y="150" width="360" height="64"/><rect class="hl-lambrisering" y="376" width="360" height="66"/>` +
    `<rect class="hl-slab" y="214" width="360" height="12"/>` +
    `<path class="hl-rail" d="M0 198H360${posten}"/>` +
    // licht van boven
    `<rect class="hl-dakraam" x="110" width="140" height="10" rx="2"/>` +
    `<path class="hl-baan" d="M120 10L100 214H160Z"/><path class="hl-baan hl-baan--2" d="M240 10L260 214H200Z"/>` +
    // kroonluchter
    `<path class="hl-lijn" d="M180 10V34"/><ellipse class="hl-gloed" cx="180" cy="46" rx="86" ry="40"/>` +
    `<path class="hl-lijn" d="M156 42c8 10 40 10 48 0"/><circle class="hl-lamp" cx="164" cy="40" r="2.6"/><circle class="hl-lamp" cx="180" cy="36" r="2.6"/><circle class="hl-lamp" cx="196" cy="40" r="2.6"/>` +
    // schilderij tussen de verdiepingen
    `<rect class="hl-lijst" x="150" y="236" width="60" height="42" rx="2"/><rect class="hl-doek" x="155" y="241" width="50" height="32"/>` +
    `<path class="hl-doek-lijn" d="M155 266c10-12 18-12 26-2s16 6 24-6"/><circle class="hl-lamp" cx="192" cy="252" r="4"/>` +
    // trap langs de linkermuur
    `<path class="hl-trap" d="M0 442L46 226V244L0 462Z"/><path class="hl-trap-lijn" d="${treden}"/>` +
    // vloer, kleed
    `<rect class="hl-vloer" y="442" width="360" height="58"/><path class="hl-plint" d="M0 442H360"/>` +
    `<path class="hl-kleed" d="M74 452H286L308 500H52Z"/><path class="hl-kleed-lijn" d="M86 458H274L290 494H70Z"/>` +
    // planten in de hoeken
    `<rect class="hl-pot" x="330" y="418" width="22" height="24" rx="3"/><path class="hl-blad" d="M341 418C322 408 322 388 332 376C346 390 346 406 341 418Z"/><path class="hl-blad hl-blad--2" d="M341 418C358 410 362 396 354 384C342 394 338 406 341 418Z"/>` +
    `<rect class="hl-pot" x="8" y="420" width="18" height="22" rx="3"/><path class="hl-blad" d="M17 420C6 410 8 396 14 388C24 398 24 410 17 420Z"/>` +
    `</svg>`
  );
}
