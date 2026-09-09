const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text()); });

  await page.goto('http://localhost:8792/index.html');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/shots2/01-s0.png' });

  await page.click('text=Beginnen');
  await page.waitForTimeout(300);

  // tap on the schijf canvas near bottom-left (laag + zwaar -> B_activeren) to
  // exercise the path that used to trigger the crisis check
  const canvas = await page.$('canvas.schijf-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.75);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shots2/02-s2.png' });

  const woordKnop = await page.$('.woord-knop');
  await woordKnop.click();
  await page.click('text=Verder');
  await page.waitForTimeout(300);
  await page.click('text=twee minuten');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/shots2/03-s4.png' });

  const deurKnoppen = await page.$$('.deur button');
  await deurKnoppen[0].click();
  await page.waitForTimeout(300);
  await page.click('text=Klaar');
  await page.waitForTimeout(300);

  const canvas2 = await page.$('canvas.schijf-canvas');
  const box2 = await canvas2.boundingBox();
  await page.mouse.click(box2.x + box2.width * 0.6, box2.y + box2.height * 0.3);
  // Het Verschil verschijnt ~600 ms na het loslaten
  await page.waitForTimeout(900);
  await page.screenshot({ path: '/tmp/shots2/04-het-verschil.png' });
  await page.fill('textarea', 'Test na verwijderen crisiskaart.');
  await page.click('text=Verder');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shots2/05-s7.png' });

  // S7 heeft geen klikvlak meer terug naar het begin (Wet 3): opnieuw openen.
  await page.reload();
  await page.waitForTimeout(600);

  // v1.1-meer.md (6 sept 2026): "instellingen" zit niet meer los op S1,
  // maar achter het stille "meer"-toegangspunt (S16).
  await page.click('text=meer');
  await page.waitForTimeout(300);
  await page.click('text=instellingen');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/shots2/05-s10-instellingen.png' });

  const nietGoedKnop = await page.$('text=Het gaat niet goed');
  const hulplijstOpDeSchijf = await page.$('text=hulplijn');

  console.log('Knop "Het gaat niet goed" nog aanwezig:', !!nietGoedKnop);
  console.log('ERRORS:', JSON.stringify(errors, null, 2));
  await browser.close();
})();
