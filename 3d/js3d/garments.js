// Procedural garment library: every item is a real mesh (skinned to the shared VRM skeleton, or rigid on a bone)
import { THREE, canvasTex, toon } from './core.js?v=3d-20261010a';

export const DEFAULT_ITEMS = { top: 'def_top', bottom: 'def_bottom', shoes: 'def_shoes', acc: null };
const TAU = Math.PI * 2;

// ---------------- texture painters (u: around the body, front = 0.5; v: bottom→top) ----------------
const TEX_CACHE = new Map();
function tex(key, w, h, draw) {
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key);
  const t = canvasTex(w, h, draw, { repeat: true }); TEX_CACHE.set(key, t); return t;
}
function noise(g, w, h, n, a, cols) { for (let i = 0; i < n; i++) { g.globalAlpha = a * Math.random(); g.fillStyle = cols[i % cols.length]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } g.globalAlpha = 1; }
function sheen(g, w, h, col, n = 6, alpha = .18, slope = .4) { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const x = (i + .5) * w / n; const gr = g.createLinearGradient(x - 40, 0, x + 40, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = alpha; g.fillStyle = gr; g.save(); g.translate(x, h / 2); g.transform(1, 0, slope, 1, 0, 0); g.fillRect(-40, -h, 80, h * 2); g.restore(); } g.restore(); }
const T = {
  leather: (base, hi = '#8a90b0') => tex('lea' + base, 512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .12, ['#000', hi]); sheen(g, w, h, hi, 5, .22, .1); }),
  velvet: (base, hi) => tex('vel' + base, 512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { const r = g.createRadialGradient(Math.random() * w, Math.random() * h, 0, 0, 0, 0); } noise(g, w, h, 9000, .1, ['#000', hi]); sheen(g, w, h, hi, 4, .25, .6); }),
  satin: (base, hi = '#ffffff') => tex('sat' + base, 512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); sheen(g, w, h, hi, 7, .22, .25); }),
  plain: (base) => tex('pl' + base, 64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); }),
  knit: (base, rib = 'rgba(0,0,0,.08)') => tex('kn' + base, 256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = rib; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 2, h); }),
  stripes: (a, b, n = 24, horiz = false) => tex(`st${a}${b}${n}${horiz}`, 512, 512, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let i = 0; i < n; i++) horiz ? g.fillRect(0, i * h / n, w, h / n / 2) : g.fillRect(i * w / n, 0, w / n / 2, h); }),
  dots: (a, b, n = 28, r = 3) => tex(`dt${a}${b}${n}`, 512, 512, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.beginPath(); g.arc((x + (y % 2) * .5) * w / n, y * h / n, r, 0, TAU); g.fill(); } }),
  hearts: (a, b) => tex(`ht${a}${b}`, 512, 512, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) heart(g, (x + (y % 2) * .5) * w / 14, (y + .5) * h / 10, 7); }),
  sequin: (stops) => tex('sq' + stops.join(), 512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 7) for (let x = (y / 7 % 2) * 3.5; x < w; x += 7) { g.globalAlpha = .15 + Math.random() * .5; g.fillStyle = Math.random() < .3 ? '#fff' : 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); } g.globalAlpha = 1; }),
  holo: () => tex('holo', 512, 512, (g, w, h) => { for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y += 8) { g.fillStyle = `hsl(${(x * .9 + y * .6) % 360},80%,${78 + 10 * Math.sin(x * .05)}%)`; g.fillRect(x, y, 2, 8); } sheen(g, w, h, '#ffffff', 6, .3, .5); }),
  rainbowV: () => tex('rbv', 64, 512, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); ['#ff5f7a', '#ffa34a', '#ffe14a', '#6fe08a', '#5fc2ff', '#a57bff'].forEach((c, i) => gr.addColorStop(i / 5, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  lace: (col) => tex('lace' + col, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-out'; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const cx = (x + (y % 2) * .5) * 32, cy = y * 32 + 16; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.fill(); for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(cx + Math.cos(k) * 14, cy + Math.sin(k) * 14, 3, 0, TAU); g.fill(); } } }),
  tulle: (col) => tex('tul' + col, 128, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-out'; for (let y = 0; y < h; y += 4) for (let x = (y % 8 ? 2 : 0); x < w; x += 4) g.fillRect(x, y, 2, 2); }),
  pleats: (a, n = 20, dark = 'rgba(0,0,0,.28)') => tex(`pl${a}${n}`, 512, 64, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const gr = g.createLinearGradient(i * w / n, 0, (i + 1) * w / n, 0); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(.85, dark); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(i * w / n, 0, w / n, h); } }),
};
function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .6, y - s * 1.3, x, y - s * .35); g.bezierCurveTo(x + s * .6, y - s * 1.3, x + s * 1.6, y - s * .2, x, y + s * .9); g.fill(); }
// garment-specific full designs drawn over a base (front detail at u=0.5)
function design(key, base, draw) { return tex(key, 1024, 512, (g, w, h) => { g.drawImage(base.image, 0, 0, w, h); draw(g, w, h); }); }

// ---------------- geometry helpers ----------------
function boneIdx(idol, name) { const b = idol.bone(name); return idol.skin.skeleton.bones.indexOf(b); }
function cyl(idol, i, p) { // cylindrical uv in bind space
  const L = idol.L, part = idol.body.part[i]; const x = p[0], y = p[1], z = p[2];
  if (part === 'arm' || part === 'hand' || part === 'finger') { const cy = L.leftUpperArm.y, cz = L.leftUpperArm.z; return [Math.atan2(z - cz, y - cy) / TAU + .5, Math.abs(x)]; }
  if (part === 'leg' || part === 'foot') { const cx = Math.sign(x) * Math.abs(L.leftUpperLeg.x), cz = L.leftUpperLeg.z; return [Math.atan2(x - cx, z - cz) / TAU + .5, y]; }
  return [Math.atan2(x, z - L.hips.z) / TAU + .5, y];
}
// offset shell of selected body triangles + optional hem rim. returns {geo, covers}
function shell(idol, { sel, off = 0.007, rim = 0.0, rimOff = 0.004, vRange = null, all = true, smooth = 6 }) {
  const B = idol.body; const idx = idol.bodyIndexFull; const nT = idx.length / 3;
  const selV = new Uint8Array(B.n); for (let i = 0; i < B.n; i++) selV[i] = (sel(i) && !(B.src[i] === 0 && B.nearCloth[i])) ? 1 : 0;
  const tris = []; const covers = [];
  for (let t = 0; t < nT; t++) { const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2]; const s = selV[a] + selV[b] + selV[c]; if (all ? s === 3 : s >= 2) tris.push(t); }
  const map = new Map(); const P = [], N = [], UV = [], SI = [], SW = [], I = [];
  let ymin = 1e9, ymax = -1e9;
  for (const t of tris) for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; ymin = Math.min(ymin, B.pos[v * 3 + 1]); ymax = Math.max(ymax, B.pos[v * 3 + 1]); }
  const add = (v, extra = 0, push = null) => {
    const o = (typeof off === 'function' ? off(v) : off) + extra;
    const p = [B.pos[v * 3] + B.nor[v * 3] * o, B.pos[v * 3 + 1] + B.nor[v * 3 + 1] * o, B.pos[v * 3 + 2] + B.nor[v * 3 + 2] * o];
    if (push) { p[0] += push[0]; p[1] += push[1]; p[2] += push[2]; }
    P.push(...p); N.push(B.nor[v * 3], B.nor[v * 3 + 1], B.nor[v * 3 + 2]);
    let [u, vv] = cyl(idol, v, [B.pos[v * 3], B.pos[v * 3 + 1], B.pos[v * 3 + 2]]);
    const part = B.part[v]; if (!(part === 'arm' || part === 'hand' || part === 'finger')) vv = (vv - (vRange ? vRange[0] : ymin)) / ((vRange ? vRange[1] : ymax) - (vRange ? vRange[0] : ymin) || 1); else vv = vv * 2;
    UV.push(u, vv);
    for (let k = 0; k < 4; k++) { SI.push(B.SI.getComponent(v, k)); SW.push(B.SW.getComponent(v, k)); }
    return P.length / 3 - 1;
  };
  for (const t of tris) for (let k = 0; k < 3; k++) { const v = idx[t * 3 + k]; if (!map.has(v)) map.set(v, add(v)); I.push(map.get(v)); }
  // boundary loops: find them on welded positions, smooth the saw-tooth, then add a rolled hem strip
  const keyOf = (v) => `${Math.round(B.pos[v * 3] * 2e4)},${Math.round(B.pos[v * 3 + 1] * 2e4)},${Math.round(B.pos[v * 3 + 2] * 2e4)}`;
  const edges = new Map(); const ek = (a, b) => a < b ? a + '|' + b : b + '|' + a;
  for (const t of tris) for (let k = 0; k < 3; k++) { const a = idx[t * 3 + k], b = idx[t * 3 + (k + 1) % 3]; const key = ek(keyOf(a), keyOf(b)); const e = edges.get(key); if (e) e.n++; else edges.set(key, { n: 1, a, b, c: idx[t * 3 + (k + 2) % 3] }); }
  const boundaryV = new Set(); const adj = new Map(); const bEdges = [];
  for (const e of edges.values()) if (e.n === 1) { boundaryV.add(e.a); boundaryV.add(e.b); bEdges.push(e); const ka = keyOf(e.a), kb = keyOf(e.b); (adj.get(ka) || adj.set(ka, new Set()).get(ka)).add(kb); (adj.get(kb) || adj.set(kb, new Set()).get(kb)).add(ka); }
  const locByKey = new Map(); for (const [v, li] of map) { const k = keyOf(v); (locByKey.get(k) || locByKey.set(k, []).get(k)).push(li); }
  const getP = (k) => { const li = locByKey.get(k)[0]; return [P[li * 3], P[li * 3 + 1], P[li * 3 + 2]]; };
  for (let it = 0; it < (smooth ?? 6); it++) {
    const np = new Map();
    for (const [k, nb] of adj) { if (nb.size !== 2) continue; const [k1, k2] = [...nb]; const p0 = getP(k), p1 = getP(k1), p2 = getP(k2); np.set(k, [p0[0] * .5 + (p1[0] + p2[0]) * .25, p0[1] * .5 + (p1[1] + p2[1]) * .25, p0[2] * .5 + (p1[2] + p2[2]) * .25]); }
    for (const [k, q] of np) for (const li of locByKey.get(k)) { P[li * 3] = q[0]; P[li * 3 + 1] = q[1]; P[li * 3 + 2] = q[2]; }
  }
  const hemStart = I.length;
  if (rim > 0) {
    const outAcc = new Map();
    for (const e of bEdges) {
      const la = map.get(e.a), lb = map.get(e.b), lc = map.get(e.c);
      const pa = new THREE.Vector3(P[la * 3], P[la * 3 + 1], P[la * 3 + 2]), pb = new THREE.Vector3(P[lb * 3], P[lb * 3 + 1], P[lb * 3 + 2]), pc = new THREE.Vector3(P[lc * 3], P[lc * 3 + 1], P[lc * 3 + 2]);
      const ab = pb.clone().sub(pa).normalize(); const out = pa.clone().add(pb).multiplyScalar(.5).sub(pc); out.sub(ab.clone().multiplyScalar(out.dot(ab))).normalize();
      for (const v of [e.a, e.b]) { const k = keyOf(v); const o = outAcc.get(k) || outAcc.set(k, new THREE.Vector3()).get(k); o.add(out); }
    }
    const rimVert = new Map();
    const rv = (v) => { const k = keyOf(v); if (rimVert.has(k)) return rimVert.get(k); const li = map.get(v); const o = outAcc.get(k).clone().normalize().multiplyScalar(rim); const base = [P[li * 3] - (B.pos[v * 3] + B.nor[v * 3] * (typeof off === 'function' ? off(v) : off)), P[li * 3 + 1] - (B.pos[v * 3 + 1] + B.nor[v * 3 + 1] * (typeof off === 'function' ? off(v) : off)), P[li * 3 + 2] - (B.pos[v * 3 + 2] + B.nor[v * 3 + 2] * (typeof off === 'function' ? off(v) : off))]; const r = add(v, rimOff, [base[0] + o.x, base[1] + o.y, base[2] + o.z]); rimVert.set(k, r); return r; };
    for (const e of bEdges) { const a0 = map.get(e.a), b0 = map.get(e.b); const a1 = rv(e.a), b1 = rv(e.b); I.push(a0, b0, b1, a0, b1, a1); }
  }
  for (const t of tris) { const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2]; if (!boundaryV.has(a) && !boundaryV.has(b) && !boundaryV.has(c)) covers.push(t); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
  geo.setIndex(I); geo.userData.hemStart = hemStart;
  return { geo, covers };
}
function skinned(idol, geo, mats, outline = true) { // mats: main [, hem]
  const groups = [];
  const n = geo.index.count, hs = geo.userData.hemStart ?? n;
  const list = [mats[0]]; if (mats[1] && hs < n) list.push(mats[1]);
  geo.clearGroups(); geo.addGroup(0, hs, 0); if (list.length > 1) geo.addGroup(hs, n - hs, 1); else if (hs < n) geo.addGroup(hs, n - hs, 0);
  if (outline && !mats[0].transparent) { const o = mats[0].clone(); o.isOutline = true; o.side = THREE.BackSide; o.uniforms.alphaTest.value = mats[0].alphaTest; list.push(o); geo.addGroup(0, n, list.length - 1); }
  const m = new THREE.SkinnedMesh(geo, list); m.frustumCulled = false;
  m.bind(idol.skin.skeleton, idol.skin.bindMatrix); idol.skin.parent.add(m); return m;
}
function outlined(geo, mat, outline = true) {
  const m = new THREE.Mesh(geo, mat); if (!outline || mat.transparent) return m;
  const o = mat.clone(); o.isOutline = true; o.side = THREE.BackSide; m.material = [mat, o];
  const n = geo.index ? geo.index.count : geo.attributes.position.count; geo.clearGroups(); geo.addGroup(0, n, 0); geo.addGroup(0, n, 1); return m;
}
// generated skirt (tiers/pleats/slit), skinned hips→thighs
function skirt(idol, { top, len, flare, pleats = 0, pleatAmp = 0, wave = 0, slit = null, rows = 12, cols = 72, extra = 0.012, legW = 0.6, sec = null }) {
  const s = sec || idol.section(top); const rx = s.rx + extra + 0.006, rz = s.rz + extra + 0.006, cz = s.cz;
  const hi = boneIdx(idol, 'hips'), lL = boneIdx(idol, 'leftUpperLeg'), lR = boneIdx(idol, 'rightUpperLeg'), kL = boneIdx(idol, 'leftLowerLeg'), kR = boneIdx(idol, 'rightLowerLeg');
  const kneeY = idol.L.leftLowerLeg.y;
  const P = [], UV = [], SI = [], SW = [], I = [];
  for (let r = 0; r <= rows; r++) {
    const f = r / rows; const y = top - len * f; const fl = flare * Math.pow(f, 1.15);
    for (let c = 0; c <= cols; c++) {
      const a = c / cols * TAU; let k = 1;
      if (pleats) k += pleatAmp * f * (Math.abs(((a / TAU * pleats) % 1) - .5) * 2 - .5);
      let yy = y + (r === rows ? wave * Math.cos(a * 9) : 0) * f;
      const x = Math.sin(a) * (rx + fl) * k, z = cz + Math.cos(a) * (rz + fl) * k;
      P.push(x, yy, z); UV.push(c / cols, 1 - f);
      // weights: hips at the waist, then share to the near thigh (and knee for long skirts)
      const side = Math.min(1, Math.max(0, .5 + x / (2 * rx + 1e-4) * 1.4));
      const legAmt = legW * Math.min(1, f * len / Math.max(0.05, top - kneeY));
      let wk = 0; if (yy < kneeY) wk = Math.min(.6, (kneeY - yy) * 2.5) * legAmt;
      const wl = (legAmt - wk) * side, wr = (legAmt - wk) * (1 - side), wkl = wk * side, wkr = wk * (1 - side);
      SI.push(hi, lL, lR, side > .5 ? kL : kR); SW.push(1 - legAmt, wl, wr, side > .5 ? wkl + wkr : wkl + wkr);
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a0 = c / cols; if (slit && r >= rows * slit.from && Math.abs(a0 - slit.at) < slit.w) continue;
    const i0 = r * (cols + 1) + c, i1 = i0 + 1, i2 = i0 + cols + 1, i3 = i2 + 1; I.push(i0, i2, i1, i1, i2, i3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
  geo.setIndex(I); geo.computeVertexNormals(); return geo;
}
function ringGeo(idol, y, r0, r1, extra) { const s = idol.section(y); return { s, rx: s.rx + extra, rz: s.rz + extra }; }
// skinned frill ring (hem ruffle) continuing from a skirt's bottom edge
function frill(idol, { top, len, flare, extra = 0.012, depth = 0.035, legW = 0.6, sec = null }) {
  const base = sec || idol.section(top);
  return skirt(idol, { top: top - len + 0.004, len: depth, flare: depth * 0.8, extra: extra + flare, sec: base, rows: 2, cols: 120, wave: 0.006, legW });
}
// tiered skirt: every tier starts where the previous one is at that height (all radii relative to the waist section)
function tiered(I, top, tiers, frillMat) {
  const idol = I.idol; const sec = idol.section(top); let prev = null;
  for (const t of tiers) {
    let extra = 0.012;
    if (prev) { const f = Math.min(1, (t.dy - prev.dy) / prev.len); extra = prev.extra + prev.flare * Math.pow(f, 0.85) + 0.006; }
    I.add(skinned(idol, skirt(idol, { top: top - t.dy, len: t.len, flare: t.flare, extra, sec, pleats: t.pleats || 0, pleatAmp: t.pleatAmp || 0, wave: 0.005 }), [t.mat]));
    if (frillMat) I.add(skinned(idol, frill(idol, { top: top - t.dy, len: t.len, flare: t.flare, extra: extra + 0.002, sec, depth: t.frill || 0.028 }), [frillMat], false));
    prev = { ...t, extra };
  }
}
// ---------------- region predicates ----------------
function R(idol) {
  const B = idol.body, L = idol.L;
  const y = i => B.pos[i * 3 + 1], z = i => B.pos[i * 3 + 2], x = i => B.pos[i * 3];
  const part = i => B.part[i], t = i => B.t[i], h = i => B.human[i] || '';
  const W = { natural: L.spine.y + 0.03, low: L.hips.y + 0.01, high: L.chest.y - 0.03, hip: L.leftUpperLeg.y - 0.02 };
  const neckY = L.neck.y - 0.012; const chestY = L.upperChest ? L.upperChest.y : L.chest.y + 0.08;
  const isArm = i => part(i) === 'arm' || part(i) === 'hand' || part(i) === 'finger';
  const top = ({ bottom = W.natural, sleeve = 0.45, neck = 'crew', sleeveFrom = -99 }) => (i) => {
    const p = part(i);
    if (p === 'torso') {
      if (y(i) < bottom) return false;
      if (neck === 'off') return y(i) < chestY + 0.035;
      if (neck === 'scoop') return y(i) < neckY - 0.04 * Math.max(0, z(i) - L.neck.z) / 0.05 - 0.01;
      if (neck === 'vneck') return y(i) < neckY - Math.max(0, 0.11 - Math.abs(x(i)) * 1.6) * (z(i) > L.neck.z ? 1 : 0);
      return y(i) < neckY + 0.005;
    }
    if (p === 'head') return neck === 'high' && y(i) < L.neck.y + 0.04 && h(i) === 'neck';
    if (isArm(i)) { if (neck === 'off') return t(i) > 0.12 && t(i) < sleeve; return t(i) <= sleeve && t(i) >= sleeveFrom && part(i) !== 'finger'; }
    return false;
  };
  const bottom = ({ waist = W.natural, len = 0.3 }) => (i) => {
    const p = part(i); if (p === 'torso') return y(i) <= waist && (y(i) > L.leftUpperLeg.y - 0.12);
    if (p === 'leg') return t(i) <= len; return false;
  };
  const shoe = ({ from = 2.0 }) => (i) => (part(i) === 'foot') || (part(i) === 'leg' && t(i) >= from);
  const glove = ({ from = 1.6, fingers = 'proximal' }) => (i) => {
    const p = part(i); if (p === 'hand') return true; if (p === 'arm') return t(i) >= from;
    if (p === 'finger') return fingers === 'all' || /Proximal|Metacarpal/.test(h(i)); return false;
  };
  return { W, neckY, chestY, top, bottom, shoe, glove, y, z, x, t, part, h };
}

// ---------------- shoes: soles, heels, pose ----------------
function heelSetup(idol, angle, platform = 0) {
  const L = idol.L; const ank = L.leftFoot, toe = L.leftToes || new THREE.Vector3(ank.x, 0.02, ank.z + 0.1);
  const rot = (v) => new THREE.Vector3(v.x, v.y * Math.cos(angle) - v.z * Math.sin(angle), v.y * Math.sin(angle) + v.z * Math.cos(angle));
  const toeRel = toe.clone().sub(ank); const lift = Math.max(0, toeRel.y - rot(toeRel).y);
  const f = idol.foot.L; const heelPt = new THREE.Vector3(ank.x, f.min.y + 0.005, f.min.z + 0.022);
  const hr = rot(heelPt.clone().sub(ank)); const heelY = ank.y + lift + platform + hr.y; // height of heel bottom above floor
  return { angle, lift, platform, heelPt, heelH: heelY };
}
function soleAndHeel(idol, it, { angle = 0, platform = 0, color = '#111', heelColor, stiletto = true, soleThick = 0.008, block = false }) {
  const hs = heelSetup(idol, angle, platform); it.heel = { angle, lift: hs.lift, platform };
  const mat = toon({ color, outline: 0.0008 }); const hmat = toon({ color: heelColor || color, rim: '#ffffff', outline: 0.0008 });
  for (const side of ['L', 'R']) {
    const f = idol.foot[side]; const bn = side === 'L' ? 'left' : 'right'; const sx = (f.min.x + f.max.x) / 2;
    const toes = idol.L[bn + 'Toes'] || idol.L[bn + 'Foot'];
    // forefoot sole on the toe bone (stays flat on the floor)
    const fl = f.max.z - toes.z + 0.012, fw = (f.max.x - f.min.x) + 0.012;
    const g1 = new THREE.BoxGeometry(fw, soleThick + platform, fl + 0.02, 1, 1, 1);
    const s1 = outlined(g1, mat); it.add(idol.attachRigid(bn + 'Toes', s1, new THREE.Vector3(sx, f.min.y - (soleThick + platform) / 2 + 0.002, toes.z + fl / 2 - 0.02)));
    // rear sole under heel
    const rl = toes.z - f.min.z + 0.01;
    const g2 = new THREE.BoxGeometry(fw * 0.92, soleThick, rl, 1, 1, 1);
    const s2 = outlined(g2, mat); it.add(idol.attachRigid(bn + 'Foot', s2, new THREE.Vector3(sx, f.min.y - soleThick / 2 + 0.002, f.min.z + rl / 2 - 0.006)));
    if (hs.heelH > 0.015) {
      const H = hs.heelH; const g = block ? new THREE.CylinderGeometry(0.016, 0.014, H, 10) : new THREE.CylinderGeometry(0.011, 0.0035, H, 10);
      g.translate(0, -H / 2, 0); const hm = outlined(g, hmat); hm.rotation.x = -angle;
      it.add(idol.attachRigid(bn + 'Foot', hm, new THREE.Vector3(sx, f.min.y + 0.004, hs.heelPt.z)));
    }
  }
}

// ---------------- rigid accessories ----------------
function hoopEarrings(idol, it, { color = '#d8dde8', r = 0.012, drop = null, shape = 'hoop' }) {
  const m = toon({ color, rim: '#ffffff', emissive: color, emissiveIntensity: .15, outline: 0.0005 });
  for (const s of [1, -1]) {
    const g = new THREE.Group();
    if (shape === 'hoop') g.add(outlined(new THREE.TorusGeometry(r, 0.0018, 6, 24), m));
    if (shape === 'pearl') { const p = outlined(new THREE.SphereGeometry(0.0065, 12, 8), m); p.position.y = -0.012; g.add(p); g.add(outlined(new THREE.SphereGeometry(0.003, 8, 6), m)); }
    if (shape === 'star') { const st = starMesh(0.012, m); st.position.y = -0.016; g.add(st); }
    if (shape === 'crystal') { const c = outlined(new THREE.OctahedronGeometry(0.008), m); c.scale.y = 1.6; c.position.y = -0.016; g.add(c); }
    if (shape === 'hoop') g.position.y = -r;
    g.rotation.y = Math.PI / 2;
    const p = new THREE.Vector3(s * (idol.headHalf + 0.002), idol.eyeY - 0.052, idol.eyeZ - 0.075);
    it.add(idol.attachRigid('head', g, p));
  }
}
function starMesh(r, m) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return outlined(new THREE.ExtrudeGeometry(s, { depth: r * .3, bevelEnabled: false }), m); }
function neckRing(idol, { y = 0, extra = 0.004, color, tube = 0.004, beads = 0, beadR = 0.005, drape = 0.0, pendant = null, segs = 48 }) {
  const L = idol.L; const yy = L.neck.y - 0.03 + y; const s = idol.section(yy, 0.012); const rx = Math.max(0.045, s.rx) + extra, rz = Math.max(0.04, s.rz) + extra;
  const g = new THREE.Group(); const m = toon({ color, rim: '#ffffff', outline: 0.0005, emissive: color, emissiveIntensity: .08 });
  const pts = []; for (let i = 0; i <= segs; i++) { const a = i / segs * TAU; const d = drape * Math.max(0, Math.cos(a)); pts.push(new THREE.Vector3(Math.sin(a) * rx * (1 + d * 2), -d * 0.6, Math.cos(a) * rz * (1 + d * 1.5) + s.cz - L.upperChest.z)); }
  if (beads) { for (let i = 0; i < beads; i++) { const p = new THREE.CatmullRomCurve3(pts, true).getPoint(i / beads); const b = outlined(new THREE.SphereGeometry(beadR, 10, 8), m); b.position.copy(p); g.add(b); } }
  else g.add(outlined(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, tube, 6, true), m));
  if (pendant) { const front = pts[0].clone(); pendant.position.copy(front).add(new THREE.Vector3(0, -0.016, 0.004)); g.add(pendant); }
  return idol.attachRigid('upperChest', g, new THREE.Vector3(0, yy, L.upperChest.z));
}
function wristBand(idol, it, side, { color, tube = 0.004, t = 1.92, n = 1, beads = 0 }) {
  const L = idol.L; const bn = side > 0 ? 'left' : 'right'; const hx = L[bn + 'Hand'].x, ex = L[bn + 'LowerArm'].x;
  const x = ex + (hx - ex) * (t - 1); const m = toon({ color, rim: '#ffffff', outline: 0.0005, emissive: color, emissiveIntensity: .1 });
  for (let k = 0; k < n; k++) {
    const col = Array.isArray(color) ? color[k % color.length] : color; const mm = Array.isArray(color) ? toon({ color: col, rim: '#fff', outline: .0005 }) : m;
    const g = beads ? new THREE.Group() : outlined(new THREE.TorusGeometry(0.03, tube, 6, 24), mm);
    if (beads) for (let i = 0; i < beads; i++) { const a = i / beads * TAU; const b = outlined(new THREE.SphereGeometry(0.0045, 8, 6), mm); b.position.set(0, Math.cos(a) * 0.03, Math.sin(a) * 0.03); g.add(b); }
    else g.rotation.y = Math.PI / 2;
    it.add(idol.attachRigid(bn + 'LowerArm', g, new THREE.Vector3(x - side * k * 0.012, L[bn + 'Hand'].y, L[bn + 'Hand'].z)));
  }
}
function crossbody(idol, it, { strapColor, bag }) {
  const L = idol.L; const sh = L.rightUpperArm, hipL = L.leftUpperLeg; const s = idol.section(L.chest.y);
  const pts = [new THREE.Vector3(sh.x * 0.62, sh.y + 0.05, L.upperChest.z - 0.01), new THREE.Vector3(sh.x * 0.35, L.upperChest.y, L.upperChest.z + s.rz + 0.025), new THREE.Vector3(0.0, L.chest.y - 0.02, s.cz + s.rz + 0.03), new THREE.Vector3(hipL.x + 0.06, L.hips.y + 0.02, L.hips.z + 0.09), new THREE.Vector3(hipL.x + 0.11, L.hips.y - 0.05, L.hips.z + 0.02)];
  const m = toon({ color: strapColor, outline: 0.0005 });
  const strap = outlined(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.004, 6, false), m);
  const grp = new THREE.Group(); grp.add(strap); grp.position.set(-L.spine.x, -L.spine.y, -L.spine.z);
  const holder = new THREE.Group(); holder.add(grp); it.add(idol.attachRigid('spine', holder, L.spine.clone()));
  bag.position.set(hipL.x + 0.12, L.hips.y - 0.08, L.hips.z + 0.03); bag.position.sub(L.hips);
  const hb = new THREE.Group(); hb.add(bag); it.add(idol.attachRigid('hips', hb, L.hips.clone()));
}
function bow(color, s = 1) {
  const g = new THREE.Group(); const m = toon({ color, outline: 0.0007 });
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.02, 0.03, 0.05, 0.03, 0.05, 0); sh.bezierCurveTo(0.05, -0.03, 0.02, -0.03, 0, 0);
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 });
  const l = outlined(eg, m); const r = outlined(eg.clone(), m); r.scale.x = -1; g.add(l, r);
  const k = outlined(new THREE.SphereGeometry(0.011, 10, 8), m); k.scale.set(1, 1.1, .7); g.add(k);
  for (const sx of [1, -1]) { const t = outlined(new THREE.BoxGeometry(0.012, 0.05, 0.004), m); t.position.set(sx * 0.012, -0.028, 0.002); t.rotation.z = sx * 0.3; g.add(t); }
  g.scale.setScalar(s); return g;
}
function frontAt(idol, y, extra = 0.01) { const s = idol.section(y, 0.015); return new THREE.Vector3(0, y, s.cz + s.rz + extra); }

// ---------------- item builder ----------------
class Item {
  constructor(idol) { this.idol = idol; this.objs = []; this.covers = null; this.heel = null; }
  add(o) { this.objs.push(o); return o; }
  dispose() { for (const o of this.objs) { o.parent && o.parent.remove(o); o.traverse(x => { if (x.geometry) x.geometry.dispose(); }); } }
}
function mats(main, hem) { return hem ? [main, hem] : [main]; }

const CAT = {};
// ===== defaults (practice wear) =====
CAT.def_top = (I, r) => { const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.03, sleeve: 0.45 }), off: 0.007, rim: 0.012 }); I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.knit('#f3f1ee'), shade: '#c9c4d6' }), toon({ color: '#e6e2ea' })))); };
CAT.def_bottom = (I, r) => { const s = shell(I.idol, { sel: r.bottom({ waist: r.W.natural, len: 0.3 }), off: 0.006, rim: 0.01 }); I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.knit('#5f5c6c'), shade: '#3e3b4c' }), toon({ color: '#ffffff' })))); };
CAT.def_shoes = (I, r) => { const s = shell(I.idol, { sel: r.shoe({ from: 1.92 }), off: 0.008, rim: 0.008 }); I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ color: '#f6f6f6', shade: '#c8cad8' }), toon({ color: '#9fa6c8' })))); soleAndHeel(I.idol, I, { color: '#ffffff', soleThick: 0.016 }); };

// ===== 午夜鋒芒 Midnight Edge (cool) =====
CAT.mid_top_a = (I, r) => { // 星夜鉚釘皮衣 – studded leather biker jacket, stand collar, long sleeves
  const base = T.leather('#191b26', '#7d86b0');
  const d = design('midtopa', base, (g, w, h) => { g.strokeStyle = '#c8cee0'; g.lineWidth = 4; g.beginPath(); g.moveTo(w * .5, h); g.lineTo(w * .5, 0); g.stroke(); g.fillStyle = '#d9deec'; for (let y = 8; y < h; y += 26) { g.beginPath(); g.arc(w * .5 - 30, y, 4, 0, TAU); g.fill(); g.beginPath(); g.arc(w * .5 + 30, y, 4, 0, TAU); g.fill(); } for (let x = 0; x < w; x += 22) { g.beginPath(); g.arc(x, h - 10, 4, 0, TAU); g.fill(); g.beginPath(); g.arc(x, 14, 3.5, 0, TAU); g.fill(); } });
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.035, sleeve: 1.97, neck: 'high' }), off: (v) => 0.013 + (I.idol.body.part[v] === 'head' ? 0.008 : 0), rim: 0.014 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#2a2d44', rim: '#7d8fd8', rimPow: 2.5 }), toon({ map: T.leather('#0e0f16'), shade: '#05060a' }))));
};
CAT.mid_bot_a = (I, r) => { // 鎖鏈皮革短褲 – leather shorts + hip chain
  const s = shell(I.idol, { sel: r.bottom({ waist: r.W.natural + 0.01, len: 0.22 }), off: 0.007, rim: 0.012 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.leather('#14151e', '#6a7090'), shade: '#20223a', rim: '#6f7fc8' }), toon({ color: '#0b0b12' }))));
  const L = I.idol.L; const sec = I.idol.section(r.W.low + 0.02); const m = toon({ color: '#cfd5e6', rim: '#ffffff', outline: .0005 });
  const g = new THREE.Group(); for (let i = 0; i < 22; i++) { const a = -0.9 + i * 0.075; const ring = outlined(new THREE.TorusGeometry(0.007, 0.0016, 5, 10), m); ring.position.set(Math.sin(a) * (sec.rx + 0.03), -Math.cos((i - 11) / 11 * 1.4) * 0.05 + 0.05 - 0.07, Math.cos(a) * (sec.rz + 0.03) + sec.cz - L.hips.z); ring.rotation.set(i % 2 ? Math.PI / 2 : 0, a, 0); g.add(ring); }
  I.add(I.idol.attachRigid('hips', g, L.hips.clone().setY(r.W.low + 0.02)));
};
CAT.mid_shoe_a = (I, r) => { // 綁帶高跟長靴 – lace-up knee boots with stiletto heel
  const base = T.leather('#0f1018', '#6a7090');
  const d = design('midshoea', base, (g, w, h) => { g.strokeStyle = '#d0d6ea'; g.lineWidth = 3; for (let y = 20; y < h - 40; y += 28) { g.beginPath(); g.moveTo(w * .5 - 18, y); g.lineTo(w * .5 + 18, y + 22); g.moveTo(w * .5 + 18, y); g.lineTo(w * .5 - 18, y + 22); g.stroke(); } });
  const s = shell(I.idol, { sel: r.shoe({ from: 0.92 }), off: (v) => 0.009 + Math.max(0, 1.2 - I.idol.body.t[v]) * 0.01, rim: 0.012 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#1b1d2e', rim: '#6f7fc8' }), toon({ color: '#2a2c3c' }))));
  soleAndHeel(I.idol, I, { angle: 0.42, color: '#0a0a10', heelColor: '#1a1a24' });
};
CAT.mid_acc_a = (I, r) => { // 銀環耳環與星墜頸鍊
  hoopEarrings(I.idol, I, { color: '#dfe4f0', r: 0.013 });
  const m = toon({ color: '#e8ecf8', rim: '#fff', emissive: '#b8c8ff', emissiveIntensity: .3, outline: .0005 });
  I.add(neckRing(I.idol, { color: '#d0d6e8', tube: 0.0018, extra: 0.006, drape: 0.18, pendant: starMesh(0.014, m) }));
};
CAT.mid_top_b = (I, r) => { // 閃電街頭連帽衫 – oversized hoodie with hood, drawstrings, lightning print
  const base = T.knit('#2b3046', 'rgba(0,0,0,.12)');
  const d = design('midtopb', base, (g, w, h) => { g.fillStyle = '#3ad4f0'; g.shadowColor = '#3ad4f0'; g.shadowBlur = 10; g.beginPath(); const cx = w * .5, cy = h * .55; g.moveTo(cx + 10, cy - 70); g.lineTo(cx - 28, cy + 6); g.lineTo(cx - 2, cy + 6); g.lineTo(cx - 14, cy + 70); g.lineTo(cx + 28, cy - 12); g.lineTo(cx + 2, cy - 12); g.closePath(); g.fill(); g.shadowBlur = 0; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(w * .5 - 70, h * .78, 140, h * .17); });
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.hip - 0.02, sleeve: 1.95 }), off: (v) => { const B = I.idol.body; return 0.016 + (B.part[v] === 'torso' ? Math.max(0, (I.idol.L.spine.y - B.pos[v * 3 + 1])) * 0.08 : 0.006); }, rim: 0.02 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#1a1d30', rim: '#5a6aa8' }), toon({ map: T.knit('#232739', 'rgba(0,0,0,.25)') }))));
  const L = I.idol.L; const hood = new THREE.Group(); const hm = toon({ map: T.knit('#2b3046'), shade: '#1a1d30', outline: .001 });
  const hg = new THREE.SphereGeometry(0.1, 20, 12, 0, TAU, 0, Math.PI * 0.55); hg.scale(1.15, 0.55, 0.9); const h1 = outlined(hg, hm); h1.rotation.x = -2.1; hood.add(h1);
  I.add(I.idol.attachRigid('upperChest', hood, new THREE.Vector3(0, L.neck.y - 0.005, L.neck.z - 0.07)));
  const sm = toon({ color: '#e8ecf6', outline: .0004 }); for (const sx of [1, -1]) { const c = outlined(new THREE.CylinderGeometry(0.0025, 0.0025, 0.12, 5), sm); const g = new THREE.Group(); c.position.y = -0.06; g.add(c); const tip = outlined(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), toon({ color: '#3ad4f0' })); tip.position.y = -0.125; g.add(tip); I.add(I.idol.attachRigid('upperChest', g, frontAt(I.idol, L.neck.y - 0.03, 0.02).setX(sx * 0.03))); }
};
CAT.mid_bot_b = (I, r) => { // 夜紗百褶短裙 – pleated mini + tulle overlay
  const top = r.W.natural; const m = toon({ map: T.pleats('#262a40', 24), shade: '#14162a', rim: '#5a6aa8' });
  I.add(skinned(I.idol, skirt(I.idol, { top, len: 0.27, flare: 0.1, pleats: 24, pleatAmp: 0.12 }), [m]));
  I.add(skinned(I.idol, skirt(I.idol, { top: top - 0.01, len: 0.3, flare: 0.14, extra: 0.02, wave: 0.01 }), [toon({ color: '#7a86c8', transparent: true, opacity: 0.35, shade: '#3a4278' })], false));
  I.add(skinned(I.idol, skirt(I.idol, { top: top + 0.012, len: 0.025, flare: 0, extra: 0.016, rows: 1 }), [toon({ color: '#101222' })]));
};
CAT.mid_shoe_b = (I, r) => { // 厚底扣環短靴 – platform buckle ankle boots
  const d = design('midshoeb', T.leather('#121320', '#6a7090'), (g, w, h) => { for (const y of [h * .35, h * .6]) { g.fillStyle = '#05050a'; g.fillRect(0, y, w, 26); g.fillStyle = '#d8dcea'; g.fillRect(w * .62, y - 3, 22, 32); g.fillStyle = '#05050a'; g.fillRect(w * .62 + 5, y + 4, 12, 18); } });
  const s = shell(I.idol, { sel: r.shoe({ from: 1.55 }), off: 0.012, rim: 0.012 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#1b1d2e', rim: '#6f7fc8' }), toon({ color: '#2a2c3c' }))));
  soleAndHeel(I.idol, I, { angle: 0.12, platform: 0.045, color: '#0a0a12', heelColor: '#0a0a12', block: true, soleThick: 0.012 });
};
CAT.mid_acc_b = (I, r) => { // 黑蕾絲露指手套
  const s = shell(I.idol, { sel: r.glove({ from: 1.55 }), off: 0.0035, rim: 0.008 });
  I.add(skinned(I.idol, s.geo, mats(toon({ map: T.lace('#0c0c14'), alphaTest: 0.5, shade: '#000' }), toon({ color: '#0c0c14' })), false));
};

// ===== 玫瑰絲絨 Rouge Velvet (elegant) =====
CAT.ros_top_a = (I, r) => { // 薔薇絲絨露肩上衣 – off-shoulder velvet with ruffle band sleeves
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.03, sleeve: 0.62, neck: 'off' }), off: (v) => 0.008 + (I.idol.body.part[v] === 'arm' ? 0.012 : 0), rim: 0.022, rimOff: 0.01 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.velvet('#6e1030', '#ff6b9a'), shade: '#3a0618', rim: '#ff7aa8', rimPow: 2 }), toon({ map: T.velvet('#8b1e3f', '#ffb0c8'), shade: '#4a0a20' }))));
  const L = I.idol.L; const rose = new THREE.Group(); const rm = toon({ color: '#b0123c', rim: '#ff9ab8', outline: .0006 });
  for (let k = 0; k < 5; k++) { const p = outlined(new THREE.SphereGeometry(0.016 - k * 0.0022, 10, 8, 0, Math.PI * 1.4), rm); p.rotation.set(0.4, k * 1.3, 0.3); rose.add(p); }
  I.add(I.idol.attachRigid('upperChest', rose, frontAt(I.idol, r.chestY + 0.02, 0.012).setX(0.05)));
};
CAT.ros_bot_a = (I, r) => { // 酒紅開衩緞面長裙 – satin maxi with front slit
  const top = r.W.natural + 0.01; const len = top - 0.06;
  const m = toon({ map: T.satin('#7a1232', '#ff9ab8'), shade: '#3e0718', rim: '#ff8fb5', rimPow: 2.2 });
  I.add(skinned(I.idol, skirt(I.idol, { top, len, flare: 0.13, rows: 22, slit: { at: 0.07, w: 0.03, from: 0.5 }, legW: 0.8, extra: 0.01 }), [m]));
  I.add(skinned(I.idol, skirt(I.idol, { top: top + 0.01, len: 0.03, flare: 0, extra: 0.015, rows: 1 }), [toon({ color: '#c9a06a', rim: '#fff3c0' })]));
};
CAT.ros_shoe_a = (I, r) => { // 黑漆細帶高跟鞋 – patent strappy stilettos with ankle strap
  const s = shell(I.idol, { sel: (i) => r.shoe({ from: 2.0 })(i) && !(r.y(i) > 0.045 && r.part(i) === 'foot' && r.z(i) > I.idol.L.leftFoot.z + 0.01), off: 0.005, rim: 0.004 });
  I.covers = null; I.add(skinned(I.idol, s.geo, mats(toon({ color: '#0d0b10', shade: '#000', rim: '#c8b8ff', rimPow: 1.6 }), toon({ color: '#20141c' }))));
  soleAndHeel(I.idol, I, { angle: 0.55, color: '#0b080c', heelColor: '#0b080c' });
  for (const s of [1, -1]) { const bn = s > 0 ? 'left' : 'right'; const ank = I.idol.L[bn + 'Foot']; const g = outlined(new THREE.TorusGeometry(0.036, 0.0035, 6, 24), toon({ color: '#0d0b10', rim: '#c8b8ff' })); g.rotation.x = Math.PI / 2; I.add(I.idol.attachRigid(bn + 'LowerLeg', g, new THREE.Vector3(ank.x, ank.y + 0.02, ank.z - 0.005))); }
};
CAT.ros_acc_a = (I, r) => { // 珍珠項鍊與珍珠耳環
  hoopEarrings(I.idol, I, { color: '#fff6ea', shape: 'pearl' });
  I.add(neckRing(I.idol, { color: '#fff4e6', beads: 34, beadR: 0.0052, extra: 0.008, drape: 0.25 }));
};
CAT.ros_top_b = (I, r) => { // 粉緞綁帶喇叭袖上衣 – satin lace-up blouse with bell sleeves
  const d = design('rostopb', T.satin('#e7a6b6', '#ffffff'), (g, w, h) => { g.strokeStyle = '#8b1e3f'; g.lineWidth = 4; for (let y = 30; y < h * .9; y += 34) { g.beginPath(); g.moveTo(w * .5 - 16, y); g.lineTo(w * .5 + 16, y + 26); g.moveTo(w * .5 + 16, y); g.lineTo(w * .5 - 16, y + 26); g.stroke(); } });
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.03, sleeve: 1.97, neck: 'scoop' }), off: (v) => { const B = I.idol.body; const t = B.t[v]; return 0.008 + ((B.part[v] === 'arm' || B.part[v] === 'hand') && t > 1.15 ? (t - 1.15) * 0.07 : 0); }, rim: 0.018 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#b06a80', rim: '#ffffff' }), toon({ color: '#f6d2dc' }))));
  const b = bow('#8b1e3f', 0.8); I.add(I.idol.attachRigid('upperChest', b, frontAt(I.idol, r.chestY + 0.035, 0.012)));
};
CAT.ros_bot_b = (I, r) => { // 香檳玫瑰蕾絲蛋糕裙 – tiered champagne cake skirt with lace hems
  const m = (c) => toon({ map: T.satin(c, '#fff6e0'), shade: '#a98458', rim: '#fff3d0' });
  tiered(I, r.W.natural, [{ dy: 0, len: 0.17, flare: 0.05, mat: m('#e9cfae') }, { dy: 0.14, len: 0.17, flare: 0.07, mat: m('#e3c39e') }, { dy: 0.28, len: 0.17, flare: 0.08, mat: m('#dcb892') }], toon({ map: T.lace('#fff8ee'), alphaTest: .5, shade: '#d8c8b0' }));
  I.add(skinned(I.idol, skirt(I.idol, { top: r.W.natural + 0.012, len: 0.026, flare: 0, extra: 0.016, rows: 1 }), [toon({ color: '#8b1e3f' })]));
};
CAT.ros_shoe_b = (I, r) => { // 玫瑰金蝴蝶結高跟鞋 – rose-gold pumps with bow
  const s = shell(I.idol, { sel: r.shoe({ from: 2.0 }), off: 0.006, rim: 0.005 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.satin('#d9a08a', '#fff0e0'), shade: '#a06a58', rim: '#ffe0c8', rimPow: 1.6 }), toon({ color: '#f0c4b0' }))));
  soleAndHeel(I.idol, I, { angle: 0.5, color: '#b97a66', heelColor: '#e0b090' });
  for (const s of [1, -1]) { const bn = s > 0 ? 'left' : 'right'; const f = I.idol.foot[s > 0 ? 'L' : 'R']; const b = bow('#e7b49c', 0.35); I.add(I.idol.attachRigid(bn + 'Toes', b, new THREE.Vector3((f.min.x + f.max.x) / 2, f.max.y - 0.01, f.max.z - 0.035))); }
};
CAT.ros_acc_b = (I, r) => { // 玫瑰金串珠手拿包 – beaded clutch held in the right hand
  const L = I.idol.L; const g = new THREE.Group(); const m = toon({ map: T.dots('#d9a08a', '#fff0d8', 24, 3), shade: '#a06a58', rim: '#fff', outline: .0007 });
  const box = outlined(new THREE.BoxGeometry(0.03, 0.08, 0.14), m); g.add(box);
  const clasp = outlined(new THREE.SphereGeometry(0.008, 8, 6), toon({ color: '#ffe0b0', rim: '#fff' })); clasp.position.set(0.016, 0.03, 0); g.add(clasp);
  I.add(I.idol.attachRigid('rightHand', g, L.rightHand.clone().add(new THREE.Vector3(-0.06, -0.035, 0.03))));
  hoopEarrings(I.idol, I, { color: '#f0c0a8', shape: 'crystal' });
};

// ===== 糖霜緞帶 Sugar Ribbon (cute → elegant pastel) =====
CAT.sug_top_a = (I, r) => { // 甜心寶石蓬袖舞台衣 – stage bodice, big puff sleeves, gem brooch
  const d = design('sugtopa', T.satin('#f4ece8', '#ffffff'), (g, w, h) => { g.fillStyle = '#c9a4b0'; for (let i = 0; i < 9; i++) g.fillRect(w * .5 - 160 + i * 40, 0, 3, h); g.fillStyle = '#b87a8f'; g.fillRect(0, 0, w, 20); });
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.03, sleeve: 0.75, neck: 'scoop' }), off: (v) => { const B = I.idol.body; const t = B.t[v]; return 0.008 + (B.part[v] === 'arm' && t > 0 ? Math.sin(Math.PI * Math.min(1, t / 0.75)) * 0.045 : 0); }, rim: 0.016, rimOff: 0.006 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#c8aeb8', rim: '#ffffff' }), toon({ map: T.lace('#ffffff'), alphaTest: .5 }))));
  const gem = outlined(new THREE.OctahedronGeometry(0.022), toon({ color: '#ff8fb8', emissive: '#ff5f9e', emissiveIntensity: .35, rim: '#fff' })); gem.scale.set(1, 1.2, .6);
  const g = new THREE.Group(); g.add(gem); g.add(bow('#b87a8f', 0.7)); gem.position.z = 0.01;
  I.add(I.idol.attachRigid('upperChest', g, frontAt(I.idol, r.chestY + 0.03, 0.016)));
};
CAT.sug_bot_a = (I, r) => { // 緞帶三層蛋糕裙 – 3-tier ribbon cake skirt (short)
  const top = r.W.natural; const m = (c) => toon({ map: T.satin(c, '#ffffff'), shade: '#b8909e', rim: '#fff' });
  tiered(I, top, [{ dy: 0, len: 0.11, flare: 0.07, mat: m('#f4ece8'), pleats: 30, pleatAmp: 0.05 }, { dy: 0.08, len: 0.11, flare: 0.08, mat: m('#e8c8d2'), pleats: 30, pleatAmp: 0.05 }, { dy: 0.16, len: 0.1, flare: 0.08, mat: m('#c9a4b0'), pleats: 30, pleatAmp: 0.05 }], toon({ map: T.lace('#ffffff'), alphaTest: .5 }));
  const b = bow('#8a3d55', 0.9); I.add(I.idol.attachRigid('hips', b, frontAt(I.idol, top - 0.005, 0.03).setX(0.07)));
};
CAT.sug_shoe_a = (I, r) => { // 芭蕾綁帶高跟鞋 – ballet-ribbon heels (ribbons wrap up the shin)
  const d = design('sugshoea', T.satin('#f0c8d4', '#ffffff'), (g, w, h) => {});
  const s = shell(I.idol, { sel: r.shoe({ from: 2.0 }), off: 0.006, rim: 0.004 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#c890a0', rim: '#fff' }), toon({ color: '#ffffff' }))));
  const rib = tex('ribwrap', 256, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#f2b8c8'; g.lineWidth = 16; for (let y = -h; y < h * 2; y += 110) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 140); g.stroke(); g.beginPath(); g.moveTo(w, y); g.lineTo(0, y + 140); g.stroke(); } });
  const s2 = shell(I.idol, { sel: (i) => r.part(i) === 'leg' && r.t(i) > 1.45 && r.t(i) < 2.02, off: 0.004 });
  I.add(skinned(I.idol, s2.geo, [toon({ map: rib, alphaTest: .5, shade: '#c890a0' })], false));
  soleAndHeel(I.idol, I, { angle: 0.48, color: '#e8b0c0', heelColor: '#f4d4dc' });
};
CAT.sug_acc_a = (I, r) => { // 珍珠緞帶頸圈與手環
  const pearl = outlined(new THREE.SphereGeometry(0.009, 12, 8), toon({ color: '#fff8f0', rim: '#fff' }));
  I.add(neckRing(I.idol, { color: '#b87a8f', tube: 0.0065, y: 0.03, extra: 0.002, pendant: pearl }));
  wristBand(I.idol, I, 1, { color: '#fff4ea', beads: 16 }); wristBand(I.idol, I, -1, { color: '#fff4ea', beads: 16 });
};
CAT.sug_top_b = (I, r) => { // 蝴蝶結蕾絲襯衫 – lace blouse, long puffed sleeves, big collar bow
  const d = design('sugtopb', T.satin('#fbf6f2', '#ffffff'), (g, w, h) => { g.fillStyle = 'rgba(200,170,180,.35)'; for (let y = 0; y < h; y += 50) for (let x = 0; x < w; x += 50) { g.beginPath(); g.arc(x + (y / 50 % 2) * 25, y, 6, 0, TAU); g.fill(); } });
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.03, sleeve: 1.95, neck: 'high' }), off: (v) => { const B = I.idol.body; const t = B.t[v]; return 0.008 + (B.part[v] === 'arm' ? Math.sin(Math.PI * Math.min(1, Math.max(0, t) / 1.9)) * 0.016 : 0); }, rim: 0.016 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#cfc0c8', rim: '#fff' }), toon({ map: T.lace('#ffffff'), alphaTest: .5 }))));
  I.add(I.idol.attachRigid('upperChest', bow('#c9a4b0', 1.25), frontAt(I.idol, I.idol.L.neck.y - 0.03, 0.02)));
};
CAT.sug_bot_b = (I, r) => { // 愛心刺繡A字裙 – A-line skirt with heart embroidery
  const top = r.W.natural + 0.005;
  I.add(skinned(I.idol, skirt(I.idol, { top, len: 0.36, flare: 0.13, rows: 14 }), [toon({ map: T.hearts('#c9a4b0', '#f4ece8'), shade: '#9a7080', rim: '#fff' })]));
  I.add(skinned(I.idol, skirt(I.idol, { top: top + 0.01, len: 0.028, flare: 0, extra: 0.016, rows: 1 }), [toon({ color: '#8a3d55' })]));
};
CAT.sug_shoe_b = (I, r) => { // 珍珠扣瑪莉珍鞋 – mary janes with pearl buckle strap
  const s = shell(I.idol, { sel: (i) => r.shoe({ from: 2.0 })(i) && !(r.part(i) === 'leg'), off: 0.007, rim: 0.005 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ color: '#f4e4ea', shade: '#c8a8b4', rim: '#fff' }), toon({ color: '#8a3d55' }))));
  soleAndHeel(I.idol, I, { angle: 0.15, color: '#8a3d55', block: true, soleThick: 0.01 });
  for (const sd of [1, -1]) { const bn = sd > 0 ? 'left' : 'right'; const f = I.idol.foot[sd > 0 ? 'L' : 'R']; const g = new THREE.Group(); const strap = outlined(new THREE.TorusGeometry(0.038, 0.004, 6, 20, Math.PI), toon({ color: '#8a3d55' })); strap.rotation.y = Math.PI / 2; g.add(strap); const p = outlined(new THREE.SphereGeometry(0.006, 10, 8), toon({ color: '#fff8f0', rim: '#fff' })); p.position.set(sd * 0.035, 0.012, 0); g.add(p); I.add(I.idol.attachRigid(bn + 'Foot', g, new THREE.Vector3((f.min.x + f.max.x) / 2, f.min.y + 0.005, I.idol.L[bn + 'Foot'].z + 0.03))); }
};
CAT.sug_acc_b = (I, r) => { // 愛心鍊包與水晶耳環
  const g = new THREE.Group(); const sh = new THREE.Shape(); const s = 0.05; sh.moveTo(0, -s * .9); sh.bezierCurveTo(-s * 1.6, s * .2, -s * .6, s * 1.3, 0, s * .35); sh.bezierCurveTo(s * .6, s * 1.3, s * 1.6, s * .2, 0, -s * .9);
  const hm = outlined(new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2 }), toon({ color: '#d47a96', rim: '#ffd0e0', emissive: '#ff6f9e', emissiveIntensity: .1, outline: .0008 }));
  hm.rotation.y = Math.PI / 2; hm.scale.setScalar(0.85); g.add(hm);
  crossbody(I.idol, I, { strapColor: '#e8e0d8', bag: g });
  hoopEarrings(I.idol, I, { color: '#e8f4ff', shape: 'crystal' });
};

// ===== 彩虹汽水 Rainbow Soda (pop) =====
CAT.pop_top_a = (I, r) => { // 檸檬條紋蝴蝶結背心 – lemon-stripe sleeveless top with bow
  const s = shell(I.idol, { sel: r.top({ bottom: r.W.natural - 0.02, sleeve: -0.35, neck: 'scoop' }), off: 0.008, rim: 0.012 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.stripes('#fff4c8', '#f2c94a', 30), shade: '#d4b06a', rim: '#fff' }), toon({ color: '#2a7a86' }))));
  I.add(I.idol.attachRigid('upperChest', bow('#2a9aa8', 1.0), frontAt(I.idol, r.chestY + 0.02, 0.014)));
};
CAT.pop_bot_a = (I, r) => { // 彩虹襯裙百褶短裙 – pleated mini with rainbow petticoat
  const top = r.W.natural;
  I.add(skinned(I.idol, skirt(I.idol, { top: top - 0.02, len: 0.27, flare: 0.17, extra: 0.02, wave: 0.008 }), [toon({ map: T.rainbowV(), shade: '#b0a0c0' })]));
  I.add(skinned(I.idol, skirt(I.idol, { top, len: 0.24, flare: 0.1, pleats: 22, pleatAmp: 0.12 }), [toon({ map: T.pleats('#2a7a86', 22), shade: '#174a52', rim: '#bff' })]));
  I.add(skinned(I.idol, skirt(I.idol, { top: top + 0.012, len: 0.026, flare: 0, extra: 0.016, rows: 1 }), [toon({ color: '#f2c94a' })]));
};
CAT.pop_shoe_a = (I, r) => { // 彩虹鞋帶厚底球鞋 – chunky platform sneakers, rainbow laces
  const d = design('popshoea', T.plain('#ffffff'), (g, w, h) => { const cs = ['#ff5f7a', '#ffa34a', '#ffe14a', '#6fe08a', '#5fc2ff', '#a57bff']; for (let i = 0; i < 6; i++) { g.strokeStyle = cs[i]; g.lineWidth = 7; g.beginPath(); g.moveTo(w * .5 - 24, h * .25 + i * 30); g.lineTo(w * .5 + 24, h * .25 + i * 30 + 10); g.stroke(); } g.fillStyle = '#2a7a86'; g.fillRect(0, h * .85, w, h * .15); });
  const s = shell(I.idol, { sel: r.shoe({ from: 1.85 }), off: 0.013, rim: 0.012 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: d, shade: '#c0c8d8', rim: '#fff' }), toon({ color: '#f2c94a' }))));
  soleAndHeel(I.idol, I, { platform: 0.035, color: '#ffffff', soleThick: 0.012 });
};
CAT.pop_acc_a = (I, r) => { // 汽水瓶斜背包 – soda-bottle crossbody bag
  const g = new THREE.Group(); const glass = toon({ color: '#7fe0e8', rim: '#ffffff', emissive: '#3fc8d8', emissiveIntensity: .2, outline: .0008 });
  const body = outlined(new THREE.CylinderGeometry(0.032, 0.032, 0.1, 16), glass); g.add(body);
  const neck = outlined(new THREE.CylinderGeometry(0.012, 0.03, 0.04, 16), glass); neck.position.y = 0.07; g.add(neck);
  const cap = outlined(new THREE.CylinderGeometry(0.014, 0.014, 0.014, 12), toon({ color: '#d46a42' })); cap.position.y = 0.095; g.add(cap);
  const label = outlined(new THREE.CylinderGeometry(0.0335, 0.0335, 0.04, 16, 1, true), toon({ map: T.stripes('#ffffff', '#d46a42', 12, true) })); g.add(label);
  g.rotation.z = 0.25; crossbody(I.idol, I, { strapColor: '#d46a42', bag: g });
};
CAT.pop_top_b = (I, r) => { // 幻彩雷射短外套 – cropped holographic jacket over a crop top
  const s = shell(I.idol, { sel: r.top({ bottom: r.chestY - 0.07, sleeve: 1.95, neck: 'high' }), off: (v) => 0.014 + (I.idol.body.part[v] === 'head' ? 0.008 : 0), rim: 0.014 });
  I.covers = s.covers; I.add(skinned(I.idol, s.geo, mats(toon({ map: T.holo(), shade: '#a8b8e8', rim: '#ffffff', rimPow: 1.8, emissive: '#ffffff', emissiveIntensity: .08 }), toon({ color: '#f3e6c8' }))));
  const s2 = shell(I.idol, { sel: r.top({ bottom: r.W.natural + 0.02, sleeve: -0.3, neck: 'scoop' }), off: 0.007, rim: 0.008 });
  I.add(skinned(I.idol, s2.geo, mats(toon({ map: T.knit('#1e2a38'), shade: '#0e1620' }), toon({ color: '#c4923a' }))));
};
CAT.pop_bot_b = (I, r) => { // 彩虹漸層亮片裙 – rainbow-gradient sequin mini
  const top = r.W.natural + 0.005;
  I.add(skinned(I.idol, skirt(I.idol, { top, len: 0.25, flare: 0.08, rows: 10 }), [toon({ map: T.sequin(['#a57bff', '#5fc2ff', '#6fe08a', '#ffe14a', '#ffa34a', '#ff5f7a']), shade: '#8080a0', rim: '#ffffff', rimPow: 1.5, emissive: '#ffffff', emissiveIntensity: .06 })]));
};
CAT.pop_shoe_b = (I, r) => { // 幻彩厚底涼跟鞋 – iridescent platform sandals
  const strap = tex('sandal', 512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ff9ad0'); gr.addColorStop(.5, '#9ad8ff'); gr.addColorStop(1, '#ffe58a'); g.fillStyle = gr; for (const y of [.2, .45, .7]) g.fillRect(0, h * y, w, h * .1); g.fillRect(0, h * .9, w, h * .1); });
  const s = shell(I.idol, { sel: r.shoe({ from: 1.95 }), off: 0.005 });
  I.add(skinned(I.idol, s.geo, [toon({ map: strap, alphaTest: .5, shade: '#a0a0c8', rim: '#fff' })], false));
  soleAndHeel(I.idol, I, { angle: 0.3, platform: 0.04, color: '#e8e0ff', heelColor: '#c8d8ff', block: true, soleThick: 0.012 });
};
CAT.pop_acc_b = (I, r) => { // 星星耳環與彩色手環
  hoopEarrings(I.idol, I, { color: '#ffd84a', shape: 'star' });
  const cs = ['#ff5f7a', '#ffe14a', '#5fc2ff', '#6fe08a']; wristBand(I.idol, I, 1, { color: cs, n: 3, tube: 0.0045 }); wristBand(I.idol, I, -1, { color: cs.slice().reverse(), n: 3, tube: 0.0045 });
};

export const ITEM_IDS = Object.keys(CAT);
export function buildItem(idol, id) {
  const f = CAT[id]; if (!f) { console.warn('no 3D item', id); return null; }
  const it = new Item(idol); try { f(it, R(idol)); } catch (e) { console.error('item build failed', id, e); }
  return it;
}
