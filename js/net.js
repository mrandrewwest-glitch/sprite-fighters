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

  // Servers that help two devices find a path to each other.
  // STUN: lets each device learn its public address (free, many providers).
  // TURN: relays the game when a direct path is impossible (e.g. some mobile
  // networks). PeerJS's own free TURN relays are included; for the best
  // reliability add your own (e.g. a free metered.ca account) to EXTRA_TURN.
  const EXTRA_TURN = [
    // { urls: 'turn:YOUR-SERVER:3478', username: '...', credential: '...' },
  ];
  const ICE_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ].concat(EXTRA_TURN);
  const LINK_TIMEOUT = 15000;
  const JOIN_TRIES = 3;

  // Keep an untouched Math.random for things that must not use the shared seed.
  SF.realRandom = Math.random;

  // ---------------------------------------------------------------- connection
  // Two ways to link up, tried together:
  //  1. direct (WebRTC via PeerJS): fastest, but often blocked on mobile data;
  //  2. relay (public MQTT server, see relay.js): works almost anywhere.
  // The room maker listens on both. The joining device tries direct first and
  // brings in the relay after a few seconds; whichever links up first wins.
  const RELAY_AFTER = 5000; // ms before the joining device also tries the relay
  const RELAY_WAIT = 7000; // ms to wait for the room maker's reply on each relay server

  const Net = {
    peer: null,
    conn: null,
    role: null,
    code: null,
    linkType: null,
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

    peerOptions() {
      return Object.assign({ debug: 0, config: { iceServers: ICE_SERVERS } }, this.serverOptions);
    },

    reset(role) {
      this.close();
      this.role = role;
      this.session = (this.session || 0) + 1;
      this.myId = Math.floor(SF.realRandom() * 1e16).toString(36);
      this.linkType = null;
      this.rtts = [];
      this.diag = {};
      return this.session;
    },

    alive(session) {
      return this.session === session && this.role;
    },

    // ------------------------------------------------------------ room maker
    async host(tries = 0) {
      const session = this.reset('host');
      this.code = this.makeCode();
      let announced = false;
      const announce = () => {
        if (announced || !this.alive(session)) return;
        announced = true;
        this.emit('status', 'waiting', this.code);
      };
      // Relay: listen on every relay server we can reach.
      this.relayClients = [];
      let relayTried = 0;
      SF.Relay.brokers.forEach((url) => {
        const c = new SF.Mqtt(url);
        c.connect()
          .then(() => {
            if (!this.alive(session)) return c.close();
            this.relayClients.push(c);
            c.subscribe(SF.Relay.topic(this.code, 'host'));
            c.onmessage = (t, text) => this.onRelayMessage(c, text, session);
            c.onclose = () => this.onRelayClosed(c);
            announce();
          })
          .catch(() => {})
          .then(() => {
            if (++relayTried === SF.Relay.brokers.length && !this.relayClients.length) this.diag.relay = 'unreachable';
          });
      });
      // Direct: register the room code with PeerJS.
      try {
        await this.loadLib();
      } catch (e) {
        this.diag.direct = 'no library';
      }
      if (!this.alive(session) || !window.Peer) return this.hostCheck(session, announced);
      const peer = new window.Peer(PREFIX + this.code, this.peerOptions());
      this.peer = peer;
      peer.on('open', announce);
      peer.on('connection', (c) => {
        if (this.connected()) {
          c.on('open', () => {
            c.send({ t: 'full' });
            setTimeout(() => c.close(), 300);
          });
          return;
        }
        this.setupDirect(c, session);
      });
      peer.on('error', (e) => {
        if (!this.alive(session)) return;
        if (e.type === 'unavailable-id' && tries < 4) return this.host(tries + 1);
        this.diag.direct = e.type;
        // A failed join attempt or a signalling hiccup shouldn't close the room.
        if (this.connected() || announced || this.relayClients.length) return;
        setTimeout(() => this.hostCheck(session), 4000);
      });
      peer.on('disconnected', () => {
        if (!this.conn && this.peer === peer && !peer.destroyed) peer.reconnect();
      });
      setTimeout(() => this.hostCheck(session), 9000);
    },

    hostCheck(session) {
      if (!this.alive(session) || this.connected()) return;
      const peerOk = this.peer && this.peer.open;
      if (!peerOk && !this.relayClients.length) {
        this.emit('error', "Couldn't reach the online servers. Check the internet connection.");
      }
    },

    // ------------------------------------------------------------ joining
    async join(code) {
      const session = this.reset('guest');
      this.code = this.normaliseCode(code);
      this.joinTry = 0;
      this.directDone = false;
      this.relayDone = false;
      this.emit('status', 'joining', this.code, 1);
      this.relayTimer = setTimeout(() => this.startRelayGuest(session), RELAY_AFTER);
      try {
        await this.loadLib();
      } catch (e) {
        this.directFailed(session, 'no library');
        return;
      }
      if (!this.alive(session)) return;
      const peer = new window.Peer(this.peerOptions());
      this.peer = peer;
      peer.on('open', () => this.tryDirect(session));
      peer.on('error', (e) => {
        if (!this.alive(session) || this.connected()) return;
        if (['webrtc', 'negotiation-failed'].includes(e.type)) return; // the link timeout handles these
        this.directFailed(session, e.type);
      });
    },

    tryDirect(session) {
      if (!this.alive(session) || !this.peer || this.connected()) return;
      this.joinTry++;
      this.setupDirect(this.peer.connect(PREFIX + this.code, { reliable: true }), session);
    },

    directFailed(session, why) {
      if (!this.alive(session) || this.directDone) return;
      this.directDone = true;
      this.diag.direct = why;
      // Bring in the relay straight away rather than waiting.
      this.startRelayGuest(session);
      this.checkGuestFailed(session);
    },

    async startRelayGuest(session) {
      if (!this.alive(session) || this.connected() || this.relayStarted) return;
      this.relayStarted = true;
      clearTimeout(this.relayTimer);
      this.emit('status', 'relay', this.code);
      const inbox = SF.Relay.topic(this.code, 'guest');
      const hostBox = SF.Relay.topic(this.code, 'host');
      let reached = 0;
      for (const url of SF.Relay.brokers) {
        if (!this.alive(session) || this.connected()) return;
        const c = new SF.Mqtt(url);
        try {
          await c.connect();
        } catch (e) {
          continue;
        }
        reached++;
        if (!this.alive(session) || this.connected()) return c.close();
        this.relayClients = [c];
        c.subscribe(inbox);
        c.onmessage = (t, text) => this.onRelayMessage(c, text, session);
        c.onclose = () => this.onRelayClosed(c);
        // Knock on the door every second until the room maker answers.
        const hello = JSON.stringify({ k: 'hello', from: this.myId });
        for (let i = 0; i < RELAY_WAIT / 1000; i++) {
          if (!this.alive(session) || this.connected()) return;
          c.publish(hostBox, hello);
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (this.connected()) return;
        c.close();
        this.relayClients = [];
      }
      this.relayDone = true;
      this.diag.relay = reached ? 'no answer' : 'unreachable';
      this.checkGuestFailed(session);
    },

    checkGuestFailed(session) {
      if (!this.alive(session) || this.connected() || !this.directDone || !this.relayDone) return;
      if (this.diag.direct === 'peer-unavailable' && this.diag.relay === 'no answer') {
        this.close();
        return this.emit('error', "Couldn't find that room. Check the code and try again.");
      }
      const d = this.diag;
      this.emit('linkfail', `direct: ${d.direct || '?'}, ${d.ice || ''} relay: ${d.relay || '?'}`);
    },

    // ------------------------------------------------------------ relay messages
    onRelayMessage(client, text, session) {
      if (!this.alive(session)) return;
      let m;
      try {
        m = JSON.parse(text);
      } catch (e) {
        return;
      }
      if (!m || !m.from || m.from === this.myId) return;
      if (m.to && m.to !== this.myId) return;
      const link = this.conn && this.conn.relay ? this.conn : null;
      if (this.role === 'host' && m.k === 'hello') {
        const reply = (k) => client.publish(SF.Relay.topic(this.code, 'guest'), JSON.stringify({ k, from: this.myId, to: m.from }));
        if (link && link.peerId === m.from) return reply('welcome'); // they missed our first reply
        if (this.connected()) return reply('full');
        this.useRelay(client, m.from);
        reply('welcome');
        return;
      }
      if (this.role === 'guest' && m.k === 'welcome' && !this.connected()) {
        this.useRelay(client, m.from);
        return;
      }
      if (this.role === 'guest' && m.k === 'full' && !this.connected()) {
        this.close();
        return this.emit('error', 'That room already has two players.');
      }
      if (!link || link.peerId !== m.from) return;
      if (m.k === 'd') this.receive(m.d);
      else if (m.k === 'bye') {
        link.open = false;
        this.conn = null;
        this.emit('closed');
      }
    },

    onRelayClosed(client) {
      this.relayClients = (this.relayClients || []).filter((c) => c !== client);
      if (this.conn && this.conn.relay && this.conn.client === client) {
        this.conn.open = false;
        this.conn = null;
        this.emit('closed');
      }
    },

    useRelay(client, peerId) {
      const me = this.myId;
      const to = SF.Relay.topic(this.code, this.role === 'host' ? 'guest' : 'host');
      this.conn = {
        relay: true,
        open: true,
        client,
        peerId,
        send(obj) {
          client.publish(to, JSON.stringify({ k: 'd', from: me, to: peerId, d: obj }));
        },
        close() {
          if (this.open) client.publish(to, JSON.stringify({ k: 'bye', from: me, to: peerId }));
          this.open = false;
        },
      };
      // Keep just the relay server we're using.
      (this.relayClients || []).forEach((c) => c !== client && c.close());
      this.relayClients = [client];
      this.linked('relay');
    },

    // ------------------------------------------------------------ direct link
    setupDirect(c, session) {
      if (!this.connected()) this.conn = c;
      let opened = false;
      let failed = false;
      const types = new Set();
      const watch = () => {
        const pc = c.peerConnection;
        if (!pc || pc.__sfWatched) return;
        pc.__sfWatched = true;
        pc.addEventListener('icecandidate', (e) => {
          const m = e.candidate && / typ (\w+)/.exec(e.candidate.candidate);
          if (m) types.add(m[1]);
        });
      };
      watch();
      setTimeout(watch, 0);
      setTimeout(watch, 500);
      const fail = (why) => {
        if (opened || failed) return;
        failed = true;
        clearTimeout(timer);
        this.diag.ice = `ice: ${c.peerConnection ? c.peerConnection.iceConnectionState : 'none'}, paths: ${[...types].join('/') || 'none'},`;
        if (this.conn === c) this.conn = null;
        try {
          c.close();
        } catch (e) {
          /* already closed */
        }
        if (!this.alive(session) || this.connected()) return;
        // (The room maker just keeps waiting: the friend will try the relay next.)
        if (this.role === 'guest') {
          if (this.joinTry < JOIN_TRIES) setTimeout(() => this.tryDirect(session), 800);
          else this.directFailed(session, why);
        }
      };
      const timer = setTimeout(() => fail('timeout'), LINK_TIMEOUT);
      c.on('open', () => {
        if (this.connected() && this.conn !== c) {
          // The relay won the race: this late direct link isn't needed.
          c.close();
          return;
        }
        opened = true;
        clearTimeout(timer);
        this.conn = c;
        this.linked('direct');
      });
      c.on('data', (d) => {
        if (d && d.t === 'full') {
          this.close();
          return this.emit('error', 'That room already has two players.');
        }
        if (this.conn === c) this.receive(d);
      });
      c.on('close', () => {
        if (!opened) return fail('closed');
        if (this.conn === c) this.emit('closed');
      });
      c.on('error', () => {
        if (!opened) return fail('error');
        if (this.conn === c) this.emit('closed');
      });
    },

    // ------------------------------------------------------------ shared
    linked(type) {
      this.linkType = type;
      clearTimeout(this.relayTimer);
      if (this.role === 'guest' && type === 'relay' && this.peer) {
        // Stop trying the direct route.
        try {
          this.peer.destroy();
        } catch (e) {
          /* ignore */
        }
        this.peer = null;
      }
      this.emit('connected', type);
      // Measure the round-trip time so the input delay can suit the connection.
      if (this.role === 'host') {
        for (let i = 0; i < 6; i++) setTimeout(() => this.send({ t: 'ping', ts: performance.now() }), 200 + i * 250);
      }
    },

    receive(d) {
      if (!d || !d.t) return;
      if (d.t === 'ping') return this.send({ t: 'pong', ts: d.ts });
      if (d.t === 'pong') {
        this.rtts.push(performance.now() - d.ts);
        return;
      }
      // Control messages are sent twice over the relay; drop the repeat.
      if (d.id) {
        this.seen = this.seen || new Set();
        if (this.seen.has(d.id)) return;
        this.seen.add(d.id);
      }
      this.emit('data', d);
    },

    // Round-trip time (ms), median of the measurements so far.
    rtt() {
      if (!this.rtts.length) return this.linkType === 'relay' ? 250 : 80;
      const s = this.rtts.slice().sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    },

    send(obj) {
      if (!this.connected()) return;
      if (this.conn.relay && !['in', 'snap', 'need', 'ping', 'pong'].includes(obj.t)) {
        // Relay messages can very occasionally go missing, so send setup messages twice.
        const msg = Object.assign({ id: Math.floor(SF.realRandom() * 1e12).toString(36) }, obj);
        this.conn.send(msg);
        setTimeout(() => this.connected() && this.conn.send(msg), 150);
        return;
      }
      this.conn.send(obj);
    },

    connected() {
      return !!(this.conn && this.conn.open);
    },

    close() {
      const c = this.conn;
      const p = this.peer;
      const rc = this.relayClients || [];
      clearTimeout(this.relayTimer);
      this.conn = null;
      this.peer = null;
      this.relayClients = [];
      this.relayStarted = false;
      this.role = null;
      try {
        if (c) c.close();
      } catch (e) {
        /* already closed */
      }
      setTimeout(() => {
        rc.forEach((x) => x.close());
        try {
          if (p) p.destroy();
        } catch (e) {
          /* already closed */
        }
      }, 200);
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
    // delay: input delay in frames (both devices must use the same value).
    // sendEvery: send presses every N frames (each message repeats the last 8).
    constructor({ local, seed, send, readLocal, delay = 4, sendEvery = 1 }) {
      this.local = local;
      this.remote = 1 - local;
      this.delay = delay;
      this.sendEvery = sendEvery;
      this.unsent = 0;
      this.consumed = 0;
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
        this.inputs[this.local].set(this.sampledTo, encode(this.readLocal()));
        this.unsent++;
      }
      if (this.unsent >= this.sendEvery) this.flush();
      // Stuck waiting for the friend's presses? Ask for the exact frame we're
      // missing (a message may have gone astray), and re-send ours too.
      if (this.stall > 0 && this.stall % 12 === 0) {
        this.send({ t: 'need', f: this.consumed });
        this.flush();
      }
    }

    // Each message carries the last (up to) 8 frames of presses, so one lost
    // message is covered by the next.
    flush() {
      this.sendRange(Math.max(0, this.sampledTo - 7), this.sampledTo);
      this.unsent = 0;
    }

    sendRange(from, to) {
      const b = [];
      for (let f = from; f <= to; f++) b.push(this.inputs[this.local].has(f) ? this.inputs[this.local].get(f) : 0);
      this.send({ t: 'in', f: to, b });
    }

    receive(msg) {
      if (msg.t === 'in') {
        const arr = Array.isArray(msg.b) ? msg.b : [msg.b];
        const start = msg.f - arr.length + 1;
        arr.forEach((v, i) => {
          if (start + i >= this.consumed) this.inputs[this.remote].set(start + i, v);
        });
      } else if (msg.t === 'need') {
        // The friend is missing some of our presses: send everything from there on.
        if (msg.f <= this.sampledTo) this.sendRange(Math.max(msg.f, this.sampledTo - 200), this.sampledTo);
      } else if (msg.t === 'snap') this.pendingSnaps.push(msg);
    }

    ready(n) {
      return this.inputs[0].has(n) && this.inputs[1].has(n);
    }

    inputsFor(n) {
      const out = [decode(this.inputs[0].get(n)), decode(this.inputs[1].get(n))];
      this.consumed = n + 1;
      // Keep a few seconds of history in case the friend asks for a re-send.
      this.inputs[0].delete(n - 240);
      this.inputs[1].delete(n - 240);
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
