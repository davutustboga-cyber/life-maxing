// canvas.ts — De Schijf (kompas-invoer) en De Hemel (sterrenveld).
// Vanilla canvas, devicePixelRatio-bewust, geen library.
function sizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return ctx;
}
const EMBER = { kleur: [200, 106, 78], straal: 0.3, scherpte: 0.62, trilling: 0.05, tempo: 0.09 };
const DUSK = { kleur: [124, 140, 176], straal: 0.78, scherpte: 0.06, trilling: 0.006, tempo: 0.004 };
const MOSS = { kleur: [122, 144, 112], straal: 0.64, scherpte: 0.24, trilling: 0.035, tempo: 0.012 };
const BRASS = { kleur: [201, 146, 47], straal: 0.38, scherpte: 0.48, trilling: 0.03, tempo: 0.035 };
/** Bilineair mengen, zodat de vorm vloeiend verandert en niet springt. */
function mengStaat(energie, toon) {
    const e = (energie + 1) / 2;
    const t = (toon + 1) / 2;
    const gewichten = [
        [EMBER, e * (1 - t)],
        [DUSK, (1 - e) * (1 - t)],
        [MOSS, (1 - e) * t],
        [BRASS, e * t],
    ];
    const som = gewichten.reduce((a, [, w]) => a + w, 0) || 1;
    const uit = { kleur: [0, 0, 0], straal: 0, scherpte: 0, trilling: 0, tempo: 0 };
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
function rgb([r, g, b], a) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}
/** v2.3 §3.4: de systeeminstelling telt net zo hard als de eigen schakelaar. */
function systeemWilRust() {
    return typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
}
/**
 * v25 — het canvas opmeten zodra het werkelijk in de pagina staat.
 *
 * Waarom dit er is: `render()` (dom.ts) wisselt sinds de View Transitions-
 * ronde niet meer synchroon van scherm. `app.ts` roept `tekenSchijf()` /
 * `tekenHemel()` direct ná `render()` aan, dus op dat moment hangt het
 * canvas nog los van het document en geeft `getBoundingClientRect()` nul
 * terug — waardoor `canvas.width` nul werd en er letterlijk niets werd
 * getekend: De Schijf, Het Verschil, De Hemel en de tekenmodus stonden alle
 * vier als zwart vlak op het scherm.
 *
 * In plaats van dat op zes plaatsen in app.ts op te lossen, kijkt het canvas
 * hier zelf wanneer het gemeten kan worden. Een ResizeObserver vuurt één keer
 * bij het observeren en daarna bij elke maatverandering, dus dit dekt in één
 * beweging: het uitgestelde inhangen, een gedraaide telefoon, een fontlading
 * die de layout verschuift, en het adresbalk-inklappen op mobiel Safari.
 *
 * De CSS geeft beide canvassen een vaste maat (`.schijf-canvas`,
 * `.hemel-canvas`), dus het bijstellen van `canvas.width`/`height` — de
 * bitmap, niet de layout — kan de observer nooit opnieuw laten vuren.
 */
function opMaat(canvas, resize) {
    window.addEventListener("resize", resize);
    let observer = null;
    if (typeof ResizeObserver === "function") {
        observer = new ResizeObserver(() => resize());
        observer.observe(canvas);
    }
    return () => {
        window.removeEventListener("resize", resize);
        observer?.disconnect();
        observer = null;
    };
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
export function tekenSchijf(canvas, onKies, opties = {}) {
    const stil = Boolean(opties.rustig) || systeemWilRust();
    let ctx = sizeCanvas(canvas);
    let breedte = canvas.getBoundingClientRect().width;
    let hoogte = canvas.getBoundingClientRect().height;
    let cx = breedte / 2;
    let cy = hoogte / 2;
    let straal = Math.min(breedte, hoogte) * 0.38;
    let punt = null;
    let waarden = opties.beginPositie ?? { energie: 0, toon: 0 };
    let sleept = false;
    let fase = 0;
    let raf = 0;
    function waardenNaarPositie(energie, toon) {
        return { x: cx + toon * straal, y: cy - energie * straal };
    }
    if (opties.beginPositie) {
        punt = waardenNaarPositie(opties.beginPositie.energie, opties.beginPositie.toon);
    }
    function herteken() {
        ctx.clearRect(0, 0, breedte, hoogte);
        if (!stil)
            fase += 1;
        // De Warmte: de lichtvorm zít op je vinger, hij zweeft niet in het midden
        // (v2.3 §2.1 — "een zachte lichtvorm die je met je vinger verplaatst").
        // Kleur, grootte, scherpte en beweging volgen de huidige positie, en niets
        // anders: geen geheugen, geen geschiedenis (v2.4 §6.1).
        const staat = mengStaat(waarden.energie, waarden.toon);
        const puls = stil ? 0 : Math.sin(fase * staat.tempo) * staat.trilling;
        const gloedR = Math.max(1, straal * (staat.straal + puls) * 0.72);
        const gx = punt ? punt.x : cx;
        const gy = punt ? punt.y : cy;
        // Een bredere, zachtere ademwolk onder de kernvorm — geeft de Warmte
        // atmosferische diepte in plaats van een harde cirkel van licht.
        const bloemR = gloedR * 2.1;
        const bloem = ctx.createRadialGradient(gx, gy, 0, gx, gy, bloemR);
        bloem.addColorStop(0, rgb(staat.kleur, 0.1));
        bloem.addColorStop(0.5, rgb(staat.kleur, 0.045));
        bloem.addColorStop(1, rgb(staat.kleur, 0));
        ctx.fillStyle = bloem;
        ctx.beginPath();
        ctx.arc(gx, gy, bloemR, 0, Math.PI * 2);
        ctx.fill();
        const gloed = ctx.createRadialGradient(gx, gy, 0, gx, gy, gloedR);
        gloed.addColorStop(0, rgb(staat.kleur, 0.42));
        gloed.addColorStop(Math.min(0.95, staat.scherpte), rgb(staat.kleur, 0.17));
        gloed.addColorStop(1, rgb(staat.kleur, 0));
        ctx.fillStyle = gloed;
        ctx.beginPath();
        ctx.arc(gx, gy, gloedR, 0, Math.PI * 2);
        ctx.fill();
        // hairline cirkel, met een fijne messinggloed op de rand — het instrument
        // zelf, niet alleen de staat die erop ligt.
        ctx.save();
        ctx.shadowColor = `rgba(${MESSING}, 0.35)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, straal, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(237, 233, 222, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
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
        // v25 — vóór de eerste aanraking stond hier niets: alleen de gloed in het
        // midden. Het scherm zegt "sleep het lichtpunt ernaartoe", dus dat punt
        // moet er ook zijn om te pakken. Zwakker dan na aanraking, in het midden,
        // zodat het een greep is en geen antwoord dat al gegeven is.
        if (!punt) {
            ctx.save();
            ctx.shadowColor = "rgba(237, 233, 222, 0.35)";
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(237, 233, 222, 0.5)";
            ctx.fill();
            ctx.restore();
        }
        if (punt) {
            // Terwijl je sleept groeit het puntje licht en krijgt het een dunne
            // ring — "het instrument toont zijn precisie alleen wanneer je hem
            // gebruikt" geldt ook voor de greep zelf, niet alleen de ticks.
            const r = sleept ? 6.5 : 5;
            ctx.save();
            ctx.shadowColor = "rgba(237, 233, 222, 0.6)";
            ctx.shadowBlur = sleept ? 10 : 5;
            ctx.beginPath();
            ctx.arc(punt.x, punt.y, r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(237, 233, 222, 0.94)";
            ctx.fill();
            ctx.restore();
            if (sleept) {
                ctx.beginPath();
                ctx.arc(punt.x, punt.y, r + 4, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(237, 233, 222, 0.35)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        raf = requestAnimationFrame(herteken);
    }
    function positieNaarWaarden(x, y) {
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
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }
    function afstandTotCentrum(x, y) {
        return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    }
    function opTik(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (afstandTotCentrum(x, y) > straal * 1.15)
            return;
        punt = { x, y };
        waarden = positieNaarWaarden(x, y);
        onKies(waarden.energie, waarden.toon);
    }
    function pointerDown(e) {
        sleept = true;
        opTik(e.clientX, e.clientY);
    }
    function pointerMove(e) {
        if (e.buttons > 0)
            opTik(e.clientX, e.clientY);
    }
    function pointerUp() {
        if (sleept && punt)
            opties.onKlaar?.(waarden.energie, waarden.toon);
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
        if (punt)
            punt = waardenNaarPositie(waarden.energie, waarden.toon);
    }
    const stopMaat = opMaat(canvas, resize);
    // v2.3 §3.3: alles staat stil zodra het scherm niet zichtbaar is.
    function opZichtbaarheid() {
        cancelAnimationFrame(raf);
        if (!document.hidden)
            raf = requestAnimationFrame(herteken);
    }
    document.addEventListener("visibilitychange", opZichtbaarheid);
    raf = requestAnimationFrame(herteken);
    return () => {
        cancelAnimationFrame(raf);
        stopMaat();
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
export function nauwelijksVerschoven(van, naar) {
    return Math.hypot(naar.energie - van.energie, naar.toon - van.toon) < NAUWELIJKS_VERSCHOVEN;
}
export function tekenVerschil(canvas, van, naar, rustig = false) {
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
        ctx.strokeStyle = "rgba(237, 233, 222, 0.3)";
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
        const punten = [
            [p1, 0.45],
            [p2, 0.9 * t],
        ];
        for (const [p, alpha] of punten) {
            ctx.save();
            ctx.shadowColor = `rgba(237, 233, 222, ${alpha * 0.6})`;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(237, 233, 222, ${alpha})`;
            ctx.fill();
            ctx.restore();
        }
        if (t < 1)
            raf = requestAnimationFrame(herteken);
    }
    function resize() {
        ctx = sizeCanvas(canvas);
        rect = canvas.getBoundingClientRect();
        // Eén lus, ook als de observer vlak na de eerste rAF nog eens vuurt:
        // anders lopen er twee hertekenketens door elkaar.
        cancelAnimationFrame(raf);
        herteken();
    }
    const stopMaat = opMaat(canvas, resize);
    raf = requestAnimationFrame(herteken);
    return () => {
        cancelAnimationFrame(raf);
        stopMaat();
    };
}
/**
 * v2.3 §1.2 `--brass` (donkere waarde): het ene accent dat de hele interface
 * draagt. Stond hier op een zelfgekozen tint; nu de waarde uit het palet.
 */
const MESSING = "212, 161, 58";
function seededRandom(seed) {
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
        // v25 — `x ^ (x >>> 13)` is een gewone (getekende) XOR: zodra bit 31
        // gezet is, levert dat een negatief getal op, en dus een uitkomst
        // buiten [0, 1) — soms zelfs negatief. `berekenSterPosities` merkte dat
        // nooit, want de uitkomst gaat daar altijd nog door `fractie()`, die elk
        // getal terugvouwt naar [0, 1). Directe aanroepen (het achtergrond-
        // sterrenveld) hadden dat vangnet niet: ongeveer de helft van de punten
        // kreeg een negatieve coördinaat en viel letterlijk buiten het canvas.
        // `>>> 0` dwingt het resultaat terug naar een ongetekend getal.
        x = (x ^ (x >>> 13)) >>> 0;
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
function fractie(v) {
    return v - Math.floor(v);
}
export function berekenSterPosities(sterren, breedte, hoogte) {
    const posities = new Map();
    const perStreek = { lichaam: [], geest: [], verbinding: [], ziel: [] };
    for (const s of sterren)
        perStreek[s.streek].push(s);
    const kwadranten = [
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
function sterOnderTik(sterren, posities, x, y, radius = 16) {
    let dichtstbij = null;
    let kleinste = radius;
    for (const s of sterren) {
        const p = posities.get(s.id);
        if (!p)
            continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < kleinste) {
            kleinste = d;
            dichtstbij = s;
        }
    }
    return dichtstbij;
}
function tekenLijnen(ctx, posities, sterIds, fractie, alpha) {
    if (sterIds.length < 2)
        return;
    const punten = sterIds.map((id) => posities.get(id)).filter(Boolean);
    if (punten.length < 2)
        return;
    const segmenten = punten.length - 1;
    const tot = fractie * segmenten;
    ctx.save();
    ctx.shadowColor = `rgba(${MESSING}, ${alpha * 0.8})`;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = `rgba(${MESSING}, ${alpha})`;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(punten[0].x, punten[0].y);
    for (let i = 0; i < segmenten; i++) {
        const deel = Math.min(1, Math.max(0, tot - i));
        if (deel <= 0)
            break;
        const a = punten[i];
        const b = punten[i + 1];
        ctx.lineTo(a.x + (b.x - a.x) * deel, a.y + (b.y - a.y) * deel);
    }
    ctx.stroke();
    ctx.restore();
}
/**
 * Het lichtpuntje op de kop van een lijn die nog aan het tekenen is — exact
 * dezelfde segment/fractie-wiskunde als tekenLijnen, maar dan alleen het
 * uiterste punt, iets feller dan de lijn zelf.
 */
function tekenLijnKop(ctx, posities, sterIds, fractie) {
    const punten = sterIds.map((id) => posities.get(id)).filter(Boolean);
    if (punten.length < 2)
        return;
    const segmenten = punten.length - 1;
    const tot = Math.max(0, Math.min(segmenten, fractie * segmenten));
    const i = Math.min(segmenten - 1, Math.floor(tot));
    const deel = tot - i;
    const a = punten[i];
    const b = punten[i + 1];
    const x = a.x + (b.x - a.x) * deel;
    const y = a.y + (b.y - a.y) * deel;
    ctx.save();
    ctx.shadowColor = `rgba(${MESSING}, 0.9)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 238, 220, 0.95)`;
    ctx.fill();
    ctx.restore();
}
/**
 * Het bijschrift onder een sterrenbeeld. Zonder dit zou de naam die je geeft
 * nergens meer terugkomen, en dan is benoemen een lege handeling. Eén regel
 * per sterrenbeeld, hooguit vier in de hele app, in dezelfde messingtoon als
 * de lijnen — geen label, geen kaartje, geen titelbalk.
 */
function tekenNaam(ctx, posities, sterrenbeeld, alpha) {
    const naam = sterrenbeeld.naam.trim();
    if (!naam)
        return;
    const punten = sterrenbeeld.sterIds
        .map((id) => posities.get(id))
        .filter(Boolean);
    if (punten.length === 0)
        return;
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
function tekenSter(ctx, p, metZin, helderheid) {
    const r = p.r * (metZin ? 1.4 : 1);
    ctx.save();
    ctx.shadowColor = `rgba(237, 226, 196, ${Math.min(0.8, helderheid)})`;
    ctx.shadowBlur = r * (metZin ? 6 : 3.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245, 238, 220, ${helderheid})`;
    ctx.fill();
    ctx.restore();
    // Een dunne vierpuntsflonker, alleen op sterren die een zin dragen — het
    // onderscheid dat "dit is een van jouw echte momenten" ook zonder tikken
    // al voelbaar maakt, zoals een sterfilter op een lens.
    if (metZin) {
        const lengte = r * 4.2;
        ctx.save();
        ctx.strokeStyle = `rgba(245, 238, 220, ${helderheid * 0.55})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - lengte, p.y);
        ctx.lineTo(p.x + lengte, p.y);
        ctx.moveTo(p.x, p.y - lengte);
        ctx.lineTo(p.x, p.y + lengte);
        ctx.stroke();
        ctx.restore();
    }
}
const STERKLEUREN = [
    [0.82, "237, 233, 222"], // wit — de meerderheid
    [0.1, "212, 161, 58"], // flauw messing
    [0.08, "139, 155, 192"], // flauw dusk-blauw
];
function kiesSterkleur(random) {
    const r = random();
    let cumulatief = 0;
    for (const [aandeel, rgb] of STERKLEUREN) {
        cumulatief += aandeel;
        if (r <= cumulatief)
            return rgb;
    }
    return STERKLEUREN[0][1];
}
/**
 * Decoratieve achtergrondsterren voor De Hemel — puur sfeer, geen data.
 * Een hemel met alleen de paar sterren die je zelf verdiende (soms maar
 * één of twee) oogt als een lege zwarte rechthoek in plaats van een hemel.
 * Een stille, vaste sterrenstrooiing erachter — veel kleiner en dover dan
 * de echte sterren — geeft ruimte, en laat jouw eigen sterren er juist
 * helderder in staan. Geseed op de afmeting: geen ander patroon bij elke
 * herlaad, alleen bij een echt andere schermgrootte.
 */
function genereerAchtergrondSterren(breedte, hoogte) {
    if (breedte <= 0 || hoogte <= 0)
        return [];
    const random = seededRandom(`achtergrond-${Math.round(breedte)}x${Math.round(hoogte)}`);
    // v26 — was 2600, dichter voor het edge-to-edge scherm (v26): het volledige
    // scherm is nu vaak groter dan de vorige 60vh-canvas binnen de gecentreerde
    // kolom, en een even dichte strooiing daarop oogt kaler dan voorheen.
    const aantal = Math.round((breedte * hoogte) / 1500);
    const sterren = [];
    for (let i = 0; i < aantal; i++) {
        sterren.push({
            x: random() * breedte,
            y: random() * hoogte,
            r: 0.6 + random() * random() * 1.6,
            basisAlpha: 0.18 + random() * 0.42,
            twinkel: random() * Math.PI * 2,
            kleur: kiesSterkleur(random),
        });
    }
    return sterren;
}
function tekenAchtergrondSterren(ctx, sterren, fase, rustig) {
    for (const s of sterren) {
        const twinkel = rustig ? 1 : 0.7 + 0.3 * Math.sin(fase * 0.4 + s.twinkel);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.kleur}, ${s.basisAlpha * twinkel})`;
        ctx.fill();
    }
}
/**
 * De atmosfeer: een verticale ondergrond (nét iets lichter naar onderen, als
 * een verre horizon-gloed in plaats van een vlak zwart) plus twee heel trage,
 * nauwelijks zichtbare gloedvlekken die rondzweven. Puur sfeer — dezelfde
 * reden als de achtergrondsterren, maar dan als kleurwolk in plaats van
 * puntjes. `rustig`: de vlekken staan stil in plaats van te zweven, maar
 * blijven verder gewoon zichtbaar (dit is geen animatie om naar te kijken,
 * dus geen reden om 'm uit te zetten).
 */
function tekenAtmosfeer(ctx, breedte, hoogte, tNu, rustig) {
    const grond = ctx.createLinearGradient(0, 0, 0, hoogte);
    grond.addColorStop(0, "#05060b");
    grond.addColorStop(0.6, "#080a15");
    grond.addColorStop(1, "#0d1220");
    ctx.fillStyle = grond;
    ctx.fillRect(0, 0, breedte, hoogte);
    const t = rustig ? 0 : tNu;
    const vlekken = [
        { kleur: "139, 155, 192", x0: 0.26, y0: 0.2, r: 0.55, snelheid: 0.00006, fase0: 0 },
        { kleur: "212, 161, 58", x0: 0.76, y0: 0.7, r: 0.4, snelheid: 0.00004, fase0: 2.4 },
    ];
    for (const v of vlekken) {
        const dx = Math.sin(t * v.snelheid + v.fase0) * 0.05;
        const dy = Math.cos(t * v.snelheid * 0.8 + v.fase0) * 0.04;
        const cx = (v.x0 + dx) * breedte;
        const cy = (v.y0 + dy) * hoogte;
        const straal = v.r * Math.max(breedte, hoogte);
        const gloed = ctx.createRadialGradient(cx, cy, 0, cx, cy, straal);
        gloed.addColorStop(0, `rgba(${v.kleur}, 0.05)`);
        gloed.addColorStop(1, `rgba(${v.kleur}, 0)`);
        ctx.fillStyle = gloed;
        ctx.fillRect(0, 0, breedte, hoogte);
    }
}
/**
 * Eén vaste, zachte band diagonaal over de hemel — een melkwegstrook. Geen
 * afzonderlijke sterren, gewoon een heel flauwe lichtverdikking; samen met de
 * dichtere achtergrondstrooiing erbovenop oogt dit als een echte nachthemel
 * in plaats van willekeurig gestrooide stippen.
 */
function tekenMelkweg(ctx, breedte, hoogte) {
    const diagonaal = Math.max(breedte, hoogte) * 1.7;
    ctx.save();
    ctx.translate(breedte * 0.5, hoogte * 0.4);
    ctx.rotate(-0.36);
    const dikte = Math.max(breedte, hoogte) * 0.55;
    const band = ctx.createLinearGradient(0, -dikte / 2, 0, dikte / 2);
    band.addColorStop(0, "rgba(205, 213, 232, 0)");
    band.addColorStop(0.5, "rgba(205, 213, 232, 0.05)");
    band.addColorStop(1, "rgba(205, 213, 232, 0)");
    ctx.fillStyle = band;
    ctx.fillRect(-diagonaal / 2, -dikte / 2, diagonaal, dikte);
    ctx.restore();
}
/**
 * Een vignet — de randen net iets donkerder dan het midden, zoals een echte
 * lange-belichtingsfoto van de nachthemel. Dit is wat het geheel een gevoel
 * van diepte en een lens geeft in plaats van een plat, uniform gekleurd
 * vlak. Statisch, dus geen `rustig`-uitzondering nodig.
 */
function tekenVignet(ctx, breedte, hoogte) {
    const straal = Math.max(breedte, hoogte);
    const gradient = ctx.createRadialGradient(breedte / 2, hoogte / 2, straal * 0.35, breedte / 2, hoogte / 2, straal * 0.78);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(2, 3, 7, 0.5)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, breedte, hoogte);
}
/**
 * Een enkele vallende ster, zeldzaam en kort — de ene decoratie die wél een
 * verrassing mag zijn in plaats van een voorspelbare lus. `rustig` zet 'm
 * volledig uit: dit is precies het soort onverwachte beweging die
 * `rustigeBeelden`/`prefers-reduced-motion` bedoelt te vermijden.
 */
function volgendeValMoment(nu) {
    return nu + 16000 + Math.random() * 22000;
}
function spawnVallendeSter(breedte, hoogte, nu) {
    const linksNaarRechts = Math.random() < 0.5;
    const y0 = hoogte * (0.05 + Math.random() * 0.35);
    const lengte = Math.max(breedte, hoogte) * (0.35 + Math.random() * 0.25);
    const hoek = (linksNaarRechts ? 1 : -1) * (0.35 + Math.random() * 0.25);
    const x0 = linksNaarRechts ? breedte * -0.05 : breedte * 1.05;
    return {
        x0,
        y0,
        x1: x0 + Math.cos(hoek) * lengte * (linksNaarRechts ? 1 : -1),
        y1: y0 + Math.sin(Math.abs(hoek)) * lengte,
        begonnenOp: nu,
        duurMs: 900 + Math.random() * 400,
    };
}
function tekenVallendeSterren(ctx, sterren, nu) {
    for (const v of sterren) {
        const t = (nu - v.begonnenOp) / v.duurMs;
        if (t < 0 || t > 1)
            continue;
        const alpha = t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1;
        const x = v.x0 + (v.x1 - v.x0) * t;
        const y = v.y0 + (v.y1 - v.y0) * t;
        const staartLengte = 42;
        const dx = v.x1 - v.x0;
        const dy = v.y1 - v.y0;
        const norm = Math.hypot(dx, dy) || 1;
        const tx = x - (dx / norm) * staartLengte;
        const ty = y - (dy / norm) * staartLengte;
        const staart = ctx.createLinearGradient(x, y, tx, ty);
        staart.addColorStop(0, `rgba(255, 255, 255, ${0.85 * alpha})`);
        staart.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = staart;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.save();
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        ctx.restore();
    }
}
export function tekenHemel(canvas, sterren, onTikSter, opties = {}) {
    const { sterrenbeelden = [], nieuwSterrenbeeldId = null, rustig = false } = opties;
    let ctx = sizeCanvas(canvas);
    let rect = canvas.getBoundingClientRect();
    let posities = berekenSterPosities(sterren, rect.width, rect.height);
    let achtergrond = genereerAchtergrondSterren(rect.width, rect.height);
    let raf = 0;
    let fase = 0;
    const begonnenOp = performance.now();
    const DRAW_ON_MS = 700;
    // Eén zeldzame vallende ster af en toe — uitgezet bij rustige beelden.
    let vallendeSterren = [];
    let volgendeVal = rustig ? Infinity : volgendeValMoment(begonnenOp);
    // De korte lichtpuls onder je vinger bij het tikken op een ster.
    let tikPuls = null;
    const TIK_PULS_MS = 650;
    // Eén zachte flits over het hele beeld zodra een nieuw sterrenbeeld klaar
    // is met opkomen — de "beloning" voor het net getekende sterrenbeeld,
    // eenmalig, nooit herhaald (net als de draw-on zelf).
    let voltooiGepulst = false;
    let voltooiPulsBegonnenOp = 0;
    const VOLTOOI_PULS_MS = 900;
    // Diepteparallax: alleen de achtergrond (atmosfeer, melkweg, verre sterren,
    // vallende sterren) schuift licht mee met je vinger of muis — je eigen
    // sterren blijven op hun exacte, tikbare plek staan. Zonder aanraking
    // zakt dit vanzelf terug naar het midden. Uitgezet bij rustige beelden,
    // net als elke andere beweging die niet stilstaat als je 'm niet aanraakt.
    let parallaxDoelX = 0;
    let parallaxDoelY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    const PARALLAX_MAX = 16;
    function pointerBewogen(clientX, clientY) {
        if (rustig)
            return;
        const r = canvas.getBoundingClientRect();
        const nx = ((clientX - r.left) / r.width) * 2 - 1;
        const ny = ((clientY - r.top) / r.height) * 2 - 1;
        parallaxDoelX = Math.max(-1, Math.min(1, nx)) * PARALLAX_MAX;
        parallaxDoelY = Math.max(-1, Math.min(1, ny)) * PARALLAX_MAX;
    }
    function pointerMoveHandler(e) {
        pointerBewogen(e.clientX, e.clientY);
    }
    function pointerWegHandler() {
        parallaxDoelX = 0;
        parallaxDoelY = 0;
    }
    canvas.addEventListener("pointermove", pointerMoveHandler);
    canvas.addEventListener("pointerleave", pointerWegHandler);
    canvas.addEventListener("pointerup", pointerWegHandler);
    function herteken() {
        const nu = performance.now();
        ctx.clearRect(0, 0, rect.width, rect.height);
        fase += 0.02;
        parallaxX += (parallaxDoelX - parallaxX) * 0.05;
        parallaxY += (parallaxDoelY - parallaxY) * 0.05;
        const verstreken = nu - begonnenOp;
        const drawOn = rustig ? 1 : Math.min(1, verstreken / DRAW_ON_MS);
        ctx.save();
        ctx.translate(parallaxX, parallaxY);
        tekenAtmosfeer(ctx, rect.width, rect.height, nu, rustig);
        tekenMelkweg(ctx, rect.width, rect.height);
        tekenAchtergrondSterren(ctx, achtergrond, fase, rustig);
        if (!rustig) {
            if (nu >= volgendeVal) {
                vallendeSterren.push(spawnVallendeSter(rect.width, rect.height, nu));
                volgendeVal = volgendeValMoment(nu);
            }
            vallendeSterren = vallendeSterren.filter((v) => nu - v.begonnenOp < v.duurMs);
            tekenVallendeSterren(ctx, vallendeSterren, nu);
        }
        ctx.restore();
        for (const sb of sterrenbeelden) {
            const isNieuw = sb.id === nieuwSterrenbeeldId;
            const fractie = isNieuw ? drawOn : 1;
            tekenLijnen(ctx, posities, sb.sterIds, fractie, 0.5);
            // Een klein lichtpuntje dat over de lijn meereist terwijl ze getekend
            // wordt — zonder dit voelde het opkomen als een statische tekening in
            // plaats van iets dat ontstaat.
            if (isNieuw && fractie < 1 && !rustig)
                tekenLijnKop(ctx, posities, sb.sterIds, fractie);
            // De naam komt pas als de lijnen er helemaal staan.
            tekenNaam(ctx, posities, sb, isNieuw ? Math.max(0, (drawOn - 0.8) * 5) * 0.45 : 0.45);
            if (isNieuw && drawOn >= 1 && !voltooiGepulst && !rustig) {
                voltooiGepulst = true;
                voltooiPulsBegonnenOp = nu;
            }
        }
        for (const s of sterren) {
            const p = posities.get(s.id);
            if (!p)
                continue;
            const twinkel = rustig ? 0.85 : 0.6 + 0.4 * Math.sin(fase + p.twinkel);
            let helderheid = 0.4 + 0.5 * twinkel;
            // Een zeldzame, korte opflakkering per ster — echte sterren fonkelen
            // onregelmatig, niet als een gladde sinus. Elke ster krijgt zijn eigen,
            // uit zijn positie afgeleide ritme, dus dit is puur een functie van de
            // tijd — geen aparte planning of state nodig.
            if (!rustig) {
                const vlamFase = Math.sin(fase * 0.16 + p.twinkel * 3.7);
                if (vlamFase > 0.965)
                    helderheid += ((vlamFase - 0.965) / 0.035) * 0.55;
            }
            if (voltooiGepulst) {
                const isVanNieuw = sterrenbeelden
                    .find((sb) => sb.id === nieuwSterrenbeeldId)
                    ?.sterIds.includes(s.id);
                if (isVanNieuw) {
                    const tv = (nu - voltooiPulsBegonnenOp) / VOLTOOI_PULS_MS;
                    if (tv >= 0 && tv <= 1)
                        helderheid += (1 - tv) * 0.6;
                }
            }
            if (tikPuls) {
                const dichtbij = Math.hypot(p.x - tikPuls.x, p.y - tikPuls.y) < 1;
                if (dichtbij) {
                    const tt = (nu - tikPuls.begonnenOp) / TIK_PULS_MS;
                    if (tt >= 0 && tt <= 1)
                        helderheid += (1 - tt) * 0.5;
                }
            }
            tekenSter(ctx, p, Boolean(s.zin), Math.min(1, helderheid));
        }
        if (tikPuls) {
            const tt = (nu - tikPuls.begonnenOp) / TIK_PULS_MS;
            if (tt > 1) {
                tikPuls = null;
            }
            else {
                const straal = 6 + tt * 18;
                ctx.beginPath();
                ctx.arc(tikPuls.x, tikPuls.y, straal, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${MESSING}, ${(1 - tt) * 0.6})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        tekenVignet(ctx, rect.width, rect.height);
        raf = requestAnimationFrame(herteken);
    }
    function clickHandler(e) {
        const r = canvas.getBoundingClientRect();
        const ster = sterOnderTik(sterren, posities, e.clientX - r.left, e.clientY - r.top);
        if (ster) {
            onTikSter(ster);
            const p = posities.get(ster.id);
            if (p)
                tikPuls = { x: p.x, y: p.y, begonnenOp: performance.now() };
        }
    }
    canvas.addEventListener("click", clickHandler);
    function resize() {
        ctx = sizeCanvas(canvas);
        rect = canvas.getBoundingClientRect();
        posities = berekenSterPosities(sterren, rect.width, rect.height);
        achtergrond = genereerAchtergrondSterren(rect.width, rect.height);
    }
    const stopMaat = opMaat(canvas, resize);
    raf = requestAnimationFrame(herteken);
    return () => {
        cancelAnimationFrame(raf);
        stopMaat();
        canvas.removeEventListener("click", clickHandler);
        canvas.removeEventListener("pointermove", pointerMoveHandler);
        canvas.removeEventListener("pointerleave", pointerWegHandler);
        canvas.removeEventListener("pointerup", pointerWegHandler);
    };
}
/**
 * Tekenmodus binnen De Hemel (schermenoverzicht.md S8): dezelfde hemel, maar
 * alleen de sterren van één streek zijn aantikbaar. Elke tik verbindt de ster
 * met de vorige. De streken eromheen blijven staan — je tekent in je eigen
 * hemel, niet op een leeg vel — maar ze dimmen zodat duidelijk is waar je bent.
 */
export function tekenSterrenbeeldModus(canvas, sterren, streek, onVerandering, rustig = false) {
    let ctx = sizeCanvas(canvas);
    let rect = canvas.getBoundingClientRect();
    let posities = berekenSterPosities(sterren, rect.width, rect.height);
    let achtergrond = genereerAchtergrondSterren(rect.width, rect.height);
    let raf = 0;
    let fase = 0;
    const eigen = sterren.filter((s) => s.streek === streek);
    let pad = [];
    function herteken() {
        ctx.clearRect(0, 0, rect.width, rect.height);
        fase += 0.02;
        tekenAtmosfeer(ctx, rect.width, rect.height, performance.now(), rustig);
        tekenMelkweg(ctx, rect.width, rect.height);
        tekenAchtergrondSterren(ctx, achtergrond, fase, rustig);
        tekenLijnen(ctx, posities, pad, 1, 0.6);
        for (const s of sterren) {
            const p = posities.get(s.id);
            if (!p)
                continue;
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
        tekenVignet(ctx, rect.width, rect.height);
        raf = requestAnimationFrame(herteken);
    }
    function clickHandler(e) {
        const r = canvas.getBoundingClientRect();
        const ster = sterOnderTik(eigen, posities, e.clientX - r.left, e.clientY - r.top, 20);
        if (!ster)
            return;
        // Dezelfde ster nog eens aantikken doet niets — geen dubbele punten in
        // een sterrenbeeld, en geen lijn die op zichzelf terugkomt.
        if (pad.includes(ster.id))
            return;
        pad = [...pad, ster.id];
        onVerandering(pad);
    }
    canvas.addEventListener("click", clickHandler);
    function resize() {
        ctx = sizeCanvas(canvas);
        rect = canvas.getBoundingClientRect();
        posities = berekenSterPosities(sterren, rect.width, rect.height);
        achtergrond = genereerAchtergrondSterren(rect.width, rect.height);
    }
    const stopMaat = opMaat(canvas, resize);
    raf = requestAnimationFrame(herteken);
    return {
        pad: () => [...pad],
        ongedaanMaken() {
            if (pad.length === 0)
                return;
            pad = pad.slice(0, -1);
            onVerandering(pad);
        },
        stop() {
            cancelAnimationFrame(raf);
            stopMaat();
            canvas.removeEventListener("click", clickHandler);
        },
    };
}
