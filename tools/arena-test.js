// Boomerang Arena: CPU-vs-CPU crash test across fighters and maps, plus screenshots.
// Usage: node tools/arena-test.js [url] [outDir]
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}
const url = process.argv[2] || 'http://localhost:8123/';
const out = process.argv[3] || '.';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, ignoreHTTPSErrors: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(1200);
  const report = await page.evaluate(() => {
    SF.UI.demo = null;
    const res = [];
    const wins = {};
    SF.ROSTER.forEach((id) => (wins[id] = [0, 0]));
    for (const a of SF.ROSTER) {
      for (const b of SF.ROSTER) {
        let w = null;
        const m = new SF.ArenaMatch({
          p1: a, p2: b, stage: SF.pick(SF.ARENA_LIST), rounds: 1, timer: 60, silent: true,
          controllers: [{ type: 'ai', level: 'hard' }, { type: 'ai', level: 'hard' }], onEnd: (x) => (w = x),
          table: Math.random() < 0.5,
        });
        let ults = 0;
        for (let i = 0; i < 60 * 90 && w === null; i++) {
          if (i % 500 === 0) m.f.forEach((f) => (f.meter = 100));
          m.update();
          if (m.cine && m.cine.t === 1) ults++;
          m.f.forEach((f) => {
            if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(f.hp)) throw new Error('bad numbers ' + a + ' v ' + b);
          });
        }
        if (w === null) res.push(`${a} v ${b}: DID NOT FINISH`);
        wins[a][1]++;
        wins[b][1]++;
        if (w === 0) wins[a][0]++;
        if (w === 1) wins[b][0]++;
        if (ults === 0) res.push(`${a} v ${b}: no ultimates used`);
      }
    }
    res.push(SF.ROSTER.map((id) => `${id} ${Math.round((100 * wins[id][0]) / wins[id][1])}%`).join('  '));
    return res.join('\n');
  });
  console.log(report);

  // Screenshots of every arena ultimate mid-flight.
  for (const id of ['kip', 'koko', 'kooka', 'croc', 'spike', 'dotty', 'wombo', 'dash', 'taz', 'shelly', 'lizzie', 'cheeky']) {
    await page.evaluate((id) => {
      const ui = SF.UI;
      ui.match = new SF.ArenaMatch({
        p1: id, p2: 'koko', stage: 'backyard', rounds: 3, timer: 60, silent: true, table: true,
        controllers: [{ type: 'human', slot: 5 }, { type: 'human', slot: 5 }],
      });
      const m = ui.match;
      m.readCtrl = () => SF.blankInput();
      while (m.roundState !== 'fight') m.update();
      m.entities = [];
      m.f[0].x = 360; m.f[0].y = 300; m.f[1].x = 600; m.f[1].y = 260;
      m.f[0].meter = 100;
      m.f[0].buffer = { a: 'charge', t: 0 };
      const n = { kip: 90, koko: 95, kooka: 110, croc: 100, spike: 80, dotty: 100, wombo: 118, dash: 80, taz: 100, shelly: 95, lizzie: 100, cheeky: 110 }[id];
      for (let k = 0; k < n; k++) m.update();
      document.querySelectorAll('.screen').forEach((s) => s.classList.remove('show'));
      ui.screen = null;
    }, id);
    await page.waitForTimeout(50);
    await page.screenshot({ path: path.join(out, `arena-ult-${id}.png`) });
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
})();
