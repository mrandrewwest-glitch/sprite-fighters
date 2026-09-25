// CPU opponent. It "presses buttons" just like a player would.
SF.AI_LEVELS = {
  easy: { think: 26, block: 0.08, antiAir: 0, ult: 0.25, smart: false, dodge: 0, charge: 0.12, aggr: 0.45, approach: 0.5, jump: 0.04, special: 0.12, dmg: 0.75 },
  medium: { think: 14, block: 0.3, antiAir: 0.2, ult: 0.55, smart: false, dodge: 0.2, charge: 0.22, aggr: 0.6, approach: 0.65, jump: 0.06, special: 0.2, dmg: 0.9 },
  hard: { think: 8, block: 0.55, antiAir: 0.5, ult: 0.85, smart: true, dodge: 0.55, charge: 0.28, aggr: 0.75, approach: 0.8, jump: 0.06, special: 0.25, dmg: 1 },
  champion: { think: 4, block: 0.82, antiAir: 0.8, ult: 1, smart: true, dodge: 0.9, charge: 0.3, aggr: 0.85, approach: 0.85, jump: 0.05, special: 0.3, dmg: 1.1 },
};

SF.AI = class {
  constructor(level) {
    this.level = level;
    this.p = SF.AI_LEVELS[level] || SF.AI_LEVELS.medium;
    this.held = SF.blankInput();
    this.taps = {};
    this.timer = 30;
  }

  tap(a, n = 2) {
    this.taps[a] = n;
  }

  update(me, opp, m) {
    if (--this.timer <= 0) {
      this.timer = this.p.think + Math.floor(Math.random() * 4);
      this.think(me, opp, m);
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

  release() {
    ['left', 'right', 'up', 'down', 'charge'].forEach((k) => (this.held[k] = false));
  }

  oppThreat(me, opp, m) {
    if (opp.state === 'attack' && opp.move) {
      const hits = opp.move.hits;
      if (!hits.length) return false;
      return opp.moveFrame <= hits[hits.length - 1].to;
    }
    return m.projectiles.some(
      (p) => p.owner === opp && Math.abs(p.x - me.x) < 260 && Math.sign(me.x - p.x) === Math.sign(p.vx)
    );
  }

  goodUltMoment(me, opp) {
    if (!this.p.smart) return true;
    const dist = Math.abs(opp.x - me.x);
    if (['down', 'getup', 'ko'].includes(opp.state)) return false;
    switch (me.def.id) {
      case 'croc':
        return dist < 220 && opp.onGround();
      case 'kip':
        return opp.onGround();
      case 'koko':
        return opp.onGround() && opp.state !== 'attack';
      default:
        return true;
    }
  }

  think(me, opp, m) {
    const P = this.p;
    const h = this.held;
    this.release();
    if (m.roundState !== 'fight') return;
    const r = Math.random;
    const dx = opp.x - me.x;
    const dist = Math.abs(dx);
    const toward = dx > 0 ? 'right' : 'left';
    const away = dx > 0 ? 'left' : 'right';

    // Dodge big ultimates.
    if (opp.state === 'ult' && r() < P.dodge) {
      const d = opp.ultData || {};
      if (opp.def.id === 'kip' && d.phase === 'hover' && d.t > 34) {
        h.up = true;
        return;
      }
      if (opp.def.id === 'croc' && d.phase === 'lunge' && dist < 260) {
        h.up = true;
        h[away] = true;
        return;
      }
    }
    const tree = m.entities.find((e) => e.owner === opp && e.phase && (e.phase === 'warn' || e.phase === 'fall'));
    if (tree && Math.abs(tree.x - me.x) < 160 && r() < P.dodge) {
      h[me.x < tree.x ? 'left' : 'right'] = true;
      this.timer = 10;
      return;
    }

    if (!['idle', 'walk', 'crouch', 'charge', 'jump', 'blockstun'].includes(me.state)) return;

    // Defend.
    if (this.oppThreat(me, opp, m) && dist < 260 && r() < P.block) {
      h[away] = true;
      if (opp.move && opp.move.pose === 'sweep') h.down = true;
      this.timer = P.think + 8;
      return;
    }

    // Anti-air.
    if (!opp.onGround() && dist < 150 && opp.vy > -4 && me.onGround() && r() < P.antiAir) {
      this.tap('punch');
      return;
    }

    // Ultimate.
    if (me.meter >= 100 && me.onGround() && this.goodUltMoment(me, opp) && r() < P.ult * 0.5) {
      this.tap('charge');
      return;
    }

    // Charge the meter when there's space.
    if (dist > 380 && me.meter < 100 && me.onGround() && r() < P.charge) {
      h.charge = true;
      this.timer = 30;
      return;
    }

    const reach = 110;
    if (dist < reach) {
      if (r() < P.aggr) {
        const roll = r();
        if (roll < P.special) this.tap('special');
        else if (roll < 0.5) this.tap('punch');
        else if (roll < 0.8) this.tap('kick');
        else {
          h.down = true;
          this.tap('kick');
        }
      } else if (r() < 0.3) {
        h[away] = true;
      } else if (r() < P.jump * 3) {
        h.up = true;
        h[toward] = true;
      }
      return;
    }

    if (me.def.projectile && dist > 250 && r() < P.special * 1.5) {
      this.tap('special');
      return;
    }
    if (me.def.id === 'kooka' && dist > 180 && dist < 330 && r() < P.special) {
      h.up = true;
      this.tap('special', 2);
      return;
    }
    if (r() < P.approach) h[toward] = true;
    else if (r() < 0.2) h[away] = true;
    if (r() < P.jump) {
      h.up = true;
      if (r() < 0.7) h[toward] = true;
    }
  }
};
