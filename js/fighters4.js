// Roster pack 4 (designed by the kids!): Sly, Cry, Greg and Bud.
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

  function flipper(ctx, x, y, ang, len, col) {
    const cx = x + Math.sin(ang) * len * 0.6;
    const cy = y + Math.cos(ang) * len * 0.6;
    D.ell(ctx, cx, cy, 9, len * 0.6, col, -ang);
  }

  // ---------------------------------------------------------------- SLY THE SHARK
  function sharkTeeth(ctx, x0, x1, y, down, n) {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
      const w = (x1 - x0) / n / 2;
      D.poly(ctx, [x - w, y, x, y + (down ? 7 : -7), x + w, y], '#fff', false);
    }
  }

  function drawSly(ctx, p, c) {
    const t = p.t;
    let e = D.limb(ctx, -10, -46, p.legB, 34 * p.legBExt, 14, c.dark);
    D.ell(ctx, e.x + 8, e.y + 1, 15, 6, c.dark, -p.legB);
    // tail fin
    ctx.save();
    ctx.translate(-26, -52);
    ctx.rotate(p.tail * 0.8);
    D.poly(ctx, [0, 0, -44, -34, -30, 2, -44, 30], c.dark);
    ctx.restore();
    ctx.save();
    leanAround(ctx, p, -50);
    flipper(ctx, -6, -110, p.armB, 34 * p.armBExt, c.dark);
    // dorsal fin
    D.poly(ctx, [-30, -104, -60, -140, -28, -128], c.grey);
    // body
    clipEll(ctx, 0, -96, 34, 54, 0, () => {
      D.ell(ctx, 16, -86, 22, 46, c.belly, 0, false);
      ctx.strokeStyle = 'rgba(40,50,60,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(-4 + i * 6, -126, 10, -0.9, 0.9);
        ctx.stroke();
      }
    }, c.grey);
    // head / snout
    ctx.save();
    ctx.translate(12, -142);
    ctx.rotate(p.head);
    const open = p.face === 'attack' || p.face === 'laugh' || p.face === 'happy';
    ctx.beginPath();
    ctx.moveTo(-26, 14);
    ctx.quadraticCurveTo(-24, -24, 12, -22);
    ctx.quadraticCurveTo(44, -18, 50, 0);
    ctx.quadraticCurveTo(48, 10, 38, 12);
    ctx.lineTo(-26, 14);
    ctx.closePath();
    ctx.fillStyle = c.grey;
    ctx.fill();
    stroke(ctx);
    // mouth
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.quadraticCurveTo(24, open ? 30 : 16, 42, 8);
    ctx.closePath();
    ctx.fillStyle = open ? '#7a1f1f' : c.belly;
    ctx.fill();
    stroke(ctx, 2.5);
    sharkTeeth(ctx, 8, 40, 7.5, true, 6);
    if (open) sharkTeeth(ctx, 12, 34, 22, false, 4);
    D.eye(ctx, 18, -8, 4.5, p.face, t);
    // sunnies pushed up on his head
    D.line(ctx, -16, -20, 30, -22, 3, '#222');
    D.ell(ctx, 2, -22, 8, 5, c.shades);
    D.ell(ctx, 20, -23, 8, 5, c.shades);
    ctx.restore();
    flipper(ctx, 14, -106, p.armF, 36 * p.armFExt, c.grey);
    ctx.restore();
    e = D.limb(ctx, 10, -46, p.legF, 34 * p.legFExt, 14, c.grey);
    D.ell(ctx, e.x + 8, e.y + 1, 15, 6, c.grey, -p.legF);
  }

  // Just the fin, cutting along the ground during Fin Dive.
  function drawSlyFin(ctx, p, c) {
    const wob = Math.sin(p.t * 0.6) * 2;
    D.poly(ctx, [-26, 0, -4, -54 + wob, 18, 0], c.grey);
    ctx.fillStyle = 'rgba(160,210,255,0.8)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-30 - i * 12, -4 - (i % 2) * 4, 5 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------- CRY THE DRAGONFLY
  function drawCry(ctx, p, c) {
    const t = p.t;
    const flap = Math.sin(t * 1.1) * 0.5;
    ctx.save();
    leanAround(ctx, p, -60);
    // wings (behind)
    const wing = (ang, len) => {
      ctx.save();
      ctx.translate(-2, -96);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(-len / 2, 0, len / 2, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,245,255,0.55)';
      ctx.fill();
      stroke(ctx, 2);
      ctx.strokeStyle = 'rgba(80,140,170,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-len + 6, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.restore();
    };
    wing(-2.2 + flap, 70);
    wing(-2.7 - flap, 64);
    // long tail segments
    for (let i = 5; i >= 0; i--) {
      const k = i / 5;
      D.ell(ctx, -6 - k * 46, -64 + k * 40 + Math.sin(t * 0.1 + i) * 1.5, 7 - k * 2, 9, i % 2 ? c.tail : c.tail2);
    }
    // legs + arms (thin)
    D.limb(ctx, -4, -70, p.legB, 30 * p.legBExt, 4, c.leg);
    D.limb(ctx, 4, -70, p.legF, 30 * p.legFExt, 4, c.leg);
    D.limb(ctx, 0, -86, p.armB, 22 * p.armBExt, 4, c.leg);
    D.ell(ctx, 4, -84, 15, 18, c.body);
    wing(-1.9 - flap, 66);
    wing(-2.5 + flap, 60);
    ctx.save();
    ctx.translate(16, -106);
    ctx.rotate(p.head);
    D.ell(ctx, 0, 0, 14, 13, c.body);
    // big compound eyes
    D.ell(ctx, 6, -6, 11, 11, c.eye);
    D.ell(ctx, 8, -8, 4, 4, 'rgba(255,255,255,0.8)', 0, false);
    if (p.face === 'ko' || p.face === 'dizzy' || p.face === 'happy' || p.face === 'laugh') D.eye(ctx, 6, -6, 5, p.face, t, false);
    else D.ell(ctx, 9, -5, 3.5, 4, '#111', 0, false);
    D.mouth(ctx, 10, 8, 8, p.face === 'normal' ? 'normal' : p.face);
    // tears when sad or sobbing
    if (p.face === 'hurt' || p.sob) {
      for (let i = 0; i < 3; i++) {
        const k = ((t * 2 + i * 9) % 26) / 26;
        D.ell(ctx, 14 + k * 6, 2 + k * 30, 3, 4, '#6fd3ff', 0, false);
      }
    }
    ctx.restore();
    D.limb(ctx, 10, -86, p.armF, 22 * p.armFExt, 4, c.leg);
    ctx.restore();
  }

  // ---------------------------------------------------------------- GREG THE WALLABY
  function drawGreg(ctx, p, c) {
    ctx.save();
    ctx.scale(0.88, 0.88);
    SF.FIGHTERS.kip.draw(ctx, p, c);
    ctx.restore();
  }

  // ---------------------------------------------------------------- BUD THE BILLY GOAT
  function goatEye(ctx, x, y, face, t) {
    if (!['normal', 'attack', 'grumpy'].includes(face)) return D.eye(ctx, x, y, 5, face, t);
    const blink = t % 220 < 6 && face === 'normal';
    if (blink) return D.line(ctx, x - 5, y, x + 5, y, 3, D.OUT);
    D.ell(ctx, x, y, 6, 5.5, '#ffe9a8');
    D.line(ctx, x - 3.5, y, x + 4, y, 3, '#111');
    if (face !== 'normal') D.line(ctx, x - 6, y - 10, x + 6, y - 6, 3.5, D.OUT);
  }

  function goatLeg(ctx, x, ang, ext, col) {
    const e = D.limb(ctx, x, -48, ang, 40 * ext, 9, col);
    D.ell(ctx, e.x + 2, e.y, 7, 5, '#3b3b3b', -ang);
  }

  function drawBud(ctx, p, c) {
    const t = p.t;
    goatLeg(ctx, -8, p.legB, p.legBExt, c.shade);
    ctx.save();
    leanAround(ctx, p, -50);
    let h = D.limb(ctx, -4, -104, p.armB, 30 * p.armBExt, 9, c.shade);
    D.ell(ctx, h.x, h.y, 6, 5, '#3b3b3b');
    // stubby tail
    D.poly(ctx, [-26, -96, -38, -110, -28, -88], c.coat);
    // shaggy body
    D.ell(ctx, 0, -82, 30, 40, c.coat);
    ctx.strokeStyle = 'rgba(150,140,120,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-18 + i * 7, -64);
      ctx.lineTo(-20 + i * 7, -52);
      ctx.stroke();
    }
    // bell collar
    D.line(ctx, 4, -114, 26, -110, 5, c.collar);
    D.ell(ctx, 18, -104, 6, 6, '#f2c230');
    ctx.save();
    ctx.translate(18, -128);
    ctx.rotate(p.head);
    // horns
    ctx.lineCap = 'round';
    ctx.strokeStyle = D.OUT;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-6, -16);
    ctx.quadraticCurveTo(-30, -44, -40, -10);
    ctx.stroke();
    ctx.strokeStyle = c.horn;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = D.OUT;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(4, -18);
    ctx.quadraticCurveTo(-16, -50, -26, -18);
    ctx.stroke();
    ctx.strokeStyle = c.horn;
    ctx.lineWidth = 6;
    ctx.stroke();
    // floppy ear
    D.ell(ctx, -16, -6, 14, 6, c.shade, 0.5);
    // long face
    D.ell(ctx, 6, 0, 18, 17, c.coat);
    D.ell(ctx, 22, 8, 13, 11, c.coat, 0.4);
    D.ell(ctx, 30, 10, 4, 3, '#3b2a22', 0, false);
    // beard
    D.poly(ctx, [14, 16, 22, 36, 26, 16], c.coat);
    goatEye(ctx, 8, -4, p.face, t);
    if (p.face === 'attack' || p.face === 'laugh' || p.face === 'happy') D.mouth(ctx, 24, 18, 9, p.face);
    ctx.restore();
    h = D.limb(ctx, 12, -104, p.armF, 30 * p.armFExt, 9, c.coat);
    D.ell(ctx, h.x, h.y, 6, 5, '#3b3b3b');
    ctx.restore();
    goatLeg(ctx, 8, p.legF, p.legFExt, c.coat);
  }

  // ---------------------------------------------------------------- entities
  function teardrop(f, m) {
    if (m.projectiles.filter((pr) => pr.owner === f).length >= 2) return;
    m.addProjectile({
      owner: f, x: f.x + f.facing * 30, y: f.y - 100, vx: 7.5 * f.facing, vy: -6, w: 30, h: 34, life: 120,
      props: { dmg: 7, kb: 4, stun: 18, word: 'SPLOSH!' },
      update() {
        this.vy += 0.35;
        if (this.y > G() - 12) {
          this.life = 0;
        }
      },
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx) - Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(14, 4, 0, 14);
        ctx.quadraticCurveTo(-14, 4, 0, -18);
        ctx.fillStyle = '#6fd3ff';
        ctx.fill();
        stroke(ctx, 2.5);
        D.ell(ctx, -4, 2, 3, 4, 'rgba(255,255,255,0.8)', 0, false);
        ctx.restore();
      },
    });
    m.sfx('splash');
  }

  // The giant shark that leaps out under the opponent.
  class GiantShark {
    constructor(owner, x) {
      this.owner = owner;
      this.x = SF.clamp(x, 110, SF.W - 110);
      this.t = 0;
      this.phase = 'circle';
      this.rise = 0;
      this.id = 'jaws' + uid++;
    }
    dangerZone() {
      return this.phase === 'circle' ? { x: this.x, r: 150 } : null;
    }
    update(m) {
      this.t++;
      const o = m.opponentOf(this.owner);
      if (this.phase === 'circle') {
        if (this.t < 40) this.x += SF.clamp(o.x - this.x, -5, 5);
        if (this.t === 1 || this.t === 20) m.sfx('stomp');
        if (this.t >= 52) {
          this.phase = 'leap';
          this.t = 0;
          m.sfx('splash');
          m.fx.shake(10);
        }
      } else if (this.phase === 'leap') {
        this.rise = Math.min(1, this.t / 12);
        if (this.t === 12) {
          m.sfx('chomp');
          m.fx.shake(16);
          m.tryHit(this.owner, o, { x: this.x - 95, y: G() - 250, w: 190, h: 250 }, {
            id: this.id, dmg: 28, kb: 8, stun: 30, knockdown: true, launch: 14, big: true, chip: 0.25,
            kbDir: Math.sign(o.x - this.x) || 1, word: 'CHOMP!',
          });
        }
        if (this.t > 24) this.rise = Math.max(0, 1 - (this.t - 24) / 12);
        if (this.t > 36) this.dead = true;
      }
    }
    drawBack(ctx) {
      ctx.save();
      const r = this.phase === 'circle' ? Math.min(120, this.t * 5) : 120;
      ctx.fillStyle = 'rgba(40,120,200,0.55)';
      ctx.beginPath();
      ctx.ellipse(this.x, G() + 4, r, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.phase === 'circle') {
        const fx = this.x + Math.sin(this.t * 0.18) * 80;
        const dir = Math.cos(this.t * 0.18) > 0 ? 1 : -1;
        ctx.translate(fx, G());
        ctx.scale(dir, 1);
        D.poly(ctx, [-16, 0, -2, -36, 14, 0], '#7f8d99');
        if (Math.floor(this.t / 10) % 2) SF.outlineText(ctx, 'DUN-DUN!', 0, -70, 22, '#bfe3ff');
      }
      ctx.restore();
    }
    draw(ctx) {
      if (this.phase !== 'leap' || this.rise <= 0) return;
      const y = G() + 60 - this.rise * 300;
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - 200, -100, 400, G() + 104);
      ctx.clip();
      ctx.translate(this.x, y);
      const open = this.t < 12 ? 0.6 : 0.05;
      // lower jaw
      ctx.save();
      ctx.rotate(open * 0.6);
      D.poly(ctx, [0, 0, 90, 20, 70, 60, -10, 60], '#f4f1ea');
      ctx.restore();
      // body
      D.ell(ctx, -20, 70, 70, 110, '#7f8d99');
      D.ell(ctx, 10, 90, 36, 80, '#f4f1ea', 0, false);
      // upper jaw
      ctx.save();
      ctx.rotate(-open);
      D.poly(ctx, [-60, 40, -40, -60, 20, -80, 100, -10, 60, 10, 0, 10], '#7f8d99');
      for (let i = 0; i < 6; i++) D.poly(ctx, [10 + i * 13, 6 - i * 2, 16 + i * 13, 20 - i * 2, 22 + i * 13, 6 - i * 3], '#fff');
      D.eye(ctx, 10, -34, 9, 'attack', this.t);
      ctx.restore();
      ctx.restore();
      ctx.fillStyle = 'rgba(160,215,255,0.85)';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI;
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(a) * 110, G() - Math.sin(a) * 60 * this.rise, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cry's rain cloud of tears.
  class RainCloud {
    constructor(owner) {
      this.owner = owner;
      this.target = owner.m.opponentOf(owner);
      this.x = this.target.x;
      this.y = 110;
      this.t = 0;
      this.drops = [];
      this.id = 'rain' + uid++;
    }
    update(m) {
      this.t++;
      const o = this.target;
      if (this.t < 100) this.x += SF.clamp(o.x - this.x, -4.5, 4.5);
      if (this.t > 12 && this.t < 96 && this.t % 4 === 0) this.drops.push({ x: this.x + SF.rand(-55, 55), y: this.y + 30, id: uid++ });
      this.drops.forEach((d) => {
        d.y += 11;
        const r = m.tryHit(this.owner, o, { x: d.x - 10, y: d.y - 14, w: 20, h: 28 }, {
          id: 'tear' + d.id, dmg: 2.2, kb: 1, stun: 16, chip: 0.25, light: true, kbDir: Math.sign(o.x - d.x) || 1,
        });
        if (r !== 'miss' || d.y > G()) d.dead = true;
      });
      this.drops = this.drops.filter((d) => !d.dead);
      if (this.t === 104) {
        m.sfx('splash');
        m.fx.shake(10);
        m.fx.text('BIG SPLASH!', this.x, G() - 150, '#6fd3ff', 36);
        m.tryHit(this.owner, o, { x: this.x - 90, y: G() - 120, w: 180, h: 120 }, {
          id: this.id, dmg: 8, kb: 9, stun: 26, knockdown: true, launch: 9, big: true, chip: 0.25,
          kbDir: Math.sign(o.x - this.x) || 1,
        });
      }
      if (this.t > 124) this.dead = true;
    }
    draw(ctx) {
      const k = Math.min(1, this.t / 10) * (this.t > 110 ? Math.max(0, 1 - (this.t - 110) / 14) : 1);
      ctx.save();
      ctx.globalAlpha = k;
      [[-50, 10, 34], [-15, -8, 42], [25, 0, 38], [55, 12, 30]].forEach(([dx, dy, r]) => D.ell(ctx, this.x + dx, this.y + dy, r, r * 0.75, '#8e9bb0'));
      D.eye(ctx, this.x - 14, this.y + 4, 5, 'hurt', this.t, false);
      D.eye(ctx, this.x + 16, this.y + 4, 5, 'hurt', this.t, false);
      ctx.restore();
      this.drops.forEach((d) => D.ell(ctx, d.x, d.y, 4, 7, '#6fd3ff', 0, true));
      if (this.t >= 104 && this.t < 120) {
        ctx.save();
        ctx.globalAlpha = 1 - (this.t - 104) / 16;
        D.ell(ctx, this.x, G(), 110, 26, '#6fd3ff');
        ctx.restore();
      }
    }
  }

  // Bud's rock pillar.
  class Pillar {
    constructor(x) {
      this.x = x;
      this.h = 0;
      this.alpha = 1;
      this.crumble = false;
    }
    update() {
      if (this.crumble) this.alpha -= 0.05;
      if (this.alpha <= 0) this.dead = true;
    }
    draw(ctx) {
      if (this.h <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      SF.roundRect(ctx, this.x - 36, G() - this.h, 72, this.h + 6, 10);
      ctx.fillStyle = '#8d8173';
      ctx.fill();
      stroke(ctx);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let y = G() - this.h + 24; y < G(); y += 30) {
        ctx.beginPath();
        ctx.moveTo(this.x - 30, y);
        ctx.lineTo(this.x + 10, y + 6);
        ctx.stroke();
      }
      D.ell(ctx, this.x - 10, G() - this.h + 4, 20, 7, '#f4f7fb', 0, false);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ultimates
  const slyUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'sly_call';
      m.fx.text('DUN-DUN... DUN-DUN...', f.x, f.y - 200, '#bfe3ff', 28);
      m.addEntity(new GiantShark(f, o.x));
    },
    update(f, o, m, fr) {
      if (fr >= 34) f.ultData.vulnerable = true;
      return fr >= 44;
    },
  };

  const cryUlt = {
    start(f, o, m) {
      f.ultData = {};
      f.ultPose = 'cry_sob';
      m.fx.text('WAAAAAH!', f.x, f.y - 170, '#6fd3ff', 40);
      m.sfx('laugh');
      m.addEntity(new RainCloud(f));
    },
    update(f, o, m, fr) {
      if (fr % 14 === 0 && fr < 50) m.fx.text('SOB!', f.x + SF.rand(-30, 30), f.y - 150, '#6fd3ff', 22);
      if (fr >= 40) f.ultData.vulnerable = true;
      return fr >= 50;
    },
  };

  const gregUlt = {
    start(f, o, m) {
      f.ultData = { vx: 15 * f.facing, vy: -11, n: 0 };
      f.ultPose = 'greg_ball';
      f.noGravity = true;
      m.sfx('boing');
      m.fx.text('PINBALL HOP!', f.x, f.y - 180, '#ffcf3f', 34);
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (fr < 90) {
        if (f.x <= SF.WALL_L + 4 && d.vx < 0) d.vx = -d.vx;
        if (f.x >= SF.WALL_R - 4 && d.vx > 0) d.vx = -d.vx;
        if (f.y >= G() - 1 && d.vy > 0) d.vy = -Math.abs(d.vy);
        if (f.y <= G() - 300 && d.vy < 0) d.vy = Math.abs(d.vy);
        if ((f.x <= SF.WALL_L + 4 || f.x >= SF.WALL_R - 4 || f.y >= G() - 1) && fr % 3 === 0) m.sfx('boing');
        f.vx = d.vx;
        f.vy = d.vy;
        f.spin = fr * 0.5;
        m.tryHit(f, o, { x: f.x - 50, y: f.y - 110, w: 100, h: 110 }, {
          id: 'pb' + Math.floor(fr / 12), dmg: 4, kb: 4, stun: 24, light: true, chip: 0.25, kbDir: Math.sign(d.vx),
        });
        return false;
      }
      if (fr === 90) {
        f.spin = 0;
        f.noGravity = false;
        f.facing = Math.sign(o.x - f.x) || f.facing;
        f.vx = 9 * f.facing;
        f.vy = -6;
        f.ultPose = 'greg_kick';
      }
      m.tryHit(f, o, m.boxFront(f, { x: -10, y: -110, w: 100, h: 90 }), {
        id: 'pbfinal', dmg: 10, kb: 11, stun: 30, knockdown: true, launch: 10, big: true, chip: 0.25, word: 'HOP-KICK!',
      });
      if (fr > 96) f.ultData.vulnerable = true;
      return fr > 96 && f.onGround();
    },
  };

  const budUlt = {
    start(f, o, m) {
      f.ultData = { pillar: new Pillar(f.x) };
      f.ultPose = 'bud_climb';
      f.noGravity = true;
      f.vx = 0;
      m.addEntity(f.ultData.pillar);
      m.sfx('stomp');
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (fr <= 24) {
        d.pillar.h = (fr / 24) * 230;
        f.y = G() - d.pillar.h;
        f.vy = 0;
        if (fr % 6 === 0) m.fx.shake(4);
      } else if (fr < 40) {
        f.facing = Math.sign(o.x - f.x) || f.facing;
        if (fr === 26) m.fx.text('BAAAA!', f.x, f.y - 170, '#fff', 34);
      } else if (fr === 40) {
        f.noGravity = false;
        f.vx = (o.x - f.x) / 26;
        f.vy = -2;
        f.ultPose = 'bud_butt';
        d.pillar.crumble = true;
        m.sfx('whistle');
      } else {
        f.spin = f.onGround() ? 0 : (fr - 40) * 0.45 * f.facing;
        m.tryHit(f, o, { x: f.x - 60, y: f.y - 130, w: 120, h: 140 }, {
          id: 'megabutt', dmg: 26, kb: 12, stun: 30, knockdown: true, launch: 12, big: true, chip: 0.25, word: 'MEGA BUTT!',
        });
        if (fr > 44 && f.onGround() && !d.landed) {
          d.landed = true;
          d.landT = fr;
          d.vulnerable = true;
          f.vx = 0;
          f.spin = 0;
          m.fx.shake(18);
          m.sfx('boom');
          m.fx.dust(f.x, G(), true);
        }
        if (d.landed) return fr > d.landT + 18;
        if (fr > 120) return true;
      }
      return false;
    },
  };

  // ---------------------------------------------------------------- roster
  Object.assign(SF.FIGHTERS, {
    sly: {
      id: 'sly', name: 'SLY', full: 'Sly the Shark', emoji: '🦈', style: 'Deep-Sea Bruiser',
      height: 170, width: 62, portraitDx: 14, health: 120, speed: 3.9, jump: 13.5, power: 1.15, defense: 1, gravity: 1.05,
      walk: 'waddle', stats: { power: 4, speed: 3, health: 4, jump: 2 }, frenzy: true,
      passive: 'Frenzy: gets faster when his opponent is nearly beaten',
      special: { name: 'Fin Dive', desc: 'Sinks into the ground so only his fin shows, glides forward, then bursts up with a CHOMP!' },
      ultimate: { name: 'Jaws of the Deep', desc: 'Dun-dun... dun-dun... a giant shark leaps out of the ground under the foe! Run away from the fin!' },
      intro: "Relax, mate. I only bite... a LITTLE.",
      win: 'Too easy! I\'m a great white... and a GREAT winner!',
      stage: 'reef',
      pal: { grey: '#7f8d99', dark: '#65727d', belly: '#f4f1ea', shades: '#1d1d1d' },
      alt: { grey: '#5a7fa8', dark: '#466788', belly: '#eaf2fb', shades: '#e53935' },
      draw: drawSly,
      drawSunk: drawSlyFin,
      moves: withMoves(1.05, {
        frames: 52, pose: 'findive',
        update(f, o, m, fr) {
          if (fr === 0) m.sfx('splash');
          if (fr < 8) {
            f.sink = fr / 8;
            f.vx *= 0.5;
          } else if (fr < 32) {
            f.sink = 1;
            f.invuln = Math.max(f.invuln, 2);
            f.vx = 9 * f.facing;
            if (fr % 4 === 0) m.fx.dust(f.x - f.facing * 20, G(), false);
          } else if (fr === 32) {
            f.sink = 0;
            f.vy = -11;
            m.sfx('chomp');
          } else f.vx *= 0.8;
        },
        hits: [{ from: 32, to: 40, box: { x: -10, y: -160, w: 95, h: 160 }, dmg: 11, kb: 6, stun: 24, knockdown: true, launch: 10, word: 'CHOMP!' }],
      }),
      ult: slyUlt,
    },
    cry: {
      id: 'cry', name: 'CRY', full: 'Cry the Dragonfly', emoji: '✨', style: 'Teary Flyer',
      height: 128, width: 48, portraitDx: 22, health: 92, speed: 4.6, jump: 15, power: 1, defense: 1, gravity: 0.55,
      walk: 'strut', stats: { power: 2, speed: 5, health: 2, jump: 5 }, airJumps: 2, projectile: true,
      passive: 'Hover: flap up to 3 times in the air and float down gently',
      special: { name: 'Teardrop Toss', desc: 'Lobs a big splashy tear. Works in the air too!' },
      ultimate: { name: 'Sob Storm', desc: 'WAAAAH! A rain cloud follows the foe and pours tears, then a big splash!' },
      intro: '*sniff* ...please don\'t hurt me! ...JUST KIDDING!',
      win: '*sniff* I won! These are HAPPY tears!',
      stage: 'billabong',
      pal: { body: '#2fb5c9', tail: '#2a8fb8', tail2: '#48c7de', eye: '#5ad17a', leg: '#1d4f63' },
      alt: { body: '#d9534f', tail: '#b83b3b', tail2: '#ef7a6a', eye: '#ffd24a', leg: '#5a1d1d' },
      draw: drawCry,
      moves: withMoves(1, {
        frames: 30, pose: 'teardrop', air: true,
        update(f, o, m, fr) {
          if (fr === 10) teardrop(f, m);
          if (!f.onGround() && fr < 18) f.vy = Math.min(f.vy, 0.5);
        },
        hits: [],
      }),
      ult: cryUlt,
    },
    greg: {
      id: 'greg', name: 'GREG', full: 'Greg the Wallaby', emoji: '🦘', style: 'Bouncy Kicker',
      height: 140, width: 50, portraitDx: 16, health: 106, speed: 4.8, jump: 17, power: 1.1, defense: 1, gravity: 1,
      walk: 'hop', stats: { power: 3, speed: 5, health: 3, jump: 5 }, wallJump: true,
      passive: 'Wall Jump: press jump while touching a wall to bounce off it',
      special: { name: 'Pogo Stomp', desc: 'Springs up and stomps down on the foe. Works in the air too!' },
      ultimate: { name: 'Pinball Hop', desc: 'Curls into a ball and ricochets off the walls, floor and sky, then a flying hop-kick!' },
      intro: "G'day! Kip's my cousin... but I'm the bouncy one!",
      win: 'Boing boing! Hop along, champ!',
      stage: 'dunny',
      pal: { fur: '#8d7b6a', furDark: '#6d5d4e', belly: '#e1d4c2', ear: '#e8a3a3', glove: '#8d7b6a', gloveDark: '#6d5d4e', cap: '#e53935' },
      alt: { fur: '#b58a5a', furDark: '#8e693f', belly: '#f1e2c8', ear: '#e8a3a3', glove: '#b58a5a', gloveDark: '#8e693f', cap: '#2f7fd0' },
      draw: drawGreg,
      moves: withMoves(1.1, {
        frames: 60, pose: 'pogo', air: true,
        update(f, o, m, fr) {
          const md = f.moveData;
          if (fr === 0) {
            md.landed = false;
            if (f.onGround()) f.vy = -14;
            f.vx = 4 * f.facing;
            m.sfx('boing');
          }
          if (fr >= 12 && !md.landed) {
            f.vy = Math.max(f.vy, 13);
            f.vx = 5 * f.facing;
            if (f.onGround()) {
              md.landed = true;
              f.moveEnd = fr + 10;
              m.fx.dust(f.x, G(), false);
            }
          }
        },
        hits: [{ from: 12, to: 59, cond: (f) => !f.moveData.landed, box: { x: -40, y: -60, w: 85, h: 70 }, dmg: 9, kb: 5, stun: 22, knockdown: true, launch: 6, word: 'BOING!' }],
      }),
      ult: gregUlt,
    },
    bud: {
      id: 'bud', name: 'BUD', full: 'Bud the Billy Goat', emoji: '🐐', style: 'Head-Butt Tank',
      height: 150, width: 58, portraitDx: 6, health: 110, speed: 3.4, jump: 15, power: 1.02, defense: 0.97, gravity: 1,
      walk: 'strut', stats: { power: 4, speed: 2, health: 5, jump: 3 }, eatsAnything: true,
      passive: 'Eats Anything: power-up snacks give him DOUBLE power',
      special: { name: 'Ram Charge', desc: 'Lowers his horns and charges. Nothing stops a billy goat!' },
      ultimate: { name: 'Mega Butt', desc: 'A rock pillar shoots up under him, then he leaps off with a spinning MEGA headbutt!' },
      intro: 'Baaa! Got any snacks? No? Then let\'s BUTT heads!',
      win: 'Baaa-rilliant! Now where\'s that snack?',
      stage: 'kosciuszko',
      pal: { coat: '#f1ede4', shade: '#d6d0c2', horn: '#9b7a55', collar: '#e53935' },
      alt: { coat: '#6b5646', shade: '#54433a', horn: '#d8c7a8', collar: '#2f7fd0' },
      draw: drawBud,
      moves: withMoves(1.05, {
        frames: 44, pose: 'ram', armor: true,
        update(f, o, m, fr) {
          if (fr === 5) m.sfx('swing');
          if (fr >= 6 && fr <= 28) {
            f.vx = 10.5 * f.facing;
            if (fr % 4 === 0) m.fx.dust(f.x - f.facing * 20, G(), false);
          } else f.vx *= 0.7;
        },
        hits: [{ from: 8, to: 28, box: { x: -10, y: -115, w: 95, h: 100 }, dmg: 11, kb: 14, stun: 24, word: 'BAAA-M!' }],
      }),
      ult: budUlt,
    },
  });

  SF.ROSTER.push('sly', 'cry', 'greg', 'bud');
})();
