// Online failure test: the joining window is forced to use only relay servers
// that it can't reach, so the direct link fails. Checks the retries, the
// helpful message, that the host's room stays open, and that a second join
// (with normal settings) then connects.
// Usage: PEER_SERVER=127.0.0.1:9000/sf node tools/online-fail-test.js [url] [outDir]
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  ({ chromium } = require(path.join(process.execPath, '../../lib/node_modules/playwright')));
}
const url = process.argv[2] || 'http://localhost:8123/';
const out = process.argv[3] || '.';
const [hostPort, ...p] = (process.env.PEER_SERVER || '127.0.0.1:9000/sf').split('/');
const [h, port] = hostPort.split(':');
const server = { host: h, port: +port, path: '/' + p.join('/'), secure: false };

(async () => {
  const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const mk = async () => {
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 } })).newPage();
    await page.goto(url);
    await page.waitForTimeout(800);
    return page;
  };
  const host = await mk();
  const guest = await mk();
  await host.evaluate((s) => (SF.Net.serverOptions = s), server);
  // Guest: relay-only with no relay servers -> no possible path.
  await guest.evaluate((s) => (SF.Net.serverOptions = Object.assign({ config: { iceServers: [], iceTransportPolicy: 'relay' } }, s)), server);

  await host.click('[data-act="online"]');
  await host.click('[data-act="online-host"]');
  await host.waitForSelector('.room-code');
  const code = await host.textContent('.room-code');
  await guest.click('[data-act="online"]');
  await guest.fill('#join-code', code);
  const t0 = Date.now();
  await guest.click('[data-act="online-join"]');
  await guest.waitForTimeout(20000);
  console.log('guest after 20s:', (await guest.textContent('#online-status')).replace(/\s+/g, ' ').trim().slice(0, 90));
  await guest.waitForSelector('#online-status .diag', { timeout: 60000 });
  console.log(`guest gave up after ${Math.round((Date.now() - t0) / 1000)}s:`, (await guest.textContent('#online-status')).replace(/\s+/g, ' ').trim());
  await guest.screenshot({ path: path.join(out, 'online-fail-guest.png') });
  console.log('host status:', (await host.textContent('#online-status')).replace(/\s+/g, ' ').trim().slice(0, 140));
  await host.screenshot({ path: path.join(out, 'online-fail-host.png') });

  // Second attempt with normal settings should connect to the same, still-open room.
  await guest.evaluate((s) => (SF.Net.serverOptions = s), server);
  await guest.fill('#join-code', code);
  await guest.click('[data-act="online-join"]');
  await host.waitForSelector('#scr-select.show', { timeout: 30000 });
  await guest.waitForSelector('#scr-select.show', { timeout: 30000 });
  console.log('second attempt: connected OK');
  await browser.close();
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
