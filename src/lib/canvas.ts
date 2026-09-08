// canvas.ts — De Schijf (kompas-invoer) en De Hemel (sterrenveld).
// Vanilla canvas, devicePixelRatio-bewust, geen library.

import type { Ster, Sterrenbeeld, Streek } from "./types.js";

function sizeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * De vier staatkleuren uit v2.3 §1.2 (donkere waarden) met de vormparameters
 * uit v2.3 §2.1. De lichtvorm in De Schijf verandert mee met waar je staat:
 *
 *   hoge energie + zware toon → klein, dicht, scherpe rand, onrustige trilling
 *   lage energie + zware toon → groot, bleek, uitgelopen, bijna stil
 *   lage energie + lichte toon → breed, warm, langzaam ademend
 *   hoge energie + lichte toon → compact en helder, gelijkmatige puls
 *
 * v2.4 §6.1: De Warmte reageert uitsluitend op het huidige moment en heeft
 * nooit een geheugen. Geen enkele kleur betekent "goed" of "slecht".
 */
interface Staat {
  kleur: [number, number, number];
  straal: number;
  scherpte: number;
  trilling: number;
  tempo: number;
}

const EMBER: Staat = { kleur: [200, 106, 78], straal: 0.3, scherpte: 0.62, trilling: 0.05, tempo: 0.09 };
const DUSK: Staat = { kleur: [124, 140, 176], straal: 0.78, scherpte: 0.06, trilling: 0.006, tempo: 0.004 };
const MOSS: Staat = { kleur: [122, 144, 112], straal: 0.64, scherpte: 0.24, trilling: 0.035, tempo: 0.012 };
const BRASS: Staat = { kleur: [201, 146, 47], straal: 0.38, scherpte: 0.48, trilling: 0.03, tempo: 0.035 };

/** Bilineair mengen, zodat de vorm vloeiend verandert en niet springt. */
function mengStaat(energie: number, toon: number): Staat {
  const e = (energie + 1) / 2;
  const t = (toon + 1) / 2;
  const gewichten: [Staat, number][] = [
    [EMBER, e * (1 - t)],
    [DUSK, (1 - e) * (1 - t)],
    [MOSS, (1 - e) * t],
    [BRASS, e * t],
  ];
  const som = gewichten.reduce((a, [, w]) => a + w, 0) || 1;
  const uit: Staat = { kleur: [0, 0, 0], straal: 0, scherpte: 0, trilling: 0, tempo: 0 };
  for (const [st, w] of gewichten) {
    const g = w / som;
    uit.kleur[0] += st.kleur[0] * g;
    uit.kleur[1] += st.kleur[1] * g;
    uit.kleur[2] += st.kleur[2] * g;
    uit.straal += st.straal * g;
    uit.scherpte += st.scherpte * g;
    uit.trilling += st.trilling * g;
    uit.tempo += st.tempo * g;
  }
  return uit;
}

function rgb([r, g, b]: [number, number, number], a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

/** v2.3 §3.4: de systeeminstelling telt net zo hard als de eigen schakelaar. */
function systeemWilRust(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

export interface SchijfOpties {
  /** instellingen.rustigeBeelden — samen met de systeeminstelling. */
  rustig?: boolean;
  /** beginpositie, bv. na "dit klopt niet": de schijf opent verzet-klaar. */
  beginPositie?: { energie: number; toon: number } | null;
  /**
   * Wordt aangeroepen bij het loslaten — schermenoverzicht.md S1: "tik/sleep
   * en loslaten → S2". `onKies` vuurt continu tijdens het slepen, zodat de
   * lichtvorm meebeweegt; pas het loslaten is de keuze. Zonder dit verschil
   * sprong het scherm meteen door en zag je De Warmte nooit.
   */
  onKlaar?: (energie: number, toon: number) => void;
}

/**
 * De Schijf: een cirkel zonder assen, zonder cijfers, zonder raster, met een
 * zachte lichtvorm die je verplaatst (v2.3 §2.1). Geeft (energie, toon) terug
 * via onKies, beide in -1..1.
 *
 * De messing ticks langs de rand verschijnen alleen terwijl je sleept en
 * verdwijnen daarna weer — "het instrument toont zijn precisie alleen wanneer
 * je hem gebruikt, en is verder een rustig veld".
 */
export function tekenSchijf(
  canvas: HTMLCanvasElement,
  onKies: (energie: number, toon: number) => void,
  opties: SchijfOpties = {}
): () => void {
  const stil = Boolean(opties.rustig) || systeemWilRust();
  let ctx = sizeCanvas(canvas);
  let breedte = canvas.getBoundingClientRect().width;
  let hoogte = canvas.getBoundingClientRect().height;
  let cx = breedte / 2;
  let cy = hoogte / 2;
  let straal = Math.min(breedte, hoogte) * 0.38;
  let punt: { x: number; y: number } | null = null;
  let waarden = opties.beginPositie ?? { energie: 0, toon: 0 };
  let sleept = false;
  let fase = 0;
  let raf = 0;

  function waardenNaarPositie(energie: number, toon: number) {
    return { x: cx + toon * straal, y: cy - energie * straal };
  }
  if (opties.beginPositie) {
    punt = waardenNaarPositie(opties.beginPositie.energie, opties.beginPositie.toon);
  }

  function herteken() {
    ctx.clearRect(0, 0, breedte, hoogte);
    if (!stil) fase += 1;

    // De Warmte: de lichtvorm zít op je vinger, hij zweeft niet in het midden
    // (v2.3 §2.1 — "een zachte lichtvorm die je met je vinger verplaatst").
    // Kleur, grootte, scherpte en beweging volgen de huidige positie, en niets
    // anders: geen geheugen, geen geschiedenis (v2.4 §6.1).
    const staat = mengStaat(waarden.energie, waarden.toon);
    const puls = stil ? 0 : Math.sin(fase * staat.tempo) * staat.trilling;
    const gloedR = Math.max(1, straal * (staat.straal + puls) * 0.72);
    const gx = punt ? punt.x : cx;
    const gy = punt ? punt.y : cy;

    const gloed = ctx.createRadialGradient(gx, gy, 0, gx, gy, gloedR);
    gloed.addColorStop(0, rgb(staat.kleur, 0.34));
    gloed.addColorStop(Math.min(0.95, staat.scherpte), rgb(staat.kleur, 0.14));
    gloed.addColorStop(1, rgb(staat.kleur, 0));
    ctx.fillStyle = gloed;
    ctx.beginPath();
    ctx.arc(gx, gy, gloedR, 0, Math.PI * 2);
    ctx.fill();

    // hairline cirkel
    ctx.beginPath();
    ctx.arc(cx, cy, straal, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(232, 228, 218, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // de schaalverdeling: alleen terwijl je sleept
    if (sleept) {
      ctx.strokeStyle = `rgba(${MESSING}, 0.45)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 48; i++) {
        const hoek = (i / 48) * Math.PI * 2;
        const lang = i % 12 === 0;
        const r1 = straal + 3;
        const r2 = straal + (lang ? 10 : 6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(hoek) * r1, cy + Math.sin(hoek) * r1);
        ctx.lineTo(cx + Math.cos(hoek) * r2, cy + Math.sin(hoek) * r2);
        ctx.stroke();
      }
    }

    if (punt) {
      ctx.beginPath();
      ctx.arc(punt.x, punt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 228, 218, 0.9)";
      ctx.fill();
    }

    raf = requestAnimationFrame(herteken);
  }

  function positieNaarWaarden(x: number, y: number): { energie: number; toon: number } {
    // energie: verticaal, boven = hoog (1), onder = laag (-1)
    // toon: horizontaal, rechts = licht (1), links = zwaar (-1)
    let dx = (x - cx) / straal;
    let dy = (y - cy) / straal;
    const lengte = Math.sqrt(dx * dx + dy * dy);
    if (lengte > 1) {
      dx /= lengte;
      dy /= lengte;
    }
    return { energie: clamp(-dy, -1, 1), toon: clamp(dx, -1, 1) };
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  function afstandTotCentrum(x: number, y: number) {
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  }

  function opTik(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (afstandTotCentrum(x, y) > straal * 1.15) return;
    punt = { x, y };
    waarden = positieNaarWaarden(x, y);
    onKies(waarden.energie, waarden.toon);
  }

  function pointerDown(e: PointerEvent) {
    sleept = true;
    opTik(e.clientX, e.clientY);
  }
  function pointerMove(e: PointerEvent) {
    if (e.buttons > 0) opTik(e.clientX, e.clientY);
  }
  function pointerUp() {
    if (sleept && punt) opties.onKlaar?.(waarden.energie, waarden.toon);
    sleept = false;
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);

  function resize() {
    ctx = sizeCanvas(canvas);
    const rect = canvas.getBoundingClientRect();
    breedte = rect.width;
    hoogte = rect.height;
    cx = breedte / 2;
    cy = hoogte / 2;
    straal = Math.min(breedte, hoogte) * 0.38;
    if (punt) punt = waardenNaarPositie(waarden.energie, waarden.toon);
  }
  window.addEventListener("resize", resize);

  // v2.3 §3.3: alles staat stil zodra het scherm niet zichtbaar is.
  function opZichtbaarheid() {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(herteken);
  }
  document.addEventListener("visibilitychange", opZichtbaarheid);

  raf = requestAnimationFrame(herteken);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointerup", pointerUp);
    document.removeEventListener("visibilitychange", opZichtbaarheid);
    canvas.removeEventListener("pointerdown", pointerDown);
    canvas.removeEventListener("pointermove", pointerMove);
  };
}

/**
 * Het Verschil (v2.3 §2.2): na een beweging toont de schijf twee punten en een
 * dunne boog ertussen, één keer getekend in ongeveer een seconde. Geen
 * percentage, geen "+2" — en een boog in plaats van een pijl, omdat geen
 * richting beter is dan een andere.
 */
export const NAUWELIJKS_VERSCHOVEN = 0.12;

export function nauwelijksVerschoven(
  van: { energie: number; toon: number },
  naar: { energie: number; toon: number }
): boolean {
  return Math.hypot(naar.energie - van.energie, naar.toon - van.toon) < NAUWELIJKS_VERSCHOVEN;
}

export function tekenVerschil(
  canvas: HTMLCanvasElement,
  van: { energie: number; toon: number },
  naar: { energie: number; toon: number },
  rustig = false
): () => void {
  const stil = rustig || systeemWilRust();
  let ctx = sizeCanvas(canvas);
  let rect = canvas.getBoundingClientRect();
  let raf = 0;
  const begonnen = performance.now();
  const DUUR = 1000;

  function herteken() {
    const breedte = rect.width;
    const hoogte = rect.height;
    const cx = breedte / 2;
    const cy = hoogte / 2;
    const straal = Math.min(breedte, hoogte) * 0.38;

    ctx.clearRect(0, 0, breedte, hoogte);
    const t = stil ? 1 : Math.min(1, (performance.now() - begonnen) / DUUR);

    ctx.beginPath();
    ctx.arc(cx, cy, straal, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(232, 228, 218, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const p1 = { x: cx + van.toon * straal, y: cy - van.energie * straal };
    const p2 = { x: cx + naar.toon * straal, y: cy - naar.energie * straal };

    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const controle = { x: mx - dy * 0.18, y: my + dx * 0.18 };

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    const stappen = 40;
    for (let i = 1; i <= stappen; i++) {
      const u = (i / stappen) * t;
      const x = (1 - u) ** 2 * p1.x + 2 * (1 - u) * u * controle.x + u ** 2 * p2.x;
      const y = (1 - u) ** 2 * p1.y + 2 * (1 - u) * u * controle.y + u ** 2 * p2.y;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${MESSING}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const punten: [{ x: number; y: number }, number][] = [
      [p1, 0.45],
      [p2, 0.9 * t],
    ];
    for (const [p, alpha] of punten) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 228, 218, ${alpha})`;
      ctx.fill();
    }

    if (t < 1) raf = requestAnimationFrame(herteken);
  }

  function resize() {
    ctx = sizeCanvas(canvas);
    rect = canvas.getBoundingClientRect();
    herteken();
  }
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(herteken);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

// ── De Hemel ──────────────────────────────────────────────────────────
// Vier streken, vier kwadranten. De posities zijn deterministisch afgeleid
// uit de ster-id's, zodat dezelfde ster elke opening op dezelfde plek staat
// — en zodat de tekenmodus precies dezelfde hemel toont als de leesmodus.

export interface SterPositie {
  x: number;
  y: number;
  r: number;
  twinkel: number;
}

/**
 * v2.3 §1.2 `--brass` (donkere waarde): het ene accent dat de hele interface
 * draagt. Stond hier op een zelfgekozen tint; nu de waarde uit het palet.
 */
const MESSING = "201, 146, 47";

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const volgende = () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    // extra menging: zonder deze stap liggen de eerste waarden van bijna
    // gelijke zaden (s-0001, s-0002, ...) vlak naast elkaar, en dan komen
    // alle sterren in één kolom te staan in plaats van over de streek.
    let x = h ^ (h >>> 15);
    x = Math.imul(x, 2246822507) >>> 0;
    x ^= x >>> 13;
    return x / 4294967296;
  };
  volgende();
  volgende();
  return volgende;
}

// R2, een quasi-random reeks van Roberts: verdeelt punten gelijkmatiger over
// een vlak dan puur toeval, zonder zichtbaar raster. Zo klontert een streek
// niet en blijven de sterren toch onvoorspelbaar geplaatst.
const R2_A1 = 0.7548776662466927;
const R2_A2 = 0.5698402909980532;
function fractie(v: number): number {
  return v - Math.floor(v);
}

export function berekenSterPosities(
  sterren: Ster[],
  breedte: number,
  hoogte: number
): Map<string, SterPositie> {
  const posities = new Map<string, SterPositie>();
  const perStreek: Record<Streek, Ster[]> = { lichaam: [], geest: [], verbinding: [], ziel: [] };
  for (const s of sterren) perStreek[s.streek].push(s);

  const kwadranten: { streek: Streek; x0: number; y0: number }[] = [
    { streek: "geest", x0: 0, y0: 0 },
    { streek: "lichaam", x0: breedte / 2, y0: 0 },
    { streek: "verbinding", x0: 0, y0: hoogte / 2 },
    { streek: "ziel", x0: breedte / 2, y0: hoogte / 2 },
  ];

  for (const kw of kwadranten) {
    const lijst = perStreek[kw.streek];
    // Een vaste verschuiving per streek, zodat de vier kwadranten niet
    // hetzelfde patroon herhalen.
    const verschuiving = seededRandom(kw.streek)();
    lijst.forEach((ster, i) => {
      const eigen = seededRandom(ster.id);
      const fx = fractie(verschuiving + R2_A1 * (i + 1));
      const fy = fractie(verschuiving + R2_A2 * (i + 1));
      // kleine eigen jitter, zodat het geen zichtbaar patroon wordt
      const jx = (eigen() - 0.5) * 0.06;
      const jy = (eigen() - 0.5) * 0.06;
      const x = kw.x0 + Math.min(0.94, Math.max(0.06, 0.08 + 0.84 * fx + jx)) * (breedte / 2);
      const y = kw.y0 + Math.min(0.94, Math.max(0.06, 0.08 + 0.84 * fy + jy)) * (hoogte / 2);
      posities.set(ster.id, { x, y, r: 1.5 + eigen() * 1.5, twinkel: eigen() * Math.PI * 2 });
    });
  }
  return posities;
}

/** Zoekt de ster onder een tik, of null. */
function sterOnderTik(
  sterren: Ster[],
  posities: Map<string, SterPositie>,
  x: number,
  y: number,
  radius = 16
): Ster | null {
  let dichtstbij: Ster | null = null;
  let kleinste = radius;
  for (const s of sterren) {
    const p = posities.get(s.id);
    if (!p) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < kleinste) {
      kleinste = d;
      dichtstbij = s;
    }
  }
  return dichtstbij;
}

function tekenLijnen(
  ctx: CanvasRenderingContext2D,
  posities: Map<string, SterPositie>,
  sterIds: string[],
  fractie: number,
  alpha: number
): void {
  if (sterIds.length < 2) return;
  const punten = sterIds.map((id) => posities.get(id)).filter(Boolean) as SterPositie[];
  if (punten.length < 2) return;

  const segmenten = punten.length - 1;
  const tot = fractie * segmenten;

  ctx.save();
  ctx.strokeStyle = `rgba(${MESSING}, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(punten[0].x, punten[0].y);
  for (let i = 0; i < segmenten; i++) {
    const deel = Math.min(1, Math.max(0, tot - i));
    if (deel <= 0) break;
    const a = punten[i];
    const b = punten[i + 1];
    ctx.lineTo(a.x + (b.x - a.x) * deel, a.y + (b.y - a.y) * deel);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Het bijschrift onder een sterrenbeeld. Zonder dit zou de naam die je geeft
 * nergens meer terugkomen, en dan is benoemen een lege handeling. Eén regel
 * per sterrenbeeld, hooguit vier in de hele app, in dezelfde messingtoon als
 * de lijnen — geen label, geen kaartje, geen titelbalk.
 */
function tekenNaam(
  ctx: CanvasRenderingContext2D,
  posities: Map<string, SterPositie>,
  sterrenbeeld: Sterrenbeeld,
  alpha: number
): void {
  const naam = sterrenbeeld.naam.trim();
  if (!naam) return;
  const punten = sterrenbeeld.sterIds
    .map((id) => posities.get(id))
    .filter(Boolean) as SterPositie[];
  if (punten.length === 0) return;

  const x = punten.reduce((som, p) => som + p.x, 0) / punten.length;
  const y = Math.max(...punten.map((p) => p.y));

  ctx.save();
  ctx.font = '13px "Instrument Serif", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = `rgba(${MESSING}, ${alpha})`;
  ctx.fillText(naam, x, y + 12);
  ctx.restore();
}

function tekenSter(
  ctx: CanvasRenderingContext2D,
  p: SterPositie,
  metZin: boolean,
  helderheid: number
): void {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * (metZin ? 1.4 : 1), 0, Math.PI * 2);
  ctx.fillStyle = `rgba(230, 220, 200, ${helderheid})`;
  ctx.fill();
}

export interface HemelOpties {
  sterrenbeelden?: Sterrenbeeld[];
  /** Streek waarvan het sterrenbeeld net getekend is: één keer draw-on. */
  nieuwSterrenbeeldId?: string | null;
  /** instellingen.rustigeBeelden — zet twinkeling en draw-on uit. */
  rustig?: boolean;
}

/**
 * De Hemel: sterren verdeeld over vier streken, met de getekende sterrenbeelden
 * als dunne messinglijnen erbij. Tikken op een ster toont de verankeringszin.
 * v2.4 §11: een sterrenbeeld tekent zich één keer op (±700 ms) en beweegt
 * daarna nooit meer.
 */
export function tekenHemel(
  canvas: HTMLCanvasElement,
  sterren: Ster[],
  onTikSter: (ster: Ster) => void,
  opties: HemelOpties = {}
): () => void {
  const { sterrenbeelden = [], nieuwSterrenbeeldId = null, rustig = false } = opties;

  let ctx = sizeCanvas(canvas);
  let rect = canvas.getBoundingClientRect();
  let posities = berekenSterPosities(sterren, rect.width, rect.height);
  let raf = 0;
  let fase = 0;
  const begonnenOp = performance.now();
  const DRAW_ON_MS = 700;

  function herteken() {
    ctx.clearRect(0, 0, rect.width, rect.height);
    fase += 0.02;

    const verstreken = performance.now() - begonnenOp;
    const drawOn = rustig ? 1 : Math.min(1, verstreken / DRAW_ON_MS);

    for (const sb of sterrenbeelden) {
      const isNieuw = sb.id === nieuwSterrenbeeldId;
      tekenLijnen(ctx, posities, sb.sterIds, isNieuw ? drawOn : 1, 0.5);
      // De naam komt pas als de lijnen er helemaal staan.
      tekenNaam(ctx, posities, sb, isNieuw ? Math.max(0, (drawOn - 0.8) * 5) * 0.45 : 0.45);
    }

    for (const s of sterren) {
      const p = posities.get(s.id);
      if (!p) continue;
      const twinkel = rustig ? 0.85 : 0.6 + 0.4 * Math.sin(fase + p.twinkel);
      tekenSter(ctx, p, Boolean(s.zin), 0.4 + 0.5 * twinkel);
    }

    raf = requestAnimationFrame(herteken);
  }

  function clickHandler(e: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const ster = sterOnderTik(sterren, posities, e.clientX - r.left, e.clientY - r.top);
    if (ster) onTikSter(ster);
  }
  canvas.addEventListener("click", clickHandler);

  function resize() {
    ctx = sizeCanvas(canvas);
    rect = canvas.getBoundingClientRect();
    posities = berekenSterPosities(sterren, rect.width, rect.height);
  }
  window.addEventListener("resize", resize);

  raf = requestAnimationFrame(herteken);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("click", clickHandler);
  };
}

// ── Tekenmodus (v1.1) ─────────────────────────────────────────────────

export interface TekenmodusHandle {
  /** De ster-id's in de volgorde waarin ze verbonden zijn. */
  pad(): string[];
  /** Maakt de laatst gelegde verbinding ongedaan. */
  ongedaanMaken(): void;
  stop(): void;
}

/**
 * Tekenmodus binnen De Hemel (schermenoverzicht.md S8): dezelfde hemel, maar
 * alleen de sterren van één streek zijn aantikbaar. Elke tik verbindt de ster
 * met de vorige. De streken eromheen blijven staan — je tekent in je eigen
 * hemel, niet op een leeg vel — maar ze dimmen zodat duidelijk is waar je bent.
 */
export function tekenSterrenbeeldModus(
  canvas: HTMLCanvasElement,
  sterren: Ster[],
  streek: Streek,
  onVerandering: (pad: string[]) => void,
  rustig = false
): TekenmodusHandle {
  let ctx = sizeCanvas(canvas);
  let rect = canvas.getBoundingClientRect();
  let posities = berekenSterPosities(sterren, rect.width, rect.height);
  let raf = 0;
  let fase = 0;

  const eigen = sterren.filter((s) => s.streek === streek);
  let pad: string[] = [];

  function herteken() {
    ctx.clearRect(0, 0, rect.width, rect.height);
    fase += 0.02;

    tekenLijnen(ctx, posities, pad, 1, 0.6);

    for (const s of sterren) {
      const p = posities.get(s.id);
      if (!p) continue;
      const isEigen = s.streek === streek;
      const gekozen = pad.includes(s.id);

      if (!isEigen) {
        tekenSter(ctx, p, Boolean(s.zin), 0.12);
        continue;
      }

      const twinkel = rustig ? 0.85 : 0.6 + 0.4 * Math.sin(fase + p.twinkel);
      tekenSter(ctx, p, Boolean(s.zin), gekozen ? 1 : 0.45 + 0.45 * twinkel);

      if (gekozen) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${MESSING}, 0.7)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    raf = requestAnimationFrame(herteken);
  }

  function clickHandler(e: MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const ster = sterOnderTik(eigen, posities, e.clientX - r.left, e.clientY - r.top, 20);
    if (!ster) return;
    // Dezelfde ster nog eens aantikken doet niets — geen dubbele punten in
    // een sterrenbeeld, en geen lijn die op zichzelf terugkomt.
    if (pad.includes(ster.id)) return;
    pad = [...pad, ster.id];
    onVerandering(pad);
  }
  canvas.addEventListener("click", clickHandler);

  function resize() {
    ctx = sizeCanvas(canvas);
    rect = canvas.getBoundingClientRect();
    posities = berekenSterPosities(sterren, rect.width, rect.height);
  }
  window.addEventListener("resize", resize);

  raf = requestAnimationFrame(herteken);

  return {
    pad: () => [...pad],
    ongedaanMaken() {
      if (pad.length === 0) return;
      pad = pad.slice(0, -1);
      onVerandering(pad);
    },
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", clickHandler);
    },
  };
}
