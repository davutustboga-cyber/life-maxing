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

type ViewTransition = { ready: Promise<void>; updateCallbackDone: Promise<void>; finished: Promise<void> };
type DocumentMetViewTransition = Document & { startViewTransition?: (cb: () => void) => ViewTransition };

/** Meerdere render()-aanroepen kunnen kort na elkaar vallen (bv. een chip die
 * meteen zichzelf opnieuw tekent). De API staat geen tweede transitie toe
 * terwijl de eerste nog loopt — dat geeft geen zichtbaar probleem, alleen een
 * afgewezen belofte, maar wel eentje die anders als onafgehandelde fout in de
 * console verschijnt. Deze ene vlag zorgt dat zo'n snelle opeenvolging gewoon
 * direct wisselt (zonder cross-fade voor die ene stap) in plaats van een
 * tweede transitie te proberen starten. */
let lopendeTransitie: ViewTransition | null = null;

/**
 * Elke schermwissel was tot nu toe een harde, instante DOM-vervanging
 * (replaceChildren) — vooral bij het wisselen tussen Nu/Doen/Terugkijken
 * voelde dat schokkerig. De View Transitions API (breed ondersteund in
 * moderne mobiele browsers) geeft hier een zachte cross-fade tussen oud en
 * nieuw scherm, puur door de browser zelf — geen eigen animatietiming nodig
 * en geen risico op een tussentijds leeg scherm. Op een browser zonder
 * ondersteuning valt dit terug op de oude, directe vervanging.
 */
export function render(children: Kind[]): void {
  const app = root();
  const wissel = () => app.replaceChildren(...(children.filter(Boolean) as Node[]));
  const d = document as DocumentMetViewTransition;
  if (typeof d.startViewTransition === "function" && !lopendeTransitie) {
    const transitie = d.startViewTransition(wissel);
    lopendeTransitie = transitie;
    // Alle drie de beloften van een transitie kunnen worden afgewezen zodra
    // hij wordt overgeslagen (bv. door een snelle opeenvolgende wissel of een
    // DOM-mutatie buiten deze callback om) — zonder deze .catch()'s duiken
    // die als onafgehandelde consolefouten op, terwijl de wissel zelf altijd
    // gewoon doorgaat (de callback loopt synchroon, ongeacht of de animatie
    // zelf lukt).
    transitie.ready.catch(() => undefined);
    transitie.updateCallbackDone.catch(() => undefined);
    transitie.finished
      .catch(() => undefined)
      .finally(() => {
        if (lopendeTransitie === transitie) lopendeTransitie = null;
      });
  } else {
    wissel();
  }
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
