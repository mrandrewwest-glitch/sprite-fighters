// Roster pack 2: Spike, Dotty, Wombo and Dash.
(() => {
  const D = SF.D;
  const G = () => SF.GROUND;
  const { leanAround, clipEll, withMoves } = SF.FH;
  let uid = 0;

  // ---------------------------------------------------------------- SPIKE
  function spikeQuills(ctx, cx, cy, r, from, to, n, c) {
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * i) / (n - 1);
      const bx = cx + Math.cos(a) * r * 0.75;
      const by = cy + Math.sin(a) * r * 0.75;
      const tx = cx + Math.cos(a) * (r + 22);
      const ty = cy + Math.sin(a) * (r + 22);
      const px = Math.cos(a + Math.PI / 2) * 6;
      const py = Math.sin(a + Math.PI / 2) * 6;
      D.poly(ctx, [bx - px, by - py, tx, ty, bx + px, by + py], c.quill);
      D.line(ctx, tx, ty, tx - Math.cos(a) * 8, ty - Math.sin(a) * 8, 3, c.tip);
    }
  }

  function drawSpike(ctx, p, c) {
    const t = p.t;
    let e = D.limb(ctx, -10, -24, p.legB, 20 * p.legBExt, 12, c.furDark);
    D.ell(ctx, e.x + 5, e.y + 1, 10, 6, c.furDark, -p.legB);
    ctx.save();
    leanAround(ctx, p, -30);
    let h = D.limb(ctx, 4, -62, p.armB, 20 * p.armBExt, 10, c.furDark);
    D.ell(ctx, h.x, h.y, 6, 6, c.furDark);
    spikeQuills(ctx, -4, -62, 38, Math.PI * 0.55, Math.PI * 1.75, 11, c);
    D.ell(ctx, 0, -60, 38, 42, c.fur);
    D.ell(ctx, 14, -52, 20, 28, c.belly, 0, false);
    // face
    ctx.save();
    ctx.translate(18, -82);
    ctx.rotate(p.head);
    D.ell(ctx, 0, 0, 20, 18, c.face);
    ctx.save();
    ctx.translate(14, 4);
    ctx.rotate(0.25 + (p.face === 'attack' ? -0.15 : 0));
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(34, -2);
    ctx.quadraticCurveTo(38, 1, 34, 4);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fillStyle = c.snout;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    ctx.restore();
    D.eye(ctx, 6, -5, 5, p.face, t);
    if (p.face === 'attack' || p.face === 'happy' || p.face === 'laugh') D.mouth(ctx, 10, 11, 8, p.face);
    ctx.restore();
    h = D.limb(ctx, 16, -60, p.armF, 22 * p.armFExt, 10, c.fur);
    D.ell(ctx, h.x, h.y, 7, 6, c.fur);
    for (let i = -1; i <= 1; i++) D.line(ctx, h.x + 3, h.y + 3, h.x + 8, h.y + 6 + i * 4, 2, c.claw);
    ctx.restore();
    e = D.limb(ctx, 10, -24, p.legF, 20 * p.legFExt, 12, c.fur);
    D.ell(ctx, e.x + 5, e.y + 1, 10, 6, c.fur, -p.legF);
    for (let i = 0; i < 3; i++) D.line(ctx, e.x + 10, e.y - 2 + i * 3, e.x + 16, e.y - 1 + i * 3, 2, c.claw);
  }

  function drawSpikeBall(ctx, p, c) {
    ctx.save();
    ctx.translate(0, -42);
    ctx.rotate(p.ball);
    spikeQuills(ctx, 0, 0, 36, 0, Math.PI * 2 - 0.35, 16, c);
    D.ell(ctx, 0, 0, 38, 38, c.fur);
    D.ell(ctx, 8, 8, 22, 20, c.belly, 0, false);
    D.eye(ctx, 18, -2, 5, p.face === 'dizzy' ? 'dizzy' : 'attack', p.t, false);
    ctx.restore();
  }

  // ---------------------------------------------------------------- DOTTY
  function drawDotty(ctx, p, c) {
    const t = p.t;
    // tail paddle
    ctx.save();
    ctx.translate(-26, -34);
    ctx.rotate(-0.35 + p.tail);
    D.ell(ctx, -20, 0, 26, 11, c.tail);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-40, i * 4);
      ctx.lineTo(-2, i * 4);
      ctx.stroke();
    }
    ctx.restore();
    let e = D.limb(ctx, -9, -26, p.legB, 22 * p.legBExt, 11, c.furDark);
    D.poly(ctx, [e.x - 4, e.y - 4, e.x + 18, e.y - 2, e.x + 16, e.y + 5, e.x - 4, e.y + 4], c.foot);
    ctx.save();
    leanAround(ctx, p, -30);
    let h = D.limb(ctx, -2, -76, p.armB, 22 * p.armBExt, 9, c.furDark);
    D.ell(ctx, h.x, h.y, 7, 5, c.foot);
    D.ell(ctx, 0, -62, 30, 40, c.fur);
    D.ell(ctx, 10, -56, 17, 28, c.belly, 0, false);
    ctx.save();
    ctx.translate(10, -104);
    ctx.rotate(p.head);
    D.ell(ctx, 0, 0, 22, 20, c.fur);
    // bill (lower jaw opens)
    ctx.save();
    ctx.translate(16, 4);
    ctx.rotate(p.beak * 0.6);
    SF.roundRect(ctx, 0, 0, 38, 9, 5);
    ctx.fillStyle = c.billDark;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    ctx.restore();
    SF.roundRect(ctx, 14, -8, 44, 15, 8);
    ctx.fillStyle = c.bill;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    D.ell(ctx, 48, -3, 2.5, 1.8, D.OUT, 0, false);
    D.ell(ctx, 42, -3, 2.5, 1.8, D.OUT, 0, false);
    D.eye(ctx, 6, -6, 5, p.face, t);
    // swim goggles pushed up
    D.line(ctx, -20, -12, 16, -16, 4, c.goggle);
    D.ell(ctx, 0, -17, 7, 5, '#bfeaff');
    D.ell(ctx, 13, -17, 7, 5, '#bfeaff');
    ctx.restore();
    h = D.limb(ctx, 12, -78, p.armF, 22 * p.armFExt, 9, c.fur);
    D.ell(ctx, h.x + 2, h.y, 8, 5, c.foot, -p.armF);
    ctx.restore();
    e = D.limb(ctx, 9, -26, p.legF, 22 * p.legFExt, 11, c.fur);
    D.poly(ctx, [e.x - 4, e.y - 4, e.x + 20, e.y - 2, e.x + 18, e.y + 5, e.x - 4, e.y + 4], c.foot);
  }

  // ---------------------------------------------------------------- WOMBO
  function drawWombo(ctx, p, c) {
    const t = p.t;
    let e = D.limb(ctx, -18, -30, p.legB, 22 * p.legBExt, 20, c.furDark);
    D.ell(ctx, e.x + 6, e.y + 2, 14, 7, c.furDark, -p.legB);
    ctx.save();
    leanAround(ctx, p, -35);
    let h = D.limb(ctx, -4, -76, p.armB, 24 * p.armBExt, 15, c.furDark);
    D.ell(ctx, h.x, h.y, 9, 8, c.furDark);
    // chunky body with square rump
    SF.roundRect(ctx, -48, -98, 90, 78, 30);
    ctx.fillStyle = c.fur;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    SF.roundRect(ctx, -46, -80, 30, 52, 10);
    ctx.fillStyle = c.rump;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    D.ell(ctx, 12, -56, 20, 24, c.belly, 0, false);
    ctx.save();
    ctx.translate(22, -98);
    ctx.rotate(p.head);
    D.ell(ctx, -16, -24, 9, 8, c.furDark);
    D.ell(ctx, 10, -27, 9, 8, c.fur);
    SF.roundRect(ctx, -26, -24, 62, 46, 20);
    ctx.fillStyle = c.fur;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    // sweatband
    SF.roundRect(ctx, -26, -18, 60, 9, 4);
    ctx.fillStyle = c.band;
    ctx.fill();
    ctx.stroke();
    D.eye(ctx, 12, -1, 5, p.face, t);
    D.ell(ctx, 34, 4, 10, 9, c.nose);
    D.ell(ctx, 32, 1, 3, 2, 'rgba(255,255,255,0.5)', 0, false);
    D.mouth(ctx, 26, 16, 10, p.face);
    ctx.restore();
    h = D.limb(ctx, 18, -74, p.armF, 26 * p.armFExt, 15, c.fur);
    D.ell(ctx, h.x, h.y, 10, 9, c.fur);
    for (let i = -1; i <= 1; i++) D.line(ctx, h.x + 4, h.y + 5, h.x + 9, h.y + 8 + i * 4, 2, '#e8e0d0');
    ctx.restore();
    e = D.limb(ctx, 14, -30, p.legF, 22 * p.legFExt, 20, c.fur);
    D.ell(ctx, e.x + 6, e.y + 2, 14, 7, c.fur, -p.legF);
  }

  // ---------------------------------------------------------------- DASH
  function dashLeg(ctx, x, ang, ext, c, col) {
    const knee = D.limb(ctx, x, -92, ang * 0.7, 40 * ext, 7, col);
    const foot = D.limb(ctx, knee.x, knee.y, ang * 1.3 - 0.35, 46 * ext, 6, col);
    // running shoe
    ctx.save();
    ctx.translate(foot.x, foot.y);
    ctx.rotate(-ang * 0.6);
    SF.roundRect(ctx, -8, -8, 26, 11, 5);
    ctx.fillStyle = c.shoe;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    D.line(ctx, -6, 2, 16, 2, 2, '#fff');
    ctx.restore();
  }

  function drawDash(ctx, p, c) {
    const t = p.t;
    dashLeg(ctx, -6, p.legB, p.legBExt, c, c.legDark);
    ctx.save();
    leanAround(ctx, p, -95);
    // shaggy body
    D.ell(ctx, -6, -112, 40, 30, c.feather);
    ctx.strokeStyle = c.featherDark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const x = -38 + i * 8;
      ctx.beginPath();
      ctx.moveTo(x, -104 + Math.sin(i) * 6);
      ctx.quadraticCurveTo(x - 6, -92, x - 4, -84 + (i % 3) * 3);
      ctx.stroke();
    }
    // tiny wing
    ctx.save();
    ctx.translate(8, -114);
    ctx.rotate(-p.armF * 0.5);
    D.ell(ctx, 0, 8, 7, 13, c.featherDark);
    ctx.restore();
    // long neck + head
    ctx.save();
    ctx.translate(20, -128);
    ctx.rotate(p.head * 0.8);
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(-2, -20, 8, -42);
    ctx.lineTo(18, -40);
    ctx.quadraticCurveTo(10, -18, 8, 10);
    ctx.closePath();
    ctx.fillStyle = c.neck;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    ctx.translate(14, -50);
    D.poly(ctx, [-12, -10, -8, -22, -3, -12, 2, -24, 4, -11], c.featherDark);
    D.ell(ctx, 0, 0, 13, 12, c.neck);
    ctx.save();
    ctx.translate(10, 2);
    ctx.rotate(p.beak * 0.7);
    D.poly(ctx, [0, 0, 16, 1, 0, 5], c.beak);
    ctx.restore();
    D.poly(ctx, [8, -4, 26, 1, 9, 3], c.beak);
    if (p.face === 'normal' || p.face === 'attack' || p.face === 'grumpy') {
      D.ell(ctx, 2, -3, 6, 6.5, '#fff');
      D.ell(ctx, 3.5, -3, 4, 4.5, '#e8892b', 0, false);
      D.ell(ctx, 4, -3, 2, 2.5, '#111', 0, false);
      if (p.face === 'attack') D.line(ctx, -4, -11, 8, -8, 3, D.OUT);
    } else {
      D.eye(ctx, 2, -3, 5, p.face, t, false);
    }
    ctx.restore();
    ctx.restore();
    dashLeg(ctx, 6, p.legF, p.legFExt, c, c.leg);
  }

  // ---------------------------------------------------------------- entities
  function quill(f, m, ang, speed, props) {
    m.addProjectile({
      owner: f, x: f.x + Math.cos(ang) * 30, y: f.y - 42 + Math.sin(ang) * 30,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, w: 22, h: 22, life: 110,
      props: Object.assign({ dmg: 2, kb: 2, stun: 14, chip: 0.3, light: true }, props),
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        D.poly(ctx, [-14, -4, 14, 0, -14, 4], '#f1e3c0');
        D.line(ctx, 8, 0, 14, 0, 3, '#3a2a1c');
        ctx.restore();
      },
    });
  }

  function splashWave(f, m) {
    if (m.projectiles.some((pr) => pr.owner === f)) return;
    m.addProjectile({
      owner: f, x: f.x + f.facing * 45, y: G() - 22, vx: 9 * f.facing, vy: 0, w: 54, h: 44, life: 34,
      props: { dmg: 7, kb: 3, stun: 20, knockdown: true, launch: 5 },
      draw(ctx, t) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(Math.sign(this.vx), 1);
        ctx.globalAlpha = Math.min(1, this.life / 8);
        ctx.beginPath();
        ctx.moveTo(-30, 22);
        ctx.quadraticCurveTo(-24, -10 - Math.sin(t * 0.5) * 4, 4, -24);
        ctx.quadraticCurveTo(22, -26, 26, -8);
        ctx.quadraticCurveTo(12, -14, 10, 0);
        ctx.quadraticCurveTo(22, 10, 30, 22);
        ctx.closePath();
        ctx.fillStyle = '#5fc8ff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1a5b8a';
        ctx.stroke();
        for (let i = 0; i < 4; i++) D.ell(ctx, -20 + i * 14, -30 - ((t * 3 + i * 7) % 16), 3, 4, '#bfeaff', 0, false);
        ctx.restore();
      },
    });
    m.sfx('splash');
  }

  class Puddle {
    constructor(x) {
      this.x = x;
      this.r = 10;
      this.t = 0;
      this.geyser = 0;
    }
    update() {
      this.t++;
      if (this.geyser > 0) this.geyser++;
      else this.r = Math.min(70, this.r + 4);
      if (this.geyser > 55) this.r -= 4;
      if (this.geyser > 55 && this.r <= 0) this.dead = true;
    }
    dangerZone() {
      return this.geyser ? null : { x: this.x, r: 90 };
    }
    drawBack(ctx) {
      ctx.save();
      ctx.fillStyle = '#3e9fd8';
      ctx.strokeStyle = '#1a5b8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(this.x, G() + 4, Math.max(0, this.r), Math.max(0, this.r * 0.16), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (!this.geyser) {
        for (let i = 0; i < 3; i++) {
          const k = ((this.t + i * 9) % 26) / 26;
          D.ell(ctx, this.x + (i - 1) * 20, G() - k * 40, 4 + k * 3, 4 + k * 3, 'rgba(190,234,255,0.8)', 0, false);
        }
      }
      ctx.restore();
    }
    draw(ctx) {
      if (!this.geyser) return;
      const k = Math.min(1, this.geyser / 6) * (this.geyser > 40 ? Math.max(0, 1 - (this.geyser - 40) / 15) : 1);
      if (k <= 0) return;
      ctx.save();
      const h = 420 * k;
      const g = ctx.createLinearGradient(0, G() - h, 0, G());
      g.addColorStop(0, 'rgba(220,245,255,0.95)');
      g.addColorStop(1, 'rgba(60,160,230,0.9)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(this.x - 55, G());
      for (let y = 0; y <= h; y += 20) ctx.lineTo(this.x - 45 + Math.sin(y * 0.1 + this.geyser) * 8, G() - y);
      for (let y = h; y >= 0; y -= 20) ctx.lineTo(this.x + 45 + Math.sin(y * 0.1 + this.geyser + 2) * 8, G() - y);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1a5b8a';
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + this.geyser * 0.1;
        D.ell(ctx, this.x + Math.cos(a) * 60, G() - h + Math.sin(a) * 20, 8, 8, '#bfeaff', 0, false);
      }
      ctx.restore();
    }
  }

  class CubeDrop {
    constructor(owner, x, size, props, delay) {
      this.owner = owner;
      this.x = SF.clamp(x, 60, SF.W - 60);
      this.size = size;
      this.y = -size - 40;
      this.vy = 0;
      this.t = -delay;
      this.phase = 'warn';
      this.props = props;
      this.id = 'cube' + uid++;
      this.alpha = 1;
    }
    dangerZone() {
      return this.phase === 'warn' || this.phase === 'fall' ? { x: this.x, r: this.size * 0.6 + 40 } : null;
    }
    update(m) {
      this.t++;
      if (this.t < 0) return;
      if (this.phase === 'warn') {
        if (this.t > 24) this.phase = 'fall';
      } else if (this.phase === 'fall') {
        this.vy += 1.6;
        this.y += this.vy;
        const o = m.opponentOf(this.owner);
        m.tryHit(this.owner, o, { x: this.x - this.size / 2, y: this.y - 30, w: this.size, h: 30 },
          Object.assign({ id: this.id, kbDir: Math.sign(o.x - this.x) || 1, word: 'PLOP!' }, this.props));
        if (this.y >= G()) {
          this.y = G();
          this.phase = 'land';
          this.t = 0;
          m.fx.shake(this.size > 90 ? 16 : 6);
          m.sfx(this.size > 90 ? 'boom' : 'stomp');
          m.fx.dust(this.x, G(), this.size > 90);
        }
      } else {
        if (this.t > 50) this.alpha -= 0.05;
        if (this.alpha <= 0) this.dead = true;
      }
    }
    drawBack(ctx) {
      if (this.t < 0 || (this.phase !== 'warn' && this.phase !== 'fall')) return;
      const k = this.phase === 'warn' ? this.t / 24 : 1;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.25 + 0.2 * Math.sin(this.t * 0.6)})`;
      ctx.beginPath();
      ctx.ellipse(this.x, G() + 4, (this.size / 2 + 8) * k, 8 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    draw(ctx) {
      if (this.t < 0 || this.phase === 'warn') return;
      const s = this.size;
      const squash = this.phase === 'land' && this.t < 10 ? 1 - Math.sin((this.t / 10) * Math.PI) * 0.2 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      ctx.scale(2 - squash, squash);
      SF.roundRect(ctx, -s / 2, -s, s, s, s * 0.14);
      ctx.fillStyle = '#7a4b25';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(-s / 2 + 6, -s + 6, s * 0.3, s * 0.18);
      D.line(ctx, -s * 0.3, -s * 0.55, s * 0.2, -s * 0.5, 3, '#5a3418');
      // silly face
      D.eye(ctx, -s * 0.15, -s * 0.62, s * 0.07, this.phase === 'land' ? 'happy' : 'normal', 0, false);
      D.eye(ctx, s * 0.15, -s * 0.62, s * 0.07, this.phase === 'land' ? 'happy' : 'normal', 0, false);
      D.mouth(ctx, 0, -s * 0.35, s * 0.25, 'happy');
      if (this.phase === 'land') {
        ctx.strokeStyle = 'rgba(140,200,80,0.7)';
        ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i++) {
          const x = i * s * 0.3;
          const w = Math.sin(this.t * 0.2 + i) * 6;
          ctx.beginPath();
          ctx.moveTo(x, -s - 8);
          ctx.quadraticCurveTo(x + w, -s - 24, x - w, -s - 40);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  class StampedeEmu {
    constructor(owner, dir, delay, last, tint) {
      this.owner = owner;
      this.dir = dir;
      this.x = dir > 0 ? -70 : SF.W + 70;
      this.t = -delay;
      this.last = last;
      this.id = 'emu' + uid++;
      this.tint = tint;
      this.speed = 13 + Math.random() * 2;
    }
    update(m) {
      this.t++;
      if (this.t < 0) return;
      this.x += this.dir * this.speed;
      const o = m.opponentOf(this.owner);
      m.tryHit(this.owner, o, { x: this.x - 30, y: G() - 150, w: 60, h: 150 }, {
        id: this.id, dmg: this.last ? 8 : 3.5, kb: this.last ? 10 : 5, stun: 26, chip: 0.2, kbDir: this.dir,
        knockdown: this.last, launch: this.last ? 10 : 0, big: this.last, light: !this.last, sfx: 'hit',
      });
      if (this.t % 6 === 0) m.fx.dust(this.x - this.dir * 20, G(), false);
      if (this.x < -120 || this.x > SF.W + 120) this.dead = true;
    }
    draw(ctx) {
      if (this.t < 0) return;
      const run = this.t * 0.5;
      const p = {
        t: this.t, bob: -Math.abs(Math.sin(run)) * 8, lean: 0.35, head: 0.3, beak: 0.3,
        armF: 0.8, armB: 0.3, armFExt: 1, armBExt: 1,
        legF: Math.sin(run) * 0.9, legB: -Math.sin(run) * 0.9, legFExt: 1, legBExt: 1,
        sx: 1, sy: 1, tail: 0, face: 'attack', lie: 0, flip: 1,
      };
      ctx.save();
      ctx.translate(this.x, G());
      ctx.scale(this.dir * 0.85, 0.85);
      ctx.translate(0, p.bob);
      drawDash(ctx, p, this.tint);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ultimates
  const spikeUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'spike_ball';
      f.vy = -13;
      m.sfx('boing');
    },
    update(f, o, m, fr) {
      if (fr === 14) {
        f.noGravity = true;
        f.vy = 0;
        m.fx.text('QUILL STORM!', f.x, f.y - 120, '#f1e3c0', 38);
      }
      if (fr >= 16 && fr <= 72 && fr % 8 === 0) {
        const base = Math.atan2(o.y - 70 - (f.y - 42), o.x - f.x);
        [-0.22, 0.22].forEach((s) => quill(f, m, base + s + SF.rand(-0.08, 0.08), 12));
        m.sfx('swing');
      }
      if (fr === 80) {
        for (let i = 0; i < 12; i++) quill(f, m, (i / 12) * Math.PI * 2, 10, { dmg: 4, kb: 6, stun: 20 });
        m.sfx('spin');
        m.fx.spark(f.x, f.y - 42, true, '#f1e3c0');
      }
      if (fr === 84) {
        f.noGravity = false;
        f.ultData.vulnerable = true;
      }
      return fr > 84 && f.onGround();
    },
  };

  const dottyUlt = {
    start(f, o, m) {
      f.ultData = { phase: 'dive', t: 0, puddle: Object.assign(new Puddle(f.x), { owner: f }) };
      f.ultPose = 'dotty_dive';
      m.addEntity(f.ultData.puddle);
      m.sfx('splash');
    },
    update(f, o, m) {
      const d = f.ultData;
      d.t++;
      if (d.phase === 'dive') {
        f.sink = Math.min(1, d.t / 14);
        if (d.t >= 16) {
          d.phase = 'track';
          d.t = 0;
          d.tx = f.x;
        }
      } else if (d.phase === 'track') {
        d.tx = SF.clamp(d.tx + SF.clamp(o.x - d.tx, -6, 6), SF.WALL_L + 20, SF.WALL_R - 20);
        f.x = d.tx;
        d.puddle.x = d.tx;
        if (d.t >= 42) {
          d.phase = 'erupt';
          d.t = 0;
          d.puddle.geyser = 1;
          m.sfx('splash');
          m.sfx('boom');
          m.fx.shake(14);
          m.fx.text('BILLABONG BLAST!', d.tx, G() - 260, '#5fc8ff', 40);
          const r = m.tryHit(f, o, { x: d.tx - 60, y: 0, w: 120, h: G() }, {
            id: 'geyser', dmg: 12, kb: 1, stun: 40, launch: 22, knockdown: true, unblockable: true, big: true,
            kbDir: f.facing, word: 'SPLOOSH!',
          });
          d.hit = r === 'hit';
          f.sink = 0;
          f.y = G();
          f.vy = -19;
          f.facing = o.x >= f.x ? 1 : -1;
          f.ultPose = 'dotty_rise';
        }
      } else if (d.phase === 'erupt') {
        if (d.hit) {
          m.tryHit(f, o, { x: f.x - 55, y: f.y - 130, w: 110, h: 140 }, {
            id: 'billslam', dmg: 14, kb: 9, stun: 30, knockdown: true, launch: 6, unblockable: true, big: true,
            kbDir: f.facing, word: 'SLAP!',
          });
        }
        if (d.t > 10 && f.onGround()) {
          d.phase = 'land';
          d.t = 0;
          d.vulnerable = true;
          f.ultPose = null;
        }
      } else if (d.phase === 'land') {
        return d.t >= 18;
      }
      return false;
    },
  };

  const womboUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'wombo_squat';
      f.vx = 0;
    },
    update(f, o, m, fr) {
      if (fr === 8) {
        m.fx.text('HNNNGG...', f.x, f.y - 170, '#c9a27c', 30);
        m.sfx('charge');
      }
      const drops = [
        [18, -130, 60, false], [26, 130, 60, false], [34, -65, 70, false], [42, 65, 70, false], [52, 0, 110, true],
      ];
      drops.forEach(([at, dx, size, big]) => {
        if (fr === at) {
          const props = big
            ? { dmg: 13, kb: 8, stun: 30, knockdown: true, launch: 10, big: true, chip: 0.25 }
            : { dmg: 5, kb: 2, stun: 30, chip: 0.25 };
          m.addEntity(new CubeDrop(f, o.x + dx, size, props, 0));
          if (at === 52) m.fx.text('CUBE CRUSHER!', o.x, G() - 250, '#c9a27c', 42);
        }
      });
      if (fr >= 56) f.ultData.vulnerable = true;
      return fr >= 64;
    },
  };

  const dashUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'dash_whistle';
      f.vx = 0;
      m.sfx('whistle');
      m.fx.text('EMU STAMPEDE!', f.x, f.y - 210, '#e8892b', 40);
      const dir = o.x >= f.x ? 1 : -1;
      const tints = [
        { feather: '#6b5a48', featherDark: '#4a3e30', neck: '#7f9fc0', beak: '#3b3b3b', leg: '#7d7466', legDark: '#5f574b', shoe: '#2f6fe0' },
        { feather: '#5a4c3c', featherDark: '#3d3328', neck: '#6f8fb0', beak: '#3b3b3b', leg: '#7d7466', legDark: '#5f574b', shoe: '#2fb85a' },
        { feather: '#75624d', featherDark: '#524434', neck: '#8aa6c4', beak: '#3b3b3b', leg: '#7d7466', legDark: '#5f574b', shoe: '#e0a82f' },
      ];
      for (let i = 0; i < 8; i++) m.addEntity(new StampedeEmu(f, dir, 12 + i * 7, i === 7, tints[i % 3]));
    },
    update(f, o, m, fr) {
      if (fr === 20) f.ultPose = 'dash_cheer';
      if (fr >= 40) f.ultData.vulnerable = true;
      return fr >= 50;
    },
  };

  // ---------------------------------------------------------------- roster
  Object.assign(SF.FIGHTERS, {
    spike: {
      id: 'spike', name: 'SPIKE', full: 'Spike the Echidna', emoji: '🦔', style: 'Prickly Defender',
      height: 118, width: 66, portraitDx: 4, health: 100, speed: 3.7, jump: 14.5, power: 0.94, defense: 0.97, gravity: 1,
      walk: 'waddle', stats: { power: 3, speed: 3, health: 4, jump: 3 }, prickly: true,
      passive: 'Prickly: anyone who hits him while he blocks gets pricked!',
      special: { name: 'Spiky Ball Roll', desc: 'Curls into a spiky ball and rolls straight at the foe.' },
      ultimate: { name: 'Quill Storm', desc: 'Hovers in a spinning ball and fires a storm of quills, then a quill burst!' },
      intro: "Careful, mate... I'm a bit prickly today!",
      win: "Told ya! Don't poke the echidna!",
      stage: 'rainforest',
      pal: { fur: '#5a3b24', furDark: '#43291a', belly: '#8a6040', face: '#8c6642', snout: '#3a2a1c', quill: '#f1e3c0', tip: '#3a2a1c', claw: '#e8e0d0' },
      alt: { fur: '#3b3b44', furDark: '#2a2a31', belly: '#5d5d6a', face: '#6f6f7c', snout: '#222', quill: '#ffd76a', tip: '#8a4a10', claw: '#e8e0d0' },
      draw: drawSpike,
      drawBall: drawSpikeBall,
      moves: withMoves(1, {
        frames: 44, pose: 'ball',
        update(f, o, m, fr) {
          if (fr === 5) m.sfx('spin');
          if (fr >= 6 && fr <= 34) f.vx = 10 * f.facing;
          else f.vx *= 0.7;
        },
        hits: [{ from: 6, to: 34, box: { x: -30, y: -84, w: 84, h: 84 }, dmg: 9, kb: 7, stun: 22, knockdown: true, launch: 6 }],
      }),
      ult: spikeUlt,
    },
    dotty: {
      id: 'dotty', name: 'DOTTY', full: 'Dotty the Platypus', emoji: '🦆', style: 'Tricky Swimmer',
      height: 128, width: 58, portraitDx: 6, health: 108, speed: 4.3, jump: 15, power: 1.12, defense: 1, gravity: 1,
      walk: 'waddle', stats: { power: 3, speed: 4, health: 3, jump: 3 }, crawler: true, projectile: true,
      passive: 'Duck Dive: can crawl along while crouching',
      special: { name: 'Bill Slap Splash', desc: 'Slaps the water and sends a wave along the ground that trips foes.' },
      ultimate: { name: 'Billabong Blast', desc: 'Dives underground, pops up as a giant geyser, then bill-slaps in mid-air! Keep moving to dodge.' },
      intro: 'Quack? No, mate, I\'m a PLATYPUS!',
      win: 'Too easy! Time for a swim in the billabong!',
      stage: 'billabong',
      pal: { fur: '#7b4f2c', furDark: '#5f3b1f', belly: '#b08257', tail: '#6a4222', bill: '#4f5d68', billDark: '#3a454e', foot: '#4f5d68', goggle: '#ff5a8a' },
      alt: { fur: '#5b6b3c', furDark: '#44522c', belly: '#98a870', tail: '#4a5a2c', bill: '#e2a13a', billDark: '#b87a1e', foot: '#e2a13a', goggle: '#4ab3ff' },
      draw: drawDotty,
      moves: withMoves(1, {
        frames: 30, pose: 'slap',
        update(f, o, m, fr) {
          if (fr === 10) splashWave(f, m);
        },
        hits: [],
      }),
      ult: dottyUlt,
    },
    wombo: {
      id: 'wombo', name: 'WOMBO', full: 'Wombo the Wombat', emoji: '🟫', style: 'Heavy Bruiser',
      height: 132, width: 80, portraitDx: 0, health: 120, speed: 2.9, jump: 12.5, power: 1.1, defense: 0.92, gravity: 1.1,
      walk: 'waddle', stats: { power: 5, speed: 1, health: 5, jump: 1 },
      passive: 'Tough Rump: his Bum Bump keeps going through small hits',
      special: { name: 'Bum Bump', desc: 'Turns around and charges bum-first. Nothing stops that rump!' },
      ultimate: { name: 'Cube Crusher', desc: 'Giant square wombat poos rain from the sky! Get out from under them!' },
      intro: "Oi! Nobody gets past this rump!",
      win: "Squared away! Just like my poos.",
      stage: 'dunny',
      pal: { fur: '#8a7560', furDark: '#6b5846', belly: '#b39e86', rump: '#a08a72', nose: '#2e2420', band: '#e53935' },
      alt: { fur: '#6d6f78', furDark: '#53555d', belly: '#9a9ca6', rump: '#82848e', nose: '#1d1d22', band: '#ffd24a' },
      draw: drawWombo,
      moves: (() => {
        const mv = withMoves(1.05, {
          frames: 42, pose: 'bumbump', armor: true,
          update(f, o, m, fr) {
            if (fr === 5) m.sfx('swing');
            if (fr >= 6 && fr <= 26) f.vx = 8 * f.facing;
            else f.vx *= 0.7;
          },
          hits: [{ from: 8, to: 26, box: { x: -10, y: -95, w: 95, h: 90 }, dmg: 10, kb: 12, stun: 22 }],
        });
        return mv;
      })(),
      ult: womboUlt,
    },
    dash: {
      id: 'dash', name: 'DASH', full: 'Dash the Emu', emoji: '🪶', style: 'Speedster',
      height: 178, width: 50, portraitDx: 0, health: 100, speed: 5.6, jump: 15.5, power: 1, defense: 1, gravity: 1,
      walk: 'strut', stats: { power: 2, speed: 5, health: 2, jump: 3 },
      passive: 'Zoomies + Long Legs: the fastest runner with extra-long kicks',
      special: { name: 'Zoomie Dash', desc: 'Sprints straight through the opponent and out the other side!' },
      ultimate: { name: 'Emu Stampede', desc: 'Whistles up a whole mob of emus that charge across the screen!' },
      intro: 'Zoom zoom! Catch me if you can!',
      win: 'Zoomed right past ya! Better luck next time!',
      stage: 'uluru',
      pal: { feather: '#5e5040', featherDark: '#40362b', neck: '#6f8fb0', beak: '#333', leg: '#8a8070', legDark: '#6b6255', shoe: '#e53935' },
      alt: { feather: '#8a7a66', featherDark: '#665a4a', neck: '#b07fa6', beak: '#333', leg: '#8a8070', legDark: '#6b6255', shoe: '#8e44ad' },
      draw: drawDash,
      moves: (() => {
        const mv = withMoves(1.2, {
          frames: 34, pose: 'zoom', passThrough: true,
          update(f, o, m, fr) {
            if (fr === 3) m.sfx('dive');
            if (fr >= 4 && fr <= 22) {
              f.vx = 14 * f.facing;
              if (fr % 3 === 0) m.fx.dust(f.x - f.facing * 20, G(), false);
            } else f.vx *= 0.7;
          },
          hits: [{ from: 4, to: 22, box: { x: -20, y: -150, w: 80, h: 150 }, dmg: 8, kb: 5, stun: 20 }],
        });
        mv.kick.hits[0].box.w *= 1.15;
        mv.kick.hits[0].box.y = -95;
        mv.airKick.hits[0].box.y = -80;
        return mv;
      })(),
      ult: dashUlt,
    },
  });

  SF.ROSTER.push('spike', 'dotty', 'wombo', 'dash');
})();
