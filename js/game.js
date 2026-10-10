// ===== 遊戲主程式 =====
(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const AUTOPLAY = params.has('autoplay');
const SHORT = params.has('short');
const SAVE_KEY = 'starlightIdolCardStage.v2';
const SAVE_KEY_OLD = 'starlightIdolCardStage.v1';

// ---------- 存檔（舊卡 id 直接作廢，避免當掉）----------
function defaultSave() {
  const col = {};
  CARDS.filter(c => c.id.endsWith('_b')).forEach(c => col[c.id] = 1);
  return { v: 2, collection: col, best: {}, plays: 0 };
}
function migrateSave(raw) {
  if (!raw || typeof raw !== 'object' || !raw.collection) return defaultSave();
  const col = {};
  Object.entries(raw.collection).forEach(([id, n]) => { if (CARD_MAP[id] && n > 0) col[id] = n; });
  if (!Object.keys(col).length) return defaultSave();
  return { v: 2, collection: col, best: raw.best || {}, plays: raw.plays || 0 };
}
let save;
try {
  const fresh = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  const legacy = JSON.parse(localStorage.getItem(SAVE_KEY_OLD) || 'null');
  save = migrateSave(fresh || legacy);
} catch (e) { save = defaultSave(); }
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); localStorage.removeItem(SAVE_KEY_OLD); } catch (e) {} };
if (params.has('unlock')) CARDS.forEach(c => { save.collection[c.id] = save.collection[c.id] || 1; });
persist();
preloadIdolAssets();

// ---------- 狀態 ----------
const cur = { idol: IDOLS[0], outfit: {}, song: SONGS[0], diff: DIFFS[1], tab: 'top' };
const owned = id => (save.collection[id] || 0) > 0;
function defaultOutfit(idol) {
  const o = {};
  SLOTS.forEach(s => {
    const mine = CARDS.filter(c => c.slot === s.key && owned(c.id));
    const pref = mine.filter(c => c.brand === idol.brand).sort((a, b) => b.appeal - a.appeal)[0];
    o[s.key] = (pref || mine[0] || {}).id || null;
  });
  return o;
}
const outfitCards = () => Object.fromEntries(SLOTS.map(s => [s.key, CARD_MAP[cur.outfit[s.key]] || null]));
const SLOT_FILE = { top: 'top', bottom: 'bot', shoes: 'shoe', acc: 'acc' };
function showcaseOutfit(idol) {
  const prefix = { rinne: 'mid', haruka: 'ros', ria: 'pop' }[idol.id] || idol.brand;
  return Object.fromEntries(SLOTS.map(s => [s.key, CARD_MAP[`${prefix}_${SLOT_FILE[s.key]}_a`]]));
}

// ---------- 畫面切換 ----------
function go(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + name).classList.add('active');
  if (name === 'title') renderTitle();
  if (name === 'select') renderSelect();
  if (name === 'coord') renderCoord();
  window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { Synth.init(); Synth.sfx('click'); if (live.running) stopLive(); go(g.dataset.go); }
});

// ---------- 背景星星 ----------
(function sky() {
  const sky = $('#sky'); let html = '';
  for (let i = 0; i < 70; i++) {
    const s = 2 + Math.random() * 4;
    html += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-delay:${(Math.random() * 4).toFixed(2)}s;animation-duration:${(2 + Math.random() * 3).toFixed(2)}s"></i>`;
  }
  sky.innerHTML = html;
})();

// ---------- 卡片 HTML ----------
function cardHTML(c, o = {}) {
  const b = brandOf(c.brand), slot = SLOTS.find(s => s.key === c.slot);
  if (o.locked) return `<div class="card locked"><div class="card-art">？</div><div class="card-name">???</div><div class="card-brand">${b.name}</div></div>`;
  return `<div class="card r-${c.rarity} ${o.selected ? 'selected' : ''}" data-id="${c.id}" style="--c1:${c.color};--c2:${c.sub};--tc:${TYPES[c.type].color}">
    <div class="card-rar">${c.rarity}</div>
    ${o.count > 1 ? `<div class="card-cnt">×${o.count}</div>` : ''}
    ${o.isNew ? `<div class="card-new">NEW!</div>` : ''}
    <div class="card-art"><img src="${ASSET_BASE + c.icon}" alt=""><span class="card-mark">${b.mark}</span></div>
    <div class="card-name">${c.name}</div>
    <div class="card-brand">${b.name}<small>${b.en}</small></div>
    <div class="card-foot"><span class="card-type">${TYPES[c.type].name}</span><span class="card-ap">✦${c.appeal}</span></div>
  </div>`;
}

// ---------- 標題 ----------
function renderTitle() {
  $('#titleIdols').innerHTML = IDOLS.map(d => `<div class="t-idol" data-idol="${d.id}"></div>`).join('');
  IDOLS.forEach(d => mountIdol($(`#titleIdols [data-idol="${d.id}"]`), d, showcaseOutfit(d), 'bob'));
}
$('#btnStart').onclick = () => { Synth.init(); Synth.sfx('click'); go('select'); };
$('#btnCollection').onclick = () => { Synth.init(); Synth.sfx('click'); showCollection(); };
$('#btnHelp').onclick = () => { Synth.init(); Synth.sfx('click'); showHelp(); };

// ---------- 選角 ----------
function renderSelect() {
  $('#idolList').innerHTML = IDOLS.map(d => `
    <div class="idol-card" data-idol="${d.id}" style="--tc:${TYPES[d.type].color}">
      <div class="idol-pic"><img src="${portraitSrc(d)}" alt="${d.name}"></div>
      <div class="idol-name">${d.name}<small>${d.en}</small></div>
      <div class="idol-type">${TYPES[d.type].name}型｜最愛品牌：${brandOf(d.brand).name}</div>
      <p>${d.desc}</p><div class="idol-catch">${d.catch}</div>
      <button class="btn btn-main">選擇${d.name}</button>
    </div>`).join('');
  $$('.idol-card').forEach(el => el.onclick = () => {
    Synth.sfx('click');
    cur.idol = IDOLS.find(d => d.id === el.dataset.idol);
    cur.outfit = defaultOutfit(cur.idol);
    go('coord');
  });
}

// ---------- 搭配計算 ----------
function calcAppeal(outfit, idol) {
  const cards = SLOTS.map(s => outfit[s.key]).filter(Boolean);
  let base = cards.reduce((a, c) => a + c.appeal, 0);
  const bonuses = []; let add = 0, mult = 1;
  const match = cards.filter(c => c.type === idol.type);
  if (match.length) { const v = Math.round(match.reduce((a, c) => a + c.appeal, 0) * 0.15); add += v; bonuses.push([`${TYPES[idol.type].name}屬性契合 ×${match.length}件`, `+${v}`]); }
  const cnt = {}; cards.forEach(c => cnt[c.brand] = (cnt[c.brand] || 0) + 1);
  const [topBrand, topN] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  if (topN === 4) { mult *= 1.5; bonuses.push([`品牌套裝「${brandOf(topBrand).name}」`, '×1.5']); }
  else if (topN === 3) { mult *= 1.2; bonuses.push([`品牌搭配 3件「${brandOf(topBrand).name}」`, '×1.2']); }
  else if (topN === 2 && Object.keys(cnt).length === 2) { mult *= 1.1; bonuses.push(['雙品牌混搭', '×1.1']); }
  if (cards.length === 4 && cards.every(c => c.rarity === 'PR')) { mult *= 1.2; bonuses.push(['全 PR 閃耀套裝', '×1.2']); }
  else if (cards.length === 4 && cards.every(c => c.rarity === 'SR' || c.rarity === 'PR')) { mult *= 1.1; bonuses.push(['高稀有度協調', '×1.1']); }
  const total = Math.round((base + add) * mult);
  return { base, total, bonuses, special: topBrand ? brandOf(topBrand).special : '閃耀星光' };
}

// ---------- 搭配畫面 ----------
function renderCoord() {
  const oc = outfitCards();
  const ap = calcAppeal(oc, cur.idol);
  mountIdol($('#previewIdol'), cur.idol, oc, 'bob');
  $('#appealTotal').textContent = ap.total;
  $('#bonusList').innerHTML = `<li><span>卡片魅力合計</span><b>${ap.base}</b></li>` +
    (ap.bonuses.length ? ap.bonuses.map(b => `<li class="bonus"><span>✦ ${b[0]}</span><b>${b[1]}</b></li>`).join('') : '<li class="hint">提示：同品牌湊齊4件有大幅加成。各欄可選「不穿」。</li>');
  $('#slotSummary').innerHTML = SLOTS.map(s => {
    const c = oc[s.key];
    return `<div class="slot-chip ${cur.tab === s.key ? 'on' : ''}" data-tab="${s.key}" style="--c1:${c ? c.color : '#666'}"><i>${s.icon}</i><span>${s.name}</span><b>${c ? c.name : '不穿'}</b><em class="${c ? 'r-' + c.rarity : ''}">${c ? c.rarity : '—'} </em></div>`;
  }).join('');
  $('#slotTabs').innerHTML = SLOTS.map(s => `<button class="tab ${cur.tab === s.key ? 'on' : ''}" data-tab="${s.key}">${s.icon} ${s.name}</button>`).join('');
  const rOrd = { PR: 0, SR: 1, R: 2, N: 3 };
  const list = CARDS.filter(c => c.slot === cur.tab && owned(c.id)).sort((a, b) => rOrd[a.rarity] - rOrd[b.rarity] || a.brand.localeCompare(b.brand));
  const nOwn = CARDS.filter(c => c.slot === cur.tab && owned(c.id)).length;
  const nAll = CARDS.filter(c => c.slot === cur.tab).length;
  $('#cardGrid').innerHTML = `<div class="card none ${!cur.outfit[cur.tab] ? 'selected' : ''}" data-unequip>不穿</div>` +
    list.map(c => cardHTML(c, { selected: cur.outfit[c.slot] === c.id, count: save.collection[c.id] })).join('') +
    `<div class="grid-note">已收集 ${nOwn} / ${nAll} 張｜Live 後可抽新卡</div>`;
  $('#songSeg').innerHTML = SONGS.map(s => `<button class="${cur.song === s ? 'on' : ''}" data-song="${s.id}">${s.name}<small>BPM ${s.bpm}</small></button>`).join('');
  $('#diffSeg').innerHTML = DIFFS.map(d => `<button class="${cur.diff === d ? 'on' : ''}" data-diff="${d.id}">${d.name}</button>`).join('');
}
$('#screen-coord').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]'); if (t) { cur.tab = t.dataset.tab; Synth.sfx('click'); renderCoord(); return; }
  if (e.target.closest('[data-unequip]')) { cur.outfit[cur.tab] = null; Synth.sfx('click'); renderCoord(); return; }
  const c = e.target.closest('.card[data-id]'); if (c) { const card = CARD_MAP[c.dataset.id]; if (!card) return; cur.outfit[card.slot] = card.id; Synth.sfx('perfect'); renderCoord(); return; }
  const s = e.target.closest('[data-song]'); if (s) { cur.song = SONGS.find(x => x.id === s.dataset.song); Synth.sfx('click'); renderCoord(); return; }
  const d = e.target.closest('[data-diff]'); if (d) { cur.diff = DIFFS.find(x => x.id === d.dataset.diff); Synth.sfx('click'); renderCoord(); }
});
$('#btnAuto').onclick = () => {
  // 嘗試每個品牌套裝與各欄最高值，取總魅力最高者
  const mine = CARDS.filter(c => owned(c.id));
  const best = s => (arr) => arr.filter(c => c.slot === s).sort((a, b) => b.appeal - a.appeal)[0];
  const cands = [Object.fromEntries(SLOTS.map(s => [s.key, best(s.key)(mine)]))];
  BRANDS.forEach(b => cands.push(Object.fromEntries(SLOTS.map(s => [s.key, best(s.key)(mine.filter(c => c.brand === b.id)) || best(s.key)(mine)]))));
  const win = cands.filter(o => SLOTS.some(s => o[s.key])).sort((a, b) => calcAppeal(b, cur.idol).total - calcAppeal(a, cur.idol).total)[0];
  if (win) SLOTS.forEach(s => cur.outfit[s.key] = win[s.key] ? win[s.key].id : null);
  Synth.sfx('appeal'); renderCoord();
};
$('#btnLive').onclick = () => startLive();

// ---------- 譜面 ----------
function makeChart(song, diff, bars, zones) {
  let seed = song.bpm * 7 + diff.id.length * 131 + bars;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const spb16 = 60 / song.bpm / 4, notes = [];
  let prev = 1;
  const pickLane = (avoid) => { let l; do { l = Math.floor(rnd() * 4); } while (l === avoid || (l === prev && rnd() < 0.7)); return l; };
  for (let bar = 1; bar < bars - 1; bar++) {
    const inZone = zones.some(z => bar >= z[0] && bar < z[1]);
    for (let s = 0; s < 16; s++) {
      let p = 0, chord = 0;
      if (bar === 1) p = s % 4 === 0 ? 0.6 : 0;
      else if (diff.id === 'easy') p = s % 4 === 0 ? (inZone ? 1 : 0.7) : (s % 2 === 0 && inZone ? 0.25 : 0);
      else if (diff.id === 'normal') { p = s % 4 === 0 ? 0.92 : s % 2 === 0 ? (inZone ? 0.55 : 0.3) : 0; chord = s === 0 ? 0.3 : 0; }
      else { p = s % 2 === 0 ? 0.8 : (inZone ? 0.25 : 0.1); chord = s % 8 === 0 ? 0.35 : 0; }
      if (rnd() < p) {
        const t = (bar * 16 + s) * spb16;
        const l = pickLane(-1); notes.push({ t, lane: l, gold: inZone, zone: zones.findIndex(z => bar >= z[0] && bar < z[1]) });
        if (rnd() < chord) notes.push({ t, lane: pickLane(l), gold: inZone, zone: zones.findIndex(z => bar >= z[0] && bar < z[1]) });
        prev = l;
      }
    }
  }
  return notes;
}

// ---------- Live ----------
const JUDGE = { perfect: 0.05, great: 0.09, good: 0.13 };
const LANE_COLORS = ['#ff6fae', '#7d8cff', '#3fd6ff', '#5fe39a'];
const live = { running: false };
const canvas = $('#laneCanvas'), g2 = canvas.getContext('2d');
let useAudioClock = false;
const clock = () => useAudioClock ? Synth.ctx.currentTime : performance.now() / 1000;

async function startLive() {
  const ctx = Synth.init();
  if (ctx && ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 400))]); } catch (e) {} }
  useAudioClock = !!(ctx && ctx.state === 'running');
  const song = cur.song, diff = cur.diff;
  const bars = SHORT ? 10 : 26;
  const zones = SHORT ? [[4, 6]] : [[7, 9], [15, 17], [22, 25]];
  const spb16 = 60 / song.bpm / 4;
  const notes = makeChart(song, diff, bars, zones);
  const oc = outfitCards(), ap = calcAppeal(oc, cur.idol);
  Object.assign(live, {
    running: true, song, diff, notes, zones, ap, oc,
    zoneInfo: zones.map((z, i) => ({ start: z[0] * 16 * spb16, end: z[1] * 16 * spb16, total: notes.filter(n => n.zone === i).length, hit: 0, done: false, announced: false })),
    start: clock() + 3, end: bars * 16 * spb16, score: 0, combo: 0, maxCombo: 0,
    counts: { perfect: 0, great: 0, good: 0, miss: 0 }, appeals: 0, appealBonus: 0,
    mult: 1 + ap.total / 8000, effects: [], press: [0, 0, 0, 0], approach: diff.approach,
    lastCount: 4, finished: false,
  });
  if (ctx) Synth.start(song, bars, useAudioClock ? live.start : ctx.currentTime + 3);
  go('live');
  mountIdol($('#stageIdol'), cur.idol, oc, 'dance');
  const beat = (60 / song.bpm) + 's';
  $('#screen-live').style.setProperty('--beat', beat);
  $('#stageIdol').style.setProperty('--beat', beat);
  $('#cutinIdol').src = portraitSrc(cur.idol);
  $('#hudSong').innerHTML = `♪ ${song.name}<small>${diff.name}｜魅力 ${ap.total}</small>`;
  $('#hudScore').textContent = '0';
  $('#combo').classList.remove('show');
  $('#appealMeter').style.width = '0%'; $('#appealCount').textContent = '★ 0';
  resize();
  requestAnimationFrame(loop);
}
function stopLive() { live.running = false; Synth.stop(); }
$('#btnQuit').onclick = () => { stopLive(); go('coord'); };

function resize() {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = r.width * dpr; canvas.height = r.height * dpr;
  g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  live.W = r.width; live.H = r.height; live.hitY = Math.max(72, r.height - 64);
}
window.addEventListener('resize', () => { if (live.running) resize(); });

function now() { return clock() - live.start; }

function hit(lane) {
  if (!live.running) return;
  live.press[lane] = 1;
  const t = now();
  let best = null, bd = 1;
  for (const n of live.notes) {
    if (n.res || n.lane !== lane) continue;
    const d = Math.abs(n.t - t);
    if (d < bd) { bd = d; best = n; }
    if (n.t - t > JUDGE.good) break;
  }
  if (best && bd <= JUDGE.good) judge(best, bd <= JUDGE.perfect ? 'perfect' : bd <= JUDGE.great ? 'great' : 'good');
}
function judge(n, res) {
  n.res = res; live.counts[res]++;
  if (res === 'miss') { live.combo = 0; showJudge('miss'); return; }
  live.combo++; live.maxCombo = Math.max(live.maxCombo, live.combo);
  const f = { perfect: 1, great: 0.75, good: 0.4 }[res];
  live.score += Math.round(500 * f * live.mult * (1 + Math.min(live.combo, 50) / 100) * (n.gold ? 1.5 : 1));
  if (n.zone >= 0) live.zoneInfo[n.zone].hit += res === 'good' ? 0.5 : 1;
  live.effects.push({ lane: n.lane, t: performance.now(), gold: n.gold, res });
  Synth.sfx(res === 'perfect' ? 'perfect' : 'hit');
  showJudge(res);
  if (res === 'perfect' && live.combo >= 4) sparkleIdol(live.combo);
}
function showJudge(res) {
  const j = $('#judge');
  j.className = 'judge ' + res; j.textContent = { perfect: 'PERFECT', great: 'GREAT', good: 'GOOD', miss: 'MISS' }[res];
  void j.offsetWidth; j.classList.add('pop');
  const c = $('#combo');
  c.querySelector('b').textContent = live.combo;
  c.classList.toggle('show', live.combo >= 3);
  if (live.combo >= 3) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}
function sparkleIdol(combo) {
  const host = $('#idolSparkles');
  if (!host) return;
  const n = combo >= 20 ? 18 : combo >= 10 ? 14 : 10;
  host.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const r = 70 + Math.random() * 90;
    s.style.setProperty('--x', (Math.cos(a) * r) + 'px');
    s.style.setProperty('--y', (Math.sin(a) * r * 1.15) + 'px');
    s.style.animationDelay = (Math.random() * 0.12) + 's';
    host.appendChild(s);
  }
  host.classList.remove('burst');
  void host.offsetWidth;
  host.classList.add('burst');
}
function banner(text, cls = '') {
  const b = $('#banner'); b.className = 'banner ' + cls; b.innerHTML = text; void b.offsetWidth; b.classList.add('show');
}

// 輸入
const KEYMAP = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
window.addEventListener('keydown', e => {
  if (!live.running) return;
  if (e.code in KEYMAP) { e.preventDefault(); if (!e.repeat) hit(KEYMAP[e.code]); }
  if (e.code === 'Escape') { stopLive(); go('coord'); }
});
window.addEventListener('keyup', e => { if (e.code in KEYMAP) { live.press[KEYMAP[e.code]] = 0; } });
$$('#laneTouch > div').forEach(el => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); hit(+el.dataset.lane); el.classList.add('down'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => { live.press[+el.dataset.lane] = 0; el.classList.remove('down'); }));
});

function loop() {
  if (!live.running) return;
  Synth.tick();
  const t = now();
  // 倒數
  if (t < 0) {
    const c = Math.ceil(-t);
    if (c !== live.lastCount) { live.lastCount = c; const cd = $('#countdown'); cd.textContent = c; cd.className = 'countdown show'; void cd.offsetWidth; cd.classList.add('pop'); Synth.sfx('count'); }
  } else if (live.lastCount !== 0) { live.lastCount = 0; const cd = $('#countdown'); cd.textContent = 'START!'; cd.className = 'countdown show pop'; setTimeout(() => cd.className = 'countdown', 700); }
  // 自動演奏（測試用）
  if (AUTOPLAY) for (const n of live.notes) { if (!n.res && n.t <= t) { live.press[n.lane] = 1; setTimeout(() => live.press[n.lane] = 0, 80); judge(n, 'perfect'); } }
  // Miss
  for (const n of live.notes) { if (!n.res && t - n.t > JUDGE.good) judge(n, 'miss'); if (n.t > t) break; }
  // Appeal 區段
  live.zoneInfo.forEach((z, i) => {
    if (!z.announced && t >= z.start - 1.2) { z.announced = true; banner('✦ APPEAL CHANCE ✦<small>金色音符全部打中，發動特別演出！</small>', 'chance'); }
    if (t >= z.start && t < z.end) $('#appealMeter').style.width = (z.total ? z.hit / z.total * 100 : 0) + '%';
    if (!z.done && t >= z.end + JUDGE.good + 0.05) {
      z.done = true;
      const ratio = z.total ? z.hit / z.total : 0;
      if (ratio >= 0.8) {
        const bonus = Math.round(live.ap.total * 8 * ratio);
        live.score += bonus; live.appealBonus += bonus; live.appeals++;
        $('#cutinName').innerHTML = `「${live.ap.special}」<em>+${bonus.toLocaleString()}</em>`;
        const ci = $('#cutin'); ci.classList.remove('show'); void ci.offsetWidth; ci.classList.add('show');
        $('#screen-live').classList.add('fever'); setTimeout(() => $('#screen-live').classList.remove('fever'), 2200);
        sparkleIdol(20);
        Synth.sfx('appeal');
        $('#appealCount').textContent = '★ ' + live.appeals;
      } else banner(`Appeal 失敗…<small>命中率 ${Math.round(ratio * 100)}%（需要 80%）</small>`, 'fail');
      setTimeout(() => $('#appealMeter').style.width = '0%', 600);
    }
  });
  $('#hudScore').textContent = live.score.toLocaleString();
  $('#hudProgress').style.width = Math.max(0, Math.min(100, t / live.end * 100)) + '%';
  draw(t);
  if (t > live.end + 0.6 && !live.finished) { live.finished = true; setTimeout(finishLive, 400); }
  requestAnimationFrame(loop);
}

function draw(t) {
  const { W, H, hitY } = live, lw = W / 4;
  g2.clearRect(0, 0, W, H);
  // 軌道
  for (let i = 0; i < 4; i++) {
    const grd = g2.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, live.press[i] ? hexA(LANE_COLORS[i], 0.36) : 'rgba(255,255,255,0.05)');
    g2.fillStyle = grd; g2.fillRect(i * lw + 2, 0, lw - 4, H);
  }
  g2.strokeStyle = 'rgba(255,255,255,.25)'; g2.lineWidth = 1;
  for (let i = 1; i < 4; i++) { g2.beginPath(); g2.moveTo(i * lw, 0); g2.lineTo(i * lw, H); g2.stroke(); }
  // 判定線
  g2.shadowColor = '#fff'; g2.shadowBlur = 14; g2.fillStyle = 'rgba(255,255,255,.95)'; g2.fillRect(0, hitY - 2, W, 4); g2.shadowBlur = 0;
  for (let i = 0; i < 4; i++) {
    g2.beginPath(); g2.arc(i * lw + lw / 2, hitY, Math.min(lw * 0.32, 30), 0, Math.PI * 2);
    g2.strokeStyle = LANE_COLORS[i]; g2.lineWidth = 3; g2.stroke();
    if (live.press[i]) { g2.fillStyle = hexA(LANE_COLORS[i], 0.4); g2.fill(); }
  }
  // 音符
  const ap = live.approach;
  for (const n of live.notes) {
    if (n.res) continue;
    const dt = n.t - t; if (dt > ap) break;
    const y = hitY - (dt / ap) * hitY, x = n.lane * lw + lw / 2;
    if (y < -30 || y > H + 30) continue;
    drawNote(x, y, Math.min(lw * 0.36, 34), n.gold ? '#ffd84a' : LANE_COLORS[n.lane], n.gold);
  }
  // 特效
  const nowMs = performance.now();
  live.effects = live.effects.filter(e => nowMs - e.t < 400);
  for (const e of live.effects) {
    const p = (nowMs - e.t) / 400, x = e.lane * lw + lw / 2;
    g2.beginPath(); g2.arc(x, hitY, 20 + p * 50, 0, Math.PI * 2);
    g2.strokeStyle = e.gold ? `rgba(255,216,74,${1 - p})` : `rgba(255,255,255,${1 - p})`; g2.lineWidth = 4 * (1 - p) + 1; g2.stroke();
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + p; g2.fillStyle = `rgba(255,240,170,${1 - p})`; star(x + Math.cos(a) * p * 60, hitY + Math.sin(a) * p * 60, 6 * (1 - p) + 2); }
  }
}
function drawNote(x, y, r, color, gold) {
  g2.save(); g2.translate(x, y);
  g2.shadowColor = color; g2.shadowBlur = gold ? 22 : 12;
  const grd = g2.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
  grd.addColorStop(0, '#fff'); grd.addColorStop(0.35, color); grd.addColorStop(1, shade(color, -50));
  g2.fillStyle = grd;
  g2.beginPath();
  if (gold) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.05; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
  else { g2.moveTo(0, -r * 0.8); g2.lineTo(r, 0); g2.lineTo(0, r * 0.8); g2.lineTo(-r, 0); }
  g2.closePath(); g2.fill();
  g2.shadowBlur = 0; g2.strokeStyle = 'rgba(255,255,255,.9)'; g2.lineWidth = 2; g2.stroke();
  g2.restore();
}
function star(x, y, r) { g2.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; g2.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g2.closePath(); g2.fill(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- 結果 ----------
let lastResult = null;
function finishLive() {
  stopLive();
  const c = live.counts, total = live.notes.length || 1;
  const acc = (c.perfect + c.great * 0.7 + c.good * 0.4) / total;
  const rank = acc >= 0.9 ? 'S' : acc >= 0.75 ? 'A' : acc >= 0.55 ? 'B' : 'C';
  const key = live.song.id + '-' + live.diff.id, prev = save.best[key] || 0, isBest = live.score > prev;
  if (isBest) save.best[key] = live.score;
  save.plays++; persist();
  lastResult = { rank, acc, score: live.score };
  go('result');
  mountIdol($('#resultIdol'), cur.idol, live.oc, rank === 'C' ? '' : 'bob');
  const r = $('#rank'); r.textContent = rank; r.className = 'rank rank-' + rank;
  $('#resBest').textContent = isBest ? '🎉 新紀錄！' : `最佳：${prev.toLocaleString()}`;
  $('#resTable').innerHTML = `
    <tr><th class="perfect">PERFECT</th><td>${c.perfect}</td><th class="great">GREAT</th><td>${c.great}</td></tr>
    <tr><th class="good">GOOD</th><td>${c.good}</td><th class="miss">MISS</th><td>${c.miss}</td></tr>
    <tr><th>最大連擊</th><td>${live.maxCombo}</td><th>準確率</th><td>${(acc * 100).toFixed(1)}%</td></tr>
    <tr><th>特別演出</th><td>${live.appeals} / ${live.zones.length}</td><th>演出加分</th><td>${live.appealBonus.toLocaleString()}</td></tr>`;
  // 分數跳動
  const el = $('#resScore'), target = live.score, t0 = performance.now();
  (function up() { const p = Math.min(1, (performance.now() - t0) / 1200); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString(); if (p < 1) requestAnimationFrame(up); })();
  $('#btnGacha').style.display = ''; $('#btnGacha').disabled = false;
  $('#gachaCard').innerHTML = ''; $('#gachaCard').className = 'gacha-card';
  $('#gachaMsg').innerHTML = `評價 <b>${rank}</b> 的抽卡機率：` + RARITIES.map((x, i) => `${x} ${GACHA_RATES[rank][i]}%`).join('・');
}
$('#btnGacha').onclick = () => {
  const btn = $('#btnGacha'); if (btn.disabled) return; btn.disabled = true;
  const rates = GACHA_RATES[lastResult.rank];
  let roll = Math.random() * 100, ri = 0;
  while (ri < 3 && roll >= rates[ri]) { roll -= rates[ri]; ri++; }
  const pool = CARDS.filter(c => c.rarity === RARITIES[ri]);
  const card = (pool.length ? pool : CARDS)[Math.floor(Math.random() * (pool.length || CARDS.length))];
  const isNew = !owned(card.id);
  save.collection[card.id] = (save.collection[card.id] || 0) + 1; persist();
  btn.style.display = 'none';
  const gc = $('#gachaCard');
  gc.innerHTML = `<div class="flip"><div class="flip-back">✦</div><div class="flip-front">${cardHTML(card, { isNew })}</div></div>`;
  gc.className = 'gacha-card r-' + card.rarity;
  Synth.sfx('gacha');
  setTimeout(() => gc.classList.add('open'), 60);
  $('#gachaMsg').innerHTML = `${isNew ? '✨ 獲得新卡片！' : '已擁有（張數 +1）'}「${card.name}」<br><small>${brandOf(card.brand).name}・${TYPES[card.type].name}・${card.rarity}・魅力 ${card.appeal}</small>`;
};
$('#btnRetry').onclick = () => startLive();
$('#btnRecoord').onclick = () => go('coord');

// ---------- 彈窗 ----------
function modal(html) { $('#modalContent').innerHTML = html; $('#modal').classList.add('show'); }
$('#modalClose').onclick = () => $('#modal').classList.remove('show');
$('#modal').onclick = e => { if (e.target.id === 'modal') $('#modal').classList.remove('show'); };
function showCollection() {
  const n = CARDS.filter(c => owned(c.id)).length;
  modal(`<h2>📒 我的卡冊 <small>${n} / ${CARDS.length}</small></h2>` + BRANDS.map(b => `
    <h3 class="col-brand">${b.mark} ${b.name} <small>${b.en}｜${TYPES[b.type].name}</small></h3>
    <div class="card-grid col">${CARDS.filter(c => c.brand === b.id).map(c => owned(c.id) ? cardHTML(c, { count: save.collection[c.id] }) : cardHTML(c, { locked: true })).join('')}</div>`).join('') +
    `<div class="modal-foot"><button class="btn small" id="btnReset">重置存檔</button></div>`);
  $('#btnReset').onclick = () => { if (confirm('確定要清除所有收集紀錄嗎？')) { save = defaultSave(); persist(); showCollection(); } };
}
function showHelp() {
  modal(`<h2>❔ 玩法說明</h2>
  <ol class="help">
    <li><b>選擇偶像</b>：三位原創偶像各有屬性（酷炫／優雅／流行）。</li>
    <li><b>卡片搭配</b>：從卡冊挑選「上衣・下身・鞋子・配件」，各欄也可「不穿」。<br>・卡片屬性與偶像相同：該卡魅力 +15%<br>・同品牌 3 件 ×1.2，4 件套裝 ×1.5<br>・全 SR 以上 ×1.1，全 PR ×1.2<br>總魅力越高，Live 得分倍率越高！</li>
    <li><b>舞台 Live</b>：音符落到判定線時按下對應按鍵或點擊軌道。<br>鍵盤：<kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd>　｜　手機：直接點擊四條軌道<br>判定：PERFECT ＞ GREAT ＞ GOOD ＞ MISS</li>
    <li><b>APPEAL CHANCE</b>：金色星形音符出現時，命中率達 80% 即發動「特別演出」，獲得大量加分！</li>
    <li><b>結果與抽卡</b>：依準確率評價 S／A／B／C，評價越高越容易抽到 SR、PR 卡，卡片會自動存進卡冊（瀏覽器 localStorage）。</li>
  </ol>`);
}

go('title');
const SHOTS = {
  select: { idol: 'rinne', screen: 'select' },
  a: { idol: 'rinne', screen: 'coord', outfit: { top: 'mid_top_a', bottom: 'mid_bot_a', shoes: 'mid_shoe_a', acc: 'mid_acc_a' } },
  b: { idol: 'haruka', screen: 'coord', outfit: { top: 'ros_top_a', bottom: 'ros_bot_a', shoes: 'ros_shoe_a', acc: 'ros_acc_a' } },
  c: { idol: 'ria', screen: 'live', outfit: { top: 'pop_top_a', bottom: 'pop_bot_a', shoes: 'pop_shoe_a', acc: 'pop_acc_a' } },
  appeal: { idol: 'haruka', screen: 'appeal', outfit: { top: 'ros_top_a', bottom: 'ros_bot_a', shoes: 'ros_shoe_a', acc: 'ros_acc_a' } },
  result: { idol: 'rinne', screen: 'result', outfit: { top: 'mid_top_b', bottom: 'mid_bot_b', shoes: 'mid_shoe_b', acc: 'mid_acc_b' } },
  album: { idol: 'rinne', screen: 'album' },
};
const shot = params.get('shot');
if (shot && SHOTS[shot]) {
  const s = SHOTS[shot];
  cur.idol = IDOLS.find(d => d.id === s.idol) || cur.idol;
  if (s.outfit) cur.outfit = { ...s.outfit };
  if (s.screen === 'live') startLive();
  else if (s.screen === 'appeal') {
    mountIdol($('#stageIdol'), cur.idol, s.outfit, 'dance');
    $('#screen-live').style.setProperty('--beat', '0.48s');
    $('#cutinIdol').src = portraitSrc(cur.idol);
    $('#cutinName').innerHTML = `「${brandOf(cur.idol.brand).special}」`;
    $('#hudSong').innerHTML = `♪ ${cur.song.name}<small>特別演出</small>`;
    go('live');
    sparkleIdol(12);
    requestAnimationFrame(() => { const ci = $('#cutin'); ci.classList.remove('show'); void ci.offsetWidth; ci.classList.add('show'); });
  } else if (s.screen === 'result') {
    live.oc = outfitCards(); live.counts = { perfect: 42, great: 8, good: 2, miss: 1 }; live.maxCombo = 40; live.appeals = 2; live.zones = [1, 2]; live.appealBonus = 8000; live.score = 128000; live.song = cur.song; live.diff = cur.diff; live.notes = new Array(53);
    finishLive();
    $('#btnGacha').click();
  } else if (s.screen === 'album') { showCollection(); }
  else go(s.screen);
}
function equip(ids) {
  SLOTS.forEach(s => { cur.outfit[s.key] = ids[s.key] && CARD_MAP[ids[s.key]] ? ids[s.key] : (ids[s.key] === null ? null : cur.outfit[s.key]); });
  if ($('#screen-coord').classList.contains('active')) renderCoord();
}
window.__game = { live, cur, save: () => save, go, startLive, equip, renderCoord };
preloadIdolAssets();
})();
