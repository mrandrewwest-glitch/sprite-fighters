// Top-down maps for Boomerang Arena.
// Obstacles are circles (x, y, r) that block fighters and boomerangs.
(() => {
  const D = SF.D;
  const W = SF.W;
  const H = SF.H;

  function grad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  // ---- obstacle drawings (drawn depth-sorted with the fighters, origin = base centre)
  const OBJ = {
    rock(ctx, o) {
      D.ell(ctx, 0, -o.r * 0.35, o.r * 1.05, o.r * 0.8, '#9a7b62');
      D.ell(ctx, -o.r * 0.25, -o.r * 0.6, o.r * 0.45, o.r * 0.28, '#b8997e', 0, false);
    },
    redrock(ctx, o) {
      D.ell(ctx, 0, -o.r * 0.4, o.r * 1.05, o.r * 0.85, '#b4502a');
      D.ell(ctx, -o.r * 0.3, -o.r * 0.7, o.r * 0.4, o.r * 0.25, '#d27447', 0, false);
    },
    gum(ctx, o) {
      D.ell(ctx, 0, -8, 12, 8, '#d8cfc0');
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(10, -40, o.r * 1.2, o.r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      [[-18, -58, 30], [16, -64, 34], [0, -84, 30], [-2, -48, 26]].forEach(([x, y, r], i) =>
        D.ell(ctx, x, y, r, r * 0.8, ['#5f8a4a', '#6f9a57', '#557e42', '#7fae63'][i])
      );
    },
    bbq(ctx) {
      SF.roundRect(ctx, -36, -48, 72, 40, 6);
      ctx.fillStyle = '#5a5a5a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(-30, -44, 60, 30);
      ['#8b3a1a', '#9a4520', '#7d3316'].forEach((c, i) => {
        SF.roundRect(ctx, -26 + i * 18, -40, 14, 22, 5);
        ctx.fillStyle = c;
        ctx.fill();
      });
    },
    gnome(ctx) {
      D.ell(ctx, 0, -12, 12, 12, '#2f7fd0');
      D.ell(ctx, 0, -28, 9, 9, '#f2c9a0');
      D.ell(ctx, 0, -24, 8, 6, '#fff', 0, false);
      D.poly(ctx, [-10, -32, 0, -58, 10, -32], '#e53935');
    },
    pole(ctx) {
      D.ell(ctx, 0, -6, 8, 5, '#8a939c');
    },
    esky(ctx) {
      SF.roundRect(ctx, -30, -44, 60, 40, 6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      SF.roundRect(ctx, -32, -50, 64, 14, 4);
      ctx.fillStyle = '#2f7fd0';
      ctx.fill();
      ctx.stroke();
    },
    castle(ctx) {
      D.poly(ctx, [-32, 0, -28, -30, 28, -30, 32, 0], '#e9cf8a');
      [-22, 0, 22].forEach((x) => {
        SF.roundRect(ctx, x - 9, -52, 18, 24, 3);
        ctx.fillStyle = '#e9cf8a';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
      });
      D.line(ctx, 0, -52, 0, -70, 2, '#555');
      D.poly(ctx, [0, -70, 14, -65, 0, -60], '#e53935');
    },
    log(ctx) {
      SF.roundRect(ctx, -44, -26, 88, 24, 12);
      ctx.fillStyle = '#8a5a3a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      D.ell(ctx, 38, -14, 8, 11, '#c9a27c');
    },
  };

  // Canopies drawn over the top of everything (umbrellas, clothesline).
  const OVER = {
    hoist(ctx, o, t) {
      const a = t * 0.01;
      ctx.save();
      ctx.translate(o.x, o.y - 70);
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < 4; i++) {
        const ang = a + (i * Math.PI) / 2;
        const ex = Math.cos(ang) * 95;
        const ey = Math.sin(ang) * 60;
        D.line(ctx, 0, 0, ex, ey, 3, '#8a939c');
        const cols = ['#ff5a5f', '#4ab3ff', '#ffd24a', '#5ad17a'];
        ctx.fillStyle = cols[i];
        ctx.fillRect(ex * 0.6 - 10, ey * 0.6 - 8, 20, 16);
      }
      ctx.strokeStyle = 'rgba(80,80,80,0.6)';
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 95 * (k / 3), 60 * (k / 3), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    },
    umbrella(ctx, o) {
      ctx.save();
      ctx.translate(o.x, o.y - 80);
      ctx.globalAlpha = 0.88;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.ellipse(0, 0, 70, 44, 0, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? '#fff' : o.color || '#ff6b6b';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 44, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  };

  const outback = {
    name: 'Outback Clearing', emoji: '🏜️',
    obstacles: [
      { x: 480, y: 290, r: 40, kind: 'redrock' },
      { x: 240, y: 180, r: 30, kind: 'rock' },
      { x: 720, y: 400, r: 32, kind: 'rock' },
      { x: 170, y: 420, r: 26, kind: 'redrock' },
      { x: 790, y: 170, r: 28, kind: 'redrock' },
      { x: 90, y: 150, r: 30, kind: 'gum' },
      { x: 880, y: 440, r: 30, kind: 'gum' },
    ],
    drawStatic(ctx) {
      const rnd = SF.seeded(11);
      ctx.fillStyle = grad(ctx, 0, H, [[0, '#d97b45'], [1, '#c2602f']]);
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(110,40,15,${0.08 + rnd() * 0.18})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * W, rnd() * H, 2 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // dry creek bed
      ctx.strokeStyle = 'rgba(240,200,150,0.35)';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-20, 80);
      ctx.bezierCurveTo(300, 140, 400, 520, 980, 470);
      ctx.stroke();
      for (let i = 0; i < 30; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        ctx.strokeStyle = rnd() > 0.5 ? '#c4b54a' : '#a39a3a';
        ctx.lineWidth = 2;
        for (let k = -4; k <= 4; k++) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + k * 3, y - 14 + Math.abs(k));
          ctx.stroke();
        }
      }
    },
  };

  const backyard = {
    name: 'Backyard BBQ', emoji: '🌭',
    obstacles: [
      { x: 480, y: 285, r: 14, kind: 'pole', over: 'hoist' },
      { x: 770, y: 160, r: 36, kind: 'bbq' },
      { x: 220, y: 390, r: 52, kind: 'pool', flat: true },
      { x: 830, y: 420, r: 14, kind: 'gnome' },
      { x: 150, y: 150, r: 34, kind: 'gum' },
      { x: 600, y: 440, r: 30, kind: 'esky' },
    ],
    drawStatic(ctx) {
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#6fbf5a' : '#62b04e';
        ctx.fillRect((i * W) / 12, 0, W / 12 + 1, H);
      }
      const rnd = SF.seeded(12);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = 'rgba(40,90,30,0.25)';
        ctx.fillRect(rnd() * W, rnd() * H, 2, 5);
      }
      // wooden fence along the top
      ctx.fillStyle = '#a07a52';
      ctx.fillRect(0, 0, W, 34);
      ctx.strokeStyle = '#7a5a3a';
      ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 34);
        ctx.stroke();
      }
      // paddling pool
      D.ell(ctx, 220, 390, 60, 42, '#4ab3ff');
      D.ell(ctx, 220, 390, 48, 32, '#8fd6ff', 0, false);
      D.ell(ctx, 204, 380, 12, 6, 'rgba(255,255,255,0.7)', -0.3, false);
      // veggie patch
      SF.roundRect(ctx, 360, 60, 160, 50, 6);
      ctx.fillStyle = '#6b4a2a';
      ctx.fill();
      for (let i = 0; i < 8; i++) D.ell(ctx, 378 + i * 18, 85, 7, 7, i % 2 ? '#3f8f3a' : '#e53935', 0, false);
    },
  };

  const beach = {
    name: 'Beach Cricket', emoji: '🏏',
    obstacles: [
      { x: 300, y: 210, r: 28, kind: 'esky' },
      { x: 660, y: 330, r: 14, kind: 'pole', over: 'umbrella', color: '#ff6b6b' },
      { x: 250, y: 430, r: 14, kind: 'pole', over: 'umbrella', color: '#4ab3ff' },
      { x: 480, y: 420, r: 32, kind: 'castle' },
      { x: 800, y: 190, r: 30, kind: 'rock' },
      { x: 520, y: 170, r: 36, kind: 'log' },
    ],
    drawStatic(ctx) {
      ctx.fillStyle = grad(ctx, 0, H, [[0, '#f6de9d'], [1, '#e8c577']]);
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = grad(ctx, 0, 70, [[0, '#136fb0'], [1, '#43c6d8']]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, 50);
      for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, 55 + Math.sin(x * 0.03) * 8);
      ctx.fill();
      const rnd = SF.seeded(13);
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = `rgba(160,120,50,${0.1 + rnd() * 0.2})`;
        ctx.fillRect(rnd() * W, 70 + rnd() * (H - 70), 2, 2);
      }
      // beach towels
      [[120, 280, '#ff6b6b'], [860, 320, '#5ad17a']].forEach(([x, y, c]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(0.3);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 ? '#fff' : c;
          ctx.fillRect(-45 + i * 18, -28, 18, 56);
        }
        ctx.restore();
      });
      // cricket stumps (decoration)
      [[380, 300], [580, 300]].forEach(([x, y]) => {
        for (let k = -1; k <= 1; k++) D.line(ctx, x + k * 5, y - 20, x + k * 5, y + 2, 3, '#f2e6c8');
      });
      [[700, 480], [150, 120], [900, 110]].forEach(([x, y]) => SF.D.star(ctx, x, y, 10, '#ff8a65', 0.4));
    },
  };

  SF.ARENAS = { outback, backyard, beach };
  SF.ARENA_LIST = ['outback', 'backyard', 'beach'];
  SF.ARENA_OBJ = OBJ;
  SF.ARENA_OVER = OVER;

  const cache = {};
  function staticCanvas(id) {
    if (!cache[id]) {
      const c = document.createElement('canvas');
      c.width = W * 2;
      c.height = H * 2;
      const cx = c.getContext('2d');
      cx.scale(2, 2);
      SF.ARENAS[id].drawStatic(cx);
      cache[id] = c;
    }
    return cache[id];
  }

  SF.drawArenaFloor = (ctx, id) => ctx.drawImage(staticCanvas(id), 0, 0, W, H);

  SF.drawArenaThumb = (canvas, id) => {
    const c = canvas.getContext('2d');
    c.save();
    c.scale(canvas.width / W, canvas.height / H);
    c.drawImage(staticCanvas(id), 0, 0, W, H);
    SF.ARENAS[id].obstacles.forEach((o) => {
      if (o.flat) return;
      c.save();
      c.translate(o.x, o.y);
      OBJ[o.kind](c, o);
      c.restore();
      if (o.over) OVER[o.over](c, o, 0);
    });
    c.restore();
  };
})();
