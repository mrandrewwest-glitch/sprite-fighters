// Online play with a friend, using a private room code.
//
// Devices connect directly to each other with WebRTC (via PeerJS). The free
// public PeerJS server only introduces the two devices; after that the game
// talks device-to-device. There is no chat and no matchmaking with strangers.
//
// Netcode is "lockstep": both devices run the same simulation and only send
// their button presses. Each press is scheduled a few frames in the future
// (the input delay) so it has time to arrive. Randomness during the fight
// uses a shared seed so both devices see the same snacks, Drop Bears, etc.
(() => {
  // PeerJS 1.5.4 (MIT licence) is bundled in js/vendor so it also works from the offline cache.
  const PEERJS_URL = 'js/vendor/peerjs.min.js';
  const PREFIX = 'sprite-fighters-v1-';
  const WORDS = ['KOALA', 'WOMBAT', 'EMU', 'ROO', 'CROC', 'DINGO', 'GALAH', 'QUOKKA', 'BILBY', 'NUMBAT', 'POSSUM', 'PLATY', 'ECHIDNA', 'KOOKA', 'WALLABY', 'GOANNA'];
  const ACTIONS = SF.ACTIONS;

  // Keep an untouched Math.random for things that must not use the shared seed.
  SF.realRandom = Math.random;

  // ---------------------------------------------------------------- connection
  const Net = {
    peer: null,
    conn: null,
    role: null,
    code: null,
    handlers: {},
    // Which PeerJS server introduces the devices. Default: the free public one (0.peerjs.com).
    // Tests point this at a local server instead.
    serverOptions: {},

    on(ev, fn) {
      this.handlers[ev] = fn;
    },
    emit(ev, ...args) {
      if (this.handlers[ev]) this.handlers[ev](...args);
    },

    loadLib() {
      if (window.Peer) return Promise.resolve();
      if (this.loading) return this.loading;
      this.loading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PEERJS_URL;
        s.onload = () => resolve();
        s.onerror = () => {
          this.loading = null;
          reject(new Error('Could not load the online play library. Check the internet connection.'));
        };
        document.head.appendChild(s);
      });
      return this.loading;
    },

    makeCode() {
      const r = SF.realRandom;
      return WORDS[Math.floor(r() * WORDS.length)] + '-' + String(10 + Math.floor(r() * 90));
    },

    // Accepts "koala42", "Koala 42", "KOALA-42"...
    normaliseCode(text) {
      const t = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const m = t.match(/^([A-Z]+)(\d+)$/);
      return m ? m[1] + '-' + m[2] : t;
    },

    async host(tries = 0) {
      this.close();
      await this.loadLib();
      this.role = 'host';
      this.code = this.makeCode();
      const peer = new window.Peer(PREFIX + this.code, Object.assign({ debug: 0 }, this.serverOptions));
      this.peer = peer;
      peer.on('open', () => this.emit('status', 'waiting', this.code));
      peer.on('connection', (c) => {
        if (this.conn) {
          c.on('open', () => {
            c.send({ t: 'full' });
            setTimeout(() => c.close(), 300);
          });
          return;
        }
        this.setupConn(c);
      });
      peer.on('error', (e) => {
        if (e.type === 'unavailable-id' && tries < 4) return this.host(tries + 1);
        this.emit('error', friendlyError(e));
      });
      peer.on('disconnected', () => {
        // Lost the signalling server; the game connection itself may still be fine.
        if (!this.conn && this.peer === peer && !peer.destroyed) peer.reconnect();
      });
    },

    async join(code) {
      this.close();
      await this.loadLib();
      this.role = 'guest';
      this.code = this.normaliseCode(code);
      const peer = new window.Peer(Object.assign({ debug: 0 }, this.serverOptions));
      this.peer = peer;
      peer.on('open', () => {
        this.emit('status', 'joining', this.code);
        this.setupConn(peer.connect(PREFIX + this.code, { reliable: true }));
      });
      peer.on('error', (e) => this.emit('error', friendlyError(e)));
    },

    setupConn(c) {
      this.conn = c;
      c.on('open', () => this.emit('connected'));
      c.on('data', (d) => {
        if (d && d.t === 'full') return this.emit('error', 'That room already has two players.');
        this.emit('data', d);
      });
      c.on('close', () => {
        if (this.conn === c) this.emit('closed');
      });
      c.on('error', () => this.emit('closed'));
    },

    send(obj) {
      if (this.conn && this.conn.open) this.conn.send(obj);
    },

    connected() {
      return !!(this.conn && this.conn.open);
    },

    close() {
      const c = this.conn;
      const p = this.peer;
      this.conn = null;
      this.peer = null;
      this.role = null;
      try {
        if (c) c.close();
        if (p) p.destroy();
      } catch (e) {
        /* already closed */
      }
    },
  };

  function friendlyError(e) {
    switch (e && e.type) {
      case 'peer-unavailable':
        return "Couldn't find that room. Check the code and try again.";
      case 'network':
      case 'server-error':
      case 'socket-error':
      case 'socket-closed':
        return "Couldn't reach the online server. Check the internet connection.";
      case 'browser-incompatible':
        return "This browser can't play online. Try Safari or Chrome.";
      default:
        return 'Something went wrong connecting. Please try again.';
    }
  }

  SF.Net = Net;

  // ---------------------------------------------------------------- lockstep
  const encode = (inp) => ACTIONS.reduce((bits, a, i) => (inp[a] ? bits | (1 << i) : bits), 0);
  const decode = (bits) => {
    const o = SF.blankInput();
    ACTIONS.forEach((a, i) => (o[a] = !!(bits & (1 << i))));
    return o;
  };

  SF.NetSession = class {
    // local: 0 for the host (left side), 1 for the guest (right side).
    // send: function to send a message to the other device.
    // readLocal: function returning this device's current buttons.
    constructor({ local, seed, send, readLocal, delay = 4 }) {
      this.local = local;
      this.remote = 1 - local;
      this.delay = delay;
      this.send = send;
      this.readLocal = readLocal || (() => SF.Input.read(local, true));
      this.inputs = [new Map(), new Map()];
      for (let f = 0; f < delay; f++) {
        this.inputs[0].set(f, 0);
        this.inputs[1].set(f, 0);
      }
      this.sampledTo = delay - 1;
      this.rng = SF.seeded(seed);
      this.history = new Map(); // frame -> core state (guest keeps it to check for drift)
      this.pendingSnaps = [];
      this.stall = 0;
    }

    // Record this device's buttons for frame n + delay and send them.
    sample(n) {
      while (this.sampledTo < n + this.delay) {
        this.sampledTo++;
        const bits = encode(this.readLocal());
        this.inputs[this.local].set(this.sampledTo, bits);
        this.send({ t: 'in', f: this.sampledTo, b: bits });
      }
    }

    receive(msg) {
      if (msg.t === 'in') this.inputs[this.remote].set(msg.f, msg.b);
      else if (msg.t === 'snap') this.pendingSnaps.push(msg);
    }

    ready(n) {
      return this.inputs[0].has(n) && this.inputs[1].has(n);
    }

    inputsFor(n) {
      const out = [decode(this.inputs[0].get(n)), decode(this.inputs[1].get(n))];
      this.inputs[0].delete(n - 30);
      this.inputs[1].delete(n - 30);
      return out;
    }

    // Called after each simulated frame. The host sends a small snapshot now
    // and then; the guest nudges itself back if tiny maths differences between
    // devices ever made the two games drift apart.
    afterFrame(m, n) {
      const core = m.f.map((f) => [f.x, f.y, f.hp, f.meter]);
      if (this.local === 0) {
        if (n % 60 === 0) this.send({ t: 'snap', f: n, d: core });
        return;
      }
      this.history.set(n, core);
      this.history.delete(n - 240);
      this.pendingSnaps = this.pendingSnaps.filter((s) => {
        const mine = this.history.get(s.f);
        if (!mine) return s.f > n; // not there yet: keep it
        m.f.forEach((f, i) => {
          const [x, y, hp, meter] = s.d[i];
          const dx = x - mine[i][0];
          const dy = y - mine[i][1];
          const dhp = hp - mine[i][2];
          const dm = meter - mine[i][3];
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dhp) + Math.abs(dm) > 0.001) {
            f.x += dx;
            f.y += dy;
            f.hp = Math.max(0, Math.min(f.maxHp, f.hp + dhp));
            f.meter = Math.max(0, Math.min(100, f.meter + dm));
            this.corrections = (this.corrections || 0) + 1;
          }
        });
        return false;
      });
    }
  };
})();
