// Particles, pop-up words, shockwaves and screen shake.
SF.Effects = class {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.shakeAmt = 0;
    this.t = 0;
  }

  add(p) {
    p.life = p.life || 30;
    p.max = p.life;
    p.vx = p.vx || 0;
    p.vy = p.vy || 0;
    p.g = p.g || 0;
    p.rot = p.rot || 0;
    p.vr = p.vr || 0;
    this.parts.push(p);
  }

  spark(x, y, big = false, color = '#ffe14a') {
    const n = big ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = SF.rand(3, big ? 10 : 7);
      this.add({
        type: 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: SF.rand(14, 24),
        size: SF.rand(5, big ? 12 : 8), color: i % 3 === 0 ? '#fff' : color, vr: 0.3,
      });
    }
    this.add({ type: 'burst', x, y, life: 10, size: big ? 70 : 45, color: '#fff' });
  }

  blockSpark(x, y) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.add({ type: 'dot', x, y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, life: 12, size: 4, color: '#8fd3ff' });
    }
    this.add({ type: 'shield', x, y, life: 12, size: 40, color: '#8fd3ff' });
  }

  text(str, x, y, color = '#ffe14a', size = 34) {
    this.texts.push({ str, x: SF.clamp(x, 120, SF.W - 120), y: Math.max(90, y), color, size, life: 50, max: 50 });
  }

  dust(x, y, big = false) {
    const n = big ? 10 : 5;
    for (let i = 0; i < n; i++) {
      this.add({
        type: 'dust', x: x + SF.rand(-20, 20), y: y - 5, vx: SF.rand(-3, 3) * (big ? 1.6 : 1), vy: SF.rand(-2.5, -0.5),
        life: SF.rand(20, 34), size: SF.rand(8, big ? 22 : 14), color: 'rgba(230,210,180,',
      });
    }
  }

  leaf(x, y) {
    this.add({
      type: 'leaf', x, y, vx: SF.rand(-4, 4), vy: SF.rand(-9, -3), g: 0.25, life: SF.rand(40, 70),
      size: SF.rand(6, 10), color: SF.pick(['#5b8f4a', '#6fa65a', '#86c06b']), vr: SF.rand(-0.3, 0.3),
    });
  }

  shockwave(x, y) {
    this.add({ type: 'wave', x, y, life: 28, size: 380, color: '#fff3c4' });
    for (let i = 0; i < 16; i++) {
      this.add({ type: 'rock', x: x + SF.rand(-40, 40), y: y - 4, vx: SF.rand(-8, 8), vy: SF.rand(-12, -5), g: 0.6, life: 40, size: SF.rand(4, 8), color: '#9b5a36' });
    }
  }

  chargeBit(x, y, color = '#ffd24a') {
    this.add({ type: 'dot', x: x + SF.rand(-35, 35), y: y - SF.rand(0, 40), vy: SF.rand(-4, -2), life: 26, size: SF.rand(3, 6), color });
  }

  confetti() {
    const cols = ['#ff5a5f', '#ffd24a', '#5ad17a', '#4ab3ff', '#c36bff'];
    for (let i = 0; i < 120; i++) {
      this.add({
        type: 'confetti', x: SF.rand(0, SF.W), y: SF.rand(-200, -10), vx: SF.rand(-1, 1), vy: SF.rand(2, 5),
        life: 200, size: SF.rand(5, 9), color: SF.pick(cols), vr: SF.rand(-0.2, 0.2),
      });
    }
  }

  shake(n) {
    this.shakeAmt = Math.max(this.shakeAmt, n);
  }

  update() {
    this.t++;
    this.shakeAmt *= 0.86;
    if (this.shakeAmt < 0.3) this.shakeAmt = 0;
    for (const p of this.parts) {
      p.life--;
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.type === 'star' || p.type === 'dot') {
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      if (p.type === 'leaf') p.vx *= 0.98;
      if (p.type === 'rock' && p.y > SF.GROUND) {
        p.y = SF.GROUND;
        p.vy *= -0.4;
        p.vx *= 0.6;
      }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.life--;
      t.y -= 0.8;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.parts) {
      const k = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.5);
      switch (p.type) {
        case 'star':
          SF.D.star(ctx, p.x, p.y, p.size * (0.5 + k * 0.5), p.color, p.rot);
          break;
        case 'dot':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * k + 1, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'burst': {
          const r = p.size * (1 - k * 0.6);
          ctx.globalAlpha = k;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          for (let i = 0; i < 16; i++) {
            const a = (i * Math.PI) / 8;
            const rr = i % 2 ? r * 0.45 : r;
            ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
          }
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'shield':
          ctx.globalAlpha = k;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.2 - k * 0.4), -1.2, 1.2);
          ctx.stroke();
          break;
        case 'dust':
          ctx.fillStyle = p.color + (0.6 * k).toFixed(2) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1.4 - k * 0.6), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'leaf':
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          SF.D.ell(ctx, 0, 0, p.size, p.size * 0.45, p.color, 0, false);
          break;
        case 'wave': {
          const r = p.size * (1 - k);
          ctx.globalAlpha = k;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 10 * k + 2;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * 0.18, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'rock':
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
        case 'confetti':
          ctx.translate(p.x + Math.sin(p.life * 0.1) * 10, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
      }
      ctx.restore();
    }
    for (const t of this.texts) {
      const k = t.life / t.max;
      const pop = k > 0.85 ? 1 + (k - 0.85) * 3 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2.5);
      ctx.translate(t.x, t.y);
      ctx.rotate(-0.08);
      SF.outlineText(ctx, t.str, 0, 0, t.size * pop, t.color);
      ctx.restore();
    }
  }
};
