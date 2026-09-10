// dom.ts — kleine DOM-helper, geen framework.

type Kind = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  children: Kind[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = String(value);
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "html") {
      node.innerHTML = String(value);
    } else if (value !== undefined && value !== null && value !== false) {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

export function root(): HTMLElement {
  const node = document.getElementById("app");
  if (!node) throw new Error("Geen #app-element gevonden.");
  return node;
}

/**
 * Eén schermwissel: de oude inhoud eruit, de nieuwe erin.
 *
 * v25 — hier stond sinds de vorige ronde een cross-fade via de View
 * Transitions API. Die is eruit, om twee redenen die allebei gemeten zijn:
 *
 * 1. **Tikken raakten kwijt.** Een view transition tekent de overgang in de
 *    top layer, en die laag doet mee aan het aanwijzen. Gemeten met
 *    `document.elementFromPoint()` midden op De Schijf: tijdens de overgang
 *    kwam de tik niet bij het canvas uit maar bij `<html>`. Dat betekende dat
 *    de app een fractie van een seconde ná élke schermwissel niets deed met
 *    je vinger. `pointer-events: none` op de overgangs-pseudo-elementen hielp
 *    niet betrouwbaar.
 * 2. **Alles wat gemeten moet worden, was nog niet gemeten.** De API voert de
 *    DOM-wissel in een callback uit, dus `render()` was niet meer synchroon.
 *    `app.ts` roept de canvas-functies vlak ná `render()` aan, en die kregen
 *    daardoor een canvas dat nog niet in de pagina stond: breedte nul, en dus
 *    een zwart vlak in plaats van De Schijf, Het Verschil, De Hemel en de
 *    sterrenbeeld-tekenmodus. (`canvas.ts` vangt dat sinds v25 zelf ook op
 *    met een ResizeObserver — dubbel beveiligd, want dat lost tegelijk het
 *    draaien van de telefoon en het inklappen van de adresbalk op.)
 *
 * De zachte intrede is er nog: `.scherm` heeft in style.css al de
 * `scherm-in`-animatie, die per nieuw scherm afspeelt, niets blokkeert en
 * door prefers-reduced-motion netjes wordt uitgezet.
 */
/**
 * v25 — een schermwissel liet de scrollpositie van het vórige scherm gewoon
 * staan. Ging je van een lang scherm (bv. Terugkijken, uitgescrolld) naar
 * een korter scherm (bv. Nu), dan stond de pagina even op een scrollpositie
 * die niet meer bestond — mobiel Safari corrigeert dat zelf, maar doet dat
 * met een adresbalk die in-/uitklapt en de viewport laat meeschalen. Dát is
 * het "zoomt in en hangt even" bij het tikken op de navigatiebalk: geen
 * echte zoom, maar de browser die de scroll herstelt. Terug naar boven vóór
 * de wissel voorkomt dat de browser ooit iets hoeft te herstellen.
 */
export function render(children: Kind[]): void {
  window.scrollTo(0, 0);
  root().replaceChildren(...(children.filter(Boolean) as Node[]));
}

/** Dimt het scherm en voert dan de callback uit — voor S7 (Afsluiten). */
export function dimEnDan(callback: () => void, ms = 1400): void {
  const app = root();
  app.classList.add("fade-uit");
  setTimeout(() => {
    callback();
    app.classList.remove("fade-uit");
  }, ms);
}
