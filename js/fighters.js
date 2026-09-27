// The roster: artwork, stats, moves, specials and ultimates.
(() => {
  const D = SF.D;
  const G = () => SF.GROUND;

  function leanAround(ctx, p, py) {
    ctx.translate(0, py);
    ctx.rotate(p.lean);
    ctx.translate(0, -py);
  }

  function clipEll(ctx, x, y, rx, ry, rot, drawInside, fill) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.clip();
    drawInside();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
  }

  // ---------------------------------------------------------------- KIP
  function kipLeg(ctx, x, ang, ext, col, c) {
    D.ell(ctx, x - 2, -50, 15, 21, col, -ang * 0.6);
    const e = D.limb(ctx, x, -50, ang, 42 * ext, 11, col);
    const fx = Math.cos(ang), fy = -Math.sin(ang);
    D.ell(ctx, e.x + fx * 13, e.y + fy * 13 - 1, 21, 7, col, -ang);
    D.ell(ctx, e.x + fx * 28, e.y + fy * 28 - 1, 5, 4, c.furDark, -ang, false);
  }

  function drawKip(ctx, p, c) {
    const t = p.t;
    // back arm
    ctx.save();
    leanAround(ctx, p, -55);
    let h = D.limb(ctx, -4, -106, p.armB, 27 * p.armBExt, 9, c.furDark);
    D.ell(ctx, h.x, h.y, 10, 9, c.gloveDark);
    ctx.restore();
    kipLeg(ctx, -6, p.legB, p.legBExt, c.furDark, c);
    // tail
    ctx.save();
    ctx.translate(-12, -48);
    ctx.rotate(p.tail);
    ctx.beginPath();
    ctx.moveTo(4, -12);
    ctx.quadraticCurveTo(-40, -12, -74, 42);
    ctx.quadraticCurveTo(-78, 52, -64, 47);
    ctx.quadraticCurveTo(-28, 18, 8, 10);
    ctx.closePath();
    ctx.fillStyle = c.fur;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    ctx.restore();
    // body + head
    ctx.save();
    leanAround(ctx, p, -55);
    D.ell(ctx, 0, -90, 27, 40, c.fur);
    D.ell(ctx, 9, -84, 15, 28, c.belly, 0, false);
    ctx.save();
    ctx.translate(8, -130);
    ctx.rotate(p.head);
    D.ell(ctx, -12, -26, 7, 20, c.furDark, -0.4);
    D.ell(ctx, 3, -30, 7.5, 21, c.fur, 0.12);
    D.ell(ctx, 3, -30, 3.5, 13, c.ear, 0.12, false);
    D.ell(ctx, 0, 0, 21, 19, c.fur);
    D.ell(ctx, 20, 6, 17, 11, c.fur, 0.12);
    D.ell(ctx, 23, 10, 11, 6, c.belly, 0.12, false);
    D.ell(ctx, 36, 1, 5.5, 4.5, '#2a1a12', 0, false);
    D.eye(ctx, 9, -4, 6, p.face, t);
    D.mouth(ctx, 27, 13, 12, p.face);
    if (c.cap) {
      // backwards cap (Greg)
      ctx.beginPath();
      ctx.ellipse(-2, -12, 20, 12, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = c.cap;
      ctx.fill();
      ctx.lineWidth = D.LW;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      D.ell(ctx, -22, -12, 12, 4, c.cap, -0.2);
    }
    ctx.restore();
    ctx.restore();
    kipLeg(ctx, 6, p.legF, p.legFExt, c.fur, c);
    // front arm with boxing glove
    ctx.save();
    leanAround(ctx, p, -55);
    h = D.limb(ctx, 10, -108, p.armF, 28 * p.armFExt, 9, c.fur);
    D.ell(ctx, h.x, h.y, 11, 10, c.glove);
    D.ell(ctx, h.x + 3, h.y - 3, 3, 2, 'rgba(255,255,255,0.7)', 0, false);
    ctx.restore();
  }

  // ---------------------------------------------------------------- KOKO
  function drawKoko(ctx, p, c) {
    const t = p.t;
    ctx.save();
    leanAround(ctx, p, -40);
    let h = D.limb(ctx, -8, -92, p.armB, 25 * p.armBExt, 13, c.furDark);
    D.ell(ctx, h.x, h.y, 8, 8, c.furDark);
    ctx.restore();
    let e = D.limb(ctx, -10, -34, p.legB, 26 * p.legBExt, 16, c.furDark);
    D.ell(ctx, e.x + 5, e.y + 1, 12, 7, c.furDark, -p.legB);
    ctx.save();
    leanAround(ctx, p, -40);
    D.ell(ctx, 0, -64, 37, 44, c.fur);
    D.ell(ctx, 9, -58, 22, 30, c.belly, 0, false);
    ctx.restore();
    e = D.limb(ctx, 10, -34, p.legF, 26 * p.legFExt, 16, c.fur);
    D.ell(ctx, e.x + 5, e.y + 1, 12, 7, c.fur, -p.legF);
    ctx.save();
    leanAround(ctx, p, -40);
    ctx.save();
    ctx.translate(6, -120);
    ctx.rotate(p.head);
    D.ell(ctx, -27, -20, 19, 18, c.furDark);
    D.ell(ctx, -27, -19, 11, 10, c.inner, 0, false);
    D.ell(ctx, 0, 0, 36, 30, c.fur);
    D.ell(ctx, 30, -22, 19, 18, c.fur);
    D.ell(ctx, 31, -21, 11, 10, c.inner, 0, false);
    ctx.__lid = c.furDark;
    D.eye(ctx, 2, -4, 5.5, p.face, t);
    D.eye(ctx, 21, -5, 5.5, p.face, t, false);
    D.ell(ctx, 26, 9, 10, 12, c.nose);
    D.ell(ctx, 23, 4, 3, 3, 'rgba(255,255,255,0.6)', 0, false);
    D.mouth(ctx, 22, 23, 10, p.face);
    ctx.restore();
    h = D.limb(ctx, 12, -90, p.armF, 27 * p.armFExt, 13, c.fur);
    D.ell(ctx, h.x, h.y, 9, 8, c.fur);
    D.line(ctx, h.x + 3, h.y + 4, h.x + 7, h.y + 9, 2, D.OUT);
    ctx.restore();
    if (p.face === 'sleepy') {
      const z = (t % 90) / 90;
      SF.outlineText(ctx, 'z', 40 + z * 20, -160 - z * 30, 14 + z * 10, '#fff');
    }
  }

  // ---------------------------------------------------------------- KOOKA
  function kookaWing(ctx, x, y, ang, ext, col, c, front) {
    const len = 30 * ext;
    const cx = x + Math.sin(ang) * len * 0.8;
    const cy = y + Math.cos(ang) * len * 0.8;
    D.ell(ctx, cx, cy, 12, len, col, -ang);
    if (front) {
      const bx = x + Math.sin(ang) * len * 0.4;
      const by = y + Math.cos(ang) * len * 0.4;
      D.ell(ctx, bx, by, 6, 9, c.blue, -ang, false);
      D.ell(ctx, bx, by, 2, 2, '#bfe3ff', 0, false);
    }
  }

  function kookaLeg(ctx, x, ang, ext, c) {
    const e = D.limb(ctx, x, -42, ang, 40 * ext, 5, c.leg);
    D.line(ctx, e.x, e.y, e.x + 11, e.y + 1, 4, c.leg);
    D.line(ctx, e.x, e.y, e.x + 6, e.y + 3, 4, c.leg);
    D.line(ctx, e.x, e.y, e.x - 6, e.y + 1, 4, c.leg);
  }

  function drawKooka(ctx, p, c) {
    const t = p.t;
    ctx.save();
    leanAround(ctx, p, -45);
    kookaWing(ctx, -4, -102, p.armB, p.armBExt, c.brownDark, c, false);
    ctx.restore();
    kookaLeg(ctx, -5, p.legB, p.legBExt, c);
    ctx.save();
    leanAround(ctx, p, -45);
    // tail feathers
    ctx.save();
    ctx.translate(-20, -62);
    ctx.rotate(-0.7 + p.tail);
    D.ell(ctx, -30, 0, 32, 9, c.tail);
    for (let i = 0; i < 4; i++) D.line(ctx, -50 + i * 11, -7, -48 + i * 11, 7, 2.5, c.brownDark);
    ctx.restore();
    clipEll(ctx, 0, -80, 28, 40, 0, () => {
      D.ell(ctx, -16, -86, 20, 36, c.brown, 0, false);
      for (let i = 0; i < 4; i++) D.line(ctx, 4, -70 + i * 10, 20, -68 + i * 10, 1.5, 'rgba(120,90,60,0.35)');
    }, c.cream);
    ctx.save();
    ctx.translate(6, -128);
    ctx.rotate(p.head);
    D.poly(ctx, [-14, -20, -8, -36, -2, -21, 4, -33, 6, -20], c.brown);
    clipEll(ctx, 0, 0, 26, 23, 0, () => {
      D.ell(ctx, -6, -16, 24, 12, c.brown, 0, false);
      D.line(ctx, -30, -1, 8, -2, 7, c.brownDark);
    }, c.cream);
    D.eye(ctx, 11, -4, 5, p.face, t);
    // beak
    ctx.save();
    ctx.translate(18, 5);
    ctx.rotate(p.beak);
    D.poly(ctx, [0, 0, 36, 0, 0, 8], c.beakBot);
    ctx.restore();
    D.poly(ctx, [16, -8, 58, 2, 18, 5], c.beakTop);
    if (p.face === 'laugh' || p.face === 'attack') {
      D.ell(ctx, 26, 9, 5, 3, '#c0392b', 0, false);
    }
    ctx.restore();
    ctx.restore();
    kookaLeg(ctx, 5, p.legF, p.legFExt, c);
    ctx.save();
    leanAround(ctx, p, -45);
    kookaWing(ctx, 8, -104, p.armF, p.armFExt, c.brown, c, true);
    ctx.restore();
  }

  // ---------------------------------------------------------------- CAPTAIN CROC
  function drawCroc(ctx, p, c) {
    const t = p.t;
    ctx.save();
    leanAround(ctx, p, -50);
    let h = D.limb(ctx, -4, -110, p.armB, 28 * p.armBExt, 12, c.greenDark);
    D.ell(ctx, h.x, h.y, 8, 7, c.greenDark);
    ctx.restore();
    let e = D.limb(ctx, -10, -44, p.legB, 36 * p.legBExt, 17, c.greenDark);
    D.ell(ctx, e.x + 8, e.y + 1, 15, 7, c.greenDark, -p.legB);
    // tail with spikes
    ctx.save();
    ctx.translate(-16, -52);
    ctx.rotate(p.tail);
    const bz = (tt) => {
      const a = 1 - tt;
      return [a * a * 0 + 2 * a * tt * -50 + tt * tt * -96, a * a * -16 + 2 * a * tt * -16 + tt * tt * 46];
    };
    for (let i = 1; i < 7; i++) {
      const [sx, sy] = bz(i / 7.5);
      D.poly(ctx, [sx - 6, sy - 2, sx - 2, sy - 13, sx + 4, sy - 2], c.greenDark);
    }
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(-50, -16, -96, 46);
    ctx.quadraticCurveTo(-98, 54, -86, 50);
    ctx.quadraticCurveTo(-42, 22, 4, 16);
    ctx.closePath();
    ctx.fillStyle = c.green;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    leanAround(ctx, p, -50);
    clipEll(ctx, 0, -90, 32, 46, 0, () => {
      D.ell(ctx, 10, -84, 20, 36, c.belly, 0, false);
      for (let i = 0; i < 6; i++) D.line(ctx, -8, -112 + i * 11, 30, -112 + i * 11, 1.5, 'rgba(60,80,20,0.35)');
    }, c.green);
    ctx.restore();
    e = D.limb(ctx, 10, -44, p.legF, 36 * p.legFExt, 17, c.green);
    D.ell(ctx, e.x + 8, e.y + 1, 15, 7, c.green, -p.legF);
    ctx.save();
    leanAround(ctx, p, -50);
    ctx.save();
    ctx.translate(10, -142);
    ctx.rotate(p.head);
    // lower jaw
    ctx.save();
    ctx.translate(8, 8);
    ctx.rotate(p.beak);
    D.poly(ctx, [0, 0, 52, 0, 48, 9, 0, 11], c.greenDark);
    for (let i = 0; i < 4; i++) D.poly(ctx, [14 + i * 9, 0, 18 + i * 9, -6, 22 + i * 9, 0], '#fff', false);
    ctx.restore();
    D.ell(ctx, 0, 0, 24, 18, c.green);
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.quadraticCurveTo(40, -14, 62, -6);
    ctx.quadraticCurveTo(70, 2, 62, 8);
    ctx.lineTo(8, 9);
    ctx.closePath();
    ctx.fillStyle = c.green;
    ctx.fill();
    ctx.lineWidth = D.LW;
    ctx.strokeStyle = D.OUT;
    ctx.stroke();
    for (let i = 0; i < 5; i++) D.poly(ctx, [16 + i * 9, 8, 20 + i * 9, 15, 24 + i * 9, 8], '#fff');
    D.ell(ctx, 58, -8, 4, 3, c.greenDark);
    D.ell(ctx, 3, -18, 10, 10, c.green);
    D.eye(ctx, 5, -19, 6, p.face, t);
    // captain hat
    D.poly(ctx, [-26, -26, 14, -26, 8, -44, -4, -50, -20, -44], c.hat);
    D.ell(ctx, -6, -26, 24, 5, '#151515');
    D.ell(ctx, -6, -39, 5, 5, c.gold);
    D.line(ctx, -6, -44, -6, -34, 2, c.hat);
    ctx.restore();
    h = D.limb(ctx, 12, -112, p.armF, 29 * p.armFExt, 12, c.green);
    D.ell(ctx, h.x, h.y, 9, 8, c.green);
    ctx.restore();
  }

  // ---------------------------------------------------------------- moves
  function baseMoves(reach = 1) {
    const r = (n) => n * reach;
    return {
      punch: { frames: 18, pose: 'punch', sfx: 'swing', hits: [{ from: 4, to: 7, box: { x: 10, y: -118, w: r(70), h: 58 }, dmg: 5, kb: 3, stun: 15 }] },
      kick: { frames: 26, pose: 'kick', sfx: 'swing', hits: [{ from: 7, to: 11, box: { x: 10, y: -80, w: r(88), h: 32 }, dmg: 8, kb: 5, stun: 18 }] },
      lowPunch: { frames: 16, pose: 'lowpunch', crouch: true, sfx: 'swing', hits: [{ from: 4, to: 6, box: { x: 10, y: -70, w: r(64), h: 26 }, dmg: 4, kb: 2, stun: 13 }] },
      sweep: { frames: 32, pose: 'sweep', crouch: true, sfx: 'swing', hits: [{ from: 8, to: 12, box: { x: 10, y: -32, w: r(100), h: 30 }, dmg: 7, kb: 3, stun: 20, knockdown: true, launch: 5 }] },
      airPunch: { frames: 22, pose: 'airpunch', air: true, landCancel: true, sfx: 'swing', hits: [{ from: 3, to: 11, box: { x: 5, y: -110, w: r(66), h: 60 }, dmg: 6, kb: 3, stun: 15 }] },
      airKick: { frames: 26, pose: 'airkick', air: true, landCancel: true, sfx: 'swing', hits: [{ from: 4, to: 15, box: { x: 5, y: -70, w: r(76), h: 44 }, dmg: 8, kb: 4, stun: 17 }] },
    };
  }

  function withMoves(reach, special) {
    const m = baseMoves(reach);
    m.special = special;
    return m;
  }

  // ---------------------------------------------------------------- entities
  let uid = 0;

  // Koko's leaf projectile.
  function spawnLeaf(f, m) {
    if (m.projectiles.some((pr) => pr.owner === f)) return;
    m.addProjectile({
      owner: f,
      x: f.x + f.facing * 40,
      y: f.y - 105,
      vx: 8.5 * f.facing,
      vy: 0,
      w: 40,
      h: 26,
      life: 150,
      props: { dmg: 8, kb: 4, stun: 16 },
      draw(ctx, t) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(t * 0.35 * Math.sign(this.vx));
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.quadraticCurveTo(0, -14, 20, 0);
        ctx.quadraticCurveTo(0, 14, -20, 0);
        ctx.fillStyle = '#6fbf73';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        D.line(ctx, -16, 0, 16, 0, 2, '#2f6b33');
        ctx.restore();
      },
    });
    m.sfx('leaf');
  }

  // Koko's giant falling gum tree.
  class FallingTree {
    constructor(owner, x) {
      this.owner = owner;
      this.x = SF.clamp(x, 120, SF.W - 120);
      this.y = -250;
      this.vy = 0;
      this.t = 0;
      this.phase = 'warn';
      this.id = 'tree' + uid++;
      this.alpha = 1;
    }
    update(m) {
      this.t++;
      if (this.phase === 'warn') {
        if (this.t > 28) this.phase = 'fall';
      } else if (this.phase === 'fall') {
        this.vy += 1.5;
        this.y += this.vy;
        const target = m.opponentOf(this.owner);
        m.tryHit(this.owner, target, { x: this.x - 125, y: this.y - 40, w: 250, h: 40 }, {
          id: this.id, dmg: 26, kb: 8, stun: 30, knockdown: true, launch: 11, big: true, chip: 0.25,
          kbDir: Math.sign(target.x - this.x) || 1,
        });
        if (this.y >= G() - 18) {
          this.y = G() - 18;
          this.phase = 'lying';
          this.t = 0;
          m.fx.shake(20);
          m.sfx('boom');
          m.fx.text('TIMBER!', this.x, G() - 150, '#9be15d', 46);
          for (let i = 0; i < 18; i++) m.fx.leaf(this.x + SF.rand(-120, 120), G() - 30);
          m.fx.dust(this.x - 90, G(), true);
          m.fx.dust(this.x + 90, G(), true);
        }
      } else if (this.phase === 'lying') {
        if (this.t > 45) this.alpha -= 0.05;
        if (this.alpha <= 0) this.dead = true;
      }
    }
    dangerZone() {
      return this.phase === 'warn' || this.phase === 'fall' ? { x: this.x, r: 160 } : null;
    }
    drawBack(ctx) {
      if (this.phase !== 'warn' && this.phase !== 'fall') return;
      const k = this.phase === 'warn' ? this.t / 28 : 1;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.t * 0.5);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.x, G() + 4, 130 * k, 12 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    draw(ctx) {
      if (this.phase === 'warn') return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y);
      // trunk
      ctx.beginPath();
      ctx.moveTo(-130, -16);
      ctx.lineTo(80, -12);
      ctx.lineTo(80, 12);
      ctx.lineTo(-130, 16);
      ctx.closePath();
      ctx.fillStyle = '#e8dccb';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      D.ell(ctx, -130, 0, 6, 16, '#c9a77c');
      for (let i = 0; i < 6; i++) D.line(ctx, -110 + i * 32, -10, -96 + i * 32, 8, 3, '#b9ab98');
      D.limb(ctx, 30, -10, 2.4, 40, 8, '#e8dccb');
      // gum leaves crown
      const leaf = ['#5b8f4a', '#6fa65a', '#4f7d40'];
      [[95, -20, 38], [130, 0, 40], [100, 22, 34], [60, -34, 28], [150, -30, 26], [60, 30, 26]].forEach(([lx, ly, r], i) =>
        D.ell(ctx, lx, ly, r, r * 0.8, leaf[i % 3])
      );
      ctx.restore();
    }
  }

  // Kooka's laugh shockwave.
  class LaughRing {
    constructor(owner) {
      this.owner = owner;
      this.x = owner.x + owner.facing * 30;
      this.y = owner.y - 120;
      this.r = 10;
      this.t = 0;
      this.tested = false;
    }
    update(m) {
      this.t++;
      this.r += 17;
      const o = m.opponentOf(this.owner);
      if (!this.tested && Math.hypot(o.x - this.x, o.y - 70 - this.y) < this.r + 30) {
        this.tested = true;
        const res = m.tryHit(this.owner, o, o.hurtbox(), {
          id: 'laugh', dmg: 6, kb: 2, stun: 12, dizzy: 170, chip: 0.25, sfx: 'hit',
          kbDir: Math.sign(o.x - this.x) || 1,
        });
        if (res === 'hit') this.owner.ultData.hit = true;
      }
      if (this.r > 1100) this.dead = true;
    }
    draw(ctx) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const rr = this.r - i * 45;
        if (rr <= 0) continue;
        ctx.globalAlpha = Math.max(0, 0.6 - rr / 1600 - i * 0.12);
        ctx.lineWidth = 10 - i * 3;
        ctx.strokeStyle = i === 0 ? '#fff6a8' : '#ffd24a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.max(0, 1 - this.r / 900);
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + this.t * 0.05;
        SF.outlineText(ctx, 'HA', this.x + Math.cos(a) * this.r * 0.8, this.y + Math.sin(a) * this.r * 0.5, 26, '#fff6a8');
      }
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ultimates
  const kipUlt = {
    start(f) {
      f.ultData = { phase: 'crouch', tx: f.x, t: 0 };
      f.ultPose = 'kip_crouch';
      f.vx = 0;
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (d.phase === 'crouch') {
        if (fr >= 10) {
          d.phase = 'rise';
          f.noGravity = true;
          f.vy = -26;
          f.ultPose = 'kip_rise';
          m.sfx('boing');
          m.fx.dust(f.x, G(), true);
        }
      } else if (d.phase === 'rise') {
        if (f.y < -160) {
          d.phase = 'hover';
          d.t = 0;
          f.vy = 0;
          f.y = -260;
          d.tx = f.x;
          f.target = true;
        }
      } else if (d.phase === 'hover') {
        d.t++;
        d.tx += SF.clamp(o.x - d.tx, -7, 7);
        d.tx = SF.clamp(d.tx, SF.WALL_L, SF.WALL_R);
        f.x = d.tx;
        if (d.t >= 48) {
          d.phase = 'fall';
          f.vy = 32;
          f.ultPose = 'kip_fall';
          m.sfx('whistle');
        }
      } else if (d.phase === 'fall') {
        m.tryHit(f, o, { x: f.x - 40, y: f.y - 150, w: 80, h: 150 }, { id: 'kipbody', dmg: 10, kb: 6, stun: 20, knockdown: true, launch: 8 });
        if (f.y >= G()) {
          f.y = G();
          f.vy = 0;
          f.noGravity = false;
          f.target = false;
          d.phase = 'land';
          d.t = 0;
          f.ultPose = 'kip_land';
          f.ultData.vulnerable = true;
          m.fx.shake(24);
          m.sfx('boom');
          m.fx.shockwave(f.x, G());
          m.fx.dust(f.x - 40, G(), true);
          m.fx.dust(f.x + 40, G(), true);
          m.fx.text('BOOMER BOUNCE!', f.x, G() - 190, '#ffcf3f', 40);
          m.tryHit(f, o, { x: f.x - 180, y: G() - 55, w: 360, h: 55 }, {
            id: 'kipquake', dmg: 26, kb: 10, stun: 30, knockdown: true, launch: 12, big: true, chip: 0.25,
          });
        }
      } else if (d.phase === 'land') {
        d.t++;
        return d.t >= 28;
      }
      return false;
    },
  };

  const kokoUlt = {
    start(f) {
      f.ultData = { phase: 'stomp' };
      f.ultPose = 'koko_stomp';
      f.vx = 0;
    },
    update(f, o, m, fr) {
      if (fr === 8 || fr === 20 || fr === 32) {
        m.fx.shake(7);
        m.sfx('stomp');
        m.fx.dust(f.x + f.facing * 10, G(), false);
      }
      if (fr === 6) m.fx.text('GRRR!', f.x, f.y - 190, '#ff7b54', 36);
      if (fr === 22) m.addEntity(new FallingTree(f, o.x));
      if (fr >= 36) f.ultData.vulnerable = true;
      return fr >= 46;
    },
  };

  const kookaUlt = {
    start(f, o, m) {
      f.ultData = { phase: 'laugh', hit: false, pass: 0 };
      f.ultPose = 'kooka_laugh';
      m.sfx('laugh');
      m.addEntity(new LaughRing(f));
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (d.phase === 'laugh') {
        if (fr % 12 === 0) m.fx.text('HA!', f.x + SF.rand(-40, 40), f.y - 180 - SF.rand(0, 30), '#fff6a8', 28);
        if (fr >= 50) {
          if (d.hit && o.state === 'dizzy') {
            d.phase = 'swoop';
            this.startPass(f, o, m);
          } else {
            return true;
          }
        }
        return false;
      }
      if (d.phase === 'swoop') {
        if (o.state === 'ko') return this.finish(f, o);
        const k = d.pass;
        m.tryHit(f, o, { x: f.x - 50, y: f.y - 70, w: 100, h: 70 }, {
          id: 'swoop' + k, dmg: 8, kb: 3, stun: 20, keepDizzy: k < 2, knockdown: k === 2, launch: k === 2 ? 11 : 0,
          unblockable: true, kbDir: f.facing, big: k === 2,
        });
        if ((f.vx > 0 && f.x > SF.W + 90) || (f.vx < 0 && f.x < -90)) {
          d.pass++;
          if (d.pass >= 3) return this.finish(f, o);
          this.startPass(f, o, m);
        }
        return false;
      }
      return true;
    },
    startPass(f, o, m) {
      const k = f.ultData.pass;
      const dir = k % 2 === 0 ? (o.x < SF.W / 2 ? -1 : 1) : -f.facing;
      f.noGravity = true;
      f.noClamp = true;
      f.x = dir > 0 ? -80 : SF.W + 80;
      f.y = G() - 40 - (k === 1 ? 50 : 0);
      f.vx = dir * 24;
      f.vy = 0;
      f.facing = dir;
      f.ultPose = 'kooka_swoop';
      m.sfx('dive');
    },
    finish(f, o) {
      f.noGravity = false;
      f.noClamp = false;
      f.x = SF.clamp(o.x < SF.W / 2 ? o.x + 220 : o.x - 220, SF.WALL_L + 20, SF.WALL_R - 20);
      f.y = -40;
      f.vx = 0;
      f.vy = 2;
      return true;
    },
  };

  const crocUlt = {
    start(f, o, m) {
      f.ultData = { phase: 'lunge', t: 0 };
      f.ultPose = 'croc_lunge';
      m.sfx('chomp');
    },
    update(f, o, m, fr) {
      const d = f.ultData;
      if (d.phase === 'lunge') {
        f.vx = 11 * f.facing;
        const box = m.boxFront(f, { x: 0, y: -150, w: 85, h: 150 });
        const grabbable = o.invuln <= 0 && !['down', 'getup', 'ko', 'ult'].includes(o.state);
        if (grabbable && SF.overlap(box, o.hurtbox())) {
          d.phase = 'roll';
          d.t = 0;
          o.setState('grabbed');
          o.vx = o.vy = 0;
          o.noGravity = true;
          m.sfx('chomp');
          m.fx.text('CHOMP!', o.x, o.y - 180, '#9be15d', 42);
        } else if (fr >= 26) {
          d.phase = 'miss';
          d.t = 0;
          d.vulnerable = true;
          f.ultPose = 'croc_recover';
        }
      } else if (d.phase === 'miss') {
        f.vx *= 0.8;
        d.t++;
        return d.t >= 26;
      } else if (d.phase === 'roll') {
        d.t++;
        f.vx = 0;
        f.ultPose = 'croc_roll';
        f.x = SF.clamp(f.x + f.facing * 1.6, SF.WALL_L + 60, SF.WALL_R - 60);
        f.spin = d.t * 0.42;
        o.spin = d.t * 0.42;
        o.x = f.x + f.facing * 58;
        o.y = G();
        if (d.t % 14 === 7) {
          m.tryHit(f, o, o.hurtbox(), { id: 'roll' + d.t, dmg: 4, kb: 0, stun: 40, hold: true, unblockable: true, sfx: 'hit' });
          m.sfx('spin');
          m.fx.dust(o.x, G(), false);
        }
        if (o.state === 'ko') {
          f.spin = 0;
          o.spin = 0;
          o.noGravity = false;
          d.phase = 'recover';
          d.t = 0;
          return false;
        }
        if (d.t >= 70) {
          f.spin = 0;
          o.spin = 0;
          o.noGravity = false;
          o.setState('hurt');
          m.tryHit(f, o, o.hurtbox(), {
            id: 'throw', dmg: 10, kb: 12, stun: 30, launch: 13, knockdown: true, unblockable: true, big: true,
          });
          m.fx.text('DEATH ROLL... OF FUN!', f.x, G() - 200, '#9be15d', 34);
          d.phase = 'recover';
          d.t = 0;
          d.vulnerable = true;
          f.ultPose = 'croc_recover';
        }
      } else if (d.phase === 'recover') {
        f.spin = 0;
        d.t++;
        return d.t >= 22;
      }
      return false;
    },
  };

  // ---------------------------------------------------------------- roster
  SF.FIGHTERS = {
    kip: {
      id: 'kip', name: 'KIP', full: 'Kip the Kangaroo', emoji: '🦘', style: 'All-Rounder',
      height: 160, width: 56, portraitDx: 18, health: 105, speed: 4.4, jump: 16.5, power: 1.05, defense: 1, gravity: 1,
      walk: 'hop', stats: { power: 3, speed: 4, health: 3, jump: 4 },
      passive: 'Boxing gloves: quick, long punches',
      special: { name: 'Tail-Balance Double Kick', desc: 'Leans back on his tail and double-kicks forward.' },
      ultimate: { name: 'Boomer Bounce', desc: 'Leaps into the sky and crashes down. Jump to dodge the shockwave!' },
      intro: "G'day! Put 'em up, mate!",
      win: 'Too easy! Hop along now, mate!',
      stage: 'uluru',
      pal: { fur: '#c98a4b', furDark: '#a3672f', belly: '#f3dcb2', ear: '#f0a3a3', glove: '#e03a3a', gloveDark: '#a82424' },
      alt: { fur: '#a4a4b8', furDark: '#7f7f96', belly: '#ececf3', ear: '#f0a3a3', glove: '#2f6fe0', gloveDark: '#1d4aa0' },
      draw: drawKip,
      moves: withMoves(1.12, {
        frames: 40, pose: 'doublekick',
        update(f, o, m, fr) {
          if (fr < 18) f.vx = 5 * f.facing;
          if (fr === 7 || fr === 15) m.sfx('swing');
        },
        hits: [
          { from: 8, to: 11, box: { x: 10, y: -86, w: 88, h: 44 }, dmg: 6, kb: 3, stun: 20 },
          { from: 16, to: 19, box: { x: 10, y: -86, w: 94, h: 44 }, dmg: 8, kb: 9, stun: 22, knockdown: true, launch: 7 },
        ],
      }),
      ult: kipUlt,
    },
    koko: {
      id: 'koko', name: 'KOKO', full: 'Koko the Koala', emoji: '🐨', style: 'Sleepy Tank',
      height: 150, width: 66, health: 120, speed: 3.1, jump: 14, power: 1.1, defense: 1, gravity: 1.05,
      walk: 'waddle', stats: { power: 4, speed: 2, health: 5, jump: 2 }, projectile: true, napper: true,
      passive: 'Power Nap: crouch and keep still to snooze and heal a little',
      special: { name: 'Eucalyptus Leaf Toss', desc: 'Throws a spinning gum leaf across the screen.' },
      ultimate: { name: 'Gumtree Grumble', desc: 'Wakes up grumpy. A giant gum tree drops on the opponent. Move away!' },
      intro: '*yawn* ...Do we have to?',
      win: 'Now... where was I? Oh yeah. Nap time. Zzz...',
      stage: 'rainforest',
      pal: { fur: '#9aa3ad', furDark: '#78818c', belly: '#e3e6ea', inner: '#f7f7f7', nose: '#2b2b2b' },
      alt: { fur: '#c19a74', furDark: '#9a7753', belly: '#f1e2cf', inner: '#fff3e6', nose: '#3b2415' },
      draw: drawKoko,
      moves: withMoves(1, {
        frames: 34, pose: 'throw',
        update(f, o, m, fr) {
          if (fr === 12) spawnLeaf(f, m);
        },
        hits: [],
      }),
      ult: kokoUlt,
    },
    kooka: {
      id: 'kooka', name: 'KOOKA', full: 'Kooka the Kookaburra', emoji: '🐦', style: 'Aerial Ace',
      height: 150, width: 52, portraitDx: 8, health: 100, speed: 4.3, jump: 17, power: 1.05, defense: 1, gravity: 0.78,
      walk: 'strut', stats: { power: 2, speed: 4, health: 2, jump: 5 }, doubleJump: true,
      passive: 'Wings: can double jump and floats down slowly',
      special: { name: 'Dive-Bomb Peck', desc: 'Swoops down diagonally beak-first. Works in the air too!' },
      ultimate: { name: 'Laugh Attack', desc: 'A laugh so loud it makes foes dizzy, then three super swoops! Block the laugh to stop it.' },
      intro: 'Koo-koo-ka-ka! Ready to laugh?',
      win: 'HA-HA-HA-HA! Best laugh I\'ve had all day!',
      stage: 'bondi',
      pal: { cream: '#f4ecd8', brown: '#7a5230', brownDark: '#553820', blue: '#4b95d6', tail: '#b5652b', beakTop: '#3b3b3b', beakBot: '#e9dcb8', leg: '#8f8272' },
      alt: { cream: '#fdf7ee', brown: '#4d6d8f', brownDark: '#34506e', blue: '#f2b134', tail: '#6b8fb3', beakTop: '#2a2a2a', beakBot: '#e9dcb8', leg: '#8f8272' },
      draw: drawKooka,
      moves: withMoves(1, {
        frames: 70, pose: 'dive', air: true,
        update(f, o, m, fr) {
          const md = f.moveData;
          if (fr === 0) {
            md.landed = false;
            if (f.onGround()) f.vy = -10;
          }
          if (fr === 10) m.sfx('dive');
          if (fr >= 10 && !md.landed) {
            f.vx = 9 * f.facing;
            f.vy = 8.5;
            if (f.onGround()) {
              md.landed = true;
              f.vx = 2 * f.facing;
              f.moveEnd = fr + 14;
              m.fx.dust(f.x, G(), false);
            }
          }
        },
        hits: [{ from: 10, to: 69, cond: (f) => !f.moveData.landed, box: { x: -10, y: -120, w: 80, h: 90 }, dmg: 10, kb: 6, stun: 20, knockdown: true, launch: 6 }],
      }),
      ult: kookaUlt,
    },
    croc: {
      id: 'croc', name: 'CAPT. CROC', full: 'Captain Croc', emoji: '🐊', style: 'Grappler',
      height: 165, width: 62, portraitDx: 16, health: 108, speed: 3.4, jump: 14.5, power: 1.03, defense: 0.92, gravity: 1.05,
      walk: 'waddle', stats: { power: 5, speed: 2, health: 4, jump: 2 },
      passive: 'Thick Scales: takes 10% less damage',
      special: { name: 'Tail Sweep', desc: 'Spins around, sweeping both sides with his tail. Jump over it!' },
      ultimate: { name: 'Death Roll... of Fun!', desc: 'Lunges forward, grabs, rolls and throws. Can\'t be blocked, so jump away!' },
      intro: "Ahoy! Captain Croc, reportin' for snappy duty!",
      win: 'Arr, that be a fair dinkum death roll... of FUN!',
      stage: 'harbour',
      pal: { green: '#4e9b3c', greenDark: '#39772b', belly: '#d6e08a', hat: '#1d2f5c', gold: '#f2c230' },
      alt: { green: '#8c9a3b', greenDark: '#6b7729', belly: '#efe7b0', hat: '#8a1c1c', gold: '#f2c230' },
      draw: drawCroc,
      moves: withMoves(1.05, {
        frames: 42, pose: 'tailspin',
        update(f, o, m, fr) {
          if (fr === 8) m.sfx('spin');
        },
        hits: [{ from: 10, to: 22, box: { x: -115, y: -48, w: 230, h: 44 }, dmg: 9, kb: 6, stun: 22, knockdown: true, launch: 6 }],
      }),
      ult: crocUlt,
    },
  };

  SF.ROSTER = ['kip', 'koko', 'kooka', 'croc'];

  // Fighters coming in a later update (shown locked on the select screen).
  SF.COMING_SOON = [
    { name: 'Taz', full: 'Taz the Tassie Devil', emoji: '🌪️' },
    { name: 'Shelly', full: 'Shelly the Sea Turtle', emoji: '🐢' },
    { name: 'Lizzie', full: 'Lizzie the Frill-neck', emoji: '🦎' },
    { name: 'Cheeky', full: 'Cheeky the Cockatoo', emoji: '🦜' },
  ];

  // Shared with the other roster files.
  SF.FH = { leanAround, clipEll, baseMoves, withMoves };

  SF.HIT_WORDS = ['POW!', 'BONK!', 'WHACK!', 'BOOF!', 'THWACK!', 'CRIKEY!', 'BIFF!'];
  SF.KO_WORDS = ['STREWTH!', 'FAIR DINKUM!', 'CRIKEY!', 'RIPPER!', 'BONZA!', "G'DAY, MATE!"];
})();
