// Balance check: every fighter vs every other, equal CPU skill, both sides.
// Usage: node tools/balance.js [url] [matchesPerPair]
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}
const url = process.argv[2] || 'http://localhost:8123/';
const n = +(process.argv[3] || 6);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForTimeout(800);
  const res = await page.evaluate((n) => {
    SF.UI.demo = null;
    const wins = {};
    const games = {};
    SF.ROSTER.forEach((id) => ((wins[id] = 0), (games[id] = 0)));
    for (const a of SF.ROSTER) {
      for (const b of SF.ROSTER) {
        if (a === b) continue;
        for (let k = 0; k < n; k++) {
          let w = null;
          const m = new SF.Match({
            p1: a, p2: b, stage: 'uluru', rounds: 1, timer: 60, silent: true,
            controllers: [{ type: 'ai', level: 'hard' }, { type: 'ai', level: 'hard' }], onEnd: (x) => (w = x),
          });
          for (let i = 0; i < 60 * 80 && w === null; i++) m.update();
          games[a]++;
          games[b]++;
          if (w === 0) wins[a]++;
          if (w === 1) wins[b]++;
        }
      }
    }
    return SF.ROSTER.map((id) => `${id.padEnd(6)} ${((100 * wins[id]) / games[id]).toFixed(0)}%`).join('\n');
  }, n);
  console.log(res);
  await browser.close();
})();
