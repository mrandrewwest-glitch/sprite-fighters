// Screenshots on phone / tablet sized touch screens.
// Usage: node tools/device-shots.js [url] [outDir]
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}
const url = process.argv[2] || 'http://localhost:8123/';
const out = process.argv[3] || '.';

const devices = [
  { name: 'phone', viewport: { width: 844, height: 390 }, mode: '1p' },
  { name: 'ipad', viewport: { width: 1180, height: 820 }, mode: '2p' },
  { name: 'phone-portrait', viewport: { width: 390, height: 844 }, mode: null },
];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const d of devices) {
    const ctx = await browser.newContext({ viewport: d.viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(d.name + ': ' + e.message));
    await page.goto(url);
    await page.waitForTimeout(1200);
    if (!d.mode) {
      await page.screenshot({ path: path.join(out, `dev-${d.name}.png`) });
      await ctx.close();
      continue;
    }
    await page.tap(`[data-act="mode-${d.mode}"]`);
    if (d.mode === '1p') await page.tap('[data-diff="easy"]');
    await page.tap('#confirm-btn');
    await page.tap('.card-f[data-id="kooka"]');
    await page.tap('#confirm-btn');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, `dev-${d.name}-stage.png`) });
    await page.tap('.stage-card:nth-child(2)');
    await page.waitForTimeout(300);
    await page.tap('#scr-vs');
    await page.waitForTimeout(5000);
    // hold the punch button a moment via the touch control
    const btn = await page.$('#touch .b-punch');
    if (btn) await btn.tap();
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(out, `dev-${d.name}-fight.png`) });
    await ctx.close();
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
})();
