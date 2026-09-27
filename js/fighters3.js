// Roster pack 3: Taz, Shelly, Lizzie and Cheeky.
(() => {
  const D = SF.D;
  const G = () => SF.GROUND;
  const { leanAround, clipEll, withMoves } = SF.FH;
  let uid = 0;

  function stroke(ctx, w = D.LW) {
    ctx.lineWidth = w;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
  }

  // ---------------------------------------------------------------- TAZ
  function tazMouth(ctx, face) {
    const open = face === 'attack' || face === 'laugh' || face === 'happy' || face === 'hurt';
    ctx.beginPath();
    ctx.moveTo(6, 10);
    ctx.quadraticCurveTo(20, open ? 30 : 18, 34, 10);
    ctx.closePath();
    ctx.fillStyle = open ? '#7a1f1f' : '#f4f1ea';
    ctx.fill();
    stroke(ctx, 2.5);
    for (let i = 0; i < 4; i++) D.poly(ctx, [9 + i * 6, 10.5, 12 + i * 6, 16, 15 + i * 6, 10.5], '#fff', false);
    if (open) D.ell(ctx, 20, 20, 6, 3, '#e86a6a', 0, false);
  }

  function drawTaz(ctx, p, c) {
    const t = p.t;
    let e = D.limb(ctx, -10, -28, p.legB, 22 * p.legBExt, 16, c.furDark);
    D.ell(ctx, e.x + 6, e.y + 1, 12, 7, c.furDark, -p.legB);
    D.ell(ctx, -30, -34, 18, 9, c.furDark, 0.6 + p.tail);
    ctx.save();
    leanAround(ctx, p, -30);
    let h = D.limb(ctx, -4, -66, p.armB, 22 * p.armBExt, 12, c.furDark);
    D.ell(ctx, h.x, h.y, 7, 7, c.furDark);
    clipEll(ctx, 0, -54, 34, 36, 0, () => {
      D.ell(ctx, 10, -68, 34, 8, c.chest, 0.25, false);
    }, c.fur);
    ctx.save();
    ctx.translate(16, -92);
    ctx.rotate(p.head);
    D.ell(ctx, -18, -20, 10, 12, c.fur);
    D.ell(ctx, -18, -20, 5, 7, c.ear, 0, false);
    D.ell(ctx, 12, -24, 10, 12, c.fur);
    D.ell(ctx, 12, -24, 5, 7, c.ear, 0, false);
    D.ell(ctx, 0, 0, 26, 22, c.fur);
    D.ell(ctx, 20, 6, 15, 11, c.snout);
    D.ell(ctx, 33, 1, 5, 4, c.ear);
    D.eye(ctx, 4, -6, 5.5, p.face === 'normal' ? 'attack' : p.face, t);
    tazMouth(ctx, p.face);
    ctx.restore();
    h = D.limb(ctx, 14, -66, p.armF, 24 * p.armFExt, 12, c.fur);
    D.ell(ctx, h.x, h.y, 8, 7, c.fur);
    for (let i = -1; i <= 1; i++) D.line(ctx, h.x + 4, h.y + 4, h.x + 9, h.y + 7 + i * 4, 2, '#f4f1ea');
    ctx.restore();
    e = D.limb(ctx, 10, -28, p.legF, 22 * p.legFExt, 16, c.fur);
    D.ell(ctx, e.x + 6, e.y + 1, 12, 7, c.fur, -p.legF);
  }

  function drawTazSpin(ctx, p, c) {
    const t = p.t;
    for (let i = 0; i < 9; i++) {
      const y = -8 - i * 17;
      const w = 22 + i * 8;
      const off = Math.sin(t * 0.9 + i) * 8;
      D.ell(ctx, off, y, w, 9, i % 2 ? c.fur : c.dust, 0, true);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = -20 - i * 28;
      const x = Math.sin(t * 1.3 + i * 2) * (30 + i * 10);
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y - 4);
      ctx.stroke();
    }
    const fx = Math.sin(t * 0.7) * 16;
    ctx.save();
    ctx.translate(fx, -80);
    D.eye(ctx, -6, 0, 5, 'attack', t);
    D.eye(ctx, 10, 0, 5, 'attack', t, false);
    ctx.translate(-18, 4);
    tazMouth(ctx, 'attack');
    ctx.restore();
  }

  // ---------------------------------------------------------------- SHELLY
  function flipper(ctx, x, y, ang, len, col) {
    const cx = x + Math.sin(ang) * len * 0.6;
    const cy = y + Math.cos(ang) * len * 0.6;
    D.ell(ctx, cx, cy, 10, len * 0.62, col, -ang);
  }

  function drawShelly(ctx, p, c) {
    const t = p.t;
    let e = D.limb(ctx, -12, -30, p.legB, 22 * p.legBExt, 15, c.skinDark);
    D.ell(ctx, e.x + 7, e.y + 1, 14, 6, c.skinDark, -p.legB);
    ctx.save();
    leanAround(ctx, p, -35);
    flipper(ctx, -4, -92, p.armB, 34 * p.armBExt, c.skinDark);
    // shell on the back
    clipEll(ctx, -16, -70, 34, 48, 0, () => {
      ctx.strokeStyle = c.shellDark;
      ctx.lineWidth = 3;
      [[-20, -92], [-8, -70], [-24, -60], [-10, -46], [-26, -80], [-4, -96]].forEach(([hx, hy]) => {
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          ctx.lineTo(hx + Math.cos(a) * 10, hy + Math.sin(a) * 10);
        }
        ctx.closePath();
        ctx.stroke();
      });
    }, c.shell);
    clipEll(ctx, 8, -66, 24, 40, 0, () => {
      ctx.strokeStyle = 'rgba(120,100,40,0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-20, -96 + i * 14);
        ctx.lineTo(40, -96 + i * 14);
        ctx.stroke();
      }
    }, c.belly);
    ctx.save();
    ctx.translate(22, -114);
    ctx.rotate(p.head);
    D.ell(ctx, 0, 0, 21, 18, c.skin);
    D.ell(ctx, -8, 6, 3, 2, c.skinDark, 0, false);
    D.ell(ctx, -2, -10, 3, 2, c.skinDark, 0, false);
    ctx.save();
    ctx.translate(15, 5);
    ctx.rotate(p.beak * 0.5);
    D.poly(ctx, [0, 0, 10, 1, 0, 6], c.beak);
    ctx.restore();
    D.poly(ctx, [14, -4, 26, 2, 15, 6], c.beak);
    D.eye(ctx, 7, -4, 5.5, p.face, t);
    // hibiscus flower
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5;
      D.ell(ctx, -8 + Math.cos(a) * 6, -16 + Math.sin(a) * 6, 5, 4, c.flower, a, false);
    }
    D.ell(ctx, -8, -16, 3, 3, '#ffd400', 0, false);
    ctx.restore();
    flipper(ctx, 16, -94, p.armF, 36 * p.armFExt, c.skin);
    ctx.restore();
    e = D.limb(ctx, 10, -30, p.legF, 22 * p.legFExt, 15, c.skin);
    D.ell(ctx, e.x + 7, e.y + 1, 14, 6, c.skin, -p.legF);
  }

  // ---------------------------------------------------------------- LIZZIE
  function lizLeg(ctx, x, ang, ext, col) {
    const k = D.limb(ctx, x, -60, ang * 0.8 + 0.1, 30 * ext, 9, col);
    const f = D.limb(ctx, k.x, k.y, ang * 1.2 - 0.3, 30 * ext, 7, col);
    for (let i = -1; i <= 1; i++) D.line(ctx, f.x, f.y, f.x + 10, f.y + i * 3 + 1, 2.5, col);
  }

  function drawLizzie(ctx, p, c) {
    const t = p.t;
    const frill = Math.max(p.frill || 0, p.face === 'attack' || p.face === 'laugh' ? 0.55 : 0);
    // tail
    ctx.beginPath();
    ctx.moveTo(-4, -66);
    ctx.quadraticCurveTo(-50, -40 + p.tail * 20, -86, -6);
    ctx.quadraticCurveTo(-100, 0, -92, -12);
    ctx.quadraticCurveTo(-54, -38, -2, -50);
    ctx.closePath();
    ctx.fillStyle = c.skinDark;
    ctx.fill();
    stroke(ctx);
    lizLeg(ctx, -6, p.legB, p.legBExt, c.skinDark);
    ctx.save();
    leanAround(ctx, p, -60);
    D.limb(ctx, -2, -98, p.armB, 26 * p.armBExt, 7, c.skinDark);
    D.ell(ctx, 0, -86, 20, 34, c.skin);
    D.ell(ctx, 7, -82, 11, 26, c.belly, 0, false);
    for (let i = 0; i < 4; i++) D.line(ctx, -14, -104 + i * 12, -6, -100 + i * 12, 2, c.skinDark);
    ctx.save();
    ctx.translate(12, -126);
    ctx.rotate(p.head);
    // frill collar
    const R = 18 + frill * 34;
    ctx.save();
    ctx.translate(-4, 6);
    ctx.beginPath();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * 0.35 + (i / n) * Math.PI * 1.3;
      const rr = i % 2 ? R : R * 0.86;
      ctx.lineTo(Math.cos(a) * rr - 4, Math.sin(a) * rr);
    }
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = c.frill;
    ctx.fill();
    stroke(ctx);
    if (frill > 0.2) {
      ctx.beginPath();
      ctx.arc(-4, 0, R * 0.55, Math.PI * 0.4, Math.PI * 1.6);
      ctx.lineTo(-4, 0);
      ctx.fillStyle = c.frillIn;
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,40,10,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 0.45 + (i / 5) * Math.PI * 1.1;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(Math.cos(a) * R * 0.95 - 4, Math.sin(a) * R * 0.95);
        ctx.stroke();
      }
    }
    ctx.restore();
    // head + jaw
    const open = p.face === 'attack' || p.face === 'laugh' || p.face === 'happy';
    ctx.save();
    ctx.translate(4, 6);
    ctx.rotate(open ? 0.45 : 0.05);
    D.poly(ctx, [0, 0, 26, 1, 20, 6, 0, 7], c.skin);
    if (open) D.poly(ctx, [2, 1, 22, 1.5, 2, 5], c.mouth, false);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-6, -14, 10, -12);
    ctx.quadraticCurveTo(28, -8, 32, 2);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fillStyle = c.skin;
    ctx.fill();
    stroke(ctx);
    D.eye(ctx, 8, -5, 4.5, p.face, t);
    ctx.restore();
    D.limb(ctx, 10, -100, p.armF, 26 * p.armFExt, 7, c.skin);
    ctx.restore();
    lizLeg(ctx, 6, p.legF, p.legFExt, c.skin);
  }

  // ---------------------------------------------------------------- CHEEKY
  function cheekyWing(ctx, x, y, ang, ext, col, under) {
    const len = 30 * ext;
    const cx = x + Math.sin(ang) * len * 0.8;
    const cy = y + Math.cos(ang) * len * 0.8;
    D.ell(ctx, cx, cy, 12, len, col, -ang);
    if (under) D.ell(ctx, cx - Math.cos(ang) * 4, cy + Math.sin(ang) * 4, 5, len * 0.7, under, -ang, false);
  }

  function drawCheeky(ctx, p, c) {
    const t = p.t;
    const crest = Math.max(p.crest || 0, p.face === 'attack' || p.face === 'laugh' || p.face === 'happy' ? 1 : 0.15);
    ctx.save();
    leanAround(ctx, p, -45);
    cheekyWing(ctx, -4, -98, p.armB, p.armBExt, c.shade);
    ctx.restore();
    const legs = (x, ang) => {
      const e = D.limb(ctx, x, -40, ang, 34, 5, c.feet);
      D.line(ctx, e.x, e.y, e.x + 9, e.y + 1, 4, c.feet);
      D.line(ctx, e.x, e.y, e.x - 6, e.y + 1, 4, c.feet);
    };
    legs(-5, p.legB);
    ctx.save();
    leanAround(ctx, p, -45);
    ctx.save();
    ctx.translate(-20, -58);
    ctx.rotate(-0.8 + p.tail);
    D.ell(ctx, -26, 0, 28, 9, c.white);
    D.ell(ctx, -24, 3, 20, 4, c.crest, 0, false);
    ctx.restore();
    D.ell(ctx, 0, -76, 27, 38, c.white);
    D.ell(ctx, -6, -72, 16, 28, c.shade, 0, false);
    ctx.save();
    ctx.translate(8, -120);
    ctx.rotate(p.head);
    // crest feathers
    for (let i = 0; i < 5; i++) {
      const a = -2.7 + crest * 1.1 + i * (0.12 + crest * 0.14);
      const len = 16 + crest * 12 + (i === 2 ? 6 : 0);
      D.ell(ctx, -4 + Math.cos(a) * len * 0.8, -12 + Math.sin(a) * len * 0.8, 5, len * 0.8, c.crest, a + Math.PI / 2);
    }
    D.ell(ctx, 0, 0, 22, 20, c.white);
    D.ell(ctx, 8, -3, 7.5, 7.5, c.eyeRing, 0, false);
    D.eye(ctx, 8, -3, 4.5, p.face, t);
    ctx.save();
    ctx.translate(16, 6);
    ctx.rotate(p.beak);
    D.poly(ctx, [0, 0, 10, 2, 0, 7], c.beak);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(15, -6);
    ctx.quadraticCurveTo(34, -4, 30, 12);
    ctx.quadraticCurveTo(26, 6, 16, 6);
    ctx.closePath();
    ctx.fillStyle = c.beak;
    ctx.fill();
    stroke(ctx);
    ctx.restore();
    ctx.restore();
    legs(5, p.legF);
    ctx.save();
    leanAround(ctx, p, -45);
    cheekyWing(ctx, 8, -100, p.armF, p.armFExt, c.white, c.crest);
    ctx.restore();
  }

  // ---------------------------------------------------------------- projectiles & entities
  function bubble(f, m) {
    if (m.projectiles.some((pr) => pr.owner === f)) return;
    const y0 = f.y - 100;
    m.addProjectile({
      owner: f, x: f.x + f.facing * 50, y: y0, vx: 4.5 * f.facing, vy: 0, w: 56, h: 56, life: 170,
      props: { dmg: 5, kb: 2, stun: 30, word: 'POP!' },
      update() {
        this.y = y0 + Math.sin(this.t * 0.08) * 22;
      },
      draw(ctx, t) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const wob = 1 + Math.sin(t * 0.3) * 0.05;
        ctx.scale(wob, 2 - wob);
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(160,220,255,0.35)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.stroke();
        D.ell(ctx, -9, -10, 7, 4, 'rgba(255,255,255,0.9)', -0.6, false);
        D.ell(ctx, 10, 12, 3, 2, 'rgba(255,190,240,0.8)', 0, false);
        ctx.restore();
      },
    });
    m.sfx('leaf');
  }

  function screech(f, m) {
    if (m.projectiles.filter((pr) => pr.owner === f).length >= 2) return;
    m.addProjectile({
      owner: f, x: f.x + f.facing * 50, y: f.y - 118, vx: 10.5 * f.facing, vy: 0, w: 40, h: 60, life: 62,
      props: { dmg: 6, kb: 4, stun: 18, word: 'SCREECH!' },
      draw(ctx, t) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(Math.sign(this.vx), 1);
        ctx.globalAlpha = Math.min(1, this.life / 10);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(-18 + i * 10, 0, 14 + i * 7, -0.9, 0.9);
          ctx.lineWidth = 5 - i;
          ctx.strokeStyle = i === 1 ? '#ffd400' : '#fff';
          ctx.stroke();
        }
        ctx.restore();
      },
    });
    m.sfx('dive');
  }

  class Wave {
    constructor(owner, dir) {
      this.owner = owner;
      this.dir = dir;
      this.x = dir > 0 ? -170 : SF.W + 170;
      this.t = 0;
    }
    update(m) {
      this.t++;
      this.x += this.dir * 12;
      const o = m.opponentOf(this.owner);
      m.tryHit(this.owner, o, { x: this.x - 90, y: G() - 230, w: 180, h: 230 }, {
        id: 'wave', dmg: 22, kb: 13, stun: 34, launch: 12, knockdown: true, big: true, chip: 0.3,
        kbDir: this.dir, word: 'SPLASH!', sfx: 'splash',
      });
      if (this.t % 4 === 0) m.fx.add({ type: 'dot', x: this.x + this.dir * 60, y: G() - SF.rand(0, 200), vx: this.dir * 3, vy: -2, life: 20, size: 5, color: '#e0f7ff' });
      if (this.x < -260 || this.x > SF.W + 260) this.dead = true;
    }
    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, G());
      ctx.scale(this.dir, 1);
      ctx.beginPath();
      ctx.moveTo(-190, 4);
      ctx.quadraticCurveTo(-120, -60, -30, -170);
      ctx.quadraticCurveTo(40, -250, 100, -200);
      ctx.quadraticCurveTo(70, -210, 50, -170);
      ctx.quadraticCurveTo(80, -90, 110, 4);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -240, 0, 0);
      g.addColorStop(0, '#5fd3f0');
      g.addColorStop(1, '#1a78c2');
      ctx.fillStyle = g;
      ctx.fill();
      stroke(ctx);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 7; i++) {
        const a = i / 6;
        ctx.beginPath();
        ctx.arc(-20 + a * 110, -190 - Math.sin(a * Math.PI) * 45 + Math.sin(this.t * 0.4 + i) * 3, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // fish surfing along
      [[-80, -80, '#ffb03a'], [-20, -120, '#ff6b8a'], [30, -60, '#ffd400']].forEach(([fx, fy, col]) => {
        D.ell(ctx, fx, fy, 12, 7, col);
        D.poly(ctx, [fx - 11, fy, fx - 20, fy - 7, fx - 20, fy + 7], col);
        D.ell(ctx, fx + 6, fy - 2, 1.8, 1.8, D.OUT, 0, false);
      });
      ctx.restore();
    }
  }

  class FlockBird {
    constructor(owner, delay, big) {
      this.owner = owner;
      this.t = -delay;
      this.big = big;
      this.id = 'flock' + uid++;
    }
    update(m) {
      this.t++;
      if (this.t < 0) return;
      const o = m.opponentOf(this.owner);
      if (this.t === 0) {
        const dir = Math.sign(o.x - this.owner.x) || this.owner.facing;
        const tx = o.x + SF.rand(-40, 40);
        this.x = tx - dir * 380;
        this.y = -70;
        const dx = tx - this.x;
        const dy = G() - 70 - this.y;
        const d = Math.hypot(dx, dy);
        const sp = this.big ? 15 : 17;
        this.vx = (dx / d) * sp;
        this.vy = (dy / d) * sp;
        this.dir = dir;
        m.sfx('dive');
      }
      this.x += this.vx;
      this.y += this.vy;
      const s = this.big ? 60 : 36;
      m.tryHit(this.owner, o, { x: this.x - s, y: this.y - s, w: s * 2, h: s * 2 }, {
        id: this.id, dmg: this.big ? 9 : 3, kb: this.big ? 10 : 3, stun: 22, chip: 0.2, kbDir: this.dir,
        knockdown: this.big, launch: this.big ? 11 : 0, big: this.big, light: !this.big, sfx: 'hit',
      });
      if (this.y > G() + 60) this.dead = true;
    }
    draw(ctx) {
      if (this.t < 0) return;
      const p = {
        t: this.t, bob: 0, lean: 1.3, head: 0.2, beak: 0.3, armF: -1.8 + Math.sin(this.t) * 0.4, armB: -2.0,
        armFExt: 1.1, armBExt: 1.1, legF: -1.2, legB: -1.3, legFExt: 1, legBExt: 1, sx: 1, sy: 1, tail: 0,
        face: 'attack', lie: 0, flip: 1, crest: 1,
      };
      ctx.save();
      ctx.translate(this.x, this.y + 70);
      const sc = this.big ? 1 : 0.55;
      ctx.scale(this.dir * sc, sc);
      ctx.rotate(Math.atan2(this.vy, Math.abs(this.vx)) - 1.1);
      drawCheeky(ctx, p, SF.FIGHTERS.cheeky.pal);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ultimates
  const tazUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'taz_spin';
      m.sfx('spin');
      m.fx.text('DEVIL WHIRLWIND!', f.x, f.y - 200, '#c9a27c', 40);
    },
    update(f, o, m, fr) {
      if (fr < 80) {
        const dir = Math.sign(o.x - f.x) || f.facing;
        f.vx = SF.clamp(f.vx + dir * 0.9, -7.5, 7.5);
        if (fr % 12 === 0) m.sfx('spin');
        if (fr % 4 === 0) m.fx.dust(f.x, G(), false);
        if (fr % 6 === 0) {
          m.tryHit(f, o, { x: f.x - 65, y: f.y - 165, w: 130, h: 165 }, {
            id: 'tw' + fr, dmg: 2, kb: 3, stun: 22, chip: 0.3, light: true, kbDir: dir,
          });
        }
      } else if (fr === 80) {
        f.vx = 0;
        m.tryHit(f, o, { x: f.x - 75, y: f.y - 170, w: 150, h: 170 }, {
          id: 'twfinal', dmg: 9, kb: 10, stun: 30, knockdown: true, launch: 12, big: true, chip: 0.3,
        });
        f.ultPose = 'taz_dizzy';
        f.ultData.vulnerable = true;
      }
      return fr >= 104;
    },
  };

  const shellyUlt = {
    start(f, o, m) {
      f.ultData = { riding: false };
      f.ultPose = 'shelly_call';
      m.fx.text("SURF'S UP!", f.x, f.y - 190, '#5fd3f0', 40);
      m.sfx('splash');
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (fr === 18) {
        d.dir = Math.sign(o.x - f.x) || f.facing;
        d.wave = new Wave(f, d.dir);
        m.addEntity(d.wave);
        m.sfx('boom');
      }
      if (d.wave && !d.riding && d.dir * (d.wave.x - f.x) >= 0) {
        d.riding = true;
        f.noClamp = true;
        f.noGravity = true;
        f.ultPose = 'shelly_surf';
        f.facing = d.dir;
      }
      if (d.riding) {
        f.x = d.wave.x + d.dir * 10;
        f.y = G() - 170;
        f.vy = 0;
        const done = d.dir > 0 ? f.x >= SF.WALL_R - 30 : f.x <= SF.WALL_L + 30;
        if (done) {
          f.noClamp = false;
          f.noGravity = false;
          f.x = SF.clamp(f.x, SF.WALL_L, SF.WALL_R);
          f.vy = -6;
          return true;
        }
      }
      return fr > 220;
    },
  };

  const lizzieUlt = {
    start(f, o, m) {
      f.ultData = { pass: 0, dir: Math.sign(o.x - f.x) || f.facing, phase: 'run', passThrough: true, t: 0 };
      f.ultPose = 'lizzie_run';
      f.trail = [];
      m.sfx('dive');
      m.fx.text('DESERT DASH DAZZLE!', f.x, f.y - 200, '#ffc93c', 36);
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (d.phase === 'run') {
        f.vx = d.dir * 17;
        f.facing = d.dir;
        if (fr % 2 === 0) {
          f.trail.push({ x: f.x, y: f.y, facing: f.facing });
          if (f.trail.length > 5) f.trail.shift();
        }
        if (fr % 3 === 0) m.fx.dust(f.x - d.dir * 20, G(), false);
        m.tryHit(f, o, { x: f.x - 40, y: f.y - 140, w: 80, h: 140 }, {
          id: 'dz' + d.pass, dmg: 5, kb: 2, stun: 30, chip: 0.25, light: true, kbDir: d.dir,
        });
        const target = SF.clamp(o.x + d.dir * 200, SF.WALL_L + 10, SF.WALL_R - 10);
        if ((d.dir > 0 ? f.x >= target : f.x <= target) || fr > 160) {
          d.pass++;
          d.dir *= -1;
          if (d.pass >= 5 || fr > 160) {
            d.phase = 'flare';
            d.t = 0;
            f.vx = 0;
            f.facing = Math.sign(o.x - f.x) || f.facing;
            f.ultPose = 'lizzie_flare';
            m.sfx('ready');
          }
        }
      } else {
        d.t++;
        if (d.t % 2 === 0 && f.trail.length) f.trail.shift();
        if (d.t === 8) {
          m.tryHit(f, o, m.boxFront(f, { x: -10, y: -170, w: 150, h: 170 }), {
            id: 'flare', dmg: 10, kb: 10, stun: 30, knockdown: true, launch: 10, big: true, chip: 0.25, word: 'DAZZLED!',
          });
          m.fx.spark(f.x + f.facing * 40, f.y - 130, true, '#ffc93c');
        }
        if (d.t >= 12) d.vulnerable = true;
        if (d.t >= 30) {
          f.trail = null;
          return true;
        }
      }
      return false;
    },
  };

  const cheekyUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'cheeky_call';
      m.sfx('laugh');
      m.fx.text('SULPHUR CREST STORM!', f.x, f.y - 200, '#ffd400', 36);
      for (let i = 0; i < 9; i++) m.addEntity(new FlockBird(f, 10 + i * 6, false));
      m.addEntity(new FlockBird(f, 10 + 9 * 6 + 8, true));
    },
    update(f, o, m, fr) {
      if (fr % 10 === 0 && fr < 60) m.fx.text('SQUAWK!', f.x + SF.rand(-40, 40), f.y - 170 - SF.rand(0, 30), '#fff', 24);
      if (fr >= 55) f.ultData.vulnerable = true;
      return fr >= 72;
    },
  };

  // ---------------------------------------------------------------- roster
  Object.assign(SF.FIGHTERS, {
    taz: {
      id: 'taz', name: 'TAZ', full: 'Taz the Tassie Devil', emoji: '🌪️', style: 'Wild Spinner',
      height: 122, width: 62, portraitDx: 6, health: 105, speed: 4.2, jump: 14.5, power: 1.08, defense: 1, gravity: 1,
      walk: 'waddle', stats: { power: 4, speed: 4, health: 3, jump: 3 }, rage: true,
      passive: 'Rage: hits harder when his health gets low',
      special: { name: 'Growl Scare', desc: 'A mighty RAAARGH that blasts the foe backwards.' },
      ultimate: { name: 'Devil Whirlwind', desc: 'Spins into a tornado that chases the foe, then flings them away! (He gets a bit dizzy after.)' },
      intro: 'RAAARGH! ...Sorry, I get excited!',
      win: 'Wooo! Spun ya right round, mate!',
      stage: 'tassie',
      pal: { fur: '#2b2626', furDark: '#1b1717', chest: '#f4f1ea', ear: '#f08a9a', snout: '#3a3030', dust: '#8a7a6a' },
      alt: { fur: '#5a3a2a', furDark: '#3d271c', chest: '#ffe9a8', ear: '#f08a9a', snout: '#6a4a3a', dust: '#b39a7a' },
      draw: drawTaz,
      drawSpecial: drawTazSpin,
      moves: withMoves(1, {
        frames: 36, pose: 'growl',
        update(f, o, m, fr) {
          if (fr === 9) {
            m.sfx('stomp');
            m.fx.text('RAAARGH!', f.x + f.facing * 50, f.y - 150, '#ff7b54', 34);
            m.fx.add({ type: 'wave', x: f.x + f.facing * 60, y: f.y - 70, life: 16, size: 160, color: '#ffd9c4' });
          }
        },
        hits: [{ from: 10, to: 16, box: { x: 0, y: -135, w: 135, h: 135 }, dmg: 5, kb: 15, stun: 24 }],
      }),
      ult: tazUlt,
    },
    shelly: {
      id: 'shelly', name: 'SHELLY', full: 'Shelly the Sea Turtle', emoji: '🐢', style: 'Shell Defender',
      height: 136, width: 72, portraitDx: 8, health: 108, speed: 3.1, jump: 13.5, power: 1.05, defense: 1, gravity: 1.05,
      walk: 'waddle', stats: { power: 3, speed: 2, health: 5, jump: 2 }, shell: true, projectile: true,
      passive: 'Hard Shell: blocking barely costs her any health',
      special: { name: 'Bubble Blast', desc: 'Blows a big wobbly bubble that floats along and traps the foe.' },
      ultimate: { name: 'Great Barrier Wave', desc: 'Calls in a giant wave full of fish and surfs it right across the screen!' },
      intro: "G'day! Let's go with the flow, dude.",
      win: 'Totally tubular! Catch ya on the next wave!',
      stage: 'reef',
      pal: { skin: '#8cc79a', skinDark: '#6aa87a', shell: '#4f8a3c', shellDark: '#35632a', belly: '#e8d8a0', beak: '#5e7a52', flower: '#ff6b8a' },
      alt: { skin: '#9ec2d9', skinDark: '#7aa3bd', shell: '#b5652b', shellDark: '#7d4219', belly: '#f2e2b8', beak: '#56708a', flower: '#ffd400' },
      draw: drawShelly,
      moves: withMoves(1, {
        frames: 34, pose: 'bubble',
        update(f, o, m, fr) {
          if (fr === 12) bubble(f, m);
        },
        hits: [],
      }),
      ult: shellyUlt,
    },
    lizzie: {
      id: 'lizzie', name: 'LIZZIE', full: 'Lizzie the Frill-neck', emoji: '🦎', style: 'Trickster',
      height: 142, width: 50, portraitDx: 24, health: 108, speed: 4.7, jump: 16, power: 1.15, defense: 1, gravity: 1,
      walk: 'strut', stats: { power: 3, speed: 5, health: 2, jump: 4 }, frillGuard: true,
      passive: 'Frill Flare: when she blocks, her frill scares attackers back',
      special: { name: 'Frill Scare', desc: 'Flares her giant frill. Up close, it leaves the foe dizzy!' },
      ultimate: { name: 'Desert Dash Dazzle', desc: 'Sprints back and forth through the foe in a blur, then a dazzling frill flash!' },
      intro: "Don't mind the frill, darl... it's just for show!",
      win: 'Dazzled ya, didn\'t I? Frill-tastic!',
      stage: 'dunny',
      pal: { skin: '#c99a5b', skinDark: '#a67a40', belly: '#eed6a6', frill: '#e8672c', frillIn: '#ffc93c', mouth: '#ffd84a' },
      alt: { skin: '#8fa35a', skinDark: '#6f8240', belly: '#e0e8b8', frill: '#8e44ad', frillIn: '#ff8ad8', mouth: '#ffd84a' },
      draw: drawLizzie,
      moves: withMoves(1.05, {
        frames: 42, pose: 'frill',
        update(f, o, m, fr) {
          if (fr === 11) {
            m.sfx('ready');
            m.fx.text('BOO!', f.x + f.facing * 50, f.y - 170, '#ffc93c', 34);
          }
        },
        hits: [{ from: 12, to: 16, box: { x: 0, y: -160, w: 105, h: 160 }, dmg: 7, kb: 2, stun: 20, dizzy: 60, chip: 0.1 }],
      }),
      ult: lizzieUlt,
    },
    cheeky: {
      id: 'cheeky', name: 'CHEEKY', full: 'Cheeky the Cockatoo', emoji: '🦜', style: 'Noisy Ranger',
      height: 146, width: 50, portraitDx: 6, health: 95, speed: 4.2, jump: 16.5, power: 1, defense: 1, gravity: 0.8,
      walk: 'strut', stats: { power: 2, speed: 4, health: 2, jump: 5 }, doubleJump: true, projectile: true,
      passive: 'Wings: double jump and floats down slowly',
      special: { name: 'Screech', desc: 'An ear-splitting SCREECH that flies across the screen. Works in the air too!' },
      ultimate: { name: 'Sulphur Crest Storm', desc: 'Calls the whole flock! Cockatoos dive-bomb from the sky, then a giant one swoops in!' },
      intro: "SQUAWK! Hello! Hello! Who's a pretty bird?",
      win: 'SQUAAAWK! I win! I win! Cheeky wins!',
      stage: 'harbour',
      pal: { white: '#f7f7f2', shade: '#d9dbe0', crest: '#ffd400', beak: '#3b3b3b', feet: '#6b6b6b', eyeRing: '#cfe8ff' },
      alt: { white: '#ffc2d6', shade: '#f09ab8', crest: '#ff5a8a', beak: '#dcdcdc', feet: '#8a8a8a', eyeRing: '#ffffff' },
      draw: drawCheeky,
      moves: withMoves(1, {
        frames: 30, pose: 'screech', air: true, landCancel: false,
        update(f, o, m, fr) {
          if (fr === 9) screech(f, m);
          if (!f.onGround() && fr < 20) f.vy = Math.min(f.vy, 1);
        },
        hits: [],
      }),
      ult: cheekyUlt,
    },
  });

  SF.ROSTER.push('taz', 'shelly', 'lizzie', 'cheeky');
  SF.COMING_SOON = [];
})();
