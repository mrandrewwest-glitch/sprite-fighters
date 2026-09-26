// Shared constants, helpers and saved settings.
window.SF = window.SF || {};

SF.W = 960;
SF.H = 540;
SF.GROUND = 470;
SF.WALL_L = 40;
SF.WALL_R = 920;
SF.FONT = "'Luckiest Guy', 'Arial Black', Impact, sans-serif";

SF.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
SF.lerp = (a, b, t) => a + (b - a) * t;
SF.rand = (a, b) => a + Math.random() * (b - a);
SF.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
SF.overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Small seeded RNG so stage decorations look the same every time.
SF.seeded = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

SF.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

SF.defaultSettings = {
  sound: true,
  music: true,
  dropBears: true,
  powerUps: true,
  rounds: 3, // best of
  timer: 60, // 0 = no timer
  touch: 'auto', // auto | on | off
};

SF.settings = (() => {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('sf-settings') || '{}') || {};
  } catch (e) {
    saved = {};
  }
  return Object.assign({}, SF.defaultSettings, saved);
})();

SF.saveSettings = () => {
  try {
    localStorage.setItem('sf-settings', JSON.stringify(SF.settings));
  } catch (e) {
    /* storage unavailable: settings last for this visit only */
  }
};

SF.roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Big outlined cartoon text.
SF.outlineText = (ctx, text, x, y, size, fill, stroke = '#1a0d05', align = 'center') => {
  ctx.save();
  ctx.font = `${size}px ${SF.FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.16);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
};
