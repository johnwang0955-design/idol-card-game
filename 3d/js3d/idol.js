// 3D idol: loads the shared licensed VRM base, restyles it per idol, hosts swappable garments
import { THREE, canvasTex, toon, withOutline, blobTex, glowTex } from './core.js?v=3d-20261010a';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { buildItem, DEFAULT_ITEMS } from './garments.js?v=3d-20261010a';

const BASE_URL = new URL('../assets3d/base.vrm', import.meta.url).href + '?v=3d-20261010a';
const loader = new GLTFLoader(); loader.register(p => new VRMLoaderPlugin(p));

// ---- idol looks (matched to the 2D portraits) ----
export const LOOKS = {
  rinne: { hair: ['#070a1c', '#1a2350', '#5d6fb8'], iris: ['#1d0f3a', '#7b4fd0', '#d6c4ff'], brow: '#141834', style: 'straight',
    expr: { angry: 0.08, relaxed: 0.12 }, clip: 'moon', lash: 1.0 },
  haruka: { hair: ['#4d2f2a', '#b5857a', '#efd2c2'], iris: ['#4a2a08', '#c48a2a', '#ffe3a0'], brow: '#6b4538', style: 'wavy',
    expr: { relaxed: 0.35 }, clip: 'pearl', mole: true },
  ria: { hair: ['#7a2208', '#f0743a', '#ffd0a0'], iris: ['#03343a', '#1fbfbd', '#c8fff6'], brow: '#a8461e', style: 'ponytail',
    expr: { happy: 0.12 }, clip: 'star', freckles: true },
};

function imgToCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0); return c;
}
function hexRGB(h) { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; }
// gradient-map recolour that keeps the painted shading of the original texture
function recolor(tex, stops, { keepAlpha = true, mix = 1 } = {}) {
  if (!tex || !tex.image) return tex;
  const c = imgToCanvas(tex.image); const g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height); const a = d.data;
  let sum = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 20) { sum += (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11); n++; }
  const mean = n ? sum / n : 128;
  const s0 = hexRGB(stops[0]), s1 = hexRGB(stops[1]), s2 = hexRGB(stops[2]);
  for (let i = 0; i < a.length; i += 4) {
    const L = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11);
    let r, gg, b;
    if (L < mean) { const f = L / mean; r = s0[0] + (s1[0] - s0[0]) * f; gg = s0[1] + (s1[1] - s0[1]) * f; b = s0[2] + (s1[2] - s0[2]) * f; }
    else { const f = Math.min(1, (L - mean) / (255 - mean + 1)); r = s1[0] + (s2[0] - s1[0]) * f; gg = s1[1] + (s2[1] - s1[1]) * f; b = s1[2] + (s2[2] - s1[2]) * f; }
    a[i] = a[i] + (r - a[i]) * mix; a[i + 1] = a[i + 1] + (gg - a[i + 1]) * mix; a[i + 2] = a[i + 2] + (b - a[i + 2]) * mix;
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
  t.offset.copy(tex.offset); t.repeat.copy(tex.repeat); return t;
}

const HUMAN_GROUPS = (name) => {
  if (!name) return 'other';
  if (/Eye|head|neck|jaw/i.test(name)) return 'head';
  if (/Thumb|Index|Middle|Ring|Little/.test(name)) return 'finger';
  if (/Hand/.test(name)) return 'hand';
  if (/Shoulder|UpperArm|LowerArm/.test(name)) return 'arm';
  if (/UpperLeg|LowerLeg/.test(name)) return 'leg';
  if (/Foot|Toes/.test(name)) return 'foot';
  return 'torso';
};

export class Idol {
  static async load(id) { const gltf = await loader.loadAsync(BASE_URL); return new Idol(id, gltf.userData.vrm); }
  constructor(id, vrm) {
    this.id = id; this.vrm = vrm; this.look = LOOKS[id] || LOOKS.rinne;
    this.root = new THREE.Group(); this.root.add(vrm.scene);
    this.items = {}; this.heel = { angle: 0, lift: 0 }; this.baseLift = 0;
    vrm.scene.traverse(o => { o.frustumCulled = false; });
    this.mats = [];
    vrm.scene.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) this.mats.push({ m, o }); });
    // hide the sample's own clothes; we provide every garment ourselves
    for (const { m, o } of this.mats) if (/Tops|Bottoms|Shoes/.test(m.name)) o.visible = false;
    this.skin = this.mats.find(x => /Body_00_SKIN/.test(x.m.name) && !/Outline/.test(x.m.name)).o;
    this.face = this.mats.find(x => /Face_00_SKIN/.test(x.m.name)).o;
    vrm.scene.updateMatrixWorld(true);
    this._analyse();
    this._restyle();
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.004; this.root.add(blob);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    this.glow.scale.set(2.2, 2.6, 1); this.glow.position.y = 0.9; this.root.add(this.glow);
    for (const s of ['top', 'bottom', 'shoes', 'acc']) this.wear(s, null);
  }
  bone(n) { return this.vrm.humanoid.getRawBoneNode(n); }
  nbone(n) { return this.vrm.humanoid.getNormalizedBoneNode(n); }

  // ---------- body analysis: landmarks + per-vertex region data in bind space ----------
  _analyse() {
    const skin = this.skin, inv = skin.matrixWorld.clone().invert();
    const L = {}; const restWorld = {};
    for (const [name, hb] of Object.entries(this.vrm.humanoid.humanBones)) {
      if (!hb || !hb.node) continue;
      restWorld[name] = hb.node.matrixWorld.clone();
      L[name] = new THREE.Vector3().setFromMatrixPosition(hb.node.matrixWorld).applyMatrix4(inv);
    }
    this.L = L; this.restWorld = restWorld;
    const bones = skin.skeleton.bones; const nodeToHuman = new Map();
    for (const [name, hb] of Object.entries(this.vrm.humanoid.humanBones)) if (hb && hb.node) nodeToHuman.set(hb.node, name);
    const boneHuman = bones.map(b => { let n = b; while (n && !nodeToHuman.has(n)) n = n.parent; return n ? nodeToHuman.get(n) : null; });
    // The VRoid export deleted skin hidden under its own clothes, so the "body surface" = skin + the (hidden) original clothes.
    this.clothMeshes = this.mats.filter(x => /Tops|Bottoms|Shoes/.test(x.m.name) && !/Outline/.test(x.m.name)).map(x => x.o).filter((o, i, a) => a.indexOf(o) === i);
    const srcs = [skin, ...this.clothMeshes];
    let n = 0; for (const m of srcs) n += m.geometry.attributes.position.count;
    const pos = new Float32Array(n * 3), rawN = new Float32Array(n * 3), SIa = new Uint16Array(n * 4), SWa = new Float32Array(n * 4), src = new Uint8Array(n);
    const index = []; let off = 0; const skinTriCount = skin.geometry.index.count / 3;
    srcs.forEach((m, k) => {
      const g = m.geometry, P = g.attributes.position, Nn = g.attributes.normal, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
      for (let i = 0; i < P.count; i++) {
        const j = off + i; pos[j * 3] = P.getX(i); pos[j * 3 + 1] = P.getY(i); pos[j * 3 + 2] = P.getZ(i);
        rawN[j * 3] = Nn.getX(i); rawN[j * 3 + 1] = Nn.getY(i); rawN[j * 3 + 2] = Nn.getZ(i);
        for (let c = 0; c < 4; c++) { SIa[j * 4 + c] = SI.getComponent(i, c); SWa[j * 4 + c] = SW.getComponent(i, c); }
        src[j] = k === 0 ? 0 : 1;
      }
      const ix = g.index.array; for (let i = 0; i < ix.length; i++) index.push(ix[i] + off);
      off += P.count;
    });
    // welded normals so offset shells don't crack on UV seams
    const key = (j) => `${Math.round(pos[j * 3] * 2e4)},${Math.round(pos[j * 3 + 1] * 2e4)},${Math.round(pos[j * 3 + 2] * 2e4)}`;
    const acc = new Map();
    for (let j = 0; j < n; j++) { const k = key(j) + ':' + src[j]; let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += rawN[j * 3]; a[1] += rawN[j * 3 + 1]; a[2] += rawN[j * 3 + 2]; }
    const nor = new Float32Array(n * 3), part = new Array(n), human = new Array(n);
    for (let j = 0; j < n; j++) {
      const a = acc.get(key(j) + ':' + src[j]); const l = Math.hypot(a[0], a[1], a[2]) || 1; nor[j * 3] = a[0] / l; nor[j * 3 + 1] = a[1] / l; nor[j * 3 + 2] = a[2] / l;
      let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = SWa[j * 4 + k]; if (w > bw) { bw = w; best = SIa[j * 4 + k]; } }
      human[j] = boneHuman[best]; part[j] = HUMAN_GROUPS(human[j]);
    }
    // skin triangles lying right under the original clothes are duplicates of that surface → never used for shells
    const grid = new Map(); const cell = 0.012; const ck = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    for (let j = 0; j < n; j++) if (src[j]) { const k = ck(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]); (grid.get(k) || grid.set(k, []).get(k)).push(j); }
    const nearCloth = new Uint8Array(n);
    for (let j = 0; j < n; j++) if (!src[j]) {
      const x = pos[j * 3], y = pos[j * 3 + 1], z = pos[j * 3 + 2]; const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
      outer: for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const l = grid.get(`${cx + a},${cy + b},${cz + c}`); if (!l) continue; for (const q of l) { if ((pos[q * 3] - x) ** 2 + (pos[q * 3 + 1] - y) ** 2 + (pos[q * 3 + 2] - z) ** 2 < 0.009 ** 2) { nearCloth[j] = 1; break outer; } } }
    }
    const SIattr = { getComponent: (i, c) => SIa[i * 4 + c] }, SWattr = { getComponent: (i, c) => SWa[i * 4 + c] };
    const idxArr = Uint32Array.from(index);
    this.skinTriCount = skinTriCount;
    // limb parameter t: arms 0 shoulder joint,1 elbow,2 wrist,3 fingertips | legs 0 hip joint,1 knee,2 ankle,3 sole
    const ax = [L.leftUpperArm.x, L.leftLowerArm.x, L.leftHand.x, L.leftHand.x + 0.17];
    const ly = [L.leftUpperLeg.y, L.leftLowerLeg.y, L.leftFoot.y, 0];
    const tArr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = Math.abs(pos[i * 3]), y = pos[i * 3 + 1]; let t = 0;
      if (part[i] === 'arm' || part[i] === 'hand' || part[i] === 'finger') {
        if (x < ax[0]) t = (x - ax[0]) / 0.1; else if (x < ax[1]) t = (x - ax[0]) / (ax[1] - ax[0]); else if (x < ax[2]) t = 1 + (x - ax[1]) / (ax[2] - ax[1]); else t = 2 + (x - ax[2]) / (ax[3] - ax[2]);
      } else if (part[i] === 'leg' || part[i] === 'foot' || (part[i] === 'torso' && y < ly[0] + 0.12)) {
        if (y > ly[0]) t = -(y - ly[0]) / 0.1; else if (y > ly[1]) t = (ly[0] - y) / (ly[0] - ly[1]); else if (y > ly[2]) t = 1 + (ly[1] - y) / (ly[1] - ly[2]); else t = 2 + (ly[2] - y) / Math.max(0.01, ly[2]);
      }
      tArr[i] = t;
    }
    // fit the (loose) original clothes surface closer to a body: tighten sleeves/thighs to the skin radius, slim the boxy tee hem
    {
      const armAxis = (sx) => ({ y: L.leftUpperArm.y, z: L.leftUpperArm.z });
      const rad = (j, cy, cz) => Math.hypot(pos[j * 3 + 1] - cy, pos[j * 3 + 2] - cz);
      let re = 0, ne = 0, rk = 0, nk = 0;
      for (let j = 0; j < n; j++) if (!src[j]) {
        if ((part[j] === 'arm') && tArr[j] > 1.0 && tArr[j] < 1.25) { re += rad(j, L.leftUpperArm.y, L.leftUpperArm.z); ne++; }
        if (part[j] === 'leg' && tArr[j] > 0.55 && tArr[j] < 0.8) { const cx = Math.sign(pos[j * 3]) * Math.abs(L.leftUpperLeg.x); rk += Math.hypot(pos[j * 3] - cx, pos[j * 3 + 2] - L.leftUpperLeg.z); nk++; }
      }
      re = ne ? re / ne : 0.035; rk = nk ? rk / nk : 0.06;
      const chestY = L.chest.y, hemY = L.hips.y;
      for (let j = 0; j < n; j++) {
        if (!src[j]) continue;
        if (part[j] === 'arm' && tArr[j] > -0.2 && tArr[j] < 1.1) {
          const tgt = (re * (1.45 - 0.45 * Math.min(1, Math.max(0, tArr[j])))) + 0.003; const cy = L.leftUpperArm.y, cz = L.leftUpperArm.z;
          const dy = pos[j * 3 + 1] - cy, dz = pos[j * 3 + 2] - cz; const r = Math.hypot(dy, dz); if (r > tgt) { const f = tgt / r; const w = Math.min(1, (tArr[j] + 0.2) / 0.4); pos[j * 3 + 1] = cy + dy * (1 - (1 - f) * w); pos[j * 3 + 2] = cz + dz * (1 - (1 - f) * w); }
        } else if (part[j] === 'leg' && tArr[j] > 0 && tArr[j] < 0.7) {
          const cx = Math.sign(pos[j * 3]) * Math.abs(L.leftUpperLeg.x), cz = L.leftUpperLeg.z; const tgt = rk * (1.35 - 0.35 * tArr[j] / 0.7) + 0.004;
          const dx = pos[j * 3] - cx, dz = pos[j * 3 + 2] - cz; const r = Math.hypot(dx, dz); if (r > tgt) { const f = tgt / r; pos[j * 3] = cx + dx * f; pos[j * 3 + 2] = cz + dz * f; }
        } else if (part[j] === 'torso' && pos[j * 3 + 1] < chestY && pos[j * 3 + 1] > hemY - 0.05) {
          const y = pos[j * 3 + 1]; const k = Math.min(1, Math.max(0, (chestY - y) / (chestY - L.spine.y))); const w = Math.sin(Math.PI * Math.min(1, k) / 2) * (y > L.spine.y - 0.02 ? 1 : Math.max(0, 1 - (L.spine.y - 0.02 - y) / 0.08));
          pos[j * 3] *= 1 - 0.13 * w; pos[j * 3 + 2] = L.hips.z + (pos[j * 3 + 2] - L.hips.z) * (1 - 0.07 * w);
        }
      }
    }
    this.body = { pos, nor, part, human, t: tArr, n, SI: SIattr, SW: SWattr, src, nearCloth, SIa, SWa };
    this.bodyIndexFull = idxArr; this.skinIndexFull = skin.geometry.index.array.slice();
    this._makePatch();
    // foot metrics for shoes
    const foot = { L: { min: new THREE.Vector3(1e9, 1e9, 1e9), max: new THREE.Vector3(-1e9, -1e9, -1e9) }, R: { min: new THREE.Vector3(1e9, 1e9, 1e9), max: new THREE.Vector3(-1e9, -1e9, -1e9) } };
    for (let i = 0; i < n; i++) if (part[i] === 'foot') { const f = pos[i * 3] > 0 ? foot.L : foot.R; const v = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); f.min.min(v); f.max.max(v); }
    this.foot = foot;
    // horizontal cross-section of torso at a height (for skirts)
    this.section = (y, band = 0.02) => {
      let rx = 0, zmin = 1e9, zmax = -1e9;
      for (let i = 0; i < n; i++) { if (part[i] !== 'torso' && part[i] !== 'leg') continue; const yy = pos[i * 3 + 1]; if (Math.abs(yy - y) > band) continue; rx = Math.max(rx, Math.abs(pos[i * 3])); zmin = Math.min(zmin, pos[i * 3 + 2]); zmax = Math.max(zmax, pos[i * 3 + 2]); }
      return { rx, rz: (zmax - zmin) / 2, cz: (zmax + zmin) / 2 };
    };
    // head width at eye level (for earrings)
    const fg = this.face.geometry.attributes.position; let hx = 0; const ey = L.leftEye ? L.leftEye.y : L.head.y + 0.06;
    for (let i = 0; i < fg.count; i++) if (Math.abs(fg.getY(i) - (ey - 0.04)) < 0.02) hx = Math.max(hx, Math.abs(fg.getX(i)));
    this.headHalf = hx || 0.07; this.eyeY = ey; this.eyeZ = L.leftEye ? L.leftEye.z : L.head.z + 0.06;
  }
  // world(rest) point -> local position under a raw bone (for rigid props)
  attachRigid(boneName, obj, restPos) {
    const b = this.bone(boneName); const m = this.restWorld[boneName];
    const local = restPos.clone().applyMatrix4(this.skin.matrixWorld).applyMatrix4(m.clone().invert());
    obj.position.copy(local); b.add(obj); return obj;
  }

  // ---------- per-idol restyle: hair colour/shape, eyes, face paint, expression ----------
  _restyle() {
    const lk = this.look;
    for (const { m } of this.mats) {
      if (/HAIR/.test(m.name)) {
        if (m.map) { const t = recolor(m.map, lk.hair); m.map = t; if (m.shadeMultiplyTexture) m.shadeMultiplyTexture = recolor(m.shadeMultiplyTexture, lk.hair.map(c => new THREE.Color(c).multiplyScalar(0.72).getStyle())); }
        m.color && m.color.set('#ffffff'); if (m.shadeColorFactor) m.shadeColorFactor.set('#ffffff');
        if (m.parametricRimColorFactor) { m.parametricRimColorFactor.set(lk.hair[2]).multiplyScalar(0.25); m.parametricRimFresnelPowerFactor = 4; }
        m.needsUpdate = true;
      }
      if (/EyeIris/.test(m.name) && m.map) { m.map = recolor(m.map, lk.iris); if (m.shadeMultiplyTexture) m.shadeMultiplyTexture = m.map; m.needsUpdate = true; }
      if (/FaceBrow/.test(m.name)) { m.color && m.color.set(lk.brow); if (m.shadeColorFactor) m.shadeColorFactor.set(lk.brow); }
    }
    this._paintFace();
    this._reshapeHair();
    this._hairClip();
  }
  _faceUV(p) { // nearest face-skin vertex UV for a bind-space point
    const g = this.face.geometry, P = g.attributes.position, U = g.attributes.uv; let best = -1, bd = 1e9;
    for (let i = 0; i < P.count; i++) { const d = (P.getX(i) - p.x) ** 2 + (P.getY(i) - p.y) ** 2 + (P.getZ(i) - p.z) ** 2; if (d < bd) { bd = d; best = i; } }
    return [U.getX(best), U.getY(best)];
  }
  _paintFace() {
    const lk = this.look; if (!lk.mole && !lk.freckles) return;
    const m = this.face.material[0] || this.face.material; if (!m.map) return;
    const c = imgToCanvas(m.map.image), g = c.getContext('2d'); const W = c.width, H = c.height;
    const eL = this.L.leftEye, eR = this.L.rightEye;
    const dot = (p, r, col) => { const [u, v] = this._faceUV(p); const x = u * W, y = (m.map.flipY ? 1 - v : v) * H; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    if (lk.mole && eL) dot(new THREE.Vector3(eL.x + 0.012, eL.y - 0.03, eL.z + 0.012), W / 260, 'rgba(70,40,40,.9)');
    if (lk.freckles && eL && eR) {
      for (const e of [eL, eR]) for (let k = 0; k < 6; k++) {
        const s = Math.sign(e.x); dot(new THREE.Vector3(e.x * 0.75 + s * (k % 3) * 0.006, e.y - 0.026 - Math.floor(k / 3) * 0.006, e.z + 0.018), W / 420, 'rgba(190,105,70,.55)');
      }
    }
    const t = new THREE.CanvasTexture(c); t.flipY = m.map.flipY; t.colorSpace = THREE.SRGBColorSpace;
    m.map = t; if (m.shadeMultiplyTexture) m.shadeMultiplyTexture = t; m.needsUpdate = true;
  }
  _reshapeHair() {
    const st = this.look.style; if (st === 'straight') return;
    const headY = this.L.head.y, shoulderY = this.L.leftUpperArm.y, hc = this.L.head;
    for (const { m, o } of this.mats) {
      if (!/HAIR/.test(m.name) || o.userData._reshaped) continue; o.userData._reshaped = true;
      const P = o.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) {
        let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        if (st === 'wavy' && y < headY - 0.02) { // loose big waves below the ears, slight volume
          const k = Math.min(1, (headY - 0.02 - y) / 0.15); const a = Math.atan2(x - hc.x, z - hc.z);
          const w = Math.sin((headY - y) * 17 + a * 3) * 0.024 * k + 0.018 * k;
          x += Math.sin(a) * w; z += Math.cos(a) * w;
        }
        if (st === 'ponytail' && y < headY + 0.02) { // gather long back hair up: shorten to a nape length bob, ponytail is added separately
          const cut = headY - 0.06;
          if (y < cut) { const f = 0.25; y = cut + (y - cut) * f; const k = 0.82; x = hc.x + (x - hc.x) * k; z = hc.z + (z - hc.z) * k; }
        }
        P.setXYZ(i, x, y, z);
      }
      P.needsUpdate = true; o.geometry.computeBoundingSphere();
    }
    if (st === 'ponytail') this._ponytail();
  }
  _ponytail() { // high side ponytail on her right: one full tapered hair mass + a few loose strands
    const hc = this.L.head; const lk = this.look;
    const tex = canvasTex(256, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, lk.hair[0]); gr.addColorStop(.3, lk.hair[1]); gr.addColorStop(.5, lk.hair[2]); gr.addColorStop(.7, lk.hair[1]); gr.addColorStop(1, lk.hair[0]); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = .35; for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? lk.hair[0] : lk.hair[2]; g.fillRect(0, Math.random() * h, w, 1); } });
    tex.wrapT = THREE.RepeatWrapping;
    const mat = toon({ color: '#ffffff', map: tex, shade: '#c8a898', outline: 0.0012, outlineColor: lk.hair[0] });
    const grp = new THREE.Group();
    const mk = (len, R, ph, sx, sz) => {
      const pts = []; for (let k = 0; k <= 12; k++) { const f = k / 12; pts.push(new THREE.Vector3(-0.03 - f * 0.08 * sx - Math.sin(f * 2.2) * 0.05 + Math.sin(f * 3.2 + ph) * 0.015, 0.02 - f * len, -0.03 - f * 0.05 * sz - Math.sin(f * 2.2) * 0.03)); }
      const curve = new THREE.CatmullRomCurve3(pts); const geo = new THREE.TubeGeometry(curve, 30, 1, 12, false); const P = geo.attributes.position;
      for (let i = 0; i < P.count; i++) { const seg = Math.floor(i / 13) / 30; const c = curve.getPoint(Math.min(1, seg)); const r = R * Math.pow(Math.sin(Math.PI * Math.min(1, 0.18 + seg * 0.82)), 0.8) * (1 - seg * 0.5) + 0.002; const v = new THREE.Vector3(P.getX(i), P.getY(i), P.getZ(i)).sub(c); const l = v.length() || 1; v.multiplyScalar(r / l).add(c); P.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals(); return withOutline(new THREE.Mesh(geo, null), mat);
    };
    grp.add(mk(0.36, 0.05, 0, 1, 1)); grp.add(mk(0.3, 0.022, 1.5, 1.6, 0.6)); grp.add(mk(0.28, 0.02, 3, 0.4, 1.4));
    const tie = withOutline(new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 8, 16), null), toon({ color: '#ffd84a', emissive: '#ffb000', emissiveIntensity: .2 }));
    tie.rotation.set(Math.PI / 2.3, 0, 0.3); tie.position.set(-0.02, 0.012, -0.025); grp.add(tie);
    grp.rotation.z = 0.1;
    this.attachRigid('head', grp, new THREE.Vector3(hc.x - 0.075, hc.y + 0.14, hc.z - 0.06)); this.ponytail = grp;
  }
  _hairClip() {
    const hc = this.L.head; const kind = this.look.clip; const g = new THREE.Group();
    if (kind === 'moon') {
      const s = new THREE.Shape(); s.absarc(0, 0, 0.026, Math.PI * 0.25, Math.PI * 1.75, false); s.absarc(0.011, 0.002, 0.021, Math.PI * 1.6, Math.PI * 0.4, true);
      const m = withOutline(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false }), null), toon({ color: '#e8ecf8', emissive: '#c8d4ff', emissiveIntensity: .25, rim: '#ffffff' }));
      g.add(m); g.rotation.y = 1.25; this.attachRigid('head', g, new THREE.Vector3(hc.x + this.headHalf + 0.012, this.eyeY + 0.085, hc.z + 0.02));
    } else if (kind === 'pearl') {
      const mat = toon({ color: '#fff8ee', rim: '#ffffff', shade: '#d8ccc0', outline: 0.0006 });
      for (let i = 0; i < 4; i++) { const p = withOutline(new THREE.Mesh(new THREE.SphereGeometry(0.0075, 12, 8), null), mat); p.position.set(0, i * 0.016, 0); g.add(p); }
      g.rotation.z = -0.7; this.attachRigid('head', g, new THREE.Vector3(hc.x - this.headHalf - 0.004, this.eyeY + 0.07, this.eyeZ + 0.01));
    } else if (kind === 'star') {
      const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.011 : 0.026; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const m = withOutline(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 }), null), toon({ color: '#ffd24a', emissive: '#ffb000', emissiveIntensity: .25, rim: '#fff4c0' }));
      g.add(m); g.rotation.y = -1.1; this.attachRigid('head', g, new THREE.Vector3(hc.x - this.headHalf - 0.01, this.eyeY + 0.1, hc.z + 0.01));
    }
  }

  // ---------- garments ----------
  wear(slot, itemId) {
    const old = this.items[slot]; if (old) { old.dispose(); delete this.items[slot]; }
    const id = itemId || DEFAULT_ITEMS[slot]; if (!id) { this._updateCover(); this._updateHeel(); return; }
    const it = buildItem(this, id); if (it) { this.items[slot] = it; }
    this._updateCover(); this._updateHeel();
  }
  wearOutfit(o) { for (const s of ['top', 'bottom', 'shoes', 'acc']) this.wear(s, o ? o[s] : null); }
  _updateCover() { // hide body triangles fully covered by tight garments; show skin-coloured patch where the sample had no skin
    const cover = new Set(); for (const it of Object.values(this.items)) if (it && it.covers) for (const t of it.covers) cover.add(t);
    const full = this.bodyIndexFull; const sk = [], pa = []; const nS = this.skinTriCount;
    for (let t = 0; t < full.length / 3; t++) { if (cover.has(t)) continue; if (t < nS) sk.push(this.skinIndexFull[t * 3], this.skinIndexFull[t * 3 + 1], this.skinIndexFull[t * 3 + 2]); else pa.push(full[t * 3], full[t * 3 + 1], full[t * 3 + 2]); }
    const g = this.skin.geometry; g.setIndex(sk);
    if (g.groups.length) { g.clearGroups(); g.addGroup(0, sk.length, 0); if ([].concat(this.skin.material).length > 1) g.addGroup(0, sk.length, 1); }
    const pg = this.patch.geometry; pg.setIndex(pa); pg.clearGroups(); pg.addGroup(0, pa.length, 0);
  }
  _makePatch() { // skinned mesh over the original-clothes surface, drawn in skin colour, pushed slightly inward
    const B = this.body; const n = B.n; const P = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) P[i * 3 + c] = B.pos[i * 3 + c] - B.nor[i * 3 + c] * 0.004;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(B.nor, 3));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(B.SIa, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(B.SWa, 4)); g.setIndex([]);
    const skm = [].concat(this.skin.material)[0];
    let col = '#fbe2d6'; try { const img = skm.map.image; const c = document.createElement('canvas'); c.width = 8; c.height = 8; const gg = c.getContext('2d'); const uv = this.skin.geometry.attributes.uv; const L = this.L; let best = 0, bd = 1e9; for (let i = 0; i < this.skin.geometry.attributes.position.count; i++) { const d = (B.pos[i * 3] - L.leftLowerArm.x) ** 2 + (B.pos[i * 3 + 1] - L.leftLowerArm.y - 0.03) ** 2 + (B.pos[i * 3 + 2] - L.leftLowerArm.z) ** 2; if (d < bd) { bd = d; best = i; } } gg.drawImage(img, uv.getX(best) * img.width - 4, (skm.map.flipY ? 1 - uv.getY(best) : uv.getY(best)) * img.height - 4, 8, 8, 0, 0, 8, 8); const d = gg.getImageData(3, 3, 1, 1).data; col = `rgb(${d[0]},${d[1]},${d[2]})`; } catch (e) {}
    const m = toon({ color: col, shade: new THREE.Color(col).lerp(new THREE.Color('#d88a8a'), 0.35).getStyle(), outline: 0 }); m.side = THREE.FrontSide;
    this.patch = new THREE.SkinnedMesh(g, [m]); this.patch.frustumCulled = false; this.patch.bind(this.skin.skeleton, this.skin.bindMatrix); this.skin.parent.add(this.patch);
  }
  _updateHeel() {
    const s = this.items.shoes; this.heel = s && s.heel ? s.heel : { angle: 0, lift: 0, platform: 0 };
  }
  applyHeel() { // call after motion each frame
    const h = this.heel; if (!h || (!h.angle && !h.platform)) return;
    for (const side of ['left', 'right']) {
      const f = this.nbone(side + 'Foot'), t = this.nbone(side + 'Toes');
      if (f) f.rotation.x += h.angle; if (t) t.rotation.x -= h.angle;
    }
    this.nbone('hips').position.y += h.lift + (h.platform || 0);
  }
  setGlow(v) {
    this.glow.material.opacity = v;
    for (const { m } of this.mats) if (m.emissive) m.emissive.setRGB(1, .85, .9).multiplyScalar(v * 0.5);
  }
  setExpression(t, extra = {}) {
    const em = this.vrm.expressionManager; if (!em) return;
    const base = { ...this.look.expr };
    for (const [k, v] of Object.entries(extra)) base[k] = (base[k] || 0) + v;
    for (const k of ['happy', 'angry', 'relaxed', 'surprised', 'sad']) em.setValue(k, Math.min(1, base[k] || 0));
    const bl = (t % 3.9) < 0.12 ? 1 : 0; em.setValue('blink', bl * (1 - Math.min(1, base.happy || 0)));
  }
  update(dt) { this.applyHeel(); this.vrm.update(dt); if (this.ponytail) this.ponytail.rotation.z = 0.1 + Math.sin(performance.now() / 300) * 0.05; }
}
