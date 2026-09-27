// Real online test: two separate browser windows connect through PeerJS using
// the actual menus (make room -> join with code -> pick -> stage -> fight).
// Usage: node tools/online-test.js [url] [outDir]
//   (set PEER_SERVER=localhost:9000/sf to use a local `peerjs` server)
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
  const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const mk = async (name) => {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log(name, 'pageerror:', e.message));
    await page.goto(url);
    await page.waitForTimeout(1000);
    // PEER_SERVER=localhost:9000/sf uses a local PeerJS server instead of the public one.
    if (process.env.PEER_SERVER) {
      const [hostPort, ...p] = process.env.PEER_SERVER.split('/');
      const [h, port] = hostPort.split(':');
      await page.evaluate((o) => (SF.Net.serverOptions = o), { host: h, port: +port, path: '/' + p.join('/'), secure: false });
    }
    return page;
  };
  const host = await mk('host');
  const guest = await mk('guest');

  await host.evaluate(() => (SF.settings.rounds = 1));
  await host.click('[data-act="online"]');
  await host.click('[data-act="online-host"]');
  await host.waitForSelector('.room-code', { timeout: 20000 });
  const code = await host.textContent('.room-code');
  console.log('room code:', code);
  await host.screenshot({ path: path.join(out, 'online-host-code.png') });

  await guest.click('[data-act="online"]');
  await guest.fill('#join-code', code.toLowerCase().replace('-', ' '));
  await guest.click('[data-act="online-join"]');

  await host.waitForSelector('#scr-select.show', { timeout: 30000 });
  await guest.waitForSelector('#scr-select.show', { timeout: 30000 });
  console.log('both connected and on fighter select');

  await host.click('.card-f[data-id="sly"]');
  await host.click('#confirm-btn');
  await guest.click('.card-f[data-id="bud"]');
  await guest.click('#confirm-btn');
  await guest.waitForTimeout(500);
  await guest.screenshot({ path: path.join(out, 'online-guest-wait.png') });
  await host.waitForSelector('#scr-stage.show', { timeout: 10000 });
  await host.click('.stage-card:nth-child(9)');
  await host.waitForTimeout(300);
  await guest.waitForSelector('#scr-vs.show', { timeout: 10000 });
  console.log('both on VS screen');

  await host.waitForTimeout(5500);
  // Host walks right and kicks, guest walks left and punches.
  await host.keyboard.down('KeyD');
  await guest.keyboard.down('ArrowLeft');
  await host.waitForTimeout(900);
  await host.keyboard.up('KeyD');
  await guest.keyboard.up('ArrowLeft');
  for (let i = 0; i < 5; i++) {
    await host.keyboard.press('KeyG');
    await guest.keyboard.press('KeyF');
    await host.waitForTimeout(250);
  }
  await host.waitForTimeout(1500);
  const state = async (p) =>
    p.evaluate(() => {
      const m = SF.UI.match;
      return m ? { frame: m.netFrame, f: m.f.map((f) => [f.def.id, Math.round(f.x), Math.round(f.hp)]) } : null;
    });
  const hs = await state(host);
  const gs = await state(guest);
  console.log('host sees :', JSON.stringify(hs));
  console.log('guest sees:', JSON.stringify(gs));
  await host.screenshot({ path: path.join(out, 'online-host-fight.png') });
  await guest.screenshot({ path: path.join(out, 'online-guest-fight.png') });

  // Finish the match (both sides knock out the guest's fighter), then both ask for a rematch.
  await host.evaluate(() => (SF.UI.match.f[1].hp = 0.1));
  await guest.evaluate(() => (SF.UI.match.f[1].hp = 0.1));
  for (let i = 0; i < 12; i++) {
    await host.keyboard.press('KeyF');
    await host.waitForTimeout(200);
  }
  const hostRes = await host.waitForSelector('#scr-results.show', { timeout: 40000 }).then(() => host.textContent('#res-title'));
  const guestRes = await guest.waitForSelector('#scr-results.show', { timeout: 40000 }).then(() => guest.textContent('#res-title'));
  console.log('results:', JSON.stringify({ host: hostRes, guest: guestRes }));
  await guest.click('[data-act="online-rematch"]');
  await host.waitForTimeout(400);
  console.log('host rematch button:', await host.textContent('[data-act="online-rematch"]'));
  await host.click('[data-act="online-rematch"]');
  await host.waitForSelector('#scr-vs.show', { timeout: 10000 });
  await guest.waitForSelector('#scr-vs.show', { timeout: 10000 });
  console.log('rematch started on both');
  await host.waitForTimeout(4000);

  // Guest leaves: host should be told.
  await guest.evaluate(() => SF.Net.send({ t: 'bye' }));
  await host.waitForSelector('#scr-online.show', { timeout: 10000 });
  console.log('host notified:', (await host.textContent('#online-status')).trim());
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
