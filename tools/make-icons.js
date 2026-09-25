// Renders the app icons from the game's own Kip artwork.
// Usage: node tools/make-icons.js [url]
const fs = require('fs');
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
  await page.goto(url);
  await page.waitForTimeout(800);
  for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
    const data = await page.evaluate((size) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, '#3b1f6b');
      g.addColorStop(0.55, '#ff8a4c');
      g.addColorStop(1, '#ffc46b');
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);
      x.fillStyle = 'rgba(255,240,180,0.9)';
      x.beginPath();
      x.arc(size * 0.5, size * 0.62, size * 0.3, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#b8431f';
      x.fillRect(0, size * 0.84, size, size * 0.16);
      const k = document.createElement('canvas');
      k.width = k.height = size;
      SF.drawPortrait(k, 'kip', { zoom: 0.78, bottom: 20, face: 'attack' });
      x.drawImage(k, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    }, size);
    fs.writeFileSync(path.join(__dirname, '..', 'icons', name), Buffer.from(data, 'base64'));
  }
  await browser.close();
  console.log('icons written');
})();
