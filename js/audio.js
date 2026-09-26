// All sound effects are synthesised with WebAudio, so there are no audio files.
SF.Audio = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function unlock() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.45;
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) {
        ctx = null;
        return;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, dur, o = {}) {
    const t = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
    const vol = o.vol || 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, o = {}) {
    const t = ctx.currentTime + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 1200, t);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  const sounds = {
    swing() { noise(0.12, { vol: 0.12, freq: 600, slide: 2500, filter: 'bandpass' }); },
    hit() {
      noise(0.1, { vol: 0.35, freq: 1500 });
      tone(160, 0.12, { type: 'triangle', vol: 0.3, slide: 70 });
    },
    bighit() {
      noise(0.25, { vol: 0.45, freq: 900 });
      tone(120, 0.3, { type: 'triangle', vol: 0.4, slide: 40 });
      tone(300, 0.1, { type: 'square', vol: 0.08, slide: 100 });
    },
    block() {
      tone(900, 0.06, { type: 'square', vol: 0.08, slide: 600 });
      noise(0.05, { vol: 0.1, freq: 3000, filter: 'highpass' });
    },
    jump() { tone(300, 0.15, { type: 'square', vol: 0.07, slide: 650 }); },
    land() { noise(0.08, { vol: 0.12, freq: 400 }); },
    boing() {
      tone(180, 0.35, { type: 'sine', vol: 0.3, slide: 700 });
      tone(360, 0.35, { type: 'triangle', vol: 0.1, slide: 1100, delay: 0.05 });
    },
    stomp() {
      tone(70, 0.3, { type: 'sine', vol: 0.5, slide: 35 });
      noise(0.2, { vol: 0.3, freq: 300 });
    },
    boom() {
      tone(60, 0.6, { type: 'sine', vol: 0.6, slide: 25 });
      noise(0.6, { vol: 0.5, freq: 700, slide: 100 });
    },
    leaf() { noise(0.2, { vol: 0.12, freq: 3000, slide: 800, filter: 'bandpass' }); },
    dive() { tone(1200, 0.3, { type: 'sawtooth', vol: 0.06, slide: 300 }); },
    chomp() {
      tone(500, 0.05, { type: 'square', vol: 0.15, slide: 200 });
      tone(400, 0.05, { type: 'square', vol: 0.15, slide: 150, delay: 0.08 });
    },
    spin() { noise(0.3, { vol: 0.15, freq: 400, slide: 3000, filter: 'bandpass' }); },
    charge() { tone(220 + Math.random() * 60, 0.08, { type: 'sine', vol: 0.06, slide: 440 }); },
    ready() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.07, delay: i * 0.06 }));
    },
    ult() {
      tone(110, 0.9, { type: 'sawtooth', vol: 0.12, slide: 880 });
      noise(0.9, { vol: 0.12, freq: 200, slide: 5000, filter: 'bandpass' });
      [0, 0.15, 0.3].forEach((d) => tone(1320, 0.08, { type: 'square', vol: 0.05, delay: d + 0.5 }));
    },
    laugh() {
      // Kookaburra-style "koo-koo-ka-ka-ka".
      for (let i = 0; i < 16; i++) {
        const base = i < 5 ? 700 : 1000 + (i % 2) * 300;
        tone(base, 0.09, { type: 'sawtooth', vol: 0.07, slide: base * 1.4, delay: i * 0.08 });
      }
    },
    ko() {
      tone(400, 0.9, { type: 'square', vol: 0.12, slide: 60 });
      noise(0.5, { vol: 0.3, freq: 500 });
    },
    bonk() {
      tone(700, 0.12, { type: 'sine', vol: 0.3, slide: 300 });
      tone(1400, 0.08, { type: 'sine', vol: 0.1, slide: 800, delay: 0.02 });
    },
    whistle() { tone(900, 0.5, { type: 'sine', vol: 0.12, slide: 300 }); },
    select() { tone(660, 0.07, { type: 'square', vol: 0.08 }); tone(990, 0.08, { type: 'square', vol: 0.08, delay: 0.06 }); },
    move() { tone(440, 0.04, { type: 'square', vol: 0.05 }); },
    back() { tone(440, 0.07, { type: 'square', vol: 0.07, slide: 220 }); },
    gong() {
      tone(196, 1.2, { type: 'sine', vol: 0.3 });
      tone(294, 1.0, { type: 'sine', vol: 0.12 });
      tone(415, 0.8, { type: 'triangle', vol: 0.06 });
    },
    fight() {
      noise(0.3, { vol: 0.25, freq: 800 });
      tone(330, 0.3, { type: 'sawtooth', vol: 0.12, slide: 660 });
    },
    win() {
      [523, 659, 784, 659, 784, 1047].forEach((f, i) =>
        tone(f, 0.16, { type: 'square', vol: 0.08, delay: i * 0.12 })
      );
    },
    splash() { noise(0.4, { vol: 0.25, freq: 2500, slide: 400 }); },
  };

  function play(name) {
    if (!SF.settings.sound || !ctx || ctx.state !== 'running') return;
    try {
      if (sounds[name]) sounds[name]();
    } catch (e) {
      /* ignore audio glitches */
    }
  }

  // ---------- victory music ----------
  // Notes are [pitch, beats]; pitch like 'C5', or null for a rest.
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const sharp = n[1] === '#' ? 1 : 0;
    const oct = parseInt(n.slice(1 + sharp), 10);
    return 440 * Math.pow(2, (NOTE[n[0]] + sharp + (oct - 4) * 12 - 9) / 12);
  }

  function seq(notes, beat, start, o) {
    let t = start;
    notes.forEach(([n, b]) => {
      if (n) tone(freq(n), Math.max(0.06, b * beat * 0.92), Object.assign({ delay: t }, o));
      t += b * beat;
    });
    return t;
  }

  function drums(beats, beat, start) {
    for (let i = 0; i < beats; i++) {
      const t = start + i * beat;
      if (i % 2 === 0) tone(110, 0.15, { type: 'sine', vol: 0.35, slide: 45, delay: t });
      else noise(0.08, { vol: 0.18, freq: 5000, filter: 'highpass', delay: t });
      noise(0.03, { vol: 0.06, freq: 8000, filter: 'highpass', delay: t + beat / 2 });
    }
  }

  const TUNES = {
    // Quick "you won the round!" jingle.
    roundWin() {
      const b = 0.11;
      seq([['C5', 1], ['E5', 1], ['G5', 1], ['C6', 3]], b, 0, { type: 'square', vol: 0.09 });
      seq([['E4', 1], ['G4', 1], ['C5', 1], ['E5', 3]], b, 0, { type: 'triangle', vol: 0.08 });
      seq([['C3', 3], ['C3', 3]], b, 0, { type: 'triangle', vol: 0.18 });
    },
    // Big fanfare for winning the match.
    victory() {
      const b = 0.14;
      const lead = [
        ['G4', 1], ['C5', 1], ['E5', 1], ['G5', 2], ['E5', 1], ['G5', 4],
        ['A5', 1], ['G5', 1], ['F5', 1], ['E5', 1], ['D5', 2], ['E5', 1], ['C5', 5],
        ['G5', 1], ['A5', 1], ['B5', 1], ['C6', 6],
      ];
      const harmony = [
        ['E4', 1], ['G4', 1], ['C5', 1], ['E5', 2], ['C5', 1], ['E5', 4],
        ['F5', 1], ['E5', 1], ['D5', 1], ['C5', 1], ['B4', 2], ['C5', 1], ['G4', 5],
        ['E5', 1], ['F5', 1], ['G5', 1], ['E5', 6],
      ];
      const bass = [
        ['C3', 2], ['G2', 2], ['C3', 2], ['G2', 2], ['F2', 2], ['G2', 2], ['C3', 2], ['G2', 2],
        ['F2', 1], ['G2', 1], ['G2', 1], ['C3', 6],
      ];
      seq(lead, b, 0, { type: 'square', vol: 0.085 });
      seq(harmony, b, 0, { type: 'triangle', vol: 0.07 });
      seq(bass, b, 0, { type: 'triangle', vol: 0.2 });
      drums(24, b, 0);
      noise(0.9, { vol: 0.15, freq: 7000, filter: 'highpass', delay: 25 * b });
    },
    // Extra-long celebration for becoming Arcade Champion.
    champion() {
      TUNES.victory();
      const b = 0.14;
      const s = 32 * b;
      seq([['C5', 1], ['E5', 1], ['G5', 1], ['C6', 1], ['G5', 1], ['C6', 1], ['E6', 2], ['D6', 1], ['E6', 1], ['C6', 1], ['D6', 1], ['E6', 6]], b, s, { type: 'square', vol: 0.085 });
      seq([['C3', 2], ['E3', 2], ['G2', 2], ['C3', 2], ['G2', 2], ['C3', 6]], b, s, { type: 'triangle', vol: 0.2 });
      drums(16, b, s);
    },
  };

  let lastTune = 0;
  function music(name) {
    if (!SF.settings.sound || !SF.settings.music || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - lastTune < 0.5) return;
    lastTune = now;
    try {
      if (TUNES[name]) TUNES[name]();
    } catch (e) {
      /* ignore audio glitches */
    }
  }

  return { unlock, play, music };
})();
