// Screenshots of every fighter's special and ultimate, for eyeballing the art.
// Usage: node tools/ult-shots.js [url] [outDir]
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
  await page.waitForTimeout(1500);
  const plan = {
    kip: [20, 60, 100, 128], koko: [30, 70, 88, 130], kooka: [40, 90, 130, 170], croc: [20, 60, 100, 140],
    spike: [30, 90, 120, 142], dotty: [30, 90, 118, 128], wombo: [30, 100, 118, 150], dash: [30, 85, 105, 125],
    taz: [30, 90, 120, 150], shelly: [30, 90, 110, 125], lizzie: [30, 80, 100, 170], cheeky: [30, 90, 115, 135],
    sly: [30, 100, 125, 128], cry: [30, 100, 140, 165], greg: [30, 90, 120, 160], bud: [30, 85, 110, 124],
  };
  const only = process.argv[4] ? process.argv[4].split(',') : null;
  if (only) Object.keys(plan).forEach((k) => !only.includes(k) && delete plan[k]);
  for (const id of Object.keys(plan)) {
    for (const [i, n] of plan[id].entries()) {
      await page.evaluate(({ id, n }) => {
        const ui = SF.UI;
        ui.demo = null;
        const opp = id === 'koko' ? 'kip' : 'koko';
        ui.match = new SF.Match({
          p1: id, p2: opp, stage: SF.FIGHTERS[id].stage, rounds: 3, timer: 60, silent: true, noBears: true,
          controllers: [{ type: 'ai', level: 'easy' }, { type: 'ai', level: 'easy' }], touchPlayers: [],
        });
        const m = ui.match;
        m.ctrl = [{ slot: 5 }, { slot: 5 }];
        m.readCtrl = () => SF.blankInput();
        while (m.roundState !== 'fight') m.update();
        m.f[0].x = 380; m.f[1].x = 560;
        m.f[0].meter = 100;
        m.f[0].buffer = { a: 'charge', t: 0 };
        for (let k = 0; k < n; k++) m.update();
        document.querySelectorAll('.screen').forEach((s) => s.classList.remove('show'));
        ui.screen = null;
      }, { id, n });
      await page.waitForTimeout(60);
      await page.screenshot({ path: path.join(out, `ult-${id}-${i}.png`) });
    }
    // special move
    await page.evaluate(({ id }) => {
      const m = SF.UI.match;
      while (m.roundState === 'fight' && m.f[0].state !== 'idle' && m.f[0].state !== 'jump') m.update();
      m.f[0].buffer = { a: 'special', t: 0 };
      for (let k = 0; k < 16; k++) m.update();
    }, { id });
    await page.screenshot({ path: path.join(out, `special-${id}.png`) });
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
})();
