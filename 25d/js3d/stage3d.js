// Stage3D: one shared WebGL renderer that hosts the coordinate showroom, the dress-up runway and the live stage.
import { THREE, canvasTex, glowTex, starTex, Sparkles, lerp, ease } from './core.js?v=25d-20261010a';
import { SpriteIdol as Idol } from '../js25d/sprite.js?v=25d-20261010a';   // 2.5D: illustrated layered idol on a 2D-skinned billboard
import * as M from '../js25d/motion2d.js?v=25d-20261010a';

const Q = new URLSearchParams(location.search);
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
const OK = webglOK() && !Q.has('no3d');
const SIGNATURE = { rinne: 'mid', haruka: 'ros', ria: 'pop' };
const backupOutfit = (id, main) => { // backup dancers wear a different brand than the star so she stands out
  const used = new Set(Object.values(main || {}).filter(Boolean).map(x => x.split('_')[0]));
  const pref = [SIGNATURE[id], 'mid', 'sug', 'pop', 'ros'].find(p => !used.has(p)) || 'mid'; const v = pref === SIGNATURE[id] ? 'a' : 'b';
  return { top: pref + '_top_' + v, bottom: pref + '_bot_' + v, shoes: pref + '_shoe_' + v, acc: null }; };
const sig = (id) => { const p = SIGNATURE[id] || 'mid'; return { top: p + '_top_a', bottom: p + '_bot_a', shoes: p + '_shoe_a', acc: p + '_acc_a' }; };

let renderer, camera, scene, clock;
const cache = new Map();
function ensure(id) { if (!cache.has(id)) cache.set(id, Idol.load(id)); return cache.get(id); }
function init() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'gl3d';
  camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
  scene = new THREE.Scene(); clock = new THREE.Clock();
  buildShowroom(); buildRunway(); buildStage();
  renderer.domElement.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  window.addEventListener('resize', () => fit());
}
const st = { mode: null, host: null, t: 0, idol: null, outfit: null, dancers: [], safe: { top: 0, bottom: 0 }, freeze: null, drag: null, yaw: 0, autoYaw: 0, manualUntil: 0, fx: { appealUntil: 0 } };

// ---------------- worlds ----------------
const worlds = {};
function skyShader(frag) { return new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { t: { value: 0 } }, vertexShader: 'varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: frag })); }
function lights(g, key = 2.0, amb = 1.0) {
  g.add(new THREE.AmbientLight(0xffffff, amb));
  const k = new THREE.DirectionalLight(0xfff2ee, key); k.position.set(1.2, 4, 5); g.add(k);
  const r1 = new THREE.DirectionalLight(0xff9ee8, 0.8); r1.position.set(-4, 3, -4); g.add(r1);
  const r2 = new THREE.DirectionalLight(0x9ed8ff, 0.8); r2.position.set(4, 3, -4); g.add(r2);
}
function buildShowroom() {
  const g = new THREE.Group(); g.visible = false; scene.add(g); worlds.show = g;
  g.add(skyShader(`varying vec3 vp; void main(){ vec3 d=normalize(vp); float y=d.y*.5+.5; vec3 c=mix(vec3(.05,.06,.1),vec3(.22,.18,.32),smoothstep(.3,.9,y)); c+=vec3(.9,.8,.6)*pow(max(0.,d.z*.5+.5),6.)*.08; gl_FragColor=vec4(c,1.); }`));
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 64), [new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: .3, metalness: .5 }), new THREE.MeshStandardMaterial({ color: 0x3a3258, roughness: .2, metalness: .3, emissive: 0x241c3a }), new THREE.MeshBasicMaterial()]);
  ped.position.y = -0.06; g.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0xe8d5a3 })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.002; g.add(ring);
  lights(g, 2.1, 1.05);
  worlds.showSpark = new Sparkles(g, 240, 0xfff0c0, 0.06); worlds.showSpark.pts.renderOrder = 300;
}
function buildRunway() {
  const g = new THREE.Group(); g.visible = false; scene.add(g); worlds.run = g;
  const sky = skyShader(`varying vec3 vp; uniform float t; vec3 hsv(float h){ return clamp(abs(mod(h*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.); }
    void main(){ vec3 d=normalize(vp); float y=d.y*.5+.5; vec3 rain=mix(vec3(.98,.84,.62), hsv(fract(.08+y*.9+t*.02))*.45+.5, smoothstep(.45,.9,y)); rain=mix(vec3(.95,.7,.66),rain,smoothstep(.2,.5,y));
      float s=pow(max(0.,sin(d.x*90.+t)*sin(d.y*70.)),40.); gl_FragColor=vec4(rain+s*.6,1.); }`); sky.name = 'sky'; g.add(sky);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(3, 60), new THREE.ShaderMaterial({ uniforms: { t: { value: 0 } }, transparent: true,
    vertexShader: 'varying vec2 vu; void main(){ vu=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vu; uniform float t; void main(){ float e=smoothstep(0.,.06,vu.x)*smoothstep(1.,.94,vu.x); float band=.5+.5*sin(vu.y*120.-t*4.); vec3 c=mix(vec3(1.,.95,.98),vec3(1.,.82,.95),band*.5); float edge=1.-smoothstep(.0,.05,min(vu.x,1.-vu.x)); c+=vec3(1.,.85,.5)*edge*1.2; gl_FragColor=vec4(c,.92*e+edge*.08); }` }));
  rw.rotation.x = -Math.PI / 2; rw.name = 'runway'; g.add(rw);
  const n = 220, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = (Math.random() - .5) * 50; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: starTex, size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff2c8 })));
  const gate = new THREE.Group(); const gm = new THREE.MeshBasicMaterial({ color: 0xfff1c9 });
  const fr = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 12, 64, Math.PI), gm); fr.position.y = 1.6; gate.add(fr);
  for (const x of [-1.25, 1.25]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 12), gm); p.position.set(x, .8, 0); gate.add(p); }
  const mirror = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-1.22, 0); s.lineTo(-1.22, 1.6); s.absarc(0, 1.6, 1.22, Math.PI, 0, true); s.lineTo(1.22, 0); return s; })()),
    new THREE.ShaderMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 }, k: { value: 0 } },
      vertexShader: 'varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec3 vp; uniform float t; uniform float k; void main(){ float s=.5+.5*sin(vp.x*4.+vp.y*6.-t*3.); float sh=pow(.5+.5*sin((vp.x+vp.y)*9.-t*5.),8.); vec3 c=mix(vec3(.55,.75,1.),vec3(1.,.7,.95),s)*.35+sh*.5; gl_FragColor=vec4(c*(1.+k*3.),.6+k*.4); }` }));
  mirror.name = 'mirror'; gate.add(mirror);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: .45 })); halo.scale.set(4, 4, 1); halo.position.y = 1.4; gate.add(halo);
  g.add(gate); lights(g, 2.1, 1.15);
  worlds.runSpark = new Sparkles(g, 500); worlds.runSpark.pts.renderOrder = 300;
}
function buildStage() {
  const g = new THREE.Group(); g.visible = false; scene.add(g); worlds.stage = g;
  g.add(skyShader(`varying vec3 vp; void main(){ vec3 d=normalize(vp); float y=d.y; vec3 c=mix(vec3(.08,.03,.18),vec3(.02,.01,.06),smoothstep(0.,.6,y)); c+=vec3(.5,.15,.45)*exp(-abs(y)*8.)*.6; gl_FragColor=vec4(c,1.); }`));
  const floorTex = canvasTex(1024, 1024, (c, w) => {
    c.fillStyle = '#1b1030'; c.fillRect(0, 0, w, w); const cx = w / 2;
    for (let r = 500; r > 0; r -= 38) { c.strokeStyle = r % 76 < 38 ? 'rgba(255,190,240,.55)' : 'rgba(140,200,255,.45)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cx, r, 0, 7); c.stroke(); }
    c.save(); c.translate(cx, cx); for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? 'rgba(255,230,160,.12)' : 'rgba(255,120,220,.10)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(520, -60); c.lineTo(520, 60); c.fill(); } c.restore();
  });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.2, 0.6, 64), [new THREE.MeshStandardMaterial({ color: 0x2a1840, emissive: 0x401a50, roughness: .4 }), new THREE.MeshStandardMaterial({ map: floorTex, emissive: 0xffffff, emissiveMap: floorTex, emissiveIntensity: .55, roughness: .25, metalness: .2 }), new THREE.MeshBasicMaterial()]);
  floor.position.y = -0.3; g.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.04, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffd38a })); rim.rotation.x = Math.PI / 2; g.add(rim);
  const scr = canvasTex(1024, 384, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff6fb5'); gr.addColorStop(.5, '#ffcf6f'); gr.addColorStop(1, '#6fd3ff'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.globalAlpha = .25; c.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 0, 7); c.fill(); } c.globalAlpha = 1;
    c.font = 'italic 900 150px Georgia,serif'; c.textAlign = 'center'; c.lineWidth = 14; c.strokeStyle = '#7a2a8a'; c.strokeText('Starlight', w / 2, h / 2 + 50); c.fillStyle = '#fff'; c.fillText('Starlight', w / 2, h / 2 + 50);
  });
  scr.wrapS = THREE.RepeatWrapping; scr.repeat.x = -1; scr.offset.x = 1;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 4.2, 48, 1, true, Math.PI * 0.72, Math.PI * 0.56), new THREE.MeshBasicMaterial({ map: scr, side: THREE.BackSide }));
  back.position.set(0, 2.6, 1.8); g.add(back);
  const beams = new THREE.Group(); const colors = [0xff6fd8, 0x7fd8ff, 0xffe28a, 0xb18cff, 0xff8fa0, 0x8affd0];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.9, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: .13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.position.set(-5 + i * 2, 4.5, -3.5); m.userData.i = i; beams.add(m); }
  g.add(beams); worlds.beams = beams;
  lights(g, 2.0, 0.95);
  const rows = 6, per = 22, N = rows * per; const pens = [];
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8); bodyGeo.translate(0, 0.45, 0);
  const aud = new THREE.InstancedMesh(bodyGeo, new THREE.MeshBasicMaterial({ color: 0x0a0612 }), N);
  const penGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6); penGeo.translate(0, 0.22, 0);
  const pen = new THREE.InstancedMesh(penGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const pgg = new THREE.PlaneGeometry(0.16, 0.7); pgg.translate(0, 0.25, 0);
  const penGlow = new THREE.InstancedMesh(pgg, new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), N);
  const pc = [0xff5fc8, 0x5fd0ff, 0xffd15f, 0xc08bff]; const m4 = new THREE.Matrix4(); let k = 0;
  for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++, k++) {
    const a = (i / (per - 1) - .5) * 1.7, R = 5.0 + r * 0.7; const x = Math.sin(a) * R, z = Math.cos(a) * R, y = -1.0 + r * 0.25;
    m4.makeTranslation(x, y, z); aud.setMatrixAt(k, m4); pens.push({ x, y: y + 1.0, z, ph: Math.random() * 6, side: Math.random() < .5 ? -1 : 1 });
    const c = new THREE.Color(pc[(r + i) % 4]); pen.setColorAt(k, c); penGlow.setColorAt(k, c);
  }
  for (const im of [aud, pen, penGlow]) im.frustumCulled = false; g.add(aud, pen, penGlow);
  worlds.pens = { list: pens, pen, penGlow };
  worlds.stageSpark = new Sparkles(g, 500); worlds.stageSpark.pts.renderOrder = 300;
}

// ---------------- hosting ----------------
function attach(host) {
  init();
  if (st.host !== host) { host.appendChild(renderer.domElement); st.host = host; }
  fit();
  if (!st.running) { st.running = true; clock.getDelta(); renderer.setAnimationLoop(loop); }
}
function fit() {
  if (!st.host || !renderer) return;
  const r = st.host.getBoundingClientRect(); const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  const mobile = Math.min(w, h) < 600; const dpr = Math.min(window.devicePixelRatio || 1, st.mode === 'show' ? 2 : (mobile ? 1.5 : 1.75));
  renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
  renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  camera.aspect = w / h; camera.fov = w < h ? (st.mode === 'show' ? 30 : 48) : 35;
  st.size = { w, h }; applyOffset(); camera.updateProjectionMatrix();
}
function applyOffset() { // keep the idol centred in the area that is not covered by HUD / lanes
  const { w, h } = st.size || { w: 1, h: 1 }; const d = (st.safe.bottom - st.safe.top) / 2;
  if (st.mode === 'live' && Math.abs(d) > 1) camera.setViewOffset(w, h, 0, d * 0.92, w, h); else camera.clearViewOffset();
}
function placeIdol(idol, parent) { idol.root.removeFromParent(); parent.add(idol.root); idol.root.position.set(0, 0, 0); idol.root.rotation.set(0, 0, 0); idol.root.scale.setScalar(1); idol.setGlow(0); idol.setTint(1); idol.setFlash(0); idol.setOrder(100); idol.center.scale.x = 1; }
function setWorld(name) { init(); for (const k of ['show', 'run', 'stage']) worlds[k].visible = k === name; }

// ---------------- showroom (coordinate preview) ----------------
async function preview(host, idolId, outfit) {
  if (!OK) return false;
  const prevMode = st.mode; st.mode = 'show'; setWorld('show'); attach(host);
  const idol = await ensure(idolId); if (st.mode !== 'show') return true;
  if (st.idol !== idol || prevMode !== 'show') { placeIdol(idol, worlds.show); st.idol = idol; st.outfitKey = null; }
  const key = JSON.stringify(outfit || {});
  if (st.outfitKey !== key) {
    const before = st.outfit || {}; idol.wearOutfit(outfit || {});
    if (st.outfitKey) worlds.showSpark.burst(new THREE.Vector3(0, 0.9, 0), 120, 1.4, [0.5, 1.4, 0.5]);
    st.outfitKey = key; st.outfit = { ...(outfit || {}) };
  }
  for (const id of ['rinne', 'haruka', 'ria']) setTimeout(() => ensure(id), 1500); // warm the others for the live
  return true;
}
function updateShow(t, dt) {
  const I = st.idol; if (!I) return;
  M.stand(I, t); I.setExpression(t, { happy: 0.05 });
  if (performance.now() > st.manualUntil) st.yaw = lerp(st.yaw, 0.38 * Math.sin(t * 0.45), Math.min(1, dt * 2));
  st.yaw = Math.max(-0.75, Math.min(0.75, st.yaw)); I.root.rotation.y = st.yaw; I.face.rotation.set(0, 0, 0);
  worlds.showSpark.update(dt);
  const portrait = st.size && st.size.w < st.size.h;
  camera.position.set(0, 0.98, portrait ? 4.0 : 3.5); camera.lookAt(0, 0.86, 0);
}
function onDown(e) { if (st.mode !== 'show') return; st.drag = { x: e.clientX, yaw: st.yaw }; st.manualUntil = performance.now() + 4000; }
function onMove(e) { if (!st.drag) return; st.yaw = Math.max(-0.75, Math.min(0.75, st.drag.yaw + (e.clientX - st.drag.x) * 0.006)); st.manualUntil = performance.now() + 3000; }
function onUp() { st.drag = null; }

// ---------------- dress-up runway ----------------
const RUN = { walk: 3.6, spin: 1.9, final: 2.6 };
const PARTS = [['top', 'TOPS ✦ CHANGE', 1.15], ['bottom', 'BOTTOMS ✦ CHANGE', 0.75], ['shoes', 'SHOES ✦ CHANGE', 0.12], ['acc', 'ACCESSORY ✦ CHANGE', 1.35]];
const RUN_LEN = RUN.walk + RUN.spin * 4 + RUN.final;
function runway(host, idolId, outfit, ui = {}) {
  if (!OK) return Promise.resolve(false);
  return new Promise(async (resolve) => {
    setWorld('run'); attach(host); st.mode = 'loading';
    const idol = await ensure(idolId); placeIdol(idol, worlds.run); st.idol = idol; st.mode = 'run';
    idol.wearOutfit({}); // practice wear → swapped piece by piece
    Object.assign(st, { t: 0, outfit, swaps: 0, ui, done: (v) => { st.done = null; resolve(v); } });
    st.outfitKey = null;
  });
}
function skip() { if (st.mode === 'run' && st.done) { st.idol.wearOutfit(st.outfit); st.done(true); } }
function updateRun(t, dt) {
  const I = st.idol, R = I.root, w = worlds.run; const ui = st.ui || {};
  w.children.forEach(o => { if (o.material && o.material.uniforms && o.material.uniforms.t) o.material.uniforms.t.value = t; });
  const mir = w.getObjectByName('mirror').material.uniforms; mir.t.value = t;
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(); let glow = 0, flash = 0, flip = 1; const portrait = st.size.w < st.size.h; const P = portrait ? 1.35 : 1;
  if (t < RUN.walk) {
    // catwalk toward the camera through the mirror gate (front 3/4 view so the flat figure always reads)
    const z = lerp(-8, 0.6, t / RUN.walk); R.position.set(0, 0, z); R.rotation.y = 0; M.walk(I, t);
    cp.set(1.5 * P, 1.2, z + 4.6 * P); ct.set(0, 0.95, z); ui.caption && ui.caption(t < 2 ? 'DRESS UP!' : '');
    mir.k.value = Math.max(0, 1 - Math.abs(z) * 1.2); ui.flash && ui.flash(t > RUN.walk - 0.3 ? (t - RUN.walk + 0.3) / 0.3 : 0);
    flash = Math.max(0, 1 - Math.abs(z) * 2.5) * 0.6; glow = flash;
  } else {
    const s = t - RUN.walk; ui.flash && ui.flash(Math.max(0, 1 - s / 0.5)); R.position.set(0, 0, 3.2); mir.k.value = 0; R.rotation.y = 0;
    if (s < RUN.spin * 4) {
      // spin = scale-x flip of the illustration (front -> mirrored back-swing -> front); the piece swaps at the edge-on moment
      const k = Math.min(3, Math.floor(s / RUN.spin)), sp = s - k * RUN.spin; const a = 2 * Math.PI * ease(sp / (RUN.spin * 0.8));
      flip = Math.cos(a); M.spinPose(I, t);
      glow = Math.max(0, 1 - Math.abs(sp - RUN.spin * 0.4) / 0.6); flash = Math.max(0, 1 - Math.abs(a - Math.PI / 2) / 0.9) + Math.max(0, 1 - Math.abs(a - 3 * Math.PI / 2) / 0.9) * 0.6;
      if (st.swaps <= k && a >= Math.PI / 2) { st.swaps = k + 1; const [part, , y] = PARTS[k]; I.wear(part, st.outfit[part]); worlds.runSpark.burst(new THREE.Vector3(0, y, 3.2), 160, 1.8, [0.5, 0.35, 0.5]); }
      ui.caption && ui.caption(PARTS[k][1]);
      const az = [0.3, -0.35, 0.4, -0.25][k], r = lerp(3.0, 2.5, sp / RUN.spin) * P;
      const ty = [1.2, 0.8, 0.45, 1.3][k]; const rr = r * [1, 1.1, 1.15, 0.95][k]; cp.set(Math.sin(az) * rr, [1.35, 1.0, 0.6, 1.45][k], 3.2 + Math.cos(az) * rr); ct.set(0, ty, 3.2);
    } else {
      const f = ease((s - RUN.spin * 4) / RUN.final); M.finalPose(I, t);
      if (!st.finalBurst) { st.finalBurst = true; worlds.runSpark.burst(new THREE.Vector3(0, 1, 3.2), 220, 2.2, [0.6, 1.6, 0.6]); }
      cp.set(lerp(1.4, 0.35, f), lerp(1.0, 1.1, f), 3.2 + lerp(4.4, 3.2, f) * P); ct.set(0, lerp(0.92, 0.98, f), 3.2);
      ui.caption && ui.caption('COORDINATE COMPLETE ✦'); glow = Math.max(0, 0.6 - (s - RUN.spin * 4) * 0.4); flash = glow * 0.4;
    }
    if (st.mode === 'run') for (let i = 0; i < 4; i++) worlds.runSpark.burst(new THREE.Vector3(0, Math.random() * 1.6, 3.2), 1, 0.4, [0.9, 0.2, 0.9]);
  }
  I.center.scale.x = Math.sign(flip || 1) * Math.max(0.02, Math.abs(flip)); I.setGlow(glow); I.setFlash(flash); worlds.runSpark.update(dt);
  camera.position.copy(cp); camera.lookAt(ct); I.faceCamera(camera, 0.9);
  if (t >= RUN_LEN && st.done) { st.finalBurst = false; st.done(true); }
}

// ---------------- live stage ----------------
async function live(host, idolId, outfit, opts = {}) {
  if (!OK) return false;
  setWorld('stage'); attach(host); st.mode = 'loading';
  const idol = await ensure(idolId); placeIdol(idol, worlds.stage); st.idol = idol;
  if (JSON.stringify(outfit) !== st.outfitKey) { idol.wearOutfit(outfit); st.outfitKey = JSON.stringify(outfit); }
  st.live = { bpm: opts.bpm || 128, getTime: opts.getTime || (() => st.t) };
  st.dancers = [];
  const others = ['rinne', 'haruka', 'ria'].filter(x => x !== idolId);
  const mobileLite = Math.min(innerWidth, innerHeight) < 500 && Q.has('lite');
  if (!mobileLite) {
    const ds = await Promise.all(others.map(ensure));
    ds.forEach((d, i) => { placeIdol(d, worlds.stage); d.root.position.set(i ? 1.4 : -1.4, 0, -1.5); d.root.scale.setScalar(0.92); d.wearOutfit(backupOutfit(d.id, outfit)); d.setTint(0.27, 0.23, 0.44); d.setOrder(50 + i); d.center.scale.x = i ? 1 : -1; st.dancers.push(d); });
  }
  st.mode = 'live'; fit();
  return true;
}
const LIM = 1.13; // ~65 deg: the flat illustrated idol never goes edge-on
const SHOTS = [
  { d: 4, f: (u) => ({ az: 0, el: lerp(3.0, 2.0, u), r: lerp(12, 8.2, u), ty: 0.95 }) },            // crane in
  { d: 5, f: (u) => ({ az: lerp(-LIM, LIM, u), el: 1.25, r: 3.8, ty: 1.0 }) },                       // sweep
  { d: 3, f: (u) => ({ az: 0.25, el: 1.4, r: lerp(2.0, 2.6, u), ty: 1.3 }) },                         // bust dolly-out
  { d: 4, f: (u) => ({ az: lerp(0.9, -0.9, u), el: 3.6, r: lerp(7, 5.5, u), ty: 0.7 }) },            // high sweep
  { d: 3, f: (u) => ({ az: -0.35, el: 0.55, r: lerp(4.4, 3.4, u), ty: 1.0 }) },                       // low dolly-in
  { d: 4, f: (u) => ({ az: lerp(LIM * 0.95, -LIM * 0.95, u), el: 1.9, r: lerp(2.8, 6.0, u), ty: 1.0 }) }, // dolly-out sweep
];
const SHOT_TOTAL = SHOTS.reduce((a, s) => a + s.d, 0);
function updateLive(t, dt) {
  const L = st.live; const song = Math.max(0, L.getTime()); const bpm = L.bpm; const I = st.idol;
  const r0 = M.dance(I, song, bpm, 1, 0); st.lastHit = r0.hit; st.lastPose = r0.pose;
  st.dancers.forEach((d, i) => { M.dance(d, song, bpm, 1, i ? 0.5 : 1, M.BACKUP); });
  const b = song * bpm / 60; const fever = performance.now() < st.fx.appealUntil;
  for (const m of worlds.beams.children) { m.rotation.z = Math.sin(t * 0.8 + m.userData.i) * 0.5; m.material.opacity = (fever ? 0.16 : 0.08) + 0.1 * Math.max(0, Math.sin(b * Math.PI + m.userData.i)); }
  const { list, pen, penGlow } = worlds.pens; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  list.forEach((p, k) => { e.set(0, 0, p.side * (0.2 + 0.5 * Math.sin(b * Math.PI + p.ph * 0.2))); q.setFromEuler(e); m4.compose(v.set(p.x + p.side * 0.15, p.y, p.z), q, one); pen.setMatrixAt(k, m4); penGlow.setMatrixAt(k, m4); });
  pen.instanceMatrix.needsUpdate = true; penGlow.instanceMatrix.needsUpdate = true;
  if (Math.floor(b) !== Math.floor(b - dt * bpm / 60) && Math.floor(b) % 8 === 0 && song > 0) worlds.stageSpark.burst(new THREE.Vector3(0, 1.4, 0), 70, 1.6, [0.6, 1.2, 0.6]);
  worlds.stageSpark.update(dt);
  I.setGlow((fever ? 0.45 + 0.15 * Math.sin(t * 10) : 0.12) + 0.18 * (st.lastHit || 0));
  let c; const portrait = st.size.w < st.size.h;
  if (fever) { const u = 1 - (st.fx.appealUntil - performance.now()) / 2600; c = { az: lerp(-0.5, 0.5, u), el: 1.35, r: lerp(2.2, 3.0, u), ty: 1.2 }; }
  else { let tt = (Q.has('cam') ? +Q.get('cam') : song) % SHOT_TOTAL; c = SHOTS[0].f(0); for (const s of SHOTS) { if (tt < s.d) { c = s.f(ease(tt / s.d)); break; } tt -= s.d; } }
  const r = c.r * (portrait ? 1.3 : 1);
  camera.position.set(Math.sin(c.az) * r, c.el, Math.cos(c.az) * r); camera.lookAt(0, c.ty, 0);
  I.faceCamera(camera, 0.85); st.dancers.forEach(d => d.faceCamera(camera, 0.85));
  const hit = st.lastHit || 0; I.setFlash((fever ? 0.18 : 0) + 0.12 * hit);
}
function fx(kind) {
  if (!st.idol || st.mode !== 'live') return;
  if (kind === 'appeal') { st.fx.appealUntil = performance.now() + 2600; worlds.stageSpark.burst(new THREE.Vector3(0, 1.1, 0), 260, 2.4, [0.8, 1.6, 0.8]); }
  else if (kind === 'perfect') worlds.stageSpark.burst(new THREE.Vector3((Math.random() - .5) * 0.6, 0.8 + Math.random() * 0.8, 0.2), 10, 1.2, [0.3, 0.3, 0.3]);
  else if (kind === 'combo') worlds.stageSpark.burst(new THREE.Vector3(0, 1.2, 0), 60, 1.8, [0.6, 1.2, 0.6]);
}
function setSafe(top, bottom) { st.safe = { top: top || 0, bottom: bottom || 0 }; if (renderer) { applyOffset(); camera.updateProjectionMatrix(); } }
function stop() { st.mode = null; if (renderer) renderer.setAnimationLoop(null); st.running = false; if (renderer && renderer.domElement.parentNode) renderer.domElement.remove(); st.host = null; }
function freezeAt(t) { st.freeze = t; }

function loop() {
  let dt = Math.min(clock.getDelta(), 0.05);
  if (st.freeze != null) { // deterministic stepping for screenshots
    const target = st.freeze; st.freeze = null; st.t = 0; const step = 1 / 30;
    if (st.mode === 'run' && st.idol) { st.swaps = 0; st.idol.wearOutfit({}); }
    while (st.t < target) { st.t += step; tick(st.t, step); }
    render(); window.__frozen = true; return;
  }
  st.t += dt; tick(st.t, dt); render();
}
function tick(t, dt) {
  if (!st.idol) return;
  if (st.mode === 'show') updateShow(t, dt); else if (st.mode === 'run') updateRun(t, dt); else if (st.mode === 'live') updateLive(t, dt);
  const list = [st.idol, ...(st.mode === 'live' ? st.dancers : [])].filter(Boolean);
  for (const I of list) I.update(dt);
}
function render() { if (st.mode && st.mode !== 'loading') { camera.updateProjectionMatrix(); applyOffset(); renderer.render(scene, camera); } }

window.Stage3D = { get pose() { return st.lastPose; }, ok: OK, ensure, preview, runway, skip, live, fx, setSafe, stop, freezeAt, get mode() { return st.mode; }, RUN_LEN };
window.dispatchEvent(new Event('stage3d-ready'));
