// A fighter in a match: state machine, physics, animation pose and drawing.
SF.Fighter = class {
  constructor(id, side, match, alt) {
    this.def = SF.FIGHTERS[id];
    this.side = side;
    this.m = match;
    this.pal = alt ? this.def.alt : this.def.pal;
    this.maxHp = this.def.health;
    this.meter = 0;
    this.anim = side * 37;
    this.ultSeq = 0;
    this.hitIds = new Set();
    this.handicap = 1;
    this.resetRound();
  }

  resetRound() {
    this.x = this.side === 0 ? 300 : 660;
    this.y = SF.GROUND;
    this.vx = 0;
    this.vy = 0;
    this.facing = this.side === 0 ? 1 : -1;
    this.hp = this.maxHp;
    this.dispHp = this.maxHp;
    this.state = 'intro';
    this.stateTime = 0;
    this.move = null;
    this.moveFrame = 0;
    this.curFrame = -1;
    this.moveEnd = 0;
    this.moveData = {};
    this.stun = 0;
    this.kdPending = false;
    this.invuln = 0;
    this.airJumps = 0;
    this.noGravity = false;
    this.noClamp = false;
    this.spin = 0;
    this.ultData = null;
    this.ultPose = null;
    this.ultFrame = 0;
    this.target = false;
    this.inp = SF.blankInput();
    this.prev = SF.blankInput();
    this.buffer = null;
    this.napTime = 0;
    this.healPool = 25;
    this.guard = false;
    this.walkCycle = 0;
    this.crouchBlock = false;
    this.wasReady = this.meter >= 100;
    this.sink = 0;
    this.buff = null;
    this.trail = null;
  }

  // Taz hits harder when his health is low.
  raging() {
    return !!this.def.rage && this.hp > 0 && this.hp < this.maxHp * 0.3;
  }

  // Walking speed, including the Lamington sugar rush.
  spd() {
    return this.def.speed * (this.buff && this.buff.type === 'speed' ? 1.35 : 1) * (this.frenzied() ? 1.25 : 1);
  }

  // Sly speeds up when his opponent is nearly beaten.
  frenzied() {
    if (!this.def.frenzy || !this.m.opponentOf) return false;
    const o = this.m.opponentOf(this);
    return o.hp > 0 && o.hp < o.maxHp * 0.4;
  }

  setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.stateTime = 0;
    }
  }

  onGround() {
    return this.y >= SF.GROUND - 0.5;
  }

  isCrouching() {
    return (
      this.state === 'crouch' ||
      (this.state === 'attack' && this.move && this.move.crouch) ||
      (this.state === 'blockstun' && this.crouchBlock)
    );
  }

  hurtbox() {
    let h = this.def.height * (this.isCrouching() ? 0.66 : 1);
    if (this.state === 'down' || this.state === 'ko') h = 40;
    const w = this.def.width;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  setInput(raw) {
    const inp = Object.assign({}, raw);
    ['up', 'punch', 'kick', 'special', 'charge'].forEach((a) => {
      inp['p' + a] = raw[a] && !this.prev[a];
    });
    this.prev = raw;
    this.inp = inp;
    if (inp.ppunch) this.buffer = { a: 'punch', t: 0 };
    if (inp.pkick) this.buffer = { a: 'kick', t: 0 };
    if (inp.pspecial) this.buffer = { a: 'special', t: 0 };
    if (inp.pcharge && this.meter >= 100) this.buffer = { a: 'charge', t: 0 };
  }

  faceOpp(opp) {
    if (Math.abs(opp.x - this.x) > 4) this.facing = opp.x > this.x ? 1 : -1;
  }

  canBlock() {
    return ['idle', 'walk', 'crouch', 'blockstun'].includes(this.state) && this.onGround();
  }

  threat(opp) {
    if (opp.state === 'attack' || opp.state === 'ult') return true;
    return this.m.projectiles.some(
      (p) => p.owner === opp && Math.abs(p.x - this.x) < 300 && Math.sign(this.x - p.x) === Math.sign(p.vx)
    );
  }

  update(opp) {
    const m = this.m;
    this.anim++;
    this.stateTime++;
    if (this.invuln > 0) this.invuln--;
    if (this.buffer && ++this.buffer.t > 10) this.buffer = null;
    if (this.buff && --this.buff.t <= 0) this.buff = null;
    if (this.buff && this.anim % 4 === 0) m.fx.chargeBit(this.x, this.y - this.def.height * 0.4, '#ff8ad8');
    if ((this.raging() || this.frenzied()) && this.anim % 5 === 0) m.fx.chargeBit(this.x, this.y - this.def.height * 0.6, '#ff5a3c');
    const inp = this.inp;

    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'crouch':
      case 'charge':
        this.neutral(inp, opp);
        break;
      case 'jump':
        this.air(inp, opp);
        break;
      case 'attack':
        this.runMove(opp);
        break;
      case 'hurt':
        if (!this.onGround() || this.vy < 0) {
          this.stun--;
        } else if (this.kdPending) {
          this.knockdown();
        } else if (--this.stun <= 0) {
          this.setState('idle');
        }
        break;
      case 'blockstun':
        if (--this.stun <= 0) this.setState('idle');
        break;
      case 'down':
        if (this.stateTime >= 50) {
          this.setState('getup');
          this.invuln = 24;
        }
        break;
      case 'getup':
        if (this.stateTime >= 18) this.setState('idle');
        break;
      case 'dizzy':
        if (--this.stun <= 0) this.setState('idle');
        break;
      case 'ult':
        this.ultFrame++;
        if (this.def.ult.update(this, opp, m, this.ultFrame)) this.endUlt();
        break;
      case 'intro':
        this.faceOpp(opp);
        break;
      default:
        break;
    }

    this.physics();

    if (this.hp < this.dispHp) this.dispHp = Math.max(this.hp, this.dispHp - 0.6);
    else this.dispHp = this.hp;

    const ready = this.meter >= 100;
    if (ready && !this.wasReady && m.roundState === 'fight') {
      m.sfx('ready');
      m.fx.text('ULTIMATE READY!', this.x, this.y - this.def.height - 40, '#ffd24a', 26);
    }
    this.wasReady = ready;
  }

  neutral(inp, opp) {
    const m = this.m;
    if (!this.onGround()) {
      this.setState('jump');
      return;
    }
    this.faceOpp(opp);
    const b = this.buffer ? this.buffer.a : null;
    if (b) {
      this.buffer = null;
      if (b === 'charge' && this.meter >= 100) return this.startUlt();
      if (b === 'special') return this.startMove('special');
      if (b === 'punch') return this.startMove(inp.down ? 'lowPunch' : 'punch');
      if (b === 'kick') return this.startMove(inp.down ? 'sweep' : 'kick');
    }
    if (inp.up) return this.jump(inp);
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (inp.charge && this.meter < 100 && dir === 0 && !inp.down) {
      this.setState('charge');
      this.vx *= 0.5;
      this.meter = Math.min(100, this.meter + 0.42);
      if (this.stateTime % 3 === 0) m.fx.chargeBit(this.x, this.y - 20);
      if (this.stateTime % 10 === 0) m.sfx('charge');
      return;
    }
    if (inp.down) {
      this.setState('crouch');
      this.vx *= 0.6;
      if (this.def.crawler && dir !== 0) {
        this.vx = dir * this.spd() * 0.6;
        this.walkCycle += 0.3;
      }
      if (this.def.napper && dir === 0) {
        this.napTime++;
        if (this.napTime > 60 && this.healPool > 0 && this.hp < this.maxHp) {
          const h = Math.min(0.07, this.healPool);
          this.hp = Math.min(this.maxHp, this.hp + h);
          this.healPool -= h;
        }
      } else {
        this.napTime = 0;
      }
    } else if (dir !== 0) {
      this.setState('walk');
      this.napTime = 0;
      const fwd = dir === this.facing;
      this.vx = dir * this.spd() * (fwd ? 1 : 0.72);
      this.walkCycle += this.def.walk === 'hop' ? 0.16 : 0.22;
    } else {
      this.setState('idle');
      this.napTime = 0;
      this.vx *= 0.6;
    }
    const away = this.facing > 0 ? inp.left : inp.right;
    this.guard = away && this.threat(opp);
  }

  jump(inp) {
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    this.vy = -this.def.jump;
    this.vx = dir * this.spd() * 1.05;
    this.setState('jump');
    this.airJumps = this.def.airJumps != null ? this.def.airJumps : this.def.doubleJump ? 1 : 0;
    this.m.sfx('jump');
    this.m.fx.dust(this.x, SF.GROUND, false);
  }

  air(inp) {
    if (this.onGround() && this.vy >= 0) {
      this.setState('idle');
      this.m.fx.dust(this.x, SF.GROUND, false);
      this.m.sfx('land');
      return;
    }
    const b = this.buffer ? this.buffer.a : null;
    if (b === 'punch' || b === 'kick' || (b === 'special' && this.def.moves.special.air)) {
      this.buffer = null;
      return this.startMove(b === 'punch' ? 'airPunch' : b === 'kick' ? 'airKick' : 'special');
    }
    const atWall = this.x <= SF.WALL_L + 4 || this.x >= SF.WALL_R - 4;
    if (inp.pup && this.def.wallJump && atWall) {
      const away = this.x < SF.W / 2 ? 1 : -1;
      this.vy = -this.def.jump * 0.9;
      this.vx = away * this.spd() * 1.4;
      this.facing = away;
      this.m.sfx('boing');
      this.m.fx.dust(this.x, this.y - 40, false);
      return;
    }
    if (inp.pup && this.airJumps > 0) {
      this.airJumps--;
      this.vy = -this.def.jump * 0.85;
      this.m.sfx('jump');
      this.m.fx.dust(this.x, this.y, false);
    }
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) {
      const max = this.spd() * 1.1;
      this.vx = SF.clamp(this.vx + dir * 0.35, -max, max);
    }
  }

  startMove(name) {
    const mv = this.def.moves[name];
    if (!mv) return;
    if (!mv.air && !this.onGround()) return;
    this.move = mv;
    this.moveName = name;
    this.moveFrame = 0;
    this.curFrame = -1;
    this.moveEnd = 0;
    this.moveData = {};
    this.moveId = (SF._moveSeq = (SF._moveSeq || 0) + 1);
    this.state = 'attack';
    this.stateTime = 0;
    this.napTime = 0;
    if (mv.sfx) this.m.sfx(mv.sfx);
    if (this.onGround()) this.vx *= 0.3;
  }

  runMove(opp) {
    const mv = this.move;
    const fr = this.moveFrame;
    if (mv.update) mv.update(this, opp, this.m, fr);
    this.curFrame = fr;
    this.moveFrame++;
    if (mv.landCancel && fr > 2 && this.onGround() && this.vy >= 0) {
      this.m.fx.dust(this.x, SF.GROUND, false);
      return this.endMove();
    }
    if (this.moveFrame >= (this.moveEnd || mv.frames)) this.endMove();
  }

  endMove() {
    this.sink = 0;
    this.move = null;
    this.moveEnd = 0;
    this.curFrame = -1;
    this.setState(this.onGround() ? (this.inp.down ? 'crouch' : 'idle') : 'jump');
  }

  // Hitboxes that are live this frame, in world coordinates.
  activeHits() {
    if (this.state !== 'attack' || !this.move || this.curFrame < 0) return [];
    const out = [];
    this.move.hits.forEach((h, i) => {
      if (this.curFrame >= h.from && this.curFrame <= h.to && (!h.cond || h.cond(this))) {
        out.push({ box: this.m.boxFront(this, h.box), props: Object.assign({}, h, { id: 'm' + this.moveId + ':' + i }) });
      }
    });
    return out;
  }

  startUlt() {
    // Only one ultimate cinematic at a time (both players may press on the same frame).
    if (this.m.cine) return;
    this.meter = 0;
    this.wasReady = false;
    this.vx = 0;
    this.move = null;
    this.setState('ultCine');
    this.m.startCinematic(this);
  }

  beginUlt(opp) {
    this.ultSeq++;
    this.ultFrame = 0;
    this.setState('ult');
    this.def.ult.start(this, opp, this.m);
  }

  cleanupUlt() {
    this.noGravity = false;
    this.noClamp = false;
    this.spin = 0;
    this.ultPose = null;
    this.ultData = null;
    this.target = false;
    this.trail = null;
    this.x = SF.clamp(this.x, SF.WALL_L, SF.WALL_R);
  }

  endUlt() {
    this.cleanupUlt();
    this.setState(this.onGround() ? 'idle' : 'jump');
  }

  knockdown() {
    this.kdPending = false;
    this.setState('down');
    this.vx *= 0.3;
    this.m.fx.dust(this.x, SF.GROUND, true);
    this.m.fx.shake(5);
    this.m.sfx('land');
  }

  physics() {
    if (this.state === 'grabbed') return;
    if (!this.noGravity) this.vy += 0.8 * this.def.gravity;
    this.x += this.vx;
    this.y += this.vy;
    if (this.y >= SF.GROUND) {
      this.y = SF.GROUND;
      if (this.vy > 0) this.vy = 0;
    }
    if (this.onGround() && this.state !== 'walk') {
      const fr = this.state === 'hurt' || this.state === 'blockstun' || this.state === 'ko' ? 0.9 : 0.8;
      this.vx *= fr;
    }
    if (!this.noClamp) this.x = SF.clamp(this.x, SF.WALL_L, SF.WALL_R);
  }

  // ------------------------------------------------------------------ pose
  getPose() {
    const t = this.anim;
    const p = {
      t, bob: 0, lean: 0, head: 0, beak: 0.05,
      armF: 0.5, armB: 0.25, armFExt: 1, armBExt: 1,
      legF: 0.12, legB: -0.12, legFExt: 1, legBExt: 1,
      sx: 1, sy: 1, tail: 0, face: 'normal', lie: 0, flip: 1,
    };
    const idle = () => {
      const s = Math.sin(t * 0.08);
      p.bob = s * 2;
      p.sy = 1 + s * 0.015;
      p.armF = 0.55 + s * 0.08;
      p.armB = 0.3 - s * 0.05;
      p.tail = s * 0.05;
    };
    const kFrom = (mv, fr) => {
      const hits = mv.hits.length ? mv.hits : [{ from: Math.round(mv.frames * 0.35), to: Math.round(mv.frames * 0.5) }];
      const a = hits[0].from;
      const b = hits[hits.length - 1].to;
      if (fr < a) return -0.3 + (fr / Math.max(1, a)) * 0.3;
      if (fr <= b) return 1;
      return Math.max(0, 1 - (fr - b) / Math.max(1, mv.frames - b));
    };

    switch (this.state) {
      case 'idle':
      case 'intro':
        idle();
        if (this.guard) {
          p.armF = 2.0;
          p.armB = 1.7;
          p.armFExt = 0.75;
          p.lean = -0.12;
        }
        break;
      case 'walk': {
        const w = Math.sin(this.walkCycle);
        if (this.def.walk === 'hop') {
          p.bob = -Math.abs(Math.sin(this.walkCycle)) * 16;
          p.legF = 0.25 + w * 0.2;
          p.legB = 0.1 + w * 0.2;
          p.armF = 0.8;
          p.armB = 0.6;
          p.tail = -0.1 + w * 0.12;
          p.sy = 1 + Math.abs(w) * 0.06;
        } else {
          p.legF = w * 0.55;
          p.legB = -w * 0.55;
          p.armF = 0.4 - w * 0.4;
          p.armB = 0.2 + w * 0.4;
          p.bob = -Math.abs(Math.cos(this.walkCycle)) * 4;
          p.lean = this.def.walk === 'waddle' ? w * 0.07 : 0.05;
        }
        if (this.guard) {
          p.armF = 2.0;
          p.armB = 1.7;
          p.armFExt = 0.75;
        }
        break;
      }
      case 'crouch':
        p.sy = 0.72;
        p.sx = 1.1;
        p.legF = 0.9;
        p.legB = -0.5;
        p.legFExt = 0.8;
        p.legBExt = 0.8;
        p.armF = this.guard ? 2.0 : 0.9;
        p.armB = this.guard ? 1.7 : 0.6;
        if (this.def.crawler && Math.abs(this.vx) > 0.5) {
          p.legF = 0.9 + Math.sin(this.walkCycle) * 0.4;
          p.legB = -0.5 - Math.sin(this.walkCycle) * 0.4;
          p.armF = 1.2 + Math.sin(this.walkCycle) * 0.3;
          p.lean = 0.35;
        }
        if (this.def.napper && this.napTime > 60) {
          p.face = 'sleepy';
          p.head = 0.25;
          p.bob = Math.sin(t * 0.05) * 1.5;
        }
        break;
      case 'charge': {
        p.armF = 1.9 + Math.sin(t * 0.5) * 0.1;
        p.armB = -1.9;
        p.legF = 0.35;
        p.legB = -0.35;
        p.bob = Math.sin(t * 0.9) * 1.5;
        p.face = 'attack';
        p.beak = 0.25;
        break;
      }
      case 'jump':
        p.legF = 0.9;
        p.legB = 0.35;
        p.legFExt = 0.75;
        p.legBExt = 0.8;
        p.armF = 2.3;
        p.armB = 1.9;
        p.tail = -0.25;
        p.sy = this.vy < 0 ? 1.08 : 0.97;
        p.sx = this.vy < 0 ? 0.94 : 1.02;
        if (this.def.doubleJump) {
          p.armF = 1.8 + Math.sin(t * 0.6) * 0.8;
          p.armB = 1.5 + Math.sin(t * 0.6) * 0.8;
        }
        break;
      case 'attack': {
        const mv = this.move;
        const fr = this.moveFrame;
        const k = kFrom(mv, fr);
        const kk = Math.max(0, k);
        p.face = 'attack';
        p.beak = 0.2 + kk * 0.2;
        switch (mv.pose) {
          case 'punch':
            p.armF = 0.4 + k * 1.2;
            p.armFExt = 1 + kk * 0.5;
            p.armB = 0.9;
            p.lean = 0.12 * k;
            break;
          case 'lowpunch':
            p.sy = 0.72;
            p.sx = 1.1;
            p.legF = 0.9;
            p.legB = -0.5;
            p.legFExt = 0.8;
            p.legBExt = 0.8;
            p.armF = 0.6 + k * 1.0;
            p.armFExt = 1 + kk * 0.5;
            p.lean = 0.15;
            break;
          case 'kick':
            p.legF = 0.1 + k * 1.45;
            p.legFExt = 1 + kk * 0.3;
            p.lean = -0.25 * kk;
            p.armB = -0.5;
            p.armF = 1.0;
            break;
          case 'sweep':
            p.sy = 0.7;
            p.sx = 1.12;
            p.legB = -0.6;
            p.legBExt = 0.8;
            p.legF = 0.5 + k * 1.1;
            p.legFExt = 1 + kk * 0.35;
            p.lean = 0.25;
            p.armF = 1.2;
            break;
          case 'airpunch':
            p.legF = 0.8;
            p.legB = 0.3;
            p.legFExt = 0.75;
            p.armF = 0.8 + k * 0.7;
            p.armFExt = 1 + kk * 0.5;
            p.armB = 1.8;
            break;
          case 'airkick':
            p.legF = 0.4 + k * 0.8;
            p.legFExt = 1 + kk * 0.35;
            p.legB = 0.5;
            p.legBExt = 0.7;
            p.armF = 2.2;
            p.armB = 2.0;
            p.lean = -0.15;
            break;
          case 'doublekick': {
            const ph = fr < 12 ? Math.min(1, fr / 8) : fr < 14 ? 0.5 : fr <= 19 ? 1 : Math.max(0, 1 - (fr - 19) / 18);
            p.legF = 0.2 + ph * 1.35;
            p.legB = 0.1 + ph * 1.2;
            p.legFExt = 1 + ph * 0.25;
            p.legBExt = 1 + ph * 0.2;
            p.lean = -0.5 * ph;
            p.tail = 0.25 * ph;
            p.bob = -ph * 10;
            p.armF = 1.2;
            p.armB = 0.8;
            break;
          }
          case 'throw':
            p.armF = fr < 12 ? -2.6 + (fr / 12) * 0.4 : Math.min(1.5, -2.2 + (fr - 12) * 0.7);
            p.armFExt = 1.1;
            p.lean = fr < 12 ? -0.15 : 0.15;
            p.armB = 0.6;
            break;
          case 'dive':
            if (fr < 10) {
              p.legF = 0.9;
              p.legB = 0.4;
              p.armF = 2.4;
              p.armB = 2.2;
            } else if (!this.moveData.landed) {
              p.lean = 1.0;
              p.armF = -1.5;
              p.armB = -1.8;
              p.armFExt = 1.2;
              p.legF = -0.9;
              p.legB = -1.1;
              p.beak = 0.02;
            } else {
              p.sy = 0.8;
              p.sx = 1.1;
            }
            break;
          case 'ball':
            p.ball = fr * 0.45 * (fr < 6 ? 0.3 : 1);
            break;
          case 'slap':
            p.lean = fr < 10 ? -0.2 : 0.45 * kk;
            p.head = fr < 10 ? -0.3 : 0.4;
            p.armF = fr < 10 ? 2.4 : 1.3;
            p.beak = 0.5;
            p.tail = fr < 10 ? 0.2 : -0.3;
            break;
          case 'bumbump': {
            const run = Math.sin(fr * 0.6);
            p.flip = -1;
            p.lean = -0.25;
            p.head = -0.2;
            p.legF = run * 0.6;
            p.legB = -run * 0.6;
            p.armF = 1.4;
            p.armB = 1.2;
            p.bob = -Math.abs(run) * 4;
            break;
          }
          case 'zoom': {
            const run = Math.sin(fr * 0.9);
            p.lean = 0.55;
            p.head = 0.5;
            p.legF = run * 1.1;
            p.legB = -run * 1.1;
            p.armF = -0.8;
            p.bob = -Math.abs(run) * 6;
            break;
          }
          case 'growl':
            p.lean = 0.3 * kk;
            p.head = 0.15;
            p.armF = 1.7;
            p.armB = 1.4;
            p.armFExt = 1.1;
            p.bob = fr > 9 && fr < 20 ? Math.sin(fr * 2) * 2 : 0;
            break;
          case 'bubble':
            p.lean = 0.12;
            p.head = 0.2;
            p.armF = 1.1;
            p.face = fr < 20 ? 'normal' : 'happy';
            break;
          case 'frill':
            p.frill = fr < 10 ? fr / 10 : fr < 30 ? 1 : Math.max(0, 1 - (fr - 30) / 12);
            p.armF = 2.5;
            p.armB = 2.3;
            p.lean = -0.15;
            break;
          case 'screech':
            p.crest = 1;
            p.head = 0.3;
            p.beak = 0.55;
            p.armF = 2.2;
            p.armB = 2.0;
            p.lean = 0.1;
            break;
          case 'findive':
            if (fr < 8) {
              p.lean = 0.7;
              p.armF = 2.8;
              p.armB = 2.6;
            } else {
              p.armF = 2.6;
              p.armB = 2.4;
              p.lean = -0.1;
              p.sy = 1.08;
            }
            break;
          case 'teardrop':
            p.armF = fr < 10 ? -2.4 : 1.4;
            p.face = 'hurt';
            p.sob = true;
            break;
          case 'pogo':
            p.legF = 0;
            p.legB = 0;
            p.legFExt = fr < 12 ? 0.8 : 1.1;
            p.legBExt = fr < 12 ? 0.8 : 1.1;
            p.armF = 2.4;
            p.armB = 2.2;
            p.sy = fr < 12 ? 0.9 : 1.12;
            p.tail = 0.3;
            break;
          case 'ram': {
            const run = Math.sin(fr * 0.6);
            p.lean = 0.65;
            p.head = 0.5;
            p.legF = run * 0.7;
            p.legB = -run * 0.7;
            p.armF = -0.6;
            p.armB = -0.9;
            break;
          }
          case 'tailspin': {
            const a = SF.clamp((fr - 6) / 20, 0, 1) * Math.PI * 2;
            p.flip = Math.cos(a) >= 0 ? 1 : -1;
            p.sx = Math.max(0.35, Math.abs(Math.cos(a)));
            p.tail = -0.35 * Math.sin(a / 2);
            p.sy = 0.9;
            p.armF = 1.4;
            p.armB = -1.2;
            break;
          }
        }
        break;
      }
      case 'hurt':
        p.lean = -0.35;
        p.armF = -0.6;
        p.armB = -1.0;
        p.legF = 0.4;
        p.face = 'hurt';
        p.head = -0.2;
        if (!this.onGround()) p.lean = -0.6;
        break;
      case 'blockstun':
        p.armF = 2.0;
        p.armB = 1.7;
        p.armFExt = 0.75;
        p.lean = -0.18;
        p.face = 'hurt';
        if (this.crouchBlock) {
          p.sy = 0.72;
          p.sx = 1.1;
        }
        break;
      case 'down':
      case 'ko':
        if (!this.onGround()) {
          p.lean = -0.8;
          p.face = this.state === 'ko' ? 'ko' : 'hurt';
          p.armF = -1.2;
          p.armB = -1.5;
        } else {
          p.lie = 1;
          p.face = this.state === 'ko' ? 'ko' : 'hurt';
          p.armF = 2.6;
          p.armB = 2.2;
          p.legF = 0.5;
          p.legB = 0.2;
        }
        break;
      case 'getup': {
        const k = this.stateTime / 18;
        p.lie = Math.max(0, 1 - k * 1.4);
        p.sy = 0.8 + 0.2 * k;
        p.face = 'normal';
        break;
      }
      case 'dizzy':
        p.lean = Math.sin(t * 0.12) * 0.2;
        p.head = Math.sin(t * 0.12 + 1) * 0.2;
        p.face = 'dizzy';
        p.armF = 0.2 + Math.sin(t * 0.15) * 0.3;
        p.armB = -0.2;
        break;
      case 'grabbed':
        p.face = 'hurt';
        p.armF = 2.5;
        p.armB = 2.2;
        break;
      case 'victory': {
        const s = Math.abs(Math.sin(t * 0.12));
        p.face = this.def.id === 'kooka' ? 'laugh' : 'happy';
        p.armF = 2.8 + Math.sin(t * 0.25) * 0.15;
        p.armB = 2.6 - Math.sin(t * 0.25) * 0.15;
        p.bob = this.onGround() ? -s * 12 : 0;
        p.beak = 0.35;
        p.head = -0.1;
        break;
      }
      case 'ultCine':
        p.face = 'attack';
        p.armF = 2.6;
        p.armB = -1.6;
        p.lean = -0.1;
        p.bob = Math.sin(t * 1.2) * 1.5;
        p.beak = 0.35;
        p.sy = 1.05;
        break;
      case 'ult':
        this.ultPoseInto(p, t);
        break;
    }
    if (this.hp <= 0 && this.state !== 'ko') p.face = 'ko';
    return p;
  }

  ultPoseInto(p, t) {
    p.face = 'attack';
    p.beak = 0.3;
    switch (this.ultPose) {
      case 'kip_crouch':
        p.sy = 0.72;
        p.sx = 1.15;
        p.legF = 0.8;
        p.legB = 0.5;
        p.legFExt = 0.8;
        p.armF = 0.9;
        break;
      case 'kip_rise':
        p.sy = 1.25;
        p.sx = 0.85;
        p.armF = 2.9;
        p.armB = 2.8;
        p.legF = 0.05;
        p.legB = -0.05;
        p.face = 'happy';
        break;
      case 'kip_fall':
        p.sy = 1.15;
        p.sx = 0.9;
        p.armF = 2.6;
        p.armB = 2.5;
        p.legF = 0;
        p.legB = 0;
        break;
      case 'kip_land':
        p.sy = 0.72;
        p.sx = 1.25;
        p.armF = 1.6;
        p.armB = -1.6;
        p.legF = 0.6;
        p.legB = -0.6;
        break;
      case 'koko_stomp': {
        const up = Math.floor(this.ultFrame / 12) % 2 === 0;
        p.face = 'grumpy';
        p.legF = up ? 0.9 : 0.1;
        p.legFExt = up ? 0.7 : 1;
        p.legB = up ? -0.1 : -0.6;
        p.legBExt = up ? 1 : 0.7;
        p.armF = 2.5 + Math.sin(t * 0.6) * 0.2;
        p.armB = 2.3;
        p.bob = up ? -5 : 0;
        break;
      }
      case 'kooka_laugh':
        p.face = 'laugh';
        p.lean = -0.3;
        p.head = -0.45;
        p.beak = 0.55;
        p.armF = 1.8 + Math.sin(t * 0.8) * 0.8;
        p.armB = 1.6 + Math.sin(t * 0.8 + 0.5) * 0.8;
        p.bob = Math.sin(t * 0.8) * 3;
        break;
      case 'kooka_swoop':
        p.lean = 1.35;
        p.armF = -1.8;
        p.armB = -2.0;
        p.armFExt = 1.2;
        p.legF = -1.2;
        p.legB = -1.3;
        p.beak = 0.02;
        break;
      case 'croc_lunge':
        p.lean = 0.45;
        p.armF = 1.6;
        p.armB = 1.5;
        p.armFExt = 1.2;
        p.beak = 0.5;
        p.legF = 0.6;
        p.legB = -0.6;
        break;
      case 'croc_roll':
        p.armF = 1.3;
        p.armB = 1.2;
        p.beak = 0.02;
        p.face = 'happy';
        break;
      case 'spike_ball':
        p.ball = t * 0.45;
        break;
      case 'dotty_dive':
        p.lean = 0.6;
        p.armF = 2.8;
        p.armB = 2.6;
        p.head = 0.4;
        break;
      case 'dotty_rise':
        p.lean = -0.1;
        p.armF = 2.8;
        p.armB = 2.6;
        p.beak = 0.6;
        p.face = 'laugh';
        p.sy = 1.1;
        break;
      case 'wombo_squat': {
        const shake = Math.sin(t * 1.3) * 1.5;
        p.face = 'grumpy';
        p.sy = 0.82;
        p.sx = 1.12;
        p.bob = shake;
        p.legF = 0.8;
        p.legB = -0.8;
        p.armF = 1.2;
        p.armB = 1.0;
        break;
      }
      case 'dash_whistle':
        p.head = -0.4;
        p.beak = 0.5;
        p.face = 'laugh';
        p.armF = 2.5;
        break;
      case 'dash_cheer':
        p.face = 'happy';
        p.bob = -Math.abs(Math.sin(t * 0.3)) * 10;
        p.armF = 2.8;
        p.head = -0.2;
        break;
      case 'taz_spin':
        p.special = true;
        break;
      case 'taz_dizzy':
        p.face = 'dizzy';
        p.lean = Math.sin(t * 0.2) * 0.25;
        p.head = Math.sin(t * 0.2 + 1) * 0.3;
        p.armF = 1.2 + Math.sin(t * 0.3) * 0.5;
        break;
      case 'shelly_call':
        p.face = 'happy';
        p.armF = 2.7;
        p.armB = 2.5;
        p.bob = -Math.abs(Math.sin(t * 0.3)) * 6;
        break;
      case 'shelly_surf':
        p.face = 'laugh';
        p.lean = 0.2;
        p.armF = 1.7;
        p.armB = -1.5;
        p.legF = 0.5;
        p.legB = -0.5;
        break;
      case 'lizzie_run': {
        const r = Math.sin(t * 1.2);
        p.lean = 0.55;
        p.frill = 0.6;
        p.legF = r * 1.2;
        p.legB = -r * 1.2;
        p.armF = -0.9;
        p.armB = -1.1;
        p.bob = -Math.abs(r) * 6;
        p.tail = -0.4;
        break;
      }
      case 'lizzie_flare':
        p.frill = 1;
        p.armF = 2.6;
        p.armB = 2.4;
        p.lean = -0.2;
        break;
      case 'cheeky_call':
        p.face = 'laugh';
        p.crest = 1;
        p.head = -0.35;
        p.beak = 0.5;
        p.armF = 1.9 + Math.sin(t * 0.8) * 0.8;
        p.armB = 1.7 + Math.sin(t * 0.8 + 0.5) * 0.8;
        break;
      case 'sly_call':
        p.face = 'laugh';
        p.armF = 2.7;
        p.armB = 2.5;
        p.head = -0.25;
        break;
      case 'cry_sob':
        p.face = 'hurt';
        p.sob = true;
        p.armF = 2.6 + Math.sin(t * 0.9) * 0.2;
        p.armB = 2.4;
        p.bob = Math.sin(t * 0.9) * 2;
        break;
      case 'greg_ball':
        p.sy = 0.75;
        p.sx = 0.95;
        p.legF = 1.4;
        p.legB = 1.2;
        p.legFExt = 0.6;
        p.legBExt = 0.6;
        p.armF = 1.6;
        p.armB = 1.4;
        p.lean = 0.5;
        break;
      case 'greg_kick':
        p.legF = 1.5;
        p.legFExt = 1.3;
        p.legB = 0.8;
        p.lean = -0.3;
        p.armF = 2.2;
        break;
      case 'bud_climb':
        p.face = 'grumpy';
        p.armF = 1.2;
        p.bob = Math.sin(t * 1.2) * 1.5;
        break;
      case 'bud_butt':
        p.lean = 0.8;
        p.head = 0.5;
        p.armF = -1.2;
        p.armB = -1.4;
        p.legF = -0.6;
        p.legB = -0.9;
        break;
      case 'croc_recover':
      default:
        p.armF = 0.8;
        p.armB = 0.3;
        break;
    }
  }

  // ------------------------------------------------------------------ draw
  drawShadow(ctx) {
    const h = SF.GROUND - this.y;
    const s = Math.max(0.35, 1 - h / 400);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(this.x, SF.GROUND + 4, this.def.width * 0.75 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.target) {
      const k = 0.5 + 0.5 * Math.sin(this.anim * 0.4);
      ctx.strokeStyle = `rgba(255,60,60,${0.5 + k * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(this.x, SF.GROUND + 4, 180, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      SF.outlineText(ctx, '!', this.x, SF.GROUND - 40, 40 + k * 8, '#ff4d4d');
    }
    ctx.restore();
  }

  draw(ctx, tag) {
    const p = this.getPose();
    if (this.trail) {
      this.trail.forEach((g, i) => {
        ctx.save();
        ctx.globalAlpha = 0.12 + i * 0.06;
        ctx.translate(g.x, g.y);
        ctx.scale(g.facing, 1);
        this.def.draw(ctx, p, this.pal);
        ctx.restore();
      });
    }
    ctx.save();
    if (this.invuln > 0 && this.state === 'getup' && Math.floor(this.anim / 3) % 2) ctx.globalAlpha = 0.55;
    ctx.translate(this.x, this.y);

    // ultimate-ready glow
    if (this.meter >= 100 || this.state === 'charge' || this.state === 'ultCine') {
      const k = 0.5 + 0.5 * Math.sin(this.anim * 0.2);
      const g = ctx.createRadialGradient(0, -this.def.height / 2, 10, 0, -this.def.height / 2, this.def.height * 0.75);
      g.addColorStop(0, `rgba(255,230,90,${0.35 + k * 0.2})`);
      g.addColorStop(1, 'rgba(255,200,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -this.def.height / 2, this.def.height * 0.6, this.def.height * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.scale(this.facing * p.flip, 1);
    if (p.lie > 0) {
      ctx.translate(0, -22 * p.lie);
      ctx.rotate(-Math.PI / 2 * p.lie);
    }
    if (this.spin) {
      ctx.translate(0, -this.def.height / 2);
      ctx.rotate(this.spin);
      ctx.translate(0, this.def.height / 2);
    }
    if (this.sink > 0) {
      ctx.beginPath();
      ctx.rect(-200, -400, 400, 400);
      ctx.clip();
      ctx.translate(0, this.sink * (this.def.height + 20));
    }
    ctx.translate(0, p.bob);
    ctx.scale(p.sx, p.sy);
    if (p.ball != null && this.def.drawBall) this.def.drawBall(ctx, p, this.pal);
    else if (p.special && this.def.drawSpecial) this.def.drawSpecial(ctx, p, this.pal);
    else this.def.draw(ctx, p, this.pal);
    ctx.restore();

    if (this.sink > 0.5 && this.def.drawSunk) {
      ctx.save();
      ctx.scale(this.facing, 1);
      this.def.drawSunk(ctx, p, this.pal);
      ctx.restore();
    }
    if (this.state === 'dizzy' || (this.state === 'ko' && this.onGround())) {
      const hy = this.state === 'ko' ? -30 : -this.def.height - 10;
      const hx = this.state === 'ko' ? -this.facing * 90 : 0;
      for (let i = 0; i < 3; i++) {
        const a = this.anim * 0.12 + (i * Math.PI * 2) / 3;
        SF.D.star(ctx, hx + Math.cos(a) * 28, hy + Math.sin(a) * 8, 8, '#ffe14a', a);
      }
    }
    if (tag && this.state !== 'ko' && this.y > -50) {
      const ty = -this.def.height - 34 + (this.state === 'crouch' ? 50 : 0);
      ctx.fillStyle = tag.color;
      ctx.beginPath();
      ctx.moveTo(-7, ty + 10);
      ctx.lineTo(7, ty + 10);
      ctx.lineTo(0, ty + 18);
      ctx.fill();
      SF.outlineText(ctx, tag.text, 0, ty, 18, tag.color);
    }
    ctx.restore();
  }
};

// Draw a fighter standing idle, for menus and portraits.
SF.drawPortrait = (canvas, id, opts = {}) => {
  const ctx = canvas.getContext('2d');
  const def = SF.FIGHTERS[id];
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const s = (h * (opts.zoom || 0.85)) / (def.height + 30);
  ctx.save();
  const dx = (opts.dx != null ? opts.dx : def.portraitDx || 0) * (opts.flip ? -1 : 1);
  ctx.translate(w / 2 + dx * s, h - (opts.bottom || 8) * s);
  ctx.scale(s * (opts.flip ? -1 : 1), s);
  const t = opts.t || 0;
  const pose = {
    t, bob: Math.sin(t * 0.08) * 2, lean: 0, head: 0, beak: opts.happy ? 0.3 : 0.05,
    armF: opts.happy ? 2.7 : 0.6, armB: opts.happy ? 2.5 : 0.3, armFExt: 1, armBExt: 1,
    legF: 0.12, legB: -0.12, legFExt: 1, legBExt: 1, sx: 1, sy: 1, tail: 0,
    face: opts.face || (opts.happy ? 'happy' : 'normal'), lie: 0, flip: 1,
  };
  def.draw(ctx, pose, opts.alt ? def.alt : def.pal);
  ctx.restore();
};
