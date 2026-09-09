// test-maandbrief.js — Playwright-doorloop van De Maandbrief (v2.4 §7B).
//
// Drie soorten maanden: een volle maand met eigen zinnen en een beweging die
// je vaak deed, een zware maand zonder enkele geschreven zin, en de lopende
// maand (die nooit een brief mag krijgen). Plus het archief.

const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const VERBODEN_WOORDEN = [
  'gezond', 'ongezond', 'goed voor je', 'je zou moeten', 'discipline',
  'consistentie', 'commitment', 'excuus', 'opgeven', 'optimaliseren',
  'maximaliseren', 'potentieel', 'beste versie', 'upgraden', 'biohacken',
];

function moment(id, iso, deur, zinofnull, woordVoor, woordNa) {
  return {
    id,
    tijdstip: iso,
    woorden: [woordVoor],
    tijdBeschikbaar: '10min_of_meer',
    zone: 'B_activeren',
    gekozenDeur: deur,
    afsluitwoorden: woordNa ? [woordNa] : [],
    verankeringszin: zinofnull,
  };
}

function zaadBestand(nu) {
  const jaar = nu.getFullYear();
  const m = nu.getMonth(); // 0-based
  const sleutel = (offset) => {
    const d = new Date(Date.UTC(jaar, m - offset, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const volle = sleutel(2); // twee maanden terug: volle maand
  const zware = sleutel(1); // vorige maand: zware maand
  const lopend = sleutel(0); // deze maand: mag géén brief krijgen

  const momenten = [];

  // Volle maand: zes keer dezelfde beweging, vijf keer lichter geworden,
  // en zes eigen zinnen. Boven de spiegel-drempel van vier.
  const zinnen = [
    'Toch naar buiten gegaan, ook al wilde ik niet.',
    'Hoofd was stil na die tien minuten.',
    'Vandaag was het zwaar en ben ik toch gegaan.',
    'Merkte pas achteraf dat het geholpen had.',
    'Regen, en toch buiten geweest.',
    'Kort rondje, maar het scheelde.',
  ];
  for (let i = 0; i < 6; i++) {
    const dag = String(3 + i * 4).padStart(2, '0');
    momenten.push(
      moment(
        `m-vol-${i}`,
        `${volle}-${dag}T20:00:00+02:00`,
        'tien-minuten-wandelen-groen',
        zinnen[i],
        'leeg',
        i === 5 ? 'moe' : 'rustig' // vijf van de zes lichter -> "bijna altijd"
      )
    );
  }

  // Zware maand: wel geopend, niets geschreven, vooral niets doen.
  for (let i = 0; i < 3; i++) {
    const dag = String(5 + i * 7).padStart(2, '0');
    momenten.push(
      moment(`m-zwaar-${i}`, `${zware}-${dag}T22:10:00+02:00`, 'niets-doen', null, 'uitgeput', null)
    );
  }

  // Lopende maand.
  momenten.push(
    moment(`m-nu-0`, `${lopend}-01T09:00:00+02:00`, 'tien-minuten-wandelen-groen', 'Deze maand loopt nog.', 'leeg', 'rustig')
  );

  const sterren = momenten
    .filter((m2) => m2.gekozenDeur && m2.gekozenDeur !== 'niets-doen')
    .map((m2, i) => ({
      id: `s-${i}`,
      momentId: m2.id,
      streek: 'lichaam',
      datum: m2.tijdstip.slice(0, 10),
      zin: m2.verankeringszin,
    }));

  return {
    bestand: {
      versie: '1.0',
      aangemaaktOp: `${volle}-01T09:00:00+02:00`,
      instellingen: { islamitischeLaag: true, rustigeBeelden: false, ethischeOndergrensGezien: true },
      woordenUitbreiding: [],
      momenten,
      sterren,
      sterrenbeelden: [],
      onderdrukkingen: [],
      sterrenbeeldAanbodAfgewezen: [],
      brieven: [],
    },
    volle,
    zware,
    lopend,
  };
}

function schrijfNaarIndexedDb(doc) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('life-maxing', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('bestand')) db.createObjectStore('bestand');
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('bestand', 'readwrite');
      tx.objectStore('bestand').put(doc, 'het-bestand');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function leesUitIndexedDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('life-maxing', 1);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('bestand', 'readonly');
      const g = tx.objectStore('bestand').get('het-bestand');
      g.onsuccess = () => resolve(g.result);
      g.onerror = () => reject(g.error);
    };
    req.onerror = () => reject(req.error);
  });
}

const uitkomsten = [];
function check(naam, waar, extra) {
  uitkomsten.push({ naam, ok: !!waar, extra: extra ?? '' });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const fouten = [];
  page.on('pageerror', (e) => fouten.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') fouten.push('CONSOLE: ' + msg.text());
  });

  const { bestand, volle, zware, lopend } = zaadBestand(new Date());

  await page.goto('http://localhost:8792/index.html');
  await page.waitForTimeout(300);
  await page.evaluate(schrijfNaarIndexedDb, bestand);
  await page.reload();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/mb/01-s1-met-brief.png' });

  // ── 1. Brieven geschreven voor afgesloten maanden, niet voor de lopende ──
  const na = await page.evaluate(leesUitIndexedDb);
  const maanden = (na.brieven || []).map((b) => b.maand);
  check('Brief geschreven voor de volle maand', maanden.includes(volle), maanden.join(', '));
  check('Brief geschreven voor de zware maand', maanden.includes(zware));
  check('Géén brief voor de lopende maand', !maanden.includes(lopend));

  // ── 2. De aankondiging staat op S1 ────────────────────────────────
  // v1.1-meer.md (6 sept 2026): de aankondiging zit niet meer los op S1,
  // maar achter het stille "meer"-toegangspunt (S16).
  await page.click('text=meer');
  await page.waitForTimeout(300);
  check('S1 kondigt aan dat er een brief ligt', await page.$('text=er ligt een brief'));

  await page.click('text=er ligt een brief');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/mb/02-brief.png' });

  const briefTekst = await page.$eval('.brief-scherm', (n) => n.innerText);

  // ── 3. Vorm van de brief ──────────────────────────────────────────
  check('Brief opent met een maandnaam als opschrift', await page.$('.brief-opschrift'));
  check('Brief bevat "Dit is wat er was."', briefTekst.includes('Dit is wat er was.'));
  check(
    'Brief bevat jouw eigen zin, letterlijk',
    briefTekst.includes('Toch naar buiten gegaan, ook al wilde ik niet.')
  );
  check(
    'Verschuivingszin gebruikt sterkte in woorden, niet in getallen',
    /verschoof je (bijna altijd|vaak|soms) naar een lichtere hoek/.test(briefTekst) ||
      briefTekst.includes('te weinig om iets van te zeggen'),
    briefTekst.split('\n').find((r) => r.includes('verschoof') || r.includes('te weinig')) || ''
  );
  check(
    'Bij vijf van de zes keer lichter zegt de brief "bijna altijd"',
    briefTekst.includes('bijna altijd'),
  );
  check('Brief eindigt met een open vraag', /\?\s*$/m.test(briefTekst.trim().split('\n').filter(Boolean).slice(-2).join('\n')));

  // ── 4. Geen getallen, geen verboden woorden, niet te lang ─────────
  const zonderOpschrift = briefTekst.split('\n').slice(1).join(' ');
  check('Geen enkel cijfer in de brief', !/[0-9]/.test(zonderOpschrift), zonderOpschrift.match(/[0-9]+/g) || '');
  const gevonden = VERBODEN_WOORDEN.filter((w) => briefTekst.toLowerCase().includes(w));
  check('Geen woord van de verboden lijst', gevonden.length === 0, gevonden.join(', '));
  const woordAantal = zonderOpschrift.trim().split(/\s+/).length;
  check('Brief blijft rond honderdvijftig woorden', woordAantal <= 170, 'woorden: ' + woordAantal);
  check(
    'Geen vergelijking met een vorige maand',
    !/vorige maand|meer dan|minder dan|goed bezig/i.test(briefTekst)
  );

  // ── 5. Sluiten eindigt de app (S7), niet in een vervolgscherm ─────
  await page.click('text=sluiten');
  await page.waitForTimeout(1800);
  const naSluiten = await page.$eval('#app', (n) => n.innerText.trim());
  check('"sluiten" eindigt in het lege afsluitscherm', naSluiten === '', JSON.stringify(naSluiten.slice(0, 40)));

  // ── 6. Daarna staat er "de brieven" in plaats van de aankondiging ─
  // S7 heeft geen klikvlak meer terug naar het begin (Wet 3): je sluit de app
  // en opent hem opnieuw. In de test is dat een herlaad.
  await page.reload();
  await page.waitForTimeout(600);
  await page.click('text=meer');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/mb/03-s1-na-lezen.png' });
  const nogSteedsAankondiging = await page.$('text=er ligt een brief');
  check('Na het lezen verdwijnt de aankondiging niet meteen (de zware maand is nog ongelezen)', !!nogSteedsAankondiging);

  // lees ook de tweede brief
  await page.click('text=er ligt een brief');
  await page.waitForTimeout(400);
  const zwareTekst = await page.$eval('.brief-scherm', (n) => n.innerText);
  await page.screenshot({ path: '/tmp/mb/04-zware-maand.png' });
  check(
    'Zware maand mag een zware maand zijn',
    zwareTekst.includes('vooral doorheen komen'),
    zwareTekst.split('\n').slice(1, 3).join(' | ')
  );
  check(
    'Zware maand zegt "te weinig om iets van te zeggen"',
    zwareTekst.includes('te weinig om iets van te zeggen')
  );

  await page.click('text=sluiten');
  await page.waitForTimeout(1800);
  // S7 heeft geen klikvlak meer terug naar het begin (Wet 3): je sluit de app
  // en opent hem opnieuw. In de test is dat een herlaad.
  await page.reload();
  await page.waitForTimeout(600);
  await page.click('text=meer');
  await page.waitForTimeout(300);

  check('Aankondiging is weg als alles gelezen is', !(await page.$('text=er ligt een brief')));
  check('Het archief is nu bereikbaar', await page.$('text=de brieven'));

  // ── 7. Het archief ────────────────────────────────────────────────
  await page.click('text=de brieven');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/mb/05-archief.png' });
  const regels = await page.$$eval('.brief-regel', (ns) => ns.map((n) => n.textContent));
  check('Archief toont beide brieven, oudste bovenaan', regels.length === 2, regels.join(' / '));
  check('Archief toont maandnamen, geen getallen', !/[0-9]/.test(regels.join(' ')), regels.join(' / '));

  await page.click('.brief-regel');
  await page.waitForTimeout(400);
  check('Een brief uit het archief keert terug naar het archief', await page.$('text=de andere brieven'));
  await page.click('text=de andere brieven');
  await page.waitForTimeout(300);
  check('Terug in het archief', (await page.$$('.brief-regel')).length === 2);

  // ── 8. Brieven zijn bevroren: opnieuw openen verandert niets ──────
  const voorHerlaad = JSON.stringify((await page.evaluate(leesUitIndexedDb)).brieven.map((b) => b.alineas));
  await page.reload();
  await page.waitForTimeout(600);
  const naHerlaad = JSON.stringify((await page.evaluate(leesUitIndexedDb)).brieven.map((b) => b.alineas));
  check('Een geschreven brief verandert nooit meer', voorHerlaad === naHerlaad);

  console.log('\n=== UITKOMSTEN ===');
  let gefaald = 0;
  for (const u of uitkomsten) {
    if (!u.ok) gefaald++;
    console.log((u.ok ? '  OK   ' : '  FOUT ') + u.naam + (u.extra ? '  [' + u.extra + ']' : ''));
  }
  console.log('\n--- De brief van de volle maand, zoals hij eruitziet ---');
  console.log(briefTekst);
  console.log('--- De brief van de zware maand ---');
  console.log(zwareTekst);
  console.log('\nFOUTEN IN CONSOLE/PAGINA:', fouten.length ? JSON.stringify(fouten, null, 2) : 'geen');
  console.log('GEFAALD:', gefaald);

  await browser.close();
  process.exit(gefaald === 0 && fouten.length === 0 ? 0 : 1);
})();
