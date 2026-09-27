// Online play test: runs a "host" and a "guest" copy of a match in one page,
// joined by a fake network with random delays, both mashing random buttons.
// Checks the two copies stay exactly in sync, frame by frame.
// Usage: node tools/net-test.js [url]
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}
const url = process.argv[2] || 'http://localhost:8123/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    SF.UI.demo = null;
    const results = [];
    for (let game = 0; game < 12; game++) {
      const ids = [SF.pick(SF.ROSTER), SF.pick(SF.ROSTER)];
      const stage = SF.pick(SF.STAGE_LIST);
      const seed = Math.floor(Math.random() * 1e9);
      let tick = 0;
      const queues = [[], []]; // messages in flight to [host, guest]
      const mash = (s) => {
        const r = SF.seeded(s);
        let held = SF.blankInput();
        return () => {
          if (r() < 0.15) {
            held = SF.blankInput();
            SF.ACTIONS.forEach((a) => (held[a] = r() < (a === 'charge' ? 0.08 : 0.25)));
          }
          return held;
        };
      };
      const ends = [null, null];
      const snaps = [new Map(), new Map()];
      const sides = [0, 1].map((local) => {
        const session = new SF.NetSession({
          local, seed, readLocal: mash(seed + local * 7919),
          send: (m) => queues[1 - local].push({ at: tick + 1 + Math.floor(Math.random() * 8), m }),
        });
        const match = new SF.Match({
          p1: ids[0], p2: ids[1], stage, rounds: 3, timer: 60, silent: true, dropBears: true, powerUps: true,
          controllers: [{ type: 'human', slot: 0 }, { type: 'human', slot: 1 }], net: session,
          onEnd: (w) => (ends[local] = w),
        });
        return { session, match };
      });
      for (; tick < 60 * 60 * 6 && (ends[0] === null || ends[1] === null); tick++) {
        [0, 1].forEach((i) => {
          queues[i] = queues[i].filter((q) => (q.at <= tick ? (sides[i].session.receive(q.m), false) : true));
          const m = sides[i].match;
          const before = m.netFrame || 0;
          m.update();
          if ((m.netFrame || 0) > before) {
            snaps[i].set(before, m.f.map((f) => [f.x.toFixed(3), f.y.toFixed(3), f.hp.toFixed(3), f.meter.toFixed(3), f.state].join(',')).join('|'));
          }
        });
      }
      let firstDiff = -1;
      for (const [f, s] of snaps[0]) {
        if (snaps[1].has(f) && snaps[1].get(f) !== s) {
          firstDiff = f;
          break;
        }
      }
      results.push(`${ids.join(' v ')} @${stage}: frames=${snaps[0].size}, winners host=${ends[0]} guest=${ends[1]}, ` +
        `firstDesync=${firstDiff}, corrections=${sides[1].session.corrections || 0}`);
    }
    return results.join('\n');
  });
  console.log(out);
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'No page errors');
  await browser.close();
})();
