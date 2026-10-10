// ===== Web Audio 合成音樂引擎（全原創，程式即時生成）=====
const Synth = (() => {
  let ctx = null, master = null, comp = null, noiseBuf = null;
  let song = null, startAt = 0, nextStep = 0, totalSteps = 0, melody = [], playing = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.55;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(t, freq, dur, type, vol, attack = 0.005) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
  }
  function noise(t, dur, vol, hp) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }

  // 依和弦生成旋律（種子亂數 → 每次相同）
  function makeMelody(sg, bars) {
    let seed = sg.bpm * 31 + sg.root;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const out = [];
    let prev = 12;
    for (let bar = 0; bar < bars; bar++) {
      const ch = sg.prog[bar % 4];
      const pool = [...ch.map(x => x + 12), ...ch.map(x => x + 24)];
      for (let s = 0; s < 16; s += 2) {
        if (rnd() < (s % 4 === 0 ? 0.85 : 0.45)) {
          pool.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev));
          const n = pool[Math.floor(rnd() * Math.min(3, pool.length))];
          out.push({ step: bar * 16 + s, note: n, len: rnd() < 0.3 ? 4 : 2 }); prev = n;
        }
      }
    }
    return out;
  }

  function scheduleStep(step, t) {
    const sg = song, bar = Math.floor(step / 16), s = step % 16;
    const ch = sg.prog[bar % 4], spb16 = 60 / sg.bpm / 4;
    const intro = bar < 2, outro = bar >= totalSteps / 16 - 1;
    if (s % 4 === 0) kick(t);
    if (!intro && (s === 4 || s === 12)) noise(t, 0.18, 0.5, 1200);
    if (s % 2 === 0) noise(t, 0.04, s % 4 === 2 ? 0.25 : 0.12, 7000);
    if (!intro && s % 2 === 0) tone(t, mtof(sg.root - 24 + ch[0] + (s % 4 === 2 ? 12 : 0)), spb16 * 1.8, 'triangle', 0.35);
    // 閃亮琶音
    tone(t, mtof(sg.root + 12 + ch[s % 3] + (s % 6 >= 3 ? 12 : 0)), spb16 * 0.9, 'triangle', intro ? 0.06 : 0.09);
    if (s === 0 && !outro) ch.forEach(c => tone(t, mtof(sg.root + c), spb16 * 14, 'sine', 0.07, 0.04));
    if (bar >= 2 && !outro) melody.filter(m => m.step === step).forEach(m => tone(t, mtof(sg.root + m.note), spb16 * m.len, sg.wave, 0.07, 0.01));
    if (outro && s === 0) { ch.forEach(c => tone(t, mtof(sg.root + 12 + c), 1.6, 'triangle', 0.1)); kick(t); noise(t, 1.2, 0.3, 4000); }
  }

  function start(sg, bars, when) {
    init(); if (!ctx) return 0;
    song = sg; totalSteps = bars * 16; nextStep = 0; melody = makeMelody(sg, bars);
    startAt = when; playing = true;
    return startAt;
  }
  function tick() {
    if (!playing || !ctx) return;
    const spb16 = 60 / song.bpm / 4;
    while (nextStep < totalSteps && startAt + nextStep * spb16 < ctx.currentTime + 0.15) {
      const t = startAt + nextStep * spb16;
      if (t >= ctx.currentTime - 0.02) scheduleStep(nextStep, t);
      nextStep++;
    }
  }
  function stop() { playing = false; }
  function sfx(kind) {
    if (!ctx) return; const t = ctx.currentTime;
    if (kind === 'hit') tone(t, 1760, 0.06, 'sine', 0.08);
    else if (kind === 'perfect') { tone(t, 2093, 0.08, 'sine', 0.09); tone(t + 0.03, 2637, 0.08, 'sine', 0.06); }
    else if (kind === 'appeal') [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(t + i * 0.05, mtof(84 + n), 0.4, 'triangle', 0.12));
    else if (kind === 'click') tone(t, 1200, 0.05, 'triangle', 0.08);
    else if (kind === 'count') tone(t, 880, 0.12, 'square', 0.06);
    else if (kind === 'gacha') [0, 7, 12, 16, 19, 24, 28, 31].forEach((n, i) => tone(t + i * 0.07, mtof(76 + n), 0.5, 'triangle', 0.1));
  }
  return { init, start, tick, stop, sfx, get ctx() { return ctx; } };
})();
