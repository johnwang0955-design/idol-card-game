// Shared three.js helpers for the 3D idol system
import * as THREE from 'three';
import { MToonMaterial } from '@pixiv/three-vrm';
export { THREE };

export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}
export const starTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,240,200,.8)'); r.addColorStop(1, 'rgba(255,200,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(32, 2); g.lineTo(32, 62); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
});
export const glowTex = canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,240,210,1)'); r.addColorStop(.4, 'rgba(255,190,240,.45)'); r.addColorStop(1, 'rgba(255,150,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
export const blobTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});

// MToon material (+ outline twin) for garments & props, matching the VRM's own look
export function toon(opts = {}) {
  const m = new MToonMaterial();
  const col = new THREE.Color(opts.color ?? '#ffffff');
  m.color = col.clone();
  m.shadeColorFactor = (opts.shade ? new THREE.Color(opts.shade) : col.clone().multiplyScalar(0.62));
  if (opts.map) { m.map = opts.map; m.shadeMultiplyTexture = opts.map; }
  m.shadingToonyFactor = opts.toony ?? 0.85;
  m.shadingShiftFactor = opts.shift ?? -0.05;
  m.giEqualizationFactor = 0.9;
  if (opts.rim) { m.parametricRimColorFactor = new THREE.Color(opts.rim); m.parametricRimFresnelPowerFactor = opts.rimPow ?? 3; m.parametricRimLiftFactor = 0.05; m.rimLightingMixFactor = 0.6; }
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.emissiveIntensity ?? 0.4; }
  if (opts.alphaTest) { m.alphaTest = opts.alphaTest; m.transparent = false; m.uniforms.alphaTest.value = opts.alphaTest; }
  if (opts.transparent) { m.transparent = true; m.depthWrite = false; m.opacity = opts.opacity ?? 0.6; }
  m.side = opts.side ?? THREE.DoubleSide;
  m.outlineWidthMode = 'worldCoordinates';
  m.outlineWidthFactor = opts.outline ?? 0.0012;
  m.outlineColorFactor = new THREE.Color(opts.outlineColor ?? col.clone().multiplyScalar(0.3));
  m.outlineLightingMixFactor = 1;
  m.needsUpdate = true;
  return m;
}
export function withOutline(mesh, mat, outline = true) {
  if (!outline || mat.transparent) { mesh.material = mat; return mesh; }
  const o = mat.clone(); o.isOutline = true; o.side = THREE.BackSide; o.alphaTest = mat.alphaTest; o.uniforms.alphaTest.value = mat.alphaTest;
  mesh.material = [mat, o];
  const g = mesh.geometry; const n = g.index ? g.index.count : g.attributes.position.count;
  g.clearGroups(); g.addGroup(0, n, 0); g.addGroup(0, n, 1);
  return mesh;
}

export class Sparkles {
  constructor(parent, n = 400, color = 0xffe9b0, size = 0.09) {
    this.n = n; this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({ map: starTex, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; parent.add(this.pts); this.i = 0;
    for (let k = 0; k < n; k++) this.pos[k * 3 + 1] = -999;
  }
  burst(c, count = 120, speed = 1.6, spread = [0.3, 0.8, 0.3]) {
    for (let k = 0; k < count; k++) {
      const j = this.i++ % this.n;
      this.pos[j * 3] = c.x + (Math.random() - .5) * spread[0];
      this.pos[j * 3 + 1] = c.y + (Math.random() - .5) * spread[1];
      this.pos[j * 3 + 2] = c.z + (Math.random() - .5) * spread[2];
      const a = Math.random() * Math.PI * 2, e = (Math.random() - .3) * 1.4;
      this.vel[j * 3] = Math.cos(a) * speed * Math.random(); this.vel[j * 3 + 1] = e * speed; this.vel[j * 3 + 2] = Math.sin(a) * speed * Math.random();
      this.life[j] = 1 + Math.random() * .6;
    }
  }
  update(dt) {
    for (let j = 0; j < this.n; j++) {
      if (this.life[j] <= 0) { this.pos[j * 3 + 1] = -999; continue; }
      this.life[j] -= dt;
      for (let a = 0; a < 3; a++) { this.pos[j * 3 + a] += this.vel[j * 3 + a] * dt; this.vel[j * 3 + a] *= 0.96; }
      this.vel[j * 3 + 1] += 0.15 * dt;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
  }
}
export const lerp = (a, b, f) => a + (b - a) * f;
export const ease = (f) => { f = Math.min(1, Math.max(0, f)); return f * f * (3 - 2 * f); };
