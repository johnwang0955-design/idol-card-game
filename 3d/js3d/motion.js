// Procedural idol motion on VRM normalized humanoid bones
function B(idol, n) { return idol.nbone(n); }
function R(idol, n, x, y, z) { const b = B(idol, n); if (b) b.rotation.set(x, y, z); }
export function rest(idol) {
  R(idol, 'leftUpperArm', 0, 0, -1.15); R(idol, 'rightUpperArm', 0, 0, 1.15);
  R(idol, 'leftLowerArm', 0, -0.22, 0); R(idol, 'rightLowerArm', 0, 0.22, 0);
  R(idol, 'leftHand', 0, 0, -0.1); R(idol, 'rightHand', 0, 0, 0.1);
  for (const n of ['spine', 'chest', 'upperChest', 'neck', 'head', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg', 'leftFoot', 'rightFoot', 'leftToes', 'rightToes', 'leftShoulder', 'rightShoulder']) R(idol, n, 0, 0, 0);
  const h = B(idol, 'hips'); if (h.userData.y0 === undefined) h.userData.y0 = h.position.y; h.position.set(0, h.userData.y0, 0); h.rotation.set(0, 0, 0);
}
// elegant model stance: weight on one leg, hand on hip
export function stand(idol, t) {
  rest(idol); const s = Math.sin(t * 1.3);
  const h = B(idol, 'hips'); h.rotation.z = 0.06; h.rotation.y = 0.1; h.position.x = 0.02;
  R(idol, 'spine', 0, -0.05, -0.05); R(idol, 'chest', 0, -0.05, -0.03 + 0.01 * s); R(idol, 'head', -0.04, 0.12, 0.06);
  R(idol, 'rightUpperLeg', -0.12, 0.15, 0.05); R(idol, 'rightLowerLeg', 0.22, 0, 0); R(idol, 'leftUpperLeg', 0.02, 0, -0.06);
  R(idol, 'leftUpperArm', 0.05, 0.15, -1.18); R(idol, 'leftLowerArm', 0, -0.45, 0); R(idol, 'leftHand', 0, 0, 0.25);
  R(idol, 'rightUpperArm', 0.05, -0.1, 1.24 + 0.02 * s); R(idol, 'rightLowerArm', 0, 0.3, 0); R(idol, 'rightHand', 0, 0, -0.2);
}
export function walk(idol, t, speed = 1.9) { // runway catwalk
  rest(idol); const p = t * speed * Math.PI; const s = Math.sin(p), c = Math.cos(p);
  R(idol, 'leftUpperLeg', -0.42 * s, 0, 0.04); R(idol, 'rightUpperLeg', 0.42 * s, 0, -0.04);
  R(idol, 'leftLowerLeg', 0.5 * Math.max(0, c), 0, 0); R(idol, 'rightLowerLeg', 0.5 * Math.max(0, -c), 0, 0);
  R(idol, 'leftUpperArm', 0.3 * s, 0, -1.22); R(idol, 'rightUpperArm', -0.3 * s, 0, 1.22);
  const h = B(idol, 'hips'); h.position.y -= 0.018 * Math.abs(c); h.rotation.y = 0.14 * s; h.rotation.z = 0.05 * s; h.position.x = 0.012 * s;
  R(idol, 'chest', 0, -0.16 * s, -0.03 * s); R(idol, 'head', -0.03, 0.1 * s, 0);
}
export function spinPose(idol, t) {
  rest(idol);
  R(idol, 'leftUpperArm', 0.1, 0.25, -0.75 - 0.08 * Math.sin(t * 3)); R(idol, 'rightUpperArm', 0.1, -0.25, 0.75 + 0.08 * Math.sin(t * 3));
  R(idol, 'leftLowerArm', 0, -0.5, 0); R(idol, 'rightLowerArm', 0, 0.5, 0); R(idol, 'leftHand', 0, 0, 0.3); R(idol, 'rightHand', 0, 0, -0.3);
  R(idol, 'rightUpperLeg', -0.12, 0, 0); R(idol, 'rightLowerLeg', 0.3, 0, 0); R(idol, 'head', -0.12, 0, 0);
}
export function finalPose(idol, t) { // "coordinate complete" pose: one hand up, wink-ready
  rest(idol); const s = Math.sin(t * 2);
  R(idol, 'rightUpperArm', 0, 0, -0.55 + 0.04 * s); R(idol, 'rightLowerArm', 0, 0.9, 0); R(idol, 'rightHand', 0, 0, -0.3);
  R(idol, 'leftUpperArm', 0.05, 0.15, -1.15); R(idol, 'leftLowerArm', 0, -0.5, 0);
  const h = B(idol, 'hips'); h.rotation.z = -0.07; R(idol, 'leftUpperLeg', -0.1, -0.1, 0.05); R(idol, 'leftLowerLeg', 0.2, 0, 0); R(idol, 'head', -0.05, -0.1, -0.08);
}
export function dance(idol, t, bpm = 128, mirror = 1, phase = 0) {
  rest(idol); const b = (t * bpm / 60) + phase; const pb = b * Math.PI; const bar = Math.floor(b / 4) % 4;
  const h = B(idol, 'hips'); const bob = Math.abs(Math.sin(pb));
  h.position.y -= 0.035 * bob; h.rotation.y = mirror * 0.22 * Math.sin(pb / 2); h.rotation.z = mirror * 0.06 * Math.sin(pb);
  R(idol, 'spine', 0.04, 0, -mirror * 0.07 * Math.sin(pb)); R(idol, 'chest', 0, mirror * 0.14 * Math.sin(pb / 2), 0);
  R(idol, 'head', 0.04 * Math.sin(pb * 2), 0, mirror * 0.1 * Math.sin(pb / 2 + 1));
  const s = Math.sin(pb / 2);
  const L = (x, y, z) => R(idol, mirror > 0 ? 'leftUpperArm' : 'rightUpperArm', x, mirror * y, mirror * z);
  const Lf = (x, y, z) => R(idol, mirror > 0 ? 'leftLowerArm' : 'rightLowerArm', x, mirror * y, mirror * z);
  const Rr = (x, y, z) => R(idol, mirror > 0 ? 'rightUpperArm' : 'leftUpperArm', x, mirror * y, mirror * z);
  const Rf = (x, y, z) => R(idol, mirror > 0 ? 'rightLowerArm' : 'leftLowerArm', x, mirror * y, mirror * z);
  if (bar === 0 || bar === 2) { L(0, 0, -1.15 + 1.7 * Math.max(0, s)); Rr(0, 0, 1.15 - 1.7 * Math.max(0, -s)); Lf(0, -0.5 * Math.max(0, s) - 0.2, 0); Rf(0, 0.5 * Math.max(0, -s) + 0.2, 0); }
  else if (bar === 1) { L(-0.9, 0.2, -0.6 + 0.2 * s); Lf(0, -1.5, 0); Rr(0.2, 0, 0.35 + 0.4 * Math.abs(s)); Rf(0, 0.4, 0); }
  else { L(0, 0, 0.75 + 0.25 * Math.sin(pb)); Rr(0, 0, -0.75 + 0.25 * Math.sin(pb)); Lf(0, -0.35, 0); Rf(0, 0.35, 0); }
  const st = Math.sin(pb / 2);
  R(idol, 'leftUpperLeg', -0.22 * Math.max(0, st), 0, 0.1 * Math.max(0, st)); R(idol, 'leftLowerLeg', 0.45 * Math.max(0, st), 0, 0);
  R(idol, 'rightUpperLeg', -0.22 * Math.max(0, -st), 0, -0.1 * Math.max(0, -st)); R(idol, 'rightLowerLeg', 0.45 * Math.max(0, -st), 0, 0);
}
