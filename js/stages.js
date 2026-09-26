// Stages: a static background painted once to an offscreen canvas,
// plus a few animated touches drawn every frame.
(() => {
  const D = SF.D;
  const W = SF.W;
  const H = SF.H;

  function grad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  function cloud(ctx, x, y, s, col = '#fff') {
    ctx.fillStyle = col;
    [[0, 0, 30], [28, -12, 26], [55, 0, 28], [25, 8, 26]].forEach(([cx, cy, r]) => {
      ctx.beginPath();
      ctx.arc(x + cx * s, y + cy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ------------------------------------------------------------- ULURU
  const uluru = {
    name: 'Uluru Sunset', emoji: '🌅',
    drawStatic(ctx) {
      const rnd = SF.seeded(7);
      ctx.fillStyle = grad(ctx, 0, 400, [[0, '#2d1b5e'], [0.45, '#b3406b'], [0.78, '#ff8a4c'], [1, '#ffc46b']]);
      ctx.fillRect(0, 0, W, 400);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 30; i++) ctx.fillRect(rnd() * W, rnd() * 120, 2, 2);
      const sg = ctx.createRadialGradient(720, 330, 10, 720, 330, 160);
      sg.addColorStop(0, 'rgba(255,240,180,1)');
      sg.addColorStop(0.35, 'rgba(255,210,120,0.8)');
      sg.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(520, 150, 400, 330);
      ctx.fillStyle = '#6a2b55';
      ctx.beginPath();
      ctx.moveTo(0, 400);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 370 + Math.sin(x * 0.02) * 10 + rnd() * 8);
      ctx.lineTo(W, 400);
      ctx.fill();
      // the big rock
      ctx.beginPath();
      ctx.moveTo(160, 405);
      ctx.bezierCurveTo(185, 300, 250, 258, 360, 254);
      ctx.lineTo(610, 258);
      ctx.bezierCurveTo(720, 266, 790, 330, 815, 405);
      ctx.closePath();
      ctx.fillStyle = grad(ctx, 250, 405, [[0, '#ea6a3c'], [1, '#8c2b16']]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      const sh = ctx.createLinearGradient(160, 0, 815, 0);
      sh.addColorStop(0, 'rgba(60,10,20,0.35)');
      sh.addColorStop(0.5, 'rgba(0,0,0,0)');
      sh.addColorStop(1, 'rgba(255,200,120,0.15)');
      ctx.fillStyle = sh;
      ctx.fillRect(150, 240, 680, 170);
      ctx.strokeStyle = 'rgba(100,20,10,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 16; i++) {
        const x = 200 + i * 38 + rnd() * 10;
        ctx.beginPath();
        ctx.moveTo(x, 260);
        ctx.quadraticCurveTo(x + 10, 330, x - 5, 405);
        ctx.stroke();
      }
      ctx.restore();
      // ground
      ctx.fillStyle = grad(ctx, 400, H, [[0, '#d4683a'], [1, '#8e3517']]);
      ctx.fillRect(0, 400, W, H - 400);
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(90,30,10,${0.2 + rnd() * 0.3})`;
        const y = 405 + rnd() * 135;
        ctx.beginPath();
        ctx.ellipse(rnd() * W, y, 2 + rnd() * 5, 1 + rnd() * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // spinifex
      for (let i = 0; i < 14; i++) {
        const x = rnd() * W;
        const y = 405 + rnd() * 50;
        const s = 0.6 + rnd() * 0.7;
        ctx.strokeStyle = rnd() > 0.5 ? '#c4b54a' : '#a39a3a';
        ctx.lineWidth = 2;
        for (let k = -5; k <= 5; k++) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + k * 4 * s, y - (20 - Math.abs(k) * 1.5) * s);
          ctx.stroke();
        }
      }
      // desert oaks
      [[50, 1.1], [905, 0.9]].forEach(([x, s]) => {
        ctx.fillStyle = '#3a1f2a';
        ctx.fillRect(x - 5 * s, 300, 10 * s, 110);
        for (let k = 0; k < 7; k++) {
          ctx.beginPath();
          ctx.ellipse(x + (k - 3) * 14 * s, 290 + Math.abs(k - 3) * 10, 16 * s, 34 * s, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    drawAnim(ctx, t) {
      ctx.strokeStyle = '#2a1030';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const x = ((t * 0.7 + i * 330) % 1200) - 120;
        const y = 110 + i * 35 + Math.sin(t * 0.03 + i) * 8;
        const f = Math.sin(t * 0.2 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - f);
        ctx.quadraticCurveTo(x - 5, y - 4, x, y);
        ctx.quadraticCurveTo(x + 5, y - 4, x + 10, y - f);
        ctx.stroke();
      }
    },
  };

  // ------------------------------------------------------------- BONDI
  const bondi = {
    name: 'Bondi Beach BBQ', emoji: '🏖️',
    drawStatic(ctx) {
      const rnd = SF.seeded(21);
      ctx.fillStyle = grad(ctx, 0, 310, [[0, '#3aa6e6'], [1, '#c6ecff']]);
      ctx.fillRect(0, 0, W, 310);
      // headlands
      ctx.fillStyle = '#6f8f4e';
      ctx.beginPath();
      ctx.moveTo(0, 310);
      ctx.lineTo(0, 240);
      ctx.quadraticCurveTo(120, 220, 230, 290);
      ctx.lineTo(260, 310);
      ctx.fill();
      ctx.fillStyle = '#c8a46a';
      ctx.fillRect(0, 285, 240, 25);
      ctx.fillStyle = '#6f8f4e';
      ctx.beginPath();
      ctx.moveTo(W, 310);
      ctx.lineTo(W, 250);
      ctx.quadraticCurveTo(820, 240, 700, 310);
      ctx.fill();
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = SF.pick(['#fff', '#ffe7c2', '#f7d0d0', '#d6ecff']);
        const bx = 740 + i * 18;
        const bh = 12 + rnd() * 26;
        ctx.fillRect(bx, 290 - bh - (i < 4 ? -(4 - i) * 6 : 0), 16, bh);
      }
      // sea
      ctx.fillStyle = grad(ctx, 305, 405, [[0, '#136fb0'], [1, '#43c6d8']]);
      ctx.fillRect(0, 305, W, 100);
      // sand
      ctx.fillStyle = grad(ctx, 400, H, [[0, '#f6de9d'], [1, '#e2bb68']]);
      ctx.fillRect(0, 400, W, H - 400);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = `rgba(160,120,50,${0.15 + rnd() * 0.25})`;
        ctx.fillRect(rnd() * W, 405 + rnd() * 135, 2, 2);
      }
      // lifesaver flag
      D.line(ctx, 90, 450, 90, 320, 4, '#555');
      ctx.fillStyle = '#e53935';
      ctx.fillRect(92, 322, 40, 14);
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(92, 336, 40, 14);
      // umbrella and towel
      D.line(ctx, 220, 445, 205, 360, 4, '#8a6a4a');
      ctx.save();
      ctx.translate(205, 360);
      ctx.rotate(-0.15);
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 60, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
        ctx.fillStyle = i % 2 ? '#fff' : '#ff6b6b';
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.translate(250, 440);
      ctx.transform(1, 0, -0.6, 0.3, 0, 0);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#4ab3ff' : '#fff';
        ctx.fillRect(i * 18, -40, 18, 80);
      }
      ctx.restore();
      // esky
      SF.roundRect(ctx, 700, 405, 60, 38, 6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      SF.roundRect(ctx, 696, 398, 68, 12, 4);
      ctx.fillStyle = '#2f7fd0';
      ctx.fill();
      ctx.stroke();
      // BBQ
      ctx.fillStyle = '#444';
      ctx.fillRect(815, 410, 6, 38);
      ctx.fillRect(893, 410, 6, 38);
      SF.roundRect(ctx, 805, 385, 104, 30, 6);
      ctx.fillStyle = '#5a5a5a';
      ctx.fill();
      ctx.stroke();
      D.line(ctx, 810, 385, 904, 385, 4, '#222');
      ['#8b3a1a', '#9a4520', '#7d3316'].forEach((c, i) => {
        SF.roundRect(ctx, 818 + i * 28, 374, 24, 9, 4);
        ctx.fillStyle = c;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    },
    drawAnim(ctx, t) {
      for (let i = 0; i < 3; i++) {
        const x = ((t * 0.25 + i * 380) % 1260) - 150;
        cloud(ctx, x, 60 + i * 45, 0.8 + i * 0.2, 'rgba(255,255,255,0.9)');
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      for (let r = 0; r < 4; r++) {
        const y = 320 + r * 22;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) {
          const yy = y + Math.sin(x * 0.03 + t * 0.05 + r) * 3;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.globalAlpha = 0.3 + r * 0.1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const surf = 400 + Math.sin(t * 0.04) * 4;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(0, surf);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, surf + Math.sin(x * 0.05 + t * 0.08) * 3);
      ctx.lineTo(W, surf + 6);
      ctx.lineTo(0, surf + 6);
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const k = ((t + i * 30) % 120) / 120;
        ctx.fillStyle = `rgba(220,220,220,${0.5 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(855 + Math.sin(k * 6 + i) * 12, 370 - k * 90, 8 + k * 14, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  // ------------------------------------------------------------- RAINFOREST
  const rainforest = {
    name: 'Rainforest Canopy', emoji: '🌿',
    drawStatic(ctx) {
      const rnd = SF.seeded(99);
      ctx.fillStyle = grad(ctx, 0, 420, [[0, '#0f3b2a'], [1, '#3f7f45']]);
      ctx.fillRect(0, 0, W, 420);
      ['#1d4a31', '#26583a', '#316b44'].forEach((col, layer) => {
        ctx.fillStyle = col;
        for (let i = 0; i < 7; i++) {
          const x = rnd() * W;
          const w = 22 + layer * 10 + rnd() * 14;
          ctx.fillRect(x, 0, w, 420);
        }
      });
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#fff7b0';
      for (let i = 0; i < 5; i++) {
        const x = 80 + i * 190;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 50, 0);
        ctx.lineTo(x + 180, 420);
        ctx.lineTo(x + 90, 420);
        ctx.fill();
      }
      ctx.restore();
      // big tree with buttress roots
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(430, 0, 100, 420);
      ctx.beginPath();
      ctx.moveTo(430, 330);
      ctx.quadraticCurveTo(400, 400, 350, 425);
      ctx.lineTo(610, 425);
      ctx.quadraticCurveTo(560, 400, 530, 330);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(445 + i * 18, 0);
        ctx.lineTo(448 + i * 18, 400);
        ctx.stroke();
      }
      // canopy
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = SF.pick(['#1f5a2e', '#2a6e38', '#347f42', '#184a26']);
        ctx.beginPath();
        ctx.ellipse(rnd() * W, rnd() * 70, 50 + rnd() * 40, 30 + rnd() * 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // vines
      ctx.strokeStyle = '#2f5d23';
      ctx.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        const x = 40 + i * 140 + rnd() * 40;
        const len = 120 + rnd() * 160;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 30, len / 2, x - 10, len);
        ctx.stroke();
        for (let k = 1; k < 6; k++) {
          D.ell(ctx, x + 8 + Math.sin(k) * 10, (len / 6) * k, 7, 4, '#4f9a3c', 0.5, false);
        }
      }
      // ground
      ctx.fillStyle = grad(ctx, 405, H, [[0, '#4a3522'], [1, '#22160c']]);
      ctx.fillRect(0, 405, W, H - 405);
      ctx.fillStyle = '#3f7a33';
      ctx.beginPath();
      ctx.moveTo(0, 405);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 402 + Math.sin(x * 0.3) * 4);
      ctx.lineTo(W, 418);
      ctx.lineTo(0, 418);
      ctx.fill();
      for (let i = 0; i < 50; i++) {
        D.ell(ctx, rnd() * W, 425 + rnd() * 110, 5, 2.5, SF.pick(['#6b4a2a', '#8a5a2a', '#4f6b2a']), rnd() * 3, false);
      }
      // ferns
      [[30, 1], [930, -1], [300, 1], [700, -1]].forEach(([x, dir]) => {
        for (let k = 0; k < 5; k++) {
          const a = -1.2 + k * 0.6;
          ctx.strokeStyle = '#3f8f3a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, 412);
          const ex = x + Math.sin(a) * 60 * dir;
          const ey = 412 - Math.cos(a) * 50;
          ctx.quadraticCurveTo(x + Math.sin(a) * 30 * dir, ey - 20, ex, ey);
          ctx.stroke();
        }
      });
    },
    drawAnim(ctx, t) {
      for (let i = 0; i < 12; i++) {
        const x = (i * 83 + Math.sin(t * 0.01 + i) * 40 + W) % W;
        const y = 150 + ((i * 47) % 220) + Math.sin(t * 0.03 + i * 2) * 15;
        const a = 0.4 + 0.4 * Math.sin(t * 0.08 + i);
        ctx.fillStyle = `rgba(230,255,120,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.6 + i * 150) % 520) / 520;
        const x = 100 + i * 230 + Math.sin(k * 12 + i) * 30;
        const y = k * 440;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(k * 10);
        D.ell(ctx, 0, 0, 7, 3.5, '#8fbf4a', 0, false);
        ctx.restore();
      }
      // blue Ulysses butterfly
      const bx = 480 + Math.sin(t * 0.013) * 380;
      const by = 200 + Math.sin(t * 0.031) * 60;
      const flap = Math.abs(Math.sin(t * 0.3));
      ctx.fillStyle = '#1e88e5';
      ctx.beginPath();
      ctx.ellipse(bx - 6 * flap, by, 8 * flap + 1, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(bx + 6 * flap, by, 8 * flap + 1, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  // ------------------------------------------------------------- HARBOUR
  const harbour = {
    name: 'Sydney Harbour Night', emoji: '🎆',
    init() {
      this.fireworks = [];
    },
    drawStatic(ctx) {
      const rnd = SF.seeded(5);
      ctx.fillStyle = grad(ctx, 0, 345, [[0, '#0a0f2e'], [0.7, '#262f6a'], [1, '#43407e']]);
      ctx.fillRect(0, 0, W, 345);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`;
        const s = rnd() > 0.9 ? 2.5 : 1.5;
        ctx.fillRect(rnd() * W, rnd() * 260, s, s);
      }
      ctx.fillStyle = '#fff7d6';
      ctx.beginPath();
      ctx.arc(820, 80, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#262f6a';
      ctx.beginPath();
      ctx.arc(808, 72, 24, 0, Math.PI * 2);
      ctx.fill();
      // skyline
      for (let i = 0; i < 18; i++) {
        const x = 330 + i * 30;
        const h = 20 + rnd() * 70;
        ctx.fillStyle = '#161b3d';
        ctx.fillRect(x, 340 - h, 28, h);
        ctx.fillStyle = 'rgba(255,220,120,0.8)';
        for (let k = 0; k < h / 10 - 1; k++) if (rnd() > 0.5) ctx.fillRect(x + 5 + (k % 2) * 10, 340 - h + 6 + k * 9, 4, 4);
      }
      // bridge
      ctx.strokeStyle = '#3a4468';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(500, 300);
      ctx.quadraticCurveTo(760, 120, 1020, 300);
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(505, 300);
      ctx.quadraticCurveTo(760, 175, 1015, 300);
      ctx.stroke();
      ctx.lineWidth = 2;
      for (let x = 520; x <= 960; x += 22) {
        const tt = (x - 500) / 520;
        const top = (1 - tt) * (1 - tt) * 300 + 2 * (1 - tt) * tt * 120 + tt * tt * 300;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, 300);
        ctx.stroke();
      }
      ctx.fillStyle = '#3a4468';
      ctx.fillRect(470, 300, 500, 8);
      ctx.fillStyle = '#7a7690';
      ctx.fillRect(468, 250, 44, 95);
      ctx.fillStyle = '#ffd86b';
      for (let x = 510; x <= 960; x += 26) {
        const tt = (x - 500) / 520;
        const top = (1 - tt) * (1 - tt) * 300 + 2 * (1 - tt) * tt * 120 + tt * tt * 300;
        ctx.beginPath();
        ctx.arc(x, top - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // opera house
      ctx.fillStyle = '#b7a684';
      ctx.fillRect(60, 322, 330, 24);
      const sail = (x0, x1, px, py) => {
        ctx.beginPath();
        ctx.moveTo(x0, 324);
        ctx.quadraticCurveTo(x0 + (px - x0) * 0.1, py + 40, px, py);
        ctx.quadraticCurveTo(x1 - 8, py + 50, x1, 324);
        ctx.closePath();
        ctx.fillStyle = '#f4f1e8';
        ctx.fill();
        ctx.strokeStyle = '#a9a291';
        ctx.lineWidth = 2;
        ctx.stroke();
      };
      sail(80, 180, 165, 236);
      sail(140, 240, 225, 222);
      sail(205, 300, 290, 246);
      sail(270, 360, 348, 266);
      // water
      ctx.fillStyle = grad(ctx, 345, 418, [[0, '#18255e'], [1, '#0e1640']]);
      ctx.fillRect(0, 345, W, 75);
      // boardwalk
      ctx.fillStyle = grad(ctx, 415, H, [[0, '#8a6440'], [1, '#5a3d22']]);
      ctx.fillRect(0, 415, W, H - 415);
      ctx.strokeStyle = 'rgba(40,20,5,0.45)';
      ctx.lineWidth = 2;
      for (let y = 430; y < H; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let i = 0; i < 40; i++) {
        const y = 430 + Math.floor(rnd() * 6) * 18;
        const x = rnd() * W;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 18);
        ctx.stroke();
      }
      ctx.fillStyle = '#3d2a17';
      ctx.fillRect(0, 413, W, 5);
    },
    drawAnim(ctx, t) {
      ctx.fillStyle = 'rgba(255,220,140,0.5)';
      for (let i = 0; i < 26; i++) {
        const x = (i * 97 + t * (0.3 + (i % 3) * 0.2)) % W;
        const y = 352 + ((i * 13) % 60);
        ctx.fillRect(x, y, 10 + (i % 4) * 6, 2);
      }
      if (!this.fireworks) this.fireworks = [];
      if (t % 110 === 0) {
        const cx = SF.rand(120, 840);
        const cy = SF.rand(60, 200);
        const col = SF.pick(['#ff5a5f', '#ffd24a', '#5ad17a', '#4ab3ff', '#ff8ad8']);
        this.fireworks.push({ cx, cy, col, t: 0 });
      }
      this.fireworks.forEach((fw) => {
        fw.t++;
        const k = fw.t / 60;
        ctx.fillStyle = fw.col;
        ctx.globalAlpha = Math.max(0, 1 - k);
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const r = 70 * Math.sqrt(k);
          ctx.beginPath();
          ctx.arc(fw.cx + Math.cos(a) * r, fw.cy + Math.sin(a) * r + k * k * 20, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      this.fireworks = this.fireworks.filter((fw) => fw.t < 60);
    },
  };

  // ------------------------------------------------------------- BILLABONG
  const billabong = {
    name: 'The Billabong', emoji: '🪷',
    drawStatic(ctx) {
      const rnd = SF.seeded(42);
      ctx.fillStyle = grad(ctx, 0, 340, [[0, '#7cc7ee'], [1, '#fdf1c7']]);
      ctx.fillRect(0, 0, W, 340);
      ctx.fillStyle = '#9bb58a';
      ctx.beginPath();
      ctx.moveTo(0, 330);
      for (let x = 0; x <= W; x += 30) ctx.lineTo(x, 300 + Math.sin(x * 0.012) * 18);
      ctx.lineTo(W, 340);
      ctx.lineTo(0, 340);
      ctx.fill();
      // river red gums with pale trunks
      [[120, 1.1, -0.08], [300, 0.8, 0.06], [760, 1.2, 0.1], [900, 0.9, -0.05]].forEach(([x, sc, lean]) => {
        ctx.save();
        ctx.translate(x, 380);
        ctx.rotate(lean);
        ctx.fillStyle = '#e9e1d2';
        ctx.beginPath();
        ctx.moveTo(-10 * sc, 0);
        ctx.quadraticCurveTo(-6 * sc, -120 * sc, -4 * sc, -200 * sc);
        ctx.lineTo(6 * sc, -200 * sc);
        ctx.quadraticCurveTo(8 * sc, -120 * sc, 12 * sc, 0);
        ctx.fill();
        ctx.strokeStyle = '#b9ab98';
        ctx.lineWidth = 2;
        ctx.stroke();
        D.line(ctx, 0, -140 * sc, -40 * sc, -190 * sc, 7 * sc, '#e9e1d2');
        D.line(ctx, 2, -120 * sc, 44 * sc, -170 * sc, 6 * sc, '#e9e1d2');
        [[-40, -205, 42], [0, -230, 50], [44, -195, 40], [-10, -180, 34]].forEach(([lx, ly, r]) => {
          ctx.fillStyle = SF.pick(['#6f9a57', '#5f8a4a', '#7fae63']);
          ctx.beginPath();
          ctx.ellipse(lx * sc, ly * sc, r * sc, r * 0.6 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      });
      // water
      ctx.fillStyle = grad(ctx, 338, 420, [[0, '#4a9bb8'], [1, '#2f7390']]);
      ctx.beginPath();
      ctx.moveTo(0, 345);
      ctx.quadraticCurveTo(W / 2, 330, W, 345);
      ctx.lineTo(W, 418);
      ctx.lineTo(0, 418);
      ctx.fill();
      // lily pads
      for (let i = 0; i < 9; i++) {
        const x = 60 + i * 105 + rnd() * 30;
        const y = 360 + rnd() * 45;
        ctx.fillStyle = '#5c9c48';
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 6, 0, 0.3, Math.PI * 2);
        ctx.lineTo(x, y);
        ctx.fill();
        if (i % 2 === 0) {
          D.ell(ctx, x + 4, y - 4, 6, 4, '#ff8ad8', 0, false);
          D.ell(ctx, x + 4, y - 5, 2.5, 2, '#ffe14a', 0, false);
        }
      }
      // muddy bank
      ctx.fillStyle = grad(ctx, 412, H, [[0, '#a07a4a'], [1, '#6b4a2a']]);
      ctx.fillRect(0, 412, W, H - 412);
      ctx.fillStyle = '#7fa35a';
      ctx.fillRect(0, 410, W, 8);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(60,40,20,${0.15 + rnd() * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(rnd() * W, 425 + rnd() * 110, 3 + rnd() * 4, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // reeds
      [[30, 14], [210, 8], [470, 6], [640, 10], [930, 12]].forEach(([x, n]) => {
        for (let k = 0; k < n; k++) {
          const rx = x + (k - n / 2) * 5;
          const h = 50 + rnd() * 50;
          D.line(ctx, rx, 418, rx + (rnd() - 0.5) * 16, 418 - h, 3, '#6f8f3a');
          if (k % 3 === 0) D.ell(ctx, rx + 2, 418 - h + 8, 3.5, 10, '#7a4b25', 0, false);
        }
      });
    },
    drawAnim(ctx, t) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const k = ((t + i * 40) % 200) / 200;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.ellipse(120 + i * 180, 375 + (i % 2) * 20, 8 + k * 40, 2 + k * 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // jumping fish
      const ft = t % 300;
      if (ft < 40) {
        const k = ft / 40;
        const fx = 560 + k * 90;
        const fy = 380 - Math.sin(k * Math.PI) * 60;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(-Math.cos(k * Math.PI) * 0.8);
        D.ell(ctx, 0, 0, 12, 6, '#f2a93b', 0, false);
        D.poly(ctx, [-10, 0, -18, -6, -18, 6], '#f2a93b', false);
        ctx.restore();
      }
      // dragonflies
      for (let i = 0; i < 2; i++) {
        const x = 480 + Math.sin(t * 0.017 + i * 3) * 380;
        const y = 250 + Math.sin(t * 0.05 + i) * 50;
        D.line(ctx, x - 8, y, x + 8, y, 3, '#2f7fd0');
        ctx.fillStyle = 'rgba(200,240,255,0.7)';
        const f = Math.sin(t * 0.8) * 3;
        ctx.fillRect(x - 3, y - 7 - f, 3, 6);
        ctx.fillRect(x + 1, y - 7 + f, 3, 6);
      }
    },
  };

  // ------------------------------------------------------------- OUTBACK DUNNY
  const dunny = {
    name: 'The Outback Dunny', emoji: '🚽',
    drawStatic(ctx) {
      const rnd = SF.seeded(77);
      ctx.fillStyle = grad(ctx, 0, 400, [[0, '#2f8fe0'], [1, '#bfe6ff']]);
      ctx.fillRect(0, 0, W, 400);
      cloud(ctx, 150, 90, 0.9);
      cloud(ctx, 620, 60, 0.7);
      ctx.fillStyle = '#c96a3a';
      ctx.beginPath();
      ctx.moveTo(0, 390);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 370 + Math.sin(x * 0.02) * 6 + rnd() * 6);
      ctx.lineTo(W, 400);
      ctx.fill();
      ctx.fillStyle = grad(ctx, 395, H, [[0, '#d97b45'], [1, '#9e4a22']]);
      ctx.fillRect(0, 395, W, H - 395);
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(110,40,15,${0.15 + rnd() * 0.3})`;
        ctx.fillRect(rnd() * W, 400 + rnd() * 140, 3, 2);
      }
      // fence
      for (let x = 0; x < W; x += 60) {
        ctx.fillStyle = '#8a6a4a';
        ctx.fillRect(x, 360, 5, 40);
      }
      D.line(ctx, 0, 370, W, 370, 1.5, '#555');
      D.line(ctx, 0, 384, W, 384, 1.5, '#555');
      // water tank
      ctx.fillStyle = '#b8c0c8';
      ctx.fillRect(640, 300, 90, 95);
      ctx.strokeStyle = '#8a939c';
      ctx.lineWidth = 2;
      for (let y = 308; y < 395; y += 8) {
        ctx.beginPath();
        ctx.moveTo(640, y);
        ctx.lineTo(730, y);
        ctx.stroke();
      }
      ctx.fillStyle = '#9aa3ad';
      ctx.beginPath();
      ctx.ellipse(685, 300, 45, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // windmill tower
      ctx.strokeStyle = '#6b6b6b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(820, 400);
      ctx.lineTo(850, 180);
      ctx.lineTo(880, 400);
      ctx.moveTo(828, 340);
      ctx.lineTo(872, 340);
      ctx.moveTo(836, 280);
      ctx.lineTo(864, 280);
      ctx.moveTo(842, 230);
      ctx.lineTo(858, 230);
      ctx.stroke();
      // the dunny
      ctx.fillStyle = '#9aa3ad';
      ctx.fillRect(90, 290, 90, 112);
      ctx.strokeStyle = '#7d858e';
      for (let x = 96; x < 180; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 292);
        ctx.lineTo(x, 400);
        ctx.stroke();
      }
      D.poly(ctx, [80, 294, 135, 262, 190, 294], '#b33a2a');
      SF.roundRect(ctx, 110, 312, 50, 88, 3);
      ctx.fillStyle = '#6b4a2a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(135, 330, 8, Math.PI * 0.3, Math.PI * 1.7);
      ctx.arc(139, 330, 7, Math.PI * 1.6, Math.PI * 0.4, true);
      ctx.fill();
      D.ell(ctx, 152, 360, 3, 3, '#ffd24a', 0, false);
      // gum tree
      ctx.fillStyle = '#d8cfc0';
      ctx.fillRect(505, 230, 14, 170);
      [[490, 220, 44], [530, 205, 50], [560, 230, 36], [470, 240, 30]].forEach(([x, y, r]) => {
        ctx.fillStyle = SF.pick(['#6f9a57', '#5f8a4a']);
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      // Hills Hoist pole
      D.line(ctx, 340, 400, 340, 250, 5, '#8a939c');
    },
    drawAnim(ctx, t) {
      // windmill blades
      ctx.save();
      ctx.translate(850, 175);
      ctx.rotate(t * 0.05);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = i % 2 ? '#d8dde2' : '#b0b8c0';
        ctx.fillRect(4, -4, 36, 8);
      }
      ctx.restore();
      D.ell(ctx, 850, 175, 7, 7, '#6b6b6b');
      // Hills Hoist spinning slowly with washing
      const a = t * 0.01;
      ctx.save();
      ctx.translate(340, 250);
      for (let i = 0; i < 4; i++) {
        const ang = a + (i * Math.PI) / 2;
        const ex = Math.cos(ang) * 90;
        const ey = Math.sin(ang) * 12;
        D.line(ctx, 0, 0, ex, ey, 3, '#8a939c');
        const cols = ['#ff5a5f', '#4ab3ff', '#ffd24a', '#5ad17a'];
        const sway = Math.sin(t * 0.08 + i) * 4;
        ctx.fillStyle = cols[i];
        ctx.fillRect(ex * 0.6 - 10 + sway, ey * 0.6, 20, 26);
      }
      ctx.restore();
      // flies around the dunny
      ctx.fillStyle = '#222';
      for (let i = 0; i < 4; i++) {
        const fx = 135 + Math.sin(t * 0.15 + i * 2) * 40;
        const fy = 280 + Math.cos(t * 0.21 + i) * 25;
        ctx.fillRect(fx, fy, 3, 3);
      }
      // tumbleweed
      const tt = t % 700;
      if (tt < 260) {
        const x = -40 + tt * 4;
        const y = 440 - Math.abs(Math.sin(tt * 0.1)) * 30;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tt * 0.2);
        ctx.strokeStyle = '#a8864f';
        ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 18, 10, k, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
  };

  SF.STAGES = { uluru, bondi, rainforest, harbour, billabong, dunny };
  SF.STAGE_LIST = ['uluru', 'bondi', 'rainforest', 'harbour', 'billabong', 'dunny'];

  const cache = {};
  function staticCanvas(id) {
    if (!cache[id]) {
      const s = 2;
      const c = document.createElement('canvas');
      c.width = W * s;
      c.height = H * s;
      const cx = c.getContext('2d');
      cx.scale(s, s);
      SF.STAGES[id].drawStatic(cx);
      cache[id] = c;
    }
    return cache[id];
  }

  SF.drawStage = (ctx, id, t) => {
    ctx.drawImage(staticCanvas(id), 0, 0, W, H);
    SF.STAGES[id].drawAnim(ctx, t);
  };

  SF.drawStageThumb = (canvas, id) => {
    const c = canvas.getContext('2d');
    c.drawImage(staticCanvas(id), 0, 0, canvas.width, canvas.height);
  };
})();
