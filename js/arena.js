// Boomerang Arena: a top-down mode where fighters run around in every
// direction and throw boomerangs. On a shared touch screen the two players
// sit face-to-face, with Player 2's controls and HUD turned to face them.
(() => {
  const W = SF.W;
  const H = SF.H;
  const D = SF.D;
  const SCALE = 0.5;
  const R = 22; // fighter radius
  const CINE = 46;
  let seq = 0;

  const RANG_COLORS = {
    kip: '#e03a3a', koko: '#6fbf73', kooka: '#4b95d6', croc: '#f2c230', spike: '#f1e3c0', dotty: '#ff5a8a',
    wombo: '#e53935', dash: '#e8892b', taz: '#ff7b54', shelly: '#5fd3f0', lizzie: '#ffc93c', cheeky: '#ffd400',
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  SF.SLOT_COLORS = ['#ff6b6b', '#4ab3ff', '#5ad17a', '#ffd24a'];
  // Four-player seats: P1 bottom-left, P2 top-right, P3 bottom-right, P4 top-left.
  const SEATS = [
    { x: 200, y: 410, rot: 0, hx: 0.25, hy: 1 },
    { x: 760, y: 170, rot: Math.PI, hx: 0.75, hy: 0 },
    { x: 760, y: 410, rot: 0, hx: 0.74, hy: 1 },
    { x: 200, y: 170, rot: Math.PI, hx: 0.26, hy: 0 },
  ];
  const norm = (x, y) => {
    const l = Math.hypot(x, y) || 1;
    return { x: x / l, y: y / l };
  };

  // ================================================================= fighter
  class ArenaFighter {
    constructor(id, side, m, alt) {
      this.def = SF.FIGHTERS[id];
      this.side = side;
      this.m = m;
      this.pal = alt ? this.def.alt : this.def.pal;
      this.maxHp = this.def.health;
      this.meter = 0;
      this.anim = side * 37;
      this.handicap = 1;
      this.hitIds = new Set();
      this.ultSeq = 0;
      this.reset();
    }

    reset() {
      const t = this.m.o.table;
      if (this.m.f4) {
        const seat = SEATS[this.side];
        this.x = seat.x;
        this.y = seat.y;
        this.aim = norm(W / 2 - seat.x, H / 2 - seat.y);
        this.facing = this.aim.x > 0 ? 1 : -1;
      } else {
        this.x = t ? W / 2 + (this.side ? 40 : -40) : this.side ? 700 : 260;
        this.y = t ? (this.side ? 140 : 420) : 290;
        this.aim = t ? { x: 0, y: this.side ? 1 : -1 } : { x: this.side ? -1 : 1, y: 0 };
        this.facing = this.side ? -1 : 1;
      }
      this.z = 0;
      this.vx = this.vy = 0;
      this.hp = this.maxHp;
      this.dispHp = this.maxHp;
      this.state = 'intro';
      this.st = 0;
      this.stun = 0;
      this.kd = false;
      this.invuln = 0;
      this.dashCD = 0;
      this.hasRang = true;
      this.buffer = null;
      this.prev = SF.blankInput();
      this.inp = SF.blankInput();
      this.ult = null;
      this.spin = 0;
      this.hidden = false;
      this.noClamp = false;
      this.buff = null;
      this.trail = null;
      this.wasReady = this.meter >= 100;
    }

    setState(s) {
      if (this.state !== s) {
        this.state = s;
        this.st = 0;
      }
    }

    spd() {
      return (2.3 + this.def.speed * 0.42) * (this.buff ? 1.35 : 1);
    }

    raging() {
      return !!this.def.rage && this.hp > 0 && this.hp < this.maxHp * 0.3;
    }

    setInput(raw) {
      const inp = Object.assign({}, raw);
      ['punch', 'kick', 'special', 'charge'].forEach((a) => (inp['p' + a] = raw[a] && !this.prev[a]));
      this.prev = raw;
      this.inp = inp;
      if (inp.ppunch) this.buffer = { a: 'punch', t: 0 };
      if (inp.pkick) this.buffer = { a: 'kick', t: 0 };
      if (inp.pspecial) this.buffer = { a: 'special', t: 0 };
      if (inp.pcharge && this.meter >= 100) this.buffer = { a: 'charge', t: 0 };
    }

    dir() {
      const i = this.inp;
      const dx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      const dy = (i.down ? 1 : 0) - (i.up ? 1 : 0);
      return dx || dy ? norm(dx, dy) : null;
    }

    setAim(d) {
      this.aim = d;
      if (Math.abs(d.x) > 0.2) this.facing = d.x > 0 ? 1 : -1;
    }

    update() {
      const m = this.m;
      const foes = m.foesOf(this);
      this.anim++;
      this.st++;
      if (this.invuln > 0) this.invuln--;
      if (this.dashCD > 0) this.dashCD--;
      if (this.buffer && ++this.buffer.t > 10) this.buffer = null;
      if (this.buff && --this.buff.t <= 0) this.buff = null;
      if (this.buff && this.anim % 4 === 0) m.fx.chargeBit(this.x, this.y - 30, '#ff8ad8');
      if (this.raging() && this.anim % 5 === 0) m.fx.chargeBit(this.x, this.y - 40, '#ff5a3c');

      switch (this.state) {
        case 'idle':
        case 'run':
        case 'charge':
          this.neutral();
          break;
        case 'punch':
          this.vx *= 0.7;
          this.vy *= 0.7;
          if (this.st >= 5 && this.st <= 8) foes.forEach((o) => this.melee(o, 'p' + this.moveId, 78, 0.45, { dmg: 7, kb: 7, stun: 16 }));
          if (this.st >= 18) this.setState('idle');
          break;
        case 'dash':
          if (this.st <= 11) {
            this.vx = this.aim.x * 10;
            this.vy = this.aim.y * 10;
          } else {
            this.vx *= 0.7;
            this.vy *= 0.7;
          }
          if (this.st % 3 === 0 && this.st < 12) m.fx.dust(this.x, this.y, false);
          if (this.st >= 2 && this.st <= 12) {
            const hx = this.x + this.aim.x * 18;
            const hy = this.y + this.aim.y * 18;
            foes.forEach((o) => {
              if (Math.hypot(o.x - hx, o.y - hy) < 40 + R) {
                m.hit(this, o, { id: 'd' + this.moveId, dmg: 9, kb: 11, stun: 22, knockdown: true }, this.x, this.y);
              }
            });
          }
          if (this.st >= 24) this.setState('idle');
          break;
        case 'throw':
          this.vx *= 0.6;
          this.vy *= 0.6;
          if (this.st === 5) m.throwRang(this);
          if (this.st >= 14) this.setState('idle');
          break;
        case 'hurt':
          this.vx *= 0.86;
          this.vy *= 0.86;
          if (--this.stun <= 0) {
            if (this.kd) {
              this.kd = false;
              this.setState('down');
              this.invuln = 60;
              m.fx.dust(this.x, this.y, true);
              m.sfx('land');
            } else this.setState('idle');
          }
          break;
        case 'down':
          this.vx *= 0.8;
          this.vy *= 0.8;
          if (this.st >= 40) this.setState('getup');
          break;
        case 'getup':
          if (this.st >= 14) this.setState('idle');
          break;
        case 'dizzy':
          this.vx *= 0.8;
          this.vy *= 0.8;
          if (--this.stun <= 0) this.setState('idle');
          break;
        case 'ult':
          this.ultFrame++;
          if (ULTS[this.def.id](this, this.ult.target, m, this.ultFrame)) this.endUlt();
          break;
        case 'intro':
        case 'victory':
        case 'grabbed':
        case 'ultCine':
          this.vx *= 0.8;
          this.vy *= 0.8;
          break;
        case 'ko':
          this.vx *= 0.9;
          this.vy *= 0.9;
          break;
      }
      this.physics();
      if (this.hp < this.dispHp) this.dispHp = Math.max(this.hp, this.dispHp - 0.6);
      else this.dispHp = this.hp;
      const ready = this.meter >= 100;
      if (ready && !this.wasReady && m.roundState === 'fight') {
        m.sfx('ready');
        m.fx.text('ULTIMATE READY!', this.x, this.y - 90, '#ffd24a', 24);
      }
      this.wasReady = ready;
    }

    neutral() {
      const d = this.dir();
      if (d) this.setAim(d);
      const b = this.buffer ? this.buffer.a : null;
      if (b) {
        this.buffer = null;
        if (b === 'charge' && this.meter >= 100) return this.startUlt();
        if (b === 'punch') {
          this.moveId = seq++;
          this.m.sfx('swing');
          return this.setState('punch');
        }
        if (b === 'kick' && this.dashCD <= 0) {
          this.moveId = seq++;
          this.dashCD = 34;
          this.invuln = Math.max(this.invuln, 7);
          this.m.sfx('dive');
          return this.setState('dash');
        }
        if (b === 'special' && this.hasRang) return this.setState('throw');
      }
      if (this.inp.charge && this.meter < 100 && !d) {
        this.setState('charge');
        this.vx *= 0.5;
        this.vy *= 0.5;
        this.meter = Math.min(100, this.meter + 0.42);
        if (this.st % 3 === 0) this.m.fx.chargeBit(this.x, this.y);
        if (this.st % 10 === 0) this.m.sfx('charge');
        return;
      }
      if (d) {
        this.setState('run');
        this.vx = d.x * this.spd();
        this.vy = d.y * this.spd();
      } else {
        this.setState('idle');
        this.vx *= 0.5;
        this.vy *= 0.5;
      }
    }

    melee(opp, id, range, cone, props) {
      const dx = opp.x - this.x;
      const dy = opp.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > range) return;
      const dot = d < 1 ? 1 : (dx * this.aim.x + dy * this.aim.y) / d;
      if (dot < cone) return;
      this.m.hit(this, opp, Object.assign({ id }, props), this.x, this.y);
    }

    startUlt() {
      if (this.m.cine) return;
      this.meter = 0;
      this.wasReady = false;
      this.vx = this.vy = 0;
      this.setState('ultCine');
      this.m.startCinematic(this);
    }

    beginUlt() {
      this.ultSeq++;
      this.ultFrame = 0;
      this.ult = { vulnerable: false, target: this.m.nearestFoe(this) };
      this.setState('ult');
    }

    cleanupUlt() {
      this.ult = null;
      this.ultPose = null;
      this.spin = 0;
      this.hidden = false;
      this.noClamp = false;
      this.z = 0;
      this.trail = null;
      this.clampPos();
    }

    endUlt() {
      this.cleanupUlt();
      this.setState('idle');
    }

    clampPos() {
      const b = this.m.bounds;
      this.x = SF.clamp(this.x, b.x0, b.x1);
      this.y = SF.clamp(this.y, b.y0, b.y1);
    }

    physics() {
      if (this.state === 'grabbed') return;
      this.x += this.vx;
      this.y += this.vy;
      if (this.noClamp) return;
      this.clampPos();
      for (const o of this.m.obstacles) {
        const dx = this.x - o.x;
        const dy = this.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        const min = o.r + R * 0.8;
        if (d < min) {
          this.x = o.x + (dx / d) * min;
          this.y = o.y + (dy / d) * min;
        }
      }
    }

    // ---------------------------------------------------------- drawing
    pose() {
      const t = this.anim;
      const p = {
        t, bob: 0, lean: 0, head: 0, beak: 0.05, armF: 0.5, armB: 0.25, armFExt: 1, armBExt: 1,
        legF: 0.12, legB: -0.12, legFExt: 1, legBExt: 1, sx: 1, sy: 1, tail: 0, face: 'normal', lie: 0, flip: 1,
      };
      const s = Math.sin(t * 0.08);
      switch (this.state) {
        case 'idle':
        case 'intro':
          p.bob = s * 2;
          p.armF = 0.55 + s * 0.08;
          break;
        case 'run': {
          const w = Math.sin(t * 0.3);
          if (this.def.walk === 'hop') {
            p.bob = -Math.abs(w) * 14;
            p.legF = 0.3;
            p.legB = 0.1;
            p.armF = 0.8;
          } else {
            p.legF = w * 0.6;
            p.legB = -w * 0.6;
            p.armF = 0.4 - w * 0.5;
            p.armB = 0.2 + w * 0.5;
            p.bob = -Math.abs(Math.cos(t * 0.3)) * 4;
            p.lean = 0.12;
          }
          break;
        }
        case 'charge':
          p.armF = 1.9;
          p.armB = -1.9;
          p.face = 'attack';
          p.bob = Math.sin(t * 0.9) * 1.5;
          break;
        case 'punch': {
          const k = this.st < 5 ? -0.3 : this.st <= 9 ? 1 : Math.max(0, 1 - (this.st - 9) / 9);
          p.armF = 0.4 + k * 1.2;
          p.armFExt = 1 + Math.max(0, k) * 0.5;
          p.lean = 0.12 * k;
          p.face = 'attack';
          p.beak = 0.3;
          break;
        }
        case 'dash':
          p.legF = 1.4;
          p.legFExt = 1.25;
          p.legB = 0.2;
          p.lean = -0.25;
          p.armF = 1.2;
          p.armB = -0.8;
          p.face = 'attack';
          break;
        case 'throw':
          p.armF = this.st < 5 ? -2.4 : 1.4;
          p.armFExt = 1.1;
          p.face = 'attack';
          p.lean = this.st < 5 ? -0.15 : 0.2;
          break;
        case 'hurt':
          p.lean = -0.35;
          p.armF = -0.6;
          p.armB = -1.0;
          p.face = 'hurt';
          break;
        case 'dizzy':
          p.lean = Math.sin(t * 0.12) * 0.2;
          p.face = 'dizzy';
          break;
        case 'down':
        case 'ko':
          p.lie = 1;
          p.face = this.state === 'ko' ? 'ko' : 'hurt';
          p.armF = 2.6;
          p.armB = 2.2;
          break;
        case 'getup':
          p.lie = Math.max(0, 1 - this.st / 10);
          break;
        case 'grabbed':
          p.face = 'hurt';
          p.armF = 2.5;
          p.armB = 2.2;
          break;
        case 'victory':
          p.face = 'happy';
          p.armF = 2.8;
          p.armB = 2.6;
          p.bob = -Math.abs(Math.sin(t * 0.12)) * 12;
          p.beak = 0.35;
          break;
        case 'ultCine':
          p.face = 'attack';
          p.armF = 2.6;
          p.armB = -1.6;
          p.beak = 0.35;
          break;
        case 'ult':
          p.face = 'attack';
          p.beak = 0.3;
          p.armF = 1.6;
          p.armB = 1.2;
          if (this.ultPose) Object.assign(p, this.ultPose(t));
          break;
      }
      return p;
    }

    draw(ctx, tag) {
      if (this.hidden) return;
      const p = this.pose();
      if (this.trail) {
        this.trail.forEach((g, i) => {
          ctx.save();
          ctx.globalAlpha = 0.12 + i * 0.06;
          ctx.translate(g.x, g.y);
          ctx.scale(g.facing * SCALE, SCALE);
          this.def.draw(ctx, p, this.pal);
          ctx.restore();
        });
      }
      ctx.save();
      if (this.invuln > 0 && (this.state === 'getup' || this.state === 'idle' || this.state === 'run') && Math.floor(this.anim / 3) % 2) ctx.globalAlpha = 0.55;
      ctx.translate(this.x, this.y - this.z);
      if (this.meter >= 100 || this.state === 'charge' || this.state === 'ultCine') {
        const k = 0.5 + 0.5 * Math.sin(this.anim * 0.2);
        const g = ctx.createRadialGradient(0, -40, 5, 0, -40, 60);
        g.addColorStop(0, `rgba(255,230,90,${0.35 + k * 0.2})`);
        g.addColorStop(1, 'rgba(255,200,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -40, 50, 64, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      ctx.scale(this.facing * SCALE * p.flip, SCALE);
      if (p.lie > 0) {
        ctx.translate(0, -22 * p.lie);
        ctx.rotate((-Math.PI / 2) * p.lie);
      }
      if (this.spin) {
        ctx.translate(0, -this.def.height / 2);
        ctx.rotate(this.spin);
        ctx.translate(0, this.def.height / 2);
      }
      ctx.translate(0, p.bob);
      ctx.scale(p.sx, p.sy);
      if (p.ball != null && this.def.drawBall) this.def.drawBall(ctx, p, this.pal);
      else if (p.special && this.def.drawSpecial) this.def.drawSpecial(ctx, p, this.pal);
      else this.def.draw(ctx, p, this.pal);
      ctx.restore();
      if (this.state === 'dizzy' || this.state === 'ko') {
        for (let i = 0; i < 3; i++) {
          const a = this.anim * 0.12 + (i * Math.PI * 2) / 3;
          const hy = this.state === 'ko' ? -20 : -this.def.height * SCALE - 8;
          SF.D.star(ctx, Math.cos(a) * 20, hy + Math.sin(a) * 6, 6, '#ffe14a', a);
        }
      }
      if (tag && this.state !== 'ko') {
        const ty = -this.def.height * SCALE - 22;
        ctx.fillStyle = tag.color;
        ctx.beginPath();
        ctx.moveTo(-6, ty + 9);
        ctx.lineTo(6, ty + 9);
        ctx.lineTo(0, ty + 16);
        ctx.fill();
        SF.outlineText(ctx, tag.text, 0, ty, 16, tag.color);
      }
      ctx.restore();
    }

    drawShadow(ctx) {
      if (this.hidden && !this.target) return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      const s = Math.max(0.4, 1 - this.z / 300);
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, R * 1.1 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // aim arrow for the player
      if (['idle', 'run', 'charge'].includes(this.state) && this.m.roundState === 'fight' && this.hasRang) {
        const ax = this.x + this.aim.x * 34;
        const ay = this.y + this.aim.y * 34;
        ctx.fillStyle = this.side === 0 ? 'rgba(255,107,107,0.8)' : 'rgba(74,179,255,0.8)';
        const a = Math.atan2(this.aim.y, this.aim.x);
        ctx.translate(ax, ay);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 6);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ================================================================= boomerang
  class Rang {
    constructor(f) {
      this.owner = f;
      this.dir = { x: f.aim.x, y: f.aim.y };
      this.x = f.x + this.dir.x * 26;
      this.y = f.y + this.dir.y * 26;
      this.speed = 12.5;
      this.phase = 'out';
      this.t = 0;
      this.id = seq++;
      this.color = RANG_COLORS[f.def.id] || '#ffd24a';
    }
    turnBack() {
      if (this.phase === 'out') {
        this.phase = 'back';
        this.speed = 2;
      }
    }
    update(m) {
      this.t++;
      const f = this.owner;
      if (this.phase === 'out') {
        this.speed -= 0.36;
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
        const b = m.bounds;
        if (this.speed <= 0 || this.x < b.x0 - 20 || this.x > b.x1 + 20 || this.y < b.y0 - 30 || this.y > b.y1 + 20) this.turnBack();
        for (const o of m.obstacles) {
          if (!o.flat && Math.hypot(this.x - o.x, this.y - o.y) < o.r + 8) {
            this.turnBack();
            m.sfx('block');
            m.fx.blockSpark(this.x, this.y - 20);
          }
        }
      } else {
        const d = norm(f.x - this.x, f.y - this.y);
        this.speed = Math.min(13, this.speed + 0.55);
        this.x += d.x * this.speed;
        this.y += d.y * this.speed;
        if (Math.hypot(f.x - this.x, f.y - this.y) < 26 || this.t > 400) {
          this.dead = true;
          f.hasRang = true;
          if (f.state !== 'ko') m.fx.text('CATCH!', f.x, f.y - 80, '#fff', 18);
        }
      }
      for (const opp of m.foesOf(f)) {
        if (Math.hypot(opp.x - this.x, opp.y - this.y) < R + 16) {
          const r = m.hit(f, opp, { id: 'r' + this.id + this.phase, dmg: 10, kb: 9, stun: 18, word: 'THWACK!' }, this.x, this.y);
          if (r === 'hit') this.turnBack();
        }
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 4, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(this.x, this.y - 26);
      ctx.rotate(this.t * 0.55);
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.quadraticCurveTo(0, -4, 14, -14);
      ctx.quadraticCurveTo(18, -8, 12, -6);
      ctx.quadraticCurveTo(4, 0, 6, 14);
      ctx.quadraticCurveTo(0, 16, -2, 10);
      ctx.quadraticCurveTo(-4, -2, -18, -4);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = D.OUT;
      ctx.stroke();
      ctx.restore();
    }
  }

  // generic moving projectile (quills etc.)
  class Shot {
    constructor(owner, x, y, vx, vy, props, draw, life = 70) {
      Object.assign(this, { owner, x, y, vx, vy, props, drawFn: draw, life, id: seq++, t: 0 });
    }
    update(m) {
      this.t++;
      this.x += this.vx;
      this.y += this.vy;
      if (--this.life <= 0) this.dead = true;
      for (const o of m.obstacles) if (!o.flat && Math.hypot(this.x - o.x, this.y - o.y) < o.r) this.dead = true;
      for (const opp of m.foesOf(this.owner)) {
        if (!this.dead && Math.hypot(opp.x - this.x, opp.y - this.y) < R + 10) {
          if (m.hit(this.owner, opp, Object.assign({ id: 's' + this.id }, this.props), this.x, this.y) === 'hit') this.dead = true;
        }
      }
    }
    draw(ctx) {
      this.drawFn(ctx, this);
    }
  }

  // Something dropped onto a target spot after a warning circle.
  class Strike {
    constructor(owner, o) {
      Object.assign(this, { owner, t: -(o.delay || 0), warn: 34, track: 22, phase: 'warn', alpha: 1 }, o);
      this.id = 'k' + seq++;
      this.target = owner.ult && owner.ult.target ? owner.ult.target : owner.m.nearestFoe(owner);
      this.x = this.target.x + (o.dx || 0);
      this.y = this.target.y + (o.dy || 0);
    }
    dangerZone() {
      return this.t >= 0 && this.phase === 'warn' ? { x: this.x, y: this.y, r: this.radius + 30 } : null;
    }
    update(m) {
      this.t++;
      if (this.t < 0) return;
      if (this.phase === 'warn') {
        if (this.t < this.track) {
          this.x += SF.clamp(this.target.x + (this.dx || 0) - this.x, -5, 5);
          this.y += SF.clamp(this.target.y + (this.dy || 0) - this.y, -5, 5);
        }
        if (this.t >= this.warn) {
          this.phase = 'fall';
          this.ft = 0;
          if (this.kind === 'bird') m.sfx('dive');
          else m.sfx('whistle');
        }
      } else if (this.phase === 'fall') {
        this.ft++;
        if (this.ft >= 10) {
          this.phase = 'land';
          this.lt = 0;
          m.foesOf(this.owner).forEach((o) => {
            if (Math.hypot(o.x - this.x, o.y - this.y) < this.radius + R) {
              m.hit(this.owner, o, Object.assign({ id: this.id, word: this.word }, this.props), this.x, this.y);
            }
          });
          m.fx.shake(this.big ? 14 : 5);
          m.sfx(this.kind === 'geyser' ? 'splash' : this.big ? 'boom' : 'stomp');
          m.fx.dust(this.x, this.y, this.big);
          if (this.onImpact) this.onImpact(this, m);
        }
      } else {
        this.lt++;
        if (this.lt > 40) this.alpha -= 0.06;
        if (this.alpha <= 0) this.dead = true;
      }
    }
    drawBack(ctx) {
      if (this.t < 0 || this.phase !== 'warn') return;
      const k = Math.min(1, this.t / 10);
      ctx.save();
      ctx.strokeStyle = `rgba(255,60,60,${0.5 + 0.4 * Math.sin(this.t * 0.5)})`;
      ctx.fillStyle = 'rgba(255,60,60,0.15)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.radius * k, this.radius * 0.6 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    get sortY() {
      return this.y;
    }
    draw(ctx) {
      if (this.t < 0 || this.phase === 'warn') return;
      const z = this.phase === 'fall' ? (1 - this.ft / 10) * 320 : 0;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.translate(this.x, this.y - z);
      const s = this.radius / 50;
      if (this.kind === 'tree') {
        ctx.rotate(-0.25);
        SF.roundRect(ctx, -110, -22, 180, 26, 12);
        ctx.fillStyle = '#e8dccb';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        [[80, -14, 36], [104, 4, 30], [70, 14, 28], [110, -26, 24]].forEach(([x, y, r], i) =>
          D.ell(ctx, x, y, r, r * 0.8, ['#5b8f4a', '#6fa65a', '#4f7d40', '#6fa65a'][i])
        );
      } else if (this.kind === 'cube') {
        const c = 44 * s;
        SF.roundRect(ctx, -c, -c * 2, c * 2, c * 2, c * 0.28);
        ctx.fillStyle = '#7a4b25';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        D.eye(ctx, -c * 0.3, -c * 1.2, c * 0.14, this.phase === 'land' ? 'happy' : 'normal', 0, false);
        D.eye(ctx, c * 0.3, -c * 1.2, c * 0.14, this.phase === 'land' ? 'happy' : 'normal', 0, false);
        D.mouth(ctx, 0, -c * 0.7, c * 0.5, 'happy');
      } else if (this.kind === 'geyser') {
        if (this.phase === 'land') {
          const h = 200 * Math.min(1, this.lt / 5) * Math.max(0, 1 - this.lt / 40);
          ctx.fillStyle = 'rgba(120,200,255,0.85)';
          ctx.fillRect(-this.radius * 0.6, -h, this.radius * 1.2, h);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#1a5b8a';
          ctx.strokeRect(-this.radius * 0.6, -h, this.radius * 1.2, h);
          for (let i = 0; i < 6; i++) D.ell(ctx, Math.cos(i + this.lt * 0.2) * this.radius * 0.8, -h + Math.sin(i) * 10, 8, 8, '#bfeaff', 0, false);
        }
        D.ell(ctx, 0, 0, this.radius, this.radius * 0.35, '#3e9fd8');
      } else if (this.kind === 'bird') {
        const p = {
          t: this.t, bob: 0, lean: this.phase === 'fall' ? 1.3 : 0, head: 0, beak: 0.4, armF: 2.2, armB: 2.0,
          armFExt: 1, armBExt: 1, legF: 0.1, legB: -0.1, legFExt: 1, legBExt: 1, sx: 1, sy: 1, tail: 0,
          face: 'laugh', lie: 0, flip: 1, crest: 1,
        };
        ctx.scale(this.big ? 0.6 : 0.35, this.big ? 0.6 : 0.35);
        SF.FIGHTERS.cheeky.draw(ctx, p, SF.FIGHTERS.cheeky.pal);
      }
      ctx.restore();
    }
  }

  // A band of water or a mob of emus sweeping across the arena.
  class Sweep {
    constructor(owner, kind, dir, y) {
      Object.assign(this, { owner, kind, dir, y, t: 0, id: 'w' + seq++ });
      this.x = dir > 0 ? -120 : W + 120;
      this.hitDone = new Set();
    }
    update(m) {
      this.t++;
      this.x += this.dir * (this.kind === 'wave' ? 11 : 13);
      const foes = m.foesOf(this.owner);
      if (this.kind === 'wave') {
        foes.forEach((o) => {
          if (Math.abs(o.x - this.x) < 70) {
            m.hit(this.owner, o, { id: this.id, dmg: 20, kb: 14, stun: 30, knockdown: true, big: true, word: 'SPLASH!', kbDir: { x: this.dir, y: 0 } }, this.x, o.y);
          }
        });
      } else {
        this.emus.forEach((e, i) => {
          const ex = this.x - this.dir * e.off;
          foes.forEach((o) => {
            if (Math.abs(o.x - ex) < 34 && Math.abs(o.y - e.y) < 40) {
              const last = i === this.emus.length - 1;
              m.hit(this.owner, o, {
                id: this.id + i, dmg: last ? 8 : 3.5, kb: last ? 12 : 5, stun: 26, knockdown: last, big: last, light: !last,
                kbDir: { x: this.dir, y: 0 },
              }, ex, e.y);
            }
          });
        });
        if (this.t % 5 === 0) m.fx.dust(this.x - this.dir * 30, this.y, false);
      }
      if ((this.dir > 0 && this.x > W + 700) || (this.dir < 0 && this.x < -700)) this.dead = true;
    }
    get sortY() {
      return this.kind === 'wave' ? H : this.y;
    }
    draw(ctx) {
      if (this.kind === 'wave') {
        ctx.save();
        ctx.translate(this.x, 0);
        ctx.scale(this.dir, 1);
        ctx.fillStyle = 'rgba(30,140,210,0.85)';
        ctx.beginPath();
        ctx.moveTo(-160, 0);
        ctx.lineTo(30, 0);
        for (let y = 0; y <= H; y += 30) ctx.lineTo(40 + Math.sin(y * 0.05 + this.t * 0.3) * 14, y);
        ctx.lineTo(-160, H);
        ctx.fill();
        ctx.fillStyle = '#fff';
        for (let y = 0; y <= H; y += 26) {
          ctx.beginPath();
          ctx.arc(40 + Math.sin(y * 0.05 + this.t * 0.3) * 14, y, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        [[-60, 120, '#ffb03a'], [-100, 300, '#ff6b8a'], [-40, 440, '#ffd400']].forEach(([fx, fy, col]) => {
          D.ell(ctx, fx, fy, 14, 8, col);
          D.poly(ctx, [fx - 12, fy, fx - 22, fy - 8, fx - 22, fy + 8], col);
        });
        ctx.restore();
        return;
      }
      this.emus.forEach((e) => {
        const ex = this.x - this.dir * e.off;
        const run = this.t * 0.5 + e.off;
        const p = {
          t: this.t, bob: -Math.abs(Math.sin(run)) * 8, lean: 0.35, head: 0.3, beak: 0.3, armF: 0.8, armB: 0.3, armFExt: 1, armBExt: 1,
          legF: Math.sin(run) * 0.9, legB: -Math.sin(run) * 0.9, legFExt: 1, legBExt: 1, sx: 1, sy: 1, tail: 0,
          face: 'attack', lie: 0, flip: 1,
        };
        ctx.save();
        ctx.translate(ex, e.y);
        ctx.scale(this.dir * SCALE, SCALE);
        SF.FIGHTERS.dash.draw(ctx, p, SF.FIGHTERS.dash.pal);
        ctx.restore();
      });
    }
  }

  // Kooka's laugh ring.
  class Ring {
    constructor(owner, props, color) {
      Object.assign(this, { owner, props, color, r: 10, t: 0, x: owner.x, y: owner.y - 30, tested: new Set() });
    }
    update(m) {
      this.t++;
      this.r += 16;
      m.foesOf(this.owner).forEach((o) => {
        if (!this.tested.has(o) && Math.hypot(o.x - this.x, o.y - 30 - this.y) < this.r) {
          this.tested.add(o);
          const r = m.hit(this.owner, o, Object.assign({ id: 'ring' }, this.props), this.x, this.y);
          if (this.owner.ult && o === this.owner.ult.target) this.result = r;
        }
      });
      if (this.r > 1100) this.dead = true;
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.7 - this.r / 1500);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r, this.r * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  const quillDraw = (ctx, s) => {
    ctx.save();
    ctx.translate(s.x, s.y - 24);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    D.poly(ctx, [-12, -4, 12, 0, -12, 4], '#f1e3c0');
    D.line(ctx, 6, 0, 12, 0, 3, '#3a2a1c');
    ctx.restore();
  };

  // ================================================================= ultimates (arena versions)
  const strikes = (f, list) => list.forEach((o) => f.m.entities.push(new Strike(f, o)));
  const onceAt = (fr, n, fn) => fr === n && fn();

  const ULTS = {
    kip(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        m.sfx('boing');
        f.noClamp = true;
        f.ultPose = () => ({ sy: 1.2, sx: 0.85, armF: 2.8, armB: 2.7, face: 'happy' });
      }
      if (fr < 20) f.z += 22;
      if (fr === 20) {
        f.hidden = true;
        u.tx = f.x;
        u.ty = f.y;
      }
      if (fr >= 20 && fr < 64) {
        u.tx += SF.clamp(o.x - u.tx, -7, 7);
        u.ty += SF.clamp(o.y - u.ty, -7, 7);
        f.x = u.tx;
        f.y = u.ty;
        f.target = true;
        if (fr === 21) m.entities.push({ update() { this.dead = f.state !== 'ult' || f.z <= 0; }, drawBack: (ctx) => {
          ctx.save();
          ctx.strokeStyle = `rgba(255,60,60,${0.6 + 0.3 * Math.sin(m.t * 0.4)})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(f.x, f.y, 120, 72, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }, draw() {} });
      }
      if (fr === 64) {
        f.hidden = false;
        m.sfx('whistle');
        f.ultPose = () => ({ sy: 1.15, armF: 2.6, armB: 2.5 });
      }
      if (fr > 64 && f.z > 0) f.z = Math.max(0, f.z - 36);
      if (fr > 64 && f.z === 0 && !u.landed) {
        u.landed = true;
        f.target = false;
        f.noClamp = false;
        m.fx.shake(22);
        m.sfx('boom');
        m.fx.shockwave(f.x, f.y);
        m.fx.text('BOOMER BOUNCE!', f.x, f.y - 120, '#ffcf3f', 34);
        m.foesOf(f).forEach((e) => {
          if (dist(f, e) < 130 + R) m.hit(f, e, { id: 'quake', dmg: 24, kb: 12, stun: 30, knockdown: true, big: true }, f.x, f.y);
        });
        u.vulnerable = true;
        f.ultPose = () => ({ sy: 0.72, sx: 1.25, armF: 1.6, armB: -1.6 });
      }
      return u.landed && fr > 90;
    },
    koko(f, o, m, fr) {
      f.ultPose = () => ({ face: 'grumpy', armF: 2.5, armB: 2.3, bob: Math.floor(fr / 10) % 2 ? -4 : 0 });
      onceAt(fr, 4, () => m.fx.text('GRRR!', f.x, f.y - 100, '#ff7b54', 32));
      onceAt(fr, 10, () => strikes(f, [{ kind: 'tree', radius: 100, big: true, word: 'TIMBER!', props: { dmg: 24, kb: 10, stun: 30, knockdown: true, big: true } }]));
      if (fr >= 30) f.ult.vulnerable = true;
      return fr >= 40;
    },
    kooka(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        m.sfx('laugh');
        u.ring = new Ring(f, { dmg: 6, kb: 2, stun: 12, dizzy: 160 }, '#fff6a8');
        m.entities.push(u.ring);
        f.ultPose = () => ({ face: 'laugh', lean: -0.3, head: -0.45, beak: 0.55, armF: 1.8 + Math.sin(f.anim * 0.8) * 0.8 });
      }
      if (fr < 45 && fr % 12 === 0) m.fx.text('HA!', f.x + SF.rand(-30, 30), f.y - 100, '#fff6a8', 24);
      if (fr === 45) {
        if (!(u.ring.result === 'hit' && o.state === 'dizzy')) return true;
        u.pass = 0;
        u.startPass = () => {
          const a = SF.rand(0, Math.PI * 2);
          u.dir = { x: Math.cos(a), y: Math.sin(a) * 0.6 };
          const d = norm(u.dir.x, u.dir.y);
          u.dir = d;
          f.x = o.x - d.x * 520;
          f.y = o.y - d.y * 520;
          f.facing = d.x >= 0 ? 1 : -1;
          f.noClamp = true;
          u.travel = 0;
          m.sfx('dive');
        };
        u.startPass();
        f.ultPose = () => ({ lean: 1.35, armF: -1.8, armB: -2.0, legF: -1.2, legB: -1.3, beak: 0.02 });
      }
      if (fr > 45) {
        f.x += u.dir.x * 24;
        f.y += u.dir.y * 24;
        u.travel += 24;
        if (dist(f, o) < 44) {
          m.hit(f, o, { id: 'sw' + u.pass, dmg: 7, kb: 3, stun: 20, keepDizzy: u.pass < 2, knockdown: u.pass === 2, big: u.pass === 2 }, f.x - u.dir.x * 10, f.y - u.dir.y * 10);
        }
        if (u.travel > 1040) {
          u.pass++;
          if (u.pass >= 3 || o.state === 'ko') {
            f.noClamp = false;
            f.x = SF.clamp(o.x + (o.x < W / 2 ? 200 : -200), m.bounds.x0, m.bounds.x1);
            f.y = o.y;
            return true;
          }
          u.startPass();
        }
      }
      return false;
    },
    croc(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        const d = norm(o.x - f.x, o.y - f.y);
        f.setAim(d);
        u.phase = 'lunge';
        m.sfx('chomp');
        f.ultPose = () => ({ lean: 0.45, armF: 1.6, armB: 1.5, armFExt: 1.2, beak: 0.5 });
      }
      if (u.phase === 'lunge') {
        f.vx = f.aim.x * 11;
        f.vy = f.aim.y * 11;
        if (dist(f, o) < 52 && o.invuln <= 0 && !['down', 'getup', 'ko', 'ult'].includes(o.state)) {
          u.phase = 'roll';
          u.t = 0;
          o.setState('grabbed');
          m.fx.text('CHOMP!', o.x, o.y - 90, '#9be15d', 34);
          m.sfx('chomp');
        } else if (fr > 26) {
          u.phase = 'miss';
          u.t = 0;
          u.vulnerable = true;
        }
      } else if (u.phase === 'miss') {
        f.vx *= 0.8;
        f.vy *= 0.8;
        return ++u.t > 24;
      } else if (u.phase === 'roll') {
        u.t++;
        f.vx = f.vy = 0;
        f.spin = u.t * 0.42;
        o.spin = u.t * 0.42;
        o.x = f.x + f.aim.x * 40;
        o.y = f.y + f.aim.y * 40;
        f.ultPose = () => ({ armF: 1.3, armB: 1.2, face: 'happy' });
        if (u.t % 14 === 7) {
          m.hit(f, o, { id: 'roll' + u.t, dmg: 4, kb: 0, stun: 40, hold: true }, f.x, f.y);
          m.sfx('spin');
        }
        if (o.state === 'ko') {
          f.spin = o.spin = 0;
          return true;
        }
        if (u.t >= 56) {
          f.spin = o.spin = 0;
          o.setState('hurt');
          m.hit(f, o, { id: 'throw', dmg: 10, kb: 14, stun: 30, knockdown: true, big: true, word: 'DEATH ROLL!' }, f.x, f.y);
          u.phase = 'recover';
          u.t = 0;
          u.vulnerable = true;
        }
      } else {
        return ++u.t > 20;
      }
      return false;
    },
    spike(f, o, m, fr) {
      f.ultPose = () => ({ ball: f.anim * 0.45 });
      if (fr === 2) m.fx.text('QUILL STORM!', f.x, f.y - 90, '#f1e3c0', 32);
      [10, 24, 38, 52].forEach((n, k) => {
        if (fr === n) {
          const count = k === 3 ? 20 : 14;
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + k * 0.2;
            m.entities.push(new Shot(f, f.x, f.y, Math.cos(a) * 8, Math.sin(a) * 8 * 0.8, { dmg: k === 3 ? 4 : 3, kb: 4, stun: 14, light: k < 3 }, quillDraw, 70));
          }
          m.sfx('spin');
        }
      });
      if (fr >= 56) f.ult.vulnerable = true;
      return fr >= 64;
    },
    dotty(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        m.sfx('splash');
        f.ultPose = () => ({ lean: 0.6, armF: 2.8, armB: 2.6 });
      }
      if (fr === 10) {
        f.hidden = true;
        m.fx.dust(f.x, f.y, false);
        strikes(f, [{
          kind: 'geyser', radius: 70, warn: 42, track: 38, big: true, word: 'SPLOOSH!',
          props: { dmg: 22, kb: 6, stun: 30, dizzy: 70, big: true },
          onImpact: (s) => {
            f.hidden = false;
            f.x = s.x;
            f.y = s.y + 10;
            f.clampPos();
            u.done = fr;
            f.ultPose = () => ({ face: 'laugh', armF: 2.8, armB: 2.6, beak: 0.6 });
            m.fx.text('BILLABONG BLAST!', s.x, s.y - 140, '#5fd3f0', 32);
          },
        }]);
      }
      if (u.done) u.vulnerable = true;
      return !!u.done && fr > u.done + 24;
    },
    wombo(f, o, m, fr) {
      f.ultPose = () => ({ face: 'grumpy', sy: 0.85, sx: 1.1, bob: Math.sin(f.anim * 1.3) * 1.5 });
      onceAt(fr, 4, () => m.fx.text('HNNNGG...', f.x, f.y - 90, '#c9a27c', 26));
      onceAt(fr, 10, () => {
        const list = [];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          list.push({ kind: 'cube', radius: 42, dx: Math.cos(a) * 95, dy: Math.sin(a) * 60, delay: i * 7, warn: 28, track: 14, word: 'PLOP!', props: { dmg: 6, kb: 5, stun: 26 } });
        }
        list.push({ kind: 'cube', radius: 64, delay: 50, warn: 28, track: 20, big: true, word: 'CUBE CRUSHER!', props: { dmg: 12, kb: 10, stun: 30, knockdown: true, big: true } });
        strikes(f, list);
      });
      if (fr >= 50) f.ult.vulnerable = true;
      return fr >= 60;
    },
    dash(f, o, m, fr) {
      f.ultPose = () => (fr < 20 ? { head: -0.4, beak: 0.5, face: 'laugh', armF: 2.5 } : { face: 'happy', bob: -Math.abs(Math.sin(f.anim * 0.3)) * 10, armF: 2.8 });
      onceAt(fr, 2, () => {
        m.sfx('whistle');
        m.fx.text('EMU STAMPEDE!', f.x, f.y - 100, '#e8892b', 34);
        const dir = o.x >= f.x ? 1 : -1;
        const s = new Sweep(f, 'emus', dir, o.y);
        s.emus = [];
        for (let i = 0; i < 8; i++) s.emus.push({ off: i * 70, y: SF.clamp(o.y + SF.rand(-50, 50), m.bounds.y0, m.bounds.y1) });
        s.emus[7].y = o.y;
        m.entities.push(s);
      });
      if (fr >= 40) f.ult.vulnerable = true;
      return fr >= 50;
    },
    taz(f, o, m, fr) {
      if (fr < 84) {
        f.ultPose = () => ({ special: true });
        const d = norm(o.x - f.x, o.y - f.y);
        f.vx = SF.clamp(f.vx + d.x * 0.8, -6, 6);
        f.vy = SF.clamp(f.vy + d.y * 0.8, -6, 6);
        if (fr % 12 === 0) m.sfx('spin');
        if (fr % 4 === 0) m.fx.dust(f.x, f.y, false);
        if (fr % 6 === 0) m.foesOf(f).forEach((e) => dist(f, e) < 56 && m.hit(f, e, { id: 'tw' + fr, dmg: 2, kb: 3, stun: 22, light: true }, f.x, f.y));
      }
      if (fr === 84) {
        f.vx = f.vy = 0;
        m.foesOf(f).forEach((e) => dist(f, e) < 80 && m.hit(f, e, { id: 'twf', dmg: 9, kb: 12, stun: 30, knockdown: true, big: true }, f.x, f.y));
        f.ultPose = () => ({ face: 'dizzy', lean: Math.sin(f.anim * 0.2) * 0.25 });
        f.ult.vulnerable = true;
      }
      return fr >= 104;
    },
    shelly(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        m.fx.text("SURF'S UP!", f.x, f.y - 100, '#5fd3f0', 34);
        f.ultPose = () => ({ face: 'happy', armF: 2.7, armB: 2.5 });
      }
      if (fr === 14) {
        u.dir = o.x >= f.x ? 1 : -1;
        u.wave = new Sweep(f, 'wave', u.dir, 0);
        m.entities.push(u.wave);
        m.sfx('boom');
      }
      if (u.wave) {
        if (!u.riding && u.dir * (u.wave.x - 60 - f.x) >= 0) {
          u.riding = true;
          f.noClamp = true;
          f.facing = u.dir;
          f.ultPose = () => ({ face: 'laugh', lean: 0.2, armF: 1.7, armB: -1.5 });
        }
        if (u.riding) {
          f.x = u.wave.x - u.dir * 20;
          f.z = 20;
          if (u.dir > 0 ? f.x >= m.bounds.x1 : f.x <= m.bounds.x0) return true;
        }
      }
      return fr > 220;
    },
    lizzie(f, o, m, fr) {
      const u = f.ult;
      if (fr === 1) {
        u.pass = 0;
        f.trail = [];
        u.phase = 'run';
        m.fx.text('DESERT DASH DAZZLE!', f.x, f.y - 100, '#ffc93c', 30);
        u.aimAt = () => {
          const d = norm(o.x - f.x, o.y - f.y);
          u.d = d;
          u.tx = SF.clamp(o.x + d.x * 150, m.bounds.x0, m.bounds.x1);
          u.ty = SF.clamp(o.y + d.y * 150, m.bounds.y0, m.bounds.y1);
          f.facing = d.x >= 0 ? 1 : -1;
          m.sfx('dive');
        };
        u.aimAt();
        f.ultPose = () => ({ lean: 0.55, frill: 0.6, legF: Math.sin(f.anim * 1.2) * 1.2, legB: -Math.sin(f.anim * 1.2) * 1.2, armF: -0.9 });
      }
      if (u.phase === 'run') {
        const d = norm(u.tx - f.x, u.ty - f.y);
        f.vx = d.x * 16;
        f.vy = d.y * 16;
        if (fr % 2 === 0) {
          f.trail.push({ x: f.x, y: f.y, facing: f.facing });
          if (f.trail.length > 5) f.trail.shift();
        }
        m.foesOf(f).forEach((e) => dist(f, e) < 42 && m.hit(f, e, { id: 'dz' + u.pass, dmg: 5, kb: 3, stun: 30, light: true }, f.x, f.y));
        if (Math.hypot(u.tx - f.x, u.ty - f.y) < 18 || fr > 170) {
          u.pass++;
          if (u.pass >= 5 || fr > 170) {
            u.phase = 'flare';
            u.t = 0;
            f.vx = f.vy = 0;
            f.setAim(norm(o.x - f.x, o.y - f.y));
            f.ultPose = () => ({ frill: 1, armF: 2.6, armB: 2.4, lean: -0.2 });
            m.sfx('ready');
          } else u.aimAt();
        }
      } else {
        u.t++;
        if (u.t % 2 === 0 && f.trail.length) f.trail.shift();
        if (u.t === 8) {
          m.foesOf(f).forEach((e) => f.melee(e, 'flare', 130, 0.2, { dmg: 10, kb: 11, stun: 30, dizzy: 60, big: true, word: 'DAZZLED!' }));
          m.fx.spark(f.x + f.aim.x * 40, f.y - 50, true, '#ffc93c');
        }
        if (u.t >= 12) u.vulnerable = true;
        return u.t >= 30;
      }
      return false;
    },
    cheeky(f, o, m, fr) {
      f.ultPose = () => ({ face: 'laugh', crest: 1, head: -0.35, beak: 0.5, armF: 1.9 + Math.sin(f.anim * 0.8) * 0.8, armB: 1.7 + Math.sin(f.anim * 0.8) * 0.8 });
      onceAt(fr, 2, () => {
        m.sfx('laugh');
        m.fx.text('SULPHUR CREST STORM!', f.x, f.y - 100, '#ffd400', 28);
        const list = [];
        for (let i = 0; i < 9; i++) {
          list.push({ kind: 'bird', radius: 36, dx: SF.rand(-50, 50), dy: SF.rand(-30, 30), delay: i * 6, warn: 22, track: 16, word: 'SQUAWK!', props: { dmg: 3, kb: 3, stun: 22, light: true } });
        }
        list.push({ kind: 'bird', radius: 60, delay: 62, warn: 26, track: 20, big: true, word: 'SQUAWK!', props: { dmg: 9, kb: 10, stun: 30, knockdown: true, big: true } });
        strikes(f, list);
      });
      if (fr >= 55) f.ult.vulnerable = true;
      return fr >= 72;
    },
  };

  // ================================================================= hazards & snacks
  const SNACKS = {
    pie: { word: 'MEAT PIE! +HEALTH', color: '#8be15d' },
    vegemite: { word: 'VEGEMITE POWER!', color: '#ffd24a' },
    lamington: { word: 'SUGAR RUSH!', color: '#ff8ad8' },
  };

  class Snack {
    constructor(type, x, y) {
      Object.assign(this, { type, x, y, z: 260, t: 0, isPowerUp: true });
    }
    get landed() {
      return this.z <= 0;
    }
    update(m) {
      this.t++;
      if (this.z > 0) this.z = Math.max(0, this.z - 3);
      else if (this.t > 700) this.dead = true;
      if (this.z > 0 || m.roundState !== 'fight') return;
      for (const f of m.f) {
        if (['ko', 'down', 'grabbed', 'ultCine'].includes(f.state) || f.hidden) continue;
        if (Math.hypot(f.x - this.x, f.y - this.y) < 34) {
          if (this.type === 'pie') f.hp = Math.min(f.maxHp, f.hp + 15);
          if (this.type === 'vegemite') f.meter = Math.min(100, f.meter + 50);
          if (this.type === 'lamington') f.buff = { t: 480 };
          const s = SNACKS[this.type];
          m.fx.text(s.word, this.x, this.y - 70, s.color, 26);
          m.fx.spark(this.x, this.y - 20, true, s.color);
          m.sfx('ready');
          this.dead = true;
          break;
        }
      }
    }
    get sortY() {
      return this.y;
    }
    draw(ctx) {
      if (this.z <= 0 && this.t > 600 && Math.floor(this.t / 6) % 2) return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 2, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      const bob = this.z <= 0 ? Math.sin(this.t * 0.12) * 3 : 0;
      ctx.translate(this.x, this.y - 18 - this.z + bob);
      ctx.scale(0.8, 0.8);
      if (this.z > 0) {
        ctx.beginPath();
        ctx.arc(0, -52, 34, Math.PI, 0);
        ctx.closePath();
        ctx.fillStyle = '#ff5a5f';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        D.line(ctx, -32, -52, -8, -14, 2, D.OUT);
        D.line(ctx, 32, -52, 8, -14, 2, D.OUT);
      }
      if (this.type === 'pie') {
        D.ell(ctx, 0, 6, 24, 10, '#c98a3b');
        D.ell(ctx, 0, -2, 22, 12, '#e8b560');
        D.ell(ctx, 4, -12, 6, 3, '#e53935');
      } else if (this.type === 'vegemite') {
        SF.roundRect(ctx, -16, -18, 32, 34, 6);
        ctx.fillStyle = '#3a1f10';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(-18, -24, 36, 8);
        ctx.fillStyle = '#e53935';
        ctx.fillRect(-16, -6, 32, 12);
      } else {
        SF.roundRect(ctx, -18, -16, 36, 32, 6);
        ctx.fillStyle = '#6b3a1e';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = D.OUT;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 16; i++) ctx.fillRect(-15 + ((i * 7) % 30), -13 + ((i * 11) % 26), 2.5, 2.5);
      }
      ctx.restore();
    }
  }

  class Bear {
    constructor(f) {
      Object.assign(this, { x: f.x, y: f.y, z: 360, t: 0, phase: 'warn', hits: new Set() });
    }
    dangerZone() {
      return this.phase === 'warn' ? { x: this.x, y: this.y, r: 70 } : null;
    }
    update(m) {
      this.t++;
      if (this.phase === 'warn') {
        if (this.t > 70) {
          this.phase = 'fall';
          m.sfx('whistle');
        }
      } else if (this.phase === 'fall') {
        this.z -= 24;
        if (this.z <= 0) {
          this.z = 0;
          this.phase = 'run';
          this.t = 0;
          m.sfx('land');
          m.fx.dust(this.x, this.y, false);
          m.f.forEach((f) => {
            if (Math.hypot(f.x - this.x, f.y - this.y) < 42) m.hit(null, f, { id: 'bear', hitSet: this.hits, dmg: 5, kb: 5, stun: 22, word: 'BONK!', sfx: 'bonk', noMeter: true }, this.x, this.y);
          });
          this.vx = this.x < W / 2 ? -5 : 5;
        }
      } else {
        this.x += this.vx;
        if (this.x < -60 || this.x > W + 60) this.dead = true;
      }
    }
    drawBack(ctx) {
      if (this.phase === 'run') return;
      const k = this.phase === 'warn' ? Math.min(1, this.t / 70) : 1;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 34 * k, 14 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.phase === 'warn' && Math.floor(this.t / 8) % 2) SF.outlineText(ctx, 'DROP BEAR!', this.x, this.y - 60, 18, '#ff9d3c');
      ctx.restore();
    }
    get sortY() {
      return this.y;
    }
    draw(ctx) {
      if (this.phase === 'warn') return;
      ctx.save();
      ctx.translate(this.x, this.y - this.z);
      if (this.phase === 'run') ctx.scale(this.vx > 0 ? 1 : -1, 1);
      D.ell(ctx, 0, -18, 18, 16, '#9a9ca8');
      D.ell(ctx, -13, -40, 8, 8, '#9a9ca8');
      D.ell(ctx, 13, -40, 8, 8, '#9a9ca8');
      D.ell(ctx, 0, -32, 15, 13, '#9a9ca8');
      ctx.fillStyle = '#111';
      SF.roundRect(ctx, -13, -38, 11, 6, 3);
      ctx.fill();
      SF.roundRect(ctx, 2, -38, 11, 6, 3);
      ctx.fill();
      D.ell(ctx, 0, -28, 4, 3, '#2b2b2b', 0, false);
      ctx.restore();
    }
  }

  // ================================================================= CPU
  class ArenaAI {
    constructor(level) {
      this.p = SF.AI_LEVELS[level] || SF.AI_LEVELS.medium;
      this.held = SF.blankInput();
      this.taps = {};
      this.timer = 30;
      this.strafe = Math.random() < 0.5 ? 1 : -1;
    }
    tap(a) {
      this.taps[a] = 2;
    }
    // Pick who to chase: stick with the current target unless someone is much closer.
    pickTarget(me, m) {
      const foes = m.foesOf(me);
      if (!foes.length) return null;
      const near = m.nearestFoe(me);
      if (!this.target || this.target.state === 'ko' || !foes.includes(this.target) || dist(me, near) < dist(me, this.target) - 120) {
        this.target = near;
      }
      return this.target;
    }
    update(me, m) {
      if (--this.timer <= 0) {
        this.timer = this.p.think + Math.floor(Math.random() * 4);
        const opp = this.pickTarget(me, m);
        if (opp) this.think(me, opp, m);
        else ['left', 'right', 'up', 'down', 'charge'].forEach((k) => (this.held[k] = false));
      }
      const out = Object.assign({}, this.held);
      for (const k in this.taps) {
        if (this.taps[k] > 0) {
          out[k] = true;
          this.taps[k]--;
        }
      }
      return out;
    }
    go(dx, dy) {
      const h = this.held;
      h.left = dx < -0.35;
      h.right = dx > 0.35;
      h.up = dy < -0.35;
      h.down = dy > 0.35;
    }
    think(me, opp, m) {
      const P = this.p;
      const r = Math.random;
      ['left', 'right', 'up', 'down', 'charge'].forEach((k) => (this.held[k] = false));
      if (m.roundState !== 'fight' || !['idle', 'run', 'charge'].includes(me.state)) return;
      const to = norm(opp.x - me.x, opp.y - me.y);
      const d = dist(me, opp);
      if (r() < 0.05) this.strafe *= -1;

      // dodge boomerangs, shots and warning circles
      const threat = m.entities.find((e) => (e instanceof Rang || e instanceof Shot) && e.owner !== me && Math.hypot(e.x - me.x, e.y - me.y) < 150);
      if (threat && r() < P.block) {
        const side = { x: -to.y * this.strafe, y: to.x * this.strafe };
        this.go(side.x, side.y);
        if (me.dashCD <= 0 && r() < 0.5) this.tap('kick');
        return;
      }
      for (const e of m.entities) {
        if (e.owner === me) continue;
        const z = e.dangerZone && e.dangerZone();
        if (z && Math.hypot(z.x - me.x, z.y - me.y) < z.r && r() < P.dodge + 0.1) {
          const away = norm(me.x - z.x, me.y - z.y);
          this.go(away.x, away.y);
          return;
        }
      }
      const snack = m.entities.find((e) => e.isPowerUp && e.landed);
      if (snack && Math.hypot(snack.x - me.x, snack.y - me.y) < 300 && r() < 0.4 * P.approach) {
        const s = norm(snack.x - me.x, snack.y - me.y);
        this.go(s.x, s.y);
        return;
      }
      if (me.meter >= 100 && r() < P.ult * 0.4 && (me.def.id !== 'croc' || d < 220)) {
        this.tap('charge');
        return;
      }
      if (d > 380 && me.meter < 100 && r() < P.charge * 0.7) {
        this.held.charge = true;
        this.timer = 26;
        return;
      }
      if (d < 70 && r() < P.aggr) {
        this.go(to.x, to.y);
        this.tap('punch');
        return;
      }
      if (d < 170 && d > 80 && me.dashCD <= 0 && r() < P.aggr * 0.35) {
        this.go(to.x, to.y);
        this.tap('kick');
        return;
      }
      if (me.hasRang && d > 120 && r() < P.special * 1.8) {
        const lead = norm(opp.x + opp.vx * 10 - me.x, opp.y + opp.vy * 10 - me.y);
        this.go(lead.x, lead.y);
        this.tap('special');
        return;
      }
      const ranged = me.def.projectile;
      if (ranged && d < 200 && r() < 0.5) this.go(-to.x + -to.y * this.strafe * 0.6, -to.y + to.x * this.strafe * 0.6);
      else if (r() < P.approach) this.go(to.x - to.y * this.strafe * 0.4, to.y + to.x * this.strafe * 0.4);
      else this.go(-to.y * this.strafe, to.x * this.strafe);
    }
  }

  // ================================================================= match
  SF.ArenaMatch = class {
    constructor(o) {
      this.o = o;
      this.arena = SF.ARENAS[o.stage];
      this.obstacles = this.arena.obstacles;
      this.bounds = o.table ? { x0: 40, x1: 920, y0: 110, y1: 450 } : { x0: 40, x1: 920, y0: 118, y1: 505 };
      const ids = o.fighters || [o.p1, o.p2];
      this.f4 = ids.length > 2;
      this.fx = new SF.Effects();
      this.entities = [];
      this.projectiles = [];
      this.f = ids.map((id, i) => new ArenaFighter(id, i, this, ids.slice(0, i).includes(id)));
      this.ctrl = o.controllers.map((c) => (c.type === 'ai' ? new ArenaAI(c.level) : c));
      this.ctrl.forEach((c, i) => {
        if (c instanceof ArenaAI) this.f[i].handicap = c.p.dmg;
      });
      this.t = 0;
      this.round = 1;
      this.wins = this.f.map(() => 0);
      this.needed = Math.ceil((o.rounds || 3) / 2);
      this.hitstop = 0;
      this.slow = 0;
      this.cine = null;
      this.cam = { zoom: 1, x: W / 2, y: H / 2 };
      this.banner = null;
      this.paused = false;
      this.ended = false;
      this.startRound();
    }

    sfx(n) {
      if (!this.o.silent) SF.Audio.play(n);
    }
    // Everyone else still in the round.
    foesOf(f) {
      return this.f.filter((o) => o !== f && o.state !== 'ko');
    }
    nearestFoe(f) {
      const foes = this.foesOf(f);
      if (!foes.length) return this.f.find((o) => o !== f);
      return foes.reduce((a, b) => (dist(f, a) <= dist(f, b) ? a : b));
    }
    isHuman(i) {
      return !(this.ctrl[i] instanceof ArenaAI);
    }
    addEntity(e) {
      this.entities.push(e);
    }
    showBanner(text, dur = 60, color = '#ffd24a', size = 80) {
      this.banner = { text, t: 0, dur, color, size };
    }

    startRound() {
      this.f.forEach((f) => f.reset());
      this.entities = [];
      this.timer = this.o.timer || 0;
      this.timerFrames = 0;
      this.roundState = 'intro';
      this.introT = 0;
      this.bearTimer = SF.rand(600, 1000);
      this.snackTimer = SF.rand(300, 600);
      this.koT = 0;
    }

    throwRang(f) {
      if (!f.hasRang) return;
      f.hasRang = false;
      this.entities.push(new Rang(f));
      this.sfx('swing');
    }

    startCinematic(f) {
      this.cine = { f, t: 0 };
      this.sfx('ult');
    }

    hit(att, def, p, fx, fy) {
      if (!def || this.roundState !== 'fight') return 'miss';
      const store = p.hitSet || (att && att.hitIds);
      const key = p.hitSet ? p.id + ':' + def.side : p.id + '#' + (att ? att.ultSeq : 0) + ':' + def.side;
      if (store && store.has(key)) return 'miss';
      if (['ko', 'down', 'getup', 'ultCine'].includes(def.state) || def.hidden) return 'miss';
      if (def.invuln > 0 && !p.hold) return 'miss';
      if (def.state === 'ult' && !(def.ult && def.ult.vulnerable)) return 'miss';
      if (def.state === 'grabbed' && !(att && att.state === 'ult')) return 'miss';
      if (store) {
        store.add(key);
        if (store.size > 300) store.clear();
      }
      const power = att ? att.def.power * att.handicap * (att.raging() ? 1.2 : 1) : 1;
      const dmg = p.dmg * power * def.def.defense;
      def.hp -= dmg;
      if (att && !p.noMeter && att.state !== 'ult') att.meter = Math.min(100, att.meter + dmg * 0.9);
      def.meter = Math.min(100, def.meter + dmg * 0.55);
      const kb = p.kbDir || norm(def.x - fx, def.y - fy);
      if (!p.hold) {
        if (def.state === 'dizzy' && p.keepDizzy) {
          def.stun = Math.max(def.stun, 60);
        } else {
          if (def.state === 'ult') def.cleanupUlt();
          def.setState('hurt');
          def.st = 0;
          def.stun = p.stun;
          def.kd = !!p.knockdown;
          def.vx = kb.x * p.kb;
          def.vy = kb.y * p.kb;
          if (p.dizzy) {
            def.setState('dizzy');
            def.stun = p.dizzy;
            def.kd = false;
          }
        }
      }
      this.fx.spark(def.x, def.y - 30, !!p.big);
      if (p.word || p.big || (!p.light && Math.random() < 0.3)) this.fx.text(p.word || SF.pick(SF.HIT_WORDS), def.x, def.y - 80, '#ffe14a', p.big ? 36 : 26);
      this.sfx(p.big ? 'bighit' : p.sfx || 'hit');
      this.fx.shake(p.big ? 10 : p.light ? 1 : 3);
      this.hitstop = Math.max(this.hitstop, p.big ? 10 : p.light ? 1 : p.hold ? 3 : 5);
      if (def.hp <= 0) {
        def.hp = 0;
        if (def.state === 'ult') def.cleanupUlt();
        if (this.f.filter((o) => o.hp > 0).length > 1) {
          this.fx.text(def.def.name + ' IS OUT!', def.x, def.y - 110, '#ff5a3c', 30);
          this.sfx('ko');
        }
        def.setState('ko');
        def.spin = 0;
        def.vx = kb.x * 8;
        def.vy = kb.y * 8;
      }
      return 'hit';
    }

    readCtrl(i) {
      const c = this.ctrl[i];
      if (c instanceof ArenaAI) return c.update(this.f[i], this);
      return SF.Input.read(c.slot, c.merged, c.pad, c.keys);
    }

    update() {
      this.t++;
      if (this.paused) return;
      if (this.banner && ++this.banner.t > this.banner.dur) this.banner = null;
      if (this.cine) {
        this.cine.t++;
        this.cine.f.anim++;
        this.fx.update();
        this.updateCamera();
        if (this.cine.t >= CINE) {
          const f = this.cine.f;
          this.cine = null;
          f.beginUlt();
        }
        return;
      }
      if (this.hitstop > 0) {
        this.hitstop--;
        this.fx.update();
        return;
      }
      if (this.slow > 0 && this.slow-- % 2) return;

      const fighting = this.roundState === 'fight';
      this.f.forEach((f, i) => {
        const raw = fighting || this.isHuman(i) ? this.readCtrl(i) : null;
        f.setInput(fighting ? raw : SF.blankInput());
      });
      this.f.forEach((f) => f.update());
      for (let a = 0; a < this.f.length; a++) for (let b = a + 1; b < this.f.length; b++) this.push(this.f[a], this.f[b]);
      this.entities.forEach((e) => e.update(this));
      this.entities = this.entities.filter((e) => !e.dead);
      // boomerangs clash in mid-air
      const rangs = this.entities.filter((e) => e instanceof Rang);
      for (let a = 0; a < rangs.length; a++) {
        for (let b = a + 1; b < rangs.length; b++) {
          const g1 = rangs[a];
          const g2 = rangs[b];
          if (g1.phase === 'out' && g2.phase === 'out' && Math.hypot(g1.x - g2.x, g1.y - g2.y) < 24) {
            g1.turnBack();
            g2.turnBack();
            this.fx.spark((g1.x + g2.x) / 2, g1.y - 26, false);
            this.sfx('block');
          }
        }
      }
      this.fx.update();

      if (fighting) {
        if (SF.settings.dropBears && --this.bearTimer <= 0) {
          this.bearTimer = SF.rand(900, 1500);
          this.entities.push(new Bear(SF.pick(this.f)));
        }
        if (SF.settings.powerUps && --this.snackTimer <= 0) {
          this.snackTimer = SF.rand(600, 900);
          if (!this.entities.some((e) => e.isPowerUp)) {
            let x;
            let y;
            let tries = 0;
            do {
              x = SF.rand(this.bounds.x0 + 40, this.bounds.x1 - 40);
              y = SF.rand(this.bounds.y0 + 30, this.bounds.y1 - 30);
            } while (tries++ < 20 && this.obstacles.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + 30));
            this.entities.push(new Snack(SF.pick(Object.keys(SNACKS)), x, y));
          }
        }
      }
      this.roundLogic();
      this.updateCamera();
      this.f.forEach((f, i) => {
        if (this.isHuman(i)) SF.Input.setChargeReady(this.ctrl[i].slot, f.meter >= 100);
      });
    }

    push(a, b) {
      if ([a, b].some((f) => ['grabbed', 'ko', 'down'].includes(f.state) || f.hidden || f.noClamp || f.z > 0)) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = R * 2;
      if (d < min) {
        const s = (min - d) / 2;
        a.x -= (dx / d) * s;
        a.y -= (dy / d) * s;
        b.x += (dx / d) * s;
        b.y += (dy / d) * s;
        a.clampPos();
        b.clampPos();
      }
    }

    roundLogic() {
      if (this.roundState === 'intro') {
        this.introT++;
        if (this.introT === 1) {
          const final = this.round > 1 && this.wins[0] === this.needed - 1 && this.wins[1] === this.needed - 1;
          this.showBanner(final ? 'FINAL ROUND' : 'ROUND ' + this.round, 55);
          this.sfx('gong');
        }
        if (this.introT === 60) {
          this.showBanner('FIGHT!', 40, '#ff5a3c', 100);
          this.sfx('fight');
          this.roundState = 'fight';
          this.f.forEach((f) => f.setState('idle'));
        }
        return;
      }
      if (this.roundState === 'fight') {
        if (this.timer > 0 && ++this.timerFrames >= 60) {
          this.timerFrames = 0;
          if (--this.timer <= 0) {
            this.roundState = 'ko';
            this.koT = 0;
            this.timeUp = true;
            this.showBanner('TIME UP!', 80);
            this.sfx('gong');
            return;
          }
        }
        if (this.f.filter((f) => f.hp > 0).length <= 1) {
          this.roundState = 'ko';
          this.koT = 0;
          this.timeUp = false;
          this.slow = 60;
          this.showBanner('K.O.!', 70, '#ff5a3c', 110);
          this.sfx('ko');
          this.fx.shake(12);
        }
        return;
      }
      if (this.roundState === 'ko') {
        this.koT++;
        if (this.koT === 90) {
          let w = -1;
          const alive = this.f.filter((f) => f.hp > 0);
          if (this.timeUp) {
            const best = Math.max(...alive.map((f) => f.hp / f.maxHp));
            const top = alive.filter((f) => f.hp / f.maxHp === best);
            if (top.length === 1) w = top[0].side;
          } else if (alive.length === 1) w = alive[0].side;
          if (w >= 0) {
            const wf = this.f[w];
            if (wf.state === 'ult' || wf.state === 'ultCine') wf.cleanupUlt();
            wf.setState('victory');
            this.wins[w]++;
            const done = this.wins[w] >= this.needed;
            this.showBanner(done ? wf.def.name + ' WINS!' : SF.pick(SF.KO_WORDS), 110, '#ffd24a', 66);
            if (!this.o.silent) SF.Audio.music(done ? 'victory' : 'roundWin');
          } else this.showBanner('DRAW!', 110, '#fff', 84);
        }
        if (this.koT === 220) {
          if (this.wins.some((n) => n >= this.needed)) {
            this.roundState = 'over';
            if (!this.ended) {
              this.ended = true;
              if (this.o.onEnd) this.o.onEnd(this.wins.findIndex((n) => n >= this.needed), this);
            }
          } else {
            this.round++;
            this.startRound();
          }
        }
      }
    }

    updateCamera() {
      let z = 1;
      let cx = W / 2;
      let cy = H / 2;
      if (this.cine) {
        z = 1.35;
        cx = this.cine.f.x;
        cy = this.cine.f.y - 40;
      }
      this.cam.zoom += (z - this.cam.zoom) * 0.18;
      const hw = W / 2 / this.cam.zoom;
      const hh = H / 2 / this.cam.zoom;
      this.cam.x += (SF.clamp(cx, hw, W - hw) - this.cam.x) * 0.2;
      this.cam.y += (SF.clamp(cy, hh, H - hh) - this.cam.y) * 0.2;
      this.cam.x = SF.clamp(this.cam.x, W / 2 / this.cam.zoom, W - W / 2 / this.cam.zoom);
      this.cam.y = SF.clamp(this.cam.y, H / 2 / this.cam.zoom, H - H / 2 / this.cam.zoom);
    }

    tagFor(side) {
      if (!this.isHuman(side)) return { text: 'CPU', color: this.f4 ? SF.SLOT_COLORS[side] : '#e0e0e0' };
      return { text: 'P' + (side + 1), color: SF.SLOT_COLORS[side] };
    }

    // ------------------------------------------------------------ render
    render(ctx) {
      const sh = this.fx.shakeAmt;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(this.cam.zoom, this.cam.zoom);
      ctx.translate(-this.cam.x + SF.rand(-sh, sh), -this.cam.y + SF.rand(-sh, sh));
      SF.drawArenaFloor(ctx, this.o.stage);
      this.entities.forEach((e) => e.drawBack && e.drawBack(ctx));
      if (this.cine) {
        ctx.fillStyle = `rgba(10,5,30,${Math.min(0.55, this.cine.t / 12)})`;
        ctx.fillRect(-50, -50, W + 100, H + 100);
      }
      this.f.forEach((f) => f.drawShadow(ctx));
      const list = [];
      this.f.forEach((f) => list.push({ y: f.y, draw: () => f.draw(ctx, this.tagFor(f.side)) }));
      this.obstacles.forEach((o) => {
        if (o.flat) return;
        list.push({ y: o.y, draw: () => {
          ctx.save();
          ctx.translate(o.x, o.y);
          SF.ARENA_OBJ[o.kind](ctx, o);
          ctx.restore();
        } });
      });
      const top = [];
      this.entities.forEach((e) => {
        if (!e.draw) return;
        if (e.sortY != null) list.push({ y: e.sortY, draw: () => e.draw(ctx) });
        else top.push(e);
      });
      list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());
      top.forEach((e) => e.draw(ctx));
      this.obstacles.forEach((o) => o.over && SF.ARENA_OVER[o.over](ctx, o, this.t));
      this.fx.draw(ctx);
      ctx.restore();

      if (this.cine) this.drawCine(ctx);
      this.drawHud(ctx);
      if (this.banner) this.drawBanner(ctx);
    }

    drawCine(ctx) {
      const f = this.cine.f;
      const t = this.cine.t;
      const draw = (flip) => {
        ctx.save();
        if (flip) {
          ctx.translate(W, H);
          ctx.rotate(Math.PI);
        }
        const bx = SF.lerp(W + 400, W / 2, Math.min(1, t / 10));
        ctx.translate(bx, H - 120);
        ctx.rotate(-0.06);
        ctx.fillStyle = 'rgba(20,10,40,0.85)';
        ctx.fillRect(-W, -40, W * 2, 80);
        ctx.fillStyle = '#ffd24a';
        ctx.fillRect(-W, -40, W * 2, 4);
        ctx.fillRect(-W, 36, W * 2, 4);
        SF.outlineText(ctx, f.def.full.toUpperCase(), 0, -16, 20, '#fff');
        SF.outlineText(ctx, '⚡ ' + f.def.ultimate.name.toUpperCase() + ' ⚡', 0, 14, 34, '#ffd24a');
        ctx.restore();
      };
      draw(false);
      if (this.o.table) draw(true);
    }

    drawHudBlock(ctx, f, i) {
      const tag = this.tagFor(i);
      const w = 300;
      ctx.save();
      SF.roundRect(ctx, -w / 2 - 10, -34, w + 20, 66, 12);
      ctx.fillStyle = 'rgba(20,10,40,0.55)';
      ctx.fill();
      SF.outlineText(ctx, f.def.name + '  ' + tag.text, -w / 2, -18, 18, tag.color, '#1a0d05', 'left');
      for (let k = 0; k < this.needed; k++) SF.D.star(ctx, w / 2 - 8 - k * 20, -18, 8, k < this.wins[i] ? '#ffd24a' : 'rgba(255,255,255,0.25)');
      SF.roundRect(ctx, -w / 2, -4, w, 16, 5);
      ctx.fillStyle = '#3a2a2a';
      ctx.fill();
      ctx.fillStyle = '#ff9f9f';
      ctx.fillRect(-w / 2, -4, (f.dispHp / f.maxHp) * w, 16);
      const pct = f.hp / f.maxHp;
      ctx.fillStyle = pct > 0.5 ? '#5ad14a' : pct > 0.25 ? '#ffd24a' : '#ff5a3c';
      ctx.fillRect(-w / 2, -4, (Math.max(0, f.hp) / f.maxHp) * w, 16);
      const full = f.meter >= 100;
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 0.25);
      ctx.fillStyle = '#1a0d05';
      ctx.fillRect(-w / 2, 16, w * 0.6, 9);
      ctx.fillStyle = full ? `rgb(255,${200 + pulse * 55},${40 + pulse * 120})` : '#4ab3ff';
      ctx.fillRect(-w / 2, 16, (f.meter / 100) * w * 0.6, 9);
      SF.outlineText(ctx, full ? '⚡ READY!' : '⚡', -w / 2 + w * 0.6 + 8, 21, 13, full ? '#ffd24a' : '#bfe3ff', '#1a0d05', 'left');
      if (this.o.timer) SF.outlineText(ctx, String(Math.max(0, this.timer)), w / 2 - 16, 20, 20, this.timer <= 10 ? '#ff5a3c' : '#fff');
      ctx.restore();
    }

    drawHud(ctx) {
      if (this.f4) {
        this.f.forEach((f, i) => {
          ctx.save();
          if (this.o.table) {
            const seat = SEATS[i];
            ctx.translate(W * seat.hx, seat.hy ? H - 26 : 26);
            ctx.rotate(seat.rot);
          } else {
            ctx.translate(W * (0.125 + i * 0.25), 40);
          }
          ctx.scale(this.o.table ? 0.62 : 0.72, this.o.table ? 0.62 : 0.72);
          if (f.state === 'ko') ctx.globalAlpha = 0.5;
          this.drawHudBlock(ctx, f, i);
          ctx.restore();
        });
        return;
      }
      if (this.o.table) {
        ctx.save();
        ctx.translate(W / 2, H - 38);
        this.drawHudBlock(ctx, this.f[0], 0);
        ctx.restore();
        ctx.save();
        ctx.translate(W / 2, 38);
        ctx.rotate(Math.PI);
        this.drawHudBlock(ctx, this.f[1], 1);
        ctx.restore();
      } else {
        [0, 1].forEach((i) => {
          ctx.save();
          ctx.translate(i === 0 ? 190 : W - 190, 44);
          this.drawHudBlock(ctx, this.f[i], i);
          ctx.restore();
        });
      }
    }

    drawBanner(ctx) {
      const b = this.banner;
      const k = b.t / b.dur;
      const pop = b.t < 8 ? 1.6 - (b.t / 8) * 0.6 : 1;
      const one = (y, flip) => {
        ctx.save();
        ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
        ctx.translate(W / 2, y);
        if (flip) ctx.rotate(Math.PI);
        ctx.scale(pop, pop);
        ctx.rotate(-0.04);
        SF.outlineText(ctx, b.text, 0, 0, b.size, b.color);
        ctx.restore();
      };
      if (this.o.table) {
        one(H / 2 + 60, false);
        one(H / 2 - 60, true);
      } else one(H / 2 - 20, false);
    }
  };
})();
