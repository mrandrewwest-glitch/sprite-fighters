// One match between two fighters: rounds, hits, hazards, camera and HUD.
(() => {
  const W = SF.W;
  const H = SF.H;
  const CINE = 58;
  let bearSeq = 0;

  class DropBear {
    constructor(x) {
      this.x = SF.clamp(x, 80, W - 80);
      this.y = -60;
      this.vx = 0;
      this.vy = 0;
      this.t = 0;
      this.phase = 'warn';
      this.hits = new Set();
      this.id = 'bear' + bearSeq++;
    }
    update(m) {
      this.t++;
      if (this.phase === 'warn') {
        if (this.t > 75) {
          this.phase = 'fall';
          m.sfx('whistle');
        }
      } else if (this.phase === 'fall') {
        this.vy += 0.9;
        this.y += this.vy;
        m.f.forEach((f) => {
          const r = m.tryHit(null, f, { x: this.x - 26, y: this.y - 50, w: 52, h: 50 }, {
            id: this.id, hitSet: this.hits, dmg: 5, kb: 3, stun: 24, kbDir: Math.sign(f.x - this.x) || 1,
            sfx: 'bonk', word: 'BONK!', noMeter: true,
          });
          if (r === 'hit') this.bounce(m);
        });
        if (this.y >= SF.GROUND) {
          this.y = SF.GROUND;
          m.sfx('land');
          m.fx.dust(this.x, SF.GROUND, false);
          this.bounce(m);
        }
      } else {
        this.vy += 0.9;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y >= SF.GROUND) {
          this.y = SF.GROUND;
          this.vy = -6;
        }
        if (this.x < -80 || this.x > W + 80) this.dead = true;
      }
    }
    bounce() {
      if (this.phase === 'run') return;
      this.phase = 'run';
      this.vy = -10;
      this.vx = this.x < W / 2 ? -5 : 5;
    }
    drawBack(ctx) {
      if (this.phase === 'run') return;
      const k = this.phase === 'warn' ? this.t / 75 : 1;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(this.x, SF.GROUND + 4, 40 * k, 7 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.phase === 'warn' && Math.floor(this.t / 8) % 2) SF.outlineText(ctx, 'DROP BEAR!', this.x, SF.GROUND - 190, 22, '#ff9d3c');
      ctx.restore();
    }
    draw(ctx) {
      if (this.phase === 'warn') return;
      const D = SF.D;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.phase === 'run') ctx.scale(this.vx > 0 ? 1 : -1, 1);
      const legs = this.phase === 'run' ? Math.sin(this.t * 0.6) * 0.6 : 0;
      D.limb(ctx, -8, -14, legs, 12, 8, '#7d7f8a');
      D.limb(ctx, 8, -14, -legs, 12, 8, '#7d7f8a');
      D.ell(ctx, 0, -26, 20, 18, '#9a9ca8');
      D.ell(ctx, -16, -50, 10, 10, '#9a9ca8');
      D.ell(ctx, 16, -50, 10, 10, '#9a9ca8');
      D.ell(ctx, -16, -50, 5, 5, '#f2f2f2', 0, false);
      D.ell(ctx, 16, -50, 5, 5, '#f2f2f2', 0, false);
      D.ell(ctx, 0, -42, 18, 15, '#9a9ca8');
      ctx.fillStyle = '#111';
      SF.roundRect(ctx, -15, -49, 13, 7, 3);
      ctx.fill();
      SF.roundRect(ctx, 2, -49, 13, 7, 3);
      ctx.fill();
      D.line(ctx, -3, -46, 3, -46, 2, '#111');
      D.ell(ctx, 0, -38, 5, 4, '#2b2b2b', 0, false);
      D.mouth(ctx, 0, -31, 9, 'happy');
      ctx.restore();
    }
  }

  SF.Match = class {
    constructor(o) {
      this.o = o;
      this.fx = new SF.Effects();
      this.projectiles = [];
      this.entities = [];
      this.f = [new SF.Fighter(o.p1, 0, this, false), new SF.Fighter(o.p2, 1, this, o.p1 === o.p2)];
      this.ctrl = o.controllers.map((c) => (c.type === 'ai' ? new SF.AI(c.level) : c));
      this.ctrl.forEach((c, i) => {
        if (c instanceof SF.AI) this.f[i].handicap = c.p.dmg;
      });
      this.stage = o.stage;
      this.t = 0;
      this.frame = 0;
      this.round = 1;
      this.wins = [0, 0];
      this.needed = Math.ceil((o.rounds || 3) / 2);
      this.hitstop = 0;
      this.slow = 0;
      this.cine = null;
      this.cam = { zoom: 1, x: W / 2, y: H / 2 };
      this.banner = null;
      this.paused = false;
      this.ended = false;
      this.startRound(true);
    }

    sfx(n) {
      if (!this.o.silent) SF.Audio.play(n);
    }
    say(t) {
      if (!this.o.silent) SF.Audio.say(t);
    }
    opponentOf(f) {
      return this.f[f.side === 0 ? 1 : 0];
    }
    isHuman(i) {
      return !(this.ctrl[i] instanceof SF.AI);
    }

    boxFront(f, b) {
      const x = f.facing > 0 ? f.x + b.x : f.x - b.x - b.w;
      return { x, y: f.y + b.y, w: b.w, h: b.h };
    }

    addProjectile(p) {
      p.id = (SF._projSeq = (SF._projSeq || 0) + 1);
      p.t = 0;
      this.projectiles.push(p);
    }
    addEntity(e) {
      this.entities.push(e);
    }

    showBanner(text, dur = 60, color = '#ffd24a', size = 84) {
      this.banner = { text, t: 0, dur, color, size };
    }

    startRound(first) {
      this.f.forEach((f) => f.resetRound());
      this.projectiles = [];
      this.entities = [];
      this.timer = this.o.timer || 0;
      this.timerFrames = 0;
      this.roundState = 'intro';
      this.introT = 0;
      this.quotes = first && !this.o.silent;
      this.bearTimer = SF.rand(500, 900);
      this.koT = 0;
      this.result = null;
    }

    startCinematic(f) {
      this.cine = { f, t: 0 };
      this.sfx('ult');
      this.say(f.def.ultimate.name.replace('...', ''));
    }

    // Returns 'hit', 'block' or 'miss'.
    tryHit(att, def, box, p) {
      if (!def || this.roundState !== 'fight') return 'miss';
      const store = p.hitSet || (att && att.hitIds);
      const key = p.hitSet ? p.id + ':' + def.side : p.id + '#' + (att ? att.ultSeq : 0);
      if (store && store.has(key)) return 'miss';
      if (['ko', 'down', 'getup', 'ultCine'].includes(def.state)) return 'miss';
      if (def.invuln > 0) return 'miss';
      if (def.state === 'ult' && !(def.ultData && def.ultData.vulnerable)) return 'miss';
      if (def.state === 'grabbed' && !(att && att.state === 'ult')) return 'miss';
      const hb = def.hurtbox();
      if (!SF.overlap(box, hb)) return 'miss';
      if (store) {
        store.add(key);
        if (store.size > 300) store.clear();
      }

      const kbDir = p.kbDir || (att ? Math.sign(def.x - att.x) || att.facing : 1);
      const cx = SF.clamp((Math.max(box.x, hb.x) + Math.min(box.x + box.w, hb.x + hb.w)) / 2, hb.x, hb.x + hb.w);
      const cy = SF.clamp(box.y + box.h / 2, hb.y + 10, hb.y + hb.h - 10);
      const power = att ? att.def.power * att.handicap : 1;
      let dmg = p.dmg * power * def.def.defense;

      const blocking = !p.unblockable && def.canBlock() && (kbDir > 0 ? def.inp.right : def.inp.left);
      if (blocking) {
        dmg *= p.chip != null ? p.chip : 0.12;
        def.hp = Math.max(1, def.hp - dmg);
        def.crouchBlock = !!def.inp.down;
        def.setState('blockstun');
        def.stateTime = 0;
        def.stun = Math.round(p.stun * 0.6) + 2;
        def.vx = kbDir * (p.kb * 0.8 + 1.5);
        def.meter = Math.min(100, def.meter + 3);
        if (att && !p.noMeter) att.meter = Math.min(100, att.meter + 1.5);
        this.fx.blockSpark(cx - kbDir * 10, cy);
        this.sfx('block');
        this.hitstop = Math.max(this.hitstop, 4);
        return 'block';
      }

      def.hp -= dmg;
      def.napTime = 0;
      if (att && !p.noMeter && att.state !== 'ult') att.meter = Math.min(100, att.meter + dmg * 0.9);
      def.meter = Math.min(100, def.meter + dmg * 0.55);

      if (!p.hold) {
        if (def.state === 'dizzy' && p.keepDizzy) {
          def.stun = Math.max(def.stun, 60);
          def.vx = kbDir * p.kb;
        } else {
          if (def.state === 'ult') def.cleanupUlt();
          def.move = null;
          def.noGravity = false;
          def.spin = 0;
          def.state = 'hurt';
          def.stateTime = 0;
          def.stun = p.stun;
          def.vx = kbDir * p.kb;
          def.kdPending = false;
          if (p.knockdown) {
            def.kdPending = true;
            def.vy = -(p.launch || 5);
          } else if (!def.onGround()) {
            def.vy = Math.min(def.vy, -4);
            def.kdPending = !!p.big;
          }
          if (p.dizzy) {
            def.state = 'dizzy';
            def.stun = p.dizzy;
            def.kdPending = false;
          }
        }
      }

      this.fx.spark(cx, cy, !!p.big);
      if (p.word || p.big || Math.random() < 0.3) this.fx.text(p.word || SF.pick(SF.HIT_WORDS), cx, cy - 60, '#ffe14a', p.big ? 44 : 30);
      this.sfx(p.big ? 'bighit' : p.sfx || 'hit');
      this.fx.shake(p.big ? 12 : 3);
      this.hitstop = Math.max(this.hitstop, p.big ? 12 : p.hold ? 3 : 6);
      if (def.hp <= 0) this.knockOut(def, kbDir);
      return 'hit';
    }

    knockOut(def, dir) {
      def.hp = 0;
      if (def.state === 'ult') def.cleanupUlt();
      def.move = null;
      def.noGravity = false;
      def.spin = 0;
      def.state = 'ko';
      def.stateTime = 0;
      def.vy = -10;
      def.vx = dir * 6;
    }

    readCtrl(i) {
      const c = this.ctrl[i];
      if (c instanceof SF.AI) return c.update(this.f[i], this.f[1 - i], this);
      return SF.Input.read(c.slot, c.merged);
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
          f.beginUlt(this.opponentOf(f));
        }
        return;
      }
      if (this.hitstop > 0) {
        this.hitstop--;
        this.fx.update();
        return;
      }
      if (this.slow > 0) {
        this.slow--;
        if (this.slow % 2) return;
      }
      this.frame++;

      const fighting = this.roundState === 'fight';
      this.f.forEach((f, i) => {
        // Humans are always read so taps made before "FIGHT!" are thrown away.
        const raw = fighting || this.isHuman(i) ? this.readCtrl(i) : null;
        f.setInput(fighting ? raw : SF.blankInput());
      });
      this.f[0].update(this.f[1]);
      this.f[1].update(this.f[0]);
      this.push(this.f[0], this.f[1]);

      const hits = [];
      this.f.forEach((f) => f.activeHits().forEach((h) => hits.push([f, this.opponentOf(f), h])));
      hits.forEach(([a, d, h]) => this.tryHit(a, d, h.box, h.props));

      this.updateProjectiles();
      this.entities.forEach((e) => e.update(this));
      this.entities = this.entities.filter((e) => !e.dead);
      this.fx.update();

      if (fighting && SF.settings.dropBears && !this.o.noBears) {
        if (--this.bearTimer <= 0) {
          this.bearTimer = SF.rand(900, 1500);
          this.addEntity(new DropBear(SF.pick(this.f).x));
        }
      }

      this.roundLogic();
      this.updateCamera();

      this.f.forEach((f, i) => {
        if (this.isHuman(i)) SF.Input.setChargeReady(this.ctrl[i].slot, f.meter >= 100);
      });
    }

    push(a, b) {
      const skip = ['grabbed', 'ko', 'down'];
      if (skip.includes(a.state) || skip.includes(b.state) || a.noClamp || b.noClamp) return;
      if (Math.abs(a.y - b.y) > 100) return;
      const minD = ((a.def.width + b.def.width) / 2) * 1.1;
      const dx = b.x - a.x;
      if (Math.abs(dx) >= minD) return;
      const s = dx === 0 ? (a.facing > 0 ? 1 : -1) : Math.sign(dx);
      const push = (minD - Math.abs(dx)) / 2;
      a.x -= s * push;
      b.x += s * push;
      const clampF = (f) => (f.x = SF.clamp(f.x, SF.WALL_L, SF.WALL_R));
      clampF(a);
      clampF(b);
      if (Math.abs(b.x - a.x) < minD - 1) {
        if (a.x <= SF.WALL_L || a.x >= SF.WALL_R) b.x = a.x + s * minD;
        else a.x = b.x - s * minD;
        clampF(a);
        clampF(b);
      }
    }

    updateProjectiles() {
      for (const p of this.projectiles) {
        p.t++;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        const o = this.opponentOf(p.owner);
        const box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
        const r = this.tryHit(p.owner, o, box, Object.assign({}, p.props, { id: 'p' + p.id, kbDir: Math.sign(p.vx) }));
        if (r !== 'miss') p.dead = true;
        if (p.life <= 0 || p.x < -60 || p.x > W + 60) p.dead = true;
      }
      for (let i = 0; i < this.projectiles.length; i++) {
        for (let j = i + 1; j < this.projectiles.length; j++) {
          const a = this.projectiles[i];
          const b = this.projectiles[j];
          if (a.owner !== b.owner && Math.abs(a.x - b.x) < 30 && Math.abs(a.y - b.y) < 40) {
            a.dead = b.dead = true;
            this.fx.spark((a.x + b.x) / 2, (a.y + b.y) / 2, false);
          }
        }
      }
      this.projectiles = this.projectiles.filter((p) => !p.dead);
    }

    roundLogic() {
      if (this.roundState === 'intro') {
        this.introT++;
        const off = this.quotes ? 110 : 0;
        if (this.introT === off + 1) {
          const final = this.round > 1 && this.wins[0] === this.needed - 1 && this.wins[1] === this.needed - 1;
          const txt = final ? 'FINAL ROUND' : 'ROUND ' + this.round;
          this.showBanner(txt, 55);
          this.sfx('gong');
          this.say(final ? 'Final round!' : 'Round ' + this.round);
        }
        if (this.introT === off + 60) {
          this.showBanner('FIGHT!', 40, '#ff5a3c', 110);
          this.sfx('fight');
          this.say('Fight!');
          this.roundState = 'fight';
          this.f.forEach((f) => f.setState('idle'));
        }
        return;
      }
      if (this.roundState === 'fight') {
        if (this.timer > 0 && ++this.timerFrames >= 60) {
          this.timerFrames = 0;
          this.timer--;
          if (this.timer <= 0) {
            this.roundState = 'ko';
            this.koT = 0;
            this.timeUp = true;
            this.showBanner('TIME UP!', 80, '#ffd24a');
            this.sfx('gong');
            this.say('Time up!');
            return;
          }
        }
        if (this.f.some((f) => f.hp <= 0)) {
          this.roundState = 'ko';
          this.koT = 0;
          this.timeUp = false;
          this.slow = 70;
          this.showBanner('K.O.!', 70, '#ff5a3c', 120);
          this.sfx('ko');
          this.fx.shake(14);
          this.say(SF.pick(SF.KO_WORDS).replace('!', ''));
        }
        return;
      }
      if (this.roundState === 'ko') {
        this.koT++;
        if (this.koT === 100) {
          let w = -1;
          const [a, b] = this.f;
          if (this.timeUp) {
            const pa = a.hp / a.maxHp;
            const pb = b.hp / b.maxHp;
            w = pa > pb ? 0 : pb > pa ? 1 : -1;
          } else if (a.hp > 0 && b.hp <= 0) w = 0;
          else if (b.hp > 0 && a.hp <= 0) w = 1;
          this.result = w;
          if (w >= 0) {
            const wf = this.f[w];
            if (wf.state === 'ult' || wf.state === 'ultCine') wf.cleanupUlt();
            wf.move = null;
            wf.setState('victory');
            this.wins[w]++;
            const done = this.wins[w] >= this.needed;
            this.showBanner(done ? wf.def.name + ' WINS!' : SF.pick(SF.KO_WORDS), 110, '#ffd24a', 72);
            if (!this.o.silent && done) SF.Audio.play('win');
            const loser = this.f[1 - w];
            if (this.timeUp && loser.state !== 'ko') {
              loser.setState('dizzy');
              loser.stun = 999;
            }
          } else {
            this.showBanner('DRAW!', 110, '#ffffff', 90);
          }
        }
        if (this.koT === 230) {
          if (this.wins.some((n) => n >= this.needed)) {
            this.roundState = 'over';
            if (!this.ended) {
              this.ended = true;
              if (this.o.onEnd) this.o.onEnd(this.wins[0] >= this.needed ? 0 : 1, this);
            }
          } else {
            this.round++;
            this.startRound(false);
          }
        }
      }
    }

    updateCamera() {
      let z = 1;
      let cx = W / 2;
      let cy = H / 2;
      if (this.cine) {
        const f = this.cine.f;
        z = 1.45;
        cx = f.x;
        cy = f.y - 90;
      }
      this.cam.zoom += (z - this.cam.zoom) * 0.18;
      const hw = W / 2 / this.cam.zoom;
      const hh = H / 2 / this.cam.zoom;
      this.cam.x += (SF.clamp(cx, hw, W - hw) - this.cam.x) * 0.2;
      this.cam.y += (SF.clamp(cy, hh, H - hh) - this.cam.y) * 0.2;
      const hw2 = W / 2 / this.cam.zoom;
      const hh2 = H / 2 / this.cam.zoom;
      this.cam.x = SF.clamp(this.cam.x, hw2, W - hw2);
      this.cam.y = SF.clamp(this.cam.y, hh2, H - hh2);
    }

    // ---------------------------------------------------------------- render
    render(ctx) {
      const sh = this.fx.shakeAmt;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(this.cam.zoom, this.cam.zoom);
      ctx.translate(-this.cam.x + SF.rand(-sh, sh), -this.cam.y + SF.rand(-sh, sh));
      SF.drawStage(ctx, this.stage, this.t);
      this.entities.forEach((e) => e.drawBack && e.drawBack(ctx));
      if (this.cine) {
        ctx.fillStyle = `rgba(10,5,30,${Math.min(0.6, this.cine.t / 12)})`;
        ctx.fillRect(-50, -50, W + 100, H + 100);
      }
      this.f.forEach((f) => f.drawShadow(ctx));
      const order = this.f.slice().sort((a, b) => this.drawRank(a) - this.drawRank(b));
      order.forEach((f) => f.draw(ctx, this.tagFor(f.side)));
      this.projectiles.forEach((p) => p.draw(ctx, p.t));
      this.entities.forEach((e) => e.draw(ctx));
      this.fx.draw(ctx);
      ctx.restore();

      if (this.cine) this.drawCine(ctx);
      if (!this.o.noHud) this.drawHud(ctx);
      if (this.quotes && this.roundState === 'intro' && this.introT < 110) this.drawQuotes(ctx);
      if (this.banner) this.drawBanner(ctx);
    }

    drawRank(f) {
      if (f.state === 'ult' || f.state === 'ultCine') return 3;
      if (f.state === 'attack') return 2;
      if (f.state === 'grabbed') return 0;
      return 1;
    }

    tagFor(side) {
      if (this.o.noHud) return null;
      const human = this.isHuman(side);
      const humans = this.ctrl.filter((c) => !(c instanceof SF.AI)).length;
      if (humans === 0) return null;
      if (!human) return { text: 'CPU', color: '#c9c9c9' };
      return { text: 'P' + (side + 1), color: side === 0 ? '#ff6b6b' : '#4ab3ff' };
    }

    drawCine(ctx) {
      const f = this.cine.f;
      const t = this.cine.t;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const y = ((i * 53 + t * 23) % (H + 40)) - 20;
        const x = ((i * 137) % W);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 140, y);
        ctx.stroke();
      }
      const slide = Math.min(1, t / 10);
      const bx = SF.lerp(W + 400, W / 2, slide);
      ctx.save();
      ctx.translate(bx, H - 110);
      ctx.rotate(-0.06);
      ctx.fillStyle = 'rgba(20,10,40,0.85)';
      ctx.fillRect(-W, -46, W * 2, 92);
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(-W, -46, W * 2, 5);
      ctx.fillRect(-W, 41, W * 2, 5);
      SF.outlineText(ctx, f.def.full.toUpperCase(), 0, -18, 22, '#ffffff');
      SF.outlineText(ctx, '⚡ ' + f.def.ultimate.name.toUpperCase() + ' ⚡', 0, 14, 40, '#ffd24a');
      ctx.restore();
      ctx.restore();
    }

    drawHud(ctx) {
      const barW = 370;
      const barH = 24;
      this.f.forEach((f, i) => {
        const left = i === 0;
        const x = left ? 24 : W - 24 - barW;
        const y = 16;
        ctx.save();
        SF.roundRect(ctx, x - 3, y - 3, barW + 6, barH + 6, 8);
        ctx.fillStyle = '#1a0d05';
        ctx.fill();
        SF.roundRect(ctx, x, y, barW, barH, 6);
        ctx.fillStyle = '#3a2a2a';
        ctx.fill();
        const lag = (f.dispHp / f.maxHp) * barW;
        const cur = (Math.max(0, f.hp) / f.maxHp) * barW;
        ctx.fillStyle = '#ff9f9f';
        ctx.fillRect(left ? x : x + barW - lag, y, lag, barH);
        const pct = f.hp / f.maxHp;
        ctx.fillStyle = pct > 0.5 ? '#5ad14a' : pct > 0.25 ? '#ffd24a' : '#ff5a3c';
        ctx.fillRect(left ? x : x + barW - cur, y, cur, barH);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(left ? x : x + barW - cur, y + 3, cur, 5);
        // name
        const tag = this.tagFor(i);
        const name = f.def.name + (tag ? '  ' + tag.text : '');
        SF.outlineText(ctx, name, left ? x + 4 : x + barW - 4, y + barH + 18, 22, '#ffffff', '#1a0d05', left ? 'left' : 'right');
        // hard yakka meter
        const mw = 200;
        const mx = left ? x : x + barW - mw;
        const my = y + barH + 34;
        SF.roundRect(ctx, mx - 2, my - 2, mw + 4, 16, 6);
        ctx.fillStyle = '#1a0d05';
        ctx.fill();
        const full = f.meter >= 100;
        const pulse = 0.5 + 0.5 * Math.sin(this.t * 0.25);
        const mcur = (f.meter / 100) * mw;
        ctx.fillStyle = full ? `rgb(255,${200 + pulse * 55},${40 + pulse * 120})` : '#4ab3ff';
        ctx.fillRect(left ? mx : mx + mw - mcur, my, mcur, 12);
        const label = full ? '⚡ ULTIMATE READY!' : 'HARD YAKKA';
        SF.outlineText(ctx, label, left ? mx + mw + 8 : mx - 8, my + 6, 14, full ? '#ffd24a' : '#bfe3ff', '#1a0d05', left ? 'left' : 'right');
        // round wins
        for (let k = 0; k < this.needed; k++) {
          const sx = left ? W / 2 - 62 - k * 24 : W / 2 + 62 + k * 24;
          SF.D.star(ctx, sx, 64, 9, k < this.wins[i] ? '#ffd24a' : 'rgba(255,255,255,0.25)');
        }
        ctx.restore();
      });
      // timer
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, 32, 27, 0, Math.PI * 2);
      ctx.fillStyle = '#1a0d05';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd24a';
      ctx.stroke();
      const txt = this.o.timer ? String(Math.max(0, this.timer)) : '∞';
      SF.outlineText(ctx, txt, W / 2, 34, 28, this.timer <= 10 && this.o.timer ? '#ff5a3c' : '#ffffff');
      ctx.restore();
    }

    drawQuotes(ctx) {
      const k = Math.min(1, this.introT / 10);
      this.f.forEach((f, i) => {
        const x = f.x + (i === 0 ? 40 : -40);
        const y = f.y - f.def.height - 70;
        ctx.save();
        ctx.globalAlpha = k;
        ctx.font = `20px ${SF.FONT}`;
        const text = f.def.intro;
        const w = Math.min(300, ctx.measureText(text).width + 30);
        const bx = SF.clamp(x - w / 2, 10, W - w - 10);
        SF.roundRect(ctx, bx, y - 26, w, 48, 14);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1a0d05';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(f.x - 8, y + 21);
        ctx.lineTo(f.x + 8, y + 21);
        ctx.lineTo(f.x, y + 40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1a0d05';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.wrapText(ctx, text, bx + w / 2, y - 2, w - 20, 20);
        ctx.restore();
      });
    }

    wrapText(ctx, text, x, y, maxW, lh) {
      const words = text.split(' ');
      const lines = [];
      let line = '';
      words.forEach((wd) => {
        const test = line ? line + ' ' + wd : wd;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = wd;
        } else line = test;
      });
      lines.push(line);
      const size = lines.length > 1 ? 15 : 20;
      ctx.font = `${size}px ${SF.FONT}`;
      lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * (size + 2)));
    }

    drawBanner(ctx) {
      const b = this.banner;
      const k = b.t / b.dur;
      const pop = b.t < 8 ? 1.6 - (b.t / 8) * 0.6 : 1;
      ctx.save();
      ctx.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
      ctx.translate(W / 2, H / 2 - 40);
      ctx.scale(pop, pop);
      ctx.rotate(-0.04);
      SF.outlineText(ctx, b.text, 0, 0, b.size, b.color);
      ctx.restore();
    }
  };
})();
