// dom.ts — kleine DOM-helper, geen framework.
export function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (key === "class")
            node.className = String(value);
        else if (key.startsWith("on") && typeof value === "function") {
            node.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else if (key === "html") {
            node.innerHTML = String(value);
        }
        else if (value !== undefined && value !== null && value !== false) {
            node.setAttribute(key, String(value));
        }
    }
    for (const child of children) {
        if (child === null || child === undefined || child === false)
            continue;
        node.append(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
}
export function root() {
    const node = document.getElementById("app");
    if (!node)
        throw new Error("Geen #app-element gevonden.");
    return node;
}
export function render(children) {
    const app = root();
    app.replaceChildren(...children.filter(Boolean));
}
/** Dimt het scherm en voert dan de callback uit — voor S7 (Afsluiten). */
export function dimEnDan(callback, ms = 1400) {
    const app = root();
    app.classList.add("fade-uit");
    setTimeout(() => {
        callback();
        app.classList.remove("fade-uit");
    }, ms);
}
