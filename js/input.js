// Keyboard, gamepad and on-screen touch controls, merged into one
// simple "held buttons" object per player.
SF.ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'special', 'charge'];
SF.blankInput = () => {
  const o = {};
  SF.ACTIONS.forEach((a) => (o[a] = false));
  return o;
};

SF.Input = (() => {
  const KEYMAPS = [
    { KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down', KeyF: 'punch', KeyG: 'kick', KeyH: 'special', KeyR: 'charge' },
    {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      Comma: 'punch', Period: 'kick', Slash: 'special', ShiftRight: 'charge',
      Numpad1: 'punch', Numpad2: 'kick', Numpad3: 'special', Numpad0: 'charge',
      KeyK: 'punch', KeyL: 'kick', Semicolon: 'special', KeyP: 'charge',
    },
  ];
  const keys = [SF.blankInput(), SF.blankInput()];
  const touch = [SF.blankInput(), SF.blankInput(), SF.blankInput(), SF.blankInput()];
  // Presses are latched until read, so a tap shorter than one frame still counts.
  const latch = [SF.blankInput(), SF.blankInput(), SF.blankInput(), SF.blankInput()]; // touch taps, per player
  const keyLatch = [SF.blankInput(), SF.blankInput()]; // key taps, per keyboard layout

  window.addEventListener('keydown', (e) => {
    for (let i = 0; i < 2; i++) {
      const a = KEYMAPS[i][e.code];
      if (a) {
        keys[i][a] = true;
        keyLatch[i][a] = true;
        if (SF.Input.inFight) e.preventDefault();
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    for (let i = 0; i < 2; i++) {
      const a = KEYMAPS[i][e.code];
      if (a) keys[i][a] = false;
    }
  });
  window.addEventListener('blur', () => {
    keys.forEach((k) => SF.ACTIONS.forEach((a) => (k[a] = false)));
  });

  function readPad(pad, out) {
    if (!pad) return;
    const b = (i) => pad.buttons[i] && pad.buttons[i].pressed;
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    if (b(14) || ax < -0.4) out.left = true;
    if (b(15) || ax > 0.4) out.right = true;
    if (b(12) || ay < -0.55) out.up = true;
    if (b(13) || ay > 0.55) out.down = true;
    if (b(0)) out.punch = true;
    if (b(1)) out.kick = true;
    if (b(2)) out.special = true;
    if (b(3) || b(5) || b(7)) out.charge = true;
  }

  function pads() {
    try {
      return Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  // i: player number (their touch controls).
  // merged = true lets one player use every keyboard layout and any gamepad.
  // pad: which gamepad this player uses (defaults to i; -1 = none).
  // keyMap: which keyboard layout they use (defaults to i; -1 = none).
  function read(i, merged, pad, keyMap) {
    const out = SF.blankInput();
    const ps = pads();
    const km = keyMap != null ? keyMap : i;
    const hasKeys = km >= 0 && km < keys.length;
    SF.ACTIONS.forEach((a) => {
      if (merged) out[a] = keys[0][a] || keys[1][a] || keyLatch[0][a] || keyLatch[1][a];
      else if (hasKeys) out[a] = keys[km][a] || keyLatch[km][a];
      if (touch[i][a] || latch[i][a]) out[a] = true;
      latch[i][a] = false;
      if (merged) keyLatch[0][a] = keyLatch[1][a] = false;
      else if (hasKeys) keyLatch[km][a] = false;
    });
    if (merged) ps.forEach((p) => readPad(p, out));
    else if (pad !== -1) readPad(ps[pad != null ? pad : i], out);
    return out;
  }

  // ---------- Touch controls ----------
  const BUTTONS = [
    { a: 'punch', label: '👊', cls: 'b-punch' },
    { a: 'kick', label: '🦶', cls: 'b-kick' },
    { a: 'special', label: '⭐', cls: 'b-special' },
    { a: 'charge', label: '⚡', cls: 'b-charge' },
  ];

  function clearTouch() {
    touch.concat(latch, keyLatch).forEach((t) => SF.ACTIONS.forEach((a) => (t[a] = false)));
  }

  function makeStick(player) {
    const el = document.createElement('div');
    el.className = 'stick';
    const knob = document.createElement('div');
    knob.className = 'knob';
    el.appendChild(knob);
    let pid = null;
    const set = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const rad = r.width / 2;
      let dx = (e.clientX - cx) / rad;
      let dy = (e.clientY - cy) / rad;
      const m = Math.hypot(dx, dy);
      if (m > 1) {
        dx /= m;
        dy /= m;
      }
      knob.style.transform = `translate(${dx * rad * 0.55}px, ${dy * rad * 0.55}px)`;
      const t = touch[player];
      t.left = dx < -0.35;
      t.right = dx > 0.35;
      t.up = dy < -0.5;
      t.down = dy > 0.5;
    };
    const release = () => {
      pid = null;
      knob.style.transform = '';
      const t = touch[player];
      t.left = t.right = t.up = t.down = false;
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pid = e.pointerId;
      try { el.setPointerCapture(pid); } catch (err) { /* ignore */ }
      set(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId === pid) set(e);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) =>
      el.addEventListener(ev, (e) => {
        if (e.pointerId === pid) release();
      })
    );
    return el;
  }

  function makeButton(player, def) {
    const el = document.createElement('div');
    el.className = 'tbtn ' + def.cls;
    el.dataset.action = def.a;
    el.dataset.player = player;
    el.textContent = def.label;
    const on = (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      touch[player][def.a] = true;
      latch[player][def.a] = true;
      el.classList.add('down');
    };
    const off = () => {
      touch[player][def.a] = false;
      el.classList.remove('down');
    };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, off));
    return el;
  }

  // players: player indexes that need controls.
  // layout: 'single' (one pad), 'split' (side by side) or 'table' (face-to-face).
  function buildTouch(players, layout) {
    const root = document.getElementById('touch');
    root.innerHTML = '';
    clearTouch();
    const split = players.length > 1;
    layout = layout || (split ? 'split' : 'single');
    root.className = layout;
    players.forEach((p, idx) => {
      const pad = document.createElement('div');
      pad.className = 'pad ' + (idx === 0 ? 'pad-left' : 'pad-right');
      const stick = makeStick(p);
      const btns = document.createElement('div');
      btns.className = 'btns';
      BUTTONS.forEach((b) => btns.appendChild(makeButton(p, b)));
      if (layout === 'quad') {
        // Each player gets half of an edge; players 2 and 4 sit on the far side.
        const far = p === 1 || p === 3;
        const holder = document.createElement('div');
        holder.className = 'qpad ' + (p === 0 || p === 1 ? 'q-left' : 'q-right');
        holder.appendChild(stick);
        holder.appendChild(btns);
        const tag = document.createElement('div');
        tag.className = 'qtag';
        tag.style.color = SF.SLOT_COLORS[p];
        tag.textContent = 'P' + (p + 1);
        holder.appendChild(tag);
        if (far) {
          const rot = document.createElement('div');
          rot.className = 'pad-rot';
          rot.appendChild(holder);
          pad.appendChild(rot);
        } else pad.appendChild(holder);
      } else if (layout === 'table') {
        // Both players get the same layout; Player 2's is spun 180 degrees.
        const holder = idx === 0 ? pad : document.createElement('div');
        if (idx === 1) {
          holder.className = 'pad-rot';
          pad.appendChild(holder);
        }
        holder.appendChild(stick);
        holder.appendChild(btns);
        const tag = document.createElement('div');
        tag.className = 'pad-tag';
        tag.style.color = idx === 0 ? '#ff6b6b' : '#4ab3ff';
        tag.textContent = 'P' + (p + 1);
        holder.appendChild(tag);
      } else if (idx === 0) {
        pad.appendChild(stick);
        if (split) pad.appendChild(btns);
        else root.appendChild(btns);
      } else {
        pad.appendChild(btns);
        pad.appendChild(stick);
      }
      if (split && layout === 'split') {
        const tag = document.createElement('div');
        tag.className = 'pad-tag';
        tag.textContent = 'P' + (p + 1);
        pad.appendChild(tag);
      }
      root.appendChild(pad);
    });
  }

  function hideTouch() {
    const root = document.getElementById('touch');
    root.innerHTML = '';
    root.className = '';
    clearTouch();
  }

  function setChargeReady(player, ready) {
    document.querySelectorAll(`#touch .b-charge[data-player="${player}"]`).forEach((el) => el.classList.toggle('ready', ready));
  }

  return { read, pads, buildTouch, hideTouch, setChargeReady, inFight: false };
})();
