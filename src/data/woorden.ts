// woorden.ts — vertaling van woorden.yaml. Zie dat bestand voor de volledige
// toelichting bij de verdeling. Coördinaten zijn NOOIT zichtbaar in de UI.

import type { Woord } from "../lib/types.js";

export const woorden: Woord[] = [
  // Hoog + zwaar
  { id: "gespannen", woord: "gespannen", energie: 0.55, toon: -0.45 },
  { id: "boos", woord: "boos", energie: 0.75, toon: -0.75 },
  { id: "gejaagd", woord: "gejaagd", energie: 0.70, toon: -0.35 },
  { id: "onrustig", woord: "onrustig", energie: 0.50, toon: -0.40 },
  { id: "overprikkeld", woord: "overprikkeld", energie: 0.80, toon: -0.55 },
  { id: "paniekerig", woord: "paniekerig", energie: 0.90, toon: -0.85 },
  { id: "geirriteerd", woord: "geïrriteerd", energie: 0.55, toon: -0.55 },
  { id: "rusteloos", woord: "rusteloos", energie: 0.45, toon: -0.30 },

  // Laag + zwaar
  { id: "leeg", woord: "leeg", energie: -0.75, toon: -0.70, zwaarsteGroep: true },
  { id: "lusteloos", woord: "lusteloos", energie: -0.60, toon: -0.40 },
  { id: "somber", woord: "somber", energie: -0.55, toon: -0.65 },
  { id: "moe", woord: "moe", energie: -0.50, toon: -0.25 },
  { id: "dof", woord: "dof", energie: -0.65, toon: -0.35 },
  { id: "uitgeput", woord: "uitgeput", energie: -0.85, toon: -0.60 },
  { id: "uitzichtloos", woord: "uitzichtloos", energie: -0.70, toon: -0.85, zwaarsteGroep: true },
  { id: "eenzaam", woord: "eenzaam", energie: -0.40, toon: -0.60 },
  { id: "verdrietig", woord: "verdrietig", energie: -0.35, toon: -0.70 },
  { id: "op", woord: "op", energie: -0.90, toon: -0.80, zwaarsteGroep: true },
  { id: "niets", woord: "niets", energie: -0.85, toon: -0.75, zwaarsteGroep: true },
  { id: "machteloos", woord: "machteloos", energie: -0.60, toon: -0.75, zwaarsteGroep: true },

  // Midden, ordenend
  { id: "piekerend", woord: "piekerend", energie: 0.15, toon: -0.50, ordenend: true },
  { id: "malend", woord: "malend", energie: 0.20, toon: -0.55, ordenend: true },
  { id: "besluiteloos", woord: "besluiteloos", energie: -0.10, toon: -0.35, ordenend: true },
  { id: "onzeker", woord: "onzeker", energie: 0.00, toon: -0.40, ordenend: true },
  { id: "schuldig", woord: "schuldig", energie: -0.15, toon: -0.60, ordenend: true },
  { id: "zelfkritisch", woord: "zelfkritisch", energie: 0.05, toon: -0.55, ordenend: true },
  { id: "wantrouwend", woord: "wantrouwend", energie: 0.10, toon: -0.45, ordenend: true },
  { id: "verward", woord: "verward", energie: 0.25, toon: -0.30, ordenend: true },

  // Laag + licht
  { id: "rustig", woord: "rustig", energie: -0.40, toon: 0.55 },
  { id: "tevreden", woord: "tevreden", energie: -0.30, toon: 0.65 },
  { id: "vredig", woord: "vredig", energie: -0.50, toon: 0.70 },
  { id: "dankbaar", woord: "dankbaar", energie: -0.20, toon: 0.75 },
  { id: "licht", woord: "licht", energie: -0.35, toon: 0.60 },
  { id: "ontspannen", woord: "ontspannen", energie: -0.45, toon: 0.50 },

  // Hoog + licht
  { id: "blij", woord: "blij", energie: 0.50, toon: 0.75 },
  { id: "vol", woord: "vol", energie: 0.60, toon: 0.65 },
  { id: "gemotiveerd", woord: "gemotiveerd", energie: 0.70, toon: 0.60 },
  { id: "verliefd_op_het_leven", woord: "verliefd op het leven", energie: 0.65, toon: 0.85 },
  { id: "hoopvol", woord: "hoopvol", energie: 0.40, toon: 0.70 },
  { id: "trots", woord: "trots", energie: 0.55, toon: 0.60 },
];

/**
 * Eigen getypte woorden (datamodel.md → woorden_uitbreiding). teksten.yaml
 * belooft bij het typen: "Onthouden. Dit woord staat er de volgende keer ook
 * bij." Zonder deze registratie werd dat woord wél bewaard maar nooit meer
 * teruggegeven, en had een eigen woord ook geen coördinaten voor de zone- en
 * briefberekening.
 */
let eigenWoorden: Woord[] = [];

export function zetEigenWoorden(lijst: Woord[]): void {
  eigenWoorden = lijst;
}

export function alleWoorden(): Woord[] {
  return eigenWoorden.length > 0 ? [...woorden, ...eigenWoorden] : woorden;
}

/**
 * schermenoverzicht.md S2: "een zoekveld eronder met de volledige lijst van
 * veertig doorzoekbaar, plus de mogelijkheid een nieuw woord te typen." Het
 * zoeken ontbrak: het veld maakte van élke invoer meteen een eigen woord,
 * ook als het woord gewoon in de lijst stond.
 */
export function zoekWoorden(tekst: string): Woord[] {
  const naald = tekst.trim().toLowerCase();
  if (!naald) return [];
  return alleWoorden().filter((w) => w.woord.toLowerCase().includes(naald));
}

export function woordById(id: string): Woord | undefined {
  return alleWoorden().find((w) => w.id === id);
}

/** Geeft de dichtstbijzijnde woorden bij een aangetikte positie, dichtstbij eerst. */
export function woordenNabij(energie: number, toon: number, aantal = 10): Woord[] {
  return [...alleWoorden()]
    .sort((a, b) => {
      const da = (a.energie - energie) ** 2 + (a.toon - toon) ** 2;
      const db = (b.energie - energie) ** 2 + (b.toon - toon) ** 2;
      return da - db;
    })
    .slice(0, aantal);
}
