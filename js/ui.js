// Menus, game flow, main loop and screen scaling.
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  const STEP = 1000 / 60;

  const ui = (SF.UI = {
    screen: null,
    history: [],
    match: null,
    demo: null,
    flow: { mode: '1p', step: 'p1' },
    t: 0,
  });

  // ------------------------------------------------------------ scaling
  let scale = 1;
  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const u = Math.min(vw / SF.W, vh / SF.H);
    document.documentElement.style.setProperty('--u', u + 'px');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(SF.W * u * dpr);
    canvas.height = Math.round(SF.H * u * dpr);
    scale = u * dpr;
    if (SF.isTouch && vh > vw && ui.match && !ui.match.paused && !ui.screen) pause();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('fullscreenchange', resize);

  // ------------------------------------------------------------ screens
  function show(id) {
    $$('.screen').forEach((s) => s.classList.remove('show'));
    ui.screen = id;
    if (id) {
      $('#scr-' + id).classList.add('show');
      const first = navTargets()[0];
      if (first && ui.lastInput === 'keys') focusEl(first);
    }
    const fighting = !id && ui.match && !ui.match.paused;
    $('#pause-btn').classList.toggle('hidden', !fighting);
    SF.Input.inFight = !!fighting;
    if (fighting && wantsTouch()) {
      SF.Input.buildTouch(ui.match.o.touchPlayers);
    } else {
      SF.Input.hideTouch();
    }
  }

  function go(id, step) {
    ui.history.push({ screen: ui.screen, step: ui.flow.step });
    if (step) ui.flow.step = step;
    show(id);
    if (id === 'select') setupSelect();
    if (id === 'stage') setupStages();
    if (id === 'settings') setupSettings();
  }

  function back() {
    const prev = ui.history.pop();
    SF.Audio.play('back');
    if (!prev) return show('title');
    ui.flow.step = prev.step;
    show(prev.screen);
    if (prev.screen === 'select') setupSelect();
    if (prev.screen === 'stage') setupStages();
  }

  function wantsTouch() {
    return SF.settings.touch === 'on' || (SF.settings.touch === 'auto' && SF.isTouch);
  }

  // ------------------------------------------------------------ demo (attract mode)
  function startDemo() {
    const ids = SF.ROSTER.slice().sort(() => Math.random() - 0.5);
    ui.demo = new SF.Match({
      p1: ids[0],
      p2: ids[1],
      stage: SF.pick(SF.STAGE_LIST),
      controllers: [{ type: 'ai', level: 'hard' }, { type: 'ai', level: 'hard' }],
      rounds: 1,
      timer: 60,
      silent: true,
      noHud: true,
      onEnd: () => setTimeout(() => ui.demo && !ui.match && startDemo(), 1500),
    });
  }

  function toTitle() {
    ui.match = null;
    ui.history = [];
    startDemo();
    show('title');
  }

  // ------------------------------------------------------------ flow
  function startMode(mode) {
    ui.flow = { mode, step: 'p1', diff: 'medium', p1: null, p2: null, stage: null, sel: null };
    if (mode === '2p') go('select', 'p1');
    else go('diff');
  }

  function confirmPick(id) {
    const f = ui.flow;
    SF.Audio.play('select');
    if (f.step === 'p1') {
      f.p1 = id;
      if (f.mode === 'arcade') {
        f.ladder = SF.ROSTER.filter((x) => x !== id).sort(() => Math.random() - 0.5);
        f.idx = 0;
        return startArcadeFight();
      }
      go('select', 'p2');
    } else {
      f.p2 = id;
      go('stage');
    }
  }

  function startArcadeFight() {
    const f = ui.flow;
    f.p2 = f.ladder[f.idx];
    f.stage = SF.FIGHTERS[f.p2].stage;
    showVs();
  }

  function showVs() {
    const f = ui.flow;
    show('vs');
    SF.drawPortrait($('#vs-p1'), f.p1, { zoom: 0.9 });
    SF.drawPortrait($('#vs-p2'), f.p2, { zoom: 0.9, flip: true, alt: f.p1 === f.p2 });
    $('#vs-n1').textContent = SF.FIGHTERS[f.p1].name;
    $('#vs-n2').textContent = SF.FIGHTERS[f.p2].name;
    let sub = SF.STAGES[f.stage].emoji + ' ' + SF.STAGES[f.stage].name;
    if (f.mode === 'arcade') sub = `Fight ${f.idx + 1} of ${f.ladder.length}<br>` + sub;
    $('#vs-stage').innerHTML = sub;
    SF.Audio.play('gong');
    SF.Audio.say(SF.FIGHTERS[f.p1].full + ' versus ' + SF.FIGHTERS[f.p2].full);
    clearTimeout(ui.vsTimer);
    ui.vsTimer = setTimeout(beginMatch, 2600);
  }

  function beginMatch() {
    clearTimeout(ui.vsTimer);
    if (ui.screen !== 'vs') return;
    const f = ui.flow;
    const vsCpu = f.mode !== '2p';
    const opts = {
      p1: f.p1,
      p2: f.p2,
      stage: f.stage,
      controllers: vsCpu
        ? [{ type: 'human', slot: 0, merged: true }, { type: 'ai', level: f.diff }]
        : [{ type: 'human', slot: 0 }, { type: 'human', slot: 1 }],
      touchPlayers: vsCpu ? [0] : [0, 1],
      rounds: SF.settings.rounds,
      timer: SF.settings.timer,
      onEnd: onMatchEnd,
    };
    ui.demo = null;
    ui.match = new SF.Match(opts);
    ui.history = [];
    show(null);
  }

  function restartMatch() {
    const o = ui.match.o;
    ui.match = new SF.Match(o);
    show(null);
  }

  function onMatchEnd(winner, match) {
    if (match !== ui.match) return;
    const f = ui.flow;
    const wf = match.f[winner];
    const humanWon = f.mode === '2p' || winner === 0;
    let title = wf.def.name + ' WINS!';
    let quote = '“' + wf.def.win + '”';
    const buttons = [];
    if (f.mode === 'arcade') {
      if (humanWon) {
        f.idx++;
        if (f.idx >= f.ladder.length) {
          title = '🏆 ARCADE CHAMPION! 🏆';
          quote = `${SF.FIGHTERS[f.p1].full} beat everyone on ${f.diff.toUpperCase()}! Bonza!`;
          match.fx.confetti();
          SF.Audio.say('Arcade champion! Bonza!');
          buttons.push(['🔁 Play Arcade Again', 'arcade-again'], ['🏠 Main Menu', 'quit']);
        } else {
          buttons.push([`▶ Next Fight (${f.idx + 1}/${f.ladder.length})`, 'arcade-next'], ['🏠 Main Menu', 'quit']);
        }
      } else {
        quote += '<br><br>Have another go, mate!';
        buttons.push(['🔄 Try Again', 'restart'], ['🏠 Main Menu', 'quit']);
      }
    } else {
      if (!humanWon) quote += '<br><br>Have another go, mate!';
      buttons.push(['🔄 Rematch', 'restart'], ['👥 Change Fighters', 'change'], ['🏠 Main Menu', 'quit']);
    }
    $('#res-title').innerHTML = title;
    $('#res-quote').innerHTML = quote;
    $('#res-buttons').innerHTML = buttons
      .map(([label, act], i) => `<button class="btn ${i === 0 ? 'big go' : ''}" data-act="${act}">${label}</button>`)
      .join('');
    SF.drawPortrait($('#res-portrait'), wf.def.id, { happy: true, alt: winner === 1 && f.p1 === f.p2, flip: winner === 1 });
    ui.history = [];
    show('results');
  }

  function pause() {
    if (!ui.match || ui.match.paused || ui.match.roundState === 'over') return;
    ui.match.paused = true;
    ui.history = [];
    show('pause');
  }

  function resume() {
    if (!ui.match) return;
    ui.match.paused = false;
    ui.history = [];
    show(null);
  }

  // ------------------------------------------------------------ character select
  function buildRoster() {
    const root = $('#roster');
    root.innerHTML = '';
    SF.ROSTER.forEach((id) => {
      const b = document.createElement('button');
      b.className = 'card-f';
      b.dataset.id = id;
      const c = document.createElement('canvas');
      c.width = 240;
      c.height = 208;
      b.appendChild(c);
      const n = document.createElement('div');
      n.className = 'cn';
      n.textContent = SF.FIGHTERS[id].name;
      b.appendChild(n);
      SF.drawPortrait(c, id, { zoom: 0.74, bottom: 44 });
      b.addEventListener('click', () => {
        if (ui.flow.sel === id) confirmPick(id);
        else selectFighter(id, true);
      });
      b.addEventListener('focus', () => {
        if (ui.lastInput === 'keys') selectFighter(id);
      });
      root.appendChild(b);
    });
    SF.COMING_SOON.forEach((c) => {
      const d = document.createElement('div');
      d.className = 'card-f locked';
      d.innerHTML = `<div class="lk">${c.emoji}<small>Coming soon</small></div><div class="cn">${c.name}</div>`;
      d.title = c.full + ' (coming soon)';
      root.appendChild(d);
    });
  }

  function setupSelect() {
    const f = ui.flow;
    const title =
      f.step === 'p1'
        ? f.mode === '2p' ? '<span style="color:#ff6b6b">Player 1</span>: choose your fighter' : 'Choose your fighter'
        : f.mode === '2p' ? '<span style="color:#4ab3ff">Player 2</span>: choose your fighter' : 'Choose your opponent';
    $('#select-title').innerHTML = title;
    $$('.card-f').forEach((c) => {
      c.classList.toggle('p1sel', f.step === 'p2' && c.dataset.id === f.p1);
    });
    const start = f.step === 'p1' ? f.p1 || 'kip' : f.p2 || SF.ROSTER.find((x) => x !== f.p1);
    selectFighter(start);
  }

  function selectFighter(id, click) {
    const f = ui.flow;
    if (f.sel !== id && click) SF.Audio.play('move');
    f.sel = id;
    const def = SF.FIGHTERS[id];
    $$('.card-f').forEach((c) => c.classList.toggle('sel', c.dataset.id === id));
    $('#info-name').textContent = def.emoji + ' ' + def.full;
    $('#info-style').textContent = def.style;
    const bar = (n) => '<span class="bar">' + [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('') + '</span>';
    $('#info-stats').innerHTML = ['power', 'speed', 'health', 'jump']
      .map((k) => `<span>${k.toUpperCase()}</span>${bar(def.stats[k])}`)
      .join('');
    $('#info-moves').innerHTML =
      `<p><b>⭐ ${def.special.name}</b><br>${def.special.desc}</p>` +
      `<p><b>⚡ ${def.ultimate.name}</b><br>${def.ultimate.desc}</p>` +
      `<p><b>✨ Bonus</b><br>${def.passive}</p>`;
    $('#confirm-btn').textContent = 'Pick ' + def.name + ' ▶';
    ui.infoAlt = f.step === 'p2' && id === f.p1;
    drawInfoPortrait();
  }

  function drawInfoPortrait() {
    if (!ui.flow.sel) return;
    SF.drawPortrait($('#info-portrait'), ui.flow.sel, { t: ui.t, zoom: 0.9, alt: ui.infoAlt, flip: ui.flow.step === 'p2' });
  }

  // ------------------------------------------------------------ stage select
  function setupStages() {
    const root = $('#stage-grid');
    if (!root.children.length) {
      SF.STAGE_LIST.concat(['random']).forEach((id) => {
        const b = document.createElement('button');
        b.className = 'btn stage-card' + (id === 'random' ? ' random' : '');
        const c = document.createElement('canvas');
        c.width = 384;
        c.height = 216;
        b.appendChild(c);
        const label = document.createElement('div');
        label.textContent = id === 'random' ? '🎲 Random' : SF.STAGES[id].emoji + ' ' + SF.STAGES[id].name;
        b.appendChild(label);
        b.addEventListener('click', () => {
          ui.flow.stage = id === 'random' ? SF.pick(SF.STAGE_LIST) : id;
          SF.Audio.play('select');
          showVs();
        });
        root.appendChild(b);
        if (id !== 'random') {
          // Paint thumbnails after the screen shows so it stays snappy.
          setTimeout(() => SF.drawStageThumb(c, id), 30);
        } else {
          const cx = c.getContext('2d');
          cx.font = `120px ${SF.FONT}`;
          cx.textAlign = 'center';
          cx.textBaseline = 'middle';
          cx.fillStyle = '#fff';
          cx.fillText('?', 192, 116);
        }
      });
    }
  }

  // ------------------------------------------------------------ settings
  const SETTINGS = [
    { key: 'sound', label: '🔊 Sound', vals: [true, false], names: ['On', 'Off'] },
    { key: 'voice', label: '🗣️ Announcer voice', vals: [true, false], names: ['On', 'Off'] },
    { key: 'dropBears', label: '🐨 Drop Bears', vals: [true, false], names: ['On', 'Off'] },
    { key: 'rounds', label: '🥊 Rounds', vals: [1, 3, 5], names: ['1 round', 'Best of 3', 'Best of 5'] },
    { key: 'timer', label: '⏱️ Round timer', vals: [60, 99, 0], names: ['60 seconds', '99 seconds', 'No timer'] },
    { key: 'touch', label: '📱 Touch buttons', vals: ['auto', 'on', 'off'], names: ['Auto', 'Always', 'Off'] },
  ];

  function setupSettings() {
    const root = $('#settings-list');
    root.innerHTML = '';
    SETTINGS.forEach((s) => {
      const label = document.createElement('div');
      label.textContent = s.label;
      const b = document.createElement('button');
      b.className = 'btn';
      const refresh = () => {
        const i = s.vals.indexOf(SF.settings[s.key]);
        b.textContent = s.names[i < 0 ? 0 : i];
      };
      b.addEventListener('click', () => {
        const i = s.vals.indexOf(SF.settings[s.key]);
        SF.settings[s.key] = s.vals[(i + 1) % s.vals.length];
        SF.saveSettings();
        refresh();
        SF.Audio.play('select');
      });
      refresh();
      root.appendChild(label);
      root.appendChild(b);
    });
  }

  // ------------------------------------------------------------ clicks
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act], [data-diff]');
    if (!el) return;
    if (el.dataset.diff) {
      ui.flow.diff = el.dataset.diff;
      SF.Audio.play('select');
      return go('select', 'p1');
    }
    const act = el.dataset.act;
    if (act !== 'back') SF.Audio.play('select');
    switch (act) {
      case 'mode-1p': return startMode('1p');
      case 'mode-2p': return startMode('2p');
      case 'mode-arcade': return startMode('arcade');
      case 'howto': return go('howto');
      case 'settings': return go('settings');
      case 'back': return back();
      case 'fullscreen': return toggleFullscreen();
      case 'confirm-pick': return confirmPick(ui.flow.sel);
      case 'random-pick': {
        const id = SF.pick(SF.ROSTER);
        selectFighter(id);
        return confirmPick(id);
      }
      case 'resume': return resume();
      case 'restart': return restartMatch();
      case 'quit': return toTitle();
      case 'change':
        ui.flow.p1 = ui.flow.p1 || 'kip';
        ui.history = [{ screen: 'title', step: 'p1' }];
        ui.match = null;
        startDemo();
        ui.flow.step = 'p1';
        show('select');
        return setupSelect();
      case 'arcade-next':
        return startArcadeFight();
      case 'arcade-again':
        ui.flow.ladder = ui.flow.ladder.sort(() => Math.random() - 0.5);
        ui.flow.idx = 0;
        return startArcadeFight();
    }
  });

  $('#pause-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    pause();
  });
  $('#scr-vs').addEventListener('click', beginMatch);

  function toggleFullscreen() {
    const d = document;
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      } else {
        const el = d.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          const pr = req.call(el);
          if (pr && pr.then) {
            pr.then(() => {
              try {
                screen.orientation.lock('landscape').catch(() => {});
              } catch (err) {
                /* orientation lock not supported */
              }
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      /* fullscreen not supported */
    }
  }
  if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('#fs-btn').classList.add('hidden');

  // ------------------------------------------------------------ keyboard / gamepad menus
  function navTargets() {
    if (!ui.screen) return [];
    return $$(`#scr-${ui.screen} .btn, #scr-${ui.screen} .card-f:not(.locked)`).filter(
      (el) => el.offsetParent !== null && !el.classList.contains('hidden')
    );
  }

  function focusEl(el) {
    $$('.focused').forEach((x) => x.classList.remove('focused'));
    el.classList.add('focused');
    el.focus({ preventScroll: false });
  }

  function navMove(dir) {
    const els = navTargets();
    if (!els.length) return;
    const cur = els.includes(document.activeElement) ? document.activeElement : null;
    if (!cur) return focusEl(els[0]);
    const r = cur.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let best = null;
    let bestScore = Infinity;
    els.forEach((el) => {
      if (el === cur) return;
      const b = el.getBoundingClientRect();
      const dx = b.left + b.width / 2 - cx;
      const dy = b.top + b.height / 2 - cy;
      let main;
      let side;
      if (dir === 'left') { main = -dx; side = dy; }
      if (dir === 'right') { main = dx; side = dy; }
      if (dir === 'up') { main = -dy; side = dx; }
      if (dir === 'down') { main = dy; side = dx; }
      if (main <= 4) return;
      const score = main + Math.abs(side) * 2.5;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });
    if (best) {
      focusEl(best);
      SF.Audio.play('move');
    }
  }

  function navActivate() {
    const el = document.activeElement;
    if (el && navTargets().includes(el)) el.click();
    else {
      const first = navTargets()[0];
      if (first) focusEl(first);
    }
  }

  const KEY_NAV = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };
  window.addEventListener('keydown', (e) => {
    SF.Audio.unlock();
    ui.lastInput = 'keys';
    if (!ui.screen) {
      if (e.code === 'Escape' && ui.match) {
        e.preventDefault();
        pause();
      }
      return;
    }
    if (ui.screen === 'vs') {
      if (['Enter', 'Space', 'KeyF', 'Escape'].includes(e.code)) beginMatch();
      return;
    }
    if (KEY_NAV[e.code]) {
      e.preventDefault();
      navMove(KEY_NAV[e.code]);
    } else if (['Enter', 'Space', 'KeyF', 'Comma', 'KeyK'].includes(e.code)) {
      e.preventDefault();
      navActivate();
    } else if (e.code === 'Escape' || e.code === 'Backspace') {
      e.preventDefault();
      if (ui.screen === 'pause') resume();
      else if ($(`#scr-${ui.screen} [data-act="back"]`)) back();
    }
  });
  window.addEventListener('pointerdown', () => {
    SF.Audio.unlock();
    ui.lastInput = 'pointer';
    $$('.focused').forEach((x) => x.classList.remove('focused'));
  });
  window.addEventListener('touchend', () => SF.Audio.unlock(), { passive: true });

  const padPrev = {};
  function pollPads() {
    SF.Input.pads().forEach((p, i) => {
      const b = (k) => p.buttons[k] && p.buttons[k].pressed;
      const ax = p.axes[0] || 0;
      const ay = p.axes[1] || 0;
      const now = {
        up: b(12) || ay < -0.5, down: b(13) || ay > 0.5, left: b(14) || ax < -0.5, right: b(15) || ax > 0.5,
        a: b(0), b: b(1), start: b(9),
      };
      const prev = padPrev[i] || {};
      const edge = (k) => now[k] && !prev[k];
      if (edge('start')) {
        if (!ui.screen && ui.match) pause();
        else if (ui.screen === 'pause') resume();
      }
      if (ui.screen) {
        if (Object.values(now).some(Boolean)) ui.lastInput = 'keys';
        ['up', 'down', 'left', 'right'].forEach((d) => {
          if (edge(d)) navMove(d);
        });
        if (edge('a')) {
          if (ui.screen === 'vs') beginMatch();
          else navActivate();
        }
        if (edge('b')) {
          if (ui.screen === 'pause') resume();
          else if ($(`#scr-${ui.screen} [data-act="back"]`)) back();
        }
      }
      padPrev[i] = now;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  // ------------------------------------------------------------ main loop
  let last = performance.now();
  let acc = 0;
  function tick() {
    ui.t++;
    pollPads();
    const m = ui.match || ui.demo;
    const hidden = ui.screen && $('#scr-' + ui.screen).classList.contains('solid');
    if (m && !(m === ui.demo && hidden)) m.update();
    if (ui.screen === 'select' && ui.t % 2 === 0) drawInfoPortrait();
  }

  function draw() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const m = ui.match || ui.demo;
    const hidden = ui.screen && $('#scr-' + ui.screen).classList.contains('solid');
    if (hidden && m === ui.demo) return;
    if (m) m.render(ctx);
    else {
      ctx.fillStyle = '#1b1030';
      ctx.fillRect(0, 0, SF.W, SF.H);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    acc += Math.min(100, now - last);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      acc -= STEP;
      tick();
      n++;
    }
    if (n === 5) acc = 0;
    draw();
  }

  // ------------------------------------------------------------ boot
  function boot() {
    resize();
    buildRoster();
    startDemo();
    show('title');
    requestAnimationFrame(frame);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  // Wait briefly for the cartoon font so canvas text uses it.
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load(`20px 'Luckiest Guy'`), new Promise((r) => setTimeout(r, 1500))])
      .catch(() => {})
      .then(() => {
        SF.FONT_READY = true;
        // Repaint portraits/labels drawn before the font loaded.
        buildRoster();
        if (ui.screen === 'select') setupSelect();
      });
  }
  boot();
})();
