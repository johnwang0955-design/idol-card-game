// SpriteIdol: the approved illustrated layered idol as a 2D-skinned "paper puppet" billboard.
// Every layer (back hair, body, garments, head, earrings) is its own SkinnedMesh bound to ONE shared 2D skeleton,
// so any free mix-and-match outfit follows every dance pose automatically.
import { THREE, glowTex, blobTex } from '../js3d/core.js?v=25d-20261010a';
import RW from './rigweights.js?v=25d-20261010a';

const A = window.ASSETS; const P = 'assets/'; const QV = '?v=25d-20261010a';
const LY = Object.fromEntries(A.layers.map(l => [l.id, l]));
const PW = 400, PH = 720;             // layer canvas (px)
export const HEIGHT = 1.72;           // world height of the 720px canvas
const S = HEIGHT / PH;
const wx = (px) => (px - PW / 2) * S, wy = (py) => (PH - py) * S;

// ---- skeleton (pixel coords of the shared base pose) ----
// parent, joint (pivot) px, segment end px, influence radius px
export const BONES = [
  { n: 'root',   p: -1, j: [160, 700], e: [160, 700], r: 0 },
  { n: 'hips',   p: 0,  j: [160, 300], e: [160, 700], r: 70 },
  { n: 'chest',  p: 1,  j: [160, 262], e: [160, 150], r: 52 },
  { n: 'head',   p: 2,  j: [160, 128], e: [160, 30],  r: 60 },
  { n: 'lUp',    p: 2,  j: [114, 158], e: [104, 286], r: 13 },
  { n: 'lLo',    p: 4,  j: [104, 286], e: [88, 345],  r: 12 },
  { n: 'lHand',  p: 5,  j: [88, 345],  e: [85, 388],  r: 16 },
  { n: 'rUp',    p: 2,  j: [206, 162], e: [243, 252], r: 13 },
  { n: 'rLo',    p: 7,  j: [243, 252], e: [287, 322], r: 12 },
  { n: 'rHand',  p: 8,  j: [287, 322], e: [328, 348], r: 16 },
  { n: 'hair',   p: 3,  j: [160, 170], e: [160, 330], r: 90 },   // back-hair sway (secondary motion)
  { n: 'feet',   p: 0,  j: [160, 700], e: [160, 700], r: 0 },    // shins+feet stay planted; hips dip/sway bends the knees
];
const BI = Object.fromEntries(BONES.map((b, i) => [b.n, i]));
const ARM = new Set([BI.lUp, BI.lLo, BI.lHand, BI.rUp, BI.rLo, BI.rHand]);
// which bones each kind of layer may follow
const PROFILE = {
  all: ['hips', 'chest', 'head', 'lUp', 'lLo', 'lHand', 'rUp', 'rLo', 'rHand'],
  body: ['hips', 'chest', 'lUp', 'lLo', 'lHand', 'rUp', 'rLo', 'rHand'],
  torso: ['hips', 'chest'], hips: ['hips'], head: ['head', 'chest'], backhair: ['head', 'chest', 'hair'],
};
const ACC_PROFILE = { mid_acc_a: 'head', ros_acc_a: 'head', sug_acc_b: 'torso', pop_acc_a: 'torso' };
function profileOf(layerId, file) {
  const l = LY[layerId];
  if (!l) return 'all';
  if (l.slot === 'backhair') return 'backhair';
  if (l.slot === 'head') return 'head';
  if (l.slot === 'base') return l.id === 'base_body' ? 'all' : 'hips';
  if (l.slot === 'top') return /_upper/.test(file) ? 'head' : 'body';
  if (l.slot === 'bottom' || l.slot === 'shoes') return 'hips';
  if (l.slot === 'acc') return /_upper/.test(file) ? 'head' : (ACC_PROFILE[l.id] || 'body');
  return 'all';
}
function segDist(px, py, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1;
  let t = ((px - a[0]) * vx + (py - a[1]) * vy) / L2; t = Math.max(0, Math.min(1, t));
  const dx = px - (a[0] + t * vx), dy = py - (a[1] + t * vy); return Math.sqrt(dx * dx + dy * dy);
}
const ARMED = new Set(['all', 'body']);   // profiles whose layers are split into body + arm meshes by the per-pixel ownership mask
const KNEE0 = 455, KNEE1 = 535;   // knee band: hips -> planted feet
function torsoW(px, py, prof) {
  if (py > KNEE0) { const f = Math.min(1, (py - KNEE0) / (KNEE1 - KNEE0)), e = f * f * (3 - 2 * f); return [[BI.feet, e], [BI.hips, 1 - e]]; }
  if (prof === 'hips') return [[BI.hips, 1], [BI.hips, 0]];
  const h = Math.min(1, Math.max(0, (py - 262) / 40)); return [[BI.hips, h], [BI.chest, 1 - h]];
}
function armW(px, py) { // precomputed arm-chain weights (python rig.py)
  const gx = Math.round(px / RW.cell), gy = Math.round(py / RW.cell), v = Math.min(RW.gy, gy) * (RW.gx + 1) + Math.min(RW.gx, gx);
  const w0 = RW.w0[v] / 255; return [[BI[RW.bones[RW.i0[v]]], w0], [BI[RW.bones[RW.i1[v]]], 1 - w0]];
}
function weightsAt(px, py, prof, part) {
  if (prof === 'head' || prof === 'backhair') return analyticW(px, py, prof);
  return part === 'arm' ? armW(px, py) : torsoW(px, py, prof);
}
function analyticW(px, py, prof) {
  const names = PROFILE[prof]; const out = [];
  for (const n of names) {
    let w;
    if (n === 'hair') w = py > 175 ? Math.min(1, (py - 175) / 120) * 1.4 : 0;
    else if (n === 'head') w = Math.exp(-Math.pow(Math.max(0, py - 128) / 26, 2)) * 3;
    else w = py > 128 ? 1 : 0.02;   // chest
    out.push([BI[n], w]);
  }
  out.sort((a, b) => b[1] - a[1]); const top = out.slice(0, 2); const s = top[0][1] + top[1][1] || 1;
  return top.map(([i, w]) => [i, w / s]);
}
const OWN = {}; const ownReady = Promise.all(['arm', 'rest'].map(k => new Promise(res => {
  const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'); c.width = PW / 4; c.height = PH / 4; const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data; const m = new Uint8Array(c.width * c.height); for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 1];
    const t = new THREE.Texture(img); t.needsUpdate = true; OWN[k] = { tex: t, m }; res();
  }; img.src = new URL('./own_' + k + '.png?v=25d-20261010a', import.meta.url).href; })));

// ---- texture + alpha cache ----
const loader = new THREE.TextureLoader(); const texCache = new Map();
function loadLayer(file) {
  if (!texCache.has(file)) texCache.set(file, new Promise((res) => {
    const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'); c.width = PW / 4; c.height = PH / 4; const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
      const a = g.getImageData(0, 0, c.width, c.height).data; const alpha = new Uint8Array(c.width * c.height); for (let i = 0; i < alpha.length; i++) alpha[i] = a[i * 4 + 3];
      const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
      res({ tex: t, alpha, aw: c.width, ah: c.height });
    }; img.src = P + file + QV;
  }));
  return texCache.get(file);
}
// ---- geometry: grid over the layer, only cells that contain pixels; split into "rest" and "arm" groups ----
const CELL = 6; const GX = Math.ceil(PW / CELL), GY = Math.ceil(PH / CELL);
const geoCache = new Map();
function buildGeo(file, prof, L) {
  const key = file + '|' + prof; if (geoCache.has(key)) return geoCache.get(key);
  const nv = (GX + 1) * (GY + 1); const parts = ARMED.has(prof) ? ['rest', 'arm'] : ['rest']; const r = {};
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) { const v = y * (GX + 1) + x, px = Math.min(PW, x * CELL), py = Math.min(PH, y * CELL);
    pos.set([wx(px), wy(py), 0], v * 3); uv.set([px / PW, 1 - py / PH], v * 2); }
  for (const part of parts) {
    const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4);
    for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) {
      const v = y * (GX + 1) + x, px = Math.min(PW, x * CELL), py = Math.min(PH, y * CELL);
      const w = weightsAt(px, py, prof, part); si[v * 4] = w[0][0]; sw[v * 4] = w[0][1]; si[v * 4 + 1] = w[1][0]; sw[v * 4 + 1] = w[1][1];
    }
    const ok = parts.length > 1 ? OWN[part] : null; const own = ok ? ok.m : null;
    const occ = (cx, cy) => {
      for (let yy = cy * CELL / 4 - 2; yy < (cy + 1) * CELL / 4 + 2; yy++) for (let xx = cx * CELL / 4 - 2; xx < (cx + 1) * CELL / 4 + 2; xx++) {
        const X = Math.floor(xx), Y = Math.floor(yy); if (X < 0 || Y < 0 || X >= L.aw || Y >= L.ah) continue; const i = Y * L.aw + X;
        if (L.alpha[i] > 2 && (!own || own[i] > 2)) return true; }
      return false; };
    const idx = [];
    for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) { if (!occ(x, y)) continue; const a = y * (GX + 1) + x, b = a + 1, c = a + GX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    if (!idx.length) continue;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); g.setIndex(idx); g.computeBoundingSphere();
    r[part] = { geo: g, mask: ok ? ok.tex : null };
  }
  geoCache.set(key, r); return r;
}

export class SpriteIdol {
  static async load(id, opts = {}) { const I = new SpriteIdol(id, opts); await I.ready; return I; }
  constructor(id, opts = {}) {
    this.id = id; this.isSprite = true; this.opts = opts; this.order = opts.order ?? 100;
    this.root = new THREE.Group();           // world placement (stage3d sets position / rotation)
    this.face = new THREE.Group(); this.root.add(this.face);   // yaw toward camera
    this.center = new THREE.Group(); this.center.position.x = (PW / 2 - 160) * S; this.face.add(this.center); // figure's centre line is x=160px
    this.body = new THREE.Group(); this.center.add(this.body);   // bounce / squash / sway (motion2d)
    this.spin = 1;  // runway flip: scale-x of `center`
    this.bones = BONES.map(b => { const o = new THREE.Bone(); o.name = b.n; return o; });
    BONES.forEach((b, i) => { const o = this.bones[i]; const [jx, jy] = b.j;
      if (b.p < 0) { o.position.set(wx(jx), wy(jy), 0); this.body.add(o); }
      else { const [px, py] = BONES[b.p].j; o.position.set((jx - px) * S, -(jy - py) * S, 0); this.bones[b.p].add(o); } });
    this.root.updateMatrixWorld(true); this.bindM = this.body.matrixWorld.clone();
    this.skeleton = new THREE.Skeleton(this.bones);
    this.meshes = new Map(); this.items = {}; this.ang = new Float32Array(BONES.length); this.dim = opts.dim || 0;
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.004, 0); this.root.add(blob);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    this.glow.scale.set(1.9, 2.4, 1); this.glow.position.set(0, 0.95, -0.05); this.glow.renderOrder = this.order - 1; this.face.add(this.glow);
    this.outfit = {}; this.ready = this.wearOutfit({});
  }
  layerFiles() {
    const items = ['shoes', 'bottom', 'top', 'acc'].map(s => this.outfit[s]).filter(Boolean);
    const hide = new Set(items.flatMap(i => LY[i].hides || []));
    const ls = [LY[this.id + '_backhair'], LY[this.id + '_head'], ...['base_body', 'base_shin', 'base_feet'].filter(b => !hide.has(b)).map(b => LY[b])].map(l => [l.z, l.file, l.id]);
    for (const i of items) { ls.push([LY[i].z, LY[i].file, i]); (LY[i].extra || []).forEach(e => ls.push([e.z, e.file, i])); }
    return ls.sort((a, b) => a[0] - b[0]);
  }
  async wear(slot, id) { this.outfit = { ...this.outfit, [slot]: id || null }; return this._sync(); }
  async wearOutfit(o) { this.outfit = { top: o.top || null, bottom: o.bottom || null, shoes: o.shoes || null, acc: o.acc || null }; return this._sync(); }
  async _sync() {
    const want = this.layerFiles(); const tok = (this._tok = (this._tok || 0) + 1);
    await ownReady; const loaded = await Promise.all(want.map(([, f]) => loadLayer(f))); if (tok !== this._tok) return;
    const keep = new Set();
    want.forEach(([z, f, lid], k) => {
      const key = f; keep.add(key); let m = this.meshes.get(key);
      if (!m) {
        const g = buildGeo(f, profileOf(lid, f), loaded[k]); m = [];
        for (const part of ['rest', 'arm']) { if (!g[part]) continue;
          const mat = new THREE.MeshBasicMaterial({ map: loaded[k].tex, alphaMap: g[part].mask, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide });
          this.mats = (this.mats || []).concat(mat);
          const sm = new THREE.SkinnedMesh(g[part].geo, mat); sm.frustumCulled = false; sm.bind(this.skeleton, this.bindM);
          sm.userData.part = part; this.body.add(sm); m.push(sm);
          if (z >= 60) { // face/front hair/hood/earrings: a second copy above the arms, faded OUT as an arm rises -> no hard pop behind the ponytail
            const tm = mat.clone(); this.mats.push(tm); const tw = new THREE.SkinnedMesh(g[part].geo, tm); tw.frustumCulled = false; tw.bind(this.skeleton, this.bindM);
            tw.userData.part = 'twin'; this.body.add(tw); m.push(tw); } }
        this.meshes.set(key, m);
      }
      // draw order: every "rest" piece in layer order, then all arm pieces (arms swing in front of the body)
      m.forEach(sm => { sm.userData.z = z; sm.userData.on = true; sm.visible = sm.userData.part !== 'twin'; });
    });
    for (const [key, m] of this.meshes) if (!keep.has(key)) m.forEach(sm => { sm.visible = false; sm.userData.on = false; });
    this._order(true); this._col();
  }
  // --- posing ---
  setPose(ang, legs) { for (let i = 0; i < BONES.length; i++) this.ang[i] = ang[BONES[i].n] || 0; this.legs = legs || { x: 0, y: 0 }; this._apply(); }
  _apply() {
    for (let i = 0; i < BONES.length; i++) this.bones[i].rotation.z = this.ang[i];
    // shoulder shrug: a raised arm lifts its shoulder pivot a little (less stretch at the armpit)
    const sh = (a) => { const d = Math.abs(a) * 180 / Math.PI; const f = Math.min(1, Math.max(0, (d - 40) / 100)); return f * f * (3 - 2 * f); };
    for (const [n, sx] of [['rUp', -1], ['lUp', 1]]) { const b = this.bones[BI[n]], j = BONES[BI[n]].j, pj = BONES[BONES[BI[n]].p].j, k = sh(this.ang[BI[n]]);
      b.position.set((j[0] - pj[0] + sx * 3 * k) * S, -(j[1] - pj[1] - 7 * k) * S, 0); }
    // hips dip / sway with planted feet (knee bend)
    const h = this.bones[BI.hips], hj = BONES[BI.hips].j, rj = BONES[0].j; const L = this.legs || { x: 0, y: 0 };
    h.position.set((hj[0] - rj[0] + L.x) * S, -(hj[1] - rj[1] + L.y) * S, 0);
    this._order();
  }
  // draw order: body pieces < face/front hair (copy 1) < arm pieces < face/front hair copy 2 (opacity 1-k, k = arm raise)
  _order(force) {
    const up = Math.max(Math.abs(this.ang[BI.rUp]), Math.abs(this.ang[BI.lUp])) * 180 / Math.PI;
    let k = Math.min(1, Math.max(0, (up - 28) / 34));
    // also when a hand is lifted to chest/face height (heart, hand-to-cheek): the hand belongs in front of the hair
    const rot = (v, a) => [v[0] * Math.cos(a) + v[1] * Math.sin(a), -v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    for (const [u, l] of [['rUp', 'rLo'], ['lUp', 'lLo']]) {
      const U = BONES[BI[u]], Lb = BONES[BI[l]], a1 = this.ang[BI[u]] + (this.ang[BI.chest] || 0), a2 = a1 + this.ang[BI[l]];
      const e = rot([U.e[0] - U.j[0], U.e[1] - U.j[1]], a1), w = rot([Lb.e[0] - Lb.j[0], Lb.e[1] - Lb.j[1]], a2);
      const wy = U.j[1] + e[1] + w[1]; k = Math.max(k, Math.min(1, Math.max(0, (262 - wy) / 50)));
    }
    k = k * k * (3 - 2 * k);
    if (force || this._k === undefined) {
      for (const m of this.meshes.values()) for (const sm of m) { const z = sm.userData.z || 0, p = sm.userData.part;
        sm.renderOrder = this.order + (p === 'twin' ? 0.8 : z >= 60 ? 0.3 : p === 'arm' ? 0.5 : 0) + z / 1000; }
    }
    if (!force && Math.abs(k - (this._k ?? -1)) < 0.004) return; this._k = k;
    for (const m of this.meshes.values()) for (const sm of m) if (sm.userData.part === 'twin') { sm.material.opacity = 1 - k; sm.visible = k < 0.99 && sm.userData.on !== false; }
  }
  setTint(r, g = r, b = r) { this.tint = [r, g, b]; this._col(); }
  setFlash(v) { this.flash = v; this._col(); }   // >0 brightens every layer (spin / swap flash)
  _col() { const [r, g, b] = this.tint || [1, 1, 1], f = 1 + (this.flash || 0) * 1.6; for (const m of this.mats || []) m.color.setRGB(r * f, g * f, b * f); }
  // turn the flat figure toward the camera (partial yaw + pitch) so it never shows edge-on
  faceCamera(cam, follow = 0.85) {
    const p = new THREE.Vector3(); this.root.getWorldPosition(p);
    const dx = cam.position.x - p.x, dz = cam.position.z - p.z, dy = cam.position.y - (p.y + 0.9);
    const parentYaw = this.root.rotation.y; const yaw = Math.atan2(dx, dz) - parentYaw;
    this.face.rotation.y = yaw * follow; this.face.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)) * 0.45;
    return Math.atan2(dx, dz);
  }
  setOrder(o) { this.order = o; this.glow.renderOrder = o - 1; this._order(true); }
  setGlow(v) { this.glow.material.opacity = v; }
  setExpression() {}
  update() {}
}
