// Headless smoke test: loads the game, runs CPU-vs-CPU fights and takes screenshots.
// Usage: node tools/smoke-test.js [url] [outDir]
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'title.png') });

  // Run every fighter pairing CPU vs CPU at high speed to shake out crashes.
  const report = await page.evaluate(() => {
    const res = [];
    for (const a of SF.ROSTER) {
      for (const b of SF.ROSTER) {
        let ended = null;
        const m = new SF.Match({
          p1: a, p2: b, stage: SF.pick(SF.STAGE_LIST),
          controllers: [{ type: 'ai', level: 'champion' }, { type: 'ai', level: 'hard' }],
          rounds: 3, timer: 60, silent: true, onEnd: (w) => (ended = w),
        });
        m.f.forEach((f) => (f.meter = 100));
        let ults = 0;
        for (let i = 0; i < 60 * 60 * 4 && ended === null; i++) {
          m.update();
          if (m.cine && m.cine.t === 1) ults++;
          if (i % 600 === 0) m.f.forEach((f) => (f.meter = 100));
          m.f.forEach((f) => {
            if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(f.hp)) throw new Error(`bad numbers ${a} v ${b}`);
          });
        }
        res.push(`${a} v ${b}: winner=${ended} rounds=${m.round} ults=${ults}`);
      }
    }
    return res;
  });
  console.log(report.join('\n'));

  // Visual checks: start a 1P fight through the menus.
  await page.click('[data-act="mode-1p"]');
  await page.click('[data-diff="medium"]');
  await page.screenshot({ path: path.join(out, 'select.png') });
  await page.click('#confirm-btn');
  await page.click('.card-f[data-id="croc"]');
  await page.click('#confirm-btn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'stage.png') });
  await page.click('.stage-card');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, 'vs.png') });
  await page.waitForTimeout(2200);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(out, 'fight-intro.png') });
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(out, 'fight-punch.png') });
  await page.evaluate(() => (SF.UI.match.f[0].meter = 100));
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'fight-ult-cine.png') });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(out, 'fight-ult.png') });

  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
