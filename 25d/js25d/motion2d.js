// Dance poses for the illustrated SpriteIdol (angles in degrees, relative to the drawn walking pose).
// Sign: + = counter-clockwise on screen. Viewer-left arm raises outward with negative angles, viewer-right arm with positive.
export const POSES = {
  idle:   { },
  sway:   { chest: -3, head: 5, lUp: -3, lLo: -12, rUp: 14, rLo: 10 },
  cheer:  { chest: 3, head: -5, lUp: -6, lLo: -70, lHand: -20, rUp: 150, rLo: 14, rHand: 8 },
  point:  { chest: -4, head: 7, lUp: -4, lLo: 18, lHand: 10, rUp: 118, rLo: 2, rHand: -4 },
  wave:   { chest: 4, head: -6, lUp: -5, lLo: -30, lHand: -8, rUp: 75, rLo: 85, rHand: 12 },
  heart:  { chest: -2, head: 8, lUp: -4, lLo: -24, rUp: 26, rLo: 132, rHand: 24 },
  lean:   { chest: -6, head: 9, lUp: -8, lLo: -45, lHand: -15, rUp: 42, rLo: 32, rHand: 10 },
  final:  { chest: -3, head: 9, lUp: -6, lLo: 22, lHand: 12, rUp: 152, rLo: -14, rHand: -12 },
};
export const ORDER = ['sway', 'cheer', 'lean', 'point', 'wave', 'heart', 'sway', 'final'];
export const BACKUP = ['sway', 'lean', 'sway', 'cheer', 'sway', 'wave', 'lean', 'point'];
const R = Math.PI / 180;
const ease = (f) => { f = Math.min(1, Math.max(0, f)); return f * f * (3 - 2 * f); };
function mix(a, b, f) { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = ((a[k] || 0) * (1 - f) + (b[k] || 0) * f); return o; }
function toRad(p) { const o = {}; for (const k in p) o[k] = p[k] * R; return o; }
export function holdPose(I, name, t = 0, extra = {}) { const p = { ...POSES[name] }; for (const k in extra) p[k] = (p[k] || 0) + extra[k]; I.setPose(toRad(addLife(p, t))); }
function addLife(p, t, amt = 1) { // breathing + hair sway so a held pose is never frozen
  const q = { ...p }; q.chest = (q.chest || 0) + 0.8 * Math.sin(t * 2.1) * amt; q.head = (q.head || 0) + 1.2 * Math.sin(t * 1.7 + 1) * amt;
  q.hair = (q.hair || 0) + 1.6 * Math.sin(t * 2.3 + 0.5) * amt; return q; }
// beat-synced dance: every 2 beats move to the next key pose (fast ease ~0.45 beat), then hold with groove
export function dance(I, song, bpm = 128, mirror = 1, phase = 0, order = ORDER) {
  const b = song * bpm / 60 + phase; const step = Math.floor(b / 2), f = (b / 2) - step;
  const A = POSES[order[(step + order.length - 1) % order.length]], B = POSES[order[step % order.length]];
  const k = ease(f / 0.22);
  const p = mix(A, B, k);
  const beatF = b - Math.floor(b); const hit = Math.exp(-beatF * 6);       // accent on every beat
  p.chest = (p.chest || 0) + 3 * Math.sin(b * Math.PI) ; p.head = (p.head || 0) + 4 * Math.sin(b * Math.PI + 0.6);
  p.hair = (p.hair || 0) - 5 * Math.sin(b * Math.PI - 0.4);               // hair lags the body
  // groove with planted feet: knees bend on every beat (hips dip), hips sway side to side over 2 beats
  const dip = 0.5 + 0.5 * Math.cos(2 * Math.PI * (beatF - 0.04));
  p.hips = (p.hips || 0) + 1.6 * Math.sin(b * Math.PI / 2);
  I.setPose(toRad(p), { x: 4.5 * Math.sin(b * Math.PI / 2), y: 7 * dip });
  I.body.position.set(0, 0.006 * (1 - dip), 0);
  I.body.rotation.z = 0.01 * Math.sin(b * Math.PI / 2);
  I.body.scale.set(1 + 0.006 * hit, 1 - 0.008 * hit, 1);
  return { pose: order[step % order.length], k, hit };
}
export function stand(I, t) { holdPose(I, 'sway', t); I.body.position.set(0, 0.006 * Math.sin(t * 2), 0); I.body.rotation.z = 0; I.body.scale.set(1, 1, 1); }
export function walk(I, t) { // runway catwalk: the drawn walking pose + hip sway / step bob
  const s = Math.sin(t * 1.9 * Math.PI);
  I.setPose(toRad(addLife({ lUp: -6 * s, rUp: -6 * s, chest: 2 * s, head: -2 * s, hips: 1.5 * s }, t)));
  I.body.position.set(0.012 * s, 0.018 * Math.abs(Math.cos(t * 1.9 * Math.PI)), 0); I.body.rotation.z = 0.012 * s; I.body.scale.set(1, 1, 1);
}
export function spinPose(I, t) { holdPose(I, 'wave', t); }
export function finalPose(I, t) { holdPose(I, 'final', t); I.body.position.set(0, 0, 0); I.body.rotation.z = 0; }
